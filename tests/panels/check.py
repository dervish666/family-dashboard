#!/usr/bin/env python3
"""Checks the room panel letter contract against the files that ship.

It does not re-implement the contract and test the copy. It pulls the real
code out of the repo and runs it:

  * the Jinja templates in homeassistant/panels.example.yaml (the send
    script's recipient check and formatting, and the read automation's
    parsing), rendered the way Home Assistant renders script variables;
  * the C++ between the BEGIN/END markers in esphome/profiles/kid.yaml and
    esphome/packages/base.yaml, compiled with the host compiler.

and holds all of them to one table of expected results. It also checks that
the files agree with each other: kitchen presets, recipient helpers, example
children.

  python3 tests/panels/check.py              run the checks
  python3 tests/panels/check.py --sabotage   break each piece on purpose and
                                             prove the checks catch it

Needs PyYAML, Jinja2 and python-slugify (Home Assistant's slugify), and a
C++17 compiler on PATH as c++.
"""
from __future__ import annotations

import ast
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

import yaml
from jinja2.sandbox import ImmutableSandboxedEnvironment
from slugify import slugify as _slugify

ROOT = Path(__file__).resolve().parents[2]
HA_FILE = ROOT / "homeassistant" / "panels.example.yaml"
KID_FILE = ROOT / "esphome" / "profiles" / "kid.yaml"
BASE_FILE = ROOT / "esphome" / "packages" / "base.yaml"
KITCHEN_FILE = ROOT / "esphome" / "profiles" / "kitchen.yaml"
EXAMPLES = ROOT / "esphome" / "examples"


# ── Home Assistant's template behaviour, as far as these templates need it ──

def ha_slugify(text):
    """homeassistant.util.slugify: python-slugify with "_", "unknown" if empty."""
    if text == "" or text is None:
        return ""
    slug = _slugify(str(text), separator="_")
    return "unknown" if slug == "" else slug


def ha_env():
    env = ImmutableSandboxedEnvironment()
    env.filters["slugify"] = ha_slugify
    return env


def parse_result(rendered: str):
    """Home Assistant turns a rendered variable that looks like a literal into
    that type (a list stays a list); anything else stays the string."""
    try:
        value = ast.literal_eval(rendered)
    except (ValueError, SyntaxError, TypeError, MemoryError, RecursionError):
        return rendered
    if isinstance(value, (str, complex)):
        return rendered
    if isinstance(value, int) and (len(rendered) > 1 and rendered.startswith("0")):
        return rendered
    return value


def render_vars(env, variables: dict, context: dict) -> dict:
    """Render a variables block in order, each seeing the ones before it."""
    ctx = dict(context)
    for name, tpl in variables.items():
        if isinstance(tpl, str) and ("{{" in tpl or "{%" in tpl):
            ctx[name] = parse_result(env.from_string(tpl).render(**ctx))
        else:
            ctx[name] = tpl
    return ctx


class FakeStates:
    """Enough of Home Assistant's `states` for these templates: states(id)
    and states.<domain> as a list of objects with entity_id and state."""

    def __init__(self, values: dict):
        self.values = values

    def __call__(self, entity_id, *args, **kwargs):
        return self.values.get(entity_id, "unknown")

    def __getattr__(self, domain):
        return [SimpleNamespace(entity_id=e, state=v) for e, v in self.values.items()
                if e.startswith(domain + ".")]


def render_bool(env, tpl: str, ctx: dict) -> bool:
    out = parse_result(env.from_string(tpl).render(**ctx).strip())
    return out is True or str(out).lower() == "true"


# ── Loading the shipped sources ─────────────────────────────────────────────

class HALoader(yaml.SafeLoader):
    pass


def _tag(loader, suffix, node):
    # !include, !secret, !lambda, !extend...: keep the text, these checks never
    # follow them.
    return loader.construct_scalar(node) if isinstance(node, yaml.ScalarNode) else None


HALoader.add_multi_constructor("!", _tag)


def load_ha(text: str) -> dict:
    return yaml.load(text, Loader=HALoader)


def cpp_block(text: str, name: str) -> str:
    m = re.search(r"// BEGIN %s[^\n]*\n(.*?)// END %s" % (name, name), text, re.S)
    if not m:
        raise SystemExit(f"no BEGIN/END {name} block found")
    return m.group(1)


