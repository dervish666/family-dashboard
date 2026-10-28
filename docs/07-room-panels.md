# 07 Room panels

The optional ESPHome room panels: the Home Assistant side and the contracts the panels and the
card share. Boards, profiles, options and flashing are in [esphome/README.md](../esphome/README.md).
Everything here lives in two packages:
[`homeassistant/panels.example.yaml`](../homeassistant/panels.example.yaml) (letters, presets,
today, lunch and kit, due) and
[`homeassistant/panels-kitchen.example.yaml`](../homeassistant/panels-kitchen.example.yaml) (light
tiles, timer alerts, the strip, rain).

## Letters

**The helper.** One `input_text` per child, `input_text.letter_<slug>`, `max: 255`, no
`initial:` (an initial value would wipe an unread letter at every restart). Its state is:

| State | Means |
|---|---|
| `Parent 1\|Tea's at six` | a letter from Parent 1 |
| `\|Tea's at six` or `Tea's at six` | a letter with no sender |
| `Parent 1\|` | no letter (a sender and no text) |
| empty, or `unknown` (never set) | no letter |
| `unavailable` | the helper cannot be read: say so, do not show "no letters" |

Split on the first `|` only, so the text can hold a `|`. Trim both halves. One letter per child:
a new one replaces an unread one.

**Length.** `input_text` caps the whole value at 255 characters, and so does any entity state, so
a `text` entity from another integration has the same ceiling. The script trims the sender to
24 characters, turns a `|` in it into `/`, folds newlines into spaces, and cuts the total to 255,
which leaves about 230 characters of letter.

**The sent time.** `input_datetime.letter_<slug>_sent` (date and time) is optional. The script
sets it on every send. A panel's **Done** carries the value it saw, and the read automation
only clears the letter when it still matches, so reading an old letter never deletes a new one.
The daily expiry uses it, falling back to the helper's last change.

**Sending.** `script.family_send_panel_letter`, fields `to`, `sender` and `text`. `to` is a slug
(`kid_a`) or a name (`Kid A`); the script slugifies it. It stops, and writes an error to the
log, for a child not in `recipients`, a recipient whose helper does not exist, or an empty text.
Over the REST API a refused call still answers 200; the log and the unchanged helper are the
refusal. (The field is `sender`, not `from`: `from` is a reserved word in Home Assistant's
templates.)

**Reading.** A letter is read once and gone everywhere. Whoever reads it first empties the
helper:

- a panel's **Done** fires `esphome.family_letter_read` with `child` and `sent`, and the
  `family_panel_letter_read` automation empties the helper. Home Assistant accepts `esphome.*`
  events from an adopted device without the "allow actions" option.
