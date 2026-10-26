# Room panels (optional)

Small ESP32 touchscreens for around the house, built with ESPHome. A panel in a child's room
shows a clock, the family announcement, and letters sent to that child from a phone, another
panel or an automation. The child taps the envelope, reads it, taps **Done**, and the letter is
gone from every screen. A kitchen panel shows the family's day and can send a few preset
announcements.

None of this is needed for the card. The panels and the card share Home Assistant helpers and
nothing else.

- [Pick a board](#pick-a-board)
- [Pick a profile](#pick-a-profile)
- [Set up Home Assistant](#set-up-home-assistant)
- [Flash a panel](#flash-a-panel)
- [Add another panel](#add-another-panel)
- [How a letter travels](#how-a-letter-travels)
- [Privacy and safety](#privacy-and-safety)
- [What has been tested](#what-has-been-tested)

## Pick a board

| Board | Screen | Touch | Chip | Rough price | Board file |
|---|---|---|---|---|---|
| Guition JC3248W535 | 3.5" 320x480 IPS | capacitive | ESP32-S3, 16 MB flash, 8 MB PSRAM | £12 to £20 | `guition_jc3248w535` |
| Guition JC2432W328C | 2.8" 320x240 IPS | capacitive | ESP32, 4 MB flash | £10 to £15 | `jc2432w328` |
| ESP32-2432S028R ("Cheap Yellow Display") | 2.8" 320x240 TFT | resistive | ESP32, 4 MB flash | £8 to £12 | `esp32_2432s028` |

The prices are rough guides before postage, not quotes; check a current listing.

**JC3248W535.** The better board, and the one the kitchen profile is laid out for. It runs in
portrait: the panel has no hardware rotation, and it only draws reliably when LVGL redraws the
whole frame (the board file sets `full_refresh`). Software rotation works (`rotation: "90"`, swap
`panel_width` and `panel_height`) at some cost in speed. USB-C, with a LiPo socket.

**JC2432W328C.** The cheap board to buy if you are buying new. Same size as the Cheap Yellow
Display with an IPS screen and capacitive touch that needs no calibration. The listing must say
**C**; the JC2432W328R is resistive.

**ESP32-2432S028R.** The cheapest, and fine for a child's room once calibrated. It ships with
three display chips on the same pins. The board file defaults to the ST7789V version, the one
with both a USB-C and a micro-USB socket (`cyd_model: ESP32-2432S028-7789`). For the
micro-USB-only ILI9341 version set `cyd_model: ESP32-2432S028`; for the ILI9342,
`ESP32-2432S028-9342`. A white, inverted or mirrored screen means the wrong model.

Power on the two-socket CYD: it browns out on a weak USB-C lead or a laptop port once Wi-Fi and
the backlight are on, and reboots in a loop. Use a 5 V 1 A (or better) wall supply and a short
cable, and try the micro-USB socket if USB-C keeps resetting.

Resistive touch needs calibrating per board. If a tap lands in the wrong place, set
`logger: level: DEBUG` for one build, tap each corner, read `x_raw` and `y_raw` from the log,
and set `touch_x_min`, `touch_x_max`, `touch_y_min` and `touch_y_max` in the device file.

## Pick a profile

| Profile | For | Shows | Needs in Home Assistant |
|---|---|---|---|
| `kid` | one child's room | clock, announcement, that child's letters | `input_text.letter_<child>` |
| `kitchen` | the shared family view | clock, announcement, today, lunch and kit, due soon, four preset buttons | `sensor.panel_today`, `sensor.panel_lunch_and_kit`, `sensor.panel_due` |
| `generic` | a hallway, a spare room | clock, announcement, one line of text from any sensor | any text sensor (`info_entity`) |

Every profile shows `input_text.family_announcement` read-only, the same helper the card's
announcement banner reads (`announcement_entity` changes it). Every panel goes dark between
`night_start` and `night_end` (21:00 to 07:00 by default); a tap at night lights it dimly for
`idle_timeout`. By day it dims to `idle_brightness` after `idle_timeout` untouched. A new letter
brightens a kid panel by day and leaves it dark at night.

A panel that cannot reach Home Assistant says `offline` under the date, and anything it has
never heard reads "Waiting for Home Assistant", so a stale or missing value never passes for an
empty day.

## Set up Home Assistant

The letters, the preset check and the kitchen's three sensors are one package:
[`homeassistant/panels.example.yaml`](../homeassistant/panels.example.yaml).

1. In `configuration.yaml`:

   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```

2. Copy `panels.example.yaml` to `/config/packages/family_panels.yaml`.
3. Change Kid A, Kid B and Kid C to your children (the slugs `kid_a`... are in the helper names,
   the `recipients` list and each panel's `child:`), and point `sensor.panel_lunch_and_kit` at
   your lunch sensors.
4. The kitchen presets need `script.family_announce` from
   [`scripts.example.yaml`](../homeassistant/scripts.example.yaml) and
   `input_text.family_announcement` from `configuration.example.yaml`.
5. Restart Home Assistant.

To send a letter, run `script.family_send_panel_letter` with `to` (a slug like `kid_a` or a
name like `Kid A`), `sender` and `text`. From a phone, that is a script tile, the Home Assistant
app's shortcuts, or an automation. [docs/07-room-panels.md](../docs/07-room-panels.md) has the
full contract.

## Flash a panel

You need ESPHome 2026.10 or later: the ESPHome Device Builder app in Home Assistant, or
`pip install esphome` in a virtual environment on any computer.

1. **Secrets.** In your ESPHome folder's `secrets.yaml`:

   ```yaml
   wifi_ssid: "your network"
   wifi_password: "your password"
   panel_kid_a_api_key: "paste a key here"
   ```

   One key per panel. Make one with `openssl rand -base64 32`, or copy the one the Device
   Builder generates for a new device. It encrypts the API and OTA updates both.
2. **The device file.** Copy [`examples/kid-a.yaml`](examples/kid-a.yaml) (or
   [`kitchen.yaml`](examples/kitchen.yaml)) into your ESPHome folder and set `name`,
   `friendly_name`, `child` and `api_key`. Pick the board file in the `board:` line. Pin `@main`
   to a release tag once yours works, so an update to this repo never changes a panel you did
   not rebuild.
3. **First flash over USB.** Plug the board into the computer running ESPHome with a data
   cable and run `esphome run kid-a.yaml` (or **Install**, then **Plug into this computer**, in
   the Device Builder). The two ESP32 boards usually have a CH340 USB serial chip; the JC3248W535
   uses the S3's own USB. If the port does not appear, hold **BOOT**, tap **RST**, release **BOOT**, and
   try again.
4. **Adopt it.** Home Assistant finds the panel under Settings, Devices and services, ESPHome.
   Paste the same API key when it asks. Leave **Allow the device to perform Home Assistant
   actions** off; no profile needs it.
5. **Later builds go over Wi-Fi.** `esphome run kid-a.yaml` offers the panel's address once it
   is online.

The panel has no fallback hotspot and no web page. If your Wi-Fi changes, edit `secrets.yaml`
and flash it over USB again.

## Add another panel

Copy a device file, give it a new `name`, a new `api_key` secret and, for a kid panel, the next
`child:`. For a new child, add `input_text.letter_<slug>` and `input_datetime.letter_<slug>_sent`
to the package and the slug to `recipients`, then restart Home Assistant. Anything in
`packages/base.yaml` or the board file can be overridden in the device file's `substitutions:`
(`night_start`, `day_brightness`, `cyd_model`, the kitchen's `preset_1` to `preset_4`).

The kitchen presets are checked by Home Assistant against `broadcast_presets` in the package.
Change both, word for word, or the button logs a warning and announces nothing.

## How a letter travels

1. Someone runs `script.family_send_panel_letter` with `to: kid_a`. The script slugifies `to`,
   refuses a child not in `recipients`, a missing helper or an empty text, and writes
   `Parent 1|Tea's at six` to `input_text.letter_kid_a` and the time to
   `input_datetime.letter_kid_a_sent`. Until card v1.8 it also copies the letter to the card's
   postie (`input_text.family_letter`) as `Kid A: From Parent 1: Tea's at six`, so the wall
   shows it too.
2. Kid A's panel sees the helper change, shows the red dot and brightens.
3. Kid A taps the envelope, reads it, taps **Done**. The panel fires
   `esphome.family_letter_read` with `child: kid_a` and the sent time it saw.
4. An automation empties `input_text.letter_kid_a` (and the postie copy if it is still there).
   Every screen drops it. If the sent time does not match, a newer letter arrived in between and
   stays.

If the letter is read on the wall card first, the card empties the postie and a second
automation clears the panel. A panel that was off or offline shows the letter when it comes
back, and a **Done** pressed while offline is sent again when the panel reconnects. Unread
letters older than `expire_days` (3) go at 03:30.

## Privacy and safety

- Each panel talks to Home Assistant over the encrypted native API and to nothing else: no
  `web_server`, no `http_request`, no captive portal, no cloud. Fonts are fetched once, at
  compile time, by the computer that builds the firmware.
- Plain text only. The panel draws text with its own font; there is no markup to inject.
- The logger runs at INFO, so letter text does not stream to anyone watching the logs.
- Home Assistant has no per-entity permissions: every Home Assistant user can run the script or
  type into a helper. Give accounts only to people you would let write to a child's room, and
  send letters through the script, which checks the recipient and the format. Panels cannot send
  letters; the kitchen panel can only send its four presets, and only ones Home Assistant has on
  its list.

## What has been tested

- `esphome config` passes for every board and profile pair (`tests/panels/matrix.sh`), and
  `esphome compile` builds the kid profile on the Cheap Yellow Display and the JC2432W328C and
  the kitchen profile on the JC3248W535 (ESPHome 2026.10.0).
- The letter parsing on the panel (compiled C++) and in Home Assistant (the Jinja) agree on one
  table of cases (`tests/panels/check.py`), and the package's script and automations run in a
  throwaway Home Assistant container (`tests/panels/ha_live.py`).
- Not tested on hardware from this repo: the screens, touch mapping and calibration, rotation,
  backlight levels, the night schedule on a real clock, and how the layouts look on glass. Treat
  the first flash of each board as the test.