def esphome_subs(text: str) -> dict:
    data = yaml.load(text, Loader=HALoader)
    return data.get("substitutions", {})


# ── The contract ────────────────────────────────────────────────────────────
# (raw helper value) -> (kind, from, text). kind 1 none, 2 letter, 3 unavailable.

# The table lives in letters.json so the card's tests (tests/check.mjs) run the same one.
FIXTURES = json.loads((Path(__file__).resolve().parent / "letters.json").read_text(encoding="utf-8"))
LETTER_CASES = [(raw, (kind, frm, text)) for raw, kind, frm, text in FIXTURES["letters"]]
# (to, sender, text) -> what the script stores and what it copies to the postie. The card
# drops a postie value equal to the copy of a per-person letter it has, so the two must agree.
MIRROR_CASES = FIXTURES["mirrors"]

# What the send script must do. (to, sender, text) -> (ok, slug, stored value)
SEND_CASES = [
    ("kid_a", "Parent 1", "Tea's at six", (True, "kid_a", "Parent 1|Tea's at six")),
    ("Kid A", "Parent 1", "Tea's at six", (True, "kid_a", "Parent 1|Tea's at six")),
    ("  KID_B ", "", "Hello", (True, "kid_b", "|Hello")),
    ("kid_c", "Pa|rent", "x|y", (True, "kid_c", "Pa/rent|x|y")),
    ("kid_a", "Parent 1", "line one\nline two", (True, "kid_a", "Parent 1|line one line two")),
    ("kid_a", "A" * 40, "Hi", (True, "kid_a", "A" * 24 + "|Hi")),
    ("kid_a", "P", "x" * 300, (True, "kid_a", ("P|" + "x" * 300)[:255])),
    ("kid_d", "Parent 1", "Hi", (False, "kid_d", None)),
    ("", "Parent 1", "Hi", (False, "", None)),
    ("input_text.letter_kid_a", "Parent 1", "Hi", (False, "input_text_letter_kid_a", None)),
    ("kid_a; kid_b", "Parent 1", "Hi", (False, "kid_a_kid_b", None)),
    ("kid_a", "Parent 1", "   ", (False, "kid_a", None)),
]

ANNOUNCE_CASES = [
    ("", ""),
    ("Dinner's at six", "Dinner's at six"),
    ("45|Parent 2|Dinner's at six", "Parent 2: Dinner's at six"),
    ("20||Shoes on", "Shoes on"),
    ("20|Kitchen|", ""),
    ("Parent 2: Dinner's at six", "Parent 2: Dinner's at six"),
    ("a|b|c", "a|b|c"),
    ("unavailable", "Announcements unavailable"),
    ("unknown", ""),
]


# ── The checks ──────────────────────────────────────────────────────────────

class Report:
    def __init__(self):
        self.fails: list[str] = []
        self.passes = 0

    def check(self, ok: bool, what: str):
        if ok:
            self.passes += 1
        else:
            self.fails.append(what)


def check_send_script(r: Report, ha: dict):
    env = ha_env()
    script = ha["script"]["family_send_panel_letter"]
    seq = script["sequence"]
    reject_ifs = [s["if"] for s in seq if isinstance(s, dict) and "if" in s and any(
        isinstance(a, dict) and a.get("error") for a in s.get("then", []))]
    r.check(len(reject_ifs) >= 3, "send script: expected three refusing checks (recipient, helper, empty)")
    for to, sender, text, (ok, slug, value) in SEND_CASES:
        ctx = render_vars(env, script["variables"], {"to": to, "sender": sender, "text": text})
        # Every helper the package defines exists, and has never been set.
        ctx["states"] = FakeStates({f"input_text.{k}": "unknown" for k in ha["input_text"]})
        refused = any(render_bool(env, c, ctx) for c in reject_ifs)
        r.check(ctx["slug"] == slug, f"send {to!r}: slug {ctx['slug']!r}, want {slug!r}")
        r.check(refused == (not ok), f"send {to!r}/{text!r}: refused={refused}, want {not ok}")
        if ok:
            r.check(ctx["value"] == value, f"send {to!r}: stored {ctx['value']!r}, want {value!r}")
            r.check(len(str(ctx["value"])) <= 255, f"send {to!r}: stored value over 255 characters")
    # A recipient on the list whose helper was never created is refused too.
    ctx = render_vars(env, script["variables"], {"to": "kid_a", "sender": "P", "text": "Hi"})
    ctx["states"] = FakeStates({})
    r.check(any(render_bool(env, c, ctx) for c in reject_ifs), "send to kid_a with no helper: not refused")


