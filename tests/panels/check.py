#!/usr/bin/env python3
"""Checks the room panel contracts against the files that ship.

It does not re-implement a contract and test the copy. It pulls the real
code out of the repo and runs it:

  * the Jinja in homeassistant/panels.example.yaml (the send script's
    recipient check and formatting, the read automation's parsing) and in
    homeassistant/panels-kitchen.example.yaml (the light allowlist, the timer
    alert's wording), rendered the way Home Assistant renders variables;
  * the night glow's real PWM duty on every board and example: the level
    raised to the backlight light's gamma_correct (ESPHome's default 2.8
    when a board leaves it out), held above a floor;
  * the C++ between the BEGIN/END markers in the ESPHome files (the letter
    and announcement parsers, the clock format, the night window, the
    kitchen's card lines, the timer phases and their display, the light tile
    state), compiled with the host compiler.

and holds all of them to tables of expected results. It also checks that
the files agree with each other: presets, recipients, light targets, timer
names, the events a panel fires, the sensors a panel reads, the examples.

  python3 tests/panels/check.py              run the checks
  python3 tests/panels/check.py --sabotage   break each piece on purpose and
                                             prove the checks catch it

Needs PyYAML, Jinja2 and python-slugify (Home Assistant's slugify), and a
C++17 compiler on PATH as c++.
"""
from __future__ import annotations

import ast
import enum
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
EXAMPLES = ROOT / "esphome" / "examples"
FILES = {
    "ha": ROOT / "homeassistant" / "panels.example.yaml",
    "kid": ROOT / "esphome" / "profiles" / "kid.yaml",
    "base": ROOT / "esphome" / "packages" / "base.yaml",
    "kitchen": ROOT / "esphome" / "profiles" / "kitchen.yaml",
    "hak": ROOT / "homeassistant" / "panels-kitchen.example.yaml",
    "timers": ROOT / "esphome" / "packages" / "timers.yaml",
    "tiles": ROOT / "esphome" / "packages" / "light_tiles.yaml",
    "hold": ROOT / "esphome" / "packages" / "light_hold.yaml",
    "lamps": ROOT / "esphome" / "packages" / "lamp_pills.yaml",
    "garden": ROOT / "esphome" / "packages" / "garden.yaml",
    "ex_kitchen": EXAMPLES / "kitchen.yaml",
    "ex_kitchen_local": EXAMPLES / "kitchen.local.yaml",
    "ex_kid_a": EXAMPLES / "kid-a.yaml",
    "ex_kid_a_local": EXAMPLES / "kid-a.local.yaml",
    "board_cyd": ROOT / "esphome" / "boards" / "esp32_2432s028.yaml",
    "board_jc2432": ROOT / "esphome" / "boards" / "jc2432w328.yaml",
    "board_guition": ROOT / "esphome" / "boards" / "guition_jc3248w535.yaml",
}
BOARDS = {"esp32_2432s028.yaml": "board_cyd", "jc2432w328.yaml": "board_jc2432",
          "guition_jc3248w535.yaml": "board_guition"}


# ── Home Assistant's template behaviour, as far as these templates need it ──

def ha_slugify(text):
    """homeassistant.util.slugify: python-slugify with "_", "unknown" if empty."""
    if text == "" or text is None:
        return ""
    slug = _slugify(str(text), separator="_")
    return "unknown" if slug == "" else slug


def ha_env(states=None):
    env = ImmutableSandboxedEnvironment()
    env.filters["slugify"] = ha_slugify
    vals = states or {}
    env.tests["is_state"] = lambda eid, want: vals.get(eid, "unknown") == want
    env.tests["match"] = lambda value, pattern: re.match(pattern, str(value)) is not None
    env.filters["to_json"] = lambda value, **kw: json.dumps(value, ensure_ascii=False)
    return env


class ColorMode(str, enum.Enum):
    """How Home Assistant before 2026.10 hands a template a light's
    supported_color_modes: enum members, which a list renders by repr, as
    "[<ColorMode.ONOFF: 'onoff'>]"."""
    ONOFF = "onoff"
    BRIGHTNESS = "brightness"
    COLOR_TEMP = "color_temp"
    HS = "hs"


def ha_attrs(attrs: dict):
    """Home Assistant's state_attr over a {entity_id: {attribute: value}} table."""
    return lambda eid, name: (attrs.get(eid) or {}).get(name)


def parse_result(rendered: str):
    """Home Assistant strips a rendered variable, then turns one that looks
    like a literal into that type (a list stays a list); anything else stays
    the string."""
    rendered = rendered.strip()
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
    out = parse_result(env.from_string(tpl).render(**ctx))
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


# ── The contract tables ─────────────────────────────────────────────────────
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

# (hour, minute, twelve) -> (clock, suffix)
CLOCK_CASES = [
    (0, 5, True, "12:05", "am"),
    (7, 5, True, "7:05", "am"),
    (11, 59, True, "11:59", "am"),
    (12, 0, True, "12:00", "pm"),
    (13, 7, True, "1:07", "pm"),
    (23, 59, True, "11:59", "pm"),
    (0, 0, False, "00:00", ""),
    (7, 5, False, "07:05", ""),
    (23, 59, False, "23:59", ""),
]

# (now, start, end, keep awake) -> night
NIGHT_CASES = [
    ("21:00", "21:00", "07:00", False, True),
    ("20:59", "21:00", "07:00", False, False),
    ("00:00", "21:00", "07:00", False, True),
    ("06:59", "21:00", "07:00", False, True),
    ("07:00", "21:00", "07:00", False, False),
    ("02:00", "21:00", "07:00", True, False),
    ("12:00", "21:00", "07:00", True, False),
    ("12:00", "22:00", "22:00", False, False),
    ("13:00", "12:00", "14:00", False, True),
    ("14:00", "12:00", "14:00", False, False),
]

LONG = "\n".join(f"Line {i}" for i in range(1, 15))
# (sensor state, lines attribute, what, max_lines) -> shown. None for a state or
# attribute is "not heard yet"; a shown of None means the card keeps waiting.
LINES_CASES = [
    ("3", "", "Calendar", 12, "Calendar unavailable"),
    ("3", "None", "Calendar", 12, "Calendar unavailable"),
    ("3", "unavailable", "Due times", 12, "Due times unavailable"),
    ("unknown", "unknown", "Rain", 2, "Rain unavailable"),
    ("3", "Nothing on today", "Calendar", 12, "Nothing on today"),
    ("3", "  09:00 Swim (Kid A) \n\n All day Bin day  \n", "Calendar", 12, "09:00 Swim (Kid A)\nAll day Bin day"),
    ("3", LONG, "Calendar", 12, "\n".join(f"Line {i}" for i in range(1, 12)) + "\n+3 more"),
    ("3", "\n".join(f"Line {i}" for i in range(1, 13)), "Calendar", 12, "\n".join(f"Line {i}" for i in range(1, 13))),
    ("Raining", "Raining\nsecond\nthird", "Rain", 2, "Raining\n+2 more"),
    ("1", "Calendar unavailable (sensor.family_today)", "Calendar", 12, "Calendar unavailable (sensor.family_today)"),
    ("ok", "Kid A: £2 dinner, crème brûlée", "Lunch and kit", 12, "Kid A: £2 dinner, crème brûlée"),
    # The sensor went unavailable: its old lines must not stay up.
    ("unavailable", "09:00 Swim (Kid A)", "Calendar", 12, "Calendar unavailable"),
    ("unknown", "09:00 Swim (Kid A)", "The strip", 12, "The strip unavailable"),
    ("unavailable", None, "Due times", 12, "Due times unavailable"),
    # Nothing heard yet: keep waiting rather than guess.
    ("3", None, "Calendar", 12, None),
    (None, None, "Calendar", 12, None),
    (None, "Bins today: Food", "The strip", 12, "Bins today: Food"),
]

H6 = 6 * 3600
# (now, end, ring) -> (phase, left). 0 stopped, 1 running, 2 ringing, 3 done quietly, 4 forget.
TIMER_STEP_CASES = [
    (1000, 0, 120, 0, 0),
    (0, 5000, 120, 1, 0),
    (1000, 1600, 120, 1, 600),
    (1599, 1600, 120, 1, 1),
    (1600, 1600, 120, 2, 0),
    (1719, 1600, 120, 2, 0),
    (1720, 1600, 120, 3, 0),
    (1600 + H6 - 1, 1600, 120, 3, 0),
    (1600 + H6, 1600, 120, 4, 0),
]

# secs -> (full, brief)
TIMER_FMT_CASES = [
    (0, "0:00", "0 min"),
    (1, "0:01", "1 min"),
    (59, "0:59", "1 min"),
    (60, "1:00", "1 min"),
    (61, "1:01", "2 min"),
    (600, "10:00", "10 min"),
    (3540, "59:00", "59 min"),
    (3541, "59:01", "1h 00"),
    (3600, "1:00:00", "1h 00"),
    (3661, "1:01:01", "1h 02"),
    (36000, "10:00:00", "10h 00"),
]

TILE_CASES = [("on", 1), ("off", 0), ("unavailable", -1), ("unknown", -1), ("", -1), ("On", -1), ("idle", -1)]

