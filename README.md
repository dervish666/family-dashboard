# Family Dashboard

A Lovelace card for a Home Assistant wall panel. It draws a small animated village where each
member of the household lives as a creature. Tap one to see that person's week, pulled from
your Home Assistant calendars.

![The meadow by day, with the band playing and a print on the go](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/meadow.png)

Kids walk to school, the workshop builds whatever the 3D printer is printing, a postie
delivers notes typed on a phone, and everyone dances when music plays. The scene follows the
weather entity, goes to sleep at night and throws a party on birthdays and the big days.

| A person's week | Christmas Eve, snowing, bedtime |
|---|---|
| ![Kid 2's card open](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/card.png) | ![The meadow at night in snow](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/night.png) |

Every screenshot is the built-in demo cast. No real household data is in this repo.

## Install with HACS

1. HACS, then the three-dot menu, then **Custom repositories**. Add
   `https://github.com/dervish666/family-dashboard` with type **Dashboard**.
2. Find **Family Dashboard** in HACS and download it. HACS registers the resource
   `/hacsfiles/family-dashboard/family-dashboard.js` for you.
3. Reload the browser.

Manual install: copy `dist/` to `config/www/family-dashboard/` and add
`/local/family-dashboard/family-dashboard.js` as a JavaScript module resource.

## Configure

Add the card from the dashboard editor (**Add card**, then **Family Dashboard**). It starts on
the demo cast and hands out the calendars your Home Assistant already has: a family, home,
holiday or birthday calendar goes to the household, the rest one per person. Turn **Demo
cast** off and the creatures show your calendars. No template sensors and no YAML.

| The cast | The optional sensors |
|---|---|
| ![The card editor: scene, demo switch and the first person](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/editor-cast.png) | ![The card editor: optional sensors, all empty](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/editor-sensors.png) |

The editor covers:

- **People**: add, remove and reorder. Each has a name, adult or kid, an animal, a colour,
  accessories (glasses, headphones, a daisy, the bee), whether they go to school, and one or
  more calendars. The last person is the household.
- **Sensors**: weather, music speaker, letter helper, trips calendar, 3D printer, and the
  school data sensors. All optional. Empty means that part of the scene stays off.
- **Scene**: the meadow. It is a list so more scenes can join it later.
- **Demo cast**: made-up data, no Home Assistant needed.

The same thing in YAML:

```yaml
type: custom:family-dashboard-card
people:
  - { name: Parent 1, role: adult, look: crow, col: "#7FC8D2", calendar: calendar.parent_1, glasses: true }
  - { name: Kid 1, role: kid, look: otter, col: "#9EE0B4", calendar: calendar.kid_1, school: true }
  - { name: House, look: snail, calendar: [calendar.family, calendar.holidays] }
sensors:
  weather: weather.forecast_home
```

The card reads each calendar through Home Assistant's calendar API every five minutes. A
calendar that does not answer is named on its owner's card and in the corner, so a missing
calendar never reads as a free day. The school data sensor (`sensors.extra`) works the same
way: off when empty, "School info unavailable" when it is set but missing.

It looks best alone in a `panel` view.

### Coming from v1.0.0

v1.0.0 configs keep working unchanged. A config with no `calendar` on anyone still reads
`sensor.family_week` and keeps every v1.0.0 default, including the `family_*` sensors and
the `/wall-panel/...` taps. Add a `calendar` to people and the card reads the calendars
itself; you can then delete the `family_week` template sensor if nothing else uses it.
Opening a v1.0.0 card in the visual editor shows a **Week template sensor** field so the old
setup stays editable.

## Options

| Option | Default | What it does |
|---|---|---|
| `people` | a demo cast of six | one creature each: `name`, `calendar` (one or a list), `col`, `look`, `role` (`adult` or `kid`), `r`, `tg`, plus flags `adult`, `school`, `glasses`, `phones`, `daisy`, `bee`. The last entry is the household |
| `sensors` | with calendars: `sun` and `weather` only. Without: `sensor.family_week` and friends | entity ids: `week`, `extra`, `timetable`, `kit`, `lunch`, `sun`, `weather`, `printer`, `letter`, `music`, `rain`, `trips` |
| `dates` | demo birthdays, Halloween to New Year's Eve | `birthdays` (name to `MM-DD`) and `fixed` days, shown as countdowns in the sky |
| `view` | with calendars: all `null`. Without: `/wall-panel/...` paths | which view a tap on the cottage, bandstand, workshop or robot opens. `null` leaves the building as scenery |
| `anniversary` | the first two people | who gets the party on an "Anniversary" event |
| `schoolWho`, `schoolLine`, `sourceOwner`, `rainStates` | demo values | school sensor owners, queue order at the school door, missing-source owners, rain sensor states |
| `officeUrl` | `null` | a JSON status URL for the optional office robot |
| `demo` | `false` | run on the built-in demo cast |
| `scene` | `meadow` | which scene to draw. The meadow is the only one so far |
| `query` | none | test hooks, for example `hour=21.5&weather=snow` |
| `height` | `calc(100vh - var(--header-height, 56px))` | card height. Use `100vh` with the header hidden |

Objects such as `sensors` and `view` merge with the defaults, so you only list what changes.
Lists such as `people` replace the default. Unknown keys are ignored. A config the card
cannot draw (a duplicate name, an unknown animal, a calendar id that is not a calendar)
shows an error on the card that says what to change. [docs/06-views.md](docs/06-views.md) covers each
option, the looks, and the test hooks.

## The rest of the wall panel

The card is the landing view of a full wall panel dashboard that also lives here: **Home**,
**Music**, **Lights**, **Printer** and an optional **Today** agenda in
[`homeassistant/dashboards/wall-panel.yaml`](homeassistant/dashboards/wall-panel.yaml), a
frosted glass theme, and the template sensors that feed the card. That part is copied by
hand and needs [card-mod](https://github.com/thomasloven/lovelace-card-mod) and
[Mushroom](https://github.com/piitaya/lovelace-mushroom) 4 or later.

| | |
|---|---|
| [01 Any tablet](docs/01-any-tablet.md) | Install, sign-in, kiosk browser, other screen sizes |
| [05 Theme and glass](docs/05-theme-and-glass.md) | The glass look without blur, wallpaper, column and row maths |
| [06 Views](docs/06-views.md) | Each view, the card's options, adding people and views |

## Try it without Home Assistant

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/demo/`. The page's query string goes to the card as test
hooks, so `/demo/?hour=21.5&weather=snow` shows a snowy night.

## Known limits

- Built and tuned for 1280x800. Other sizes work but the village was laid out for that one.
- On a v1.0.0 setup that reads `sensor.family_week`, names must match `people` exactly,
  since the template sensor tags each event with its owner's name. Calendars set on people
  have no such rule.
- Birthday parties need `dates.birthdays` in YAML. The editor does not edit dates yet.
- The 3D printer workshop speaks the [Bambu Lab integration](https://github.com/greghesp/ha-bambulab)'s
  sensor names only.

## Licence

MIT, see [LICENSE](LICENSE). The bundled fonts keep their own licence (SIL OFL 1.1), see
[dist/fonts/NOTICE](dist/fonts/NOTICE).