def jinja_parse(env, auto_vars: dict, value: str, slug: str, recipients: dict):
    """Run the read automation's own parsing over a helper value."""
    step = None
    for a in auto_vars["actions"]:
        if isinstance(a, dict) and "variables" in a:
            step = a["variables"]
    ctx = {"slug": slug, "recipients": recipients, "states": lambda e: value}
    return render_vars(env, step, ctx)


def check_parsers(r: Report, ha: dict, kid_src: str, base_src: str, cxx: str | None):
    env = ha_env()
    autos = {a["id"]: a for a in ha["automation"]}
    read = autos["family_panel_letter_read"]
    recipients = ha["script"]["family_send_panel_letter"]["variables"]["recipients"]

    # Home Assistant side: the automation's split must agree with the table.
    for raw, (kind, frm, text) in LETTER_CASES:
        if kind == 3:
            continue  # HA never parses its own unavailable state as a letter
        ctx = jinja_parse(env, read, raw, "kid_a", recipients)
        r.check(str(ctx["from_part"]) == frm and str(ctx["body"]) == text,
                f"HA parse {raw!r}: got ({ctx['from_part']!r}, {ctx['body']!r}), want ({frm!r}, {text!r})")

    # The postie copy: what the script writes must be exactly what the read
    # automations recompute, or a read on one side never clears the other.
    script = ha["script"]["family_send_panel_letter"]
    on_card = autos["family_panel_letter_read_on_card"]["actions"][0]["repeat"]["sequence"][0]["variables"]
    for to, sender, text, (ok, slug, _) in SEND_CASES:
        if not ok:
            continue
        sent = render_vars(env, script["variables"], {"to": to, "sender": sender, "text": text})
        back = jinja_parse(env, read, sent["value"], slug, recipients)
        r.check(back["mirror"] == sent["postie_value"],
                f"postie copy for {to!r}: read automation expects {back['mirror']!r}, script wrote {sent['postie_value']!r}")
        ctx2 = render_vars(env, on_card, {"repeat": {"item": slug}, "recipients": recipients,
                                          "states": lambda e, v=sent["value"]: v})
        r.check(ctx2["mirror"] == sent["postie_value"],
                f"postie copy for {to!r}: card-read automation expects {ctx2['mirror']!r}")

    # Panel side: compile the shipped C++ and run the same table through it.
    if cxx is None:
        r.check(False, "no C++ compiler (c++) on PATH: the panel parser was not checked")
        return
    letter = cpp_block(kid_src, "letter-parse")
    announce = cpp_block(base_src, "announcement-parse")
    cases_l = "".join("    {%s},\n" % json.dumps(c[0], ensure_ascii=False) for c in LETTER_CASES)
    cases_a = "".join("    {%s},\n" % json.dumps(c[0], ensure_ascii=False) for c in ANNOUNCE_CASES)
    src = f"""
#include <cstdio>
#include <string>
#include <vector>
static void letter(const std::string &x, int &kind, std::string &from, std::string &text) {{
  kind = 1;
{letter}
}}
static void announce(const std::string &x, std::string &shown) {{
{announce}
}}
int main() {{
  std::vector<std::string> L = {{
{cases_l}  }};
  std::vector<std::string> A = {{
{cases_a}  }};
  for (auto &x : L) {{ int k; std::string f, t; letter(x, k, f, t);
    printf("%d\\x1f%s\\x1f%s\\x1e", k, f.c_str(), t.c_str()); }}
  printf("\\x1d");
  for (auto &x : A) {{ std::string s; announce(x, s); printf("%s\\x1e", s.c_str()); }}
  return 0;
}}
"""
    with tempfile.TemporaryDirectory() as d:
        cpp, exe = os.path.join(d, "t.cpp"), os.path.join(d, "t")
        Path(cpp).write_text(src, encoding="utf-8")
        cc = subprocess.run([cxx, "-std=c++17", "-Wall", "-o", exe, cpp], capture_output=True, text=True)
        if cc.returncode:
            r.check(False, "panel C++ did not compile:\n" + cc.stderr[-2000:])
            return
        out = subprocess.run([exe], capture_output=True).stdout.decode("utf-8")
    lpart, apart = out.split("\x1d")
    got_l = [row.split("\x1f") for row in lpart.split("\x1e")[:-1]]
    for (raw, (kind, frm, text)), (k, f, t) in zip(LETTER_CASES, got_l):
        want = (kind, frm if kind != 3 else "", text if kind != 3 else "")
        r.check((int(k), f, t) == want, f"panel parse {raw!r}: got ({k}, {f!r}, {t!r}), want {want}")
    got_a = apart.split("\x1e")[:-1]
    for (raw, want), got in zip(ANNOUNCE_CASES, got_a):
        r.check(got == want, f"panel announcement {raw!r}: got {got!r}, want {want!r}")


