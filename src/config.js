// Card config: the defaults, normalize() and the first-install stub.
import { CREATURES } from "./creatures/index.js";
import { SCENE_LIST } from "./scenes/index.js";
import { TIMETABLE_ATTR, LUNCH_ATTR, DAY_KEYS } from "./school.js";
import { normAnnouncement, normDue, normTiles } from "./extras.js";
import { normCrier } from "./crier.js";

// ══ CONFIG ═══════════════════════════════════════════════════════════════════
// Everything household-specific lives in this one object. Edit it and nothing else.
// The defaults are a neutral demo cast; rename them to your own people.
//
// people, one entry per creature:
//   name     the label on the name tag; must match `who` in sensor.family_week and
//            sensor.family_extra exactly (the calendar template writes it).
//   aliases  optional, other spellings the calendars use for this person (birthday matching).
//   col      tag and umbrella colour; keep it in step with the Today view's per-person colours.
//   r        body radius in px at depth 1.
//   look     crow | capybara | deer | shark | otter | snail (rigged and animated in parts).
//            bear, bunny, phones, curls, flower are the older whole-sprite looks.
//   tg       how far above the feet the name tag sits, in body radii; ears and flowers differ.
//   adult    narrower, taller body, smaller eyes, brows. Kids get cheeks and a w mouth.
//   glasses  round reading glasses.   bee: a bee circles this one (one person only).
//   phones   headphones.   daisy: a daisy behind one ear.   Both work on any animal.
//   school   this person's items count on the School tag and card.
//   timetable, lunch   this child's school sensors: an entity id, or { entity, attribute }
//            when the data is not in the default attribute (timetable / menu). See school.js.
//   choice   packed lunch or school dinner: "packed", "school", a weekday map
//            ({ fri: packed }) or an entity whose state says it (input_select.kid_lunch).
//   letter   v1.8.0: this person's own letter helper, an input_text or text entity holding
//            "from|text" (the room panels' contract, letters.js). Opening their card empties it.
// The last entry, "House", is the household: bin day, window cleaner, anything nobody owns.
// Swapping someone's animal is changing their look (and tg if the tag sits wrong).
export const DEFAULTS = {
  people: [
    { name: "Parent 1", col: "#7FC8D2", r: 37, look: "crow",     tg: 2.25, adult: true, glasses: true, bee: true },
    { name: "Parent 2", col: "#9A72C8", r: 36, look: "capybara", tg: 2.6,  adult: true },
    { name: "Kid 1",    col: "#A3B0F2", r: 40, look: "deer",     tg: 2.75, phones: true, school: true },
    { name: "Kid 2",    col: "#D4A8F5", r: 36, look: "shark",    tg: 1.6,  school: true },
    { name: "Kid 3",    col: "#9EE0B4", r: 31, look: "otter",    tg: 2.55, daisy: true, school: true },
    { name: "House",    col: "#E0A050", r: 37, look: "snail",    tg: 2.05 }
  ],
  // The two who get a party on a calendar event titled "Anniversary".
  anniversary: ["Parent 1", "Parent 2"],
  // Home Assistant entities. The first two are required; the rest are optional and a
  // missing one blanks only its own part of the School card.
  sensors: {
    week: "sensor.family_week",        // every event on every calendar for the next 7 days, tagged who/what/day/at/all_day
    extra: "sensor.family_extra",      // school items, kit, flags, term dates, and which sources could not be checked
    timetable: "sensor.family_timetable", // v1.1.0: one child's lessons; now people[].timetable
    kit: "sensor.family_kit",          // what kit is needed today
    lunch: "sensor.family_lunch",      // v1.1.0: one child's lunch menu; now people[].lunch
    sun: "sun.sun",
    weather: "weather.forecast_home",
    // Optional extras. null switches that part of the meadow off and nothing else.
    printer: null,                      // e.g. "sensor.a1mini_SERIAL_": a Bambu Lab printer's sensor prefix (ha-bambulab); the workshop builds the print
    letter: "input_text.family_letter", // the postie's letters, typed on a phone as "Kid 3: tea's at six"
    music: "media_player.music",        // the speaker: the meadow dances while it plays music
    rain: null,                         // e.g. "sensor.rain_sensor": adds rain the forecast misses (see rainStates)
    trips: "calendar.family"            // events titled "Holiday ..." on this calendar become countdowns
  },
  // Whose card the optional school sensors belong to. For timetable and lunch this is the
  // v1.1.0 way: normalize() copies them onto that person (people[].timetable, .lunch).
  schoolWho: { timetable: "Kid 2", kit: "Kid 3", lunch: "Kid 3" },
  // sensor.family_extra names its sources, not people. Map a source name (regex) to the
  // person whose card should say "couldn't check", so a missing source does not read
  // as a quiet week. The House card lists every missing source.
  sourceOwner: [[/parent-mail/, "Parent 2"], [/high-school/, "Kid 1"], [/primary/, "Kid 3"], [/academy/, "Kid 2"]],
  // The order the school kids stand in at the school door, front to back. Put the
  // tallest name tag (highest tg) first so the tags open out rather than overlap.
  schoolLine: ["Kid 1", "Kid 3", "Kid 2"],
  // What the rain sensor's states mean (sensors.rain). Anything else is no reading.
  rainStates: { wet: ["raining", "wet", "on"], dry: ["none", "dry", "off"] },
  // Countdowns in the sky. Birthdays are month-day and must use names from people;
  // each one throws the party on the day. The fixed days work for anyone.
  dates: {
    birthdays: { "Parent 1": "03-14", "Parent 2": "06-02", "Kid 1": "01-22", "Kid 2": "10-09", "Kid 3": "07-27" },
    fixed: [
      { key: "halloween", label: "Halloween", icon: "pumpkin", md: "10-31", rave: "halloween", party: "Happy Halloween!" },
      { key: "bonfire", label: "Bonfire night", icon: "fire", md: "11-05", rave: "bonfire", party: "Bonfire night!" },
      { key: "christmas", label: "Christmas", icon: "tree", md: "12-25", rave: "christmas", party: "Merry Christmas!" },
      { key: "nye", label: "New Year's Eve", icon: "sparkle", md: "12-31", rave: "new years eve", party: "Happy New Year!" }
    ]
  },
  // Tap shortcuts: a building opens its own dashboard view. null leaves that
  // building as scenery. Paths are views in dashboards/wall-panel.yaml.
  view: { home: "/wall-panel/home", music: "/wall-panel/music", printer: "/wall-panel/printer", office: null },
  // The office robot: a URL that answers GET with an agent office's state as JSON,
  // cross-origin (docs/06-views.md, "A page from another server"). null keeps the
  // robot out of the meadow entirely, which is what you want unless you run one.
  officeUrl: null
};
// ══ end of CONFIG ════════════════════════════════════════════════════════════

