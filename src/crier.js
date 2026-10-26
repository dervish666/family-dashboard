// The town crier (v1.7.0): when the announcement entity changes to a new message, a crier
// walks out of a building in the scene, rings a handbell, unrolls a scroll with the message,
// holds it, rolls it up and walks off; the v1.6.0 banner then stays until the message ends.
// Pure functions, no DOM and no hass, so tests/check.mjs runs them as they are. The engine
// walks and draws the crier (engine.js, "The town crier"); each scene says where it comes out
// and where it stands (scenes/index.js, crier()).
//
//   normCrier(raw, announcement)   config: announcement_crier, _sound, _clear, _late -> options or null
//   parseAnnounce(state, now, names)  the message a state carries, or null
//   annStep(seen, state, now, opts)   one reading against what was seen before: wait | same | old | end | start
//   newCrier(a) / crierStep(C, dt, want)  the crier's own state machine: out ring unroll hold rollup home gone
//   holdFor(text)                  how long the scroll stays up
//   wrapWords / fitWords           the scroll's word wrap and font fit, with the measure passed in

import { parseAnnouncement } from "./extras.js";

export const CRIER_LATE = 1;                    // minutes: a message older than this when first seen gets only the banner
export const CRIER_TIMES = { ring: 1.4, unroll: 0.9, rollup: 0.45, say: 2.6 };
const CLEARABLE = ["input_text", "text"];

function err(msg) { return new Error("family-dashboard-card: " + msg); }
function flag(raw, k, dflt) {
  const v = raw[k];
  if (v == null || v === "") return dflt;
  if (typeof v !== "boolean") throw err(k + " must be true or false, got " + JSON.stringify(v));
  return v;
}

// ── Config ────────────────────────────────────────────────────────────────────
// Only read when announcement is set. announcement_crier defaults to true, the sound and the
// clear to false: a test tap never writes to Home Assistant unless the config says it may.
export function normCrier(raw, ann) {
  const keys = ["announcement_crier", "announcement_sound", "announcement_clear", "announcement_late"];
  if (!ann) return null;
  const on = flag(raw, keys[0], true), sound = flag(raw, keys[1], false), clear = flag(raw, keys[2], false);
  let late = raw[keys[3]];
  if (late == null || late === "") late = CRIER_LATE;
  else if (typeof late === "boolean" || !isFinite(+late) || +late < 0 || +late > 1440) throw err("announcement_late must be minutes from 0 to 1440, got " + JSON.stringify(late));
  if (clear && CLEARABLE.indexOf(ann.entity.split(".")[0]) < 0)
    throw err("announcement_clear can only empty an input_text or text entity, and " + ann.entity + " is neither");
  return { on: on, sound: sound, clear: clear, late: +late };
}

// ── Reading the entity ────────────────────────────────────────────────────────
// The message a state carries ({ text, from, mins, until, key, at }), or null when there is
// none: empty, unknown, unavailable, missing or run out. at is last_changed in ms (0 if absent).
export function parseAnnounce(state, now, names) {
  const a = state === undefined ? null : parseAnnouncement(state, now, names);
  if (!a || a.status !== "show") return null;
  const at = Date.parse(state.last_changed || state.last_updated || "");
  return { text: a.text, from: a.from, mins: a.mins, until: a.until, key: a.key, at: isFinite(at) ? at : 0 };
}
// One reading of the entity against what was seen before. seen starts as {} and is updated
// here. state: the hass state, null when the entity is missing, undefined before hass arrives.
// opts: { late (minutes), names }. act:
//   wait   no hass yet: nothing known, the first reading is still to come
//   same   nothing new (or the same words back after the entity was unavailable)
//   old    a reading older than one already seen
//   end    nothing to say: empty, unavailable, missing or run out
//   start  a new message, with late: true when it is older than opts.late minutes, so it gets
//          the banner only (the old wall page's "late": met already running, no walk)
export function annStep(seen, state, now, opts) {
  if (state === undefined) return { act: "wait" };
  const o = opts || {}, t = now instanceof Date ? now.getTime() : +now, first = !seen.started;
  seen.started = true;
  const raw = state ? parseAnnouncement(state, t, o.names) : { status: "unavailable" };
  if (raw.status === "unavailable") { seen.out = true; return { act: "end", why: "unavailable" }; }
  const a = parseAnnounce(state, t, o.names);
  if (!a) { seen.key = null; seen.text = null; seen.out = false; return { act: "end", why: raw.status }; }
  if (a.key === seen.key) return { act: "same", a: a };
  if (a.at && seen.at && a.at < seen.at) return { act: "old", a: a };
  const back = seen.out && seen.text === a.text;
  seen.key = a.key; seen.text = a.text; seen.at = a.at; seen.out = false;
  if (back) return { act: "same", a: a };
  const lateMs = (o.late == null ? CRIER_LATE : +o.late) * 60000;
  return { act: "start", a: a, first: first, late: !a.at || t - a.at > lateMs };
}

