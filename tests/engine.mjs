// The engine, run for real. src/card.js boots src/engine/engine.js into a fake shadow root,
// with a fake Home Assistant whose answers each case sets (an answer, a failure, or a call
// held open until the case lets it go) and a clock the case moves by hand: Date, the
// timers and the frame loop are all fakes while these run, and put back after. The cases
// assert what is on the card and what the card asks Home Assistant to do, not the source.
// Run from tests/check.mjs, which hands over the src/ it was given, so falsify.sh's
// sabotaged copies are what boots here.
import { pathToFileURL } from "node:url";
import path from "node:path";

// ── A page just big enough for card.js and the engine ─────────────────────────────
function stubContext(c) {
  const grad = { addColorStop() {} }, calls = {};
  const t = { canvas: c, calls: calls, measureText: function (s) { return { width: String(s).length * 8 }; },
    createLinearGradient: function () { return grad; }, createRadialGradient: function () { return grad; },
    createPattern: function () { return {}; },
    getImageData: function (x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }; } };
  return new Proxy(t, {
    get: function (o, k) {
      if (k in o) return o[k];
      if (typeof k !== "string" || !/^[a-z]/.test(k)) return undefined;
      return (o[k] = function () { calls[k] = (calls[k] || 0) + 1; });
    },
    set: function (o, k, v) { o[k] = v; return true; }
  });
}
function el(tag, id) {
  const e = {
    tagName: String(tag || "div").toUpperCase(), id: id || "", className: "", textContent: "", style: {}, scrollTop: 0,
    width: 0, height: 0, clientWidth: 0, clientHeight: 0, children: [], parentNode: null, listeners: {}, _html: "", attrs: {},
    classList: {
      s: new Set(),
      add: function (c) { this.s.add(c); }, remove: function (c) { this.s.delete(c); },
      toggle: function (c, on) { if (on === undefined ? !this.s.has(c) : on) this.s.add(c); else this.s.delete(c); },
      contains: function (c) { return this.s.has(c); }
    },
    addEventListener: function (t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener: function (t, f) { this.listeners[t] = (this.listeners[t] || []).filter(function (g) { return g !== f; }); },
    fire: function (t, ev) { const self = this; (this.listeners[t] || []).slice().forEach(function (f) { f(Object.assign({ target: self }, ev || {})); }); },
    getContext: function () { return this.g || (this.g = stubContext(this)); },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 1280, height: 800 }; },
    appendChild: function (c) { return this.insertBefore(c, null); },
    insertBefore: function (c, ref) {
      if (c.parentNode) c.parentNode.children = c.parentNode.children.filter(function (x) { return x !== c; });
      const i = ref ? this.children.indexOf(ref) : -1;
      if (i < 0) this.children.push(c); else this.children.splice(i, 0, c);
      c.parentNode = this; return c;
    },
    removeChild: function (c) { this.children = this.children.filter(function (x) { return x !== c; }); c.parentNode = null; return c; },
    get lastChild() { return this.children[this.children.length - 1] || null; },
    get nextSibling() { const p = this.parentNode; return p ? p.children[p.children.indexOf(this) + 1] || null : null; },
    getAttribute: function (k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute: function (k, v) { this.attrs[k] = String(v); },
    closest: function () { return null; },
    // gotIt() swaps the letter for a "cleared" line: keep the swap so a case can read it
    querySelector: function (sel) {
      const host = this;
      if (sel !== ".post" || host._html.indexOf('class="post"') < 0) return null;
      return { set outerHTML(v) { host.swapped = v; } };
    }
  };
  Object.defineProperty(e, "innerHTML", { get: function () { return this._html; }, set: function (v) { this._html = String(v); this.children = []; } });
  return e;
}
function find(e, id) {
  if (!e) return null;
  if (e.id === id) return e;
  for (let i = 0; i < e.children.length; i++) { const f = find(e.children[i], id); if (f) return f; }
  return null;
}
// The card's shadow root: setting innerHTML makes an element for every id in the markup,
// each a child of the .fd wrapper (the engine only needs to find them, not their nesting).
function shadowRoot() {
  const sr = {
    wrap: null, _html: "",
    get innerHTML() { return this._html; },
    set innerHTML(v) {
      this._html = String(v);
      const w = this.wrap = el("div"); w.className = "fd"; w.clientWidth = 1280; w.clientHeight = 800;
      for (const m of this._html.matchAll(/<(\w+)([^>]*)\bid="([^"]+)"([^>]*)>/g)) {
        const e = el(m[1], m[3]), a = m[2] + m[4], wd = a.match(/\bwidth="(\d+)"/), ht = a.match(/\bheight="(\d+)"/);
        if (wd) e.width = +wd[1];
        if (ht) e.height = +ht[1];
        w.appendChild(e);
      }
    },
    getElementById: function (id) { return find(this.wrap, id); },
    querySelector: function (sel) { return sel === ".fd" ? this.wrap : null; }
  };
  return sr;
}

