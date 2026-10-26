// Runnable check for the parts of the card that need no real pixels: config normalisation,
// calendar parsing, the school timetable and lunch parsers, and the creature and scene registries (every module has the interface,
// every module file is registered, and each one draws and runs on a stub canvas without
// throwing). No dependencies.
// Run: node tests/check.mjs [path/to/family-dashboard.js] [path/to/src]
// Exits 1 on the first broken expectation. tests/falsify.sh proves that it can.
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Just enough browser for the module to load (the card class and its registration), and a
// canvas whose 2D context accepts every call, so sprites and scenes can be run headless.
function stubContext(c) {
  const grad = { addColorStop() {} };
  const t = { canvas: c, measureText: function (s) { return { width: String(s).length * 8 }; },
    createLinearGradient: function () { return grad; }, createRadialGradient: function () { return grad; },
    getImageData: function (x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }; } };
  return new Proxy(t, { get: function (o, k) { if (k in o) return o[k]; return typeof k === "string" && /^[a-z]/.test(k) ? (o[k] = function () {}) : undefined; } });
}
function stubCanvas() { return { width: 0, height: 0, style: {}, getContext: function () { return this.g || (this.g = stubContext(this)); } }; }
globalThis.HTMLElement = class {};
globalThis.window = globalThis;
globalThis.customElements = { get() { return null; }, define() {}, whenDefined() { return Promise.resolve(); } };
globalThis.document = { createElement: stubCanvas, getElementById: function () { return null; }, head: { appendChild() {} } };
console.info = function () {};

const file = path.resolve(process.argv[2] || new URL("../dist/family-dashboard.js", import.meta.url).pathname);
const src = path.resolve(process.argv[3] || new URL("../src", import.meta.url).pathname);
const m = await import(pathToFileURL(file).href);

let n = 0;
function eq(got, want, what) {
  n++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { console.error("FAIL " + what + "\n  want " + w + "\n  got  " + g); process.exit(1); }
}
function ok(cond, what) { n++; if (!cond) { console.error("FAIL " + what); process.exit(1); } }
function throws(fn, re, what) {
  n++;
  try { fn(); } catch (e) { if (re.test(e.message)) return; console.error("FAIL " + what + ": wrong error: " + e.message); process.exit(1); }
  console.error("FAIL " + what + ": did not throw"); process.exit(1);
}

// v1.0.0 config: the sensor path and every default survive.
const v1 = m.normalize({ type: "custom:family-dashboard-card", people: [
  { name: "Parent 1", col: "#7FC8D2", r: 37, look: "crow", tg: 2.25, adult: true, glasses: true },
  { name: "Kid 1", col: "#9EE0B4", r: 31, look: "otter", tg: 2.55, school: true },
  { name: "House", col: "#E0A050", r: 37, look: "snail", tg: 2.05 }],
  sensors: { week: "sensor.family_week", music: null }, view: { music: null }, unknownKey: 1 });
eq(v1.calendarMode, false, "v1 config stays on the template sensor");
eq(v1.sensors.week, "sensor.family_week", "v1 keeps sensors.week");
eq(v1.sensors.extra, "sensor.family_extra", "v1 keeps the default extra sensor");
eq(v1.sensors.music, null, "v1 null switches a sensor off");
eq(v1.view.home, "/wall-panel/home", "v1 keeps the default views");
eq(v1.people[1].r, 31, "v1 keeps r");
eq(v1.people[0].glasses, true, "v1 keeps accessory flags");
eq(v1.schoolLine, ["Kid 1"], "school line drops names not in the cast");
eq("unknownKey" in v1, false, "unknown keys are ignored");
eq(v1.scene, "meadow", "scene defaults to the meadow");
eq(v1.sourceOwner[0][0] instanceof RegExp, true, "sourceOwner patterns become RegExps");

// Defaults alone still load (a v1.0.0 card with no people).
eq(m.normalize({}).people.length, 6, "no people means the default cast");

// v1.1.0 config: calendars on people, everything optional off.
const v2 = m.normalize({ people: [
  { name: "Alex", role: "adult", look: "deer", calendar: "calendar.alex" },
  { name: "Sky", role: "kid", school: true, calendar: ["calendar.sky", "calendar.sky_club", "calendar.sky"] },
  { name: "Home", calendar: "calendar.family" }], sensors: { weather: "weather.home" } });