# (target, action, lights on) -> (refused, turn, entities)
LIGHT_CASES = [
    ("kitchen", "toggle", [], (False, "on", ["light.kitchen"])),
    ("kitchen", "toggle", ["light.kitchen"], (False, "off", ["light.kitchen"])),
    ("kitchen", "off", [], (False, "off", ["light.kitchen"])),
    ("kitchen", " TOGGLE ", [], (False, "on", ["light.kitchen"])),
    ("downstairs", "toggle", ["light.kitchen"], (False, "off", ["light.kitchen", "light.living_room"])),
    ("downstairs", "toggle", [], (False, "on", ["light.kitchen", "light.living_room"])),
    ("light.kitchen", "toggle", [], (True, None, [])),
    ("Kitchen", "toggle", [], (True, None, [])),
    ("kitchen, hall", "off", [], (True, None, [])),
    ("", "toggle", [], (True, None, [])),
    ("kitchen", "turn_on", [], (True, None, None)),
    ("kitchen", "", [], (True, None, None)),
    ("kitchen", "on", ["light.kitchen"], (False, "on", ["light.kitchen"])),
    ("hall", "off", ["light.hall"], (False, "off", ["light.hall"])),
]

# The lamps a light page may adjust, as Home Assistant describes them.
LAMPS = {
    # A warm-white lamp carries an hs_color Home Assistant works out from its
    # kelvin; the line must not pass that off as a colour.
    "light.kitchen": ("on", {"supported_color_modes": ["color_temp"], "color_mode": "color_temp", "brightness": 184,
                             "color_temp_kelvin": 2700, "min_color_temp_kelvin": 2000, "max_color_temp_kelvin": 6535,
                             "hs_color": [27.0, 35.0]}),
    "light.living_room": ("on", {"supported_color_modes": ["color_temp", "hs"], "color_mode": "hs", "brightness": 255,
                                 "color_temp_kelvin": None, "min_color_temp_kelvin": 2000,
                                 "max_color_temp_kelvin": 6535, "hs_color": [210.0, 80.0]}),
    # Off, with a stale brightness attribute: the line must not repeat it.
    "light.hall": ("off", {"supported_color_modes": ["brightness"], "brightness": 51}),
    "light.landing": ("unavailable", {}),
    "light.kid_a_globe": ("on", {"supported_color_modes": ["brightness"], "brightness": 102}),
    "light.kid_a_main": ("on", {"supported_color_modes": ["onoff"]}),
}
LAMP_STATES = {e: st for e, (st, _) in LAMPS.items()}
LAMP_ATTRS = {e: a for e, (_, a) in LAMPS.items()}
# The same lamps as Home Assistant before 2026.10 describes them.
OLD_LAMP_ATTRS = {e: dict(a, supported_color_modes=[ColorMode(m) for m in a["supported_color_modes"]])
                  if "supported_color_modes" in a else a for e, a in LAMP_ATTRS.items()}

# What sensor.panel_lights must say for those lamps, line by line.
LINES_WANT = [
    "kitchen on 72 2700 2000 6535 bt - -",
    "living_room on 100 - 2000 6535 btc 210 80",
    "hall off - - - - b - -",
    "landing unavailable - - - - - - -",
    "kid_a_globe on 40 - - - b - -",
    "kid_a_main on - - - - - - -",
]

# (target, brightness_pct, kelvin, hue, sat) -> (refused, light, data for light.turn_on)
SET_CASES = [
    ("kitchen", "72", "", "", "", (False, "light.kitchen", {"brightness_pct": 72})),
    ("kitchen", "150", "", "", "", (False, "light.kitchen", {"brightness_pct": 100})),
    ("kitchen", "0", "", "", "", (False, "light.kitchen", {"brightness_pct": 1})),
    ("kitchen", "", "1500", "", "", (False, "light.kitchen", {"color_temp_kelvin": 2000})),
    ("kitchen", "", "9000", "", "", (False, "light.kitchen", {"color_temp_kelvin": 6535})),
    ("kitchen", "50", "3000", "", "", (False, "light.kitchen", {"brightness_pct": 50, "color_temp_kelvin": 3000})),
    ("kitchen", "", "", "120", "50", (True, "light.kitchen", {})),          # no colour on this lamp
    ("living_room", "", "", "400", "150", (False, "light.living_room", {"hs_color": [360, 100]})),
    ("living_room", "", "", "120", "", (True, "light.living_room", {})),     # hue without sat
    ("living_room", "", "2500", "120", "50", (False, "light.living_room", {"color_temp_kelvin": 2500, "hs_color": [120, 50]})),
    ("hall", "", "3000", "", "", (True, "light.hall", {})),                  # brightness only
    ("hall", "25", "", "", "", (False, "light.hall", {"brightness_pct": 25})),
    ("kid_a_main", "25", "", "", "", (True, "light.kid_a_main", {})),         # on/off only
    ("kitchen", "abc", "", "", "", (True, "light.kitchen", {})),
    ("kitchen", "-5", "", "", "", (True, "light.kitchen", {})),
    ("light.kitchen", "50", "", "", "", (True, "", None)),
    ("attic", "50", "", "", "", (True, "", None)),
    ("", "50", "", "", "", (True, "", None)),
]

SUMMARY = "\n".join(LINES_WANT) + "\n"
# (summary, target) -> (on, bri, kelvin, kmin, kmax, caps, hue, sat)
PARSE_CASES = [
    (SUMMARY, "kitchen", (1, 72, 2700, 2000, 6535, "bt", -1, -1)),
    (SUMMARY, "living_room", (1, 100, -1, 2000, 6535, "btc", 210, 80)),
    (SUMMARY, "hall", (0, -1, -1, -1, -1, "b", -1, -1)),
    (SUMMARY, "landing", (-1, -1, -1, -1, -1, "", -1, -1)),
    (SUMMARY, "kid_a_main", (1, -1, -1, -1, -1, "", -1, -1)),
    (SUMMARY, "attic", (-1, -1, -1, -1, -1, "", -1, -1)),
    (SUMMARY, "", (-1, -1, -1, -1, -1, "", -1, -1)),
    ("", "kitchen", (-1, -1, -1, -1, -1, "", -1, -1)),
    ("unavailable", "kitchen", (-1, -1, -1, -1, -1, "", -1, -1)),
    ("kitchen on", "kitchen", (1, -1, -1, -1, -1, "", -1, -1)),
    ("kitchen off 50 2700 2000 6535 bt - -", "kitchen", (0, 50, 2700, 2000, 6535, "bt", -1, -1)),
    ("kitchen on 250 1000 2000 6535 bt 400 101", "kitchen", (1, 100, 2000, 2000, 6535, "bt", 360, 100)),
    ("kitchen on 50 - 6535 2000 bt - -", "kitchen", (1, 50, -1, -1, -1, "b", -1, -1)),
    ("kitchen on 50 - - - xtb - -", "kitchen", (1, 50, -1, -1, -1, "b", -1, -1)),
    ("kitchen on 50 - 2000 6535 tc 30 100", "kitchen", (1, 50, -1, 2000, 6535, "tc", 30, 100)),
    ("  kitchen   on  50 - - - b - -  ", "kitchen", (1, 50, -1, -1, -1, "b", -1, -1)),
    ("kitchenette on 50 - - - b - -\nkitchen off - - - - b - -", "kitchen", (0, -1, -1, -1, -1, "b", -1, -1)),
    ("kitchen 12 50 - - - b - -", "kitchen", (-1, 50, -1, -1, -1, "b", -1, -1)),
]

# hue -> the light page's words for it
HUE_CASES = [
    (0, "Red 0\u00b0"),
    (14, "Red 14\u00b0"),
    (15, "Orange 15\u00b0"),
    (30, "Orange 30\u00b0"),
    (60, "Yellow 60\u00b0"),
    (120, "Green 120\u00b0"),
    (210, "Sky 210\u00b0"),
    (240, "Blue 240\u00b0"),
    (300, "Magenta 300\u00b0"),
    (344, "Pink 344\u00b0"),
    (345, "Red 345\u00b0"),
    (359, "Red 359\u00b0"),
    (360, "Red 0\u00b0"),
    (-1, "\u2013"),
]

