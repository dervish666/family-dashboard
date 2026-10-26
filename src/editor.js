import { DEFAULTS, LOOK_TG, PALETTE, ACCESSORIES, SCENES, normalize, rgbHex, clone } from "./config.js";
import { CREATURES, CREATURE } from "./creatures/index.js";

// ── The visual editor ─────────────────────────────────────────────────────────
// <family-dashboard-card-editor>: the cast, each person's calendar, the optional sensors,
// the scene and the demo switch. It uses Home Assistant's own ha-form where the frontend
// has it and falls back to plain inputs where it does not. It writes only the keys a
// change touches, so YAML it does not know about (aliases, dates, sourceOwner) survives.
// The animals the editor offers: every creature in the registry marked editor: true.
const EDITOR_LOOKS = CREATURES.filter(function (c) { return c.editor; }).map(function (c) { return c.id; });
const ACCESSORY_LABELS = { glasses: "Glasses", phones: "Headphones", daisy: "Daisy", bee: "Bee (one person only)" };
const SENSOR_FIELDS = [
  ["weather", "weather", "Weather"],
  ["music", "media_player", "Music speaker (the meadow dances)"],
  ["letter", "input_text", "Letter helper (the postie)"],
  ["trips", "calendar", "Trips calendar (Holiday events become countdowns)"],
  ["printer", null, "3D printer sensor prefix (Bambu Lab)"],
  ["extra", "sensor", "School data (family_extra)"],
  ["timetable", "sensor", "School timetable"],
  ["kit", "sensor", "School kit"],
  ["lunch", "sensor", "School lunch"]
];
const LABELS = { name: "Name", role: "Role", look: "Animal", col: "Colour", calendar: "Calendar", accessories: "Accessories",
  school: "Goes to school", demo: "Demo cast (no Home Assistant data)", scene: "Scene", week: "Week template sensor (v1.0.0 setups)" };
SENSOR_FIELDS.forEach(function (f) { LABELS[f[0]] = f[2]; });