// ── The clock: Date, the timers and the frame loop ─────────────────────────────
const RealDate = Date;
const C = { now: 0, seq: 0, q: new Map(), raf: null, rafSeq: 0, ms: 1000 };
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(C.now); }
  static now() { return C.now; }
}
function addTimer(fn, ms, every) { const id = ++C.seq; C.q.set(id, { fn: fn, at: C.now + Math.max(0, +ms || 0), every: every }); return id; }
const FAKES = {
  Date: FakeDate,
  setTimeout: function (fn, ms) { return addTimer(fn, ms, 0); },
  setInterval: function (fn, ms) { return addTimer(fn, ms, Math.max(1, +ms || 1)); },
  clearTimeout: function (id) { C.q.delete(id); },
  clearInterval: function (id) { C.q.delete(id); },
  requestAnimationFrame: function (fn) { C.raf = { id: ++C.rafSeq, fn: fn }; return C.rafSeq; },
  cancelAnimationFrame: function (id) { if (C.raf && C.raf.id === id) C.raf = null; }
};
const flush = function () { return new Promise(function (r) { setImmediate(r); }); };
// Moves the clock on by ms, running every timer that falls due on the way, in order, and
// letting the promises each one starts settle before the next.
async function advance(ms) {
  const end = C.now + ms;
  for (;;) {
    let next = null;
    for (const [id, t] of C.q) if (t.at <= end && (!next || t.at < next[1].at)) next = [id, t];
    if (!next) break;
    const [id, t] = next;
    C.now = Math.max(C.now, t.at);
    if (t.every) t.at += t.every; else C.q.delete(id);
    t.fn();
    await flush();
  }
  C.now = end;
  await flush();
}
// One animation frame, a little over a second after the last, so the HUD redraws too.
function frame() { const f = C.raf; if (!f) return false; C.raf = null; C.ms += 1100; f.fn(C.ms); return true; }
function intervals() { let n = 0; C.q.forEach(function (t) { if (t.every) n++; }); return n; }
function local(y, mo, d, h, mi) { return new RealDate(y, mo - 1, d, h, mi || 0).getTime(); }

// ── Home Assistant ──────────────────────────────────────────────────────────────
// answer(path) gives each callApi its reply: an array or object, an Error to reject with,
// or HOLD to keep the call open in hass.held until the case settles it.
const HOLD = {};
function fakeHass(states) {
  const H = {
    states: states || {}, api: [], calls: [], held: [],
    answer: function () { return []; },
    callApi: function (method, p) {
      H.api.push(p);
      const a = H.answer(p);
      if (a === HOLD) return new Promise(function (ok, no) { H.held.push({ path: p, ok: ok, no: no }); });
      return a instanceof Error ? Promise.reject(a) : Promise.resolve(a);
    },
    callService: function (domain, service, data) { H.calls.push({ domain: domain, service: service, data: data }); return Promise.resolve(); }
  };
  return H;
}
function calId(p) { const m = String(p).match(/^calendars\/([^?]+)\?/); return m ? m[1] : null; }
function timed(summary, day, hm) { return { summary: summary, start: { dateTime: day + "T" + hm + ":00+00:00" }, end: { dateTime: day + "T" + hm + ":30+00:00" } }; }
function allDay(summary, day) { return { summary: summary, start: { date: day }, end: { date: day } }; }
// a calendar router: { "calendar.alex": [rows] | Error | HOLD }, anything else answers []
function route(map) { return function (p) { const id = calId(p); return id && Object.prototype.hasOwnProperty.call(map, id) ? map[id] : []; }; }

