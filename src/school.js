// School data per child: the lesson timetable and the lunch menu, read from sensor attributes.
// Pure functions, no DOM and no hass, so tests/check.mjs runs them as they are.
//
//   parseTimetable(state, date[, today])  what lessons a day holds, and that week's grid
//   parseLunch(state, date[, today])      what lunch a day holds
//   lunchChoice(conf, date, live, fromData)  packed lunch or school dinner, and where it came from
//   lessonsOver(day, at[, fallback])      whether a day's lessons have ended by the time at
//
// state is a Home Assistant state object ({ state, attributes }), or null when the entity is
// missing. date is a Date or "YYYY-MM-DD". today is only read by the v1.1.0 flat shapes, which
// describe "today" and "tomorrow" rather than dates; it defaults to date.
//
// The shapes are in README.md, "School data per child". A day that cannot be read says why
// (status "unavailable" with a reason) rather than reading as a day with nothing on.

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
export const TIMETABLE_ATTR = "timetable";
export const LUNCH_ATTR = "menu";
const LONG = { sunday: "sun", monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu", friday: "fri", saturday: "sat" };
const DAY_MS = 864e5;

function pad2(n) { return (n < 10 ? "0" : "") + n; }
function ymdOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
// Noon local on that day, so adding whole days never lands on the wrong side of a clock change.
export function toDay(v) {
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12);
  const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(v == null ? "" : v));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
}
export function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12); }
export function mondayOf(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
function weeksBetween(a, b) { return Math.round((b - a) / (7 * DAY_MS)); }
function dayKey(k) { const s = String(k).toLowerCase(); return LONG[s] || (DAY_KEYS.indexOf(s.slice(0, 3)) >= 0 ? s.slice(0, 3) : null); }
function str(v) { return v == null ? "" : String(v).trim(); }
function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

// The attribute's value, parsed if a template handed it over as a JSON string.
function attrOf(state, attribute) {
  const a = state && state.attributes || {};
  let v = a[attribute];
  if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = undefined; } }
  return v;
}
function unavailable(state, attribute) {
  if (!state) return "not found";
  if (/^(unavailable|unknown)$/.test(String(state.state))) return "is " + state.state;
  return "has no " + attribute + " attribute";
}

