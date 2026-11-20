#!/usr/bin/env python3
"""The built card on /demo/ in Chromium, at the sizes it meets: a 1280x800 wall panel, an iPad
or the panel with Home Assistant's sidebar open (1024x768), a tablet on its side (800x1280) and
a phone (400x800). Then another scene at night, a 1024 window widened to 1280, and the demo
switched on in a real dashboard (a stand-in hass).

tests/check.mjs boots the engine on a stub page, so nothing there lays out the HUD or presses a
key. This serves the repo root over HTTP, opens /demo/ with the extras and an announcement, and
checks each case:

  no uncaught page errors, and no console errors or meadow:/family-dashboard-card: warnings;
  the status line is clear on the demo page, and says "Demo data..." with a hass;
  the clock, date, Next line, corner hint, status line, tiles, countdown and due chips and the
  announcement banner do not overlap, none runs off the card, and no chip is cut;
  the banner's text column is wider than 150 px, and a tap beside the banner reaches the scene;
  Tab from the top of the page reaches a person's button, whose ring is not under the HUD; Enter
  opens that person's card with focus on Done, and Escape closes it, hides the popup and hands
  focus back to the button.

Then the dialog on its own at 1280x800, on the seaside (a letter comes by airmail there): Enter
on a letter's Got it leaves focus on Done, so Escape still closes the card; and on the School
card, longer than its window, Tab reaches the lists and Page Down scrolls them.

The context asks for reduced motion: with it the announcement goes straight to the banner, where
otherwise the town crier holds it on the canvas for 20 seconds or more first. The HUD is HTML
over the canvas, so its layout is the same either way.

Screenshots go to DEMO_SMOKE_SHOTS (default: a new temp folder). Exit status 1 on any failure.

  python3 tests/demo/smoke.py         needs playwright (pip, in a venv) and its Chromium
"""
from __future__ import annotations

import functools
import os
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# A Wednesday in September has the longest date line. The ?announce= hook lands 2.5 s after boot,
# over the demo's own (older) announcement.
QUERY = "?date=2026-09-30&extras&announce=Dinner%27s%20at%20six%20tonight&"
DAY = "hour=10"
# Each case: viewport, hooks, a viewport to resize to once it is up, and whether to hand it a hass.
# The resize is a 1024 card widened to 1280 (a sidebar closing): the chips fitted to the long row
# of the narrow layout must be fitted again to the gap of the wide one. With a hass the demo says
# it is the demo, and that long status line must wrap in the corner, clear of the countdowns.
DEMO_IN_HA = "Demo data. Turn off Demo cast in the card editor to see your calendars"
HASS = "document.querySelector('family-dashboard-card').hass = { states: {}, callApi: () => Promise.resolve([]), callService: () => Promise.resolve() }"
CASES = [((1280, 800), DAY, None, False), ((1024, 768), DAY, None, False), ((800, 1280), DAY, None, False), ((400, 800), DAY, None, False),
         ((1024, 768), "scene=seaside&hour=21.5", None, False), ((1024, 768), DAY, (1280, 800), False), ((1280, 800), DAY, None, True)]
SR = "document.querySelector('family-dashboard-card').shadowRoot"
ACTIVE = f"(() => {{ const a = {SR}.activeElement; return a ? (a.getAttribute('data-k') || a.id || a.tagName) : null; }})()"
# Every visible HUD box: [name, left, top, right, bottom], and each chip's row for the cut check.
BOXES = """() => { const r = %s, out = [], cut = [];
  const box = (n, e) => { if (!e) return; const b = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (b.width < 1 || b.height < 1 || s.visibility === 'hidden' || s.display === 'none') return;   // Next fades out under the plane: counted anyway
    out.push([n, b.left, b.top, b.right, b.bottom]); };
  ['clock', 'date', 'next', 'hint', 'status'].forEach(id => { const e = r.getElementById(id); if (e && e.textContent.trim()) box(id, e); });
  r.querySelectorAll('.tile').forEach((e, i) => box('tile ' + i, e));
  ['dates', 'due'].forEach(id => { const row = r.getElementById(id); if (!row) return; const rb = row.getBoundingClientRect();
    row.querySelectorAll('.dchip').forEach((e, i) => { box(id + ' chip ' + i, e); const b = e.getBoundingClientRect();
      if (b.right > rb.right + 1 && b.left < rb.right) cut.push(id + ' chip ' + i + ' (' + e.textContent + ')'); }); });
  box('announcement', r.querySelector('.ann'));
  const ax = r.querySelector('.ann .ax');
  // A tap in the banner's row but beside the banner lands on the scene, not on the row.
  const an = r.getElementById('announce'), bn = r.querySelector('.ann');
  let beside = null;
  if (an && bn) { const a = an.getBoundingClientRect(), b = bn.getBoundingClientRect();
    if (b.left - a.left > 12) { const e = r.elementFromPoint(a.left + 6, (b.top + b.bottom) / 2); beside = e ? e.id || e.className || e.tagName : 'nothing'; } }
  return { boxes: out, cut: cut, axW: ax ? ax.clientWidth : null, axText: ax ? ax.textContent : null, beside: beside, W: innerWidth }; }""" % SR