- the wall card: opening that person's card empties the helper, the same thing a panel's
  **Done** does. See [The wall card](#the-wall-card) below.

**Offline.** The letter waits in the helper, which Home Assistant restores after a restart. A
panel that was off shows it when it reconnects. A **Done** pressed while the panel was offline
hides the letter on that panel and is sent again when the API reconnects.

**Expiry.** `family_panel_letter_expire` clears unread letters older than `expire_days` (3) at
03:30. Set `expire_days: 0` to keep them until read.

## The wall card

Card v1.8.0 reads these helpers itself. Give each child their helper in the card's `people`,
or in the card editor's **Own letter helper** field:

```yaml
people:
  - name: Kid A                       # as the script's recipients spell it
    letter: input_text.letter_kid_a   # an input_text or a text entity, from|text as above
```

- The card polls the helper with its other live entities, every 45 seconds. A letter there goes
  to that person the way the postie's letters do: the postie walks it over in the meadow, and
  in the other scenes it drops onto their name tag. They wear it until someone opens their card,
  which shows it under "A letter from Parent 1" with the time the helper last changed.
- Opening the card with a tap empties the helper (`input_text.set_value` or `text.set_value`,
  value `""`), only if it still holds the letter that was read, so a newer letter that landed in
  the meantime stays. The demo, the test hooks and a card opened with `?open=` never write.
- A helper emptied elsewhere (a panel's **Done**, the expiry) takes the letter back off the wall
  at the next poll, even if the postie is on the road with it. A new letter replaces an unread
  one in the same envelope.
- `unavailable`, or a helper that does not exist, says "Letters unavailable: Kid A" in the
  corner and names the entity on Kid A's card. It never reads as "no letter". `unknown` (never
  set) is an empty mailbox.
- One letter at a time per person: a second letter for someone already wearing one (a postie
  letter typed by hand, say) waits at the post office until the first is read.

**The bridge, now optional.** The script still copies each letter to the postie,
`input_text.family_letter`, as `Kid A: From Parent 1: Tea's at six`, for a wall card before
v1.8 or a child with no `letter:`. Card v1.8 shows a letter once either way: a postie value that
is exactly the copy of a letter it has from a per-person helper is the same letter, and if the
copy arrived first the per-person letter takes over its envelope. Reading it empties the
child's helper and the postie too if it still holds the copy. To turn the bridge off, set
`postie: ''` in the script and delete the `family_panel_letter_read_on_card` automation. The
names in the script's `recipients` must match the card's `people` names for the copy to match.

`input_datetime.letter_<slug>_sent` stays for the panels and the expiry; the card does not read
it. After a Home Assistant restart the card's time for an unread letter is the restart time.

## Announcements

Every panel shows `input_text.family_announcement`, read-only, in the same formats the card's
banner reads: plain text, `Name: text`, or `minutes|from|text` as `script.family_announce`
writes it (shown as "from: text"; the script clears it when the time is up). `unknown` (never
set) shows nothing; `unavailable` says "Announcements unavailable".

Only the kitchen profile sends, and only presets. A preset button asks to confirm, then fires
`esphome.family_panel_broadcast` with the message. The `family_panel_broadcast` automation
announces it through `announce_script` (`script.family_announce` by default, as `Kitchen`, for
20 minutes) only if the message is in `broadcast_presets`, and logs a warning otherwise. A panel
can never post free text. Your own announce script works if it takes `message`, `sender` and
`minutes`; if it writes to a helper other than `input_text.family_announcement`, set
`announcement_entity` on each panel too.

## The kitchen's sensors

Five template sensors turn the card's own sources into plain text, so the panel only draws
text. Each names a missing source instead of looking like a quiet day. Each one carries the
same lines twice: the state, one item per line and cut to fit the 255 characters a state can
hold (with "+N more"), and a `lines` attribute, not cut, which the v2 kitchen pages read.
Attributes have no 255 limit. The first four are trigger-based (every minute, at start-up, and
when the source changes), so the state and the attribute come from one render and agree.

| Sensor | From | Shows |
|---|---|---|
| `sensor.panel_today` | `sensor.family_today` (`events`, `checked_at`) | all-day events, then timed ones not started over an hour ago; "Not checked since 07:05" when `checked_at` is over 20 minutes old |
| `sensor.panel_lunch_and_kit` | per child in `kids`: the lunch sensor (`menu`), an optional choice `input_select`, an optional timetable sensor (`timetable`); then `sensor.family_kit` (`kit_today`) | "Kid A: Bean chilli", "Kid A lessons: Maths, Art", "Kid B: packed lunch", "Kit: PE kit" |
| `sensor.panel_due` | `due_src`, `sensor.due_times` by default (`items`) | overdue and due in the next 18 hours, soonest first, and a count of items that would not parse |
| `sensor.panel_strip` | `sensor.bin_collections` (`next_days`, `next_short`, `fetch`), the Bambu Lab printer's `print_status`, `print_progress` and `end_time` | "Bins today: Black bin", "Bins out tonight: Food", "Printing 45%, done 14:20", or "Nothing to flag" |
| `sensor.panel_rain` | `sensor.rain_sensor` and the hourly forecast of `weather.forecast_home` | "Raining", "Raining, dry from 15:00", "Rain from 15:00", "Dry, no rain due" |

The lessons follow the card's own rules for the timetable attribute (README, "The timetable
attribute"): a `week_of` entry for this Monday wins (`null` is a week off), otherwise whole
weeks count on from the latest `anchor` or `week_of` entry before it; a date in `closed` is no
school. The strip leaves a printer that is off out (off is its normal state), but a bins sensor
that is missing or could not fetch says so. Rain is wet when the sensor reads a wet state
(`raining`, `wet`, `on`) or the forecast hour's condition is rainy or its chance of rain is at
or above `rain_chance` (50 by default); "dry from" appears only when the forecast itself has the
current hour wet. Fire the event `family_panel_refresh` to recompute the rain at once.

A YAML template sensor takes its entity id from its `name`, not its `unique_id`. Rename one and
change the kitchen's `today_entity`, `lunch_entity`, `due_entity`, `strip_entity` or
`rain_entity` to match.

## Light tiles

A tile tap fires `esphome.family_panel_light` with `target` (a key like `kitchen`), `action`
(`toggle` or `off`) and `panel`. The `family_panel_light` automation looks `target` up in
`light_targets`:

```yaml
light_targets:
  kitchen: [light.kitchen]
  downstairs: [light.kitchen, light.living_room]   # one key, several entities
```

A target that is not a key (an entity id included), or any action but `toggle` and `off`, is
refused with a warning in the log and switches nothing. `toggle` turns the key's entities off if
any of them is on, otherwise on; `off` turns them off. All off on the panel sends `off` for each
visible tile. Entities can be lights, switches or groups (`homeassistant.turn_on` and
`turn_off`). The tile's colour comes from `tile_N_entity` on the panel, which Home Assistant
sends as a state; the panel switches nothing itself.

## Timer alerts

The kitchen timers run on the panel. When one ends, the panel chimes and shows its card on
its own, and fires `esphome.family_panel_timer_done` with `timer` (the name), `slot` and
`panel`, once. A timer that ended while the panel was off fires nothing when it comes back
(unless it ended in the last two minutes): the house speakers do not announce a timer from
twenty minutes ago.

The `family_panel_timer_done` automation builds the words itself: "Oven timer is done" for a
name in `timer_names` ("Timer 2 is done" when the name already says timer), and "A kitchen
timer is done" for any other name, so a panel can never make the house say arbitrary text. It
logs the line, then speaks it each way that is set: `announce_satellites` with
`assist_satellite.announce`, `tts_entity` on `tts_players` with `tts.speak`, and `say_command`
(the `rest_command.family_panel_say` example posts `{"text": "..."}` to the URL in
`secrets.yaml` as `family_panel_say_url`). Each way is skipped when empty and does not stop the
others when it fails.

## Who can post

Home Assistant has no per-entity permissions. Any Home Assistant user, and anything holding one
of their tokens, can run the script or type straight into a letter helper. So:

- give Home Assistant accounts only to people you would let write to a child's room;
- send letters through `script.family_send_panel_letter`, which checks the recipient and the
  format, and keep the raw helpers off dashboards the children use;
- the panels never call Home Assistant actions. A kid panel can only say "read"; the kitchen can
  only send its presets, a light target from `light_targets`, and a timer name that is spoken
  only if it is in `timer_names`.

## Testing it

```sh
pip install pyyaml jinja2 python-slugify
python3 tests/panels/check.py               # the contracts, on the shipped Jinja and C++
python3 tests/panels/check.py --sabotage    # proves each check can fail
sh tests/panels/matrix.sh                   # esphome config, every board x profile, and the kitchen add-ons
python3 tests/panels/ha_live.py             # both packages in a throwaway Home Assistant (docker)
```

CI runs all four in [`.github/workflows/esphome.yml`](../.github/workflows/esphome.yml), plus
`esphome compile` of five examples: the three local ones, and `kitchen.yaml` and `kid-a.yaml`
built from the GitHub packages at the commit under test.
