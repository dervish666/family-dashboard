// The card's data: the reads from Home Assistant, each child's school day read from them, and
// the status line that says what is old or broken. No DOM and no engine state: the engine hands
// in hass, its clock and its timers, schedules the loads and merges each answer into its
// snapshot (DATA). tests/check.mjs runs these as they are.
//
//   newLoader(config, now, timers)  one per engine: load() reads the week, the holidays and
//                                   the other sensors, each landing on its own through put()
//   readWeek, holidays, ask         the calendar reads, each with its 20 s limit
//   schoolSources(people, demo)     each child's timetable, lunch and choice entities
//   schoolParse, choiceFor          a child's lessons, lunch and lunch choice on a day, from the snapshot
//   schoolDay(data, src, name, d)   whether a child has school today: true, false, or null for cannot tell
//   byStart(events)                 the week's order
//   statusLine(data, d, o)          the HUD's status line: what is old or broken, most urgent first
//   dayLabel(ds, t)                 "Today", "Tomorrow", "Thu 29", or "Thu 5 Nov" a week or more on
//   stamp(at, t)                    when a read was made, for a sentence: "today 11:19"
//   WEEK_STALE                      how old a week can be before the card says how old it is
import { weekRange, calendarPath, parseCalendarEvents } from "./calendar.js";
import { parseTimetable, parseLunch, lunchChoice, readExtra } from "./school.js";
import { pad2, ymd } from "./engine/draw.js";

export var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// A day, "YYYY-MM-DD", as the cards name it from t (the engine's clock, test hooks and all).
export function dayLabel(ds, t) {
  var today = ymd(t), tm = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);   // the next civil day: a DST eve is 23 or 25 hours
  if (ds === today) return "Today";
  if (ds === ymd(tm)) return "Tomorrow";
  var d = new Date(ds + "T12:00:00"), days = (d - t) / 864e5;
  return DAYS[d.getDay()] + " " + d.getDate() + (days > 6 ? " " + MONTHS[d.getMonth()] : "");
}
// In a sentence "today" and "tomorrow" are lower case and a day keeps its capital: "Showing Mon 26".
function dayWord(ds, t) { var w = dayLabel(ds, t); return w === "Today" || w === "Tomorrow" ? w.toLowerCase() : w; }
export function stamp(at, t) { return dayWord(ymd(at), t) + " " + pad2(at.getHours()) + ":" + pad2(at.getMinutes()); }
export var WEEK_STALE = 40 * 60000;

