// Runnable check for the parts of the card that need no real pixels: config normalisation,
// calendar parsing, and the creature and scene registries (every module has the interface,
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

// ── The creature registry ───────────────────────────────────────────────────────
function ok(cond, what) { n++; if (!cond) { console.error("FAIL " + what); process.exit(1); } }
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
  const M = { g: 0.5, ph: 1, air: 0.4, idle: 0.5, time: 2, spike: function () { return 0.5; }, wave: 1, stepL: -0.1, stepR: 0, stiff: 0 };
  parts.forEach(function (p) { const a = c.anim(t, p, 2, M); ok(a === undefined || (Array.isArray(a) && a.length === 3 && a.every(isFinite)), who + ": anim(" + p + ") is [rot, dx, dy]"); });
  const A = { rand: function (a, b) { return (a + b) / 2; }, puff: function () {}, water: { x: 600, y: 600, rx: 100, ry: 30 } };
  for (let i = 0; i < 90; i++) { if (c.life) c.life(t, 1 / 30, true, A); if (c.habits) c.habits(t, 1 / 30, A); }
});
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
  if (sc.start) for (let i = 0; i < 8; i++) { const p = sc.start(i, S); ok(p && (p.x === null || (isFinite(p.x) && isFinite(p.y))), who + ": start(" + i + ") is a point"); }
  if (sc.ambient) {
    sc.ambient.setup(S);
    [0, 1].forEach(function (night) { S.nightness = night; for (let i = 0; i < 120; i++) sc.ambient.update(1 / 30, S);
      ["under", "back", "front", "light"].forEach(function (k) { if (sc.ambient[k]) sc.ambient[k](g, 4, S); }); });
  }
});
console.log("ok: " + n + " checks passed");
