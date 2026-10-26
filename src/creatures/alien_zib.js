// Zib, an alien for the space station: a small floater. A round onion of a body in the
// person's colour with paler spots, hovering a hand's width off the deck over its shadow, four
// short tentacles dangling under it, two little fins it paddles the air with, two big teal eyes
// and an antenna with a glowing bulb. It bobs all the time; moving, it leans in and its
// tentacles trail; now and then it does a happy boing, or its antenna twitches at something.
// Asleep it settles down onto its tentacles with the antenna drooped over.
import { rig, on, rimmed, shade, mix, phonesAcc, daisyAcc } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, bigEye, cheeks, smile } from "./alien.js";

var BULB = "#F4E26A";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.2, 2.7, 0.3), g = P.g, ad = !!o.adult, sz = ad ? 1.08 : 1;
  var col = /^#[0-9a-f]{6}$/i.test(o.col || "") ? o.col : "#D4A8F5", rim = shade(col, 0.58), grow = 1.6 * k;
  var cy = -1.25 * r, br = 0.62 * r * sz;
  function tent(x, len, curl) { var x1 = x + curl * 0.1 * r, y0 = cy + br * 0.6, y1 = y0 + len * r;
    var path = function () { g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x - curl * 0.12 * r, y0 + len * r * 0.4, x1 + curl * 0.14 * r, y1 - len * r * 0.3, x1, y1); };
    g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.13 * r + grow * 2; path(); g.stroke();
    g.strokeStyle = shade(col, 0.92); g.lineWidth = 0.13 * r; path(); g.stroke();
    g.strokeStyle = rim; g.lineWidth = 0.05 * r + grow * 1.5; g.beginPath(); g.arc(x1 - curl * 0.05 * r, y1, 0.05 * r, curl > 0 ? 3.6 : -0.5, curl > 0 ? 6.9 : 2.8); g.stroke(); }
  if (on("tentL")) tent(-0.34 * r, 0.62, -1);
  if (on("tentM")) { tent(-0.11 * r, 0.72, 1); tent(0.12 * r, 0.7, -1); }
  if (on("tentR")) tent(0.35 * r, 0.6, 1);
  // the fins, paddling either side
  [["earL", -1], ["earR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
    rimmed(g, rim, mix(col, "#ffffff", 0.2), grow, function (e) { g.beginPath(); g.moveTo(s * br * 0.9, cy - 0.12 * r);
      g.quadraticCurveTo(s * (br + 0.42 * r + e), cy - 0.42 * r - e, s * (br + 0.36 * r + e), cy + 0.06 * r);
      g.quadraticCurveTo(s * (br + 0.2 * r), cy + 0.18 * r + e, s * br * 0.9, cy + 0.12 * r); g.closePath(); g.fill(); }); });
  // the antenna and its bulb
  if (on("antenna")) { var ax = 0.14 * r, ay = cy - br - 0.5 * r;
    g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.06 * r + grow * 2; g.beginPath(); g.moveTo(0, cy - br + 0.04 * r); g.quadraticCurveTo(-0.12 * r, cy - br - 0.3 * r, ax, ay); g.stroke();
    g.strokeStyle = col; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(0, cy - br + 0.04 * r); g.quadraticCurveTo(-0.12 * r, cy - br - 0.3 * r, ax, ay); g.stroke();
    g.fillStyle = "rgba(244,226,106,.35)"; g.beginPath(); g.arc(ax, ay, 0.2 * r, 0, 7); g.fill();
    rimmed(g, "#B89A2A", BULB, grow, function (e) { g.beginPath(); g.arc(ax, ay, 0.11 * r + e, 0, 7); g.fill(); });
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(ax - 0.035 * r, ay - 0.035 * r, 0.035 * r, 0, 7); g.fill(); }
  if (on("body")) {
    var body = function (e) { g.beginPath(); g.moveTo(0, cy - br - e);
      g.bezierCurveTo(br * 0.7 + e, cy - br - e, br * 1.08 + e, cy - br * 0.35, br + e, cy + br * 0.2);
      g.bezierCurveTo(br * 0.92 + e, cy + br * 0.72 + e, br * 0.45, cy + br * 0.8 + e, 0, cy + br * 0.8 + e);
      g.bezierCurveTo(-br * 0.45, cy + br * 0.8 + e, -br * 0.92 - e, cy + br * 0.72 + e, -br - e, cy + br * 0.2);
      g.bezierCurveTo(-br * 1.08 - e, cy - br * 0.35, -br * 0.7 - e, cy - br - e, 0, cy - br - e); g.closePath(); g.fill(); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(-br * 0.35, cy - br * 0.45, br * 0.1, 0, cy, br * 1.2);
    gr.addColorStop(0, mix(col, "#ffffff", 0.45)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.84));
    g.fillStyle = gr; body(0);
    g.fillStyle = mix(col, "#ffffff", 0.4);
    [[0.62, -0.5, 0.09], [0.78, -0.2, 0.06], [-0.7, 0.1, 0.07], [0.5, 0.42, 0.06]].forEach(function (s) { g.beginPath(); g.arc(s[0] * br, cy + s[1] * br, s[2] * r, 0, 7); g.fill(); });
    if (!ad) cheeks(g, 0.04 * r, cy + 0.2 * r, 0.36 * r, 0.1 * r);
    smile(g, 0.04 * r, cy + 0.3 * r, 0.09 * r, r * 0.05);
    if (o.phones) phonesAcc(g, 0, cy, br * 1.02, "#A3B0F2");
    if (o.daisy) daisyAcc(g, -0.25 * r, cy + 0.12 * r, br * 0.95, k);
  }
  if (on("eyes")) { var es = 0.19 * r * (ad ? 0.9 : 1);
    bigEye(g, -0.2 * r, cy - 0.1 * r, es, eyes, ad, "#2E9C9A"); bigEye(g, 0.24 * r, cy - 0.1 * r, es, eyes, ad, "#2E9C9A");
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#4A4560"; g.lineWidth = r * 0.03;
      [-0.2, 0.24].forEach(function (x) { g.beginPath(); g.arc(x * r, cy - 0.1 * r, es * 1.5, 0, 7); g.stroke(); }); } }
  // a tentacle curled up to wave
  if (rig.part === "paw") { var px = br + 0.05 * r, py = cy + 0.1 * r;
    g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.13 * r + grow * 2; g.beginPath(); g.moveTo(br * 0.8, py + 0.1 * r); g.quadraticCurveTo(px + 0.3 * r, py, px + 0.2 * r, py - 0.4 * r); g.stroke();
    g.strokeStyle = shade(col, 0.92); g.lineWidth = 0.13 * r; g.beginPath(); g.moveTo(br * 0.8, py + 0.1 * r); g.quadraticCurveTo(px + 0.3 * r, py, px + 0.2 * r, py - 0.4 * r); g.stroke(); }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}