// ── Home Assistant ──────────────────────────────────────────────────────────────
// Home Assistant hands the card its hass object, so there is no token to find:
// hassReady() just takes the hass the card has, or says there is none yet.
export function hassReady(h) {
  return h ? Promise.resolve(h) : Promise.reject(new Error("no connection to Home Assistant yet"));
}
export function getState(id, h) {
  var s = h.states[id];
  return s ? Promise.resolve(s) : Promise.reject(new Error(id + " not found"));
}
// A calendar request that has not answered in CAL_WAIT counts as failed. Without a limit one
// call that never came back held the whole load open, so nothing on the card updated again and
// nothing said why. 20 s leaves room for an integration that fetches a remote calendar over a
// slow link, and still names a hung calendar long before the next reload, five minutes on.
// timers are the engine's setTimeout and clearTimeout, so stop() clears a wait still running.
export var CAL_WAIT = 20000;
export function ask(tok, p, timers) {
  var tm = 0;
  return Promise.race([Promise.resolve().then(function () { return tok.callApi("GET", p); }),
    new Promise(function (ok, no) { tm = timers.setTimeout(function () { no(new Error("no answer in " + CAL_WAIT / 1000 + " s")); }, CAL_WAIT); })])
    .then(function (v) { timers.clearTimeout(tm); return v; }, function (e) { timers.clearTimeout(tm); throw e; });
}
// Trips from the family calendar (sensors.trips), a year ahead from d. The REST calendar
// endpoint gives all-day events as {date} and timed ones as {dateTime}; either way the day is
// the first ten characters. The loader catches a failure: the last good list stays, and the
// status line says it is unavailable and how old the list is.
export function holidays(tok, trips, d, timers) {
  if (!trips) return Promise.resolve([]);
  var td = ymd(d), end = (+td.slice(0, 4) + 1) + td.slice(4);
  return ask(tok, "calendars/" + trips + "?start=" + td + "T00:00:00&end=" + end + "T00:00:00", timers)
    .then(function (evs) { return evs.filter(function (e) { return /\bholidays?\b/i.test(e.summary || ""); }).map(function (e) {
      return { date: (e.start.date || e.start.dateTime).slice(0, 10), label: e.summary.replace(/\bholidays?\b/i, "").replace(/^[\s:,-]+|[\s:,-]+$/g, "") || "Holiday" }; }); });
}
// The week from d, two ways. Calendar mode (a calendar on any person): ask Home Assistant's
// calendar API for each one, so no template sensor is needed. v1.0.0 mode: read the
// family_week template sensor. A calendar that fails is named on its owner's card
// and its events are left out; the rest of the week still draws.
export function readWeek(tok, config, d, timers) {
  var SENSORS = config.sensors;
  if (!config.calendarMode) return getState(SENSORS.week, tok).catch(function () {
    throw new Error(SENSORS.week + " not found. Give people a calendar in the card editor, or set up that sensor");
  }).then(function (s) {
    var wk = s.attributes || {};
    if (!Array.isArray(wk.events)) throw new Error(SENSORS.week + " has no events list (state " + s.state + ")");
    return { events: wk.events, at: wk.checked_at ? new Date(wk.checked_at) : null, failed: [] };
  });
  var range = weekRange(d), jobs = [];
  config.people.forEach(function (p) { (p.calendars || []).forEach(function (id) {
    jobs.push(ask(tok, calendarPath(id, range), timers).then(function (evs) { return { ok: true, rows: parseCalendarEvents(evs, p.name, range) }; })
      .catch(function (e) { console.warn("meadow: " + id, e); return { ok: false, who: p.name, id: id, err: (e && (e.message || e.body && e.body.message)) || String(e) }; }));
  }); });
  return Promise.all(jobs).then(function (rs) {
    var ok = rs.filter(function (r) { return r.ok; }), failed = rs.filter(function (r) { return !r.ok; });
    if (!ok.length) throw new Error("no calendar answered (" + failed.map(function (f) { return f.id; }).join(", ") + ")");
    return { events: [].concat.apply([], ok.map(function (r) { return r.rows; })), at: new Date(), failed: failed };
  });
}
// By day, then all day, then a timed event carried over from an earlier day, then start. Day
// first: a carried-over row keeps its first day's start, so start alone sorts it back there.
export function byStart(ev) {
  function rank(e) { return e.all_day ? 0 : e.cont ? 1 : 2; }
  return ev.slice().sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : rank(a) - rank(b) || new Date(a.start) - new Date(b.start); });
}

// ── The loads ───────────────────────────────────────────────────────────────────
// The week, the holidays and the sensors each land on their own. A week that fails keeps its
// last good copy and says so (error); the weather, the sun, school and the holidays update
// either way. Each load has a number, and an answer from an older load than the one already
// shown is dropped: a slow load from before midnight must not bring yesterday's week back. So is
// a week asked for on an earlier day than now, whichever lands first: it starts at yesterday,
// and the load the engine starts at midnight brings today's.
// load(h, ids, put): h is the card's hass (or none yet), ids the school entities to read
// (schoolEntities), and put(patch, retag) hands each answer to the engine, which merges it
// into its snapshot and redraws the name tags when retag is set.
export function newLoader(config, now, timers) {
  var SENSORS = config.sensors, LOADS = 0, SHOWN = { week: 0, hol: 0 };
  function newest(k, gen) { if (gen < SHOWN[k]) return false; SHOWN[k] = gen; return true; }
  return function load(h, ids, put) {
    var schoolErr = null, extraErr = null, gen = ++LOADS, day = ymd(now());
    function today() { return ymd(now()) === day; }
    hassReady(h).then(function (tok) {
      // the school sensors are optional: a missing one blanks its part of the School card, nothing else
      function opt(id) { if (!id) return Promise.resolve(null);
        return getState(id, tok).catch(function (e) { console.warn("meadow: " + id, e); schoolErr = e.message || String(e); return null; }); }
      // sensors.extra is optional too, but a configured one that is missing says so on every card
      var extra = !SENSORS.extra ? Promise.resolve(null) : getState(SENSORS.extra, tok)
        .then(function (s) { if (/^(unavailable|unknown)$/.test(s.state) && !(s.attributes || {}).checked_at) throw new Error(SENSORS.extra + " is " + s.state); return s; })
        .catch(function (e) { console.warn("meadow: extra", e); extraErr = e.message || String(e); return null; });
      // each child's timetable, lunch and choice entities: a missing one is null, and its card says so
      var states = {};
      var school = Promise.all(ids.map(function (id) { return getState(id, tok).then(function (s) { states[id] = s; })
        .catch(function (e) { console.warn("meadow: " + id, e); states[id] = null; }); })).then(function () { return states; });
      var week = readWeek(tok, config, now(), timers).then(function (wk) {
        if (!today() || !newest("week", gen)) return;
        put({ events: byStart(wk.events), weekAt: wk.at, calFailed: wk.failed, error: null, gotAt: new Date() }, true);
      }, function (e) { console.error("meadow: the week did not load", e); if (today() && newest("week", gen)) put({ error: e.message || String(e) }); });
      var hols = holidays(tok, SENSORS.trips, now(), timers).then(function (h) { if (newest("hol", gen)) put({ holidays: h, holidaysErr: null, holidaysAt: new Date() }); },
        function (e) { console.warn("meadow: holidays", e); if (newest("hol", gen)) put({ holidaysErr: (e && (e.message || e.body && e.body.message)) || String(e) }); });   // the last good list stays
      var rest = Promise.all([extra, school, opt(SENSORS.kit), opt(SENSORS.sun), opt(SENSORS.weather)]).then(function (s) {
        // a part of it in the wrong shape is left out and named on the cards, not handed to a forEach
        var xr = readExtra(s[0] ? s[0].attributes : null);
        if (xr.bad.length) console.warn("meadow: " + SENSORS.extra + " unreadable: " + xr.bad.join(", "));
        put({ extra: xr.data, extraBad: xr.bad, extraErr: extraErr, school: { states: s[1], kit: s[2] && s[2].attributes, err: schoolErr },
          pc: null, sun: s[3] && s[3].attributes, weather: s[4] ? { state: s[4].state, attributes: s[4].attributes } : null, othersAt: new Date() }, true);
      });
      return Promise.all([week, hols, rest]);
    }).catch(function (e) { console.error("meadow: load failed", e); put({ error: e.message || String(e) }); });
  };
}

