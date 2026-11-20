# Changelog

One section per release, newest first. The full notes for each are on the
[releases page](https://github.com/dervish666/family-dashboard/releases).

## Unreleased

Card
- First run hands only the household's shared calendars (family, home, house, holiday,
  birthday) to the household. Personal calendars go to nobody, and each person's card says
  "No calendar picked" until one is chosen.
- A week still loading, a calendar that fails, and a person with no calendar are named on the
  card. None of them reads as a free day.
- One stuck calendar no longer freezes the week, the weather and school. A calendar that takes
  more than 20 seconds counts as unavailable.
- An event over several days is on each of them. A night shift reads "until 06:00" the next
  morning, and a day it covers to midnight reads "All day", not "until 00:00". A v1.0.0
  template-sensor setup has no event ends, so it keeps one row per event.
- A real cast has only the birthdays its config names, each a real `MM-DD` day. Only a v1.0.0
  config keeps the demo birthdays.
- School info in the wrong shape is named on the cards, and the rest still shows.
- A card that closes itself after a minute keeps an unread letter. Got it, Done and a tap
  outside still clear it. A read letter leaves the letter book.
- Midnight moves the week on, and a slow old load cannot bring the old week back. A stopped
  engine runs no more timeouts.
- A keyboard or a screen reader can open every card. Each person, the School and each
  landmark with a view has a button, named like its tag ("Kid 2, 1 thing today, letter
  waiting"), that does what a tap does and rings its target on the scene while it has focus.
- The popup is a dialog. Done takes focus when it opens, Tab stays inside it, Escape closes it
  the way Done does, and closing hands focus back. A closed popup is hidden from Tab and from
  readers. The status line is spoken when its words change.
- Status tiles and the announcement banner are buttons that act on a tap, Enter or Space, and
  a new announcement is read out. Grey "unavailable" text is 5.7:1 on its grey (was 3.9:1), and
  a tile's label is 13 px (was 11).
- Under 1100 px wide the countdowns, due chips and announcement are rows under the clock and
  tiles, so at 1024 the banner keeps its words and nothing is cut. Under 640 px the corner hint
  goes and the tiles move under a smaller clock. A resize fits the countdown chips again.
  1280x800 looks as it did.
- With **Demo cast** on in a real dashboard, the status line says "Demo data. Turn off Demo
  cast in the card editor to see your calendars", and the cards' feet say the same instead of
  "Calendars checked". The demo page on its own is unchanged. A long status line wraps in the
  corner instead of running into the countdowns.

Editor
- A "Birthday (MM-DD)" field per person. A rename carries the birthday and anniversary along.
- The household's row asks only what a household has, and an edit keeps a look-less person's
  animal.

Room panels
- A restart does not announce a finished timer twice.
- Done on a kid panel clears only the letter that was on screen.

Tests, CI and docs
- The real engine boots in tests, and the built card loads into a real Home Assistant
  (2024.11.0 and stable) in Chromium. CI also runs the checks on New York time.
- CI opens `/demo/` in Chromium at 1280x800, 1024x768, 800x1280 and 400x800 and fails on
  overlapping HUD boxes, a keyboard that cannot open and close a card, or a page error
  (`tests/demo/smoke.py`, screenshots kept as an artifact).
- The README has a contents list and a troubleshooting section, and the school data shapes
  moved to docs/08-school-data.md.

## 1.10.2 (2026-10-30)

- Home Assistant minimum lowered to 2024.11 for the card, 2024.12 for the room panel packages.
- Light page fix for Home Assistant before 2026.10: an on/off lamp no longer turns on when a
  panel sends a brightness.
- The panel tests run on old and stable Home Assistant images.

## 1.10.1 (2026-10-28)

- Light page redesign: full-width sliders with a bigger knob, two tabs on a short screen, and
  a dimmed slider for a value the lamp cannot report.
- `hold_row_height` and `hold_row_gap` are no longer read.

## 1.10.0 (2026-10-28)

- Room panels get a light page, opened by holding a light tile or lamp pill: on and off,
  brightness, warmth and colour, each only where the lamp can do it.
- A garden theme for kid panels, and lamp pills on the kid Home page.
- A kid panel with no letter shows nothing. A waiting letter is a small envelope.
- The Cheap Yellow Display defaults match the 2-USB ST7789 board.

## 1.9.3 (2026-10-28)

- The kitchen timer chime is louder and climbs while it rings. A Test alarm button plays it.
- Wi-Fi power save is off on every panel.

## 1.9.2 (2026-10-28)

- Room panel screens redrawn: smooth text, readable "All off" and Done buttons, and an 8 px
  grid so nothing clips.
- The kitchen Home page is the room lights again.

## 1.9.1 (2026-10-28)

- The panel night glow lights. ESPHome's gamma correction had pushed the 4% level to nothing.
  Set `backlight_gamma: "2.8"` to keep the old curve.

## 1.9.0 (2026-10-28)

- A letter opens on an airmail-striped sheet on the person's card, with a **Got it** button.
- Got it, or closing the card, clears the letter. Opening the card no longer does.
- A red envelope badge on the name tag, and the postie only goes out while the family is up.
- A card under 640 px wide stacks the face over the lists, so a phone can read it.

## 1.8.0 (2026-10-26)

- Letters from the room panels reach the wall card. Give a person `letter: input_text.letter_x`
  and the card delivers it and empties the helper.
- A missing helper says "Letters unavailable". The editor has an "Own letter helper" field.

## 1.7.0 (2026-10-26)

- The town crier. A new announcement sends a crier out of a building in the scene to ring a
  bell and unroll a scroll. Switches: `announcement_crier`, `announcement_sound`,
  `announcement_clear`, `announcement_late`.

## 1.6.0 (2026-10-26)

- Optional announcement banner, due-time chips and up to four status tiles in the sky. Each is
  off until its entity is named, and a missing one says "unavailable".

## 1.5.1 (2026-10-26)

- Art polish on the five scenes. No behaviour or config changes.

## 1.5.0 (2026-10-26)

- The space station scene and six aliens (`alien_gloop`, `alien_tetra`, `alien_zib`,
  `alien_rock`, `alien_bloom`, `alien_dome`).
- The card is minified: 572 KB to 434 KB.

## 1.4.0 (2026-10-26)

- Winter village and forest camp scenes, each with tappable landmarks and a school run.
- Four animals: owl, rabbit, frog and cat.

## 1.3.0 (2026-10-26)

- A British seaside scene.
- Every scene has tappable landmarks that open the School card or a `view`.
- A child's card moves to the next school day when their last lesson ends, not at 15:30.

## 1.2.0 (2026-10-26)

- School data per child: lessons, lunch with allergens and a packed or school choice, and a
  School card with every child's week in one grid.
- Every empty state says which one it is, and a missing sensor is named.
- Fox and hedgehog join the cast. The card is built from `src/` modules.

## 1.1.0 (2026-10-26)

- A visual editor for the cast, sensors, scene and demo switch.
- Calendars read directly from Home Assistant, so the `family_week` template sensor is no
  longer needed. v1.0.0 configs keep working.
- First install starts on the demo cast. A calendar that does not answer is named on its
  owner's card.

## 1.0.0 (2026-10-26)

- First release: `custom:family-dashboard-card`, the meadow, a built-in demo cast and HACS
  install as a custom repository.
