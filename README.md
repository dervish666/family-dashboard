# Family Dashboard

A Lovelace card for a Home Assistant wall panel. It draws a small animated world, a village
meadow, a British seaside, a village under snow, a camp in the woods or a space station, where
each member of the household lives as a creature (an animal, or an alien on the station). Tap one to see that person's week, pulled from your Home
Assistant calendars.

![The meadow by day, with the band playing and a print on the go](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/meadow.png)

Kids walk to school, the workshop builds whatever the 3D printer is printing, a postie
delivers notes typed on a phone, and everyone dances when music plays. Optional extras put
an announcement, what is due when, and a few status tiles in the sky. The scene follows the
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

- **People**: add, remove and reorder. Each has a name, adult or kid, an animal (see
  [Animals](#animals)), a colour,
  accessories (glasses, headphones, a daisy, the bee), whether they go to school, and one or
  more calendars. A child who goes to school also gets a timetable and a lunch menu sensor.
  The last person is the household.
- **Sensors**: weather, music speaker, letter helper, trips calendar, 3D printer, and the
  school data and kit sensors. All optional. Empty means that part of the scene stays off.
- **Scene**: the meadow, the seaside, the winter village or the forest camp, from a
  drop-down. Under it the editor lists the animals that suit the scene you picked. See
  [Scenes](#scenes).
- **Announcements and due times**: the announcement entity and its heading, and the due-times
  sensor. See [Announcements, due times and status tiles](#announcements-due-times-and-status-tiles).
- **Status tiles**: up to four, each with an entity, a label, an icon, a unit, where the icon
  is empty and full, the colour thresholds and the on and off colours.
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

## Scenes

![The seaside by day: the promenade and its beach huts, the pier with the band in its pavilion, the boat shed and the lighthouse](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/seaside.png)

| Scene | `scene:` | Where the family lives | What a tap opens |
|---|---|---|---|
| Meadow (the default) | `meadow` | a village with a high street, the school, the woodcutter, a pond and a pitch | the school: the School card. The cottage: `view.home`. The bandstand: `view.music`. The workshop: `view.printer`. The office robot: `view.office` |
| Seaside | `seaside` | a British beach: the promenade on its sea wall, beach huts, a pier with a pavilion, rock pools, deckchairs, chalk cliffs and a lighthouse | the fingerpost up the lane to school: the School card. Beach hut No. 7: `view.home`. The band in the pier's pavilion: `view.music`. The boat shed: `view.printer`. The lighthouse: `view.office` |
| Winter village | `winter` | a British village under snow: the school with its bell, the church, The Robin pub, the post office, the smithy, Christmas lights between the lamps, the village tree, a frozen pond, snowmen and the family's cottage on the green | the school: the School card. The cottage: `view.home`. The church, where carol singers gather: `view.music`. The smithy: `view.printer`. The post office: `view.office` |
| Forest camp | `forest` | a clearing in a wood: the family's bell tent, a campfire with log seats and a kettle, a string of paper lanterns, the woodpile, a stream running down to a pool, and a lookout up in the old oak | the fingerpost on the trail to school: the School card. The bell tent: `view.home`. The campfire: `view.music`. The woodpile: `view.printer`. The lookout: `view.office` |
| Space station | `station` | the observation deck of a little station under a big window onto space (stars, a nebula, a ringed planet, passing ships): the family's hab pod, the holo table, cargo crates, a corridor, and a hydroponics corner with a pool | the airlock to the shuttles: the School card. The hab pod: `view.home`. The comms console: `view.music`. The fabricator: `view.printer`. The bridge: `view.office` |

| Winter village at dusk | Forest camp at night |
|---|---|
| ![The winter village at dusk: lamps and Christmas lights on, carol singers at the church, smoke from the chimneys](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/winter.png) | ![The forest camp at night: the campfire lighting everyone round it, lanterns, fireflies and an owl in the oak](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/forest.png) |

Pick one in the editor's **Scene** drop-down, or in YAML:

```yaml
type: custom:family-dashboard-card
scene: winter        # or meadow, seaside, forest, station
```

A config without `scene` gets the meadow, so older cards look exactly as they did. The kids
leave for school in every scene: in the meadow they queue at the village school, at the
seaside they go up the slipway, along the promenade and off up the lane to town, in the winter
village they walk along the lane past the school and off, and at the forest camp they take the
trail past the fingerpost into the wood. They come back the same way. Anyone else with
somewhere to be leaves the same way (the bus stop in the meadow), and walks round the
campfire, the tents or the frozen pond rather than through them.

The tide at the seaside follows the clock, the band plays when your speaker does, and the
lamps, the pavilion and the chip shop light up after dark. In the winter village the snow
always lies; snow falling follows your weather and covers the trodden paths, smoke rises from
the chimneys, a robin hops about the green and flies off from anyone close, and when your
speaker plays carol singers gather at the church door and the bell swings. At dusk the windows,
the lamps and the Christmas lights come on and spill warm light on the snow. At the forest
camp a duck paddles on the pool and a squirrel runs about by day; the fire burns low in the
rain and leaps when your speaker plays, and at dusk it lights everyone round it while the
lanterns come on, fireflies rise and two owls wake up in the trees. The swimmers dive in the
forest pool; the winter pond is frozen, so they stay out.

The meadow's village life stays in the meadow: the walkers and their errands, the workshop
building up with a print's progress, the postie on foot (at the seaside letters come by air),
the kit bag by the cottage, the house party and the office robot.

### The space station

![The space station by day: the big window onto space with its ringed planet, the airlock, comms console, corridor, fabricator and bridge along the wall, and the aliens round the holo table](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/station.png)

The station's day and night are its lighting cycle: after dark the wall lights dim, the floor
guide lights, screens and the hab pod's window glow, and the planet's night side shows its
cities. Your weather becomes what the window shows: cloud and fog are drifting nebula, rain is a
meteor shower (and the hydroponics misters run), a storm is a solar flare with the shields up
and amber beacons turning, snow is an ice field drifting past with frost on the glass, and a
rainbow is an aurora over the planet. Wind is ignored indoors. The next event is towed past the
window by a little tug instead of a plane, and a party's glitter ball hangs from the sill.

The kids leave for school through the airlock (its door opens for them) and come back the same
way. The fabricator shows your printer's progress, the comms console's screen and the hologram
on the table dance when your speaker plays, a cleaning bot potters about the deck, a drone
waters the plants, and now and then a space whale drifts past. The swimmers dive in the
hydroponics pool.

With no `people` in the config (the demo cast), the station casts six aliens instead of
animals; a cast you set keeps the looks you gave it. Any animal can live on the station and any
alien in another scene.

```yaml
type: custom:family-dashboard-card
scene: station
people:
  - { name: Parent 1, role: adult, look: alien_tetra, col: "#F4C95D", calendar: calendar.parent_1, glasses: true }
  - { name: Parent 2, role: adult, look: alien_rock, col: "#7FC8D2", calendar: calendar.parent_2 }
  - { name: Kid 1, role: kid, look: alien_zib, col: "#E68AB0", calendar: calendar.kid_1, school: true, phones: true }
  - { name: Kid 2, role: kid, look: alien_gloop, col: "#E86A5B", calendar: calendar.kid_2, school: true }
  - { name: Kid 3, role: kid, look: alien_bloom, col: "#9A72C8", calendar: calendar.kid_3, school: true }
  - { name: House, look: alien_dome, col: "#5FC2BE", calendar: calendar.family }
```

## Animals

![The new animals in their poses: idle, walking, a habit, asleep, and as grown-ups](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/animals.png)

Every person is one animal, set with `look:` or the editor's **Animal** drop-down. The rigged
ones move in pieces: they walk, idle with habits of their own, and at bedtime shut their eyes;
the four added in v1.4.0 also settle into a sleeping pose.

| Animal | `look:` | Its habits | Suits |
|---|---|---|---|
| Crow | `crow` | hops, cocks its head, stoops for anything shiny | meadow, seaside, winter, forest |
| Capybara | `capybara` | chews, flicks its ears, balances a yuzu | meadow, seaside, winter |
| Deer | `deer` | twitches its ears, grazes, pronks | meadow, winter, forest |
| Shark | `shark` | swims across dry land in its own puddle, dives in the water | meadow, seaside, station |
| Otter | `otter` | twitches its whiskers, floats on its back in the water | meadow, seaside, forest, station |
| Snail | `snail` | carries the house about, slowly | every scene |
| Fox | `fox` | flicks its ears, swishes its brush, pounces on nothing | every scene |
| Hedgehog | `hedgehog` | snuffles, bristles when startled | meadow, seaside, winter, forest |
| Owl | `owl` | turns its head right round, tilts it to listen, rouses with a flap; waddles; sleeps sunk into its feathers | winter, forest, station (and the meadow) |
| Bunny | `rabbit` | ears that twitch one at a time, a nose that never stops, a binky when happy, a thump when startled; sleeps with its ears laid back | winter, forest, meadow |
| Frog | `frog` | croaks with its cheek sacs, sits still then leaps; sleeps low with its eyes drawn down | forest (the stream), meadow (the pond), station (the hydroponics pool) |
| Cat | `cat` | a slow blink, ear flicks, a tail swish, washes a paw; wears a collar in the person's colour; sleeps with its tail laid out | winter, forest, meadow, seaside, station |
| Bear, Bunny (classic) | `bear`, `bunny` | the older whole-sprite looks, unchanged | |

```yaml
type: custom:family-dashboard-card
scene: forest
people:
  - { name: Parent 1, role: adult, look: owl, calendar: calendar.parent_1 }
  - { name: Kid 1, role: kid, look: frog, calendar: calendar.kid_1, school: true }
  - { name: Kid 2, role: kid, look: rabbit, col: "#E68AB0", calendar: calendar.kid_2, school: true }
  - { name: House, look: cat, calendar: calendar.family }
```

`look: bunny` is still the older whole-sprite bunny, so a v1.3.0 card that uses it looks the
same; `look: rabbit` is the new rigged one, listed as **Bunny** in the editor (the old one is
**Bunny (classic)**). The cat's collar takes the person's `col`; the other new animals keep
their own colours, like the fox and hedgehog.

### Aliens

![The six aliens in their poses: idle, walking, a habit, waving, asleep, and as grown-ups with and without glasses](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/aliens.png)

The space station's cast, rigged like the animals, each with a habit and a sleeping pose of its
own. Pick one in the editor's **Animal** drop-down (they are listed with "(alien)" after the
name) or set `look:` in YAML. Each species has its own colour; the person's `col` goes on one
thing it wears or grows, so the family still reads by colour.

| Alien | `look:` | Its habits | The person's colour |
|---|---|---|---|
| Gloop | `alien_gloop` | a one-eyed mint jelly: wobbles, gives itself a jiggle, settles into a puddle asleep. Glasses become a monocle | the bow on its curl |
| Tetra | `alien_tetra` | tall, four arms, always a cup of tea: sips it, tilts its head, nods off with the cup lowered | the bow tie |
| Zib | `alien_zib` | a little floater with tentacles: bobs, leans in as it goes, boings, settles onto its tentacles to sleep | the bulb on its antenna |
| Boulder | `alien_rock` | a gentle stone giant with a sprout on its head: stomps, pats the sprout, hunkers down | the crystals on its shoulder |
| Bloom | `alien_bloom` | a walking plant: flaps its leaves, shakes out pollen, its flower droops shut at night | the petals |
| Domo | `alien_dome` | scuttles on six legs with its home, a glass dome with a garden, on its back: peers about on its eye stalks, polishes the dome | the band round the dome |

## School data per child

Each child can have a lesson timetable and a school lunch menu, each read from a sensor
attribute. Tap the child and their card shows today's lessons (the next school day's once
today's last lesson has ended, or when there is no school), the week's grid folded under them,
and lunch today and on the next school day with the options, their allergens and whether the
child takes a packed lunch. Tap the school and every child's week sits in one grid, one lane
each, with today's lunches below.

| A child's card | The School card |
|---|---|
| ![Kid 2's card: lessons, then lunch with allergens and the choice](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/school-child.png) | ![The School card: each child's week in one grid, then lunch](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/school-card.png) |

```yaml
people:
  - { name: Kid 1, school: true, calendar: calendar.kid_1, timetable: sensor.kid_1_timetable }
  - name: Kid 2
    school: true
    timetable: sensor.kid_2_timetable
    lunch: sensor.kid_2_lunch
    choice: { fri: packed }               # or packed, school, or input_select.kid_2_lunch
  - { name: Kid 3, school: true, lunch: { entity: sensor.kid_3_school, attribute: lunch } }
```

`timetable` and `lunch` are sensor ids. The card reads the `timetable` and `menu` attributes,
or the one you name with `{ entity, attribute }`. An attribute may also be a JSON string.
Leave one out and that section is not on the card. Set one that is missing and the card says
`Timetable unavailable (sensor.kid_1_timetable)` and why in its footer, rather than showing a
day with no lessons.

### The timetable attribute

```json
{
  "weeks": ["A", "B"],
  "anchor": "2026-09-07",
  "week_of": { "2026-11-02": "B", "2026-12-21": null },
  "periods": [
    { "p": 1, "start": "08:50", "end": "09:50" },
    { "p": 2, "start": "09:50", "end": "10:50" },
    { "p": "Reg", "start": "13:20" }
  ],
  "days": {
    "A": { "mon": [{ "p": 1, "subject": "Maths", "room": "M1" }, { "p": 2, "subject": "Art" }] },
    "B": { "mon": [{ "p": 1, "subject": "French", "room": "L2" }], "tue": ["History|H2", "Science"] }
  },
  "closed": ["2026-10-28", { "date": "2026-12-18", "note": "INSET" }]
}
```

- `weeks` names the rotation in order. A one-week timetable is `["A"]` and needs nothing else.
- `anchor` is any day in the first week. The card counts whole weeks from it, so with the
  anchor above, the week of 19 October is A and the week of 26 October is B.
- `week_of` names the week that starts on a Monday, and the count carries on from there. Use
  it when the school breaks the pattern, for example after a half term that does not count.
  `null` is a week off the timetable. Any day of the week works as the key.
- `periods` sets the rows and their times. There can be any number. A lesson whose `p` is not
  listed still shows, after the listed ones.
- `days` maps each week to `mon` to `fri` (full names work too). A lesson is
  `{ p, subject, room }`, with its own `start` and `end` if it does not match its period, or a
  `"Subject|Room"` string, numbered by position.
- `closed` lists days with no school, plain or with a note. The card says
  `No school today (INSET)` and shows the next school day.
- The `end` times decide when a child's card moves on to the next school day: at the end of
  that child's last lesson today, to the minute. A day where no lesson has an end time (a
  period listed without `end`, or a v1.1.0 sensor) moves on at 15:30.

Saturdays and Sundays are always the weekend. A rotation of two or more weeks with no
`anchor` and no `week_of` cannot say which week it is, and the card says so.

### The lunch attributes

```json
{
  "menu": {
    "2026-10-26": {
      "status": "served",
      "options": [
        { "name": "Pasta bake", "kind": "main", "allergens": ["Gluten", "Milk"] },
        { "name": "Bean chilli", "kind": "vegan", "allergens": [] },
        "Jacket potato"
      ],
      "pudding": { "name": "Apple crumble", "allergens": ["Gluten", "Milk"] },
      "choice": "Bean chilli",
      "note": "Harvest lunch"
    },
    "2026-10-27": { "status": "closed", "note": "INSET" },
    "2026-11-02": { "status": "no_menu" }
  },
  "menu_ends": "2026-12-18"
}
```

These are two attributes on the sensor, `menu` and `menu_ends`, or both inside one attribute
named with `{ entity, attribute }`. `status` is `served`, `closed` or `no_menu`; an entry with
options and no status is served. `kind` and `allergens` are shown as given, so use the words
your school prints. A weekday that is not in `menu` reads `Menu not published for this week`,
or `Menu ran out after Fri 18 Dec` once it is past `menu_ends`.

**The choice.** `choice` on the person says packed lunch or school dinner: `packed` or
`school` every day, a weekday map such as `{ mon: school, fri: packed }`, or an entity whose
state says it (an `input_select` with `Packed lunch` and `School dinner` works). A `choice` on
a menu day overrides the config for that day; when it names one of the options, that option
is marked as chosen. A choice entity wins over both, and when it is unavailable the card falls
back and says so in the footer.

### Feeding the sensors

The card does not care how the attributes are made. Four ways that work:

- **A JSON file and a `command_line` sensor.** The simplest for a timetable, which changes
  once a year. Keep the file out of `/config/www/`, which is public.

  ```yaml
  command_line:
    - sensor:
        name: Kid 1 Timetable
        unique_id: kid_1_timetable
        command: "cat /config/school/kid_1_timetable.json"
        value_template: "{{ value_json.timetable.weeks | join(',') }}"
        json_attributes: [timetable]
        scan_interval: 3600
  ```

  The file holds `{ "timetable": { ... } }`. `rest` takes the same `json_attributes` list when
  the file is served from another machine. `scrape` returns one value per sensor, so turn a
  school's web page into the JSON above with a script first.
- **A template sensor that writes the next 14 days.** For a menu printed as a rotation of
  weeks. `homeassistant/configuration.example.yaml` has the whole sensor; the heart of it:

  ```jinja
  {% set ns = namespace(m={}) %}
  {% for i in range(14) %}
    {% set d = now().date() + timedelta(days=i) %}
    {% set key = d.isoformat() %}
    {% if d.weekday() < 5 and key in closed %}
      {% set ns.m = dict(ns.m, **{key: {'status': 'closed', 'note': closed[key]}}) %}
    {% elif d.weekday() < 5 %}
      {% set w = ((d - start).days // 7) % rota | length %}
      {% set ns.m = dict(ns.m, **{key: dict(rota[w][d.weekday()], status='served')}) %}
    {% endif %}
  {% endfor %}
  {{ ns.m }}
  ```
- **An override helper.** When the school swaps a week, type the letter into an
  `input_text` and have the timetable template add `week_of` for this Monday from it. The
  example config shows the three lines. The lunch `choice` can point straight at an
  `input_select`.
- **Keep large sensors out of the recorder.** Home Assistant does not record attributes over
  16 KB and logs a warning each time. A full two-week timetable or a term of menus can pass
  that, and the history is useless anyway:

  ```yaml
  recorder:
    exclude:
      entities: [sensor.kid_1_timetable, sensor.kid_2_lunch]
  ```

### Coming from v1.1.0

v1.1.0 put one child's timetable and lunch in `sensors.timetable` and `sensors.lunch`, with
`schoolWho` naming the child. Those configs keep working: the card copies each sensor onto
the child `schoolWho` names, and the flat v1.1.0 shapes (`lessons_today` with
`"Subject|Room"` strings, `grid`, `main_today`, `status_today`) still parse. A child's own
`timetable` or `lunch` wins over the copied one. If `schoolWho` names someone who is not in
`people`, the console warns and the School card says which sensor has no owner. To move over,
set `timetable` and `lunch` on the child and delete the two sensors and `schoolWho`.

### Coming from v1.0.0

v1.0.0 configs keep working unchanged. A config with no `calendar` on anyone still reads
`sensor.family_week` and keeps every v1.0.0 default, including the `family_*` sensors and
the `/wall-panel/...` taps. Add a `calendar` to people and the card reads the calendars
itself; you can then delete the `family_week` template sensor if nothing else uses it.
Opening a v1.0.0 card in the visual editor shows a **Week template sensor** field so the old
setup stays editable.

## Announcements, due times and status tiles

![The meadow with an announcement, two due-time chips and four status tiles](https://raw.githubusercontent.com/dervish666/family-dashboard/main/docs/img/extras.png)

Three optional things that sit in the sky over any scene, new in v1.6.0. Each one is off
until you name its entity, and a card without them draws exactly as v1.5.1 did.

**An announcement.** A banner under the countdowns while an `input_text` (or `text`,
`input_select` or `sensor`) holds some text. Set it from a phone, an automation or a script;
empty it and the banner goes. A tap hides it on that screen until the text changes.

```yaml
announcement: input_text.announcement
announcement_title: Announcement     # optional heading
```

The text can carry who it is from and how long it lasts. `"45|Parent 2|Dinner's at six"`
shows "From Parent 2" and goes 45 minutes after the helper changed, which is what a script
wants to write. `"Parent 2: Dinner's at six"` names the sender when that name is in `people`.
Anything else stays up until it is cleared. The helper and a script that announces for a set
time are in [`configuration.example.yaml`](homeassistant/configuration.example.yaml) and
[`scripts.example.yaml`](homeassistant/scripts.example.yaml).

**Due times.** Chips under the countdowns for things with a time on them: library books back
at 15:15, bins out by 7, homework due tomorrow. Anything overdue and anything due in the next
18 hours shows, soonest first, as many as fit, with a badge that counts down (`25m`, `7h`,
`late`). Each person's card lists all of theirs under **Due** ("15:15 Library books back, due in
25 min"); items with no person go on the household's card.

```yaml
due: sensor.due_times                # or { entity: sensor.x, attribute: my_list }
```

The sensor's `items` attribute is a list:

```yaml
items:
  - { label: Library books back, due: "15:15", person: Kid 1 }       # today at 15:15
  - { label: Maths homework, due: "2026-11-03T09:00", person: Kid 2 }
  - { label: Trip form, due: "2026-11-05" }                          # due that day, the household's
```

`person` matches a name or alias in `people`. A template sensor that builds the list is in
`configuration.example.yaml`; it can come from anywhere (a to-do list, a calendar, a school
timetable). An item that does not parse is left out and the cards say how many were skipped.

**Status tiles.** Up to four small tiles under the corner hint, each an icon that shows one
entity: a flask or a thermometer that fills to the reading in its threshold colour, a bulb
that lights, a door that opens, a plug. A tap opens Home Assistant's more-info dialog for the
entity, history and all.

```yaml
status_tiles:
  - entity: sensor.fridge_temperature
    label: Fridge
    icon: flask              # flask, thermometer, bulb, door or plug
    min: 4                   # empty at 4, full at 18
    max: 18
    thresholds:              # the highest one reached sets the colour
      - { from: 0, color: "#5B7FD6" }
      - { from: 10, color: "#3FA34D" }
      - { from: 15, color: "#C9594A" }
  - entity: binary_sensor.back_door
    icon: door
    on_color: "#C9594A"      # open
    off_color: "#3FA34D"     # closed
  - light.porch              # just the entity: a bulb, named after the light
```

`label` defaults to the friendly name, `unit` to the unit of measurement, the icon to one that
suits the domain. `decimals` (0 to 3) fixes the rounding; `color` is the colour below every
threshold.

None of the three goes blank when it cannot read its entity. A missing or unavailable one shows
a grey dashed "Announcements unavailable", "Due times unavailable" or a tile that reads
"unavailable", so a broken sensor never passes for a quiet day. Try them with the demo:
`/demo/?extras` (see [Try it without Home Assistant](#try-it-without-home-assistant)).

## Options

| Option | Default | What it does |
|---|---|---|
| `people` | a demo cast of six | one creature each: `name`, `calendar` (one or a list), `col`, `look`, `role` (`adult` or `kid`), `r`, `tg`, the school sources `timetable`, `lunch` and `choice`, plus flags `adult`, `school`, `glasses`, `phones`, `daisy`, `bee`. The last entry is the household |
| `sensors` | with calendars: `sun` and `weather` only. Without: `sensor.family_week` and friends | entity ids: `week`, `extra`, `kit`, `sun`, `weather`, `printer`, `letter`, `music`, `rain`, `trips`. `timetable` and `lunch` are the v1.1.0 way, see above |
| `dates` | demo birthdays, Halloween to New Year's Eve | `birthdays` (name to `MM-DD`) and `fixed` days, shown as countdowns in the sky |
| `view` | with calendars: all `null`. Without: `/wall-panel/...` paths | which view a tap on a landmark opens: `home`, `music`, `printer` and `office`, see [Scenes](#scenes). `null` leaves that landmark as scenery |
| `anniversary` | the first two people | who gets the party on an "Anniversary" event |
| `schoolWho`, `schoolLine`, `sourceOwner`, `rainStates` | demo values | who owns the kit sensor (and the v1.1.0 timetable and lunch), queue order at the school door, missing-source owners, rain sensor states |
| `officeUrl` | `null` | a JSON status URL for the optional office robot |
| `announcement`, `announcement_title` | none | a banner while the entity holds text, with an optional heading. See [Announcements, due times and status tiles](#announcements-due-times-and-status-tiles) |
| `due` | none | a sensor whose `items` attribute lists `{ label, due, person }`: chips in the sky and a **Due** list on each card |
| `status_tiles` | none | up to four `{ entity, label, icon, unit, min, max, thresholds, on_color, off_color }` tiles under the corner hint |
| `demo` | `false` | run on the built-in demo cast |
| `scene` | `meadow` | which scene to draw: `meadow`, `seaside`, `winter`, `forest` or `station` |
| `query` | none | test hooks, for example `hour=21.5&weather=snow` |
| `height` | `calc(100vh - var(--header-height, 56px))` | card height. Use `100vh` with the header hidden |

Objects such as `sensors` and `view` merge with the defaults, so you only list what changes.
Lists such as `people` replace the default. Unknown keys are ignored. A config the card
cannot draw (a duplicate name, an unknown animal, a calendar id that is not a calendar)
shows an error on the card that says what to change. So does a `timetable` or `lunch` that is
not a `sensor.` entity. [docs/06-views.md](docs/06-views.md) covers each
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
| [07 Room panels](docs/07-room-panels.md) | The optional ESPHome panels: letters, presets, the contracts |

## Room panels (optional)

Small ESP32 touchscreens for the rooms, built with ESPHome and kept in [`esphome/`](esphome/).
A panel in a child's room shows the clock, the family announcement and letters sent to that
child; the child taps the envelope, reads it, taps **Done**, and it is gone from every screen. A
kitchen panel shows today, lunch and kit, what is due, and four preset announcements.

- Three boards: the Guition JC3248W535 (3.5", ESP32-S3), the Guition JC2432W328C and the
  ESP32-2432S028R "Cheap Yellow Display" (both 2.8", ESP32). A device file is three package
  lines and a key.
- Letters are `input_text.letter_<child>` in `from|text` form, sent by
  `script.family_send_panel_letter` from any phone, panel or automation, all in
  [`homeassistant/panels.example.yaml`](homeassistant/panels.example.yaml).
- Panels use the encrypted native API only: no web server, no cloud, no "allow actions".

Until v1.8 the wall card sees a panel letter through the postie (the script copies it there).
Coming in v1.8: card integration, a per-person `letter:` entity that the card shows and clears
when that person's card is opened. Setup, hardware and flashing:
[esphome/README.md](esphome/README.md). The contracts: [docs/07](docs/07-room-panels.md).

## Try it without Home Assistant

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/demo/`. The page's query string goes to the card as test
hooks, so `/demo/?hour=21.5&weather=snow` shows a snowy night, and `/demo/?scene=seaside`
shows the seaside (`scene=winter` and `scene=forest` the other two). Add `extras` for the
announcement, due times and status tiles on made-up states: `/demo/?extras&scene=station`.

## Working on the card

The source is in `src/`. `dist/family-dashboard.js` is built from it by esbuild and
committed, because that one file is what HACS serves. After a change:

```sh
npm ci
npm run build
node tests/check.mjs && sh tests/falsify.sh
```

`dist/` is minified, so stack traces from it name nothing useful. `npm run build:debug` writes
an unminified copy with a source map to `build/` (ignored by git); point a test page at that
one when you need to read a trace. Nothing in `build/` ships.

CI rebuilds `dist/` and fails if the committed file differs from the build. A new animal is a
module in `src/creatures/` plus one line in `src/creatures/index.js`; a new scene is the same in
`src/scenes/`. The check fails if a module is missing part of its interface or is not listed,
and if a scene leaves any landmark unmapped: every scene needs a tappable `school`, `home`,
`music`, `printer` and `office` (the comment in `src/scenes/index.js` has the shape).

## Known limits

- Built and tuned for 1280x800. Other sizes work but every scene was laid out for that one.
  At a phone's width (about 400 px) the scenes' buildings and furniture crowd into each other,
  the space station's wall most of all; use a wide card there.
- On a v1.0.0 setup that reads `sensor.family_week`, names must match `people` exactly,
  since the template sensor tags each event with its owner's name. Calendars set on people
  have no such rule.
- Birthday parties need `dates.birthdays` in YAML. The editor does not edit dates yet.
- The editor sets a child's timetable and lunch sensor ids. `choice`, and an attribute other
  than `timetable` or `menu`, are YAML only.
- A tap on the announcement hides it on that screen only. It does not empty the helper, so
  phones and other panels keep showing it until the text changes, is cleared or runs out.
- The HUD (clock, countdowns, announcement, due times, tiles) is laid out in fixed pixels for
  1280x800. On a narrow card the announcement and the tiles can overlap.
- The 3D printer workshop speaks the [Bambu Lab integration](https://github.com/greghesp/ha-bambulab)'s
  sensor names only.

## Licence

MIT, see [LICENSE](LICENSE). The bundled fonts keep their own licence (SIL OFL 1.1), see
[dist/fonts/NOTICE](dist/fonts/NOTICE).
