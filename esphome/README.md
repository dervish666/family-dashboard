# Room panels (optional)

Small ESP32 touchscreens for around the house, built with ESPHome. A panel in a child's room
shows a clock, the family announcement, and letters sent to that child from a phone, another
panel or an automation. The child taps the envelope, reads it, taps **Done**, and the letter is
gone from every screen. A kitchen panel shows the house over four pages: Home (clock,
announcement, bins, printer and rain, and the room light tiles with All off), Today (calendar,
lunch and kit, what is due), Timers (three timers with a chime, a "Timer done" card and a spoken
alert on the house speakers) and Announce (four preset announcements).

None of this is needed for the card. The panels and the card share Home Assistant helpers and
nothing else.

- [Pick a board](#pick-a-board)
- [Pick a profile](#pick-a-profile)
- [Options](#options)
- [Set up Home Assistant](#set-up-home-assistant)
- [Build and flash from a Mac](#build-and-flash-from-a-mac)
- [Back up a board first](#back-up-a-board-first)
- [Recovery](#recovery)
- [Add another panel](#add-another-panel)
- [How a letter travels](#how-a-letter-travels)
- [Privacy and safety](#privacy-and-safety)
- [What has been tested](#what-has-been-tested)

## Pick a board

| Board | Screen | Touch | Chip | Speaker | Board file |
|---|---|---|---|---|---|
| Guition JC3248W535 | 3.5" 320x480 IPS | capacitive | ESP32-S3, 16 MB flash, 8 MB PSRAM | I2S socket | `guition_jc3248w535` |
| Guition JC2432W328C | 2.8" 320x240 IPS | capacitive | ESP32, 4 MB flash | none used | `jc2432w328` |
| ESP32-2432S028R ("Cheap Yellow Display") | 2.8" 320x240 TFT | resistive | ESP32, 4 MB flash | none used | `esp32_2432s028` |

All three are cheap boards sold by many shops, and prices move with the seller, the case and
the postage, so this guide quotes none: check a few current listings.

**JC3248W535.** The better board, and the one the kitchen profile is laid out for. It runs in
portrait: the panel has no hardware rotation, and it only draws reliably when LVGL redraws the
whole frame (the board file sets `full_refresh`). Software rotation works (`rotation: "90"`, swap
`panel_width` and `panel_height`) at some cost in speed. USB-C, with a LiPo socket.

Every change on this screen, one digit included, sends the whole frame: 320 x 480 pixels at
16 bits, 307,200 bytes over quad SPI. So the panel only touches a label when its text changes,
the clock changes once a minute, and the timers count seconds only while the Timers page is
on the screen (on other pages a chip shows whole minutes).

The speaker socket is driven over I2S: bit clock GPIO42, word select GPIO2, data GPIO41, no
master clock, no enable pin. ESPHome's own JC3248W535 preset covers the display only; these
pins are the ones Guition's factory firmware sets up, and yoRadio's JC3248W535 pin file has the
same three. Nobody names the amplifier chip. On a real kitchen panel the chime plays with
`speaker_channel: mono` (ESPHome sends the mono sample on both slots, as the old Arduino firmware
did with its stereo frames). How loud full scale is on your speaker only the board can tell you:
press **Test alarm** (see Timers below).

**JC2432W328C.** The cheap board to buy if you are buying new. Same size as the Cheap Yellow
Display with an IPS screen and capacitive touch that needs no calibration. The listing must say
**C**; the JC2432W328R is resistive.

**ESP32-2432S028R.** The cheapest, and fine for a child's room once calibrated. It ships with
three display chips on the same pins. The board file defaults to the ST7789V version
(`cyd_model: ESP32-2432S028-7789`). For the ILI9341 version set `cyd_model: ESP32-2432S028`
(as `examples/kid-a.yaml` does); for the ILI9342, `ESP32-2432S028-9342`. The USB sockets do not
tell the versions apart reliably: boards with a USB-C socket ship with either chip. A white,
mirrored or photo-negative screen means the wrong model. If the model is right and only the
colours come out inverted, add this to the device file (`examples/kid-a.yaml` has it commented
out):

```yaml
display:
  - id: !extend panel_display
    invert_colors: true
```

Power on the CYD: it browns out on a weak lead or a laptop port once Wi-Fi and the backlight
are on, and reboots in a loop. Use a 5 V 1 A (or better) wall supply and a short cable.

Resistive touch needs calibrating per board. If a tap lands in the wrong place, set
`logger: level: DEBUG` for one build, tap each corner, read `x_raw` and `y_raw` from the log,
and set `touch_x_min`, `touch_x_max`, `touch_y_min` and `touch_y_max` in the device file.

**Mounted upside down?** Each board file has a `rotation` (90 for the two landscape boards, 0 for
the JC3248W535). Add 180: a CYD on its head is `rotation: "270"`. LVGL turns the touch with the
picture: ESPHome's LVGL touch reader maps each point through the same rotation (at 180 degrees,
x becomes width - 1 - x and y becomes height - 1 - y), after the calibration. So the `touch_*`
calibration values stay as they are when you flip a board; they describe the raw sensor, not
the way up.

## Pick a profile

| Profile | For | Shows | Needs in Home Assistant |
|---|---|---|---|
| `kid` | one child's room | clock, announcement, that child's letters | `input_text.letter_<child>` |
| `kitchen` | the shared family view | Home: clock, announcement, the strip. Today: calendar, lunch and kit, due. Announce: four presets | `sensor.panel_today`, `sensor.panel_lunch_and_kit`, `sensor.panel_due`, `sensor.panel_strip`, `sensor.panel_rain` |
| `generic` | a hallway, a spare room | clock, announcement, one line of text from any sensor | any text sensor (`info_entity`) |

The kitchen takes two more packages:

| Package | Adds | Needs |
|---|---|---|
| `packages/timers.yaml` | a Timers page: three timers, the chime, the "Timer done" card, `esphome.family_panel_timer_done` | a board with a speaker: the JC3248W535 |
| `packages/light_tiles.yaml` | up to eight room tiles (amber when on) and All off on the Home page, by `esphome.family_panel_light` | any board |

The pages change with the buttons along the bottom: Home, Today, Timers, Announce, with the
page on the screen marked. The panel boots to Home and goes back to it after `idle_timeout`.
There is no swipe; a capacitive panel by the cooker reads too many wet fingers as gestures.
The layout is drawn for the JC3248W535's 320x480 portrait screen on an 8 px grid; on a 320x240
board the kitchen profile passes `esphome config` but the Home page scrolls.

Every profile shows `input_text.family_announcement` read-only, the same helper the card's
announcement banner reads (`announcement_entity` changes it). A panel that cannot reach Home
Assistant says `offline` under the date, and anything it has never heard reads "Waiting for
Home Assistant", so a stale or missing value never passes for an empty day. A kitchen card whose
sensor goes unavailable says "Calendar unavailable" (or "Due times", "The strip" and so on)
rather than keeping the old lines.

**Timers.** `+1`, `+5` and `+10` add minutes: to the set time while a timer is stopped, to the
time left while it runs. **Go** starts it, **Stop** stops it, and a tap on a stopped timer's time
clears it. When one ends the panel lights up, shows a full-width "Timer done" card with the
timer's name and **Dismiss**, plays the chime every `timer_chime_every` seconds until Dismiss or
`timer_ring_seconds` (two minutes) after the end, and fires the event once so Home Assistant can
say it out loud. End times are kept in flash: after a reboot, a timer still running carries on;
one that ended in the last two minutes rings; one that ended longer ago shows its card quietly,
with no chime and nothing said; after six hours it is forgotten.

The chime starts at `timer_volume` (0.85) and, with `timer_escalate` on (the default), each
repeat is a step louder until it reaches `timer_volume_max` (1.0, full scale) 30 seconds in:
0.85, 0.875, 0.9 ... 1.0, then full scale until Dismiss or the two minutes are up. ESPHome's
speaker volume is a dB scale, not a share: 0.0 to 1.0 maps onto -49 dB to 0 dB, so each 0.1 is
4.9 dB.

| `timer_volume` | dB | Share of full scale | |
|---|---|---|---|
| `1.0` | 0 | 1.00 | the loudest the samples go without clipping |
| `0.85` | -7.4 | 0.43 | the first chime by default |
| `0.75` | -12.0 | 0.25 | the old Arduino kitchen firmware |
| `0.6` | -19.6 | 0.10 | rtttl's own default, which v1.9.2 and earlier used: too quiet |

**Hear it without a timer.** Press **Test alarm** on the panel's device page in Home Assistant
(under Configuration), or hold the first timer's name on the Timers page for half a second. It
plays the ring a timer would, chime by chime and getting louder, for `timer_escalate_seconds`
(seven chimes over 30 seconds by default). Press or hold again to stop it. It shows no card and
fires no event, and a real timer ending takes over from it. The log says each chime's volume
(`Chime 3 at volume 0.900`).

**Light tiles.** Each tile follows one entity (a light, a light group, a switch, or a template
`binary_sensor` that is on while any light in the room is on) and sends a target name, never an
entity id. Home Assistant switches only what its `light_targets` list says that name means. A
tap toggles the room; All off turns every tile's room off, and is amber itself while any is on.
Four tiles fit under the strip card; tiles 5 to 8 are hidden until named, and with them the
Home page scrolls. An empty `tile_N_name` hides a tile.

## Options

Set any of these under `substitutions:` in the device file.

| Option | Default | What it does |
|---|---|---|
| `clock_format` | `"24h"` | `"12h"` shows 7:05 with am or pm after the date |
| `night_start`, `night_end` | `"21:00"`, `"07:00"` | the night window; the same time twice switches night off |
| `night_mode` | `"off"` | `"off"`: screen off, drawing paused. `"dim"`: a low glow at `night_glow_brightness` with the clock still going |
| `night_glow_brightness` | `4%` | the dim glow; how low a backlight can go and still glow differs board to board |
| `backlight_gamma` | `"1.0"` | the backlight's `gamma_correct`. At 1.0 every brightness here is plain PWM duty: 4% is 4% of the full backlight. ESPHome's light default, 2.8, made the 4% glow about 0.01% duty, which is dark; check.py fails any board or example whose glow lands under 4/255 duty |
| `night_keep_awake_entity` | `input_boolean.family_panel_keep_awake` | while this reads `on`, night waits and the panel stays as bright as by day. Point it at the kitchen light, say. The default helper does not exist until you make one; a missing entity never keeps a panel awake |
| `night_brightness` | `10%` | a tap at night lights the screen this bright for `idle_timeout` |
| `day_brightness`, `idle_brightness`, `idle_timeout` | `80%`, `35%`, `90s` | by day the screen dims to `idle_brightness` after `idle_timeout` untouched |
| `announcement_entity` | `input_text.family_announcement` | the helper every panel shows; set it if your announce script writes somewhere else |
| `wifi_power_save` | `none` | Wi-Fi power save: `none`, `light` or `high`. ESPHome's ESP32 default is `light`, where the radio dozes between beacons; on a kitchen panel that meant pings of 90 to 350 ms and a dozen short API drops in a day. Panels run off mains, so `none` costs nothing. `light` only for a panel on a battery |
| `preset_1` .. `preset_4` | four phrases | the kitchen's preset announcements; must match `broadcast_presets` |
| `timer_1_name` .. `timer_3_name` | `"Timer 1"` .. | must be in `timer_names` for Home Assistant to say the name |
| `timer_chime` | a four-note RTTTL tune | any RTTTL string |
| `timer_volume` | `"0.85"` | the first chime's volume, 0.0 to 1.0 on ESPHome's dB scale (see Timers above) |
| `timer_escalate`, `timer_volume_max`, `timer_escalate_seconds` | `"true"`, `"1.0"`, `"30"` | each repeat a step louder, from `timer_volume` to `timer_volume_max` over `timer_escalate_seconds`. `"false"` keeps every chime at `timer_volume`. If full scale rasps on your speaker, set `timer_volume_max: "0.95"` |
| `timer_chime_every`, `timer_ring_seconds` | `"5"`, `"120"` | seconds between chimes, and how long a timer rings before it goes quiet |
| `tile_N_name`, `tile_N_target`, `tile_N_entity` | four example rooms, N up to 8 | the tile's label, its key in `light_targets`, and what it follows; an empty name hides the tile |
| `tile_height` | `"96"` | tile height in pixels; two rows of 96 fit under the strip card on the JC3248W535 |
| `font_header` | `"44"` | the kitchen Home page clock |
| `speaker_channel`, `speaker_gain` | `mono`, `85%` | JC3248W535 only. `speaker_gain` is the rtttl player's starting volume; the timer chime sets its own from `timer_volume` |

A new letter brightens a kid panel by day; at night it leaves the screen as it is (dark, or
the glow). No double quotes in names, presets or tile labels: they land in C++ strings.

## Set up Home Assistant

Two packages: [`homeassistant/panels.example.yaml`](../homeassistant/panels.example.yaml) (the
letters, the preset check, the today, lunch and kit, and due sensors) for every install, and
[`homeassistant/panels-kitchen.example.yaml`](../homeassistant/panels-kitchen.example.yaml) (light
tiles, timer alerts, the strip and rain) for the v2 kitchen.

1. In `configuration.yaml`:

   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```

2. Copy `panels.example.yaml` to `/config/packages/family_panels.yaml`, and for the kitchen
   `panels-kitchen.example.yaml` to `/config/packages/family_panels_kitchen.yaml`.
3. Change Kid A, Kid B and Kid C to your children (the slugs `kid_a`... are in the helper names,
   the `recipients` list and each panel's `child:`), and point `kids` under
   `sensor.panel_lunch_and_kit` at your lunch and timetable sensors.
4. In the kitchen package: your rooms in `light_targets`, your timer names in `timer_names`, and
   how to speak (`announce_satellites`, `tts_entity` and `tts_players`, or the `rest_command`
   with `family_panel_say_url` in `secrets.yaml`; delete the `rest_command` and set
   `say_command: ''` if you have no speech service of your own).
5. The kitchen presets need an announce script that takes `message`, `sender` and `minutes`:
   `script.family_announce` from [`scripts.example.yaml`](../homeassistant/scripts.example.yaml)
   by default. Using your own? Set `announce_script` in `family_panel_broadcast`, and
   `announcement_entity` on every panel if it writes to a different helper.
6. Restart Home Assistant.

To send a letter, run `script.family_send_panel_letter` with `to` (a slug like `kid_a` or a
name like `Kid A`), `sender` and `text`. [docs/07-room-panels.md](../docs/07-room-panels.md) has
the full contract, the sensors and the allowlists.

## Build and flash from a Mac

The firmware is built on your computer, not on the panel. These steps use the ESPHome command
line on a Mac; the ESPHome Device Builder (in Home Assistant, or `esphome dashboard` on the
Mac) does the same with buttons.

**Install ESPHome** (2026.10 or later) in its own virtual environment:

```sh
python3 -m venv ~/esphome-venv
~/esphome-venv/bin/pip install esphome
~/esphome-venv/bin/esphome version
```

`brew install esphome` or `pipx install esphome` work too. Make a folder for your panels, say
`~/esphome`, and work in it.

**Secrets.** In that folder's `secrets.yaml`:

```yaml
wifi_ssid: "your network"
wifi_password: "your password"
panel_kid_a_api_key: "paste a key here"
panel_kitchen_api_key: "paste another key here"
```

One key per panel: `openssl rand -base64 32` makes one. It encrypts the API and OTA updates
both. Keep `secrets.yaml` out of any repo.

**The device file.** Copy [`examples/kid-a.yaml`](examples/kid-a.yaml) or
[`examples/kitchen.yaml`](examples/kitchen.yaml) into the folder and set `name`,
`friendly_name`, `child` (kid panels), `api_key` and the options above. The packages come from
GitHub; pin `@main` to a release tag once yours works, so a change to this repo never changes a
panel you did not rebuild. `esphome config kitchen.yaml` checks the file without building.

**First flash, over USB.**

1. Back up the board first if it runs firmware you might want again: see
   [Back up a board first](#back-up-a-board-first).
2. Plug the board into the Mac with a data cable (a charge-only cable shows no port).
3. Find the port: `ls /dev/cu.*`. The JC3248W535 uses the S3's own USB and appears as
   `/dev/cu.usbmodem...`; the two ESP32 boards have a CH340 serial chip and appear as
   `/dev/cu.usbserial-...` (macOS 11 and later has the CH340 driver built in). If you are unsure
   which is new, list before and after plugging in.
4. Close anything that has the port open (a serial monitor, another flasher).
5. `~/esphome-venv/bin/esphome run kitchen.yaml --device /dev/cu.usbmodemNNNN`. The first build
   downloads the toolchain and takes a while; later ones are quicker.
6. If it cannot connect, hold **BOOT**, tap **RST**, let go of **BOOT**, and run it again.

**Adopt it.** Home Assistant finds the panel under Settings, Devices and services, ESPHome.
Paste the same API key when it asks. Leave **Allow the device to perform Home Assistant
actions** off; no profile or package needs it.

**Later builds go over Wi-Fi.** `esphome run kitchen.yaml` offers the panel's address
(`panel-kitchen.local`) once it is online; `--device panel-kitchen.local` skips the question. If
mDNS does not resolve, use the IP address from your router or from Home Assistant. A Mac that
asks whether Python may find devices on the local network needs **Allow**, or OTA uploads
time out. `esphome logs kitchen.yaml` shows the panel's log over Wi-Fi.

The panel has no fallback hotspot and no web page. If your Wi-Fi changes, edit `secrets.yaml`
and flash it over USB again.

## Back up a board first

A board you are moving to ESPHome from other firmware can be read back whole first, so you can
put it back exactly as it was. Use esptool (it comes with ESPHome: `~/esphome-venv/bin/esptool`,
or `pipx install esptool`). With the board on USB and nothing else holding the port:

```sh
# JC3248W535, 16 MB
esptool --chip esp32s3 --port /dev/cu.usbmodemNNNN read-flash 0 0x1000000 kitchen-flash.bin
# ESP32 boards (CYD, JC2432W328C), 4 MB
esptool --chip esp32 --port /dev/cu.usbserial-NNN read-flash 0 0x400000 kid-a-flash.bin
```

The file should be exactly 16,777,216 or 4,194,304 bytes. esptool before v5 spells it
`read_flash`. The image holds everything on the board, Wi-Fi passwords and any tokens the old
firmware stored included, so keep it where you keep secrets, not in a repo. Back up the old
firmware's source too, if you have it.

## Recovery

- **Back to the old firmware:** `esptool --chip esp32s3 --port /dev/cu.usbmodemNNNN write-flash 0 kitchen-flash.bin`
  (or `--chip esp32` and the 4 MB image).
- **A panel that boot-loops or will not join Wi-Fi:** flash it over USB again with
  `esphome run`. If that will not connect, hold **BOOT**, tap **RST**, let go of **BOOT**.
- **Start clean:** `esptool --port /dev/cu.usbmodemNNNN erase-flash`, then `esphome run` over
  USB. This forgets the saved timer end times too.
- **A panel that is up but silent in Home Assistant:** check the API key matches, and
  `esphome logs <file>` for "offline" or API errors.

## Add another panel

Copy a device file, give it a new `name`, a new `api_key` secret and, for a kid panel, the next
`child:`. For a new child, add `input_text.letter_<slug>` and `input_datetime.letter_<slug>_sent`
to the package and the slug to `recipients`, then restart Home Assistant.

The kitchen presets are checked by Home Assistant against `broadcast_presets`, timer names
against `timer_names`, tile targets against `light_targets`. Change both sides, word for word,
or the panel's request is refused and the log says why.

## How a letter travels

1. Someone runs `script.family_send_panel_letter` with `to: kid_a`. The script slugifies `to`,
   refuses a child not in `recipients`, a missing helper or an empty text, and writes
   `Parent 1|Tea's at six` to `input_text.letter_kid_a` and the time to
   `input_datetime.letter_kid_a_sent`. If the bridge is on (the default) it also copies the
   letter to the card's postie (`input_text.family_letter`) as `Kid A: From Parent 1: Tea's at
   six`, for a wall card before v1.8 or a child with no `letter:` on the card. Card v1.8 with
   `letter: input_text.letter_kid_a` reads the helper itself and shows the letter once.
2. Kid A's panel sees the helper change, shows the red dot and brightens.
3. Kid A taps the envelope, reads it, taps **Done**. The panel fires
   `esphome.family_letter_read` with `child: kid_a` and the sent time it saw.
4. An automation empties `input_text.letter_kid_a` (and the postie copy if it is still there).
   Every screen drops it. If the sent time does not match, a newer letter arrived in between and
   stays.

If the letter is read on the wall card first, a v1.8 card with `letter:` empties the child's
helper (and the postie copy) itself; an older card empties the postie and a second automation
clears the panel. A panel that was off or offline shows the letter when it comes
back, and a **Done** pressed while offline is sent again when the panel reconnects. Unread
letters older than `expire_days` (3) go at 03:30.

## Privacy and safety

- Each panel talks to Home Assistant over the encrypted native API and to nothing else: no
  `web_server`, no `http_request`, no captive portal, no cloud. Fonts are fetched once, at
  compile time, by the computer that builds the firmware.
- Plain text only. The panel draws text with its own font; there is no markup to inject.
- The logger runs at INFO, so letter text does not stream to anyone watching the logs.
- The panels never call Home Assistant actions. They fire `esphome.*` events, which Home
  Assistant accepts from any adopted device, and each automation treats the event's data as a
  request: presets, timer names and light targets are checked against lists in Home Assistant.
  A light tile sends a name like `kitchen`, never an entity id; a name that is not on the list
  switches nothing.
- Home Assistant has no per-entity permissions: every Home Assistant user can run the script or
  type into a helper. Give accounts only to people you would let write to a child's room, and
  send letters through the script, which checks the recipient and the format.

## What has been tested

From this repo, with ESPHome 2026.10.0 and Home Assistant's current stable container:

- `esphome config` passes for every board and profile pair, and for the kitchen with the light
  tiles on every board and with timers and tiles on the JC3248W535 (`tests/panels/matrix.sh`).
- `esphome compile` builds `kid-a.local.yaml` (CYD, ILI9341), `kid-b.local.yaml` (JC2432W328C)
  and `kitchen.local.yaml` (JC3248W535 with timers and tiles), and `kitchen.yaml` and
  `kid-a.yaml` pulling the packages from GitHub at the commit under test.
- `tests/panels/check.py` compiles the panel's own C++ (letter and announcement parsing, the
  12- and 24-hour clock, the night window with keep-awake, the kitchen card lines, the timer
  phases and their display, the light tile state) and renders the packages' own Jinja (letters,
  the light allowlist, the timer alert's wording), holds them to tables of cases, and checks
  the examples against the allowlists. It also works out the night glow's real duty on every
  board and example, the level raised to the backlight's `gamma_correct`. `--sabotage` breaks each piece on purpose and proves a
  check fails.
- `tests/panels/host/render.sh` draws every page of the kitchen and a kid panel on the
  development machine: the same LVGL pages, built for ESPHome's host platform into a headless
  SDL surface, fed made-up Home Assistant states, and saved as PNGs. Needs SDL2 (`brew install
  sdl2`). It is how the layout was checked before a flash; fonts are rendered at 4 bits per
  pixel (ESPHome's default is 1, which is what made the first firmware's text look jagged).
- `tests/panels/ha_live.py` runs both packages in a throwaway Home Assistant: letters, presets,
  light tiles switching template lights (and refusing entity ids, unknown targets and other
  actions), timer alerts posted to a stand-in speech service, the strip, rain from the sensor
  and from a forecast, and the long-day lines attribute.

Only the board can prove the rest. Treat the first flash of each board as the test of:

- the screen, touch mapping and calibration, rotation (a flipped CYD at 270 included) and
  whether an ILI9341 board needs `invert_colors`;
- the JC3248W535 speaker: that the pins drive the amp (yes, on one panel, with mono), how loud
  `timer_volume` and full scale are on your speaker, and whether the amp distorts at the top of
  the escalation (Test alarm plays the whole climb);
- how low `night_glow_brightness` can go and still glow (the old Arduino firmware's 4/255,
  1.6%, glowed on a CYD), and the backlight levels in a dark room;
- that a timer's end time survives a power cut (written to flash up to 10 seconds after a
  change) and the done card's behaviour across a reboot;
- how long a full-frame redraw takes on the JC3248W535, so how the Timers page's once-a-second
  update and button taps feel;
- the night schedule on a real clock, the keep-awake entity switching it, and how the layouts
  look on glass.