eq(v2.calendarMode, true, "a calendar on a person switches on calendar mode");
eq(v2.people.map(function (p) { return p.calendars; }), [["calendar.alex"], ["calendar.sky", "calendar.sky_club"], ["calendar.family"]], "calendars become lists, deduplicated");
eq([v2.people[0].adult, v2.people[1].adult], [true, false], "role maps to adult");
eq(v2.people[0].tg, 2.75, "tg follows the look");
eq(/^#[0-9a-f]{6}$/i.test(v2.people[1].col), true, "a missing colour comes from the palette");
eq([v2.sensors.week, v2.sensors.extra, v2.sensors.music, v2.sensors.weather], [null, null, null, "weather.home"], "optional sensors start off in calendar mode");
eq(v2.view, { home: null, music: null, printer: null, office: null }, "building taps start off in calendar mode");
eq(v2.dates.birthdays, {}, "no demo birthdays on a real cast");
eq(v2.anniversary, ["Alex", "Sky"], "anniversary follows the cast");
eq(m.normalize({ people: [{ name: "A", col: [255, 0, 16], calendar: "calendar.a" }] }).people[0].col, "#ff0010", "an [r,g,b] colour becomes hex");
eq(m.normalize({ people: [{ name: "A", col: "#abc", calendar: "calendar.a" }] }).people[0].col, "#aabbcc", "short hex expands");
eq(m.normalize({ demo: true, people: [{ name: "A", calendar: "calendar.a" }] }).calendarMode, false, "demo wins over calendars");

// Errors that say what to change.
throws(function () { m.normalize(null); }, /config must be an object/, "null config");
throws(function () { m.normalize({ people: {} }); }, /people must be a list/, "people as a mapping");
throws(function () { m.normalize({ people: [] }); }, /at least one person/, "empty cast");
throws(function () { m.normalize({ people: [{ look: "crow" }] }); }, /needs a name/, "nameless person");
throws(function () { m.normalize({ people: [{ name: "A" }, { name: "A" }] }); }, /names must be unique/, "duplicate names");
throws(function () { m.normalize({ people: [{ name: "A", look: "dragon" }] }); }, /look must be one of/, "unknown look");
throws(function () { m.normalize({ people: [{ name: "A", col: "teal" }] }); }, /hex colour/, "bad colour");
throws(function () { m.normalize({ people: [{ name: "A", calendar: "sensor.a" }] }); }, /calendar entity id/, "non-calendar entity");
throws(function () { m.normalize({ people: [{ name: "A", role: "pet" }] }); }, /adult or kid/, "unknown role");
throws(function () { m.normalize({ people: [{ name: "A" }], sensors: { week: null } }); }, /give at least one person a calendar/, "nothing to read");
throws(function () { m.normalize({ demo: true, scene: "moon" }); }, /scene must be one of/, "unknown scene");
throws(function () { m.normalize({ sensors: ["x"] }); }, /sensors must be a mapping/, "sensors as a list");

// Calendar parsing, in the shape GET /api/calendars/<id> answers.
const range = m.weekRange(new Date(2026, 9, 26, 15, 30));
eq([range.start.getDate(), range.end.getDate(), range.start.getHours()], [26, 2, 0], "the week runs from local midnight for seven days");
eq(/^calendars\/calendar\.a\?start=.+&end=.+$/.test(m.calendarPath("calendar.a", range)), true, "the API path carries start and end");
const rows = m.parseCalendarEvents([
  { summary: "Dentist", start: { dateTime: "2026-10-27T10:15:00+00:00" }, end: { dateTime: "2026-10-27T11:00:00+00:00" } },
  { summary: "Bin day", start: { date: "2026-10-28" }, end: { date: "2026-10-29" } },
  { summary: "Half term", start: { date: "2026-10-24" }, end: { date: "2026-11-01" } },
  { start: { dateTime: "2026-10-29T18:00:00+01:00" } },
  { summary: "broken", start: {} }, null], "Alex", range);
eq(rows, [
  { who: "Alex", what: "Dentist", day: "2026-10-27", all_day: false, start: "2026-10-27T10:15:00+00:00", at: "10:15" },
  { who: "Alex", what: "Bin day", day: "2026-10-28", all_day: true, start: "2026-10-28", at: "" },
  { who: "Alex", what: "Half term", day: "2026-10-26", all_day: true, start: "2026-10-26", at: "" },
  { who: "Alex", what: "Busy", day: "2026-10-29", all_day: false, start: "2026-10-29T18:00:00+01:00", at: "18:00" }], "calendar events become week rows");
throws(function () { m.parseCalendarEvents({ message: "Entity not found" }, "Alex", range); }, /not a list/, "an error answer is not an empty week");

// First install: the demo cast, picking up whatever calendars exist.
const one = m.stubConfig({ states: { "calendar.home": {}, "weather.forecast_home": {}, "sun.sun": {} } });
eq([one.demo, one.people.length, one.people[5].calendar, one.sensors.weather], [true, 6, "calendar.home", "weather.forecast_home"], "one calendar goes to the household");
const many = m.stubConfig({ states: { "calendar.a": {}, "calendar.b": {}, "calendar.c": {}, "calendar.d": {}, "calendar.e": {}, "calendar.family": {}, "calendar.f": {}, "calendar.g": {} } });
eq(many.people.map(function (p) { return p.calendar; }), ["calendar.a", "calendar.b", "calendar.c", "calendar.d", "calendar.e", ["calendar.f", "calendar.g", "calendar.family"]], "several calendars go one per person, shared and left over ones to the household");
eq(m.normalize(Object.assign({}, many, { demo: false })).calendarMode, true, "the stub with demo off reads the calendars");
const none = m.stubConfig(null);
eq([none.demo, none.people.length, none.sensors, none.people.some(function (p) { return p.calendar; })], [true, 6, undefined, false], "no hass still gives the demo cast");

// ── School data per child (v1.2.0) ──────────────────────────────────────────────
// Config: people[].timetable / .lunch / .choice, and v1.1.0's sensors + schoolWho mapped on.
const sc = m.normalize({ people: [
  { name: "Ash", school: true, calendar: "calendar.ash", timetable: "sensor.ash_timetable", lunch: { entity: "sensor.ash_school", attribute: "lunch" }, choice: "packed" },
  { name: "Bea", school: true, timetable: { entity: "sensor.bea_tt" }, choice: { fri: "packed", Monday: "school" } },
  { name: "Cy", school: true, lunch: "sensor.cy_lunch", choice: "input_select.cy_lunch" },
  { name: "Home" }] });
eq(sc.people[0].timetable, { entity: "sensor.ash_timetable", attribute: "timetable" }, "a timetable entity id gets the default attribute");
eq(sc.people[0].lunch, { entity: "sensor.ash_school", attribute: "lunch" }, "a lunch source keeps its own attribute");
eq(sc.people[1].timetable, { entity: "sensor.bea_tt", attribute: "timetable" }, "{ entity } alone gets the default attribute");
eq(sc.people[2].lunch, { entity: "sensor.cy_lunch", attribute: "menu" }, "lunch defaults to the menu attribute");
eq([sc.people[0].choice, sc.people[1].choice, sc.people[2].choice], [{ value: "packed" }, { days: { fri: "packed", mon: "school" } }, { entity: "input_select.cy_lunch" }], "choice is a word, a weekday map or an entity");
eq([sc.people[3].timetable, sc.people[3].lunch, sc.people[3].choice], [null, null, null], "no school sources is null, not undefined");
eq(sc.schoolOrphans, [], "a calendar config with no legacy school sensors has nothing orphaned");
throws(function () { m.normalize({ people: [{ name: "A", timetable: "calendar.a", calendar: "calendar.a" }] }); }, /timetable must be a sensor entity id/, "a timetable that is not a sensor");
throws(function () { m.normalize({ people: [{ name: "A", lunch: { entity: "input_text.a" }, calendar: "calendar.a" }] }); }, /lunch must be a sensor entity id/, "a lunch source that is not a sensor");
throws(function () { m.normalize({ people: [{ name: "A", lunch: ["sensor.a"], calendar: "calendar.a" }] }); }, /lunch must be a sensor entity id/, "a lunch source as a list");
throws(function () { m.normalize({ people: [{ name: "A", timetable: { entity: "sensor.a", attribute: "" }, calendar: "calendar.a" }] }); }, /attribute must be an attribute name/, "an empty attribute name");
throws(function () { m.normalize({ people: [{ name: "A", choice: { someday: "packed" }, calendar: "calendar.a" }] }); }, /choice days must be weekdays/, "a choice map with a key that is not a day");
throws(function () { m.normalize({ people: [{ name: "A", choice: 3, calendar: "calendar.a" }] }); }, /choice must be a word/, "a choice that is a number");

// v1.0.0 defaults: the default cast's Kid 2 owns sensor.family_timetable, Kid 3 sensor.family_lunch.
const d0 = m.normalize({});
eq([d0.people[3].timetable, d0.people[4].lunch], [{ entity: "sensor.family_timetable", attribute: "timetable", legacy: true }, { entity: "sensor.family_lunch", attribute: "menu", legacy: true }], "v1.0.0 school sensors land on their schoolWho owners");
eq([d0.people[2].timetable, d0.people[3].lunch, d0.schoolOrphans], [null, null, []], "and on nobody else");
// v1.1.0 calendar config naming the sensors and their owner.
const leg = m.normalize({ people: [{ name: "Sky", school: true, calendar: "calendar.sky" }, { name: "Rue", school: true, timetable: "sensor.rue_own" }, { name: "Home" }],
  sensors: { timetable: "sensor.old_tt", lunch: "sensor.old_lunch" }, schoolWho: { timetable: "Rue", lunch: "Sky" } });
eq(leg.people[1].timetable, { entity: "sensor.rue_own", attribute: "timetable" }, "a person's own timetable wins over the v1.1.0 one");
eq(leg.people[0].lunch, { entity: "sensor.old_lunch", attribute: "menu", legacy: true }, "v1.1.0 sensors.lunch is copied onto schoolWho.lunch");
// An owner who is not in the cast warns once and is listed for the School card.
const warns = [], warn0 = console.warn;
console.warn = function (msg) { warns.push(String(msg)); };
const orph = m.normalize({ people: [{ name: "Sky", school: true, calendar: "calendar.sky" }, { name: "Home" }], sensors: { timetable: "sensor.lost_tt" }, schoolWho: { timetable: "Nobody" } });
m.normalize({ people: [{ name: "Sky", school: true, calendar: "calendar.sky" }, { name: "Home" }], sensors: { timetable: "sensor.lost_tt" }, schoolWho: { timetable: "Nobody" } });
const quiet = m.normalize({ people: [{ name: "Sky", calendar: "calendar.sky" }, { name: "Home" }] });
console.warn = warn0;
eq(warns.length, 1, "a schoolWho owner missing from people warns, once");
ok(/sensors\.timetable \(sensor\.lost_tt\).*"Nobody"/.test(warns[0] || ""), "the warning names the sensor and the missing owner");
eq(orph.schoolOrphans, [{ key: "timetable", entity: "sensor.lost_tt", who: "Nobody" }], "the orphaned sensor is listed for the School card");
eq([orph.people[0].timetable, quiet.schoolOrphans], [null, []], "an orphan is not handed to someone else, and a default is not an orphan");

// parseTimetable: a two-week rotation counted from the anchor, week_of overrides, closures.
const TT = { weeks: ["A", "B"], anchor: "2026-09-07", week_of: { "2026-11-02": "B", "2026-12-21": null },
  periods: [{ p: 1, start: "08:50", end: "09:50" }, { p: 2, start: "09:50", end: "10:50" }, { p: 3, start: "11:10", end: "12:10" }],
  days: { A: { mon: [{ p: 1, subject: "Maths", room: "M1" }, { p: 2, subject: "Art" }] },
    B: { mon: [{ p: 1, subject: "French", room: "L2" }], tue: ["History|H2", "Science|\u2014"], Wednesday: [{ p: 3, subject: "PE", start: "11:00" }] } },
  closed: ["2026-10-28", { date: "2026-12-18", note: "INSET" }] };
const tst = { state: "ok", attributes: { timetable: TT } };
const pt = function (d, st) { return m.parseTimetable(st === undefined ? tst : st, d); };
eq([pt("2026-10-19").status, pt("2026-10-19").week], ["ok", "A"], "six weeks after the anchor is week A");
eq(pt("2026-10-19").lessons, [{ p: 1, start: "08:50", end: "09:50", subject: "Maths", room: "M1" }, { p: 2, start: "09:50", end: "10:50", subject: "Art", room: "" }], "lessons get their period times");
eq([pt("2026-10-26").week, pt("2026-10-26").lessons.map(function (l) { return l.subject; })], ["B", ["French"]], "seven weeks after the anchor is week B");
eq(pt(new Date(2026, 9, 27, 8, 0)).lessons, [{ p: 1, start: "08:50", end: "09:50", subject: "History", room: "H2" }, { p: 2, start: "09:50", end: "10:50", subject: "Science", room: "" }], "a Date works, and \"Subject|Room\" strings parse inside days");
eq(pt("2026-09-01").week, "B", "weeks before the anchor count backwards");
eq(pt("2026-11-02").week, "B", "week_of overrides the count");
eq(pt("2026-11-09").week, "A", "and the count restarts from the override");
eq([pt("2026-12-22").status, pt("2026-12-22").note], ["closed", "not a timetable week"], "week_of null is a week off the timetable");
eq(pt("2026-10-24").status, "weekend", "Saturday is the weekend");
eq(pt("2026-10-25").status, "weekend", "so is Sunday");
eq([pt("2026-10-28").status, pt("2026-10-28").note, pt("2026-10-28").lessons], ["closed", "", []], "a closed date has no lessons");
eq([pt("2026-12-18").status, pt("2026-12-18").note], ["closed", "INSET"], "a closed date can say why");
const g = pt("2026-10-26").grid;
eq([g.monday, g.week, g.rows.map(function (r) { return r.p; }), g.days.map(function (d) { return d.closed; })], ["2026-10-26", "B", [1, 2, 3], [false, false, true, false, false]], "the week grid has every period and marks the closed day");
eq([g.rows[0].cells.map(function (c) { return c && c.subject; }), g.rows[2].cells[2]], [["French", "History", null, null, null], null], "grid cells line up by period and day, and a closed day is empty");
eq(pt("2026-10-21").lessons, [], "a day missing from the week is a day with no lessons, not an error");
const sevenP = { weeks: ["A"], days: { A: { mon: [1, 2, 3, 4, 5, 6, 7].map(function (n) { return { p: n, subject: "S" + n }; }) } } };
eq(pt("2026-10-26", { state: "x", attributes: { timetable: sevenP } }).lessons.length, 7, "any number of periods");
eq([pt("2026-10-26", { state: "x", attributes: { timetable: sevenP } }).week, pt("2026-10-26", { state: "x", attributes: { timetable: sevenP } }).grid.rows.length], ["A", 7], "a one-week rotation needs no anchor");
const noAnchor = { weeks: ["A", "B"], days: TT.days };
eq(pt("2026-10-26", { state: "x", attributes: { timetable: noAnchor } }).status, "no_week", "two weeks with nothing to count from cannot say");
eq(m.parseTimetable({ state: "x", attributes: { tt: JSON.stringify(TT) } }, "2026-10-26", null, "tt").week, "B", "a JSON string in another attribute parses");
// lessonsOver: the card moves to the next school day at the last lesson's end, else at 15:30
const at = function (h, mi) { return new Date(2026, 9, 19, h, mi); };
const monA = pt("2026-10-19"), wedB = pt("2026-11-04");
eq(m.lessonsEnd(monA), 10 * 60 + 50, "a day ends when its last period does");
eq([m.lessonsOver(monA, at(10, 49)), m.lessonsOver(monA, at(10, 50)), m.lessonsOver(monA, at(15, 0))], [false, true, true], "lessons are over from the minute the last one ends");
eq([wedB.lessons.map(function (l) { return l.start + "-" + l.end; }), m.lessonsEnd(wedB)], [["11:00-12:10"], 12 * 60 + 10], "a lesson's own start keeps its period's end");
const late = { state: "x", attributes: { timetable: { weeks: ["A"], periods: [{ p: 1, start: "13:00", end: "14:00" }], days: { A: { mon: [{ p: 1, subject: "Art" }, { p: 2, subject: "Club", start: "15:30", end: "16:45" }] } } } } };
eq(m.lessonsEnd(pt("2026-10-26", late)), 16 * 60 + 45, "a lesson's own end time past the periods counts");
eq([m.lessonsOver(pt("2026-10-26", late), at(16, 0)), m.lessonsOver(pt("2026-10-26", late), at(16, 45))], [false, true], "a late club day stays on today until it ends");
eq([m.lessonsEnd(fl0()), m.lessonsOver(fl0(), at(15, 29)), m.lessonsOver(fl0(), at(15, 30))], [null, false, true], "no end times falls back to 15:30");
eq(m.lessonsOver(fl0(), at(15, 0), 15 * 60), true, "the fallback can be moved");
eq([m.lessonsEnd(null), m.lessonsEnd(pt("2026-10-24"))], [null, null], "no day, or a day with no lessons, has no end");
function fl0() { return m.parseTimetable({ state: "Week 1", attributes: { open_today: true, lessons_today: ["Maths|M1", "English|E2"] } }, "2026-10-26", "2026-10-26"); }
// unavailable says why, and never reads as a day with no lessons
eq([pt("2026-10-26", null).status, pt("2026-10-26", null).reason], ["unavailable", "not found"], "a missing entity is unavailable");
eq(pt("2026-10-26", { state: "unavailable", attributes: {} }).reason, "is unavailable", "an unavailable entity says so");
eq(pt("2026-10-26", { state: "3", attributes: { other: 1 } }).reason, "has no timetable attribute", "an entity without the attribute says so");
eq(pt("2026-10-26", { state: "3", attributes: { timetable: { weeks: ["A"] } } }).status, "unavailable", "a timetable with no days is unavailable");
// v1.1.0's flat sensor: the week as the state, today and tomorrow as "Subject|Room" lists
const flat = { state: "Week 1", attributes: { open_today: true, day_today: "Monday", lessons_today: ["Maths|M1", "English|E2"], open_tomorrow: false, week_tomorrow: "Week 1",
  grid: { "Week 1": { Monday: ["Maths|M1", "English|E2"], Wednesday: ["Art|A1"] } } } };
const fl = m.parseTimetable(flat, "2026-10-26", "2026-10-26");
eq([fl.status, fl.week, fl.lessons], ["ok", "Week 1", [{ p: 1, start: "", end: "", subject: "Maths", room: "M1" }, { p: 2, start: "", end: "", subject: "English", room: "E2" }]], "v1.1.0 lessons_today parses");
eq(m.parseTimetable(flat, "2026-10-27", "2026-10-26").status, "closed", "v1.1.0 open_tomorrow false is a closed day");
eq(m.parseTimetable(flat, "2026-10-28", "2026-10-26").lessons.map(function (l) { return l.subject; }), ["Art"], "v1.1.0 grid days parse");
eq(m.parseTimetable({ state: "Week 2", attributes: { open_today: true, lessons_today: ["PE|Gym"] } }, "2026-10-26", "2026-10-26").lessons.map(function (l) { return l.room; }), ["Gym"], "v1.1.0 without a grid still has today");

// parseLunch: served with options and allergens, closed, no menu, past the end, weekend.
const LU = { "2026-10-26": { status: "served", options: [{ name: "Pasta bake", kind: "main", allergens: ["Gluten", "Milk", "Milk"] }, "Jacket potato", { kind: "veg" }],
    pudding: "Apple crumble", choice: "packed", note: "Theme day" },
  "2026-10-27": { status: "closed", note: "INSET" }, "2026-10-28": { status: "no_menu" }, "2026-10-29": { options: [{ name: "Curry", allergens: "Celery, Mustard" }] } };
const lst = { state: "served", attributes: { menu: LU, menu_ends: "2026-10-30" } };
const pl = function (d, st, t, a) { return m.parseLunch(st === undefined ? lst : st, d, t, a); };
const mon = pl("2026-10-26");
eq([mon.status, mon.options, mon.pudding, mon.choice, mon.note], ["served", [{ name: "Pasta bake", kind: "main", allergens: ["Gluten", "Milk"] }, { name: "Jacket potato", kind: "", allergens: [] }],
  { name: "Apple crumble", kind: "", allergens: [] }, "packed", "Theme day"], "a served day has its options, allergens, pudding, choice and note");
eq([pl("2026-10-27").status, pl("2026-10-27").note], ["closed", "INSET"], "a closed day says why");
eq(pl("2026-10-28").status, "no_menu", "no_menu stays no_menu");
eq([pl("2026-10-29").status, pl("2026-10-29").options[0].allergens], ["served", ["Celery", "Mustard"]], "options with no status are served, and allergens can be a string");
eq(pl("2026-10-30").status, "no_menu", "a school day missing from the menu is no_menu");
eq([pl("2026-11-02").status, pl("2026-11-02").menuEnds], ["ended", "2026-10-30"], "past menu_ends is ended");
eq(pl("2026-10-31").status, "weekend", "Saturday is the weekend");
eq(pl("2026-10-27", { state: "x", attributes: { lunch: { menu: LU, menu_ends: "2026-10-30" } } }, null, "lunch").note, "INSET", "menu and menu_ends inside one attribute");
eq([pl("2026-10-26", null).status, pl("2026-10-26", { state: "unknown", attributes: {} }).reason], ["unavailable", "is unknown"], "a missing or unknown lunch sensor is unavailable");
const fll = { state: "served", attributes: { status_today: "served", served_today: true, main_today: "Pasta bake", veg_today: "Veggie bake", pudding_today: "Crumble", status_tomorrow: "closed", menu_ends: "2026-12-18" } };
eq([pl("2026-10-26", fll, "2026-10-26").options.map(function (o) { return o.kind + ":" + o.name; }), pl("2026-10-26", fll, "2026-10-26").pudding.name], [["main:Pasta bake", "veg:Veggie bake"], "Crumble"], "v1.1.0 main_today parses");
eq([pl("2026-10-27", fll, "2026-10-26").status, pl("2026-10-28", fll, "2026-10-26").status, pl("2026-12-21", fll, "2026-10-26").status], ["closed", "no_menu", "ended"], "v1.1.0 tomorrow, other days and past the end");

// lunchChoice: a live entity, then the menu's day, then the config.
const fri = "2026-10-30", monday = "2026-10-26";
eq(m.lunchChoice({ value: "packed" }, monday, null, ""), { text: "Packed lunch", from: "config", err: "" }, "a fixed word");
eq([m.lunchChoice({ days: { fri: "packed" } }, fri, null, "").text, m.lunchChoice({ days: { fri: "packed" } }, monday, null, "")], ["Packed lunch", null], "a weekday map");
eq(m.lunchChoice({ entity: "input_select.k" }, monday, { state: "School dinner" }, "packed"), { text: "School dinner", from: "input_select.k", err: "" }, "a live entity wins");
eq(m.lunchChoice({ entity: "input_select.k" }, monday, { state: "unavailable" }, "school"), { text: "School dinner", from: "menu", err: "input_select.k is unavailable" }, "an unavailable entity falls back and says so");
eq(m.lunchChoice({ value: "packed" }, monday, null, "Jacket potato").text, "Jacket potato", "the menu's day choice beats the config");
eq(m.lunchChoice(null, monday, null, ""), null, "nothing says, nothing shown");

// ── The creature registry ───────────────────────────────────────────────────────
const isFn = function (f) { return typeof f === "function"; };
const C = m.CREATURES, ids = C.map(function (c) { return c && c.id; });
ok(Array.isArray(C) && C.length >= 8, "the creature registry is exported and has the cast");
eq(m.LOOKS, ids, "config's looks are the registry's, in order");
eq(ids.slice(0, 6), m.normalize({}).people.map(function (p) { return p.look; }), "the first six looks are the default cast's");
ok(new Set(ids).size === ids.length, "creature ids are unique");
C.forEach(function (c) {
  const who = "creature " + (c && c.id);
  ok(c && typeof c.id === "string" && /^[a-z]+$/.test(c.id), who + ": id is a lower-case word");
  ok(typeof c.label === "string" && c.label.length > 0, who + ": has a label");
  ok(isFn(c.sprite), who + ": has sprite()");
  ok(c.tg == null || (typeof c.tg === "number" && c.tg > 0), who + ": tg is a positive number");
  if (!c.rig) return;
  const R = c.rig, parts = R.order.concat(R.extra || []);
  ok(Array.isArray(R.order) && R.order.length > 0, who + ": rig.order lists its pieces");
  ok(R.order.indexOf(R.eyesIn) >= 0, who + ": rig.eyesIn is one of its pieces");
  ok(R.piv && Object.keys(R.piv).every(function (k) { return parts.indexOf(k) >= 0; }), who + ": every pivot belongs to a piece");
  ok(isFn(c.anim), who + ": a rigged creature has anim()");
  ok(Array.isArray(c.hat) && c.hat.length === 3, who + ": a rigged creature says where a party hat sits");
  ok(c.tg > 0 && c.editor === true, who + ": a rigged creature has a tag height and is in the editor");
  ok(!c.timers || c.timers.every(function (k) { return typeof k === "string"; }), who + ": timers are names");
  ok(c.life == null || isFn(c.life), who + ": life is a function");
  ok(c.habits == null || isFn(c.habits), who + ": habits is a function");
  // it draws, whole and piece by piece, and its habits run, on a stub canvas
  ["open", "shut", "happy", "wide"].forEach(function (e) {
    const out = c.sprite({ r: 34, col: "#9EE0B4", look: c.id, adult: e === "shut", glasses: true, phones: true, daisy: true }, e, 2);
    ok(out && out.c && isFinite(out.ax) && isFinite(out.ay), who + ": sprite(" + e + ") returns an anchored canvas"); });
  ok(m.bakeRig({ r: 34, col: "#9EE0B4", look: c.id }) !== null, who + ": its rig bakes");
  const t = { x: 600, y: 500, r: 34, face: 1, phase: 1, gait: 0.5, wave: 1, idle: true, wait: 0, dipT: -1, startle: 0.5, person: { look: c.id } };
  const M = { g: 0.5, ph: 1, air: 0.4, idle: 0.5, time: 2, spike: function () { return 0.5; }, wave: 1, stepL: -0.1, stepR: 0, stiff: 0, sleep: 0 };
  parts.forEach(function (p) { const a = c.anim(t, p, 2, M); ok(a === undefined || (Array.isArray(a) && a.length === 3 && a.every(isFinite)), who + ": anim(" + p + ") is [rot, dx, dy]"); });
  // Behaviour, compared pose by pose on a still creature: walking moves something (feet, a
  // waddle, ears on the hop); and an animal that says it sleeps also stirs when idle and has
  // a sleeping pose of its own.
  const t0 = { x: 0, y: 0, r: 34, face: 1, phase: 1, gait: 0, wave: 0, startle: 0, person: { look: c.id } };
  const M0 = { g: 0, ph: 1.2, air: 0, idle: 1, time: 2, spike: function () { return 0.5; }, wave: 0, stepL: 0, stepR: 0, stiff: 0, sleep: 0 };
  const pose = function (over) { const Mx = Object.assign({}, M0, over); return JSON.stringify(parts.map(function (p) { return c.anim(t0, p, Mx.time, Mx) || [0, 0, 0]; })); };
  ok(pose({}) !== pose({ g: 1, idle: 0, air: 0.9, stepL: -0.13 }), who + ": walking moves a piece");
  ok(c.sleeps == null || typeof c.sleeps === "boolean", who + ": sleeps is true or false");
  if (c.sleeps) {
    ok(pose({}) !== pose({ time: 3.1 }), who + ": standing idle, something stirs over time");
    ok(pose({}) !== pose({ sleep: 1 }), who + ": asleep, it has its own pose");
    ok(pose({ sleep: 1 }) !== pose({ sleep: 1, time: 3.1 }), who + ": asleep, it still breathes");
  }
  const A = { rand: function (a, b) { return (a + b) / 2; }, puff: function () {}, water: { x: 600, y: 600, rx: 100, ry: 30 } };
  for (let i = 0; i < 90; i++) { if (c.life) c.life(t, 1 / 30, true, A); if (c.habits) c.habits(t, 1 / 30, A); }
});
// The v1.4.0 animals are rigged, in the editor, and sleep in a pose of their own.
["owl", "rabbit", "frog", "cat"].forEach(function (id) { const c = C.filter(function (x) { return x.id === id; })[0];
  ok(!!c && !!c.rig && c.editor === true && c.sleeps === true, "creature " + id + ": registered, rigged, in the editor, with a sleep pose"); });
eq(C.filter(function (x) { return x.id === "bunny"; }).map(function (x) { return !!x.rig; }), [false], "look: bunny stays the classic whole sprite v1.3.0 configs use");
// Drift: every module in src/creatures is registered, and every rigged look has a module.
const helpers = m.CREATURE_HELPERS, files = fs.readdirSync(path.join(src, "creatures")).filter(function (f) { return /\.js$/.test(f) && helpers.indexOf(f) < 0; });
const fileIds = [];
for (const f of files) {
  const mod = (await import(pathToFileURL(path.join(src, "creatures", f)).href)).default;
  ok(mod && typeof mod.id === "string", "src/creatures/" + f + " default-exports a creature");
  fileIds.push(mod.id);
  ok(ids.indexOf(mod.id) >= 0, "src/creatures/" + f + " (" + mod.id + ") is listed in creatures/index.js");
}
C.filter(function (c) { return c.rig; }).forEach(function (c) { ok(fileIds.indexOf(c.id) >= 0, "rigged creature " + c.id + " has a module in src/creatures"); });

// ── The scene registry ──────────────────────────────────────────────────────────
const SL = m.SCENE_LIST, sids = SL.map(function (s) { return s && s.id; });
// Drift first: every module in src/scenes is registered, and every registered scene has one.
const sceneFiles = fs.readdirSync(path.join(src, "scenes")).filter(function (f) { return /\.js$/.test(f) && f !== "index.js"; });
for (const f of sceneFiles) {
  const mod = (await import(pathToFileURL(path.join(src, "scenes", f)).href)).default;
  ok(mod && sids.indexOf(mod.id) >= 0, "src/scenes/" + f + " is listed in scenes/index.js");
}
eq(sceneFiles.length, sids.length, "every scene in the registry has a module in src/scenes");

eq(m.SCENES.map(function (s) { return s.id; }), sids, "config's scenes are the registry's, in order");
eq(sids[0], "meadow", "the meadow stays first, the default for configs with no scene");
ok(new Set(sids).size === sids.length, "scene ids are unique");
eq(m.HOTSPOT_IDS, ["school", "printer", "music", "home", "office"], "the landmark ids are the ones the engine taps");
let sea = null; try { sea = m.normalize({ demo: true, scene: "seaside" }).scene; } catch (e) { sea = e.message; }
eq(sea, "seaside", "the seaside is a valid scene");
SL.forEach(function (sc) {
  const who = "scene " + (sc && sc.id);
  ok(sc && typeof sc.id === "string" && /^[a-z]+$/.test(sc.id), who + ": id is a lower-case word");
  ok(typeof sc.label === "string" && sc.label.length > 0, who + ": has a label");
  ok(isFn(sc.bake), who + ": has bake()");
  ok(sc.weather && isFn(sc.weather.ground), who + ": has weather.ground()");
  ok(Array.isArray(sc.creatures) && sc.creatures.length > 0 && sc.creatures.every(function (id) { return ids.indexOf(id) >= 0; }), who + ": the creatures that suit it are all in the registry");
  ["start", "swimSpot", "via"].forEach(function (k) { ok(sc[k] == null || isFn(sc[k]), who + ": " + k + " is a function"); });
  if (sc.ambient) ["setup", "update"].forEach(function (k) { ok(isFn(sc.ambient[k]), who + ": ambient has " + k + "()"); });
  if (sc.ambient) ["under", "back", "front", "light"].forEach(function (k) { ok(sc.ambient[k] == null || isFn(sc.ambient[k]), who + ": ambient." + k + " is a function"); });
  // it bakes on a stub canvas and places a usable layout; its life runs by day and by night
  let L = null;
  const S = { W: 1280, H: 800, HZ: 216, TOP: 260, DPR: 1, place: function (x) { L = x; S.lay = x.lay; S.layout = x; },
    inZone: function () { return null; }, blit: function () {}, puff: function () {}, say: function () {}, depth: function () { return 1; },
    now: function () { return new Date(2026, 9, 24, 12); }, rand: function (a, b) { return a + Math.random() * (b - a); },
    sprites: { snowman: { c: stubCanvas(), ax: 0, ay: 0, k: 2 }, glow: stubCanvas() }, fam: [{ x: 640, y: 600 }],
    WX: { wind: 0.6, rain: 0.6, storm: 0.6, snow: 0.6, fog: 0.6 }, DARK: 0.8, nightness: 0, time: 3 };
  const g = stubCanvas().getContext("2d");
  sc.bake(g, S);
  ok(L !== null, who + ": bake() places its layout");
  ok(Array.isArray(L.zones) && Array.isArray(L.patch) && L.patch.length > 0 && Array.isArray(L.roam) && L.roam.length > 0, who + ": the layout has zones, the family's areas and everyone else's");
  ok(L.home && isFinite(L.home.x) && L.exit && isFinite(L.exit.x) && L.exit.off && isFinite(L.exit.off.x), who + ": the layout has a home spot and an exit");
  L.patch.concat(L.roam).forEach(function (a, i) {
    if (a.pick) { for (let k = 0; k < 20; k++) { const p = a.pick(); ok(a.has(p.x, p.y), who + ": area " + i + " picks points inside itself"); } }
    else ok(a.x0 < a.x1 && a.y0 < a.y1 && a.x0 >= 0 && a.x1 <= S.W && a.y0 >= S.HZ && a.y1 <= S.H, who + ": area " + i + " is a rect on the ground");
  });
  sc.weather.ground(g, S, S.WX);
  // every landmark the engine taps is mapped: a box on the card and a tap() that runs, or the robot
  ok(sc.hotspots && typeof sc.hotspots === "object", who + ": has hotspots");
  Object.keys(sc.hotspots || {}).forEach(function (k) { ok(m.HOTSPOT_IDS.indexOf(k) >= 0, who + ": hotspot " + k + " is one of " + m.HOTSPOT_IDS.join(", ")); });
  m.HOTSPOT_IDS.forEach(function (id) {
    const h = (sc.hotspots || {})[id];
    ok(!!h, who + ": maps the " + id + " landmark");
    if (h.robot) { ok(id === "office", who + ": only the office can be the robot"); return; }
    ok(isFn(h.box) && isFn(h.tap), who + ": " + id + " has box() and tap()");
    S.sign = id === "music" ? 40 : 0;
    const b = h.box(S);
    ok(Array.isArray(b) && b.length === 4 && b.every(isFinite) && b[0] < b[2] && b[1] < b[3], who + ": " + id + " box is [x0, y0, x1, y1]");
    ok(b[2] - b[0] >= 40 && b[3] - b[1] >= 40, who + ": " + id + " is at least 40 px each way, big enough for a finger");
    ok(b[0] < S.W && b[2] > 0 && b[1] < S.H && b[3] > S.HZ - 120, who + ": " + id + " is on the card");
    h.tap(S);
  });
  if (L.lay && L.lay.school) ok(isFinite(L.lay.school.x) && isFinite(L.lay.school.y) && (!L.lay.school.cut || (L.lay.school.cut.length === 4 && L.lay.school.cut.every(isFinite))), who + ": the School tag's spot is a point");
  if (sc.start) for (let i = 0; i < 8; i++) { const p = sc.start(i, S); ok(p && (p.x === null || (isFinite(p.x) && isFinite(p.y))), who + ": start(" + i + ") is a point"); }
  if (sc.ambient) {
    sc.ambient.setup(S);
    [0, 1].forEach(function (night) { S.nightness = night; for (let i = 0; i < 120; i++) sc.ambient.update(1 / 30, S);
      ["under", "back", "front", "light"].forEach(function (k) { if (sc.ambient[k]) sc.ambient[k](g, 4, S); }); });
  }
});
console.log("ok: " + n + " checks passed");