// ── The timetable ─────────────────────────────────────────────────────────────
// { weeks: ["A", "B"], anchor: "2026-09-07", week_of: { "2026-10-26": "A" },
//   periods: [{ p: 1, start: "08:50", end: "09:50" }],
//   days: { A: { mon: [{ p: 1, subject: "Maths", room: "M1" }] } },
//   closed: ["2026-11-13", { date: "2026-12-18", note: "INSET" }] }
// anchor is a day in weeks[0]. Each week_of entry names the week that runs from that Monday
// and restarts the count from there; null names a week off the timetable (a holiday week).
function lessonOf(l, i) {
  if (typeof l === "string") { const s = l.split("|"); return { p: i + 1, subject: s[0].trim(), room: str(s[1]) === "\u2014" ? "" : str(s[1]) }; }
  if (!isObj(l)) return null;
  return { p: l.p == null || l.p === "" ? i + 1 : l.p, subject: str(l.subject), room: str(l.room), start: str(l.start), end: str(l.end) };
}
function normTimetable(t) {
  const days = {};
  Object.keys(isObj(t.days) ? t.days : {}).forEach(function (w) {
    const src = t.days[w], out = {};
    if (isObj(src)) Object.keys(src).forEach(function (k) {
      const key = dayKey(k);
      if (key && Array.isArray(src[k])) out[key] = src[k].map(lessonOf).filter(function (l) { return l && l.subject; });
    });
    days[String(w)] = out;
  });
  const weeks = (Array.isArray(t.weeks) && t.weeks.length ? t.weeks : Object.keys(days)).map(String);
  const periods = (Array.isArray(t.periods) ? t.periods : []).filter(isObj).map(function (p, i) {
    return { p: p.p == null ? i + 1 : p.p, start: str(p.start), end: str(p.end) }; });
  const closed = {};
  (Array.isArray(t.closed) ? t.closed : []).forEach(function (c) {
    const d = toDay(isObj(c) ? c.date : c); if (d) closed[ymdOf(d)] = isObj(c) ? str(c.note) : ""; });
  const weekOf = {};
  Object.keys(isObj(t.week_of) ? t.week_of : {}).forEach(function (k) {
    const d = toDay(k); if (d) weekOf[ymdOf(mondayOf(d))] = t.week_of[k] == null || t.week_of[k] === "" ? null : String(t.week_of[k]); });
  const anchor = toDay(t.anchor);
  return { weeks: weeks, days: days, periods: periods, closed: closed, weekOf: weekOf, anchor: anchor ? mondayOf(anchor) : null };
}
// Which week runs from this Monday: { week } or { week: null, off: true } or { week: null, reason }.
export function weekFor(T, mon) {
  const key = ymdOf(mon);
  if (Object.prototype.hasOwnProperty.call(T.weekOf, key)) {
    const v = T.weekOf[key];
    if (v === null) return { week: null, off: true };
    return T.weeks.indexOf(v) >= 0 ? { week: v } : { week: null, reason: "week_of " + key + " names week " + v + ", which is not in weeks" };
  }
  if (T.weeks.length === 1) return { week: T.weeks[0] };
  if (!T.weeks.length) return { week: null, reason: "no weeks" };
  const refs = [];
  if (T.anchor) refs.push({ at: T.anchor, i: 0 });
  Object.keys(T.weekOf).forEach(function (k) { const i = T.weeks.indexOf(T.weekOf[k]); if (i >= 0) refs.push({ at: toDay(k), i: i }); });
  if (!refs.length) return { week: null, reason: "no anchor or week_of to count from" };
  const before = refs.filter(function (r) { return r.at <= mon; }).sort(function (a, b) { return b.at - a.at; });
  const ref = before[0] || refs.sort(function (a, b) { return a.at - b.at; })[0];
  const n = T.weeks.length, i = ((ref.i + weeksBetween(ref.at, mon)) % n + n) % n;
  return { week: T.weeks[i] };
}
function withTimes(T, list) {
  const at = {};
  T.periods.forEach(function (p) { at[String(p.p)] = p; });
  return list.map(function (l) { const p = at[String(l.p)] || {};
    return { p: l.p, start: l.start || p.start || "", end: l.end || p.end || "", subject: l.subject, room: l.room }; });
}
// Mon to Fri of the week holding d: the rows are the periods, then any lesson numbers the
// periods list leaves out, in the order they first appear.
function gridFor(T, d) {
  const mon = mondayOf(d), wk = weekFor(T, mon), lessons = wk.week ? T.days[wk.week] || {} : {};
  const order = T.periods.map(function (p) { return String(p.p); });
  const days = WEEKDAY_KEYS.map(function (k, i) {
    const date = ymdOf(addDays(mon, i)), off = Object.prototype.hasOwnProperty.call(T.closed, date);
    const list = withTimes(T, lessons[k] || []);
    list.forEach(function (l) { if (order.indexOf(String(l.p)) < 0) order.push(String(l.p)); });
    return { key: k, date: date, closed: off || !!wk.off, note: off ? T.closed[date] : "", lessons: list };
  });
  const rows = order.map(function (p) {
    const per = T.periods.filter(function (x) { return String(x.p) === p; })[0] || {};
    return { p: per.p != null ? per.p : p, start: per.start || "", end: per.end || "",
      cells: days.map(function (dd) { return dd.closed ? null : dd.lessons.filter(function (l) { return String(l.p) === p; })[0] || null; }) };
  });
  return { monday: ymdOf(mon), week: wk.week, off: !!wk.off, reason: wk.reason || "", days: days, rows: rows };
}
// v1.1.0's flat sensor: the week's name as the state, lessons_today / lessons_tomorrow as
// "Subject|Room", open_today / open_tomorrow, and grid: { "Week 1": { Monday: [...] } }.
function fromLegacy(state, today) {
  const a = state.attributes || {}, wk = str(state.state), t0 = toDay(today), t1 = addDays(t0, 1);
  const grid = isObj(a.grid) ? a.grid : {}, days = {};
  Object.keys(grid).forEach(function (w) { days[w] = grid[w]; });
  if (!days[wk]) days[wk] = {};
  const wt = str(a.week_tomorrow) || wk;
  if (!days[wt]) days[wt] = {};
  function fill(w, d, list) { const k = DAY_KEYS[d.getDay()]; if (Array.isArray(list) && list.length && !(days[w][k] || days[w][LONG_NAME[k]])) days[w][k] = list; }
  fill(wk, t0, a.lessons_today); fill(wt, t1, a.lessons_tomorrow);
  const closed = [];
  if (a.open_today === false) closed.push(ymdOf(t0));
  if (a.open_tomorrow === false) closed.push(ymdOf(t1));
  const weekOf = {}; weekOf[ymdOf(mondayOf(t0))] = wk;
  if (ymdOf(mondayOf(t1)) !== ymdOf(mondayOf(t0))) weekOf[ymdOf(mondayOf(t1))] = wt;
  return { weeks: Object.keys(days), days: days, week_of: weekOf, closed: closed };
}
const LONG_NAME = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
function isLegacyTimetable(a) { return !!a && ("lessons_today" in a || "open_today" in a || isObj(a.grid)); }

