// The announcement banner, the due-time row and the status tiles (v1.6.0): their config and
// what each entity's state means. Pure functions, no DOM and no hass, so tests/check.mjs runs
// them as they are. The engine draws the results (engine.js, "Announcements, due times, tiles").
//
//   normAnnouncement(raw)            config: announcement + announcement_title -> { entity, title } or null
//   normDue(raw)                     config: due -> { entity, attribute } or null
//   normTiles(raw)                   config: status_tiles -> a list of up to four tiles
//   parseAnnouncement(state, now, names)  what the banner says, if anything
//   parseDue(state, attribute, now, names)  the items with a due time, worded
//   dueForHud(due, now)              the few that belong on the row in the sky
//   tileState(tile, state)           a tile's value, colour and fill level
//   thresholdText(list) / parseThresholdText(text)  the editor's "0 #5B7FD6, 8 #3FA34D" form
//
// state is a Home Assistant state object ({ state, attributes, last_changed }), or null when the
// entity is missing. now is a Date or epoch ms. A configured entity that cannot be read comes
// back as status "unavailable" with a reason, never as nothing to show.

export const DUE_ATTR = "items";
export const TILE_ICONS = ["flask", "thermometer", "bulb", "door", "plug"];
export const MAX_TILES = 4;
export const TILE_DEFAULTS = { color: "#3F5FA8", on_color: "#E8A93C", off_color: "#8A8A94" };
const ANNOUNCE_DOMAINS = ["input_text", "text", "sensor", "input_select"];
const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const OPENINGS = ["door", "window", "garage_door", "opening"];

