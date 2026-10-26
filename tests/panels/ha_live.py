#!/usr/bin/env python3
"""Runs the room panel automations in a real, throwaway Home Assistant.

Starts the official container with tests/panels/ha/configuration.yaml, the
shipped homeassistant/panels.example.yaml and scripts.example.yaml, onboards a
test user, then drives the letter and broadcast flows over the REST API the
way a phone, a panel and the wall card would, and checks the helpers after
each step. Nothing here touches a real Home Assistant.

  python3 tests/panels/ha_live.py            needs docker; pulls the image once
  HA_IMAGE=ghcr.io/home-assistant/home-assistant:2026.10 python3 tests/panels/ha_live.py

Stdlib only. Exit status 1 on any failed step.
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


def send(token, to, sender, text):
    return call(token, "script", "family_send_panel_letter", {"to": to, "sender": sender, "text": text})


def main() -> int:
    if not shutil.which("docker"):
        print("docker not found: the live Home Assistant check did not run")
        return 1
    cfg = Path(tempfile.mkdtemp(prefix="ha-panels-"))
    shutil.copy(ROOT / "tests/panels/ha/configuration.yaml", cfg / "configuration.yaml")
    shutil.copy(ROOT / "homeassistant/panels.example.yaml", cfg / "panels.example.yaml")
    shutil.copy(ROOT / "homeassistant/scripts.example.yaml", cfg / "scripts.example.yaml")

    print("check_config:")
    cc = subprocess.run(["docker", "run", "--rm", "-v", f"{cfg}:/config", "--entrypoint", "python3", IMAGE,
                         "-m", "homeassistant", "--script", "check_config", "-c", "/config"],
                        capture_output=True, text=True)
    out = cc.stdout + cc.stderr
    ok = cc.returncode == 0 and "Failed config" not in out and "ERROR" not in out
    check(ok, "check_config passes" + ("" if ok else ":\n" + out[-3000:]))

    subprocess.run(["docker", "run", "-d", "--name", NAME, "-p", f"127.0.0.1:{PORT}:8123",
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
        today = state(token, "sensor.panel_today") or ""
        print("    panel_today:", today.replace("\n", " / "))
        check("All day Bin day" in today and "Swimming (Kid A)" in today and "Long gone" not in today,
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

        s, logs = http("GET", "/api/error_log", token=token)
        text = logs if isinstance(logs, str) else ""
        bad = [l for l in text.splitlines() if ("ERROR" in l or "TemplateError" in l or "Error rendering" in l)
               and "family_send_panel_letter" not in l and "Unknown recipient" not in l
               and "Empty letter" not in l]
        check(not bad, "no unexpected errors in the log" + ("" if not bad else ":\n    " + "\n    ".join(bad[:15])))
    finally:
        subprocess.run(["docker", "rm", "-f", NAME], capture_output=True)
        shutil.rmtree(cfg, ignore_errors=True)
    print(f"{passes} passed, {len(fails)} failed")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
