# Family Dashboard

A Home Assistant wall dashboard for a 10 inch touch panel or tablet. The landing view is a
small animated village where each member of the household lives as a creature. Tap one to
see that person's week, pulled from your Home Assistant calendars.

**Status: pre-release, phase 1.** This repo is being reshaped into an installable project.
Expect paths and config names to change. Screenshots come in phase 2.

## What is in it

- **Meadow** (`homeassistant/www/family-dashboard.html`), the landing view. Kids walk to
  school, the workshop builds whatever the 3D printer is printing, a postie delivers notes
  typed on a phone, and everyone dances when music plays. Every household setting is in the
  `CONFIG` object at the top of the script. Open it with `?demo` (or straight from disk) to
  run it on built-in demo data with no Home Assistant.
- **Home**, **Music**, **Lights**, **Printer** and an optional **Today** agenda view, in
  `homeassistant/dashboards/wall-panel.yaml`.
- A frosted glass theme over a generated wallpaper, with no scrolling at 1280x800.

## What you need

- Home Assistant 2026.9 or later.
- HACS with [card-mod](https://github.com/thomasloven/lovelace-card-mod) and
  [Mushroom](https://github.com/piitaya/lovelace-mushroom) 4 or later.
- A calendar integration and a `weather` entity.
- Optional: [Music Assistant](https://www.music-assistant.io/) for Music, the
  [Bambu Lab integration](https://github.com/greghesp/ha-bambulab) for Printer.

## Quick start

1. Copy `homeassistant/www/` to `config/www/`, `homeassistant/themes/wall-panel.yaml` to
   `config/themes/` and `homeassistant/dashboards/wall-panel.yaml` to `config/dashboards/`.
2. Merge what you need from
   [`configuration.example.yaml`](homeassistant/configuration.example.yaml) into your
   `configuration.yaml`: at least the `frontend` and `lovelace` blocks and the
   `family_week` template sensor.
3. Edit `CONFIG` in `family-dashboard.html` and swap the placeholder entity ids in
   `wall-panel.yaml` for your own ([docs/06-views.md](docs/06-views.md)).
4. Restart Home Assistant and open `/wall-panel/meadow`.

## Docs

| | |
|---|---|
| [01 Any tablet](docs/01-any-tablet.md) | Install, sign-in, kiosk browser, other screen sizes |
| [05 Theme and glass](docs/05-theme-and-glass.md) | The glass look without blur, wallpaper, column and row maths |
| [06 Views](docs/06-views.md) | Each view, what to swap, adding people and views, the page's config |

## Licence

MIT, see [LICENSE](LICENSE). The bundled fonts keep their own licence (SIL OFL 1.1), see
[homeassistant/www/fonts/NOTICE](homeassistant/www/fonts/NOTICE).