# The focused key: its ring or pill, as a box.
KEYBOX = """() => { const a = %s.activeElement; if (!a) return null; const b = a.getBoundingClientRect(); return ['focus ring', b.left, b.top, b.right, b.bottom]; }""" % SR

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


def overlaps(boxes):
    hits = []
    for i, a in enumerate(boxes):
        for b in boxes[i + 1:]:
            if a[1] < b[3] - 0.5 and b[1] < a[3] - 0.5 and a[2] < b[4] - 0.5 and b[2] < a[4] - 0.5:
                hits.append(f"{a[0]} and {b[0]}")
    return hits


def serve():
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def run_case(browser, base, size, extra, then, hass, shots):
    w, h = size
    tag = f"{w}x{h}" + ("" if extra == DAY else "-" + extra.replace("&", "-").replace("=", "-").replace(".", "_")) + (f"-to-{then[0]}x{then[1]}" if then else "") + ("-in-ha" if hass else "")
    print(f"{tag}:")
    errors: list[str] = []
    ctx = browser.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"page error: {e.message}"))
    page.on("console", lambda m: errors.append(f"console {m.type}: {m.text}")
            if m.type == "error" or (m.type == "warning" and ("meadow:" in m.text or "family-dashboard-card:" in m.text)) else None)
    try:
        page.goto(base + QUERY + extra)
        page.wait_for_function(f"() => {{ const a = {SR} && {SR}.querySelector('.ann .ax'); return a && a.textContent === \"Dinner's at six tonight\"; }}",
                               timeout=15000)
        page.wait_for_timeout(1500)                       # one more HUD tick, so the rows are laid out round the banner
        if then:
            page.set_viewport_size({"width": then[0], "height": then[1]})
            page.wait_for_timeout(1500)
        if hass:
            page.evaluate(HASS)
            page.wait_for_timeout(1500)
            st = page.evaluate(f"{SR}.getElementById('status').textContent")
            check(st == DEMO_IN_HA, f"the demo in Home Assistant says so on the status line ({st!r})")
        else:
            st = page.evaluate(f"{SR}.getElementById('status').textContent")
            check(st == "", f"the demo page's status line is clear ({st!r})")
        m = page.evaluate(BOXES)
        page.screenshot(path=str(shots / f"hud-{tag}.png"))
        hits = overlaps(m["boxes"])
        check(not hits, "no two HUD boxes overlap" + (": " + ", ".join(hits) if hits else f" ({len(m['boxes'])} boxes)"))
        off = [b[0] for b in m["boxes"] if b[1] < -0.5 or b[3] > m["W"] + 0.5]
        check(not off, "nothing runs off the card" + (": " + ", ".join(off) if off else ""))
        check(not m["cut"], "no chip is cut" + (": " + ", ".join(m["cut"]) if m["cut"] else ""))
        check(m["axW"] is not None and m["axW"] > 150, f"the announcement's text column is over 150 px ({m['axW']} px)")
        if m["beside"] is not None:
            check(m["beside"] == "world", f"a tap beside the banner reaches the scene (it hit {m['beside']})")

        # The keyboard: from the top of the page to a person's button, open, close.
        who = None
        for _ in range(4):
            page.keyboard.press("Tab")
            k = page.evaluate(ACTIVE)
            if k and k.startswith("p:"):
                who = k[2:]
                break
        check(who, f"Tab reaches a person's button ({who})")
        if who:
            page.wait_for_timeout(200)
            ring = page.evaluate(KEYBOX)
            hidden = overlaps([ring] + m["boxes"])
            hidden = [x for x in hidden if x.startswith("focus ring")]
            check(ring and not hidden, "the focused button's ring is not under the HUD" + (": " + ", ".join(hidden) if hidden else ""))
            page.screenshot(path=str(shots / f"focus-{tag}.png"))
            page.keyboard.press("Enter")
            page.wait_for_function(f"() => {SR}.getElementById('scrim').classList.contains('open')", timeout=3000)
            page.wait_for_timeout(500)
            opened = page.evaluate(f"{SR}.getElementById('who').textContent")
            check(opened == who and page.evaluate(ACTIVE) == "done", f"Enter opens {who}'s card with focus on Done (got {opened}, focus on {page.evaluate(ACTIVE)})")
            page.screenshot(path=str(shots / f"open-{tag}.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            closed = page.evaluate(f"() => {{ const s = {SR}.getElementById('scrim'); return !s.classList.contains('open') && getComputedStyle(s).visibility === 'hidden'; }}")
            back = page.evaluate(ACTIVE)
            check(closed and back == "p:" + who, f"Escape closes it, hides the popup and hands focus back to the button (focus on {back})")
    except Exception as e:                                # a timeout or a closed page: fail this size and go on to the next
        check(False, f"the page ran to the end: {str(e).splitlines()[0]}")
        try:
            page.screenshot(path=str(shots / f"failure-{tag}.png"))
        except Exception as e2:
            print("    no failure screenshot:", str(e2).splitlines()[0])
    finally:
        ctx.close()
    check(not errors, "no page errors and no card warnings" + ("" if not errors else ":\n    " + "\n    ".join(errors[:10])))


# The focused element inside the card: its data-k, id or class, or "outside" when focus has left it.
IN_CARD = f"""(() => {{ const r = {SR}, a = r.activeElement; if (!a) return 'outside';
  return r.getElementById('card').contains(a) ? (a.id || a.className || a.tagName) : (a.getAttribute('data-k') || 'outside'); }})()"""


def run_dialog(browser, base, shots):
    """The popup as a keyboard meets it: a letter's Got it, and a card longer than its window."""
    print("dialog 1280x800:")
    errors: list[str] = []
    ctx = browser.new_context(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"page error: {e.message}"))
    page.on("console", lambda m: errors.append(f"console {m.type}: {m.text}")
            if m.type == "error" or (m.type == "warning" and ("meadow:" in m.text or "family-dashboard-card:" in m.text)) else None)
    key = lambda k: f"{SR}.querySelector('[data-k=\"{k}\"]')"
    try:
        page.goto(base + "?scene=seaside&hour=10&pletter=Parent%202%7CKid%201%7CCoats%20on")
        page.wait_for_function(f"() => {{ const b = {SR} && {key('p:Parent 2')}; return b && /letter waiting/.test(b.getAttribute('aria-label')); }}", timeout=15000)
        page.evaluate(f"{key('p:Parent 2')}.focus()")
        page.keyboard.press("Enter")
        page.wait_for_function(f"() => {SR}.getElementById('scrim').classList.contains('open')", timeout=3000)
        page.wait_for_timeout(300)
        seen = []
        for _ in range(2):
            page.keyboard.press("Tab")
            seen.append(page.evaluate(IN_CARD))
        check(seen == ["lists", "pgot"], f"Tab from Done goes to the lists, then the letter's Got it ({', '.join(seen)})")
        page.keyboard.press("Enter")
        page.wait_for_timeout(200)
        on, cleared = page.evaluate(IN_CARD), page.evaluate(f"!!{SR}.querySelector('.post.done')")
        check(cleared and on == "done", f"Enter on Got it clears the letter and leaves focus on Done (focus on {on})")
        page.screenshot(path=str(shots / "dialog-got-it.png"))
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        shut = page.evaluate(f"!{SR}.getElementById('scrim').classList.contains('open')")
        check(shut and page.evaluate(IN_CARD) == "p:Parent 2", "then Escape closes the card and focus goes back to the button")

        page.evaluate(f"{key('school')}.focus()")
        page.keyboard.press("Enter")
        page.wait_for_function(f"() => {SR}.getElementById('scrim').classList.contains('open') && {SR}.getElementById('who').textContent === 'School'", timeout=3000)
        page.wait_for_timeout(300)
        lists = f"{SR}.getElementById('lists')"
        tall = page.evaluate(f"[{lists}.scrollHeight, {lists}.clientHeight]")
        check(tall[0] > tall[1], f"the School card is longer than its window ({tall[0]} px in {tall[1]})")
        page.keyboard.press("Tab")
        on = page.evaluate(IN_CARD)
        page.keyboard.press("PageDown")
        page.wait_for_timeout(300)
        top = page.evaluate(f"{lists}.scrollTop")
        check(on == "lists" and top > 0, f"Tab from Done reaches the lists and Page Down scrolls them (focus on {on}, scrolled {top} px)")
        page.screenshot(path=str(shots / "dialog-scrolled.png"))
        page.keyboard.press("Escape")
    except Exception as e:
        check(False, f"the dialog case ran to the end: {str(e).splitlines()[0]}")
        try:
            page.screenshot(path=str(shots / "failure-dialog.png"))
        except Exception as e2:
            print("    no failure screenshot:", str(e2).splitlines()[0])
    finally:
        ctx.close()
    check(not errors, "no page errors and no card warnings" + ("" if not errors else ":\n    " + "\n    ".join(errors[:10])))


def main() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("playwright is not installed (pip install playwright, then python -m playwright install chromium)")
        return 1
    if not (ROOT / "dist/family-dashboard.js").is_file():
        print("dist/family-dashboard.js is missing: run npm run build")
        return 1
    shots = Path(os.environ.get("DEMO_SMOKE_SHOTS") or tempfile.mkdtemp(prefix="demo-smoke-"))
    shots.mkdir(parents=True, exist_ok=True)
    httpd = serve()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/demo/"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            try:
                for size, extra, then, hass in CASES:
                    run_case(browser, base, size, extra, then, hass, shots)
                run_dialog(browser, base, shots)
            finally:
                browser.close()
    finally:
        httpd.shutdown()
    print("    screenshots are in", shots)
    print(f"{passes} passed, {len(fails)} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
