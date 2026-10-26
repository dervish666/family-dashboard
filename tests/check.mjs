// Runnable check for the parts of the card that have no pixels: config normalisation and
// calendar parsing. No dependencies. Run: node tests/check.mjs [path/to/family-dashboard.js]
// Exits 1 on the first broken expectation. tests/falsify.sh proves that it can.
import { pathToFileURL } from "node:url";
import path from "node:path";

// Just enough browser for the module to load: the card class and its registration.
globalThis.HTMLElement = class {};
globalThis.window = globalThis;
globalThis.customElements = { get() { return null; }, define() {}, whenDefined() { return Promise.resolve(); } };
console.info = function () {};

const file = path.resolve(process.argv[2] || new URL("../dist/family-dashboard.js", import.meta.url).pathname);
const m = await import(pathToFileURL(file).href);

let n = 0;
function eq(got, want, what) {
  n++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { console.error("FAIL " + what + "\n  want " + w + "\n  got  " + g); process.exit(1); }
}
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

console.log("ok: " + n + " checks passed");
