#!/usr/bin/env python3
"""Runs the room panel automations in a real, throwaway Home Assistant.

Starts the official container with tests/panels/ha/configuration.yaml, the
shipped homeassistant/panels.example.yaml, panels-kitchen.example.yaml and
scripts.example.yaml, onboards a test user, then drives the letter, broadcast,
light tile, light page and timer flows over the REST API the way a phone, a
panel and the wall card would, and checks the helpers, the lights, the
panel_lights summary and the panel sensors after each step. A small HTTP server on this machine stands in for the speech
service the timer alert posts to, so the test sees the words that would be
spoken. Nothing here touches a real Home Assistant.

  python3 tests/panels/ha_live.py            needs docker; pulls the image once
  HA_IMAGE=ghcr.io/home-assistant/home-assistant:2026.10 python3 tests/panels/ha_live.py

Stdlib only. Exit status 1 on any failed step.
"""
from __future__ import annotations

import datetime as dt
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IMAGE = os.environ.get("HA_IMAGE", "ghcr.io/home-assistant/home-assistant:stable")
PORT = int(os.environ.get("HA_PORT", "18123"))
BASE = f"http://127.0.0.1:{PORT}"
CLIENT = BASE + "/"
NAME = f"family-panels-test-{os.getpid()}"

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


def onboard():
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
    return tok["access_token"]


def state(token, eid):
    s, r = http("GET", f"/api/states/{eid}", token=token)
    return r["state"] if s == 200 else None


def call(token, domain, service, data):
    return http("POST", f"/api/services/{domain}/{service}", data, token=token)


def fire(token, event, data):
    return http("POST", f"/api/events/{event}", data, token=token)


def log_has(token, text):
    _, log = http("GET", "/api/error_log", token=token)
    return isinstance(log, str) and text in log


def settle(seconds=1.5):
    time.sleep(seconds)


def wait_for(token, eid, pred, seconds=90):
    """Poll an entity until pred(state) holds; the trigger-based sensors
    update on the minute, so a first value can take up to a minute."""
    s = None
    for _ in range(seconds):
        s = state(token, eid)
        if s is not None and pred(s):
            return s
        time.sleep(1)
    return s


def attr(token, eid, name):
    s, r = http("GET", f"/api/states/{eid}", token=token)
    return (r.get("attributes") or {}).get(name) if s == 200 and isinstance(r, dict) else None


class Speech(BaseHTTPRequestHandler):
    """Stands in for the speech service: records each POSTed {"text": ...}."""
    said: list[str] = []

    def do_POST(self):  # noqa: N802
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try:
            Speech.said.append(json.loads(body)["text"])
        except (ValueError, KeyError, TypeError):
            Speech.said.append("<unreadable: %r>" % body[:80])
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass


def speech_server():
    srv = ThreadingHTTPServer(("0.0.0.0", 0), Speech)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def heard(text, seconds=10):
    for _ in range(seconds * 2):
        if text in Speech.said:
            return True
        time.sleep(0.5)
    return False


def send(token, to, sender, text):
    return call(token, "script", "family_send_panel_letter", {"to": to, "sender": sender, "text": text})