# timer name the panel sent -> what the house hears
TIMER_MSG_CASES = [
    ("Oven", "Oven timer is done"),
    ("  Hob ", "Hob timer is done"),
    ("Timer 2", "Timer 2 is done"),
    ("Timer", "Timer is done"),
    ("oven", "A kitchen timer is done"),
    ("Open the garage door", "A kitchen timer is done"),
    ("", "A kitchen timer is done"),
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
    out = run_cpp(r, cxx, src, "panel letter C++")
    if out is None:
        return
    lpart, apart = out.split("\x1d")
    got_l = [row.split("\x1f") for row in lpart.split("\x1e")[:-1]]
    for (raw, (kind, frm, text)), (k, f, t) in zip(LETTER_CASES, got_l):
        want = (kind, frm if kind != 3 else "", text if kind != 3 else "")
        r.check((int(k), f, t) == want, f"panel parse {raw!r}: got ({k}, {f!r}, {t!r}), want {want}")
    got_a = apart.split("\x1e")[:-1]
    for (raw, want), got in zip(ANNOUNCE_CASES, got_a):
        r.check(got == want, f"panel announcement {raw!r}: got {got!r}, want {want!r}")


def run_cpp(r: Report, cxx: str, src: str, what: str):
    with tempfile.TemporaryDirectory() as d:
        cpp, exe = os.path.join(d, "t.cpp"), os.path.join(d, "t")
        Path(cpp).write_text(src, encoding="utf-8")
        cc = subprocess.run([cxx, "-std=c++17", "-Wall", "-o", exe, cpp], capture_output=True, text=True)
        if cc.returncode:
            r.check(False, f"{what} did not compile:\n" + cc.stderr[-2000:])
            return None
        return subprocess.run([exe], capture_output=True).stdout.decode("utf-8")


def cstr(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def check_panel_v2(r: Report, srcs: dict, cxx: str | None):
    """The v2 blocks: clock, night, card lines, timers, tiles."""
    if cxx is None:
        r.check(False, "no C++ compiler (c++) on PATH: the v2 panel blocks were not checked")
        return
    clock = cpp_block(srcs["base"], "clock-format")
    night = cpp_block(srcs["base"], "night-window")
    lines = cpp_block(srcs["kitchen"], "panel-lines")
    tstep = cpp_block(srcs["timers"], "timer-step")
    tfmt = cpp_block(srcs["timers"], "timer-format")
    tile = cpp_block(srcs["tiles"], "tile-state")
    parse = cpp_block(srcs["hold"], "light-summary-parse")
    huename = cpp_block(srcs["hold"], "hue-name")
    m = lambda hm: int(hm[:2]) * 60 + int(hm[3:])  # noqa: E731
    calls = []
    calls += [f'clockfmt({h}, {mi}, {str(tw).lower()});' for h, mi, tw, _, _ in CLOCK_CASES]
    calls.append('sep();')
    calls += [f'nightw({m(n)}, {m(s)}, {m(e)}, {str(k).lower()});' for n, s, e, k, _ in NIGHT_CASES]
    calls.append('sep();')
    calls += [f'cardlines({str(st is not None).lower()}, {cstr(st or "")}, {str(raw is not None).lower()}, '
              f'{cstr(raw or "")}, {cstr(what)}, {mx});' for st, raw, what, mx, _ in LINES_CASES]
    calls.append('sep();')
    calls += [f'timerstep({n}u, {e}u, {g});' for n, e, g, _, _ in TIMER_STEP_CASES]
    calls.append('sep();')
    calls += [f'timerfmt({s}u);' for s, _, _ in TIMER_FMT_CASES]
    calls.append('sep();')
    calls += [f'tilestate({cstr(x)});' for x, _ in TILE_CASES]
    calls.append('sep();')
    calls += [f'parse({cstr(sm)}, {cstr(tg)});' for sm, tg, _ in PARSE_CASES]
    calls.append('sep();')
    calls += [f'huename({h});' for h, _ in HUE_CASES]
    body = "\n  ".join(calls)
    src = f"""
#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>
static void sep() {{ printf("\\x1d"); }}
static void clockfmt(int hour, int minute, bool twelve) {{
  std::string clock, suffix;
{clock}
  printf("%s\\x1f%s\\x1e", clock.c_str(), suffix.c_str());
}}
static void nightw(int now_m, int start_m, int end_m, bool keep) {{
  bool night;
{night}
  printf("%d\\x1e", night ? 1 : 0);
}}
static void cardlines(bool state_heard, std::string state, bool lines_heard, std::string raw,
                      const std::string &what, int max_lines) {{
  std::string shown;
  bool wait = false;
{lines}
  printf("%s\\x1e", wait ? "\\x15" : shown.c_str());
}}
static void timerstep(uint32_t now, uint32_t end, int ring) {{
  int phase = 0;
  uint32_t left = 0;
{tstep}
  printf("%d\\x1f%u\\x1e", phase, (unsigned) left);
}}
static void timerfmt(uint32_t secs) {{
  std::string full, brief;
{tfmt}
  printf("%s\\x1f%s\\x1e", full.c_str(), brief.c_str());
}}
static void tilestate(const std::string &x) {{
  int on;
{tile}
  printf("%d\\x1e", on);
}}
static void parse(const std::string &summary, const std::string &target) {{
  int on, bri, kelvin, kmin, kmax, hue, sat;
  std::string caps;
{parse}
  printf("%d %d %d %d %d %s %d %d\\x1e", on, bri, kelvin, kmin, kmax, caps.empty() ? "-" : caps.c_str(), hue, sat);
}}
static void huename(int hue) {{
  std::string text;
{huename}
  printf("%s\\x1e", text.c_str());
}}
int main() {{
  {body}
  return 0;
}}
"""
    out = run_cpp(r, cxx, src, "panel v2 C++")
    if out is None:
        return
    parts = [p.split("\x1e")[:-1] for p in out.split("\x1d")]
    if len(parts) != 8:
        r.check(False, f"panel v2 C++: expected eight result groups, got {len(parts)}")
        return
    pc, pn, pl, ps, pf, pt, pp, ph = parts
    for (h, mi, tw, clock, suffix), got in zip(CLOCK_CASES, pc):
        r.check(got == f"{clock}\x1f{suffix}", f"clock {h:02d}:{mi:02d} {'12h' if tw else '24h'}: got {got!r}, want {clock!r} {suffix!r}")
    for (n, s, e, k, want), got in zip(NIGHT_CASES, pn):
        r.check(got == str(int(want)), f"night at {n} ({s} to {e}, keep {k}): got {got}, want {int(want)}")
    for (st, raw, what, mx, want), got in zip(LINES_CASES, pl):
        want = "\x15" if want is None else want
        r.check(got == want, f"card lines state {st!r} lines {(raw or '')[:40]!r} max {mx}: got {got!r}, want {want!r}")
    for (n, e, g, phase, left), got in zip(TIMER_STEP_CASES, ps):
        r.check(got == f"{phase}\x1f{left}", f"timer now {n} end {e}: got {got!r}, want ({phase}, {left})")
    for (s, full, brief), got in zip(TIMER_FMT_CASES, pf):
        r.check(got == f"{full}\x1f{brief}", f"timer {s} s: got {got!r}, want {full!r} {brief!r}")
    for (x, want), got in zip(TILE_CASES, pt):
        r.check(got == str(want), f"tile state {x!r}: got {got}, want {want}")
    for (sm, tg, want), got in zip(PARSE_CASES, pp):
        w = " ".join(str(v) if v != "" else "-" for v in want)
        r.check(got == w, f"summary parse {tg!r} in {sm[:40]!r}: got {got!r}, want {w!r}")
    for (h, want), got in zip(HUE_CASES, ph):
        r.check(got == want, f"hue {h}: got {got!r}, want {want!r}")
    for name, n, table in (("clock", len(pc), CLOCK_CASES), ("night", len(pn), NIGHT_CASES),
                           ("lines", len(pl), LINES_CASES), ("timer step", len(ps), TIMER_STEP_CASES),
                           ("timer format", len(pf), TIMER_FMT_CASES), ("tile", len(pt), TILE_CASES),
                           ("summary parse", len(pp), PARSE_CASES), ("hue name", len(ph), HUE_CASES)):
        r.check(n == len(table), f"panel v2 C++ {name}: {n} results for {len(table)} cases")


def check_kitchen_ha(r: Report, hak: dict):
    autos = {a["id"]: a for a in hak["automation"]}
    light = autos["family_panel_light"]
    refusals = [a["if"] for a in light["actions"] if isinstance(a, dict) and "if" in a
                and any(isinstance(s, dict) and "stop" in s for s in a.get("then", []))]
    r.check(len(refusals) >= 2, "family_panel_light: expected two refusing checks (target, action)")
    switch = [a for a in light["actions"] if isinstance(a, dict) and str(a.get("action", "")).startswith("homeassistant.turn_")]
    r.check(len(switch) == 1 and switch[0].get("target", {}).get("entity_id") == "{{ entities }}",
            "family_panel_light: the one switching action must target only the allowlisted entities")
    for wanted, how, on, (refused, turn, ents) in LIGHT_CASES:
        env = ha_env({e: "on" for e in on})
        ctx = render_vars(env, light["variables"], {"trigger": {"event": {"data": {"target": wanted, "action": how}}}})
        got = any(render_bool(env, c, ctx) for c in refusals)
        r.check(got == refused, f"light {wanted!r}/{how!r}: refused={got}, want {refused}")
        if not refused:
            r.check(ctx["turn"] == turn and ctx["entities"] == ents,
                    f"light {wanted!r}/{how!r} with {on}: turn {ctx['turn']!r} {ctx['entities']}, want {turn!r} {ents}")
        elif ents is not None:
            r.check(ctx["entities"] == ents, f"light {wanted!r}: an unknown target resolved to {ctx['entities']}, want none")
    # The light page: the allowlist, the clamps, and only light.turn_on.
    lset = autos["family_panel_light_set"]
    refusals = [a["if"] for a in lset["actions"] if isinstance(a, dict) and "if" in a
                and any(isinstance(x, dict) and "stop" in x for x in a.get("then", []))]
    r.check(len(refusals) >= 2, "family_panel_light_set: expected two refusing checks (target, nothing to set)")
    calls = [a for a in lset["actions"] if isinstance(a, dict) and "action" in a and not str(a["action"]).startswith("system_log")]
    r.check(len(calls) == 1 and calls[0]["action"] == "light.turn_on" and calls[0].get("target", {}).get("entity_id") == "{{ light }}"
            and calls[0].get("data") == "{{ data }}",
            "family_panel_light_set: the one action must be light.turn_on on {{ light }} with {{ data }}")
    r.check(lset.get("mode") == "queued" and int(lset.get("max", 0)) <= 10
            and any(isinstance(a, dict) and "delay" in a for a in lset["actions"]),
            "family_panel_light_set: queued with a small max and a delay, so a slider burst is paced")
    for attrs, ha in ((LAMP_ATTRS, ""), (OLD_LAMP_ATTRS, " (HA before 2026.10)")):
        for wanted, b, k, h, sat, (refused, light, data) in SET_CASES:
            env = ha_env(LAMP_STATES)
            ctx = render_vars(env, lset["variables"], {"state_attr": ha_attrs(attrs), "trigger": {"event": {"data": {
                "target": wanted, "brightness_pct": b, "kelvin": k, "hue": h, "sat": sat}}}})
            got = any(render_bool(env, c, ctx) for c in refusals)
            r.check(got == refused, f"set {wanted!r} b={b!r} k={k!r} h={h!r} s={sat!r}{ha}: refused={got}, want {refused}")
            r.check(ctx["light"] == light, f"set {wanted!r}{ha}: light {ctx['light']!r}, want {light!r}")
            if data is not None:
                r.check(ctx["data"] == data, f"set {wanted!r} b={b!r} k={k!r} h={h!r} s={sat!r}{ha}: data {ctx['data']!r}, want {data!r}")
            if light:
                r.check(isinstance(ctx["modes"], list), f"set {wanted!r}{ha}: modes arrived as {type(ctx['modes']).__name__} "
                        f"{str(ctx['modes'])[:50]!r}, want a list")
    # The summary sensor the page reads, over the same lamps.
    sensors = [x for block in hak.get("template", []) for x in block.get("sensor", []) if x.get("name") == "Panel lights"]
    r.check(len(sensors) == 1, "panels-kitchen: no 'Panel lights' template sensor")
    if sensors:
        sensor = sensors[0]
        r.check(sensor.get("variables", {}).get("light_hold") == lset["variables"]["light_hold"],
                "panel_lights: its light_hold differs from family_panel_light_set's")
        env = ha_env(LAMP_STATES)
        ctx = {"light_hold": lset["variables"]["light_hold"], "states": FakeStates(LAMP_STATES), "state_attr": ha_attrs(LAMP_ATTRS)}
        lines = env.from_string(sensor["attributes"]["lines"]).render(**ctx).strip().split("\n")
        lines = [ln.strip() for ln in lines if ln.strip()]
        r.check(lines == LINES_WANT, f"panel_lights lines:\n    {lines}\n  want\n    {LINES_WANT}")
        state = env.from_string(sensor["state"]).render(**ctx).strip()
        r.check(state == "4", f"panel_lights state {state!r}, want '4' (lamps on)")
    done = autos["family_panel_timer_done"]
    for name, want in TIMER_MSG_CASES:
        ctx = render_vars(ha_env(), done["variables"], {"trigger": {"event": {"data": {"timer": name}}}})
        r.check(ctx["message"] == want, f"timer {name!r}: says {ctx['message']!r}, want {want!r}")
    # Every way of speaking uses the checked message, never the raw name.
    spoken = json.dumps(done["actions"])
    r.check("trigger.event" not in spoken, "family_panel_timer_done: an action reads the event data directly")
    r.check(spoken.count("{{ message }}") >= 3, "family_panel_timer_done: satellites, TTS and the say command must all speak {{ message }}")


def check_mirrors(r: Report, ha: dict):
    env = ha_env()
    script = ha["script"]["family_send_panel_letter"]
    r.check(len(MIRROR_CASES) >= 5, "letters.json: expected at least five postie copies")
    for to, sender, text, stored, postie in MIRROR_CASES:
        ctx = render_vars(env, script["variables"], {"to": to, "sender": sender, "text": text})
        r.check(ctx["value"] == stored, f"letters.json {to!r}/{sender!r}: script stores {ctx['value']!r}, fixture says {stored!r}")
        r.check(ctx["postie_value"] == postie, f"letters.json {to!r}/{sender!r}: script copies {ctx['postie_value']!r}, fixture says {postie!r}")


def walk_widgets(items):
    """Every widget dict under an LVGL pages or widgets list, at any depth."""
    for item in items or []:
        if not isinstance(item, dict):
            continue
        yield item
        for v in item.values():
            if isinstance(v, list):
                yield from walk_widgets(v)
            elif isinstance(v, dict):
                yield from walk_widgets([v])


def made_sensors(*has) -> set:
    """Home Assistant names a YAML template sensor from its name, not its
    unique_id, so a panel must ask for the slug of the name."""
    return {"sensor." + ha_slugify(s["name"]) for ha in has for block in ha.get("template", [])
            for s in block.get("sensor", [])}


def check_consistency(r: Report, ha: dict, hak: dict, srcs: dict):
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
    bc = autos["family_panel_broadcast"]
    presets = bc["variables"]["broadcast_presets"]
    subs = esphome_subs(srcs["kitchen"])
    panel = [subs[f"preset_{i}"] for i in range(1, 5)]
    r.check(panel == presets, f"kitchen presets {panel} differ from broadcast_presets {presets}")
    for p in panel:
        r.check('"' not in p and "\\" not in p, f"preset {p!r}: no double quotes or backslashes (it lands in C++)")
    # The announce script is a setting: nothing may name the default directly.
    r.check("announce_script" in bc["variables"] and "script.family_announce" not in json.dumps(bc["actions"]),
            "family_panel_broadcast: the actions must use announce_script, not a fixed script")

    made = made_sensors(ha, hak)
    for key in ("today_entity", "lunch_entity", "due_entity", "strip_entity", "rain_entity"):
        r.check(subs.get(key) in made, f"kitchen {key} {subs.get(key)} is not a sensor the packages make ({sorted(made)})")
    # The kitchen reads the lines attribute of these; each must define it.
    for block in ha.get("template", []) + hak.get("template", []):
        for s in block.get("sensor", []):
            eid = "sensor." + ha_slugify(s["name"])
            if eid in (subs.get("today_entity"), subs.get("lunch_entity"), subs.get("due_entity"), subs.get("strip_entity")):
                r.check("lines" in (s.get("attributes") or {}), f"{eid}: no lines attribute, which the kitchen pages read")

    events = {a["triggers"][0].get("event_type") for a in ha["automation"] + hak["automation"]}
    fired = set()
    for key in ("kid", "kitchen", "timers", "tiles", "hold", "lamps"):
        fired |= set(re.findall(r"event: (esphome\.[a-z_]+)", srcs[key]))
    for e in sorted(fired):
        r.check(e in events, f"a panel fires {e} but no automation listens for it")
    r.check({"esphome.family_panel_light", "esphome.family_panel_timer_done", "esphome.family_panel_light_set"} <= fired,
            "the timers, light tiles and light page should fire their events")

    hautos = {a["id"]: a for a in hak["automation"]}
    targets = set(hautos["family_panel_light"]["variables"]["light_targets"])
    holds = set(hautos["family_panel_light_set"]["variables"]["light_hold"])
    r.check(holds <= targets, f"light_hold has targets that light_targets lacks: {sorted(holds - targets)} (the page's switch needs both)")
    timer_names = hautos["family_panel_timer_done"]["variables"]["timer_names"]
    for label, text in (("light_tiles.yaml", srcs["tiles"]), ("timers.yaml", srcs["timers"]),
                        ("kitchen.yaml", srcs["ex_kitchen"]), ("kitchen.local.yaml", srcs["ex_kitchen_local"]),
                        ("lamp_pills.yaml", srcs["lamps"]), ("kid-a.yaml", srcs["ex_kid_a"]), ("kid-a.local.yaml", srcs["ex_kid_a_local"])):
        s = esphome_subs(text)
        for i in range(1, 9):
            t, n = s.get(f"tile_{i}_target"), s.get(f"tile_{i}_name")
            if t is not None and n != "":
                r.check(t in targets, f"{label}: tile_{i}_target {t!r} is not in light_targets {sorted(targets)}")
                if s.get(f"tile_{i}_hold", "auto") != "off":
                    r.check(t in holds, f"{label}: tile_{i}_target {t!r} holds for a light page but is not in light_hold {sorted(holds)}")
            if n is not None:
                r.check('"' not in n and "\\" not in n, f"{label}: tile_{i}_name {n!r} has a quote or backslash")
            r.check(s.get(f"tile_{i}_hold", "auto") in ("auto", "off"), f"{label}: tile_{i}_hold must be auto or off")
        for i in (1, 2):
            t, n = s.get(f"lamp_{i}_target"), s.get(f"lamp_{i}_name")
            if t is not None and n != "":
                r.check(t in targets, f"{label}: lamp_{i}_target {t!r} is not in light_targets {sorted(targets)}")
                if s.get(f"lamp_{i}_hold", "auto") != "off":
                    r.check(t in holds, f"{label}: lamp_{i}_target {t!r} is not in light_hold {sorted(holds)}")
            if n is not None:
                r.check('"' not in n and "\\" not in n, f"{label}: lamp_{i}_name {n!r} has a quote or backslash")
        for i in range(1, 4):
            n = s.get(f"timer_{i}_name")
            if n is not None:
                r.check(n in timer_names, f"{label}: timer_{i}_name {n!r} is not in timer_names {timer_names}")
                r.check('"' not in n and "\\" not in n, f"{label}: timer_{i}_name {n!r} has a quote or backslash")
    # The tiles and the pills toggle on a short click only: on_click would
    # also fire at the end of the hold that opened the light page.
    for label, key, n in (("light_tiles.yaml", "tiles", 8), ("lamp_pills.yaml", "lamps", 2)):
        r.check(srcs[key].count("on_short_click:") == n and srcs[key].count("on_long_press:") == n
                and srcs[key].count("on_click:") == (1 if key == "tiles" else 0),  # All off clicks
                f"{label}: every tile or pill needs on_short_click (toggle) and on_long_press (hold), not on_click")
    for key in ("tiles", "lamps"):
        r.check("hold: !include light_hold.yaml" in srcs[key], f"{FILES[key].name}: must include light_hold.yaml")
    r.check(esphome_subs(srcs["hold"]).get("lights_entity") in made_sensors(ha, hak),
            "light_hold.yaml: lights_entity is not a sensor the packages make")
    # The light page's layout contract: four sliders that send on release
    # only, each with the finger-sized click area, a 10 px track whose
    # opacity is set (LVGL's theme draws a slider track at 20%), and the two
    # tabs a 320x240 screen needs for a lamp with all four controls.
    hold = srcs["hold"]
    for sid in ("hold_bri", "hold_warm", "hold_hue", "hold_sat"):
        r.check(f"id({sid})" in hold.split("lv_obj_set_ext_click_area(o, 8)")[0].split("lv_obj_t *s[]")[-1],
                f"light_hold.yaml: {sid} has no extended click area")
    sliders = {w["slider"]["id"]: w["slider"] for w in walk_widgets(load_ha(hold)["lvgl"]["pages"]) if "slider" in w}
    r.check(set(sliders) == {"hold_bri", "hold_warm", "hold_hue", "hold_sat"}, f"light_hold.yaml: sliders {sorted(sliders)}")
    for sid, sl in sliders.items():
        release, value = json.dumps(sl.get("on_release", [])), json.dumps(sl.get("on_value", []))
        r.check("light_send_pending" in release or "light_hold_colour_pending" in release,
                f"light_hold.yaml: {sid} does not send on release")
        r.check("light_send_pending" not in value and "light_hold_colour_pending" not in value and "homeassistant.event" not in value,
                f"light_hold.yaml: {sid} sends on every value change (a burst on every drag step)")
        r.check(sl.get("height") == 10 and sl.get("width") == "100%", f"light_hold.yaml: {sid} is not a full-width 10 px track")
    r.check("bg_opa: COVER" in hold.split("hold_slider_style")[1].split("- id:")[0],
            "light_hold.yaml: the track style must set its opacity")
    r.check("id: hold_tab_light" in hold and "id: hold_tab_colour" in hold and "room < 300" in hold,
            "light_hold.yaml: the Light and Colour tabs for a short screen are missing")
    r.check("lv_obj_set_ext_click_area(id(hold_switch), 6)" in hold, "light_hold.yaml: the switch's touch height is under 44 px")
    # The kid profile shows nothing for no letter: the envelope starts hidden
    # and no "No letters" text exists to show.
    r.check("No letters" not in srcs["kid"] and "Letters unavailable" not in srcs["kid"],
            "kid.yaml: the profile must not draw 'No letters' or 'Letters unavailable'")
    r.check(re.search(r"id: letter_button\n(?:.*\n){1,12}?\s+hidden: true", srcs["kid"]) is not None,
            "kid.yaml: the envelope button must start hidden")
    g = esphome_subs(srcs["garden"])
    r.check(g.get("theme") == "garden", "garden.yaml: theme defaults to garden")
    r.check(all(f"fly_{c}_{k}" in srcs["garden"] for c in ("pink", "lilac", "peach", "blue") for k in range(3))
            and "firefly.png" in srcs["garden"], "garden.yaml: twelve butterfly frames and a firefly")
    for f in sorted((ROOT / "esphome" / "art").glob("*.png")):
        if f.name.startswith("preview"):
            continue
        r.check(f.name in srcs["garden"] or f.name in ("bg_day.png", "bg_night.png"), f"art/{f.name} is not used by garden.yaml")
    for name in ("bg_day.png", "bg_night.png", "firefly.png"):
        r.check((ROOT / "esphome" / "art" / name).is_file(), f"esphome/art/{name} is missing")
    for f in sorted(EXAMPLES.glob("*.yaml")):
        if f.name == "secrets.yaml":
            continue
        text = srcs.get({"kitchen.yaml": "ex_kitchen", "kitchen.local.yaml": "ex_kitchen_local",
                         "kid-a.yaml": "ex_kid_a"}.get(f.name, ""), f.read_text())
        s = esphome_subs(text)
        child = s.get("child")
        if child is not None:
            r.check(child in recipients, f"{f.name}: child {child!r} is not a recipient in panels.example.yaml")
        r.check(s.get("clock_format", "24h") in ("12h", "24h"), f"{f.name}: clock_format must be 12h or 24h")
        r.check(s.get("night_mode", "off") in ("dim", "off"), f"{f.name}: night_mode must be dim or off")
        r.check(str(s.get("rotation", "0")) in ("0", "90", "180", "270"), f"{f.name}: rotation must be 0, 90, 180 or 270")
    a = esphome_subs(srcs["ex_kid_a"])
    r.check(a.get("clock_format") == "12h" and a.get("night_mode") == "dim" and "cyd_model" not in a and "rotation" not in a,
            "kid-a.yaml: Kid A's panel is the board file's default CYD (2-USB ST7789, rotation 90) with a 12-hour clock and a dim night")
    for key in ("ex_kid_a", "ex_kid_a_local"):
        r.check("packages/lamp_pills.yaml" in srcs[key] and "packages/garden.yaml" in srcs[key],
                f"{FILES[key].name}: pulls the lamp pills and the garden")
    # The CYD board file's defaults are what works on the real 2-USB ST7789
    # board (checked 2026-10-28): the model, the touch calibration and the
    # mirrored x axis, no colour inversion.
    bs = esphome_subs(srcs["board_cyd"])
    r.check(bs.get("cyd_model") == "ESP32-2432S028-7789" and bs.get("rotation") == "90", "esp32_2432s028.yaml: default model ST7789 at rotation 90")
    r.check((bs.get("touch_x_min"), bs.get("touch_x_max"), bs.get("touch_y_min"), bs.get("touch_y_max")) == ("240", "3800", "200", "3700"),
            "esp32_2432s028.yaml: touch calibration x 240..3800, y 200..3700")
    r.check(str(bs.get("touch_mirror_x")).lower() == "true", "esp32_2432s028.yaml: touch_mirror_x defaults to true")
    board = load_ha(srcs["board_cyd"])
    touch = (board.get("touchscreen") or [{}])[0]
    r.check((touch.get("transform") or {}).get("mirror_x") == "${touch_mirror_x}" and (touch.get("transform") or {}).get("swap_xy") is False,
            "esp32_2432s028.yaml: the touchscreen transform must mirror x from touch_mirror_x and not swap the axes")
    disp = (board.get("display") or [{}])[0]
    r.check(disp.get("invert_colors") is False, "esp32_2432s028.yaml: invert_colors false by default")
    b = esphome_subs(srcs["base"])
    r.check(b.get("clock_format") == "24h" and b.get("night_mode") == "off",
            "base.yaml: the defaults must keep v1 behaviour (24h, screen off at night)")


# The dimmest backlight duty known to glow on these boards: the old Arduino
# firmware's night level, 4/255, on the Cheap Yellow Display.
GLOW_FLOOR = 4 / 255
ESPHOME_DEFAULT_GAMMA = 2.8


def level(v) -> float:
    """An ESPHome percentage ("4%", 0.04) as a fraction."""
    t = str(v).strip()
    return float(t[:-1]) / 100 if t.endswith("%") else float(t)


def resolve(v, subs: dict):
    m = re.fullmatch(r"\$\{?(\w+)\}?", str(v).strip())
    return subs.get(m.group(1), v) if m else v


def backlight_gamma(board_src: str, subs: dict) -> float:
    lights = [x for x in (load_ha(board_src).get("light") or []) if x.get("id") == "backlight"]
    if len(lights) != 1:
        raise SystemExit("board file: no single light with id backlight")
    return float(resolve(lights[0].get("gamma_correct", ESPHOME_DEFAULT_GAMMA), subs))


def glow_duty(srcs: dict, board_key: str, device_subs: dict | None = None) -> tuple[float, float, float]:
    subs = {**esphome_subs(srcs["base"]), **esphome_subs(srcs[board_key]), **(device_subs or {})}
    lv = level(subs["night_glow_brightness"])
    g = backlight_gamma(srcs[board_key], subs)
    return lv, g, lv ** g


def check_backlight(r: Report, srcs: dict):
    # Every board with the base defaults, then every example with its own settings.
    for f, key in BOARDS.items():
        lv, g, duty = glow_duty(srcs, key)
        r.check(duty >= GLOW_FLOOR, f"{f}: the default night glow {lv:.1%} at gamma {g:g} is "
                f"{duty:.4%} duty, below the {GLOW_FLOOR:.2%} floor that still glows")
    for f in sorted(EXAMPLES.glob("*.yaml")):
        if f.name == "secrets.yaml":
            continue
        text = srcs.get({"kitchen.yaml": "ex_kitchen", "kitchen.local.yaml": "ex_kitchen_local",
                         "kid-a.yaml": "ex_kid_a"}.get(f.name, ""), f.read_text())
        board = re.search(r"boards/([\w.]+\.yaml)", text)
        r.check(board is not None and board.group(1) in BOARDS, f"{f.name}: no known board file")
        if board is None or board.group(1) not in BOARDS:
            continue
        lv, g, duty = glow_duty(srcs, BOARDS[board.group(1)], esphome_subs(text))
        r.check(duty >= GLOW_FLOOR, f"{f.name}: its night glow {lv:.1%} at gamma {g:g} is "
                f"{duty:.4%} duty, below the {GLOW_FLOOR:.2%} floor that still glows")


# The chime's loudness. ESPHome 2026.10's i2s_audio speaker turns a volume v
# into a software gain of -49 * (1 - v) dB (SOFTWARE_VOLUME_MIN_DB in
# components/i2s_audio/speaker/i2s_audio_speaker.cpp); 1.0 passes the samples
# through. rtttl writes a full-scale sine. The old Arduino firmware wrote its
# sine at 25% of full scale (VOLUME = 25 in its sound.cpp), 16-bit at 16 kHz,
# the same sample on both slots: the level the panel has to at least match.
SPEAKER_MIN_DB = -49.0
OLD_FIRMWARE_AMPLITUDE = 0.25


def amplitude(v: float) -> float:
    """A speaker volume as a share of full scale."""
    return 1.0 if v >= 1.0 else 0.0 if v <= 0.0 else 10 ** (SPEAKER_MIN_DB * (1 - v) / 20)


# (n, base, top, every, span, escalate) -> the volume chime n plays at.
CHIME_CASES = [
    (0, 0.5, 0.9, 5, 30, True, 0.5),
    (3, 0.5, 0.9, 5, 30, True, 0.7),
    (6, 0.5, 0.9, 5, 30, True, 0.9),
    (24, 0.5, 0.9, 5, 30, True, 0.9),     # tops out, never past the maximum
    (4, 0.5, 0.9, 5, 30, False, 0.5),     # escalation off: every chime the same
    (4, 0.9, 0.5, 5, 30, True, 0.9),      # a maximum below the base never turns it down
    (4, 0.5, 0.9, 5, 0, True, 0.5),       # no span: no escalation, no divide by zero
    (2, 1.4, 1.6, 5, 30, False, 1.0),     # out of range is held to 0..1
    (0, -0.2, 0.0, 5, 30, False, 0.0),
]


def check_chime(r: Report, srcs: dict, cxx: str | None):
    t = esphome_subs(srcs["timers"])
    base, top = float(t["timer_volume"]), float(t["timer_volume_max"])
    every, span = int(t["timer_chime_every"]), int(t["timer_escalate_seconds"])
    escalate = str(t["timer_escalate"]).lower() == "true"
    r.check(amplitude(base) >= OLD_FIRMWARE_AMPLITUDE,
            f"timers.yaml: timer_volume {base} is {amplitude(base):.3f} of full scale, quieter than the "
            f"old firmware's {OLD_FIRMWARE_AMPLITUDE}")
    r.check(0.0 < base <= top <= 1.0, f"timers.yaml: want 0 < timer_volume ({base}) <= timer_volume_max ({top}) <= 1.0")
    r.check(escalate, "timers.yaml: timer_escalate should default to true")
    r.check(top == 1.0, f"timers.yaml: timer_volume_max {top}, want 1.0 (full scale) so the escalation ends loud")
    r.check(0 < span <= 30 and span % every == 0,
            f"timers.yaml: timer_escalate_seconds {span} should reach the top within 30 s, on a chime ({every} s apart)")
    r.check(int(t["timer_ring_seconds"]) == 120, "timers.yaml: timer_ring_seconds should stay 120 (the 2-minute cap)")
    g = esphome_subs(srcs["board_guition"]).get("speaker_gain")
    r.check(g is not None and amplitude(level(g)) >= OLD_FIRMWARE_AMPLITUDE,
            f"guition_jc3248w535.yaml: speaker_gain {g} is quieter than the old firmware")
    # The real ring and the test ring both go through timer_chime_play, the
    # one place that sets the volume, and the count it climbs on is reset.
    tm = srcs["timers"]
    r.check(tm.count("id(panel_chime).play(") == 1,
            "timers.yaml: the chime must be played only by timer_chime_play, which sets its volume first")
    r.check("id(timer_chime_play).execute(id(timer_chime_count)++);" in tm,
            "timers.yaml: the ring does not play through timer_chime_play with a rising count")
    r.check("id(timer_chime_count) = 0;" in tm, "timers.yaml: the chime count is not reset when a ring starts")
    test = tm.split("  - id: timer_test\n", 1)[-1].split("  - id: timer_test_toggle\n", 1)[0]
    r.check("timer_announce" not in test and "homeassistant." not in test and "timer_done_box" not in test,
            "timers.yaml: the test ring must not show the card or tell Home Assistant a timer ended")
    buttons = [b for b in (load_ha(tm).get("button") or []) if b.get("name") == "Test alarm"]
    r.check(len(buttons) == 1 and {"script.execute": "timer_test_toggle"} in (buttons[0].get("on_press") or []),
            "timers.yaml: no Test alarm button that runs timer_test_toggle")
    r.check(re.search(r"on_long_press:\s*\n\s*- script\.execute: timer_test_toggle", tm) is not None,
            "timers.yaml: holding the first timer's name no longer plays the test ring")
    if cxx is None:
        r.check(False, "no C++ compiler (c++) on PATH: the chime volume block was not checked")
        return
    block = cpp_block(tm, "chime-volume")
    # The shipped defaults, chime by chime over one whole ring, then the edges.
    ring = [(n, base, top, every, span, escalate, None) for n in range(int(t["timer_ring_seconds"]) // every)]
    cases = ring + CHIME_CASES
    calls = "\n  ".join(f"vol({n}, {b}f, {tp}f, {e}, {s}, {str(x).lower()});" for n, b, tp, e, s, x, _ in cases)
    src = f"""
#include <cstdio>
static void vol(int n, float base, float top, int every, int span, bool escalate) {{
  float volume = base;
{block}
  printf("%.4f\\x1e", volume);
}}
int main() {{
  {calls}
  return 0;
}}
"""
    out = run_cpp(r, cxx, src, "chime volume C++")
    if out is None:
        return
    got = [float(x) for x in out.split("\x1e")[:-1]]
    r.check(len(got) == len(cases), f"chime volume: {len(got)} results for {len(cases)} cases")
    shipped, edges = got[:len(ring)], got[len(ring):]
    # The defaults: starts at timer_volume, climbs every chime, is at the top
    # by timer_escalate_seconds and stays there, and never clips.
    r.check(abs(shipped[0] - base) < 1e-4, f"chime 1 plays at {shipped[0]}, want timer_volume {base}")
    steps = span // every
    for i in range(1, len(shipped)):
        if i <= steps:
            r.check(shipped[i] > shipped[i - 1], f"chime {i + 1} at {shipped[i]} is not louder than chime {i} at {shipped[i - 1]}")
        else:
            r.check(abs(shipped[i] - top) < 1e-4, f"chime {i + 1} at {shipped[i]}, want the top {top}")
        r.check(shipped[i] <= 1.0, f"chime {i + 1} at {shipped[i]} is past full scale")
    want_steps = [round(base + (top - base) * min(i, steps) / steps, 4) for i in range(steps + 1)]
    r.check([round(x, 4) for x in shipped[:steps + 1]] == want_steps,
            f"chime volumes {shipped[:steps + 1]}, want even steps {want_steps}")
    for (n, b, tp, e, s, x, want), v in zip(CHIME_CASES, edges):
        r.check(abs(v - want) < 1e-4, f"chime {n} base {b} top {tp} every {e} span {s} escalate {x}: got {v}, want {want}")


def check_wifi(r: Report, srcs: dict):
    """Mains-powered panels keep the radio awake: base.yaml turns Wi-Fi power
    save off by default, and nothing a panel is built from turns it back on."""
    base = load_ha(srcs["base"])
    subs = base.get("substitutions", {})
    r.check(str(subs.get("wifi_power_save")).lower() == "none",
            f"base.yaml: wifi_power_save defaults to {subs.get('wifi_power_save')!r}, want none")
    mode = (base.get("wifi") or {}).get("power_save_mode")
    r.check(mode == "${wifi_power_save}", f"base.yaml: wifi power_save_mode is {mode!r}, want ${{wifi_power_save}}")
    # Everything else a panel is made of: no wifi block of its own, and no
    # override of the default.
    by_path = {p.resolve(): k for k, p in FILES.items()}
    parts = sorted((ROOT / "esphome").glob("boards/*.yaml")) + sorted((ROOT / "esphome").glob("profiles/*.yaml")) \
        + sorted((ROOT / "esphome").glob("packages/*.yaml")) + sorted(EXAMPLES.glob("*.yaml"))
    for f in parts:
        if f.name in ("base.yaml", "secrets.yaml"):
            continue
        key = by_path.get(f.resolve())
        text = srcs[key] if key else f.read_text(encoding="utf-8")
        data = load_ha(text) or {}
        r.check("wifi" not in data, f"{f.relative_to(ROOT)}: has its own wifi block; power save belongs to base.yaml")
        ps = (data.get("substitutions") or {}).get("wifi_power_save")
        r.check(ps is None or str(ps).lower() == "none", f"{f.relative_to(ROOT)}: sets wifi_power_save {ps!r}")
        if f.parent == EXAMPLES:
            r.check(re.search(r"^\s+base:\s.*packages/base\.yaml", text, re.M) is not None,
                    f"{f.name}: does not pull packages/base.yaml, so it misses the Wi-Fi settings")


def run(srcs: dict, quiet=False) -> Report:
    r = Report()
    ha = load_ha(srcs["ha"])
    hak = load_ha(srcs["hak"])
    cxx = shutil.which("c++")
    check_send_script(r, ha)
    check_parsers(r, ha, srcs["kid"], srcs["base"], cxx)
    check_panel_v2(r, srcs, cxx)
    check_kitchen_ha(r, hak)
    check_mirrors(r, ha)
    check_consistency(r, ha, hak, srcs)
    check_backlight(r, srcs)
    check_wifi(r, srcs)
    check_chime(r, srcs, cxx)
    if not quiet:
        for f in r.fails:
            print("FAIL", f)
    return r


def sources() -> dict:
    return {k: p.read_text(encoding="utf-8") for k, p in FILES.items()}


# Each sabotage breaks one shipped piece the way a plausible edit would.
SABOTAGES = [
    ("panel splits on the last '|'", "kid", "s.find('|')", "s.rfind('|')"),
    ("panel forgets to trim the text", "kid", "text = trim(s.substr(p + 1));", "text = s.substr(p + 1);"),
    ("panel treats 'unavailable' as a letter", "kid", 'if (s == "unavailable") {\n              kind = 3;',
     'if (false) {\n              kind = 3;'),
    ("panel reads a never-set helper as a letter", "kid", 'if (s == "unknown") s = "";', ""),
    ("script checks the helper's state, not that it exists", "ha",
     "helper not in states.input_text | map(attribute='entity_id') | list", "states(helper) in ['unknown', 'unavailable']"),
    ("announcement drops the sender", "base", 'from.empty() ? text : from + ": " + text', "text"),
    ("script stops slugifying the recipient", "ha", "string | trim | slugify }}", "string | trim }}"),
    ("script keeps '|' in the sender", "ha", "| replace('|', '/') ", ""),
    ("script lets a long sender through", "ha", "| trim)[:24] | trim }}", "| trim) }}"),
    ("postie copy drifts from the read check", "ha", "~ ('From ' ~ from_part ~ ': ' if from_part else '') ~ body)[:255] }}\n    sequence",
     "~ ('from ' ~ from_part ~ ': ' if from_part else '') ~ body)[:255] }}\n    sequence"),
    ("read automation splits on every '|'", "ha", "current.split('|', 1)", "current.split('|')"),
    ("kitchen reads a sensor that is never made", "kitchen", "sensor.panel_lunch_and_kit", "sensor.panel_lunch_kit"),
    ("kitchen preset no longer matches", "kitchen", 'preset_2: "Shoes on, we\'re leaving"', 'preset_2: "Shoes on"'),
    ("helper wiped on restart", "ha", "  letter_kid_b:\n    name: Letter for Kid B\n", "  letter_kid_b:\n    initial: ''\n    name: Letter for Kid B\n"),
    # v2
    ("12-hour clock keeps the leading zero", "base", 'snprintf(buf, sizeof buf, "%d:%02d", h, minute);',
     'snprintf(buf, sizeof buf, "%02d:%02d", h, minute);'),
    ("12-hour clock shows 0:05 after midnight", "base", "if (h == 0) h = 12;", ""),
    ("noon reads am", "base", 'suffix = hour < 12 ? "am" : "pm";', 'suffix = hour <= 12 ? "am" : "pm";'),
    ("keep-awake ignored", "base", "night = window && !keep;", "night = window;"),
    ("night window ends a minute late", "base", "(now_m >= start_m || now_m < end_m)", "(now_m >= start_m || now_m <= end_m)"),
    ("card shows HA's 'None' as text", "kitchen", 's == "None" || ', ""),
    ("card loses the '+N more' line", "kitchen", 'if (keep < lines.size()) shown += "\\n+" + std::to_string(lines.size() - keep) + " more";', ""),
    ("card keeps blank lines", "kitchen", "if (!line.empty()) lines.push_back(line);", "lines.push_back(line);"),
    ("kitchen ignores the sensor's state", "kitchen", 'state == "unavailable" || state == "unknown"', "false"),
    ("kitchen guesses before it hears", "kitchen", "else if (!lines_heard) wait = true;", ""),
    ("timer rings forever", "timers", "else if (now - end < (uint32_t) ring) phase = 2;", "else if (true) phase = 2;"),
    ("timer forgets an end with no clock", "timers", "else if (now == 0) phase = 1;", "else if (now == 0) phase = 0;"),
    ("timer shows 0 min while running", "timers", "unsigned mins = (secs + 59) / 60;", "unsigned mins = secs / 60;"),
    ("timer drops the hours", "timers", 'if (h) snprintf(buf, sizeof buf, "%u:%02u:%02u", h, m, s);\n              else ', ""),
    ("tile reads unavailable as off", "tiles", 'on = x == "on" ? 1 : x == "off" ? 0 : -1;', 'on = x == "on" ? 1 : 0;'),
    ("light automation takes an entity id as the target", "hak",
     "{% set e = light_targets[wanted] if wanted in light_targets else [] %}",
     "{% set e = light_targets[wanted] if wanted in light_targets else [wanted] %}"),
    ("light automation drops the target check", "hak",
     """      - if: "{{ wanted not in light_targets or not entities }}\"""", """      - if: "{{ false }}\""""),
    ("light automation allows any action", "hak", "{% else %}none{% endif %}", "{% else %}on{% endif %}"),
    ("light toggle needs every light on to turn off", "hak", "{{ 'off' if entities | select('is_state', 'on') | list | count else 'on' }}",
     "{{ 'off' if entities | select('is_state', 'on') | list | count == entities | count else 'on' }}"),
    ("timer alert speaks any name", "hak", "{% if name in timer_names %}", "{% if true %}"),
    ("timer alert says 'Timer 2 timer'", "hak", "(' is done' if 'timer' in name | lower else ' timer is done')", "' timer is done'"),
    ("timer alert speaks the raw name", "hak", "              message: \"{{ message }}\"\n      - if: \"{{ tts_entity",
     "              message: \"{{ trigger.event.data.timer }}\"\n      - if: \"{{ tts_entity"),
    ("kitchen timer name not in timer_names", "ex_kitchen", 'timer_2_name: "Hob"', 'timer_2_name: "Hob 2"'),
    ("kitchen tile target not in light_targets", "ex_kitchen", "tile_3_target: hall", "tile_3_target: hallway"),
    ("broadcast fixed to one script", "ha", 'entity_id: "{{ announce_script }}"', "entity_id: script.family_announce"),
    ("timer event renamed on the panel", "timers", "event: esphome.family_panel_timer_done", "event: esphome.family_timer_done"),
    ("strip loses its lines attribute", "hak", "          lines: \"{{ strip_lines | join('\\n') }}\"", "          rows: \"{{ strip_lines | join('\\n') }}\""),
    ("Kid A back on a 24-hour clock", "ex_kid_a", 'clock_format: "12h"', 'clock_format: "24h"'),
    ("base default night turned dim", "base", '  night_mode: "off"', '  night_mode: "dim"'),
    # The backlight curve: back to ESPHome's 2.8, one board dropping it, a darker default.
    ("backlight back on ESPHome's gamma 2.8", "base", 'backlight_gamma: "1.0"', 'backlight_gamma: "2.8"'),
    ("a board's backlight loses its gamma_correct", "board_jc2432", "    gamma_correct: ${backlight_gamma}\n", ""),
    ("default glow below what lights", "base", "night_glow_brightness: 4%", "night_glow_brightness: 1%"),
    # Wi-Fi power save: back to ESPHome's light, the key dropped, a board turning it on again.
    ("Wi-Fi power save back to light", "base", "  wifi_power_save: none", "  wifi_power_save: light"),
    ("base stops passing wifi_power_save", "base", "  power_save_mode: ${wifi_power_save}\n", ""),
    ("a board sets its own Wi-Fi power save", "board_cyd", "esp32:\n",
     "wifi:\n  power_save_mode: light\n\nesp32:\n"),
    ("an example dozes its radio", "ex_kid_a", "substitutions:\n", "substitutions:\n  wifi_power_save: high\n"),
    # The chime: back to rtttl's quiet default, no escalation, a ring that skips the volume.
    ("chime back to rtttl's 0.6", "timers", 'timer_volume: "0.85"', 'timer_volume: "0.6"'),
    ("escalation off by default", "timers", 'timer_escalate: "true"', 'timer_escalate: "false"'),
    ("escalation stops short of full scale", "timers", 'timer_volume_max: "1.0"', 'timer_volume_max: "0.9"'),
    ("escalation takes a minute", "timers", 'timer_escalate_seconds: "30"', 'timer_escalate_seconds: "60"'),
    ("escalation runs past its top", "timers", "if (k > 1.0f) k = 1.0f;", ""),
    ("escalation counts down", "timers", "volume = base + (top - base) * k;", "volume = top - (top - base) * k;"),
    ("ring plays the chime without its volume", "timers", "id(timer_chime_play).execute(id(timer_chime_count)++);",
     'id(panel_chime).play(std::string("${timer_chime}"));'),
    ("chime count never climbs", "timers", "id(timer_chime_count)++", "id(timer_chime_count)"),
    ("chime count not reset for a new ring", "timers", "              id(timer_chime_count) = 0;\n", ""),
    ("Test alarm button does nothing", "timers", "    on_press:\n      - script.execute: timer_test_toggle\n", ""),
    ("board rtttl gain back to 60%", "board_guition", "speaker_gain: 85%", "speaker_gain: 60%"),
    ("2-minute cap lifted", "timers", 'timer_ring_seconds: "120"', 'timer_ring_seconds: "600"'),
    # The light page: the panel's parser, the automation's clamps, the sensor.
    ("parser lets brightness past 100", "hold", "bri = num(f[2], 100);", "bri = num(f[2], 1000);"),
    ("parser keeps an upside-down kelvin range", "hold", "if (kmin < 0 || kmax < 0 || kmin >= kmax) kmin = kmax = -1;", ""),
    ("parser keeps unknown capability letters", "hold", "if ((c == 'b' || c == 't' || c == 'c') && caps.find(c) == std::string::npos) caps += c;", "caps += c;"),
    ("parser matches a target by prefix", "hold", 'if (f.size() >= 2 && f[0] == target) {', 'if (f.size() >= 2 && f[0].compare(0, target.size(), target) == 0) {'),
    ("parser reads an odd state as on", "hold", 'on = f[1] == "on" ? 1 : f[1] == "off" ? 0 : -1;', 'on = f[1] == "off" ? 0 : 1;'),
    ("hue names shift by half a step", "hold", "names[((h + 15) % 360) / 30]", "names[h / 30]"),
    ("hue 360 reads past the names", "hold", "int h = hue % 360;", "int h = hue;"),
    ("light page slider sends while dragging", "hold", "                  on_value:\n                    - lambda: |-\n                        char buf[12];\n                        snprintf(buf, sizeof buf, \"%d%%\", (int) lv_slider_get_value(id(hold_bri)));",
     "                  on_value:\n                    - script.execute: light_send_pending\n                    - lambda: |-\n                        char buf[12];\n                        snprintf(buf, sizeof buf, \"%d%%\", (int) lv_slider_get_value(id(hold_bri)));"),
    ("light page track back at the theme's 20%", "hold", "      bg_opa: COVER\n      radius: 5\n", "      radius: 5\n"),
    ("light page loses a slider's click area", "hold", "lv_obj_t *s[] = {id(hold_bri), id(hold_warm), id(hold_hue), id(hold_sat)};",
     "lv_obj_t *s[] = {id(hold_bri), id(hold_warm), id(hold_hue)};"),
    ("light page stacks four rows on a 240 px screen", "hold", "bool tabs = b && t && c && room < 300;", "bool tabs = false;"),
    ("light page switch back to 32 px of touch", "hold", "          lv_obj_set_ext_click_area(id(hold_switch), 6);\n", ""),
    ("light page drops the switch's on", "hak", "{% if how in ['off', 'on'] %}{{ how }}", "{% if how == 'off' %}off"),
    ("light set takes an entity id as the target", "hak", "light: \"{{ light_hold[wanted] if wanted in light_hold else '' }}\"",
     "light: \"{{ light_hold[wanted] if wanted in light_hold else wanted }}\""),
    ("light set stops clamping brightness", "hak", "bri: \"{{ [1, [100, raw_bri | int(-1)] | min] | max if raw_bri is match('^\\\\d+$') else -1 }}\"",
     "bri: \"{{ raw_bri | int(-1) if raw_bri is match('^\\\\d+$') else -1 }}\""),
    ("light set clamps kelvin to a fixed range", "hak", "kelvin: \"{{ [kmin, [kmax, raw_kelvin | int(-1)] | min] | max",
     "kelvin: \"{{ [2000, [6500, raw_kelvin | int(-1)] | min] | max"),
    ("light set sends colour to a lamp without it", "hak", "{% if can_colour and hue | int >= 0 and sat | int >= 0 %}", "{% if hue | int >= 0 and sat | int >= 0 %}"),
    ("light set sends warmth to a lamp without it", "hak", "{% if can_temp and kelvin | int >= 0 %}", "{% if kelvin | int >= 0 %}"),
    ("light set calls turn_on with the raw event data", "hak", '        data: "{{ data }}"\n', '        data: "{{ trigger.event.data }}"\n'),
    ("light set modes without to_json (text on HA before 2026.10)", "hak",
     "modes: \"{{ ((state_attr(light, 'supported_color_modes') or []) if light else []) | to_json }}\"",
     "modes: \"{{ state_attr(light, 'supported_color_modes') or [] if light else [] }}\""),
    ("light set loses its pacing delay", "hak", "      - delay:\n          milliseconds: 150\n", ""),
    ("light set unbounded queue", "hak", "    mode: queued\n    max: 6\n    max_exceeded: warning\n    triggers:\n      - trigger: event\n        event_type: esphome.family_panel_light_set",
     "    mode: queued\n    max: 60\n    max_exceeded: warning\n    triggers:\n      - trigger: event\n        event_type: esphome.family_panel_light_set"),
    ("panel_lights reports brightness while off", "hak", "((b | float * 100 / 255) | round(0) | int) if st == 'on' and b is number else '-'",
     "((b | float * 100 / 255) | round(0) | int) if b is number else '-'"),
    ("panel_lights passes a warm-white lamp's worked-out hue off as colour", "hak",
     "{% set hs = state_attr(light, 'hs_color') if state_attr(light, 'color_mode') in ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'] else none %}",
     "{% set hs = state_attr(light, 'hs_color') %}"),
    ("panel_lights reads a mirrored lamp list", "hak", "        variables:\n          light_hold: *panel_light_hold\n",
     "        variables:\n          light_hold: { kitchen: light.kitchen }\n"),
    ("tile toggles on click, so a hold toggles too", "tiles", "on_short_click:\n                    - script.execute: { id: light_send, target: \"${tile_1_target}\"",
     "on_click:\n                    - script.execute: { id: light_send, target: \"${tile_1_target}\""),
    ("pill loses its hold", "lamps", "                  on_long_press:\n                    - script.execute: { id: lamp_hold, slot: 1 }\n", ""),
    ("tile target held but not in light_hold", "ex_kitchen", "tile_4_target: landing", "tile_4_target: downstairs"),
    ("kid profile says No letters again", "kid", 'ESP_LOGW("letters", "The letter helper is unavailable; the envelope stays hidden");',
     'lv_label_set_text(id(date_label), "No letters");'),
    ("envelope shown with no letter", "kid", "                  radius: 12\n                  hidden: true\n                  on_click:\n                    - script.execute: open_letter",
     "                  radius: 12\n                  on_click:\n                    - script.execute: open_letter"),
    ("garden theme off by default", "garden", "  theme: garden\n", "  theme: plain\n"),
    # The CYD board: back to the ILI9341 model, the old touch numbers, no mirror.
    ("CYD back to the ILI9341 model", "board_cyd", "  cyd_model: ESP32-2432S028-7789\n", "  cyd_model: ESP32-2432S028\n"),
    ("CYD touch mirror off", "board_cyd", '  touch_mirror_x: "true"\n', '  touch_mirror_x: "false"\n'),
    ("CYD touch back to the old calibration", "board_cyd", '  touch_x_min: "240"\n', '  touch_x_min: "280"\n'),
    ("CYD transform ignores touch_mirror_x", "board_cyd", "      mirror_x: ${touch_mirror_x}\n", "      mirror_x: false\n"),
    ("CYD colours inverted by default", "board_cyd", "    invert_colors: false\n", "    invert_colors: true\n"),
    ("kid-a example back on the ILI9341", "ex_kid_a", "  clock_format: \"12h\"\n", "  clock_format: \"12h\"\n  cyd_model: ESP32-2432S028\n"),
]


def sabotage() -> int:
    base = sources()
    clean = run(base, quiet=True)
    if clean.fails:
        print("The clean tree already fails; fix that first:")
        for f in clean.fails:
            print("  ", f)
        return 1
    bad = 0
    for name, key, old, new in SABOTAGES:
        srcs = dict(base)
        if old not in srcs[key]:
            print(f"SABOTAGE SETUP BROKEN  {name}: the text to break is not in {FILES[key].name} any more")
            bad += 1
            continue
        srcs[key] = srcs[key].replace(old, new, 1)
        try:
            r = run(srcs, quiet=True)
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
    r = run(sources())
    print(f"{r.passes} passed, {len(r.fails)} failed")
    return 1 if r.fails else 0


if __name__ == "__main__":
    sys.exit(main())