// ── Config ────────────────────────────────────────────────────────────────────
// normalize() turns a card config into what the meadow runs on. Two shapes work:
//   v1.0.0: people plus sensors.week (the family_week template sensor). Every default
//           in DEFAULTS still applies, so a v1.0.0 config behaves exactly as before.
//   v1.1.0: a calendar (or a list of them) on each person. The card reads those
//           calendars itself, and every optional sensor and building tap starts off
//           (null) unless the config names it, so a fresh install has nothing to set up.
// Plain objects merge one level deep over the defaults, lists replace. Unknown keys are
// ignored. Anything that would draw wrong throws an Error that says what to change.
// The looks come from the creature registry (creatures/index.js), in its order: the first
// six are the default cast's and a person with no look gets one of them by position.
export const LOOKS = CREATURES.map(function (c) { return c.id; });
export const LOOK_TG = {};
CREATURES.forEach(function (c) { if (c.tg) LOOK_TG[c.id] = c.tg; });
export const PALETTE = ["#7FC8D2", "#9A72C8", "#A3B0F2", "#D4A8F5", "#9EE0B4", "#E0A050", "#F2A0A0", "#E8D070"];
export const ACCESSORIES = ["glasses", "phones", "daisy", "bee"];
// Scenes the card can draw, from the scene registry (scenes/index.js). The first is the default.
export const SCENES = SCENE_LIST.map(function (s) { return { id: s.id, name: s.label }; });
const CARD_KEYS = ["demo", "query", "height", "scene"];
const OPTIONAL_SENSORS = ["extra", "timetable", "kit", "lunch", "printer", "letter", "music", "rain", "trips"];

