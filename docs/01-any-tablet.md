# 01 Any tablet

The dashboard is ordinary Home Assistant YAML with a theme and a few static files. Any
tablet with a current browser can run it.

## What ships

| Piece | What it is |
|---|---|
| `dashboards/wall-panel.yaml`, `themes/wall-panel.yaml` | the dashboard and its glass theme |
| `www/panel-fonts.js`, `www/fonts/` | self-hosted Instrument Sans for the theme |
| `dist/family-dashboard.js` | the Meadow card, installed through HACS (see the README) |
| `tools/wallpaper.py` | draws the wallpaper behind the glass |

## 1. Install the frontend pieces

Install **card-mod**, **Mushroom** and **Family Dashboard** (the Meadow card) from HACS. Copy `homeassistant/www/` to `config/www/`
and `homeassistant/themes/wall-panel.yaml` to `config/themes/`. Make sure your
`configuration.yaml` loads themes from that folder:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

## 2. Load the font script

Home Assistant serves two frontend builds. Old browsers get the legacy build, which only
loads `extra_js_url_es5`. Current browsers get the modern build, which only loads
`extra_module_url`. List the script under both and let the browser take the one it uses:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/panel-fonts.js?v=1
  extra_js_url_es5:
    - /local/panel-fonts.js?v=1
```

It is a plain script that also runs as a module. Bump `?v=` every time you edit it,
because Home Assistant tells browsers to cache `/local/` for a month.

## 3. Register the dashboard

```yaml
lovelace:
  dashboards:
    wall-panel:
      mode: yaml
      filename: dashboards/wall-panel.yaml
      title: Wall Panel
      icon: mdi:tablet-dashboard
      show_in_sidebar: true
      require_admin: false
```

Swap the placeholder entities for your own ([06](06-views.md)) and restart. Open
`/wall-panel/home` on a desktop browser first. If it renders there, it will render on the wall.

## 4. A user for the tablet

Create a Home Assistant user for the tablet under Settings, People, Users. Make it
**non-admin** and tick **Can only log in from the local network**. Everything the wall
does works without admin rights.

## 5. Sign-in without a keyboard

A wall tablet should come back from a reboot signed in. Two ways:

- **Log in once by hand.** Fine on a tablet whose browser keeps its storage across reboots.
- **`trusted_networks`.** Home Assistant trusts one IP address and signs that device in as
  the tablet user (`configuration.example.yaml` has the block). Give the tablet a DHCP
  reservation first, or whatever device lands on that address is signed in instead.

Point the tablet straight at Home Assistant, not through a reverse proxy. `trusted_networks`
checks the address the request comes from, and behind a proxy that is the proxy.

## 6. A browser in kiosk mode

You want a browser that fills the screen, starts on boot, and reopens after a crash. On
Android, [Fully Kiosk Browser](https://www.fully-kiosk.com/) is one well-known option.
Home Assistant also has a core Fully Kiosk integration that exposes screen brightness and
screen on/off as entities. We have not tested this repo on it, so treat it as a starting
point. On an iPad, Guided Access keeps Safari in front.

Set its start URL to `http://<your-ha-address>:8123/wall-panel/meadow`.

## 7. The theme

Each view in the dashboard sets `theme: Wall Panel`, so the look holds whoever signs in.
The rest of your Home Assistant keeps its own theme, because this one applies only where it
is named.

## 8. Your screen is not 1280x800

The layout is tuned for 1280x800 CSS pixels, landscape. Many 10 inch Android tablets
report exactly that at a device pixel ratio of 1.5. Check yours by opening a page that shows
`window.innerWidth` and `window.innerHeight`. If it differs:

- the column count comes from two theme variables and a formula in
  [05](05-theme-and-glass.md#columns);
- the vertical budget is `64 * rows - 8` pixels per column, and it is 12 rows at 800px
  ([05](05-theme-and-glass.md#rows));
- `tools/wallpaper.py` has `W, H` at the top.