def main() -> int:
    if not shutil.which("docker"):
        print("docker not found: the live Home Assistant check did not run")
        return 1
    cfg = Path(tempfile.mkdtemp(prefix="ha-panels-"))
    shutil.copy(ROOT / "tests/panels/ha/configuration.yaml", cfg / "configuration.yaml")
    shutil.copy(ROOT / "homeassistant/panels.example.yaml", cfg / "panels.example.yaml")
    shutil.copy(ROOT / "homeassistant/panels-kitchen.example.yaml", cfg / "panels-kitchen.example.yaml")
    shutil.copy(ROOT / "homeassistant/scripts.example.yaml", cfg / "scripts.example.yaml")
    srv = speech_server()
    port = srv.server_address[1]
    (cfg / "secrets.yaml").write_text(
        f'family_panel_say_url: "http://host.docker.internal:{port}/api/say"\n', encoding="utf-8")

    print("check_config:")
    cc = subprocess.run(["docker", "run", "--rm", "-v", f"{cfg}:/config", "--entrypoint", "python3", IMAGE,
                         "-m", "homeassistant", "--script", "check_config", "-c", "/config"],
                        capture_output=True, text=True)
    out = cc.stdout + cc.stderr
    ok = cc.returncode == 0 and "Failed config" not in out and "ERROR" not in out
    check(ok, "check_config passes" + ("" if ok else ":\n" + out[-3000:]))

    subprocess.run(["docker", "run", "-d", "--name", NAME, "-p", f"127.0.0.1:{PORT}:8123",
                    "--add-host", "host.docker.internal:host-gateway",
                    "-v", f"{cfg}:/config", IMAGE], check=True, capture_output=True)
    try:
        token = onboard()
        for _ in range(60):
            if state(token, "script.family_send_panel_letter") is not None:
                break
            time.sleep(1)
        settle(5)

        print("sending:")
        s, r = send(token, "Kid A", "Parent 1", "Tea's at six")
        check(s == 200, f"send to 'Kid A' accepted ({s})")
        settle()
        check(state(token, "input_text.letter_kid_a") == "Parent 1|Tea's at six", "letter_kid_a holds 'from|text'")
        check(state(token, "input_text.family_letter") == "Kid A: From Parent 1: Tea's at six",
              "copied to the postie in the card's 'Name: text' format")
        sent = state(token, "input_datetime.letter_kid_a_sent")
        try:
            age = abs((dt.datetime.now() - dt.datetime.strptime(sent, "%Y-%m-%d %H:%M:%S")).total_seconds())
        except (TypeError, ValueError):
            age = 1e9
        check(age < 6 * 3600 + 120, f"letter_kid_a_sent set to now-ish ({sent})")

        # A refused send still answers 200 over REST: the refusal is the
        # unchanged helper and the line in the log, so check both.
        send(token, "kid_z", "Parent 1", "Hi")
        settle()
        check(state(token, "input_text.family_letter") == "Kid A: From Parent 1: Tea's at six"
              and log_has(token, 'no child "kid_z"'), "unknown recipient refused, and the log names it")
        send(token, "kid_b", "Parent 1", "   ")
        settle()
        check(state(token, "input_text.letter_kid_b") == "unknown" and log_has(token, "was empty; nothing sent"),
              "empty letter refused, and the log says so")
        send(token, "kid_b", "Pa|rent", "42")
        settle()
        check(state(token, "input_text.letter_kid_b") == "Pa/rent|42", "a '|' in the sender is replaced; '42' stays text")
        check(state(token, "input_text.family_letter") == "Kid B: From Pa/rent: 42",
              "the postie holds the newest letter (one slot, the optional bridge)")

        print("read on the panel:")
        fire(token, "esphome.family_letter_read", {"child": "kid_a", "sent": "2001-01-01 00:00:00"})
        settle()
        check(state(token, "input_text.letter_kid_a") == "Parent 1|Tea's at six",
              "a Done for an older letter keeps the newer one")
        fire(token, "esphome.family_letter_read", {"child": "kid_a", "sent": sent})
        settle()
        check(state(token, "input_text.letter_kid_a") == "", "Done empties letter_kid_a")
        check(state(token, "input_text.family_letter") == "Kid B: From Pa/rent: 42",
              "Kid A's Done leaves Kid B's letter in the postie")
        send(token, "kid_a", "Parent 1", "Second one")
        settle()
        sent2 = state(token, "input_datetime.letter_kid_a_sent")
        fire(token, "esphome.family_letter_read", {"child": "kid_a", "sent": sent2})
        settle()
        check(state(token, "input_text.letter_kid_a") == "" and state(token, "input_text.family_letter") == "",
              "Done empties the postie copy of its own letter")
        fire(token, "esphome.family_letter_read", {"child": "nobody", "sent": ""})
        settle()
        check(state(token, "input_text.letter_kid_b") == "Pa/rent|42", "a Done for an unknown child changes nothing")

        print("read on the wall card:")
        send(token, "kid_a", "", "Shoes by the door")
        settle()
        check(state(token, "input_text.family_letter") == "Kid A: Shoes by the door", "no sender: postie copy has none")
        call(token, "input_text", "set_value", {"entity_id": "input_text.family_letter", "value": ""})
        settle()
        check(state(token, "input_text.letter_kid_a") == "", "card clearing the postie clears the panel letter")
        send(token, "kid_a", "Parent 2", "Keep me")
        settle()
        call(token, "input_text", "set_value", {"entity_id": "input_text.family_letter", "value": "Kid B: something else"})
        call(token, "input_text", "set_value", {"entity_id": "input_text.family_letter", "value": ""})
        settle()
        check(state(token, "input_text.letter_kid_a") == "Parent 2|Keep me",
              "clearing a different postie letter leaves the panel letter alone")

        print("expiry:")
        old = (dt.datetime.now() - dt.timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S")
        call(token, "input_datetime", "set_datetime", {"entity_id": "input_datetime.letter_kid_a_sent", "datetime": old})
        call(token, "automation", "trigger", {"entity_id": "automation.family_expire_old_room_panel_letters",
                                              "skip_condition": False})
        settle(2)
        check(state(token, "input_text.letter_kid_a") == "", "a five-day-old letter expires")
        check(state(token, "input_text.letter_kid_b") == "Pa/rent|42", "a fresh letter does not")

        print("kitchen presets:")
        fire(token, "esphome.family_panel_broadcast", {"message": "Something rude"})
        settle()
        check(state(token, "input_text.family_announcement") == "", "a message not on the list is not announced")
        fire(token, "esphome.family_panel_broadcast", {"message": "Dinner's ready"})
        settle(2)
        check(state(token, "input_text.family_announcement") == "20|Kitchen|Dinner's ready",
              "a preset is announced through script.family_announce")

        print("kitchen sensors:")
        wait_for(token, "sensor.panel_due", lambda s: s not in ("unknown", "unavailable"))
        wait_for(token, "sensor.panel_lunch_and_kit", lambda s: s not in ("unknown", "unavailable"))
        today = wait_for(token, "sensor.panel_today", lambda s: s not in ("unknown", "unavailable")) or ""
        print("    panel_today:", today.replace("\n", " / "))
        today_all = attr(token, "sensor.panel_today", "lines") or ""
        check(today.startswith("All day Bin day\n") and "Swimming (Kid A)" in today_all
              and today_all.index("club number 12") < today_all.index("Swimming")
              and "Long gone" not in today_all,
              "panel_today: all-day first, upcoming shown, long-past hidden, House unnamed")
        lunch = state(token, "sensor.panel_lunch_and_kit") or ""
        print("    panel_lunch_kit:", lunch.replace("\n", " / "))
        if dt.date.today().weekday() >= 5:
            check(lunch.startswith("No school today"), "panel_lunch_kit: weekend")
        else:
            check("Kid A: Bean chilli" in lunch and "Kid B: packed lunch" in lunch and "Kit: PE kit" in lunch,
                  "panel_lunch_kit: the chosen option, packed lunch from the choice helper, today's kit")
        due = state(token, "sensor.panel_due") or ""
        print("    panel_due:", due.replace("\n", " / "))
        check("Library books back (Kid A)" in due and "Trip form" in due and "Far away" not in due
              and "1 item(s) could not be read" in due,
              "panel_due: soon items in, far ones out, unreadable ones counted")
        for eid in ("sensor.panel_today", "sensor.panel_lunch_and_kit", "sensor.panel_due"):
            check(len(state(token, eid) or "") <= 255, f"{eid} fits in a state")
        lines = attr(token, "sensor.panel_today", "lines") or ""
        check("After-school club number 12" in lines and "After-school club number 12" not in today
              and today.rstrip().split("\n")[-1].endswith("more"),
              "panel_today: a long day is cut with '+N more' in the state and whole in the lines attribute")
        check(lines.split("\n")[:2] == today.split("\n")[:2], "panel_today: state and lines agree on the first lines")
        lunch_lines = attr(token, "sensor.panel_lunch_and_kit", "lines") or ""
        print("    panel_lunch_kit lines:", lunch_lines.replace("\n", " / "))
        if dt.date.today().weekday() < 5:
            check("Kid A lessons: Maths, Art" in lunch_lines and "History" not in lunch_lines,
                  "panel_lunch_and_kit: today's lessons from the timetable, in the week the anchor counts to")
        due_lines = attr(token, "sensor.panel_due", "lines") or ""
        check(due_lines == due, "panel_due: a short list is the same in the state and the lines attribute")

        print("strip and rain:")
        strip = wait_for(token, "sensor.panel_strip", lambda s: s not in ("unknown", "unavailable")) or ""
        print("    panel_strip:", strip.replace("\n", " / "))
        check("Bins out tonight: Black bin, Food" in strip, "panel_strip: bins the day before")
        check(strip.count("Printing 45%, done ") == 1, "panel_strip: the printer while it prints, with its end time")
        check(attr(token, "sensor.panel_strip", "lines") == strip, "panel_strip: lines attribute matches")
        call(token, "input_text", "set_value", {"entity_id": "input_text.test_bins", "value": "gone"})
        strip = wait_for(token, "sensor.panel_strip", lambda s: "Bins unavailable" in s, 20) or ""
        check("Bins unavailable (sensor.bin_collections)" in strip, "panel_strip: a missing bin sensor says so")
        call(token, "input_text", "set_value", {"entity_id": "input_text.test_bins", "value": "4"})
        strip = wait_for(token, "sensor.panel_strip", lambda s: "Bins" not in s, 20) or ""
        check("Bins" not in strip and "Printing" in strip, "panel_strip: bins four days off are left out")

        def rain_after(sensor_value, wet_hour):
            call(token, "input_text", "set_value", {"entity_id": "input_text.test_rain", "value": sensor_value})
            call(token, "input_text", "set_value", {"entity_id": "input_text.test_wet_hour", "value": str(wet_hour)})
            settle(1)
            fire(token, "family_panel_refresh", {})
            settle(2)
            return state(token, "sensor.panel_rain") or ""

        r1 = rain_after("raining", -1)
        check(r1 == "Raining", f"panel_rain: the rain sensor says raining ({r1!r})")
        r2 = rain_after("none", 2)
        want = (dt.datetime.now().replace(minute=0, second=0, microsecond=0) + dt.timedelta(hours=2)).strftime("%H:%M")
        check(r2 == f"Rain from {want}", f"panel_rain: a wet forecast hour two hours on ({r2!r}, want 'Rain from {want}')")
        r3 = rain_after("none", -1)
        check(r3 == "Dry, no rain due", f"panel_rain: dry sensor, dry forecast ({r3!r})")
        r4 = rain_after("none", 0)
        check(r4.startswith("Raining, dry from "), f"panel_rain: the forecast says this hour is wet ({r4!r})")

        print("light tiles:")

        def light(e):
            return state(token, e)

        fire(token, "esphome.family_panel_light", {"target": "kitchen", "action": "toggle", "panel": "panel-kitchen"})
        settle()
        check(light("light.kitchen") == "on", "toggle an allowed target turns it on")
        fire(token, "esphome.family_panel_light", {"target": "kitchen", "action": "toggle"})
        settle()
        check(light("light.kitchen") == "off", "toggle again turns it off")
        fire(token, "esphome.family_panel_light", {"target": "light.hall", "action": "toggle"})
        settle()
        check(light("light.hall") == "off" and log_has(token, 'lights "light.hall", which is not in light_targets'),
              "an entity id sent as the target is refused, and logged")
        fire(token, "esphome.family_panel_light", {"target": "attic", "action": "toggle"})
        settle()
        check(log_has(token, 'lights "attic", which is not in light_targets'), "an unknown target is refused, and logged")
        fire(token, "esphome.family_panel_light", {"target": "hall", "action": "turn_on"})
        settle()
        check(light("light.hall") == "off" and log_has(token, 'light action "turn_on"'),
              "an action other than toggle or off is refused")
        call(token, "input_boolean", "turn_on", {"entity_id": "input_boolean.lamp_kitchen"})
        settle()
        fire(token, "esphome.family_panel_light", {"target": "downstairs", "action": "toggle"})
        settle()
        check(light("light.kitchen") == "off" and light("light.living_room") == "off",
              "a group with any light on toggles to all off")
        fire(token, "esphome.family_panel_light", {"target": "downstairs", "action": "toggle"})
        settle()
        check(light("light.kitchen") == "on" and light("light.living_room") == "on",
              "a group with every light off toggles to all on")
        call(token, "input_boolean", "turn_on", {"entity_id": "input_boolean.lamp_hall"})
        for target in ("kitchen", "living_room", "hall", "landing"):
            fire(token, "esphome.family_panel_light", {"target": target, "action": "off"})
        settle(2)
        check(light("light.kitchen") == "off" and light("light.living_room") == "off" and light("light.hall") == "off",
              "All off (one off per tile) leaves every room off, a listed but missing light included")

        print("light page:")

        def num(e):
            try:
                return float(state(token, e))
            except (TypeError, ValueError):
                return None

        def lines():
            return attr(token, "sensor.panel_lights", "lines") or ""

        def line(target):
            return next((ln for ln in lines().split("\n") if ln.startswith(target + " ")), "")

        fire(token, "esphome.family_panel_light", {"target": "kitchen", "action": "on"})
        settle()
        check(light("light.kitchen") == "on", "the page's switch: on turns an allowed target on")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "brightness_pct": "72", "kelvin": "", "hue": "", "sat": ""})
        settle()
        check(num("input_number.kitchen_level") == 184, f"brightness 72% reaches the lamp as 184/255 ({num('input_number.kitchen_level')})")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "brightness_pct": "250"})
        settle()
        check(num("input_number.kitchen_level") == 255, "brightness 250 is clamped to 100%")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "kelvin": "1000"})
        settle()
        check(num("input_number.kitchen_mireds") == 500, f"kelvin 1000 is clamped up to the lamp's minimum, 2000 K ({num('input_number.kitchen_mireds')} mireds)")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "kelvin": "9000"})
        settle()
        check(num("input_number.kitchen_mireds") == 150, "kelvin 9000 is clamped down to the lamp's maximum")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "kelvin": "4000", "brightness_pct": "50"})
        settle()
        check(num("input_number.kitchen_mireds") == 250 and num("input_number.kitchen_level") == 128,
              "kelvin and brightness in one event both land")
        before = (num("input_number.kitchen_level"), num("input_number.kitchen_mireds"))
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "hue": "120", "sat": "50"})
        settle()
        check((num("input_number.kitchen_level"), num("input_number.kitchen_mireds")) == before
              and log_has(token, "A panel sent nothing light.kitchen can do"),
              "colour sent to a lamp without colour changes nothing, and the log says so")
        fire(token, "esphome.family_panel_light_set", {"target": "living_room", "hue": "400", "sat": "150"})
        settle()
        check(light("light.living_room") == "on" and num("input_number.living_room_hue") == 360 and num("input_number.living_room_sat") == 100,
              "hue 400 and sat 150 are clamped to 360 and 100 on the colour lamp")
        fire(token, "esphome.family_panel_light_set", {"target": "living_room", "hue": "210", "sat": "80", "brightness_pct": "0"})
        settle()
        check(num("input_number.living_room_hue") == 210 and num("input_number.living_room_sat") == 80 and num("input_number.living_room_level") == 3,
              "hue 210, sat 80 and brightness 0 (held up to 1%) land together")
        fire(token, "esphome.family_panel_light_set", {"target": "light.hall", "brightness_pct": "50"})
        settle()
        check(log_has(token, 'adjust "light.hall", which is not in light_hold'), "an entity id sent as the target is refused, and logged")
        fire(token, "esphome.family_panel_light_set", {"target": "attic", "brightness_pct": "50"})
        settle()
        check(log_has(token, 'adjust "attic", which is not in light_hold'), "an unknown target is refused, and logged")
        fire(token, "esphome.family_panel_light_set", {"target": "hall", "brightness_pct": "40"})
        settle()
        check(light("light.hall") == "off" and log_has(token, "A panel sent nothing light.hall can do"),
              "brightness sent to an on/off lamp changes nothing")
        fire(token, "esphome.family_panel_light_set", {"target": "kitchen", "brightness_pct": "abc"})
        settle()
        check(num("input_number.kitchen_level") == 128, "a brightness that is not a number is ignored")
        kl = line("kitchen")
        print("    panel_lights:", lines().replace("\n", " / "))
        check(kl.split() == ["kitchen", "on", "50", "4000", "2000", "6666", "bt", "-", "-"],
              f"panel_lights: the kitchen line says on, 50%, 4000 K, 2000..6666, bt ({kl!r})")
        lr = line("living_room")
        check(lr.split()[:2] == ["living_room", "on"] and lr.split()[6] == "btc" and lr.split()[7:] == ["210", "80"],
              f"panel_lights: the living room line says btc with hue 210 sat 80 ({lr!r})")
        check(line("hall").split() == ["hall", "off", "-", "-", "-", "-", "-", "-", "-"] or line("hall").split() == ["hall", "off", "-", "-", "-", "-", "b", "-", "-"],
              f"panel_lights: the hall line says off with no values ({line('hall')!r})")
        check(line("landing").split()[:2] == ["landing", "unavailable"], f"panel_lights: a missing lamp reads unavailable ({line('landing')!r})")
        check(line("kid_a_globe").split()[:2] == ["kid_a_globe", "unavailable"], "panel_lights: the kid lamps are listed too")
        check(state(token, "sensor.panel_lights") == "2", f"panel_lights state counts the lamps that are on ({state(token, 'sensor.panel_lights')!r})")
        fire(token, "esphome.family_panel_light", {"target": "kitchen", "action": "off"})
        fire(token, "esphome.family_panel_light", {"target": "living_room", "action": "off"})
        settle(2)
        check(line("kitchen").split()[1:4] == ["off", "-", "-"], "panel_lights: off drops the brightness and kelvin, keeps the range")
        burst = [{"target": "kitchen", "brightness_pct": str(p)} for p in range(10, 90, 10)]
        for b in burst:
            fire(token, "esphome.family_panel_light_set", b)
        settle(3)
        check(num("input_number.kitchen_level") in (round(p * 255 / 100) for p in range(10, 90, 10))
              and log_has(token, "Maximum number of runs exceeded"), "a burst of eight is queued six deep and the rest logged")

        print("timer alerts:")
        fire(token, "esphome.family_panel_timer_done", {"timer": "Oven", "slot": "1", "panel": "panel-kitchen"})
        check(heard("Oven timer is done"), f"a named timer is spoken through the rest_command ({Speech.said[-3:]})")
        fire(token, "esphome.family_panel_timer_done", {"timer": "Timer 2", "slot": "2"})
        check(heard("Timer 2 is done"), "a timer whose name says timer is not doubled")
        before = len(Speech.said)
        fire(token, "esphome.family_panel_timer_done", {"timer": "Open the garage door", "slot": "3"})
        check(heard("A kitchen timer is done") and not any("garage" in s for s in Speech.said[before:]),
              "a name not in timer_names is never spoken; a generic line is")
        check(log_has(token, "the panel sent a name not in timer_names"), "and the log says why")
        settle(1)
        check(len(Speech.said) == 3, f"exactly one utterance per event ({len(Speech.said)})")

        s, logs = http("GET", "/api/error_log", token=token)
        text = logs if isinstance(logs, str) else ""
        bad = [l for l in text.splitlines() if ("ERROR" in l or "TemplateError" in l or "Error rendering" in l)
               and "family_send_panel_letter" not in l and "Unknown recipient" not in l
               and "Empty letter" not in l and "Maximum number of runs exceeded" not in l]
        check(not bad, "no unexpected errors in the log" + ("" if not bad else ":\n    " + "\n    ".join(bad[:15])))
    finally:
        subprocess.run(["docker", "rm", "-f", NAME], capture_output=True)
        srv.shutdown()
        shutil.rmtree(cfg, ignore_errors=True)
    print(f"{passes} passed, {len(fails)} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