// ── The status line ─────────────────────────────────────────────────────────────
export const DEMO_IN_HA = "Demo data. Turn off Demo cast in the card editor to see your calendars";
// Say out loud when the picture is old. A stale week must not read as a quiet one. One line,
// the most urgent first, "" when nothing is wrong. data is the engine's snapshot (DATA), d now,
// and o the rest it reports on: { demo, demoInHa (the demo on a real Home Assistant), offline
// ({ at: the last read } while Home Assistant is disconnected), letters (LETTER: bad, clearErr),
// weatherLive, annErr (the announcement's failed clear) }. The demo has
// no week to load and no weather; on a real dashboard it must still say it is the demo, or a
// person given a real calendar reads as free on made-up data.
export function statusLine(data, d, o) {
  var st = "", L = o.letters;
  // the day too once it is not today: an overnight outage must not read as this morning
  function showing(at) { return ". Showing " + (ymd(at) === ymd(d) ? "" : dayWord(ymd(at), d) + " ") + pad2(at.getHours()) + ":" + pad2(at.getMinutes()); }
  if (o.demoInHa) st = DEMO_IN_HA;
  else if (o.offline) st = "No connection to Home Assistant" + (o.offline.at ? showing(o.offline.at) : "");
  else if (data.error) st = "Can't load the week (" + data.error + ")" + (data.gotAt ? showing(data.gotAt) : "");
  else if (!data.gotAt && !o.demo) st = "Loading the week";
  else if (data.weekAt && d - data.weekAt > WEEK_STALE) st = "Calendars last checked " + stamp(data.weekAt, d);
  else if (data.calFailed && data.calFailed.length) st = data.calFailed.length + (data.calFailed.length === 1 ? " calendar" : " calendars") + " unavailable: " + data.calFailed.map(function (f) { return f.who; }).join(", ");
  else if (L.bad.length) st = "Letters unavailable: " + L.bad.map(function (b) { return b.who; }).join(", ");
  else if (data.holidaysErr) st = "Holidays unavailable (" + data.holidaysErr + ")" + (data.holidaysAt ? ". Showing the list from " + stamp(data.holidaysAt, d) : "");
  else if (!o.weatherLive && !o.demo) st = "Weather unavailable, showing made-up showers";
  else if (L.clearErr) st = "Couldn't clear the letter in Home Assistant";
  else if (o.annErr) st = "Couldn't clear the announcement in Home Assistant";
  return st;
}