function hexRgb(h) { const v = parseInt(String(h).slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
function entityField(name, domain) {
  return domain ? { name: name, selector: { entity: { filter: { domain: domain } } } } : { name: name, selector: { text: {} } };
}
const TOP_SCHEMA = [{ type: "grid", name: "", schema: [
  { name: "scene", required: true, selector: { select: { mode: "dropdown", options: SCENES.map(function (s) { return { value: s.id, label: s.name }; }) } } },
  { name: "demo", selector: { boolean: {} } }] }];
const PERSON_SCHEMA = [
  { type: "grid", name: "", schema: [{ name: "name", required: true, selector: { text: {} } },
    { name: "role", required: true, selector: { select: { mode: "dropdown", options: [{ value: "adult", label: "Adult" }, { value: "kid", label: "Kid" }] } } }] },
  { type: "grid", name: "", schema: [
    { name: "look", required: true, selector: { select: { mode: "dropdown", options: EDITOR_LOOKS.map(function (l) { return { value: l, label: CREATURE[l].label }; }) } } },
    { name: "col", selector: { color_rgb: {} } }] },
  { name: "calendar", selector: { entity: { multiple: true, filter: { domain: "calendar" } } } },
  { name: "accessories", selector: { select: { multiple: true, mode: "list", options: ACCESSORIES.map(function (a) { return { value: a, label: ACCESSORY_LABELS[a] }; }) } } },
  { name: "school", selector: { boolean: {} } }
];
function sensorSchema(withWeek) {
  const s = SENSOR_FIELDS.map(function (f) { return entityField(f[0], f[1]); });
  return withWeek ? [entityField("week", "sensor")].concat(s) : s;
}
function flatFields(schema) {
  return [].concat.apply([], schema.map(function (f) { return f.type === "grid" ? flatFields(f.schema) : [f]; }));
}

// One form: ha-form when the frontend has it, else plain inputs for the same schema.
// onChange gets the whole data object, as ha-form's value-changed does.
function makeForm(schema, onChange) {
  if (customElements.get("ha-form")) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.computeLabel = function (s) { return LABELS[s.name] || s.name; };
    f.addEventListener("value-changed", function (e) { e.stopPropagation(); onChange(e.detail.value); });
    return { el: f, set: function (d) { f.data = d; }, hass: function (h) { f.hass = h; } };
  }
  const box = document.createElement("div"); box.className = "plain";
  let data = {}, hass = null;
  const inputs = flatFields(schema).map(function (s) {
    const sel = s.selector, row = document.createElement("label"), cap = document.createElement("span"), kind = Object.keys(sel)[0];
    cap.textContent = LABELS[s.name] || s.name; row.appendChild(cap);
    let get, put, el;
    if (kind === "boolean") {
      el = document.createElement("input"); el.type = "checkbox"; row.className = "check";
      get = function () { return el.checked; }; put = function (v) { el.checked = !!v; };
    } else if (kind === "select" && sel.select.multiple) {
      el = document.createElement("span");
      const boxes = sel.select.options.map(function (o) {
        const l = document.createElement("label"), c = document.createElement("input"); c.type = "checkbox"; c.value = o.value;
        l.appendChild(c); l.appendChild(document.createTextNode(" " + o.label)); el.appendChild(l); return c; });
      get = function () { return boxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); };
      put = function (v) { boxes.forEach(function (c) { c.checked = (v || []).indexOf(c.value) >= 0; }); };
    } else if (kind === "select") {
      el = document.createElement("select");
      sel.select.options.forEach(function (o) { const op = document.createElement("option"); op.value = o.value; op.textContent = o.label; el.appendChild(op); });
      get = function () { return el.value; }; put = function (v) { el.value = v == null ? "" : v; };
    } else if (kind === "color_rgb") {
      el = document.createElement("input"); el.type = "color";
      get = function () { return hexRgb(el.value); }; put = function (v) { el.value = Array.isArray(v) ? rgbHex(v) : "#888888"; };
    } else {
      el = document.createElement("input"); el.type = "text";
      const multi = kind === "entity" && sel.entity.multiple;
      if (kind === "entity") { el.placeholder = (sel.entity.filter.domain + ".") + (multi ? " (comma between several)" : ""); el.setAttribute("list", "fd-" + sel.entity.filter.domain); }
      get = function () { const v = el.value.trim(); return multi ? v.split(/\s*,\s*/).filter(Boolean) : v; };
      put = function (v) { el.value = Array.isArray(v) ? v.join(", ") : v == null ? "" : v; };
    }
    el.addEventListener("change", function () { const d = Object.assign({}, data); d[s.name] = get(); data = d; onChange(d); });
    row.appendChild(el); box.appendChild(row);
    return { put: function () { put(data[s.name]); }, domain: kind === "entity" && sel.entity.filter.domain };
  });
  function lists() {                                     // entity suggestions for the text inputs
    if (!hass) return;
    inputs.forEach(function (i) {
      if (!i.domain || box.querySelector("#fd-" + i.domain)) return;
      const dl = document.createElement("datalist"); dl.id = "fd-" + i.domain;
      Object.keys(hass.states).filter(function (id) { return id.indexOf(i.domain + ".") === 0; }).sort().forEach(function (id) {
        const o = document.createElement("option"); o.value = id; dl.appendChild(o); });
      box.appendChild(dl);
    });
  }
  return { el: box, set: function (d) { data = d || {}; inputs.forEach(function (i) { i.put(); }); },
    hass: function (h) { const first = !hass; hass = h; if (first) lists(); } };
}

const EDITOR_STYLE = `
  :host { display: block; }
  .sec { margin: 0 0 18px; }
  .sec > h3 { margin: 0 0 6px; font-size: 15px; font-weight: 500; }
  .hint { margin: 0 0 10px; color: var(--secondary-text-color); font-size: 13px; }
  .person { border: 1px solid var(--divider-color, #ddd); border-radius: 12px; padding: 10px 12px 12px; margin: 0 0 10px; }
  .phead { display: flex; align-items: center; gap: 6px; margin: 0 0 6px; }
  .phead b { flex: 1; font-weight: 500; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex: none; }
  button { font: inherit; font-size: 13px; padding: 4px 10px; border-radius: 16px; cursor: pointer;
    border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: var(--primary-text-color, #222); }
  button.add { color: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4); }
  button:disabled { opacity: .35; cursor: default; }
  .plain label { display: block; margin: 0 0 8px; }
  .plain label > span:first-child { display: block; font-size: 12px; color: var(--secondary-text-color, #666); }
  .plain label.check { display: flex; gap: 8px; align-items: center; flex-direction: row-reverse; justify-content: flex-end; }
  .plain label.check > span:first-child { font-size: 14px; color: inherit; }
  .plain input[type=text], .plain select { width: 100%; box-sizing: border-box; padding: 6px; font: inherit; }
  .plain span > label { display: inline-block; margin-right: 12px; }
`;

class FamilyDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._config = null; this._hass = null; this._forms = null; this.attachShadow({ mode: "open" }); }
  setConfig(config) { this._config = clone(config || {}); this._update(); }
  set hass(h) { this._hass = h; if (this._forms) this._forms.all.forEach(function (f) { f.hass(h); }); }
  _people() { return Array.isArray(this._config.people) && this._config.people.length ? this._config.people : clone(DEFAULTS.people); }
  _emit(cfg) {
    this._config = cfg; this._update();
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  // Rebuilds the DOM only when the cast changes size, so typing never loses focus.
  _update() {
    if (!this._config) return;
    // The v1.0.0 week sensor field shows for configs that read it: a cast with no calendars.
    const people = this._people(), withWeek = !!(this._config.sensors && this._config.sensors.week) ||
      (Array.isArray(this._config.people) && !this._config.people.some(function (p) { return p && (p.calendar || p.calendars); }));
    if (!this._forms || this._forms.n !== people.length || this._forms.week !== withWeek) this._build(people.length, withWeek);
    let eff = null; try { eff = normalize(this._config); } catch (e) { eff = null; }
    const sensors = eff ? eff.sensors : Object.assign({}, this._config.sensors);
    this._forms.top.set({ scene: this._config.scene || SCENES[0].id, demo: this._config.demo === true });
    this._forms.sensors.set(sensors);
    const self = this;
    people.forEach(function (p, i) {
      const cal = p.calendar != null ? p.calendar : p.calendars;
      self._forms.people[i].set({ name: p.name == null ? "" : String(p.name), role: p.adult || p.role === "adult" ? "adult" : "kid",
        look: EDITOR_LOOKS.indexOf(p.look) >= 0 ? p.look : p.look || "crow", col: hexRgb(/^#[0-9a-f]{6}$/i.test(p.col || "") ? p.col : PALETTE[i % PALETTE.length]),
        calendar: cal == null || cal === "" ? [] : [].concat(cal), accessories: ACCESSORIES.filter(function (a) { return p[a]; }), school: !!p.school });
      self._forms.heads[i].querySelector(".dot").style.background = /^#[0-9a-f]{6}$/i.test(p.col || "") ? p.col : PALETTE[i % PALETTE.length];
      self._forms.heads[i].querySelector("b").textContent = (p.name || "Unnamed") + (i === people.length - 1 && people.length > 1 ? " (household)" : "");
    });
  }
  _build(n, withWeek) {
    const self = this, sr = this.shadowRoot;
    sr.innerHTML = "<style>" + EDITOR_STYLE + "</style>";
    const F = { n: n, week: withWeek, people: [], heads: [], all: [] };
    function sec(title, hint) {
      const s = document.createElement("div"); s.className = "sec";
      s.innerHTML = "<h3>" + title + "</h3>" + (hint ? '<p class="hint">' + hint + "</p>" : ""); sr.appendChild(s); return s;
    }
    F.top = makeForm(TOP_SCHEMA, function (d) {
      const c = clone(self._config);
      if (d.demo) c.demo = true; else delete c.demo;
      if (d.scene && d.scene !== SCENES[0].id) c.scene = d.scene; else delete c.scene;
      self._emit(c);
    });
    sec("Scene", "Only the meadow for now. The demo cast runs on made-up data, so turn it off to see your calendars.").appendChild(F.top.el);
    const ps = sec("People", "One creature each. Give each person their calendar. The last one is the household: bin day and anything nobody owns.");
    for (let i = 0; i < n; i++) {
      const box = document.createElement("div"); box.className = "person";
      const head = document.createElement("div"); head.className = "phead";
      head.innerHTML = '<span class="dot"></span><b></b>';
      [["Up", -1], ["Down", 1]].forEach(function (b) {
        const bt = document.createElement("button"); bt.textContent = b[0]; bt.disabled = i + b[1] < 0 || i + b[1] >= n;
        bt.addEventListener("click", function () { self._move(i, b[1]); }); head.appendChild(bt); });
      const rm = document.createElement("button"); rm.textContent = "Remove"; rm.disabled = n < 2;
      rm.addEventListener("click", function () { self._remove(i); }); head.appendChild(rm);
      const f = makeForm(PERSON_SCHEMA, function (d) { self._person(i, d); });
      box.appendChild(head); box.appendChild(f.el); ps.appendChild(box);
      F.people.push(f); F.heads.push(head);
    }
    const add = document.createElement("button"); add.className = "add"; add.textContent = "Add person";
    add.addEventListener("click", function () { self._add(); }); ps.appendChild(add);
    F.sensors = makeForm(sensorSchema(withWeek), function (d) { self._sensors(d); });
    sec("Sensors", "All optional. Leave one empty and that part of the scene stays off. A sensor that is set but missing says unavailable on the cards.").appendChild(F.sensors.el);
    F.all = [F.top, F.sensors].concat(F.people);
    this._forms = F;
    if (this._hass) F.all.forEach(function (f) { f.hass(self._hass); });
  }
  _person(i, d) {
    const c = clone(this._config), people = clone(this._people()), p = people[i];
    if (d.name != null) p.name = d.name;
    if (d.role === "adult") p.adult = true; else delete p.adult;
    delete p.role;
    if (d.look && d.look !== p.look) { p.look = d.look; if (LOOK_TG[d.look]) p.tg = LOOK_TG[d.look]; else delete p.tg; }
    if (Array.isArray(d.col) && rgbHex(d.col) !== String(p.col || "").toLowerCase()) p.col = rgbHex(d.col);
    const cal = (d.calendar == null ? [] : [].concat(d.calendar)).filter(Boolean);
    delete p.calendars; if (!cal.length) delete p.calendar; else p.calendar = cal.length === 1 ? cal[0] : cal;
    const acc = d.accessories || [];
    ACCESSORIES.forEach(function (a) { if (acc.indexOf(a) >= 0) p[a] = true; else delete p[a]; });
    if (p.bee) people.forEach(function (q, k) { if (k !== i) delete q.bee; });
    if (d.school) p.school = true; else delete p.school;
    c.people = people; this._emit(c);
  }
  _add() {
    const c = clone(this._config), people = clone(this._people()), n = people.length;
    let k = n, name; do { name = "Person " + k++; } while (people.some(function (p) { return p.name === name; }));
    const look = EDITOR_LOOKS[n % 6];
    const p = { name: name, col: PALETTE[n % PALETTE.length], look: look, tg: LOOK_TG[look], adult: false };
    people.splice(Math.max(0, n - 1), 0, p);        // before the household
    c.people = people; this._emit(c);
  }
  _remove(i) { const c = clone(this._config), people = clone(this._people()); people.splice(i, 1); c.people = people; this._emit(c); }
  _move(i, d) {
    const c = clone(this._config), people = clone(this._people()), j = i + d;
    if (j < 0 || j >= people.length) return;
    const t = people[i]; people[i] = people[j]; people[j] = t; c.people = people; this._emit(c);
  }
  _sensors(d) {
    const c = clone(this._config), prev = (function () { try { return normalize(c).sensors; } catch (e) { return c.sensors || {}; } })();
    const s = Object.assign({}, c.sensors || {});
    Object.keys(d).forEach(function (k) {
      const v = d[k] === "" || d[k] == null ? null : d[k];
      if (v !== (prev[k] == null ? null : prev[k])) s[k] = v;
    });
    c.sensors = s; this._emit(c);
  }
}
if (!customElements.get("family-dashboard-card-editor")) customElements.define("family-dashboard-card-editor", FamilyDashboardCardEditor);

// Makes sure ha-form is defined before the editor picks a path. In the card editor dialog it
// usually is; if not, opening a built-in card's editor loads it. Gives up after 2 s and the
// editor uses plain inputs instead.
export function loadFormParts() {
  if (customElements.get("ha-form")) return Promise.resolve();
  const helpers = window.loadCardHelpers ? window.loadCardHelpers() : Promise.reject(new Error("no loadCardHelpers"));
  const load = helpers.then(function (h) { return h.createCardElement({ type: "entities", entities: [] }); })
    .then(function (c) { return c && c.constructor && c.constructor.getConfigElement ? c.constructor.getConfigElement() : null; })
    .then(function () { return customElements.whenDefined("ha-form"); })
    .catch(function (e) { console.warn("family-dashboard-card: ha-form not available, using plain inputs", e); });
  return Promise.race([load, new Promise(function (r) { setTimeout(r, 2000); })]);
}