export default {
  id: "alien_zib", label: "Zib (alien)", tg: 2.55, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["tentL", "tentM", "tentR", "earL", "earR", "antenna", "body", "paw", "eyes"], eyesIn: "eyes",
    piv: { tentL: [-0.34, -0.88], tentM: [0, -0.88], tentR: [0.35, -0.88], earL: [-0.56, -1.3], earR: [0.56, -1.3], antenna: [0, -1.86], body: [0, -1.25], paw: [0.6, -1.1], eyes: [0, -1.25] } },
  hat: [0.04, -2.0, 0.1],
  timers: ["boing", "zap", "zfin"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var bo = M.spike(t.boing, 0.8);
    var y = aw * (-0.06 * (0.5 + 0.5 * Math.sin(time * 2.4)) - 0.05 * M.air - 0.45 * bo) + sl * (0.36 + 0.015 * Math.sin(time * 1.5));
    var lean = aw * 0.13 * M.g;
    var drop = 0.37 * lean;                                                   // a piece below the body's centre swings back as it leans
    if (p === "body" || p === "eyes") return [lean, 0, y];
    if (p === "tentL" || p === "tentM" || p === "tentR") { var o = p === "tentL" ? 0 : p === "tentM" ? 1.3 : 2.6, s = p === "tentL" ? -1 : p === "tentR" ? 1 : 0;
      return [aw * (0.16 * Math.sin(time * 2.4 + o) * M.idle + 0.5 * M.g + 0.12 * Math.sin(M.ph * 2 + o) * M.g + s * 0.5 * bo) + sl * s * 0.7, -drop, y - 0.04 * sl]; }
    if (p === "earL" || p === "earR") { var f = p === "earL" ? -1 : 1, fl = Math.sin(time * (5 + 11 * M.g)) * (0.22 + 0.25 * M.g) + 0.6 * M.spike(t.zfin, 0.5);
      return [aw * f * fl - sl * f * 0.35, 0, y]; }
    if (p === "antenna") return [lean + aw * (0.16 * Math.sin(time * 1.6) * M.idle - 0.3 * M.g + 0.35 * Math.sin(time * 30) * M.spike(t.zap, 0.6)) + sl * 1.0, 0.6 * lean, y];
    if (p === "paw") { var w = pawWave(M); return [w[0] * 0.8, 0, y]; }
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (still && !(t.boing > 0) && R() < dt * 0.04) { t.boing = 0.8; t.happy = 0.8; t.wait = Math.max(t.wait, 1); }
    if (!(t.zap > 0) && R() < dt * 0.08) t.zap = 0.6;
    if (!(t.zfin > 0) && R() < dt * 0.1) t.zfin = 0.5;
  }
};