// ── School data per child ───────────────────────────────────────────────────────
// Each child's school sources from people[].timetable, .lunch and .choice (v1.1.0's
// sensors.timetable and .lunch arrive here too, copied onto their owner by normalize()).
// The demo hands its made-up sensors to the first three school kids instead.
export function schoolSources(people, demo) {
  var SRC = {};
  people.forEach(function (p) { if (p.timetable || p.lunch || p.choice) SRC[p.name] = { timetable: p.timetable, lunch: p.lunch, choice: p.choice }; });
  if (demo) {
    SRC = {};
    var DK = people.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
    var dsrc = function (id, a) { return { entity: id, attribute: a }; };
    if (DK[0]) SRC[DK[0]] = { timetable: dsrc("sensor.demo_timetable_1", "timetable") };
    if (DK[1]) SRC[DK[1]] = { timetable: dsrc("sensor.demo_timetable_2", "timetable"), lunch: dsrc("sensor.demo_lunch_2", "menu"), choice: { days: { fri: "packed" } } };
    if (DK[2]) SRC[DK[2]] = { lunch: dsrc("sensor.demo_lunch_3", "menu"), choice: { value: "school" } };
  }
  return SRC;
}
export function schoolEntities(SRC) {
  var ids = [];
  Object.keys(SRC).forEach(function (n) { var s = SRC[n];
    [s.timetable && s.timetable.entity, s.lunch && s.lunch.entity, s.choice && s.choice.entity].forEach(function (id) { if (id && ids.indexOf(id) < 0) ids.push(id); }); });
  return ids;
}
// Parsed once per child and day until the next load: schoolDay() asks every frame. The cache
// sits on the snapshot (data.pc), which the loader's put() empties with each new read of the
// sensors. { status: "loading" } until the first load has read them. today is the clock the
// v1.1.0 flat shapes read ("today" and "tomorrow" rather than dates).
export function schoolParse(data, SRC, kind, name, d, today) {
  var src = SRC[name] && SRC[name][kind];
  if (!src) return null;
  if (!data.school) return { status: "loading", lessons: [], options: [] };
  var C = data.pc || (data.pc = {}), k = kind + "|" + name + "|" + ymd(d);
  if (!(k in C)) { var st = data.school.states ? data.school.states[src.entity] : null;
    C[k] = (kind === "timetable" ? parseTimetable : parseLunch)(st || null, d, today, src.attribute); }
  return C[k];
}
export function choiceFor(data, SRC, name, d, fromData) {
  var c = SRC[name] && SRC[name].choice, S = data.school || {};
  return lunchChoice(c || null, d, c && c.entity && S.states ? S.states[c.entity] : null, fromData);
}
export function weekday(d) { return d.getDay() >= 1 && d.getDay() <= 5; }
// true = school day, false = no school, null = cannot tell. d is now.
export function schoolDay(data, SRC, name, d) {
  if (!weekday(d)) return false;
  var td = ymd(d);
  // The child's own timetable and lunch sensors answer first (people[].timetable, .lunch). A
  // timetable day with no lessons on it is no evidence of school: the lunch or the term dates decide.
  var tt = schoolParse(data, SRC, "timetable", name, d, d);
  if (tt && tt.status === "ok" && tt.lessons.length) return true;
  if (tt && (tt.status === "closed" || tt.status === "weekend")) return false;
  var ln = schoolParse(data, SRC, "lunch", name, d, d);
  if (ln && ln.status === "served") return true;
  if (ln && ln.status === "closed") return false;
  // Otherwise the term dates in sensors.extra.
  var sc = ((data.extra || {}).schools || []).filter(function (s) { return s.who === name; })[0];
  if (!sc || !sc.terms) return null;
  if ((sc.days || []).some(function (x) { return x.date === td; })) return false;
  // In term needs a known end still ahead; out of term needs a known gap either
  // side. Some schools publish half their dates, and an open-ended term is an
  // unknown, not a yes: Christmas must not show anyone at school.
  var prevEnd = null, nextStart = null, inTerm = false, open = false;
  sc.terms.forEach(function (t) {
    if (t.to && t.to >= td && (!t.from || t.from <= td)) inTerm = true;
    if (t.from && t.from <= td && !t.to) open = true;
    if (t.to && t.to < td && (!prevEnd || t.to > prevEnd)) prevEnd = t.to;
    if (t.from && t.from > td && (!nextStart || t.from < nextStart)) nextStart = t.from;
  });
  if (inTerm) return true;
  if (!open && prevEnd && nextStart) return false;
  return null;
}