// status: ok (lessons is the day, maybe empty), weekend, closed (note says why, if known),
// no_week (a rotation with nothing to count from), unavailable (reason says why).
export function parseTimetable(state, date, today, attribute) {
  const d = toDay(date), attr = attribute || TIMETABLE_ATTR;
  const out = { status: "unavailable", date: d ? ymdOf(d) : "", day: d ? DAY_KEYS[d.getDay()] : "", week: null, lessons: [], note: "", reason: "", grid: null };
  if (!d) { out.reason = "no date"; return out; }
  let raw = attrOf(state, attr);
  if (!isObj(raw) && state && isLegacyTimetable(state.attributes)) raw = fromLegacy(state, today || d);
  if (!isObj(raw) || !isObj(raw.days)) { out.reason = isObj(raw) ? "no days in the " + attr + " attribute" : unavailable(state, attr); return out; }
  const T = normTimetable(raw), g = gridFor(T, d);
  out.grid = g; out.week = g.week;
  const dow = d.getDay();
  if (dow === 0 || dow === 6) { out.status = "weekend"; return out; }
  if (Object.prototype.hasOwnProperty.call(T.closed, out.date)) { out.status = "closed"; out.note = T.closed[out.date]; return out; }
  if (g.off) { out.status = "closed"; out.note = "not a timetable week"; return out; }
  if (!g.week) { out.status = "no_week"; out.reason = g.reason; return out; }
  out.status = "ok";
  out.lessons = g.days[dow - 1].lessons;
  return out;
}

// When a day's lessons are over, so a child's card can move on to the next school day: the
// end of the last lesson that has an end time, as minutes past midnight. No end time on any
// lesson (v1.1.0's flat lessons, periods listed without "end") is null, and the caller falls
// back to a fixed time.
export const LESSONS_FALLBACK = 15 * 60 + 30;
export function lessonsEnd(day) {
  let end = null;
  ((day && day.lessons) || []).forEach(function (l) {
    const m = /^(\d{1,2}):(\d\d)/.exec(str(l.end));
    if (m) { const v = +m[1] * 60 + +m[2]; if (end === null || v > end) end = v; }
  });
  return end;
}
// true once the clock at is past that end (on the minute it ends counts as over), or past
// fallback (default 15:30) when the day has no end times.
export function lessonsOver(day, at, fallback) {
  const end = lessonsEnd(day), cut = end === null ? (fallback == null ? LESSONS_FALLBACK : fallback) : end;
  return at.getHours() * 60 + at.getMinutes() >= cut;
}