function cfgError(msg) { return new Error("family-dashboard-card: " + msg); }
function hexColour(v, i) {
  if (v == null || v === "") return PALETTE[i % PALETTE.length];
  if (Array.isArray(v) && v.length === 3) return rgbHex(v);
  const s = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  throw cfgError("people[" + i + "].col must be a hex colour like \"#7FC8D2\", got " + JSON.stringify(v));
}
export function rgbHex(a) {
  return "#" + a.map(function (n) { const h = Math.max(0, Math.min(255, Math.round(+n || 0))).toString(16); return h.length < 2 ? "0" + h : h; }).join("");
}
function calendarsOf(p, i) {
  const v = p.calendar != null ? p.calendar : p.calendars;
  if (v == null || v === "") return [];
  const list = Array.isArray(v) ? v : [v];
  list.forEach(function (id) {
    if (typeof id !== "string" || !/^calendar\.[a-z0-9_]+$/.test(id))
      throw cfgError("people[" + i + "].calendar must be a calendar entity id like calendar.family, got " + JSON.stringify(id));
  });
  return list.filter(function (id, k) { return list.indexOf(id) === k; });
}
function normPerson(p, i) {
  if (!p || typeof p !== "object" || Array.isArray(p)) throw cfgError("people[" + i + "] must be an object with at least a name");
  const name = typeof p.name === "string" ? p.name.trim() : typeof p.name === "number" ? String(p.name) : "";
  if (!name) throw cfgError("people[" + i + "] needs a name");
  const look = p.look == null || p.look === "" ? LOOKS[i % 6] : String(p.look);
  if (LOOKS.indexOf(look) < 0) throw cfgError(name + ": look must be one of " + LOOKS.join(", ") + ", got " + JSON.stringify(p.look));
  const out = Object.assign({}, p);
  out.name = name; out.look = look; out.col = hexColour(p.col, i);
  if (p.role != null) {
    if (p.role !== "adult" && p.role !== "kid") throw cfgError(name + ": role must be adult or kid, got " + JSON.stringify(p.role));
    if (p.adult == null) out.adult = p.role === "adult";
  }
  out.adult = !!out.adult;
  out.r = isFinite(+p.r) && +p.r > 0 ? +p.r : out.adult ? 37 : 34;
  out.tg = isFinite(+p.tg) && +p.tg > 0 ? +p.tg : LOOK_TG[look] || 2.3;
  out.calendars = calendarsOf(p, i);
  out.timetable = schoolSource(p.timetable, TIMETABLE_ATTR, name, "timetable");
  out.lunch = schoolSource(p.lunch, LUNCH_ATTR, name, "lunch");
  out.choice = lunchChoiceConf(p.choice, name);
  out.letter = letterConf(p.letter, name);
  delete out.calendar; delete out.role;
  return out;
}
// people[].letter: an input_text or text entity id, or null.
function letterConf(v, name) {
  if (v == null || v === "") return null;
  const id = typeof v === "string" ? v.trim() : "";
  if (!/^(input_text|text)\.[a-z0-9_]+$/.test(id)) throw cfgError(name + ": letter must be an input_text or text entity id like input_text.letter_kid_a, got " + JSON.stringify(v));
  return id;
}
// people[].timetable and .lunch: a sensor id, or { entity, attribute } for data kept in an
// attribute with another name. Normalised to { entity, attribute } or null.
function schoolSource(v, attr, name, key) {
  if (v == null || v === "") return null;
  const o = typeof v === "string" ? { entity: v } : v && typeof v === "object" && !Array.isArray(v) ? v : null;
  const bad = name + ": " + key + " must be a sensor entity id like sensor.kid_" + key + ", or { entity, attribute }, got " + JSON.stringify(v);
  if (!o || typeof o.entity !== "string" || !/^sensor\.[a-z0-9_]+$/.test(o.entity.trim())) throw cfgError(bad);
  if (o.attribute != null && (typeof o.attribute !== "string" || !o.attribute.trim())) throw cfgError(name + ": " + key + ".attribute must be an attribute name, got " + JSON.stringify(o.attribute));
  return { entity: o.entity.trim(), attribute: o.attribute ? o.attribute.trim() : attr };
}
// people[].choice: a word ("packed", "school"), a weekday map ({ fri: packed }), or an entity
// whose state is the word. Normalised to { value }, { days } or { entity }, or null.
function lunchChoiceConf(v, name) {
  if (v == null || v === "") return null;
  if (typeof v === "string") return /^[a-z_]+\.[a-z0-9_]+$/.test(v.trim()) ? { entity: v.trim() } : { value: v.trim() };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    if (typeof v.entity === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(v.entity)) return { entity: v.entity };
    const days = {};
    Object.keys(v).forEach(function (k) {
      const key = String(k).toLowerCase().slice(0, 3);
      if (DAY_KEYS.indexOf(key) < 0 || typeof v[k] !== "string") throw cfgError(name + ": choice days must be weekdays mapped to words, like { fri: packed }, got " + JSON.stringify(k) + ": " + JSON.stringify(v[k]));
      days[key] = v[k];
    });
    return { days: days };
  }
  throw cfgError(name + ": choice must be a word (packed, school), a weekday map or an entity id, got " + JSON.stringify(v));
}
// normalize() runs on every keystroke in the editor, so each warning prints once.
const WARNED = {};
function warnOnce(msg) { if (WARNED[msg]) return; WARNED[msg] = 1; console.warn("family-dashboard-card: " + msg); }