function err(msg) { return new Error("family-dashboard-card: " + msg); }
function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function ymdOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function ms(v) { return v instanceof Date ? v.getTime() : +v; }
function hm(d) { return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
function gone(state) {
  if (!state) return "not found";
  const s = String(state.state);
  return s === "unavailable" ? "is unavailable" : "";
}
export function hexOf(v, what) {
  if (Array.isArray(v) && v.length === 3 && v.every(function (n) { return isFinite(+n); }))
    return "#" + v.map(function (n) { const h = Math.max(0, Math.min(255, Math.round(+n))).toString(16); return h.length < 2 ? "0" + h : h; }).join("");
  const s = typeof v === "string" ? v.trim() : "";
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  throw err(what + " must be a hex colour like \"#3FA34D\", got " + JSON.stringify(v));
}

// ── Config ────────────────────────────────────────────────────────────────────
export function normAnnouncement(raw) {
  const v = raw.announcement;
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !ENTITY.test(v.trim()) || ANNOUNCE_DOMAINS.indexOf(v.trim().split(".")[0]) < 0)
    throw err("announcement must be an input_text, text, input_select or sensor entity id, like input_text.announcement, got " + JSON.stringify(v));
  const t = raw.announcement_title;
  if (t != null && typeof t !== "string") throw err("announcement_title must be text, got " + JSON.stringify(t));
  return { entity: v.trim(), title: t ? t.trim() : "" };
}
export function normDue(raw) {
  const v = raw.due;
  if (v == null || v === "") return null;
  const o = typeof v === "string" ? { entity: v } : isObj(v) ? v : null;
  if (!o || typeof o.entity !== "string" || !ENTITY.test(o.entity.trim()))
    throw err("due must be an entity id like sensor.due_times, or { entity, attribute }, got " + JSON.stringify(v));
  if (o.attribute != null && (typeof o.attribute !== "string" || !o.attribute.trim())) throw err("due.attribute must be an attribute name, got " + JSON.stringify(o.attribute));
  return { entity: o.entity.trim(), attribute: o.attribute ? o.attribute.trim() : DUE_ATTR };
}
function numOpt(v, what) {
  if (v == null || v === "") return null;
  if (!isFinite(+v) || typeof v === "boolean") throw err(what + " must be a number, got " + JSON.stringify(v));
  return +v;
}
export function normTiles(raw) {
  const v = raw.status_tiles;
  if (v == null) return [];
  if (!Array.isArray(v)) throw err("status_tiles must be a list of tiles, each with an entity");
  if (v.length > MAX_TILES) throw err("status_tiles holds at most " + MAX_TILES + " tiles, got " + v.length);
  return v.map(function (t, i) {
    const w = "status_tiles[" + i + "]", o = typeof t === "string" ? { entity: t } : t;
    if (!isObj(o) || typeof o.entity !== "string" || !ENTITY.test(o.entity.trim())) throw err(w + " needs an entity id like sensor.fridge_temperature, got " + JSON.stringify(t));
    const entity = o.entity.trim(), domain = entity.split(".")[0];
    const icon = o.icon == null || o.icon === "" ? (domain === "light" ? "bulb" : domain === "switch" || domain === "input_boolean" ? "plug" : domain === "binary_sensor" ? "door" : "thermometer") : String(o.icon);
    if (TILE_ICONS.indexOf(icon) < 0) throw err(w + ".icon must be one of " + TILE_ICONS.join(", ") + ", got " + JSON.stringify(o.icon));
    ["label", "unit"].forEach(function (k) { if (o[k] != null && typeof o[k] !== "string" && typeof o[k] !== "number") throw err(w + "." + k + " must be text, got " + JSON.stringify(o[k])); });
    let th = o.thresholds == null || o.thresholds === "" ? [] : o.thresholds;
    if (typeof th === "string") th = parseThresholdText(th, w + ".thresholds");
    if (!Array.isArray(th)) throw err(w + ".thresholds must be a list of { from, color }");
    th = th.map(function (s, k) {
      if (!isObj(s)) throw err(w + ".thresholds[" + k + "] must be { from, color }, got " + JSON.stringify(s));
      const from = numOpt(s.from, w + ".thresholds[" + k + "].from");
      if (from == null) throw err(w + ".thresholds[" + k + "] needs a from number");
      return { from: from, color: hexOf(s.color, w + ".thresholds[" + k + "].color") };
    }).sort(function (a, b) { return a.from - b.from; });
    const dec = numOpt(o.decimals, w + ".decimals");
    if (dec != null && (dec < 0 || dec > 3 || dec !== Math.round(dec))) throw err(w + ".decimals must be 0, 1, 2 or 3, got " + JSON.stringify(o.decimals));
    const out = { entity: entity, icon: icon, label: o.label == null ? "" : String(o.label).trim(), unit: o.unit == null ? null : String(o.unit),
      thresholds: th, min: numOpt(o.min, w + ".min"), max: numOpt(o.max, w + ".max"), decimals: dec };
    ["color", "on_color", "off_color"].forEach(function (k) { out[k] = o[k] == null || o[k] === "" ? null : hexOf(o[k], w + "." + k); });
    if (out.min != null && out.max != null && out.max <= out.min) throw err(w + ".max must be more than min");
    return out;
  });
}
// The editor shows thresholds as one line: "0 #5B7FD6, 8 #3FA34D, 14 #C9594A".
export function thresholdText(list) {
  return (Array.isArray(list) ? list : []).filter(isObj).map(function (s) { return s.from + " " + (Array.isArray(s.color) ? hexOf(s.color, "color") : s.color); }).join(", ");
}
export function parseThresholdText(text, what) {
  const s = String(text == null ? "" : text).trim();
  if (!s) return [];
  return s.split(/\s*,\s*/).filter(Boolean).map(function (part) {
    const m = /^(-?\d+(?:\.\d+)?)\s*[: ]\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)$/i.exec(part);
    if (!m) throw err((what || "thresholds") + " must read like \"0 #5B7FD6, 8 #3FA34D\", got " + JSON.stringify(part));
    return { from: +m[1], color: m[2] };
  });
}

// ── The announcement ─────────────────────────────────────────────────────────
// The state is the text. "minutes|from|text" (what a script writes, say "30|Parent 2|Dinner's
// ready") lasts that many minutes from last_changed; "Name: text", where Name is someone in the
// cast, says who it is from; anything else is the text, shown until the entity is emptied.
// unknown counts as empty (a template sensor with nothing to say reports unknown); missing or
// unavailable is unavailable. names: the cast's names and aliases, to match "Name:".
export function parseAnnouncement(state, now, names) {
  const why = gone(state);
  if (why) return { status: "unavailable", reason: why };
  const raw = String(state.state == null ? "" : state.state).trim(), t = ms(now);
  if (!raw || raw === "unknown") return { status: "empty" };
  const lc = Date.parse(state.last_changed || state.last_updated || ""), key = raw + "|" + (state.last_changed || "");
  let text = raw, from = "", mins = null;
  const m = /^(\d{1,4})\|([^|]*)\|([\s\S]*)$/.exec(raw);
  if (m) { mins = Math.min(+m[1] || 30, 1440); from = m[2].trim(); text = m[3].trim(); }
  else {
    const n = /^([^:]{1,30}?)\s*:\s*([\s\S]+)$/.exec(raw), list = (names || []).map(function (x) { return String(x).toLowerCase(); });
    if (n && list.indexOf(n[1].trim().toLowerCase()) >= 0) { from = (names || [])[list.indexOf(n[1].trim().toLowerCase())]; text = n[2].trim(); }
  }
  if (!text) return { status: "empty" };
  const until = mins != null && isFinite(lc) ? lc + mins * 60000 : null;
  if (until != null && t >= until) return { status: "expired", text: text, from: from, until: until, key: key };
  return { status: "show", text: text, from: from, mins: mins, until: until, key: key };
}