def check_mirrors(r: Report, ha: dict):
    env = ha_env()
    script = ha["script"]["family_send_panel_letter"]
    r.check(len(MIRROR_CASES) >= 5, "letters.json: expected at least five postie copies")
    for to, sender, text, stored, postie in MIRROR_CASES:
        ctx = render_vars(env, script["variables"], {"to": to, "sender": sender, "text": text})
        r.check(ctx["value"] == stored, f"letters.json {to!r}/{sender!r}: script stores {ctx['value']!r}, fixture says {stored!r}")
        r.check(ctx["postie_value"] == postie, f"letters.json {to!r}/{sender!r}: script copies {ctx['postie_value']!r}, fixture says {postie!r}")

def check_consistency(r: Report, ha: dict, kitchen_src: str):
    script_vars = ha["script"]["family_send_panel_letter"]["variables"]
    recipients = script_vars["recipients"]
    for slug in recipients:
        r.check(f"letter_{slug}" in ha.get("input_text", {}), f"recipient {slug}: no input_text.letter_{slug}")
        r.check(f"letter_{slug}_sent" in ha.get("input_datetime", {}),
                f"recipient {slug}: no input_datetime.letter_{slug}_sent")
        r.check(ha["input_text"].get(f"letter_{slug}", {}).get("max") == 255, f"letter_{slug}: max must be 255")
        r.check("initial" not in ha["input_text"].get(f"letter_{slug}", {}),
                f"letter_{slug}: an initial value would wipe unread letters on restart")
    for a in ha["automation"]:
        if "recipients" in a.get("variables", {}):
            r.check(a["variables"]["recipients"] == recipients, f"{a['id']}: recipients differ from the script's")
    autos = {a["id"]: a for a in ha["automation"]}
    presets = autos["family_panel_broadcast"]["variables"]["broadcast_presets"]
    subs = esphome_subs(kitchen_src)
    panel = [subs[f"preset_{i}"] for i in range(1, 5)]
    r.check(panel == presets, f"kitchen presets {panel} differ from broadcast_presets {presets}")
    for p in panel:
        r.check('"' not in p and "\\" not in p, f"preset {p!r}: no double quotes or backslashes (it lands in C++)")
    # Home Assistant names a YAML template sensor from its name, not its
    # unique_id, so the panel must ask for the slug of the name.
    made = {"sensor." + ha_slugify(s["name"]) for block in ha.get("template", []) for s in block.get("sensor", [])}
    for key in ("today_entity", "lunch_entity", "due_entity"):
        r.check(subs[key] in made, f"kitchen {key} {subs[key]} is not a sensor panels.example.yaml makes ({sorted(made)})")
    events = {a["triggers"][0].get("event_type") for a in ha["automation"]}
    kid_events = set(re.findall(r"event: (esphome\.[a-z_]+)", KID_FILE.read_text()))
    kitchen_events = set(re.findall(r"event: (esphome\.[a-z_]+)", kitchen_src))
    for e in kid_events | kitchen_events:
        r.check(e in events, f"panel fires {e} but no automation listens for it")
    for f in sorted(EXAMPLES.glob("*.yaml")):
        if f.name == "secrets.yaml":
            continue
        child = esphome_subs(f.read_text()).get("child")
        if child is not None:
            r.check(child in recipients, f"{f.name}: child {child!r} is not a recipient in panels.example.yaml")


