import { VERSION } from "./version.js";
import { normalize, stubConfig } from "./config.js";
import { loadFormParts } from "./editor.js";
import { engine } from "./engine/engine.js";

const BASE = new URL("./", import.meta.url).href;   // HACS serves this under /hacsfiles/family-dashboard/

const STYLE = `
:host { display: block; }
.fd {
  --ink: #26352C; --ink-soft: #56675C; --paper: #F4F9F2; --paper-2: #E7F1E4;
  --scrim: rgba(22, 40, 30, .42); --warn: #A8431F; --hud: #26352C; --hud-soft: #4C6152;
}
.fd.night {
  --ink: #E6EEF2; --ink-soft: #A9B8C4; --paper: #1D2A3A; --paper-2: #26364A;
  --scrim: rgba(6, 10, 22, .55); --warn: #FFB08A; --hud: #EAF1F6; --hud-soft: #B3C2CF;
}
.fd.darksky { --hud: #EAF1F6; --hud-soft: #B3C2CF; }
.fd.darksky #status { color: #FFB08A; }
.fd { position: relative; width: 100%; height: 100%; overflow: hidden; background: #A6D9A8;
  font-family: Fredoka, "Instrument Sans", Roboto, sans-serif; color: var(--ink);
  -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
canvas#world { display: block; position: absolute; left: 0; top: 0; touch-action: none; }

#hud { position: absolute; left: 40px; top: 22px; pointer-events: none; color: var(--hud); }
#clock { font-size: 88px; font-weight: 600; line-height: 1; letter-spacing: -.02em; }
#date { font-size: 26px; font-weight: 500; margin-top: 4px; }
#next { font-size: 22px; margin-top: 8px; color: var(--hud-soft); }
#clock .temp { font-size: 34px; font-weight: 500; margin-left: 16px; vertical-align: 40px; color: var(--hud-soft); }
#next b { font-weight: 600; color: var(--hud); }
#corner { position: absolute; right: 36px; top: 30px; text-align: right; pointer-events: none;
  font-size: 19px; color: var(--hud-soft); }
#status { color: var(--warn); font-weight: 500; margin-top: 6px; }

/* Countdowns: a row of tags in the sky between the clock and the corner hint, the
   same white pill with a coloured rim and a number badge as the name tags on the
   canvas, so "Kid 2 31" reads the same way "Parent 2 3" does. Fixed colours, not the
   HUD variables: the pills stay white at night like the tags do. */
#dates { position: absolute; left: 390px; right: 340px; top: 32px; height: 40px; display: flex;
  align-items: flex-start; overflow: hidden; pointer-events: none; }
.dchip { flex: none; display: flex; align-items: center; height: 36px; margin-right: 12px;
  padding: 0 5px 0 10px; border-radius: 999px; box-sizing: border-box;
  background: rgba(255, 255, 255, .95); border: 2.5px solid #999;
  font: 600 18px Fredoka, sans-serif; color: #26352C; white-space: nowrap; }
.dchip:last-child { margin-right: 0; }
.dchip .dic { width: 22px; height: 22px; margin-right: 7px; flex: none; }
.dchip .dn { margin-left: 8px; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px;
  color: #fff; font-size: 15px; line-height: 24px; text-align: center; box-sizing: border-box; }
.dchip.now { animation: dbob 1.4s ease-in-out infinite; }
@keyframes dbob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

/* v1.6.0, only on the page when configured: due-time chips under the countdowns, the
   announcement banner under those, and status tiles under the corner hint. Grey and dashed
   when the entity cannot be read, like the old "no reading" tag. */
#due { position: absolute; left: 390px; right: 340px; top: 80px; height: 40px; display: flex;
  align-items: flex-start; overflow: hidden; pointer-events: none; }
.dchip.na { background: rgba(226, 226, 230, .95); border: 2.5px dashed #8A8A94; color: #6E6E78; padding-right: 12px; }
#announce { position: absolute; left: 390px; right: 340px; top: 80px; display: flex; justify-content: center; }
.ann { display: flex; align-items: center; max-width: 100%; box-sizing: border-box; padding: 10px 22px 11px 14px;
  border-radius: 20px; background: #FFF8EE; border: 2.5px solid #D9C6A5;
  color: #26352C; animation: annin .5s cubic-bezier(.2, 1.3, .4, 1); cursor: pointer; }
.ann .dic { width: 34px; height: 34px; flex: none; margin-right: 12px; animation: ring 1.1s ease-in-out 3; transform-origin: 50% 8%; }
.ann .ab { min-width: 0; }
.ann .at { font: 600 14px Fredoka, sans-serif; color: #B5583A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ann .ax { font: 600 24px/1.18 Fredoka, sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ann.na { background: rgba(226, 226, 230, .95); border: 2.5px dashed #8A8A94; color: #6E6E78; padding: 6px 16px 6px 10px; cursor: default; animation: none; }
.ann.na .dic { width: 22px; height: 22px; margin-right: 8px; animation: none; opacity: .6; }
.ann.na .ax { font-size: 16px; }
@keyframes annin { from { transform: translateY(-14px) scale(.94); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ring { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(16deg); } 45% { transform: rotate(-14deg); } 70% { transform: rotate(8deg); } }
#tiles { display: flex; justify-content: flex-end; margin-top: 10px; pointer-events: auto; }
.tile { width: 70px; margin-left: 7px; box-sizing: border-box; padding: 6px 3px 5px; border-radius: 16px; text-align: center;
  background: rgba(255, 255, 255, .95); border: 2.5px solid #999; color: #26352C; cursor: pointer; transition: transform .15s; }
.tile svg { display: block; margin: 0 auto 1px; }
.tile .tv { font: 600 15px/18px Fredoka, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile .tl { font: 500 11px/14px Fredoka, sans-serif; color: #56675C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile.na { background: rgba(226, 226, 230, .95); border-style: dashed; color: #6E6E78; }
.tile.na .tv { font-size: 11px; }
.tile.tap { transform: scale(.93); }
.soft.late { color: var(--warn); }

#scrim { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: var(--scrim);
  display: flex; align-items: center; justify-content: center; opacity: 0;
  pointer-events: none; transition: opacity .22s ease-out; }
#scrim.open { opacity: 1; pointer-events: auto; }
#card { width: 1080px; max-width: calc(100% - 48px); height: 660px; max-height: calc(100% - 48px);
  background: var(--paper); border-radius: 32px; display: flex; overflow: hidden;
  box-shadow: 0 24px 60px rgba(20, 44, 30, .35);
  transform: translateY(24px) scale(.96); transition: transform .32s cubic-bezier(.2, 1.3, .4, 1); }
#scrim.open #card { transform: none; }
#face { width: 320px; flex: none; display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px 28px; box-sizing: border-box; }
#portrait { width: 240px; height: 240px; }
#who { font-size: 52px; font-weight: 600; margin: 10px 0 0; line-height: 1.05; color: #26352C; }
#sum { font-size: 22px; margin: 8px 0 0; color: #3E5146; text-align: center; }
#done { margin-top: auto; font: 600 24px Fredoka, sans-serif; color: #26352C;
  background: rgba(255, 255, 255, .78); border: 0; border-radius: 999px; padding: 16px 48px; }
#done:active { transform: scale(.97); }
#lists { flex: 1; overflow-y: auto; padding: 36px 44px 32px 40px; -webkit-overflow-scrolling: touch; }
#lists h2 { font-size: 20px; font-weight: 600; color: var(--ink-soft); margin: 26px 0 10px; }
#lists h2:first-child { margin-top: 0; }
.row { display: flex; align-items: baseline; padding: 7px 0; font-size: 24px; line-height: 1.25; }
.when { flex: none; width: 150px; color: var(--ink-soft); font-size: 20px; font-weight: 500; }
.what { flex: 1; }
.chip { display: inline-block; font-size: 15px; font-weight: 600; border-radius: 999px;
  padding: 3px 10px; margin-right: 10px; vertical-align: 3px; background: var(--paper-2); color: var(--ink-soft); }
.empty { font-size: 24px; color: var(--ink-soft); padding: 4px 0 2px; }
.foot { font-size: 16px; color: var(--ink-soft); margin-top: 30px; }
.soft { color: var(--ink-soft); font-size: .8em; margin-left: 6px; }
.lesson { font-size: 27px; font-weight: 500; }
.tt { width: 100%; border-collapse: separate; border-spacing: 4px; }
.tt th { font-size: 15px; font-weight: 600; color: var(--ink-soft); text-align: left; padding: 2px 6px; }
.tt td { font-size: 16px; line-height: 1.2; padding: 6px 8px; border-radius: 10px; background: var(--paper-2); vertical-align: top; }
.tt td small { display: block; font-size: 12px; color: var(--ink-soft); }
.tt td.now, .tt th.now { background: #F3E3A2; color: #26352C; }
.tt td.now small { color: #56675C; }
.tt th small { display: block; font-size: 12px; font-weight: 500; }
.tt td.next, .tt th.next { box-shadow: inset 0 0 0 2px #E2C25A; }
.tt td.off { background: transparent; color: var(--ink-soft); }
.tt .ln { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tt .ln b { font-weight: 600; color: var(--ink-soft); font-size: 12px; margin-right: 2px; }
.tt.lanes { table-layout: fixed; }
.tt.lanes td { font-size: 14px; }
.tt.lanes th.who { width: 112px; font-size: 16px; color: var(--ink); }
.tt.lanes .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
.wk { margin: 12px 0 2px; }
.wk > summary { font-size: 18px; font-weight: 600; color: var(--ink-soft); padding: 8px 0; cursor: pointer; outline: none; }
.dish { padding: 1px 0 3px; }
.dish > .soft:first-child { margin-left: 0; margin-right: 4px; }
.alg { display: inline-block; font-size: 13px; font-weight: 600; border-radius: 999px; padding: 1px 8px; margin-left: 4px;
  vertical-align: 2px; background: #F8DCCB; color: #7A3412; }
.chip.choice { background: #D7EBD3; color: #2D5737; }
.chip.pick { background: #F3E3A2; color: #26352C; }
#next { transition: opacity .6s; }
.foot .bad { color: var(--warn); }

/* v1.9.0: a letter waiting on someone's card. Airmail stripes round a sheet of paper that stays
   cream at night, an envelope that wiggles now and then, the text large, and Got it. */
.post { padding: 7px; border-radius: 22px; box-shadow: 0 6px 18px rgba(120, 60, 30, .2);
  background: repeating-linear-gradient(135deg, #D9433A 0 14px, #FFF8EE 14px 24px, #3F6FB5 24px 38px, #FFF8EE 38px 48px);
  animation: pin .6s cubic-bezier(.2, 1.3, .4, 1); }
.post .pin { background: #FFF8EE; border-radius: 16px; padding: 18px 24px 20px; color: #26352C; }
.ph { display: flex; align-items: center; }
.pe { flex: none; margin-right: 16px; transform-origin: 50% 85%; animation: pwig 3.2s ease-in-out infinite; }
.pk { font-size: 15px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: #B5583A; }
.pf { font-size: 22px; font-weight: 500; color: #3E5146; margin-top: 2px; }
.pf b { font-weight: 600; color: #26352C; }
.pt { font-size: 17px; color: #7A6A58; margin-left: 6px; }
.px { font-size: 34px; font-weight: 500; line-height: 1.25; margin: 14px 0 18px; overflow-wrap: break-word; }
.px.long { font-size: 26px; }
.pg { display: flex; align-items: center; flex-wrap: wrap; }
.pgot { font: 600 22px Fredoka, sans-serif; color: #fff; background: #C9503F; border: 0; border-radius: 999px;
  padding: 12px 36px; margin-right: 16px; cursor: pointer; box-shadow: 0 3px 0 #9E3F36; }
.pgot:active { transform: translateY(2px); box-shadow: 0 1px 0 #9E3F36; }
.pg span { font-size: 16px; color: #7A6A58; padding: 6px 0; }
.post.done { padding: 10px 16px; background: var(--paper-2); box-shadow: none; animation: none; font-size: 18px; color: var(--ink-soft); }
@keyframes pwig { 0%, 72%, 100% { transform: rotate(0); } 78% { transform: rotate(-10deg); } 86% { transform: rotate(8deg); } 93% { transform: rotate(-4deg); } }
@keyframes pin { from { transform: translateY(-10px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
/* When the post goes, by the postbox (or under the corner hint): a pill like the name tags. */
#posthint { display: flex; align-items: center; height: 34px; padding: 0 13px 0 8px; border-radius: 999px; box-sizing: border-box;
  background: rgba(255, 255, 255, .96); border: 2.5px solid #D9433A; font: 600 17px Fredoka, sans-serif; color: #26352C;
  white-space: nowrap; pointer-events: none; }
#posthint svg { flex: none; margin-right: 7px; }
#posthint.at { position: absolute; transform: translate(-50%, -100%); margin-top: -10px; }
#posthint.at::after { content: ""; position: absolute; left: 50%; bottom: -9px; margin-left: -7px;
  border: 7px solid transparent; border-top-color: #D9433A; border-bottom: 0; }
#posthint.corner { display: inline-flex; margin-top: 8px; }
/* A card narrower than a tablet (a phone): the face becomes a header row over the lists. */
.fd.narrow #card { flex-direction: column; border-radius: 24px; max-width: calc(100% - 20px); max-height: calc(100% - 20px); }
.fd.narrow #face { width: auto; display: grid; grid-template-columns: 60px 1fr auto; column-gap: 12px; align-items: center; padding: 10px 14px; }
.fd.narrow #portrait { width: 60px; height: 60px; grid-row: 1 / 3; }
.fd.narrow #who { font-size: 26px; margin: 0; grid-column: 2; align-self: end; }
.fd.narrow #sum { font-size: 15px; margin: 0; text-align: left; grid-column: 2; align-self: start; }
.fd.narrow #done { margin: 0; padding: 10px 20px; font-size: 18px; grid-column: 3; grid-row: 1 / 3; }
.fd.narrow #lists { padding: 16px 16px 20px; }
.fd.narrow #lists h2 { font-size: 17px; margin: 20px 0 6px; }
.fd.narrow .row { font-size: 19px; }
.fd.narrow .when { width: 76px; font-size: 15px; }
.fd.narrow .post .pin { padding: 14px 16px 16px; }
.fd.narrow .pe { width: 42px; height: 32px; margin-right: 12px; }
.fd.narrow .pf { font-size: 18px; }
.fd.narrow .px { font-size: 26px; }
.fd.narrow .px.long { font-size: 21px; }
.fd.narrow .pgot { font-size: 20px; padding: 10px 28px; }
@media (prefers-reduced-motion: reduce) { #card, #scrim { transition: none; } .dchip.now, .ann, .ann .dic, .post, .pe { animation: none; } }
`;