// ── Lunch ─────────────────────────────────────────────────────────────────────
// The sensor carries menu: { "2026-10-26": { status, options: [{ name, kind, allergens }],
// pudding, note, choice } } and menu_ends: "2026-12-18", or both inside one attribute.
// status is served, closed (note says why) or no_menu. A weekday with no entry is no_menu,
// or ended once it is past menu_ends.
function allergensOf(v) {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/\s*,\s*/) : [];
  const out = [];
  list.forEach(function (x) { const s = str(x); if (s && out.indexOf(s) < 0) out.push(s); });
  return out;
}
function dishOf(v) {
  if (typeof v === "string") return v.trim() ? { name: v.trim(), kind: "", allergens: [] } : null;
  if (!isObj(v) || !str(v.name)) return null;
  return { name: str(v.name), kind: str(v.kind), allergens: allergensOf(v.allergens) };
}
function fromLegacyLunch(a, d, today) {
  const t0 = toDay(today), k = ymdOf(d) === ymdOf(t0) ? "today" : ymdOf(d) === ymdOf(addDays(t0, 1)) ? "tomorrow" : null;
  const menu = {};
  if (k) {
    const st = str(a["status_" + k]) || (a["served_" + k] ? "served" : "");
    if (st) menu[ymdOf(d)] = { status: st, pudding: a["pudding_" + k],
      options: [{ name: a["main_" + k], kind: "main" }, { name: a["veg_" + k], kind: "veg" }].filter(function (o) { return str(o.name); }) };
  }
  return { menu: menu, menu_ends: a.menu_ends };
}
// status: served, closed, no_menu, ended, weekend, unavailable.
export function parseLunch(state, date, today, attribute) {
  const d = toDay(date), attr = attribute || LUNCH_ATTR;
  const out = { status: "unavailable", date: d ? ymdOf(d) : "", options: [], pudding: null, note: "", choice: "", menuEnds: "", reason: "" };
  if (!d) { out.reason = "no date"; return out; }
  const a = state && state.attributes || {};
  let raw = attrOf(state, attr), menu, ends;
  if (isObj(raw) && isObj(raw.menu)) { menu = raw.menu; ends = raw.menu_ends; }
  else if (isObj(raw)) { menu = raw; ends = a.menu_ends; }
  else if (state && ("status_today" in a || "main_today" in a)) { const L = fromLegacyLunch(a, d, today || d); menu = L.menu; ends = L.menu_ends; }
  else { out.reason = unavailable(state, attr); return out; }
  const e = toDay(ends); out.menuEnds = e ? ymdOf(e) : "";
  const entry = menu[out.date], dow = d.getDay();
  if (isObj(entry)) {
    out.options = (Array.isArray(entry.options) ? entry.options : []).map(dishOf).filter(Boolean);
    out.pudding = dishOf(entry.pudding);
    out.note = str(entry.note); out.choice = str(entry.choice);
    const st = str(entry.status);
    out.status = st === "served" || st === "closed" || st === "no_menu" ? st : out.options.length ? "served" : "no_menu";
    return out;
  }
  if (dow === 0 || dow === 6) out.status = "weekend";
  else if (out.menuEnds && out.date > out.menuEnds) out.status = "ended";
  else out.status = "no_menu";
  return out;
}

// ── The lunch choice ──────────────────────────────────────────────────────────
// conf comes from normalize(): { value }, { days: { fri: "packed" } } or { entity }. live is
// that entity's state object when there is one, fromData the day's choice on the lunch sensor.
// A live entity wins (someone just changed it), then the sensor's day, then the config.
// Returns { text, from, err } or null when nothing says.
export function choiceText(v) {
  const s = str(v);
  if (!s || /^(none|off|unknown|unavailable|-)$/i.test(s)) return "";
  if (/^pack/i.test(s)) return "Packed lunch";
  if (/^(school|dinner|hot|school (dinner|lunch|meal))$/i.test(s)) return "School dinner";
  if (/^home$/i.test(s)) return "Lunch at home";
  return s;
}
export function lunchChoice(conf, date, live, fromData) {
  const d = toDay(date);
  let err = "";
  if (conf && conf.entity) {
    const t = live ? choiceText(live.state) : "";
    if (t) return { text: t, from: conf.entity, err: "" };
    err = conf.entity + (live ? " is " + (str(live.state) || "empty") : " not found");
  }
  const fd = choiceText(fromData);
  if (fd) return { text: fd, from: "menu", err: err };
  const fixed = conf && conf.days && d ? choiceText(conf.days[DAY_KEYS[d.getDay()]]) : conf && conf.value ? choiceText(conf.value) : "";
  if (fixed) return { text: fixed, from: "config", err: err };
  return err ? { text: "", from: "", err: err } : null;
}