const PEOPLE = [{ name: "Alex", calendar: ["calendar.alex", "calendar.alex_work"] }, { name: "Sky", role: "kid", calendar: "calendar.sky" }, { name: "House", calendar: "calendar.house" }];
const BASE_STATES = function () { return { "weather.home": { state: "sunny", attributes: { temperature: 14 } } }; };

export async function engineChecks(src, T) {
  const saved = {};
  ["Date", "setTimeout", "setInterval", "clearTimeout", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame",
    "document", "matchMedia", "ResizeObserver", "location", "history", "dispatchEvent"].forEach(function (k) { saved[k] = globalThis[k]; });
  const savedTZ = process.env.TZ, savedWarn = console.warn, savedError = console.error, logs = [];
  // Every date in these cases is UK local time, on any machine.
  process.env.TZ = "Europe/London";
  console.warn = function () { logs.push(["warn"].concat([].slice.call(arguments)).join(" ")); };
  console.error = function () { logs.push(["error"].concat([].slice.call(arguments)).join(" ")); };
  // on a failure, the engine's last words first, then check.mjs's FAIL line on the real console
  const fail = function (cond) { if (!cond) { console.warn = savedWarn; console.error = savedError; console.error("engine log, last 12 lines:\n  " + logs.slice(-12).join("\n  ")); } return cond; };
  const eq = function (got, want, what) { if (JSON.stringify(got) !== JSON.stringify(want)) fail(false); T.eq(got, want, "engine: " + what); };
  const ok = function (cond, what) { fail(!!cond); T.ok(cond, "engine: " + what); };

  Object.assign(globalThis, FAKES);
  let MQ = null;                                     // the reduced-motion media query the next engine gets
  const ROS = [];
  globalThis.matchMedia = function () { return MQ || { matches: false, addEventListener: function () {}, removeEventListener: function () {} }; };
  globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; ROS.push(this); } observe() {} disconnect() { this.cb = null; } };
  globalThis.location = { pathname: "/wall-panel/home" };
  globalThis.history = { pushState: function () {} };
  globalThis.dispatchEvent = function () { return true; };
  globalThis.document = { createElement: function (tag) { return el(tag); }, getElementById: function () { return null; },
    head: { appendChild: function () {} }, dispatchEvent: function () { return true; } };
  const HE = globalThis.HTMLElement.prototype;
  HE.attachShadow = function () { return (this.shadowRoot = shadowRoot()); };
  HE.dispatchEvent = function () { return true; };

  // card.js registers its element on import; keep the class it hands over
  let Card = null;
  const define = globalThis.customElements.define;
  globalThis.customElements.define = function (name, cls) { if (name === "family-dashboard-card") Card = cls; };
  await import(pathToFileURL(path.join(src, "card.js")).href);
  globalThis.customElements.define = define;
  ok(typeof Card === "function", "src/card.js defines the card element");

  // Boots a card at the clock's time: config, hass, on the page, a size, then start().
  async function boot(config, hass) {
    C.q.clear(); C.raf = null;
    const card = new Card();
    card.setConfig(Object.assign({ type: "custom:family-dashboard-card", query: "dbg" }, config));
    card.hass = hass;
    card.isConnected = true;
    card.connectedCallback();
    await mount(card);
    return card;
  }
  async function mount(card) {
    const ro = ROS[ROS.length - 1];
    if (ro && ro.cb) ro.cb();
    await flush(); await flush();
    const sr = card.shadowRoot;
    return Object.assign(card, { sr: sr, $: function (id) { return sr.getElementById(id); }, dbg: globalThis.meadow });
  }
  function person(card, name) { return card.dbg.fam.filter(function (t) { return t.person.name === name; })[0]; }
  function text(card, id) { return String(card.$(id).innerHTML || card.$(id).textContent || ""); }
  function sets(hass, entity) { return hass.calls.filter(function (c) { return c.service === "set_value" && c.data.entity_id === entity; }); }
  function done(card) { card.disconnectedCallback(); C.q.clear(); C.raf = null; MQ = null; }

  const DAY = "2026-10-26";                         // a Monday, GMT
  const NOON = local(2026, 10, 26, 12, 0);

  // ── Calendars: a failed load is not a free day ────────────────────────────────
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = function () { return new Error("Calendar offline"); };
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "Calendar unavailable", "every calendar failing: the summary says so, not Free today");
    ok(/Calendar unavailable, so this card can't say what's on\./.test(text(card, "lists")), "every calendar failing: Today says the calendar is unavailable");
    ok(/Can't load the week \(no calendar answered \(calendar\.alex, calendar\.alex_work, calendar\.sky, calendar\.house\)\)\./.test(text(card, "lists")),
      "every calendar failing: the foot names the failed load and each calendar");
    frame();
    ok(/^Can't load the week \(no calendar answered/.test(card.$("status").textContent), "every calendar failing: the status line says the week did not load");
    ok(logs.some(function (l) { return /meadow: calendar\.alex/.test(l); }), "a failed calendar is logged");
    done(card);
  }
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex_work": new Error("Calendar offline"), "calendar.sky": [timed("Drama", DAY, "16:00")] });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "Calendar unavailable", "one of a person's calendars down: their summary is not Free today");
    ok(/Calendar unavailable: calendar\.alex_work\. This week may be missing events\./.test(text(card, "lists")), "one of a person's calendars down: the foot names it");
    ok(!/Can't load the week/.test(text(card, "lists")), "one calendar down is not a failed load");
    card.$("done").fire("click");
    card.dbg.open(person(card, "House"), true);
    eq(card.$("sum").textContent, "Free today", "someone else's calendar down: the House is free");
    ok(/Nothing for the house today\./.test(text(card, "lists")) && !/calendar\.alex_work/.test(text(card, "lists")), "someone else's calendar down: not named on the House's card");
    card.$("done").fire("click");
    card.dbg.open(person(card, "Sky"), true);
    eq(card.$("sum").textContent, "1 thing today", "a calendar that answered still counts its events");
    frame();
    eq(card.$("status").textContent, "1 calendar unavailable: Alex", "one calendar down: the status line names whose");
    done(card);
  }
  // Before the first load answers, the week is loading, not free: on the card and on the status
  // line, which says so ahead of a letter helper that cannot be read.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = function () { return HOLD; };
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: "input_text.letter_alex" }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home" } }, hass);
    await advance(1600);
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "Loading the week", "a card opened while the calendars are still answering says the week is loading");
    ok(/Still loading the week, so this card can't say what's on yet\./.test(text(card, "lists")) && !/Nothing on today/.test(text(card, "lists")), "and its Today is not a free day");
    frame();
    eq(card.$("status").textContent, "Loading the week", "the status line says the week is loading");
    hass.held.splice(0).forEach(function (h) { h.ok([]); });
    await flush();
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "Free today", "once the calendars answer, an empty day is free");
    frame();
    eq(card.$("status").textContent, "Letters unavailable: Alex", "and the status line moves on");
    done(card);
  }
  // A later load where every calendar fails keeps the last good week and says so, and the
  // weather still updates: the week no longer holds the other sources hostage.
  {
    C.now = NOON;
    const st = BASE_STATES();
    const hass = fakeHass(st);
    hass.answer = route({ "calendar.alex": [timed("Dentist", DAY, "15:00")] });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    frame();
    ok(/14\u00b0/.test(text(card, "clock")), "the weather's temperature is on the clock");
    hass.answer = function () { return new Error("Calendar offline"); };
    st["weather.home"] = { state: "rainy", attributes: { temperature: 9 } };
    await advance(5 * 60000);
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "1 thing today", "a failed reload keeps the last week that loaded");
    ok(/Dentist/.test(text(card, "lists")) && /Can't load the week \(no calendar answered [^)]*\)\), so this is the last week that loaded\./.test(text(card, "lists")),
      "and the card says it is the last week that loaded");
    frame();
    eq(card.$("status").textContent, "Can't load the week (no calendar answered (calendar.alex, calendar.alex_work, calendar.sky, calendar.house)). Showing 12:00",
      "the status line says the week failed and how old the one showing is");
    ok(/9\u00b0/.test(text(card, "clock")), "the weather updates although the week failed");
    done(card);
  }
  // A calendar that never answers counts as failed after 20 s; the sensors do not wait for it.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex_work": HOLD, "calendar.sky": [timed("Drama", DAY, "16:00")] });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    frame();
    ok(/14\u00b0/.test(text(card, "clock")), "the weather arrives while a calendar has not answered");
    await advance(19000);
    frame();
    eq(card.$("status").textContent, "Loading the week", "19 s on, the week is still loading");
    await advance(1000);
    frame();
    eq(card.$("status").textContent, "1 calendar unavailable: Alex", "20 s on, the calendar that never answered counts as failed");
    card.dbg.open(person(card, "Sky"), true);
    eq(card.$("sum").textContent, "1 thing today", "and the calendars that did answer are on the card");
    card.$("done").fire("click");
    card.dbg.open(person(card, "Alex"), true);
    ok(/Calendar unavailable: calendar\.alex_work\./.test(text(card, "lists")), "the person's card names the calendar that did not answer");
    done(card);
  }
  // The trips calendar the same: a hung holiday fetch fails after 20 s and says so.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.trips": HOLD });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", trips: "calendar.trips" } }, hass);
    await advance(20000);
    frame();
    eq(card.$("status").textContent, "Holidays unavailable (no answer in 20 s)", "a holiday fetch that never answers is unavailable after 20 s");
    done(card);
  }
  // A title is text: markup in it comes out escaped, on the card and in the HUD's Next line.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex": [timed("Dentist <b>x</b> & \"co\"", DAY, "15:00")] });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    ok(text(card, "lists").indexOf("Dentist &lt;b&gt;x&lt;/b&gt; &amp; &quot;co&quot;") >= 0 && text(card, "lists").indexOf("<b>x</b>") < 0, "a title's markup is escaped on the card");
    frame();
    ok(text(card, "next").indexOf("Dentist &lt;b&gt;x&lt;/b&gt;") >= 0 && text(card, "next").indexOf("<b>x</b>") < 0, "a title's markup is escaped in the Next line");
    done(card);
  }
  // A week older than the stale limit (40 minutes) says how old it is; a fresher one does not.
  for (const [mins, want] of [[41, "Calendars last checked today 11:19"], [39, ""]]) {
    C.now = NOON;
    const st = BASE_STATES();
    st["sensor.family_week"] = { state: "ok", attributes: { events: [], checked_at: new RealDate(NOON - mins * 60000).toISOString() } };
    const hass = fakeHass(st);
    const card = await boot({ people: [{ name: "Alex" }, { name: "House" }], sensors: { week: "sensor.family_week", extra: null, weather: "weather.home" } }, hass);
    frame();
    eq(card.$("status").textContent, want, "a week checked " + mins + " minutes ago " + (want ? "is flagged stale" : "is not stale"));
    done(card);
  }
  // The holidays: a failed fetch keeps the last list, and the status line says so and how old it is.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    let trips = [allDay("Holidays: Cornwall", "2026-12-21")];
    hass.answer = function (p) { return calId(p) === "calendar.trips" ? trips : []; };
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", trips: "calendar.trips" } }, hass);
    frame();
    ok(/Cornwall/.test(text(card, "dates")), "a holiday on the trips calendar is a countdown");
    eq(card.$("status").textContent, "", "holidays fetched: nothing on the status line");
    trips = new Error("Trips offline");
    await advance(5 * 60000);
    frame();
    eq(card.$("status").textContent, "Holidays unavailable (Trips offline). Showing the list from today 12:00", "a failed holiday fetch reaches the status line with the age of the list it kept");
    ok(/Cornwall/.test(text(card, "dates")), "a failed holiday fetch keeps the last list");
    done(card);
  }

  // ── Letters: closing a card never empties a helper that has moved on ────────────
  // The shared helper (sensors.letter): Letter A arrives, is opened; if the helper still holds
  // A on close it is emptied, and if a newer letter landed while the card was up it is left.
  for (const newer of [false, true]) {
    C.now = NOON;
    const st = BASE_STATES();
    st["input_text.family_letter"] = { state: "Alex: Letter A", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);                                // the first live poll
    eq(card.dbg.LETTER.queue.map(function (l) { return l.text; }), ["Letter A"], "a shared letter is queued for the person it names");
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();       // the postie's delivery
    card.dbg.open(alex, true);
    ok(/Letter A/.test(text(card, "lists")), "the card shows the letter it was opened on");
    if (newer) st["input_text.family_letter"] = { state: "Alex: Letter C", last_changed: "2026-10-26T12:00:30Z" };
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.family_letter").map(function (c) { return c.data.value; }), newer ? [] : [""],
      newer ? "a newer shared letter that landed while the card was up is not emptied" : "closing the card empties the shared helper it was opened on");
    eq(alex.letter, null, "closing the card takes the letter off the tag");
    done(card);
  }
  // A per-person helper (people[].letter): the same, for the room panels' "from|text".
  for (const newer of [false, true]) {
    C.now = NOON;
    const st = BASE_STATES();
    st["input_text.letter_alex"] = { state: "Parent 1|Coats on", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: "input_text.letter_alex" }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    eq(card.dbg.LETTER.queue.map(function (l) { return [l.from, l.text]; }), [["Parent 1", "Coats on"]], "a per-person letter is queued with its sender");
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    ok(/Letter from <b>Parent 1<\/b>/.test(text(card, "lists")) && /Coats on/.test(text(card, "lists")), "the card shows the per-person letter and who it is from");
    if (newer) st["input_text.letter_alex"] = { state: "Parent 1|Hat too", last_changed: "2026-10-26T12:00:30Z" };
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.letter_alex").map(function (c) { return c.data.value; }), newer ? [] : [""],
      newer ? "a newer per-person letter that landed while the card was up is not emptied" : "closing the card empties the person's helper");
    done(card);
  }

  // Letter B lands in the shared helper before anyone opens letter A: closing A leaves B there,
  // and reading B empties it.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["input_text.family_letter"] = { state: "Alex: Letter A", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    st["input_text.family_letter"] = { state: "Alex: Letter B", last_changed: "2026-10-26T12:00:10Z" };
    await advance(45000);
    eq(card.dbg.LETTER.queue.map(function (l) { return l.text; }), ["Letter B"], "a second shared letter queues behind the first");
    card.dbg.open(alex, true);
    ok(/Letter A/.test(text(card, "lists")), "the card opens on letter A");
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.family_letter").length, 0, "closing letter A leaves letter B in the helper");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.family_letter").map(function (c) { return c.data.value; }), [""], "reading letter B empties the helper");
    done(card);
  }

  // ── stop(): the card leaves the page and takes its loop and timers with it ────────
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    ok(C.raf && intervals() >= 4, "a running card has a frame queued and its polls on intervals");
    const pending = C.raf;
    ok(C.q.size > intervals(), "and its first live poll waiting on a timeout");
    card.disconnectedCallback();
    eq([C.raf, intervals()], [null, 0], "stop() cancels the frame and clears every interval");
    eq(C.q.size, 0, "stop() clears its timeouts too");
    pending.fn(C.ms += 1100);
    eq(C.raf, null, "a frame already on its way when stop() ran does not queue another");
    done(card);
  }
  // The card reuses its shadow root, so an old engine's timeout must not reach the new popup:
  // the 60 s auto-close of a card opened before a config change, and a tap's delayed open.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    card.setConfig({ type: "custom:family-dashboard-card", query: "dbg", people: PEOPLE, sensors: { weather: "weather.home" } });
    await mount(card);
    await advance(30000);
    card.dbg.open(person(card, "Sky"), true);
    await advance(31000);
    ok(card.$("scrim").classList.contains("open") && card.$("who").textContent === "Sky", "the old engine's auto-close does not close the new engine's card");
    await advance(30000);
    ok(!card.$("scrim").classList.contains("open"), "the new engine's own auto-close does, 60 s after it opened");
    // a tap on a creature opens its card 320 ms later; one made just before the card left the page opens nothing
    frame();
    const tap = function () { const b = person(card, "Alex").tagBox; card.$("world").fire("pointerdown", { clientX: b[0] + b[2] / 2, clientY: b[1] + b[3] / 2 }); };
    tap();
    await advance(400);
    eq(card.$("who").textContent + " " + card.$("scrim").classList.contains("open"), "Alex true", "a tap on a name tag opens that person's card");
    card.$("done").fire("click");
    frame();
    tap();
    card.disconnectedCallback();
    card.connectedCallback();
    await mount(card);
    await advance(400);
    ok(!card.$("scrim").classList.contains("open"), "a tap made before the card left the page does not open a card on the new one");
    done(card);
  }
  // The bell (announcement_sound) gets an AudioContext on its first ring; stop() closes it.
  {
    C.now = NOON;
    const ACS = [];
    globalThis.AudioContext = class {
      constructor() { this.state = "running"; this.currentTime = 0; this.destination = {}; this.closed = false; ACS.push(this); }
      createOscillator() { return { frequency: {}, connect() {}, start() {}, stop() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      resume() { return Promise.resolve(); }
      close() { this.closed = true; return Promise.resolve(); }
    };
    const st = BASE_STATES();
    st["input_text.announcement"] = { state: "Tea's ready", last_changed: new RealDate(NOON - 5000).toISOString(), attributes: {} };
    const hass = fakeHass(st);
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" }, announcement: "input_text.announcement", announcement_sound: true }, hass);
    for (let i = 0; i < 600 && !ACS.length; i++) frame();
    ok(ACS.length === 1 && !ACS[0].closed, "the town crier rings the bell for a new announcement");
    card.disconnectedCallback();
    await flush();
    ok(ACS[0].closed, "stop() closes the bell's audio");
    delete globalThis.AudioContext;
    done(card);
  }
  // A new config (the editor's save) stops the running engine and starts one on the new config.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    const first = card.dbg, n = intervals();
    card.setConfig({ type: "custom:family-dashboard-card", query: "dbg", people: [{ name: "Alex", calendar: "calendar.alex" }, { name: "House" }], sensors: { weather: "weather.home" } });
    await mount(card);
    ok(card.dbg !== first && card.dbg.fam.length === 2, "a new config starts a new engine on it");
    eq(intervals(), n, "and the old engine's polls stop");
    done(card);
  }

  Object.keys(saved).forEach(function (k) { if (saved[k] === undefined) delete globalThis[k]; else globalThis[k] = saved[k]; });
  delete HE.attachShadow; delete HE.dispatchEvent;
  delete globalThis.meadow;
  if (savedTZ === undefined) delete process.env.TZ; else process.env.TZ = savedTZ;
  console.warn = savedWarn; console.error = savedError;
}