export function normalize(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw cfgError("config must be an object");
  if (raw.people != null && !Array.isArray(raw.people)) throw cfgError("people must be a list");
  if (raw.people && !raw.people.length) throw cfgError("people needs at least one person (the last one is the household)");
  ["sensors", "view", "dates", "schoolWho", "rainStates"].forEach(function (k) {
    if (raw[k] != null && (typeof raw[k] !== "object" || Array.isArray(raw[k]))) throw cfgError(k + " must be a mapping of keys to values");
  });
  const people = (raw.people || DEFAULTS.people).map(normPerson);
  const names = people.map(function (p) { return p.name; });
  names.forEach(function (n, i) { if (names.indexOf(n) !== i) throw cfgError("two people are called " + JSON.stringify(n) + "; names must be unique"); });
  const calendarMode = people.some(function (p) { return p.calendars.length; });
  people.forEach(function (p, i) { if (!p.letter) return;
    const twin = people.filter(function (q, k) { return k < i && q.letter === p.letter; })[0];
    if (twin) throw cfgError(twin.name + " and " + p.name + " both read " + p.letter + "; each person's letter needs its own helper"); });

  const out = {};
  Object.keys(DEFAULTS).forEach(function (k) {
    const d = DEFAULTS[k], v = raw[k];
    if (v === undefined) out[k] = d;
    else out[k] = d && v && typeof d === "object" && typeof v === "object" && !Array.isArray(d) && !Array.isArray(v) ? Object.assign({}, d, v) : v;
  });
  CARD_KEYS.forEach(function (k) { if (raw[k] !== undefined) out[k] = raw[k]; });
  out.people = people;
  out.demo = raw.demo === true;
  // v1.6.0: the announcement banner, the due-time row and the status tiles. Absent, each is
  // null (or no tiles) and draws nothing, so a v1.5.1 config renders exactly as it did.
  out.announcement = normAnnouncement(raw);
  out.due = normDue(raw);
  out.status_tiles = normTiles(raw);
  // v1.7.0: the town crier walks out for a new announcement (null when there is no announcement).
  out.crier = normCrier(raw, out.announcement);
  out.calendarMode = calendarMode && !out.demo;

  // New-style configs start with every optional part switched off: a fresh Home Assistant
  // has none of the family_* sensors, and a tap must not open a view that is not there.
  if (calendarMode) {
    const s = Object.assign({}, DEFAULTS.sensors);
    OPTIONAL_SENSORS.forEach(function (k) { s[k] = null; });
    s.week = null;
    out.sensors = Object.assign(s, raw.sensors || {});
    out.view = Object.assign({ home: null, music: null, printer: null, office: null }, raw.view || {});
    if (!raw.dates) out.dates = { birthdays: {}, fixed: DEFAULTS.dates.fixed };
    if (!raw.anniversary) out.anniversary = names.slice(0, 2);
  }
  Object.keys(out.sensors).forEach(function (k) {
    const v = out.sensors[k];
    if (v === "" || v === undefined) out.sensors[k] = null;
    else if (v !== null && typeof v !== "string") throw cfgError("sensors." + k + " must be an entity id or null, got " + JSON.stringify(v));
  });
  // v1.1.0 kept one child's timetable and lunch in sensors, owned through schoolWho. Copy
  // each onto its owner unless that person names their own. An owner who is not in the
  // cast is a config error the card cannot guess around: warn, and list it on the School
  // card, but only when the config asked for that sensor or owner (not for a default).
  out.schoolOrphans = [];
  ["timetable", "lunch"].forEach(function (k) {
    const id = out.sensors[k];
    if (!id) return;
    const who = out.schoolWho && out.schoolWho[k], owner = people.filter(function (p) { return p.name === who; })[0];
    if (owner) { if (!owner[k]) owner[k] = { entity: id, attribute: k === "timetable" ? TIMETABLE_ATTR : LUNCH_ATTR, legacy: true }; return; }
    if ((raw.sensors && raw.sensors[k]) || (raw.schoolWho && raw.schoolWho[k])) {
      warnOnce("sensors." + k + " (" + id + ") belongs to schoolWho." + k + " = " + JSON.stringify(who) + ", who is not in people. Set people[]." + k + " on the child instead.");
      out.schoolOrphans.push({ key: k, entity: id, who: who == null ? null : String(who) });
    }
  });
  people.forEach(function (p) {
    if (p.letter && p.letter === out.sensors.letter) throw cfgError(p.name + ": letter is " + p.letter + ", which is also sensors.letter (the postie for everyone). Give " + p.name + " a helper of their own");
  });
  if (!out.demo && !calendarMode && !out.sensors.week)
    throw cfgError("give at least one person a calendar (people[].calendar), or set sensors.week, or set demo: true");

  out.scene = out.scene == null ? SCENES[0].id : out.scene;
  if (!SCENES.some(function (s) { return s.id === out.scene; }))
    throw cfgError("scene must be one of " + SCENES.map(function (s) { return s.id; }).join(", ") + ", got " + JSON.stringify(out.scene));
  // A scene can recast the default cast as its own characters (the station's aliens), by
  // position. Only a config that names no people: a cast someone chose keeps its looks.
  const cast = !raw.people && SCENE_LIST.filter(function (s) { return s.id === out.scene; })[0].demoCast;
  if (cast) people.forEach(function (p, i) { if (cast[i] && LOOKS.indexOf(cast[i]) >= 0) { p.look = cast[i]; p.tg = LOOK_TG[cast[i]] || p.tg; } });

  // The school door queue: keep the given order for names that exist, then any other
  // school kid, so a renamed cast never stacks everyone on one spot.
  const kids = people.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
  const line = (Array.isArray(out.schoolLine) ? out.schoolLine : []).filter(function (n) { return kids.indexOf(n) >= 0; });
  out.schoolLine = line.concat(kids.filter(function (n) { return line.indexOf(n) < 0; }));
  out.sourceOwner = (Array.isArray(out.sourceOwner) ? out.sourceOwner : []).map(function (p) {
    if (!Array.isArray(p) || p.length < 2) throw cfgError("sourceOwner entries must be [pattern, name] pairs");
    return [p[0] instanceof RegExp ? p[0] : new RegExp(String(p[0]), "i"), p[1]];
  });
  return out;
}