const MARKUP = `<div class="fd">
<canvas id="world"></canvas>
<div id="hud"><div id="clock">--:--</div><div id="date"></div><div id="next"></div></div>
<div id="dates"></div>
<div id="corner"><div>Tap someone to see their week</div><div id="status"></div></div>
<div id="scrim"><section id="card">
  <div id="face"><canvas id="portrait" width="480" height="480"></canvas>
    <h1 id="who"></h1><p id="sum"></p><button id="done">Done</button></div>
  <div id="lists"></div>
</section></div>
</div>`;

// @font-face does not work inside a shadow root, so the face goes on the page, once.
function addFont() {
  if (document.getElementById("family-dashboard-font")) return;
  const s = document.createElement("style");
  s.id = "family-dashboard-font";
  s.textContent = '@font-face { font-family: Fredoka; src: url("' + BASE + 'fonts/Fredoka.woff2") format("woff2"); font-weight: 400 600; font-display: block; }';
  document.head.appendChild(s);
}

// ── The card ──────────────────────────────────────────────────────────────────
class FamilyDashboardCard extends HTMLElement {
  constructor() {
    super();
    this._config = null; this._hass = null; this._m = null;
    this.attachShadow({ mode: "open" });
  }
  static getStubConfig(hass) { return stubConfig(hass); }
  static getConfigElement() { return loadFormParts().then(function () { return document.createElement("family-dashboard-card-editor"); }); }
  setConfig(config) {
    this._cfg = normalize(config);           // throws a readable error, which Home Assistant shows on the card
    this._config = config;
    this._stop(); this._run();
  }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._run();
  }
  get hass() { return this._hass; }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: 12 }; }
  connectedCallback() { this._run(); }
  disconnectedCallback() { this._stop(); }
  _stop() {
    if (this._m) { this._m.stop(); this._m = null; }
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }
  // Starts once the card is on the page, has a config, has hass (or is a demo) and has a size.
  _run() {
    if (this._m || !this._config || !this.isConnected) return;
    const cfg = this._cfg;
    if (!cfg.demo && !this._hass) return;
    addFont();
    const sr = this.shadowRoot;
    sr.innerHTML = "<style>" + STYLE + "</style>" + MARKUP;
    const wrap = sr.querySelector(".fd");
    wrap.style.height = cfg.height || "calc(100vh - var(--header-height, 56px))";
    const self = this;
    const bridge = {
      hass: function () { return self._hass; },
      navigate: function (path) {
        if (!self._hass) { console.warn("meadow: no Home Assistant here, would open " + path); return false; }
        if (location.pathname === path) return true;
        history.pushState(null, "", path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
        return true;
      },
      // A status tile's tap: Home Assistant's own more-info dialog (history included) for that entity.
      moreInfo: function (entityId) {
        self.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: entityId } }));
      }
    };
    const go = function () {
      if (self._m || !self.isConnected) return;
      self._m = engine(sr, wrap, cfg, cfg.query || "", bridge);
    };
    this._ro = new ResizeObserver(function () {
      if (!wrap.clientWidth || !wrap.clientHeight) return;
      if (self._m) self._m.resize(); else go();
    });
    this._ro.observe(wrap);
  }
}

if (!customElements.get("family-dashboard-card")) customElements.define("family-dashboard-card", FamilyDashboardCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(function (c) { return c.type === "family-dashboard-card"; }))
  window.customCards.push({
    type: "family-dashboard-card",
    name: "Family Dashboard",
    description: "An animated village where each person in the household is a creature. Tap one for their week.",
    preview: false,
    documentationURL: "https://github.com/dervish666/family-dashboard"
  });
console.info("family-dashboard-card " + VERSION);