def run(ha_text: str, kid_src: str, base_src: str, kitchen_src: str, quiet=False) -> Report:
    r = Report()
    ha = load_ha(ha_text)
    cxx = shutil.which("c++")
    check_send_script(r, ha)
    check_parsers(r, ha, kid_src, base_src, cxx)
    check_mirrors(r, ha)
    check_consistency(r, ha, kitchen_src)
    if not quiet:
        for f in r.fails:
            print("FAIL", f)
    return r


def sources():
    return (HA_FILE.read_text(encoding="utf-8"), KID_FILE.read_text(encoding="utf-8"),
            BASE_FILE.read_text(encoding="utf-8"), KITCHEN_FILE.read_text(encoding="utf-8"))


# Each sabotage breaks one shipped piece the way a plausible edit would.
SABOTAGES = [
    ("panel splits on the last '|'", 1, "s.find('|')", "s.rfind('|')"),
    ("panel forgets to trim the text", 1, "text = trim(s.substr(p + 1));", "text = s.substr(p + 1);"),
    ("panel treats 'unavailable' as a letter", 1, 'if (s == "unavailable") {\n              kind = 3;',
     'if (false) {\n              kind = 3;'),
    ("panel reads a never-set helper as a letter", 1, 'if (s == "unknown") s = "";', ""),
    ("script checks the helper's state, not that it exists", 0,
     "helper not in states.input_text | map(attribute='entity_id') | list", "states(helper) in ['unknown', 'unavailable']"),
    ("announcement drops the sender", 2, 'from.empty() ? text : from + ": " + text', "text"),
    ("script stops slugifying the recipient", 0, "string | trim | slugify }}", "string | trim }}"),
    ("script keeps '|' in the sender", 0, "| replace('|', '/') ", ""),
    ("script lets a long sender through", 0, "| trim)[:24] | trim }}", "| trim) }}"),
    ("postie copy drifts from the read check", 0, "~ ('From ' ~ from_part ~ ': ' if from_part else '') ~ body)[:255] }}\n    sequence",
     "~ ('from ' ~ from_part ~ ': ' if from_part else '') ~ body)[:255] }}\n    sequence"),
    ("read automation splits on every '|'", 0, "current.split('|', 1)", "current.split('|')"),
    ("kitchen reads a sensor that is never made", 3, "sensor.panel_lunch_and_kit", "sensor.panel_lunch_kit"),
    ("kitchen preset no longer matches", 3, 'preset_2: "Shoes on, we\'re leaving"', 'preset_2: "Shoes on"'),
    ("helper wiped on restart", 0, "  letter_kid_b:\n    name: Letter for Kid B\n", "  letter_kid_b:\n    initial: ''\n    name: Letter for Kid B\n"),
]


def sabotage() -> int:
    base = list(sources())
    clean = run(*base, quiet=True)
    if clean.fails:
        print("The clean tree already fails; fix that first:")
        for f in clean.fails:
            print("  ", f)
        return 1
    bad = 0
    for name, idx, old, new in SABOTAGES:
        srcs = list(base)
        if old not in srcs[idx]:
            print(f"SABOTAGE SETUP BROKEN  {name}: the text to break is not in the file any more")
            bad += 1
            continue
        srcs[idx] = srcs[idx].replace(old, new, 1)
        try:
            r = run(*srcs, quiet=True)
            caught = bool(r.fails)
            detail = r.fails[0].splitlines()[0] if r.fails else ""
        except Exception as e:  # a sabotage that makes the file unreadable is caught too
            caught, detail = True, f"{type(e).__name__}: {e}"
        print(("caught   " if caught else "MISSED   ") + name + (f"  ({detail[:90]})" if caught else ""))
        bad += 0 if caught else 1
    print(f"{len(SABOTAGES) - bad}/{len(SABOTAGES)} sabotages caught")
    return 1 if bad else 0


def main() -> int:
    if "--sabotage" in sys.argv:
        return sabotage()
    r = run(*sources())
    print(f"{r.passes} passed, {len(r.fails)} failed")
    return 1 if r.fails else 0


if __name__ == "__main__":
    sys.exit(main())
