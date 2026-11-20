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
// What has focus: one page, so one at a time. el().focus() takes it, the shadow root's
// activeElement reads it.
const FOCUS = { el: null };
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
    focus: function () { if (FOCUS.el && FOCUS.el !== this) FOCUS.el.fire("blur"); FOCUS.el = this; this.fire("focus"); },
    blur: function () { if (FOCUS.el === this) { FOCUS.el = null; this.fire("blur"); } },
    // gotIt() swaps the letter for a "cleared" line: keep the swap so a case can read it
    querySelector: function (sel) {
      const host = this;
      if (sel !== ".post" || host._html.indexOf('class="post"') < 0) return null;
      return { set outerHTML(v) { host.swapped = v; } };
    }
  };
  Object.defineProperty(e, "innerHTML", { get: function () { return this._html; }, set: function (v) { this._html = String(v); this.children = []; this.writes = (this.writes || 0) + 1; } });
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
        for (const at of a.matchAll(/([\w-]+)="([^"]*)"/g)) e.attrs[at[1]] = at[2];
        w.appendChild(e);
      }
    },
    getElementById: function (id) { return find(this.wrap, id); },
    get activeElement() { return FOCUS.el; },
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
function local(y, mo, d, h, mi, sec) { return new RealDate(y, mo - 1, d, h, mi || 0, sec || 0).getTime(); }

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
  function done(card) { card.disconnectedCallback(); C.q.clear(); C.raf = null; MQ = null; FOCUS.el = null; }
  function key(card, k) { return card.$("keys").children.filter(function (b) { return b.getAttribute("data-k") === k; })[0]; }
  function keyNames(card) { return card.$("keys").children.map(function (b) { return b.getAttribute("aria-label"); }); }
  // The declarations of one rule in the card's stylesheet, as the shadow root was given it.
  function rule(card, sel) {
    const css = card.sr.innerHTML.split("</style>")[0], at = css.indexOf("\n" + sel + " {");
    return at < 0 ? null : css.slice(at + sel.length + 3, css.indexOf("}", at)).trim();
  }
  function press(card, k) { card.sr.wrap.fire("keydown", { key: k, preventDefault: function () {}, stopPropagation: function () {} }); }

  const DAY = "2026-10-26";                         // a Monday, GMT
  const NOON = local(2026, 10, 26, 12, 0);

  // The demo on its own page (no Home Assistant): it runs, its status line is clear, and a card
  // has its day and says when it was checked, as the docs' screenshots show.
  {
    C.now = NOON;
    const card = await boot({ demo: true });
    for (let i = 0; i < 40; i++) frame();
    eq(card.$("status").textContent, "", "the demo page's status line is clear");
    card.dbg.open(person(card, "Parent 1"), true);
    eq(card.$("sum").textContent, "1 thing today", "a demo card has its day");
    ok(/Calendars checked today 12:00\./.test(text(card, "lists")) && !/Demo data/.test(text(card, "lists")), "and the demo page's card foot is as it was");
    done(card);
  }
  // The demo switched on in a real dashboard (Home Assistant there): a person given a real calendar
  // would read "Free today, calendars checked" on made-up data, so the status line and every card
  // foot say it is the demo, and no foot claims a check.
  {
    C.now = NOON;
    const ppl = [{ name: "Alice", calendar: "calendar.alice" }, { name: "Kid 1", role: "kid", school: true }, { name: "House" }];
    const card = await boot({ demo: true, people: ppl }, fakeHass(BASE_STATES()));
    for (let i = 0; i < 3; i++) frame();
    eq(card.$("status").textContent, "Demo data. Turn off Demo cast in the card editor to see your calendars", "the demo in Home Assistant says so on the status line");
    ok(/max-width: 300px/.test(rule(card, "#status")), "a status line that long wraps in the corner, clear of the countdowns");
    card.dbg.open(person(card, "Alice"), true);
    ok(/Demo data\. Turn off Demo cast in the card editor to see your calendars\./.test(text(card, "lists")), "and on a person's card");
    ok(!/checked/.test(text(card, "lists")), "and that card claims no check of calendars or school info");
    card.$("done").fire("click");
    card.$("keys").children.filter(function (b) { return b.getAttribute("data-k") === "school"; })[0].fire("click");
    await advance(400);
    ok(card.$("who").textContent === "School" && /Demo data\./.test(text(card, "lists")) && !/checked/.test(text(card, "lists")), "the School card says so too, with no check claimed");
    done(card);
  }
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
  // A card opened while the first load is out shows the week when it lands, in place: the
  // summary and Today change, and the letter, the focus and the scroll stay as they were.
  {
    C.now = NOON;
    const st = BASE_STATES(), id = "input_text.letter_alex";
    st[id] = { state: "Parent 1|Coats on", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    hass.answer = route({ "calendar.alex": HOLD });
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: id }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    eq(card.$("sum").textContent, "Loading the week", "a card opened before its calendar answers is loading");
    card.$("lists").scrollTop = 120;
    hass.held[0].ok([timed("Reply while open", DAY, "16:00")]);
    await flush();
    eq(card.$("sum").textContent, "1 thing today", "when the answer lands, the open card's summary has the event");
    ok(/<h2>Today<\/h2><div class="row"><div class="when">16:00<\/div><div class="what">Reply while open</.test(text(card, "lists")) && /Coats on/.test(text(card, "lists")),
      "and its Today, with the letter still at the top");
    ok(card.$("scrim").classList.contains("open") && card.sr.activeElement === card.$("done") && card.$("lists").scrollTop === 120 && sets(hass, id).length === 0,
      "the card stays up, focus on Done, scrolled where it was, and the letter is not cleared");
    done(card);
  }
  // A person with no calendar of their own has nothing to read, which is not a free day.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.house": [] });
    const ppl = [{ name: "Alex" }, { name: "House", calendar: "calendar.house" }];
    const card = await boot({ people: ppl, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    eq(card.$("sum").textContent, "No calendar", "a person with no calendar: the summary is not Free today");
    ok(/No calendar picked for Alex yet\. Add one in the card editor\./.test(text(card, "lists")), "a person with no calendar: Today says to pick one");
    card.$("done").fire("click");
    card.dbg.open(person(card, "House"), true);
    eq(card.$("sum").textContent, "Free today", "the household's own calendar, empty, is a free day");
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
  // The week that failed to reload says when it is from, with the day once that is not today.
  {
    C.now = local(2026, 10, 26, 23, 50);
    const hass = fakeHass(BASE_STATES());
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    hass.answer = function () { return new Error("Calendar offline"); };
    await advance(6 * 60000);
    frame();
    ok(/\. Showing 23:50$/.test(card.$("status").textContent), "a failed reload the same evening shows the time of the week it kept");
    await advance(5 * 60000);
    frame();
    ok(/^Can't load the week \(.*\)\. Showing Mon 26 23:50$/.test(card.$("status").textContent), "after midnight it says which day that week is from");
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
  // The household is the last person, whatever it is called: its events are on the Next line
  // without a name, as the House's are.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.family": [timed("Bin day", DAY, "15:00")] });
    const card = await boot({ people: [{ name: "Sam", calendar: "calendar.sam" }, { name: "Home", calendar: "calendar.family" }], sensors: { weather: "weather.home" } }, hass);
    frame();
    eq(text(card, "next"), "Next: <b>15:00</b> Bin day", "a household called Home: its event is on the Next line without its name");
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
  // Home Assistant's connection drops: its cached states are not read as fresh, the status line
  // says so with the time of the last read, and the moment it is back the card reads it all again.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["sensor.printer_print_status"] = { state: "running", attributes: {} };
    const hass = fakeHass(st);
    hass.connected = true;
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", printer: "sensor.printer_" } }, hass);
    await advance(1600);
    const read = card.dbg.pr().at.getTime();
    hass.connected = false;
    await advance(7 * 60000);
    frame();
    eq(card.dbg.pr().at.getTime(), read, "disconnected: the printer's cached state is not read as fresh");
    eq(card.dbg.state(), "empty", "so after six minutes the workshop has nothing fresh to show");
    eq(card.$("status").textContent, "No connection to Home Assistant. Showing 12:00", "the status line says the connection is down, and how old the picture is");
    const asked = hass.api.length;
    hass.connected = true;
    frame();
    await flush();
    ok(hass.api.length > asked && card.dbg.pr().at.getTime() > read && card.dbg.state() === "running", "back: the card reads the week and the printer at once, not at the next poll");
    frame();
    eq(card.$("status").textContent, "", "and the status line clears");
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

  // sensors.extra in the wrong shape (schools as a string, an item that is not one): that part
  // is left out and named on the cards, and the HUD, the world and the rest of the school info
  // carry on. The child's timetable and lunch sensors in odd shapes break nothing either.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["sensor.family_extra"] = { state: "3", attributes: { checked_at: "2026-10-26T08:00:00+00:00", schools: "Example Secondary",
      items: [{ who: "Sky", date: DAY, kind: "kit", what: "PE kit" }, "Swimming"], kit: [{ who: "Sky", what: "Reading book every day" }] } };
    st["sensor.sky_tt"] = { state: "A", attributes: { timetable: { weeks: "A", days: { A: { mon: "Maths" } }, periods: "p1", closed: 3 } } };
    st["sensor.sky_lunch"] = { state: "served", attributes: { menu: { [DAY]: { options: "Pasta", pudding: 3 } }, menu_ends: {} } };
    const hass = fakeHass(st);
    const ppl = PEOPLE.map(function (p) { return p.name === "Sky" ? Object.assign({ school: true, timetable: "sensor.sky_tt", lunch: "sensor.sky_lunch" }, p) : p; });
    const card = await boot({ people: ppl, query: "dbg&open=school", sensors: { weather: "weather.home", extra: "sensor.family_extra" } }, hass);
    let threw = null;
    try { for (let i = 0; i < 5; i++) frame(); await advance(2 * 60000); frame(); } catch (e) { threw = e.message; }
    eq(threw, null, "school info in the wrong shape: the world and the HUD keep running");
    ok(/^12:02/.test(text(card, "clock")), "and the clock moves on");
    eq(card.$("who").textContent, "School", "the School card opens");
    const bad = "School info unreadable (1 entry in items, schools is not a list).";
    ok(text(card, "lists").indexOf(bad) >= 0, "the School card says which part of the school info it could not read");
    ok(/PE kit/.test(text(card, "lists")) && /Reading book every day/.test(text(card, "lists")), "and still shows the parts that were fine");
    card.$("done").fire("click");
    card.dbg.open(person(card, "Sky"), true);
    ok(text(card, "lists").indexOf(bad) >= 0 && /PE kit/.test(text(card, "lists")), "a child's card says so too, and keeps their good items");
    ok(logs.some(function (l) { return /meadow: sensor\.family_extra unreadable: 1 entry in items, schools is not a list/.test(l); }), "the unreadable school info is logged");
    done(card);
  }

  // Midnight: the week reloads for the new seven days and an open card redraws for the new
  // today at once, from the week it has, without reading its letter again; a slow load from
  // before midnight that lands after the new one is dropped. Both loads are slow here, so the
  // redraw at midnight is the hud's, not the one a landing load makes.
  {
    const MON = "2026-10-26", TUE = "2026-10-27", WED = "2026-10-28";
    C.now = local(2026, 10, 26, 23, 54, 50);
    const st = BASE_STATES();
    st["input_text.family_letter"] = { state: "Alex: Night note", last_changed: "2026-10-26T23:50:00Z" };
    const hass = fakeHass(st);
    const from = function (y, mo, d) { return "start=" + encodeURIComponent(new RealDate(y, mo - 1, d).toISOString()); };
    let phase = "boot";
    hass.answer = function (p) {
      const alex = calId(p) === "calendar.alex";
      if (phase === "hold") return HOLD;
      return alex ? [timed("Dentist", TUE, "09:00")] : [];
    };
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    phase = "hold";
    await advance(5 * 60000 - 1600 + 2000);            // 23:59:52: the five-minute reload is out, and slow
    eq(hass.held.length, 4, "the 23:59:50 reload is waiting on its four calendars");
    card.dbg.open(alex, true);
    ok(/Night note/.test(text(card, "lists")) && /Tomorrow/.test(text(card, "lists")) && card.$("sum").textContent === "Free today", "before midnight: the letter, and the dentist tomorrow");
    await advance(9000);
    frame();                                           // 00:00:01
    await flush();
    ok(hass.api.some(function (p) { return calId(p) === "calendar.alex" && p.indexOf(from(2026, 10, 27)) >= 0; }), "at midnight the card asks for the new seven days");
    eq(card.$("sum").textContent, "1 thing today", "at midnight the open card's summary is for the new today");
    ok(/<h2>Today<\/h2><div class="row"><div class="when">09:00<\/div><div class="what">Dentist</.test(text(card, "lists")), "and the dentist has moved to Today");
    ok(/Night note/.test(text(card, "lists")) && card.$("scrim").classList.contains("open"), "the open card keeps its letter across midnight");
    eq(sets(hass, "input_text.family_letter").length, 0, "and the redraw does not read the letter, so nothing is cleared");
    const fresh = function (h) { return h.path.indexOf(from(2026, 10, 27)) >= 0; };
    eq(hass.held.filter(fresh).length, 4, "the new seven days are slow too");
    hass.held.filter(fresh).forEach(function (h) { h.ok(calId(h.path) === "calendar.alex" ? [timed("Dentist", TUE, "09:00"), allDay("Fresh plan", WED)] : []); });
    await flush();
    hass.held.filter(function (h) { return !fresh(h); }).forEach(function (h) { h.ok(calId(h.path) === "calendar.alex" ? [timed("Dentist", TUE, "09:00"), allDay("Stale plan", WED)] : []); });
    await flush();
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.family_letter").map(function (c) { return c.data.value; }), [""], "closing the card then clears the letter, once");
    card.dbg.open(alex, true);
    ok(/Fresh plan/.test(text(card, "lists")) && !/Stale plan/.test(text(card, "lists")), "the slow load from before midnight, landing last, does not replace the new week");
    done(card);
  }
  // A load that lands redraws an open card, but the demo's week is made up, not loaded: at
  // midnight the hud redraws the open card itself, for the new day's made-up week.
  {
    C.now = local(2026, 10, 26, 23, 59, 57);
    const card = await boot({ demo: true });
    card.dbg.open(person(card, "Parent 1"), true);
    ok(/Calendars checked today 23:59\./.test(text(card, "lists")), "the demo before midnight: its week is checked today 23:59");
    await advance(4000);
    frame();
    ok(/Calendars checked today 00:00\./.test(text(card, "lists")), "the demo after midnight: the open card is redrawn for the new day");
    done(card);
  }
  // Midnight with the card open and its calendar slow: the week asked for before midnight starts
  // at yesterday, so it is dropped whether it lands before or after the one midnight asked for,
  // and the open card shows the new week when that lands.
  for (const oldFirst of [true, false]) {
    const TUE = "2026-10-27", order = oldFirst ? "the old week landing first" : "the new week landing first";
    C.now = local(2026, 10, 26, 23, 59, 57);
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex": HOLD });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    await advance(4000);
    frame();                                           // 00:00:01: the new seven days are asked for
    await flush();
    eq(hass.held.map(function (h) { return decodeURIComponent(h.path).match(/start=(\d{4}-\d\d-\d\d)/)[1]; }), ["2026-10-26", "2026-10-27"], order + ": one week asked for each side of midnight");
    const settle = { old: function () { hass.held[0].ok([timed("Old window only", TUE, "13:00")]); }, fresh: function () { hass.held[1].ok([timed("Fresh window", TUE, "15:00")]); } };
    if (oldFirst) {
      settle.old(); await flush(); frame();
      ok(card.$("sum").textContent === "Loading the week" && !/Old window/.test(text(card, "lists")) && card.$("status").textContent === "Loading the week",
        order + ": the week asked for yesterday is not shown as today's");
      settle.fresh();
    } else { settle.fresh(); await flush(); settle.old(); }
    await flush(); frame();
    ok(card.$("sum").textContent === "1 thing today" && /Fresh window/.test(text(card, "lists")) && !/Old window/.test(text(card, "lists")),
      order + ": the open card shows the new week, in place");
    ok(/^Next: <b>15:00<\/b> Alex, Fresh window/.test(text(card, "next")), order + ": and so does the Next line");
    done(card);
  }
  // "Tomorrow" is the next civil day, on the eve of a clock change too (a 23 or a 25 hour day).
  for (const [at, rows, want, what] of [
    [local(2026, 3, 28, 23, 30), [allDay("Sunday thing", "2026-03-29"), allDay("Monday thing", "2026-03-30")], ["Tomorrow Sunday thing", "Mon 30 Monday thing"], "the evening before the clocks go forward"],
    [local(2026, 10, 25, 0, 30), [allDay("Monday thing", "2026-10-26")], ["Tomorrow Monday thing"], "just after midnight on the day the clocks go back"]]) {
    C.now = at;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex": rows });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass);
    card.dbg.open(person(card, "Alex"), true);
    const got = [...text(card, "lists").matchAll(/<div class="when">([^<]*)<\/div><div class="what">([^<]*)</g)].map(function (m) { return m[1] + " " + m[2]; });
    eq(got, want, "Tomorrow, " + what);
    done(card);
  }

  // Multi-day and overnight events, on the card: a trip on each of its days, last night's shift
  // until when it ended, not at the time it started. A day after an event's first is no walk
  // out, no party and not the next thing on.
  {
    const ev = function (summary, start, end) { return { summary: summary, start: start.length > 10 ? { dateTime: start } : { date: start }, end: end.length > 10 ? { dateTime: end } : { date: end } }; };
    const cals = { "calendar.alex": [ev("Night shift", "2026-10-26T22:00:00+00:00", "2026-10-27T06:00:00+00:00"), ev("Trip", "2026-10-27", "2026-10-30"),
      ev("Late shift", "2026-10-27T22:00:00+00:00", "2026-10-28T06:00:00+00:00"), ev("Alex's birthday party", "2026-10-26T19:00:00+00:00", "2026-10-27T01:00:00+00:00"),
      ev("Dentist", "2026-10-29T10:00:00+00:00", "2026-10-29T10:30:00+00:00")],
      "calendar.house": [ev("Pat's birthday", "2026-10-26T19:00:00+00:00", "2026-10-27T01:00:00+00:00")] };
    const at = async function (when) { C.now = when; const hass = fakeHass(BASE_STATES()); hass.answer = route(cals); const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, hass); frame(); return card; };
    const rows = function (card) { return [...text(card, "lists").matchAll(/<h2>([^<]*)<\/h2>|<div class="when">([^<]*)<\/div><div class="what">([^<]*)</g)].map(function (m) { return m[1] ? "# " + m[1] : m[2] + " " + m[3]; }); };
    let card = await at(local(2026, 10, 27, 9, 0));                    // Tuesday morning
    card.dbg.open(person(card, "Alex"), true);
    eq(rows(card), ["# Today", "All day Trip", "until 01:00 Alex's birthday party", "until 06:00 Night shift", "22:00 Late shift",
      "# This week", "Tomorrow Trip", "Tomorrow until 06:00 Late shift", "Thu 29 Trip", "Thu 29 10:00 Dentist"], "a trip is on each of its days, and last night's shift reads until 06:00");
    eq(card.$("sum").textContent, "4 things today", "what carries on into today counts on the card");
    ok(/^Next: <b>22:00<\/b> Alex, Late shift/.test(text(card, "next")), "the Next line is tonight's shift, not last night's");
    eq(card.dbg.parties().map(function (p) { return p && p.label; }), [null, null], "a party that ran past midnight is not on again the next day");
    card.$("done").fire("click");
    card.dbg.open(person(card, "House"), true);
    ok(rows(card).indexOf("until 01:00 Pat's birthday") === 1, "the House card has the party until 01:00");
    done(card);
    card = await at(local(2026, 10, 27, 22, 30));
    eq(card.dbg.next() && card.dbg.next().what, "Dentist", "the next thing on is Thursday's dentist, not the second day of the trip");
    done(card);
    card = await at(local(2026, 10, 28, 21, 50));                       // Wednesday evening
    eq(card.dbg.duty(person(card, "Alex")), null, "the morning after a late shift is no walk out at the time it started");
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

  // A shared letter that has been read leaves the letter book, so a later per-person letter
  // whose bridge copy reads the same is not swallowed by it.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["input_text.family_letter"] = { state: "Alex: Shared note", last_changed: "2026-10-26T11:58:00Z" };
    st["input_text.letter_alex"] = { state: "", last_changed: "2026-10-26T10:00:00Z" };
    const hass = fakeHass(st);
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: "input_text.letter_alex" }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    card.$("done").fire("click");
    await flush();
    eq(sets(hass, "input_text.family_letter").length, 1, "reading the shared letter empties its helper");
    st["input_text.family_letter"] = { state: "", last_changed: "2026-10-26T12:00:05Z" };
    eq(card.dbg.book().live.length, 0, "and it leaves the letter book");
    st["input_text.letter_alex"] = { state: "|Shared note", last_changed: "2026-10-26T12:00:20Z" };
    await advance(45000);
    eq(card.dbg.LETTER.queue.map(function (l) { return [l.src, l.text]; }), [["input_text.letter_alex", "Shared note"]], "a later per-person letter with the same words is a new letter");
    // and the histories kept for ?dbg stay short however long the panel runs
    for (let i = 0; i < 30; i++) card.dbg.go("/wall-panel/v" + i);
    eq([card.dbg.nav().length, card.dbg.nav()[19].path], [20, "/wall-panel/v29"], "the views asked for keep the last 20");
    done(card);
  }

  // The card closing itself after a minute is not someone closing it: the letter stays on the
  // tag and in its helper, and the next open shows it again. Done, or a tap on the scrim, then
  // clears it. A tap inside the card (reading the School grid, say) starts the minute again.
  for (const own of [false, true]) {
    C.now = NOON;
    const st = BASE_STATES(), id = own ? "input_text.letter_alex" : "input_text.family_letter", what = own ? "a per-person letter" : "a shared letter";
    st[id] = { state: own ? "Parent 1|Coats on" : "Alex: Coats on", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const ppl = own ? PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: id }, p) : p; }) : PEOPLE;
    const card = await boot({ people: ppl, sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    await advance(30000);
    card.$("card").fire("pointerdown");
    await advance(30000);
    card.$("card").fire("keydown", { key: "PageDown" });
    await advance(59000);
    ok(card.$("scrim").classList.contains("open"), what + ": a tap or a key inside the card starts its minute again");
    await advance(1000);
    ok(!card.$("scrim").classList.contains("open"), what + ": the card closes itself a minute after the last tap");
    eq(sets(hass, id).length, 0, what + ": closing itself does not clear the letter");
    ok(alex.letter && !alex.letter.gone && alex.letter.text === "Coats on", what + ": and the badge stays on the tag");
    card.dbg.open(alex, true);
    ok(/Coats on/.test(text(card, "lists")), what + ": the next open shows it again");
    if (own) card.$("scrim").fire("pointerdown"); else card.$("done").fire("click");
    await flush();
    eq(sets(hass, id).map(function (c) { return c.data.value; }), [""], what + ": " + (own ? "a tap on the scrim" : "Done") + " then clears it");
    eq(alex.letter, null, what + ": and takes it off the tag");
    done(card);
  }
  // The card closing itself keeps a letter only while its helper still holds it. One read on a
  // panel while the card was up (Done there empties the helper) goes, with nothing written, and
  // does not come back; a newer letter in the shared helper is not this one read, so it stays.
  for (const [own, after, kept] of [[true, "", false], [false, "", false], [false, "Sky: Letter B", true]]) {
    C.now = NOON;
    const st = BASE_STATES(), id = own ? "input_text.letter_alex" : "input_text.family_letter";
    const what = (own ? "a per-person letter" : "a shared letter") + (after ? " with a newer one in its helper" : " read on a panel");
    st[id] = { state: own ? "Parent 1|Letter A" : "Alex: Letter A", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const ppl = own ? PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: id }, p) : p; }) : PEOPLE;
    const card = await boot({ people: ppl, sensors: { weather: "weather.home", letter: own ? null : id } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    st[id] = { state: after, last_changed: "2026-10-26T12:00:04Z" };
    await advance(61000);                              // the wall polls at 45 s, and the card closes itself at 60 s
    ok(!card.$("scrim").classList.contains("open"), what + ": the card closed itself");
    eq([!!alex.letter, card.dbg.book().live.length, sets(hass, id).length], [kept, 0, 0], what + ": " + (kept ? "the letter stays on the tag" : "the letter goes, and nothing is written"));
    await advance(45000);
    eq(!!alex.letter, kept, what + ": the next poll leaves it " + (kept ? "there" : "gone"));
    done(card);
  }
  // ── Keyboard and screen reader ───────────────────────────────────────────────
  // The popup is a dialog. Escape is Done: it closes the card and clears the letter, as Done does.
  {
    C.now = NOON;
    const st = BASE_STATES(), id = "input_text.letter_alex";
    st[id] = { state: "Parent 1|Coats on", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: id }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home" } }, hass);
    eq(["role", "aria-modal", "aria-labelledby"].map(function (a) { return card.$("card").getAttribute(a); }), ["dialog", "true", "who"], "the popup is a modal dialog named by its heading");
    eq([card.$("status").getAttribute("role"), card.$("world").getAttribute("role")], ["status", "img"], "the status line is spoken when it changes, and the canvas is one picture");
    eq([rule(card, "#done:focus"), rule(card, "#done:focus-visible")], ["outline: none;", "box-shadow: 0 0 0 3px #fff, 0 0 0 7px #1F5FBF;"],
      "Done's focus ring is the key buttons' ring, not the browser's blue one");
    eq(["tabindex", "role", "aria-label"].map(function (a) { return card.$("lists").getAttribute(a); }), ["0", "region", "Details"],
      "the card's lists take focus, so a keyboard can scroll a long card, and a reader names them");
    ok(/7px #1F5FBF/.test(rule(card, "#lists:focus-visible") || ""), "and show the key ring while they have it");
    ok(/visibility: hidden/.test(rule(card, "#scrim")) && /visibility: visible/.test(rule(card, "#scrim.open")),
      "the closed popup is hidden from Tab and from readers, not only see-through");
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    press(card, "Escape");
    await flush();
    ok(!card.$("scrim").classList.contains("open"), "Escape closes the card");
    eq(sets(hass, id).map(function (c) { return c.data.value; }), [""], "Escape clears the letter, as Done does");
    eq(alex.letter, null, "and takes it off the tag");
    press(card, "Escape");
    eq(sets(hass, id).length, 1, "Escape with no card up does nothing");
    // Got it replaces itself with the "cleared" line: focus moves to Done first, so Escape and Tab
    // still act on the dialog.
    st[id] = { state: "Parent 1|Hat too", last_changed: "2026-10-26T12:01:00Z" };
    await advance(45000);
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    const got = el("button"); got.className = "pgot";
    got.focus();                                       // Enter on Got it: the button has focus
    card.$("lists").fire("click", { target: got });
    ok(/cleared/.test(card.$("lists").swapped) && card.sr.activeElement === card.$("done"), "Got it hands focus to Done as it goes");
    press(card, "Escape");
    ok(!card.$("scrim").classList.contains("open"), "so Escape still closes the card");
    done(card);
  }
  // A button for each person, the School and each landmark with a view, named from the name tags
  // (today's count, a letter waiting), each opening what a tap on it opens. Done takes focus when a
  // card opens, and closing hands it back to the button that opened it.
  {
    C.now = NOON;
    const st = BASE_STATES();
    const hass = fakeHass(st);
    hass.answer = route({ "calendar.sky": [timed("Drama", DAY, "16:00"), timed("Swim", DAY, "17:00")], "calendar.house": [timed("Bins", DAY, "18:00")] });
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" }, view: { music: "/wall-panel/music" } }, hass);
    await advance(1600);
    frame();
    const sl = card.$("status"); let said = 0, words = sl.textContent;
    Object.defineProperty(sl, "textContent", { get: function () { return words; }, set: function (v) { said++; words = v; } });
    for (let i = 0; i < 5; i++) frame();
    eq(said, 0, "the status line is written only when its words change, so a reader does not hear it every second");
    eq(keyNames(card), ["Alex", "Sky, 2 things today", "House, 1 thing today", "School", "Music view"], "a key button for each person, the School and the music view, named like their tags");
    person(card, "Alex").letter = { text: "Coats on", from: "Sky" };
    frame();
    eq(keyNames(card)[0], "Alex, letter waiting", "a letter on the tag is in the button's name");
    const sky = key(card, "p:Sky");
    sky.focus();
    sky.fire("click");
    await advance(400);
    eq(card.$("scrim").classList.contains("open") && card.$("who").textContent, "Sky", "a person's button opens their card");
    ok(card.sr.activeElement === card.$("done"), "opening a card puts focus on Done");
    card.$("done").fire("click");
    ok(card.sr.activeElement === sky, "closing it hands focus back to the button that opened it");
    key(card, "school").fire("click");
    await advance(400);
    eq(card.$("scrim").classList.contains("open") && card.$("who").textContent, "School", "the School's button opens the School card");
    press(card, "Escape");
    key(card, "music").fire("click");
    await advance(400);
    eq(card.dbg.nav().map(function (n) { return n.path; }), ["/wall-panel/music"], "a landmark's button opens its view");
    const tap = function (name) { const b = person(card, name).tagBox; card.$("world").fire("pointerdown", { clientX: b[0] + b[2] / 2, clientY: b[1] + b[3] / 2 }); };
    card.sr.activeElement.blur();                     // a tap on the canvas takes focus off the button, as a browser does
    frame(); tap("House");
    await advance(400);
    ok(card.$("scrim").classList.contains("open") && card.sr.activeElement === card.$("done"), "a tap on the canvas opens with focus on Done too");
    card.$("done").fire("click");
    ok(card.sr.activeElement === null, "and closing lets go of focus, so it is not left on a hidden Done");
    done(card);
  }
  // The status tiles and the announcement banner are buttons that act on click (a tap, Enter or
  // Space), not on pointerdown, and the banner is a live region. Unavailable text passes AA.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["sensor.fridge"] = { state: "5.2", attributes: { unit_of_measurement: "°C" } };
    st["input_text.announcement"] = { state: "Tea's ready", last_changed: new RealDate(NOON - 5000).toISOString(), attributes: {} };
    const hass = fakeHass(st);
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" }, announcement: "input_text.announcement", announcement_crier: false,
      status_tiles: [{ entity: "sensor.fridge", label: "Fridge", icon: "flask" }, { entity: "sensor.gone", label: "Shed", icon: "thermometer" }] }, hass);
    const asked = [];
    card.dispatchEvent = function (e) { if (e.type === "hass-more-info") asked.push(e.detail.entityId); return true; };
    frame();
    ok(/^<button type="button" class="tile" data-i="0"/.test(text(card, "tiles")) && /<button type="button" class="tile na" data-i="1"/.test(text(card, "tiles")), "each status tile is a button");
    ok(/^<button type="button" class="ann">/.test(text(card, "announce")), "the announcement banner is a button");
    eq(card.$("announce").getAttribute("role"), "status", "the banner is a live region, so a new announcement is read out");
    const tile = { getAttribute: function () { return "0"; }, classList: { add: function () {}, remove: function () {} } }, on = { closest: function () { return tile; } };
    card.$("tiles").fire("pointerdown", { target: on });
    card.$("announce").fire("pointerdown");
    eq([card.dbg.extras().taps, asked, card.dbg.extras().hidden], [[], [], null], "a pointerdown alone does nothing: a tile and the banner act on click");
    card.$("tiles").fire("click", { target: on });
    eq([card.dbg.extras().taps, asked], [["sensor.fridge"], ["sensor.fridge"]], "a click on a tile opens Home Assistant's more-info for its entity");
    card.$("announce").fire("click");
    ok(card.dbg.extras().hidden && /^Tea's ready\|/.test(card.dbg.extras().hidden), "a click on the banner takes it down");
    const hex = function (r) { const m = (rule(card, r) || "").match(/(?:^|; |\n\s*)color: (#[0-9A-F]{6})/i); return m && m[1]; };
    const lum = function (h) { return [1, 3, 5].map(function (i) { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
      .reduce(function (t, c, i) { return t + c * [0.2126, 0.7152, 0.0722][i]; }, 0); };
    const contrast = function (a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const na = [".tile.na", ".tile.na .tl", ".dchip.na", ".ann.na"].map(function (r) { return [r, hex(r)]; });
    ok(na.every(function (x) { return x[1] && contrast(x[1], "#E2E2E6") >= 4.5; }), "unavailable text on its grey is at least 4.5:1 (" + na.map(function (x) { return x.join(" "); }).join(", ") + ")");
    ok(/ 13px\//.test(rule(card, ".tile .tl")), "a tile's label is 13 px");
    done(card);
  }
  // Narrow cards: under 1100 px the countdowns, due chips and banner are rows under the clock and
  // the tiles, and under 700 the tiles go under the clock too. A resize lays the HUD out again at
  // once and fits the chips again to the new width (they used to be fitted once a day).
  {
    C.now = NOON;
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" }, announcement: "input_text.announcement", due: "sensor.due" }, fakeHass(BASE_STATES()));
    frame();
    const wrap = card.sr.wrap, ro = ROS[ROS.length - 1];
    const at = function () { return [wrap.classList.contains("compact"), wrap.classList.contains("narrow"), card.$("dates").style.top || "", card.$("due").style.top || "", card.$("announce").style.top, card.$("corner").style.top || ""]; };
    eq(at(), [false, false, "", "", "124px", ""], "1280 wide: the HUD keeps its places");
    const fitted = card.$("dates").writes;
    wrap.clientWidth = 1024; ro.cb();
    const c = at();
    ok(c[0] && !c[1] && c[2] && c[3] && c[4] && c[4] !== "124px" && !c[5], "1024 wide: the countdowns, due chips and banner move to rows under the clock and tiles (" + c.join(", ") + ")");
    ok(card.$("dates").writes > fitted, "and the countdown chips are fitted again to the new width");
    wrap.clientWidth = 400; ro.cb();
    ok(at()[1] && at()[5], "400 wide: the corner (status and tiles) goes under the clock");
    wrap.clientWidth = 690; ro.cb();
    ok(at()[1], "690 wide too: between 640 and 700 four tiles ran into a long date");
    wrap.clientWidth = 1280; ro.cb();
    eq(at(), [false, false, "", "", "124px", ""], "back to 1280: the places come back");
    ok(/pointer-events: none/.test(rule(card, "#announce")) && /pointer-events: auto/.test(rule(card, ".ann")),
      "the banner's row lets a tap beside the banner through to the scene (on a narrow card that row is over the name tags)");
    done(card);
  }
  // A letter kept that way is back in the letter book: a panel's Done still takes it off the tag.
  {
    C.now = NOON;
    const st = BASE_STATES();
    st["input_text.letter_alex"] = { state: "Parent 1|Coats on", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const ppl = PEOPLE.map(function (p) { return p.name === "Alex" ? Object.assign({ letter: "input_text.letter_alex" }, p) : p; });
    const card = await boot({ people: ppl, sensors: { weather: "weather.home" } }, hass);
    await advance(1600);
    const alex = person(card, "Alex");
    alex.letter = card.dbg.LETTER.queue.shift();
    card.dbg.open(alex, true);
    await advance(60000);
    ok(!card.$("scrim").classList.contains("open") && alex.letter, "the card closed itself and the letter stayed");
    st["input_text.letter_alex"] = { state: "", last_changed: "2026-10-26T12:01:10Z" };
    await advance(45000);
    eq(alex.letter, null, "a letter kept by the auto-close and read on a panel comes off the tag");
    done(card);
  }

  // Reduced motion: the world runs every frame and the scene repaints at most every few
  // seconds; the preference is followed live and let go on stop; a tap aims at where a creature
  // was painted, not where the world has moved it since. Seaside, so a letter comes by airmail.
  {
    C.now = NOON;
    const heard = [];
    MQ = { matches: true, addEventListener: function (t, f) { heard.push(f); }, removeEventListener: function (t, f) { if (heard.indexOf(f) >= 0) heard.splice(heard.indexOf(f), 1); } };
    const st = BASE_STATES();
    st["input_text.family_letter"] = { state: "Alex: Rain later", last_changed: "2026-10-26T11:58:00Z" };
    const hass = fakeHass(st);
    const card = await boot({ people: PEOPLE, scene: "seaside", sensors: { weather: "weather.home", letter: "input_text.family_letter" } }, hass);
    await advance(1600);
    const g = card.$("world").getContext("2d");
    const painted = function () { const n = g.calls.setTransform || 0; frame(); return (g.calls.setTransform || 0) > n; };
    const drew = [];
    for (let i = 0; i < 30; i++) if (painted()) drew.push(i);
    ok(drew.length >= 2 && drew.every(function (f, i) { return !i || (f - drew[i - 1]) * 1100 >= 5000; }), "reduced motion: the scene repaints at most every five seconds (painted on frames " + drew.join(", ") + ")");
    ok(person(card, "Alex").letter && person(card, "Alex").letter.text === "Rain later", "reduced motion: the world runs between paints, so the airmail still delivers");
    MQ.matches = false; heard.forEach(function (f) { f(); });
    let all = 0;
    for (let i = 0; i < 5; i++) if (painted()) all++;
    eq(all, 5, "turning reduced motion off paints every frame again, without a reload");
    MQ.matches = true; heard.forEach(function (f) { f(); });
    painted();
    const a = person(card, "Sky"), was = [a.x, a.y];
    a.x += a.x < 640 ? 400 : -400;                    // the world moves on, unpainted
    card.$("world").fire("pointerdown", { clientX: was[0], clientY: was[1] - a.r * 0.9 });
    await advance(400);
    eq(card.$("scrim").classList.contains("open") && card.$("who").textContent, "Sky", "reduced motion: a tap on a creature hits where it was painted");
    card.disconnectedCallback();
    eq(heard.length, 0, "reduced motion: stop() lets go of the preference");
    done(card);
  }
  // Chrome 87's MediaQueryList has addListener, not addEventListener.
  {
    C.now = NOON;
    const heard = [];
    MQ = { matches: false, addListener: function (f) { heard.push(f); }, removeListener: function (f) { if (heard.indexOf(f) >= 0) heard.splice(heard.indexOf(f), 1); } };
    const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" } }, fakeHass(BASE_STATES()));
    eq(heard.length, 1, "reduced motion: on Chrome 87 the preference is followed through addListener");
    card.disconnectedCallback();
    eq(heard.length, 0, "and let go through removeListener");
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
  // stop() takes the work it started with it: the office fetch, whose six-second deadline it
  // cleared with the other timeouts, is aborted, and a calendar answer that lands afterwards is
  // not published into the stopped engine.
  {
    C.now = NOON;
    const hass = fakeHass(BASE_STATES());
    hass.answer = route({ "calendar.alex": HOLD });
    let signal = null;
    const realFetch = globalThis.fetch;
    globalThis.fetch = function (url, o) { signal = o.signal; return new Promise(function (ok, no) { signal.addEventListener("abort", function () { no(new Error("aborted")); }); }); };
    try {
      const card = await boot({ people: PEOPLE, sensors: { weather: "weather.home" }, officeUrl: "http://localhost/office" }, hass);
      await advance(1400);
      ok(signal && !signal.aborted && hass.held.length === 1, "the office poll and a calendar are both still out");
      const dbg = card.dbg;
      card.disconnectedCallback();
      eq(signal.aborted, true, "stop() aborts the office fetch");
      hass.held[0].ok([timed("After stop", DAY, "16:00")]);
      await flush();
      eq(dbg.next(), null, "a calendar answer that lands after stop() is not published");
      done(card);
    } finally { globalThis.fetch = realFetch; }
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
