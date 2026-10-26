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

## Use it

Try it first on the demo cast, which needs no sensors:

```yaml
type: custom:family-dashboard-card
demo: true
```

For real, give it your people and the template sensors from
[`configuration.example.yaml`](homeassistant/configuration.example.yaml). It looks best
alone in a `panel` view:

```yaml
views:
  - title: Meadow
    path: meadow
    type: panel
    cards:
      - type: custom:family-dashboard-card
        people:
          - { name: Parent 1, col: "#7FC8D2", r: 37, look: crow, tg: 2.25, adult: true, glasses: true }
          - { name: Parent 2, col: "#9A72C8", r: 36, look: capybara, tg: 2.6, adult: true }
          - { name: Kid 1, col: "#9EE0B4", r: 31, look: otter, tg: 2.55, school: true }
          - { name: House, col: "#E0A050", r: 37, look: snail, tg: 2.05 }
        sensors:
          week: sensor.family_week
          extra: sensor.family_extra
          weather: weather.forecast_home
          music: media_player.kitchen
        dates:
          birthdays: { Parent 1: "03-14", Parent 2: "06-02", Kid 1: "07-27" }
        view:
          home: /lovelace/home
          music: null
          printer: null
```

Only `sensors.week` is required. Every other sensor is optional, and `null` switches its
part of the scene off.

## Options

| Option | Default | What it does |
|---|---|---|
| `people` | a demo cast of six | one creature each: `name`, `col`, `look`, `r`, `tg`, plus flags `adult`, `school`, `glasses`, `phones`, `daisy`, `bee`. The last entry is the household |
| `sensors` | `sensor.family_week` and friends | entity ids: `week`, `extra`, `timetable`, `kit`, `lunch`, `sun`, `weather`, `printer`, `letter`, `music`, `rain`, `trips` |
| `dates` | demo birthdays, Halloween to New Year's Eve | `birthdays` (name to `MM-DD`) and `fixed` days, shown as countdowns in the sky |
| `view` | `/wall-panel/...` paths | which view a tap on the cottage, bandstand, workshop or robot opens. `null` leaves the building as scenery |
| `anniversary` | the first two people | who gets the party on an "Anniversary" event |
| `schoolWho`, `schoolLine`, `sourceOwner`, `rainStates` | demo values | school sensor owners, queue order at the school door, missing-source owners, rain sensor states |
| `officeUrl` | `null` | a JSON status URL for the optional office robot |
| `demo` | `false` | run on the built-in demo cast |
| `query` | none | test hooks, for example `hour=21.5&weather=snow` |
| `height` | `calc(100vh - var(--header-height, 56px))` | card height. Use `100vh` with the header hidden |

Objects such as `sensors` and `view` merge with the defaults, so you only list what changes.
Lists such as `people` replace the default. [docs/06-views.md](docs/06-views.md) covers each
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
- Names on the calendars must match `people` exactly, since the template sensor tags each
  event with its owner's name.
- The 3D printer workshop speaks the [Bambu Lab integration](https://github.com/greghesp/ha-bambulab)'s
  sensor names only.

## Licence

MIT, see [LICENSE](LICENSE). The bundled fonts keep their own licence (SIL OFL 1.1), see
[dist/fonts/NOTICE](dist/fonts/NOTICE).