// ── The crier ─────────────────────────────────────────────────────────────────
// The scroll stays up long enough to read twice at a slow pace: 20 s for a few words, up to a
// minute for a paragraph.
export function holdFor(text) {
  const n = String(text || "").length;
  return Math.max(20, Math.min(60, Math.round(12 + n * 0.3)));
}
export function newCrier(a) {
  return { st: "out", key: a ? a.key : null, ann: null, done: null, t: 0, roll: 0, bell: 0, bellMax: 1, say: 0, rings: 0, arrived: false };
}
function ring(C, secs, shout) { C.bell = C.bellMax = secs; C.rings++; if (shout) C.say = CRIER_TIMES.say; }
// One step. want: the message the crier should be showing (from parseAnnounce, kept by the
// engine), or null when there is none any more (cleared, run out, tapped away, unavailable).
// C.arrived is set by the engine when the walk out (st "out") or home (st "home") is done.
// A message the crier has already read out (C.done) does not bring it back out; a different
// one does, whatever it is doing. Returns C.
export function crierStep(C, dt, want) {
  const w = want && want.key !== C.done ? want : null, T = CRIER_TIMES;
  C.bell = Math.max(0, C.bell - dt); C.say = Math.max(0, C.say - dt);
  if (C.roll > 0 && C.st !== "rollup" && (!w || !C.ann || w.key !== C.ann.key)) C.st = "rollup";   // taken down, run out or replaced
  if (C.st === "out") {
    if (w) C.key = w.key;
    if (!w) { C.st = "home"; C.arrived = false; }
    else if (C.arrived) { C.arrived = false; ring(C, T.ring, true); C.st = "ring"; C.t = T.ring; }
  } else if (C.st === "ring") {
    if (!w) { C.st = "home"; C.arrived = false; }
    else if ((C.t -= dt) <= 0) { C.ann = w; C.key = w.key; C.st = "unroll"; }
  } else if (C.st === "unroll") {
    if ((C.roll += dt / T.unroll) >= 1) { C.roll = 1; C.st = "hold"; C.t = C.hold = holdFor(C.ann.text); }
  } else if (C.st === "hold") {
    const half = C.t > C.hold / 2;
    if ((C.t -= dt) <= 0) { C.done = C.ann.key; C.st = "rollup"; }
    else if (half && C.t <= C.hold / 2) ring(C, 1, false);
  } else if (C.st === "rollup") {
    if ((C.roll -= dt / T.rollup) <= 0) {
      C.roll = 0; C.ann = null;
      const w2 = want && want.key !== C.done ? want : null;
      if (w2) { C.key = w2.key; ring(C, T.ring, true); C.st = "ring"; C.t = T.ring; } else { C.st = "home"; C.arrived = false; }
    }
  } else if (C.st === "home") {
    if (w) { C.key = w.key; C.st = "out"; C.arrived = false; }
    else if (C.arrived) C.st = "gone";
  }
  return C;
}
// While the crier is out for a message, it is the message: the banner waits until it is walking home.
export function crierShowing(C, key) {
  return !!C && C.key === key && C.done !== key && C.st !== "home" && C.st !== "gone";
}

// ── The scroll's words ────────────────────────────────────────────────────────
// Greedy word wrap; a word wider than the line is broken with a hyphen.
export function wrapWords(text, maxW, measure) {
  const words = String(text).split(/\s+/).filter(Boolean), lines = [];
  let cur = "";
  words.forEach(function (w) {
    while (w.length > 1 && measure(w) > maxW) {
      let k = w.length - 1;
      while (k > 1 && measure(w.slice(0, k) + "-") > maxW) k--;
      if (cur) { lines.push(cur); cur = ""; }
      lines.push(w.slice(0, k) + (w.charAt(k - 1) === "-" ? "" : "-")); w = w.slice(k);
    }
    const t = cur ? cur + " " + w : w;
    if (cur && measure(t) > maxW) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}
// The biggest size from big down to small, in 4px steps, whose lines fit maxH, unless one line
// fewer is to be had for at most 15% off the size ("Dinner's ready!" reads better as one line at
// 108 than as two at 112). At the smallest size whatever still overflows is cut with an ellipsis.
// measureAt(text, size) -> width. Returns { fs, lh, lines, cut }.
export function fitWords(text, maxW, maxH, big, small, measureAt) {
  let fs, lh, lines, best = null;
  const size = function (t) { return measureAt(t, fs); };
  for (fs = big; fs >= small; fs -= 4) {
    lh = Math.round(fs * 1.1); lines = wrapWords(text, maxW, size);
    if (lines.length * lh > maxH) continue;
    if (!best) best = { fs: fs, lh: lh, lines: lines, cut: false };
    else if (lines.length < best.lines.length) return fs >= best.fs * 0.85 ? { fs: fs, lh: lh, lines: lines, cut: false } : best;
    if (fs < best.fs * 0.85 || best.lines.length === 1) return best;
  }
  if (best) return best;
  fs = small; lh = Math.round(fs * 1.1); lines = wrapWords(text, maxW, size);
  const n = Math.max(1, Math.floor(maxH / lh));
  let tail = lines[n - 1] || "";
  while (tail.length > 1 && measureAt(tail + "…", fs) > maxW) tail = tail.slice(0, -1);
  lines = lines.slice(0, n - 1).concat([tail.replace(/[\s,.;:-]+$/, "") + "…"]);
  return { fs: fs, lh: lh, lines: lines, cut: true };
}
