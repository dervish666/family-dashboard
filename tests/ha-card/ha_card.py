#!/usr/bin/env python3
"""Loads the built card into a real, throwaway Home Assistant and looks at it in Chromium.

The node checks stub the browser and Home Assistant. This does neither: it starts the
official container with tests/ha-card/configuration.yaml and dist/ mounted at
config/www/family-dashboard (the README's manual install), onboards a test user, adds a
local calendar through its config flow with an event today and one tomorrow, registers
/local/family-dashboard/family-dashboard.js as a Lovelace module resource, and saves a
storage-mode dashboard whose only card is the family dashboard with two people, Alex
holding the calendar. Then headless Chromium logs in with the onboarding token and checks:

  the card element is defined, HA drew no error card, and the world canvas is sized and drawn;
  no uncaught page errors, and no meadow: or family-dashboard-card: warnings in the console;
  Alex's card (the open= hook) lists both events from HA's real /api/calendars answer,
  and the household's card does not;
  the card editor gets Home Assistant's own ha-form on this release, shows Alex's name in
  it, and a typed name comes back as a config-changed event.

Screenshots and Home Assistant's log go to HA_CARD_SHOTS (default: a new temp folder).
HA_PORT picks the host port (default 18124, one above tests/panels/ha_live.py's).

  python3 tests/ha-card/ha_card.py              needs docker and playwright (pip, in a venv)
  HA_IMAGE=ghcr.io/home-assistant/home-assistant:2024.11.0 python3 tests/ha-card/ha_card.py

Exit status 1 on any failed check.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
IMAGE = os.environ.get("HA_IMAGE", "ghcr.io/home-assistant/home-assistant:stable")
PORT = int(os.environ.get("HA_PORT", "18124"))
BASE = f"http://127.0.0.1:{PORT}"
CLIENT = BASE + "/"
NAME = f"family-card-test-{os.getpid()}"
TZ = "Europe/London"            # configuration.yaml's time_zone; the browser runs in it too
CAL = "calendar.family_test"
OWNER, HOUSE = "Alex", "House"
TODAY_EVENT, TOMORROW_EVENT = "Otter club", "Kite repair"
DASH = "family-test"
RESOURCE = "/local/family-dashboard/family-dashboard.js"
CARD = {
    "type": "custom:family-dashboard-card",
    # open= opens Alex's card 0.9 s after the engine starts; dbg exposes window.meadow so the
    # test can open it again if the calendar answered after that.
    "query": f"open={OWNER}&dbg",
    "people": [{"name": OWNER, "calendar": CAL, "adult": True}, {"name": HOUSE}],
    # This Home Assistant has no weather integration; sun.sun comes from configuration.yaml.
    "sensors": {"weather": None},
}

fails: list[str] = []
passes = 0


def check(ok, what):
    global passes
    if ok:
        passes += 1
        print("  ok  ", what)
    else:
        fails.append(what)
        print("  FAIL", what)


def http(method, path, body=None, token=None, form=False):
    data = None
    headers = {}
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            try:
                return r.status, (json.loads(raw) if raw else None)
            except ValueError:
                return r.status, raw.decode(errors="replace")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw.decode(errors="replace")


def poll(fn, seconds, step=0.25):
    """fn() until it returns something truthy, or the last value after `seconds`."""
    end = time.time() + seconds
    v = fn()
    while not v and time.time() < end:
        time.sleep(step)
        v = fn()
    return v


def onboard() -> dict:
    """Every onboarding step, so the frontend serves dashboards and not onboarding.html.
    Returns the token answer: access_token, refresh_token, expires_in."""
    for _ in range(180):
        try:
            s, _ = http("GET", "/api/onboarding")
            if s == 200:
                break
        except (urllib.error.URLError, ConnectionError, OSError):
            pass
        time.sleep(1)
    else:
        raise SystemExit("Home Assistant did not come up")
    s, r = http("POST", "/api/onboarding/users", {
        "client_id": CLIENT, "name": "Test", "username": "test", "password": "test-password-1", "language": "en"})
    if s != 200:
        raise SystemExit(f"onboarding failed: {s} {r}")
    s, tok = http("POST", "/auth/token", {"grant_type": "authorization_code", "code": r["auth_code"],
                                          "client_id": CLIENT}, form=True)
    if s != 200 or not isinstance(tok, dict):
        raise SystemExit(f"no token: {s} {tok}")
    for step, body in (("core_config", {}), ("analytics", {}),
                       ("integration", {"client_id": CLIENT, "redirect_uri": CLIENT + "?auth_callback=1"})):
        s, r = http("POST", "/api/onboarding/" + step, body, token=tok["access_token"])
        if s != 200:
            raise SystemExit(f"onboarding step {step} failed: {s} {r}")
    return tok


def image_version() -> str:
    r = subprocess.run(["docker", "run", "--rm", "-w", "/", "--entrypoint", "python3", IMAGE, "-c",
                        "from homeassistant.const import __version__ as v; print(v)"],
                       capture_output=True, text=True)
    return r.stdout.strip() or "unknown (" + (r.stderr.strip()[-200:] or "no output") + ")"


def make_calendar(token):
    """A local calendar through its config flow, the way the integrations page adds one."""
    s, r = http("POST", "/api/config/config_entries/flow",
                {"handler": "local_calendar", "show_advanced_options": False}, token=token)
    if s != 200 or not isinstance(r, dict) or r.get("type") != "form":
        raise SystemExit(f"local_calendar flow did not start: {s} {r}")
    print("    flow asks for:", json.dumps(r.get("data_schema")))
    data = {}
    for f in r.get("data_schema") or []:
        if f["name"] == "calendar_name":
            data["calendar_name"] = "Family Test"
        elif f.get("required") and "default" not in f:
            opts = [o[0] if isinstance(o, list) else o for o in (f.get("options") or [])]
            pick = [o for o in opts if "create" in str(o)] or opts
            if not pick:
                raise SystemExit(f"local_calendar asks for {f}; teach make_calendar about it")
            data[f["name"]] = pick[0]
    s, r = http("POST", f"/api/config/config_entries/flow/{r['flow_id']}", data, token=token)
    if s != 200 or not isinstance(r, dict) or r.get("type") != "create_entry":
        raise SystemExit(f"local_calendar flow did not finish: {s} {r}")


def setup_events(token):
    today = dt.datetime.now(ZoneInfo(TZ)).date()
    tomorrow = today + dt.timedelta(days=1)
    # All day today (never in the past until midnight) and timed tomorrow, so both shapes
    # of the API answer, {date} and {dateTime}, reach the card.
    for ev in ({"summary": TODAY_EVENT, "start_date": today.isoformat(), "end_date": tomorrow.isoformat()},
               {"summary": TOMORROW_EVENT, "start_date_time": f"{tomorrow} 09:30:00",
                "end_date_time": f"{tomorrow} 10:30:00"}):
        s, r = http("POST", "/api/services/calendar/create_event", dict(ev, entity_id=CAL), token=token)
        if s != 200:
            raise SystemExit(f"calendar.create_event failed: {s} {r}")
    start = dt.datetime.combine(today, dt.time(), ZoneInfo(TZ))
    q = urllib.parse.urlencode({"start": start.isoformat(), "end": (start + dt.timedelta(days=7)).isoformat()})
    s, r = http("GET", f"/api/calendars/{CAL}?{q}", token=token)
    print("    /api/calendars answers:", json.dumps(r))
    got = [e.get("summary") for e in r] if s == 200 and isinstance(r, list) else []
    check(TODAY_EVENT in got and TOMORROW_EVENT in got, f"{CAL} holds both events over the REST API ({s})")


# The frontend's root element; its hass property is the logged-in connection.
HA_EL = "document.querySelector('home-assistant')"
DEEP_INPUT = """(root, want) => {
  let hit = null;
  const walk = n => { if (!n || hit) return;
    if ((n.tagName === "INPUT" || n.tagName === "TEXTAREA") && n.value === want) { hit = n; return; }
    if (n.shadowRoot) walk(n.shadowRoot);
    for (const k of Array.from(n.children || [])) walk(k); };
  walk(root); return hit;
}"""


def browse(tok, shots: Path):
    try:
        from playwright.sync_api import Error as PWError, sync_playwright
    except ImportError:
        check(False, "playwright is installed (pip install playwright, then python -m playwright install chromium)")
        return
    page_errors: list[str] = []
    card_warnings: list[str] = []
    other: list[str] = []
    phase = ["start"]

    def on_error(e):
        where = next((l.strip() for l in (e.stack or "").splitlines()[1:] if l.strip()), "no stack")
        page_errors.append(f"[{phase[0]}] {e.message or e.name} at {where}")

    def on_console(m):
        if m.type not in ("warning", "error"):
            return
        line = f"[{phase[0]}] {m.type}: {m.text} ({m.location.get('url', '')})"
        (card_warnings if ("meadow:" in m.text or "family-dashboard-card:" in m.text) else other).append(line)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 800}, timezone_id=TZ, locale="en-GB")
        # What the frontend's token_storage keeps after a login, for this origin and client id.
        tokens = {"hassUrl": BASE, "clientId": CLIENT, "access_token": tok["access_token"],
                  "refresh_token": tok.get("refresh_token"), "token_type": "Bearer",
                  "expires_in": tok["expires_in"], "expires": int(time.time() * 1000) + tok["expires_in"] * 1000}
        ctx.add_init_script("try { if (!localStorage.getItem('hassTokens')) localStorage.setItem('hassTokens', %s); }"
                            " catch (e) { console.warn('ha_card: could not store the token', e); }"
                            % json.dumps(json.dumps(tokens)))
        page = ctx.new_page()
        page.on("pageerror", on_error)
        page.on("console", on_console)
        try:
            print("log in:")
            phase[0] = "log in"
            page.goto(BASE + "/", wait_until="domcontentloaded")
            page.wait_for_function(f"() => {{ const h = {HA_EL}; return !!(h && h.hass && h.hass.user && h.hass.connection); }}",
                                   timeout=60000)
            check(True, f"the frontend is logged in with the injected token ({page.url})")

            def ws(msg):
                return page.evaluate(f"m => {HA_EL}.hass.callWS(m)", msg)

            print("dashboard:")
            phase[0] = "dashboard"
            ws({"type": "lovelace/resources/create", "res_type": "module", "url": RESOURCE})
            check(any(r.get("url") == RESOURCE for r in ws({"type": "lovelace/resources"})),
                  f"{RESOURCE} is a Lovelace module resource")
            ws({"type": "lovelace/dashboards/create", "url_path": DASH, "title": "Family test", "mode": "storage",
                "show_in_sidebar": True, "require_admin": False})
            ws({"type": "lovelace/config/save", "url_path": DASH,
                "config": {"views": [{"title": "Family", "path": "home", "type": "panel", "cards": [CARD]}]}})
            s, _ = http("GET", RESOURCE)
            check(s == 200, f"/local serves the built card ({s})")

            page.goto(f"{BASE}/{DASH}/home", wait_until="domcontentloaded")
            card = page.locator("family-dashboard-card")
            card.wait_for(state="attached", timeout=60000)
            check(page.evaluate("() => !!customElements.get('family-dashboard-card')"),
                  "family-dashboard-card is a defined custom element")
            sized = poll(lambda: card.evaluate("""el => { const sr = el.shadowRoot, c = sr && sr.querySelector('canvas#world'),
                w = sr && sr.querySelector('.fd'); if (!c || !w || !c.style.width) return null;
                const r = c.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && Math.round(r.width) === w.clientWidth ? [Math.round(r.width), Math.round(r.height)] : null; }"""),
                         30)
            check(bool(sized), f"the world canvas is sized to the card ({sized and '%dx%d' % tuple(sized)})")
            colours = poll(lambda: card.evaluate("""el => { const c = el.shadowRoot.querySelector('canvas#world');
                const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, seen = new Set();
                for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
                return seen.size > 20 ? seen.size : 0; }"""), 20)
            check(bool(colours), f"the meadow is drawn on it ({colours} colours in a sample)")
            check(page.locator("hui-error-card").count() == 0, "Home Assistant shows no error card")

            print("Alex's card:")
            phase[0] = "Alex's card"
            opened = poll(lambda: card.evaluate("el => { const s = el.shadowRoot.querySelector('#scrim'), w = el.shadowRoot.querySelector('#who');"
                                                " return s && s.classList.contains('open') && w ? w.textContent : ''; }"), 20)
            check(opened == OWNER, f"open={OWNER} opens {OWNER}'s card ({opened!r})")

            def lists():
                return card.evaluate("el => (el.shadowRoot.querySelector('#lists') || {}).textContent || ''")

            def who():
                return card.evaluate("el => (el.shadowRoot.querySelector('#who') || {}).textContent || ''")

            def has_both():
                t = lists()
                return TODAY_EVENT in t and TOMORROW_EVENT in t

            ok = poll(has_both, 8)
            if not ok and card.evaluate("() => !!window.meadow"):
                # The calendar may have answered after the 0.9 s open: open the card again.
                print("    no events after the first open; opening the card again through window.meadow")
                ok = poll(lambda: card.evaluate(f"""() => {{ const t = window.meadow.fam.filter(f => f.person.name === {json.dumps(OWNER)})[0];
                    if (t) window.meadow.open(t); return true; }}""") and has_both(), 20, step=2)
            text = lists()
            check(TODAY_EVENT in text, f"today's event {TODAY_EVENT!r} is on {OWNER}'s card")
            check(TOMORROW_EVENT in text, f"tomorrow's event {TOMORROW_EVENT!r} is on {OWNER}'s card")
            if not ok:
                print("    #lists said:", text[:400])
            page.screenshot(path=str(shots / "card-open.png"))

            if not ok:
                print(f"    not checked: the {HOUSE} card, since {OWNER}'s never showed the events")
            elif card.evaluate("() => !!window.meadow"):
                card.evaluate(f"""() => window.meadow.open(window.meadow.fam.filter(f => f.person.name === {json.dumps(HOUSE)})[0])""")
                house = lists() if poll(lambda: who() == HOUSE, 5) else ""
                check(house and TODAY_EVENT not in house and TOMORROW_EVENT not in house,
                      f"the {HOUSE} card does not list {OWNER}'s events")
            else:
                print("    not checked: the household card (no window.meadow, so no ?dbg hook)")
            page.locator("family-dashboard-card #done").click()
            poll(lambda: not card.evaluate("el => el.shadowRoot.querySelector('#scrim').classList.contains('open')"), 5)
            page.wait_for_timeout(1000)
            page.screenshot(path=str(shots / "meadow.png"))

            print("editor:")
            phase[0] = "editor"
            tag = page.evaluate("""async cfg => {
              const ed = await customElements.get('family-dashboard-card').getConfigElement();
              const box = document.createElement('div'); box.id = 'fd-editor-test';
              box.style.cssText = 'position:fixed;left:0;top:0;bottom:0;width:600px;overflow:auto;z-index:10000;' +
                'background:var(--card-background-color,#fff);padding:16px;box-sizing:border-box';
              // Inside home-assistant, where HA opens its card editor dialog: newer pickers read
              // their translations from a Lit context that only that element provides.
              const ha = document.querySelector('home-assistant');
              (ha.shadowRoot || ha).appendChild(box);
              window.__fdChanges = [];
              ed.addEventListener('config-changed', e => window.__fdChanges.push(e.detail.config));
              ed.hass = document.querySelector('home-assistant').hass;
              ed.setConfig(cfg);
              box.appendChild(ed);
              window.__fdEditor = ed;
              return ed.localName;
            }""", CARD)
            check(tag == "family-dashboard-card-editor", f"getConfigElement() gives the editor ({tag})")
            forms = page.evaluate("""() => { const sr = window.__fdEditor.shadowRoot;
              return { ha: !!customElements.get('ha-form'), forms: sr.querySelectorAll('ha-form').length, plain: sr.querySelectorAll('.plain').length }; }""")
            check(forms["ha"] and forms["forms"] >= 3 and forms["plain"] == 0,
                  f"the editor uses Home Assistant's ha-form, not the plain fallback ({forms})")
            name_input = None
            for _ in range(60):
                h = page.evaluate_handle(f"() => ({DEEP_INPUT})(window.__fdEditor.shadowRoot, {json.dumps(OWNER)})")
                name_input = h.as_element()
                if name_input:
                    break
                page.wait_for_timeout(250)
            check(name_input is not None, f"ha-form renders {OWNER}'s name in a text field")
            if name_input:
                name_input.fill("Alexandra")
                changed = poll(lambda: page.evaluate(
                    "() => { const c = window.__fdChanges[window.__fdChanges.length - 1]; return c && c.people && c.people[0].name; }")
                    == "Alexandra", 5)
                check(changed, "typing a new name sends config-changed with it")
            page.wait_for_timeout(500)
            page.screenshot(path=str(shots / "editor.png"))
        except PWError as e:
            check(False, f"the browser part ran to the end: {str(e).splitlines()[0]}")
            try:
                page.screenshot(path=str(shots / "failure.png"))
            except PWError as e2:
                print("    no failure screenshot:", str(e2).splitlines()[0])
        finally:
            browser.close()

    check(not page_errors, "no uncaught page errors" + ("" if not page_errors else ":\n    " + "\n    ".join(page_errors[:10])))
    check(not card_warnings, "no meadow: or family-dashboard-card: warnings in the console"
          + ("" if not card_warnings else ":\n    " + "\n    ".join(card_warnings[:10])))
    if other:
        print(f"    other console warnings and errors ({len(other)}), not the card's:")
        for line in other[:12]:
            print("     ", line[:300])


def main() -> int:
    if not shutil.which("docker"):
        print("docker not found: the card smoke test did not run")
        return 1
    dist = ROOT / "dist"
    if not (dist / "family-dashboard.js").is_file():
        print("dist/family-dashboard.js is missing: run npm run build")
        return 1
    print(f"Home Assistant {image_version()} in {IMAGE}")
    shots = Path(os.environ.get("HA_CARD_SHOTS") or tempfile.mkdtemp(prefix="ha-card-shots-"))
    shots.mkdir(parents=True, exist_ok=True)
    cfg = Path(tempfile.mkdtemp(prefix="ha-card-"))
    shutil.copy(ROOT / "tests/ha-card/configuration.yaml", cfg / "configuration.yaml")
    (cfg / "www/family-dashboard").mkdir(parents=True)
    subprocess.run(["docker", "run", "-d", "--name", NAME, "-p", f"127.0.0.1:{PORT}:8123",
                    "-v", f"{cfg}:/config", "-v", f"{dist}:/config/www/family-dashboard:ro", IMAGE],
                   check=True, capture_output=True)
    try:
        print("setup:")
        tok = onboard()
        make_calendar(tok["access_token"])
        if not poll(lambda: http("GET", f"/api/states/{CAL}", token=tok["access_token"])[0] == 200, 30, step=1):
            raise SystemExit(f"{CAL} never appeared")
        setup_events(tok["access_token"])
        browse(tok, shots)
    finally:
        # The container's own output, warnings and up (configuration.yaml's logger), kept for
        # the CI artifact. An empty one says so rather than leaving an empty file.
        logs = subprocess.run(["docker", "logs", NAME], capture_output=True, text=True)
        (shots / "home-assistant.log").write_text(
            (logs.stdout + logs.stderr) or f"docker logs printed nothing (exit {logs.returncode})\n", encoding="utf-8")
        subprocess.run(["docker", "rm", "-f", NAME], capture_output=True)
        shutil.rmtree(cfg, ignore_errors=True)
    print("    screenshots and the Home Assistant log are in", shots)
    print(f"{passes} passed, {len(fails)} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