// ── Due times ────────────────────────────────────────────────────────────────
// The attribute is a list (or that list as a JSON string) of { label, due, person? }. due is a
// time today ("15:30"), a date ("2026-11-02", due that day) or a date and time
// ("2026-11-02T08:00", "2026-11-02 08:00", or with an offset). person matches the cast by name
// or alias; no person, or one the card does not know, belongs to the household. Items that do
// not parse are counted in bad and left out, so a typo does not empty the row silently.
export function parseDue(state, attribute, now, names) {
  const attr = attribute || DUE_ATTR, why = gone(state);
  if (why) return { status: "unavailable", reason: why, items: [], bad: 0 };
  let list = (state.attributes || {})[attr];
  if (typeof list === "string") { try { list = JSON.parse(list); } catch (e) { list = null; } }
  if (!Array.isArray(list)) return { status: "unavailable", reason: "has no " + attr + " list", items: [], bad: 0 };
  const t = ms(now), today = new Date(t), lower = (names || []).map(function (x) { return String(x).toLowerCase(); });
  let bad = 0;
  const items = [];
  list.forEach(function (it) {
    const o = isObj(it) ? it : null, label = o && o.label != null ? String(o.label).trim() : "", at = o ? dueAt(o.due, today) : null;
    if (!label || !at) { bad++; return; }
    const pk = o.person == null ? -1 : lower.indexOf(String(o.person).trim().toLowerCase());
    items.push(word({ label: label, person: pk >= 0 ? names[pk] : "", at: at.t, allDay: at.allDay, date: at.date }, t));
  });
  items.sort(function (a, b) { return a.sort - b.sort || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0); });
  return { status: "ok", items: items, bad: bad };
}
function dueAt(v, today) {
  const s = String(v == null ? "" : v).trim();
  let m = /^(\d{1,2}):(\d\d)(?::\d\d)?$/.exec(s);
  if (m && +m[1] < 24 && +m[2] < 60) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), +m[1], +m[2]); return { t: d.getTime(), allDay: false, date: ymdOf(d) }; }
  m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s);
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) || d.getDate() !== +m[3] ? null : { t: d.getTime(), allDay: true, date: ymdOf(d) }; }
  if (/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(s)) {
    const x = Date.parse(s.replace(" ", "T"));
    if (isFinite(x)) { const d = new Date(x); return { t: x, allDay: false, date: ymdOf(d) }; }
  }
  return null;
}
function dayWord(date, t) {
  const n = new Date(t), d = new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  const days = Math.round((d - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
  return { days: days, word: days === 0 ? "Today" : days === 1 ? "Tomorrow" : days === -1 ? "Yesterday" : days > 1 && days < 7 ? DAYS[d.getDay()] : DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] };
}
// kind: overdue | now | soon (within the hour) | today | tomorrow | later. when is the time or
// day ("15:30", "Tomorrow 08:00", "Thu"), rel the words ("due in 2h 15m"), short the badge.
function word(it, t) {
  const dw = dayWord(it.date, t);
  if (it.allDay) {
    it.sort = new Date(+it.date.slice(0, 4), +it.date.slice(5, 7) - 1, +it.date.slice(8, 10), 23, 59, 59).getTime();
    it.when = dw.word;
    if (dw.days < 0) { it.kind = "overdue"; it.rel = "overdue"; it.short = "late"; }
    else if (dw.days === 0) { it.kind = "today"; it.rel = "due today"; it.short = "today"; }
    else if (dw.days === 1) { it.kind = "tomorrow"; it.rel = "due tomorrow"; it.short = "tmrw"; }
    else { it.kind = "later"; it.rel = "due " + dw.word; it.short = dw.word.split(" ")[0]; }
    return it;
  }
  const d = new Date(it.at), mins = Math.ceil((it.at - t) / 60000);
  it.sort = it.at;
  it.when = (dw.days === 0 ? "" : dw.word + " ") + hm(d);
  if (it.at <= t) {
    const late = Math.floor((t - it.at) / 60000);
    it.kind = "overdue"; it.short = "late";
    it.rel = late < 1 ? "due now" : "overdue " + (late < 60 ? late + " min" : late < 1440 ? hours(late) : Math.floor(late / 1440) + (late < 2880 ? " day" : " days"));
    if (late < 1) { it.kind = "now"; it.short = "now"; }
  } else if (mins <= 1) { it.kind = "now"; it.rel = "due now"; it.short = "now"; }
  else if (mins < 60) { it.kind = "soon"; it.rel = "due in " + mins + " min"; it.short = mins + "m"; }
  else if (dw.days === 0) { it.kind = "today"; it.rel = "due in " + hours(mins); it.short = Math.floor(mins / 60) + "h"; }
  else if (dw.days === 1) { it.kind = "tomorrow"; it.rel = "due tomorrow " + hm(d); it.short = hm(d); }
  else { it.kind = "later"; it.rel = "due " + it.when; it.short = dw.word.split(" ")[0]; }
  return it;
}
function hours(mins) { const h = Math.floor(mins / 60), m = mins % 60; return h + "h" + (m ? " " + m + "m" : ""); }
// The row in the sky: overdue items and anything due in the next 18 hours, soonest first, at most n.
export function dueForHud(due, now, n) {
  if (!due || due.status !== "ok") return [];
  const t = ms(now), cap = t + 18 * 3600e3;
  return due.items.filter(function (it) { return it.kind === "overdue" || it.kind === "now" || it.kind === "today" || it.sort <= cap; })
    .slice(0, n == null ? 3 : n);
}

// ── Status tiles ─────────────────────────────────────────────────────────────
// A number takes the colour of the highest threshold it has reached (none reached: the tile's
// color), and fills the icon by where it sits between min and max. on/off (and open/closed)
// take on_color / off_color; a door or window binary sensor reads open or closed. Any other
// word is shown as it is. A missing, unknown or unavailable entity is unavailable.
export function tileState(tile, state) {
  if (!state) return { status: "unavailable", reason: "not found", text: "unavailable", color: TILE_DEFAULTS.off_color, level: 0, on: null };
  const s = String(state.state == null ? "" : state.state).trim(), a = state.attributes || {};
  if (s === "unavailable" || s === "unknown" || s === "") return { status: "unavailable", reason: "is " + (s || "empty"), text: "unavailable", color: TILE_DEFAULTS.off_color, level: 0, on: null };
  const lower = s.toLowerCase();
  if (/^(on|off|open|closed)$/.test(lower)) {
    const on = lower === "on" || lower === "open", door = OPENINGS.indexOf(a.device_class) >= 0 || lower === "open" || lower === "closed";
    return { status: "ok", text: door ? (on ? "open" : "closed") : on ? "on" : "off", on: on, num: null,
      color: on ? tile.on_color || TILE_DEFAULTS.on_color : tile.off_color || TILE_DEFAULTS.off_color, level: on ? 1 : 0 };
  }
  if (/^-?\d+(\.\d+)?(e[-+]?\d+)?$/i.test(s)) {
    const v = parseFloat(s), unit = tile.unit != null ? tile.unit : a.unit_of_measurement || "";
    const dec = tile.decimals != null ? tile.decimals : v === Math.round(v) ? 0 : 1;
    let color = tile.color || TILE_DEFAULTS.color;
    (tile.thresholds || []).forEach(function (th) { if (v >= th.from) color = th.color; });
    const level = tile.min != null && tile.max != null ? Math.max(0, Math.min(1, (v - tile.min) / (tile.max - tile.min))) : 0.6;
    return { status: "ok", text: v.toFixed(dec) + (unit ? (/^[°%]/.test(unit) ? "" : " ") + unit : ""), num: v, on: null, color: color, level: level };
  }
  return { status: "ok", text: s.length > 12 ? s.slice(0, 11) + "…" : s, num: null, on: null, color: tile.color || TILE_DEFAULTS.color, level: 0.6 };
}