// First install: the demo cast, with the calendars this Home Assistant has already
// handed out. One calendar goes to the household. With more, family, home, holiday and
// birthday calendars go to the household and the rest one per person in order, any
// left over to the household. Turning demo off is then the only step.
export function stubConfig(hass) {
  const states = hass && hass.states || {};
  const ids = Object.keys(states).sort();
  const cals = ids.filter(function (id) { return id.indexOf("calendar.") === 0; });
  const shared = /family|home|house|holiday|birthday/;
  const own = cals.filter(function (id) { return !shared.test(id); });
  const people = clone(DEFAULTS.people);
  const last = people.length - 1;
  function toHouse(id) { const h = people[last]; h.calendar = h.calendar ? [].concat(h.calendar, id) : id; }
  if (cals.length === 1) toHouse(cals[0]);
  else {
    own.forEach(function (id, i) { if (i < last) people[i].calendar = id; else toHouse(id); });
    cals.filter(function (id) { return shared.test(id); }).forEach(toHouse);
  }
  const weather = states["weather.forecast_home"] ? "weather.forecast_home" : ids.filter(function (id) { return id.indexOf("weather.") === 0; })[0] || null;
  const cfg = { demo: true, people: people };
  if (cals.length) cfg.sensors = { weather: weather };
  return cfg;
}

export function clone(o) { return JSON.parse(JSON.stringify(o)); }
