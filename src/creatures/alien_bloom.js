// Bloom, an alien for the space station: a walking plant. A plump green seed of a body with a
// paler front, two broad leaves for arms, little root feet, two big eyes, and on top a flower
// whose petals are the person's colour. Walking, its leaves flap and the flower nods along;
// standing, the flower sways, and now and then it gives its leaves a shake and scatters a
// little pollen. Asleep the flower droops shut over its face and the leaves fold in.
import { rig, on, rimmed, shade, mix, phonesAcc, daisyAcc } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, bigEye, cheeks, smile, ownCol } from "./alien.js";

var SKIN = "#8CCB7E", ROOT = "#A8805A";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.4, 2.9, 0.3), g = P.g, ad = !!o.adult, hy = ad ? 1.1 : 1;
  var col = SKIN, petal = ownCol(o, "#E77FB5"), rim = shade(col, 0.56), grow = 1.6 * k;
  var cy = -0.82 * r * hy, bw = 0.78 * r, bh = 0.78 * r * hy;
  // root feet
  [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
    g.lineCap = "round"; g.strokeStyle = shade(ROOT, 0.65); g.lineWidth = 0.1 * r + grow * 2;
    var roots = function () { g.beginPath(); [-0.12, 0, 0.12].forEach(function (d) { g.moveTo(s * 0.32 * r, -0.16 * r); g.quadraticCurveTo(s * (0.32 + d) * r, -0.05 * r, s * (0.32 + d * 2.2) * r, 0); }); };
    roots(); g.stroke(); g.strokeStyle = ROOT; g.lineWidth = 0.1 * r; roots(); g.stroke(); });
  // the leaves, at the sides
  [["leafL", -1], ["leafR", 1]].forEach(function (l) { if (!on(l[0])) return; var s = l[1];
    rimmed(g, rim, mix(col, "#2E7A4A", 0.25), grow, function (e) { g.beginPath(); g.moveTo(s * 0.6 * r, cy - 0.05 * r);
      g.quadraticCurveTo(s * (1.1 * r + e), cy - 0.5 * r - e, s * (1.36 * r + e), cy - 0.08 * r);
      g.quadraticCurveTo(s * (1.05 * r), cy + 0.3 * r + e, s * 0.6 * r, cy + 0.12 * r); g.closePath(); g.fill(); });
    g.strokeStyle = mix(col, "#ffffff", 0.35); g.lineWidth = 0.03 * r; g.beginPath(); g.moveTo(s * 0.66 * r, cy + 0.02 * r); g.quadraticCurveTo(s * 1.0 * r, cy - 0.16 * r, s * 1.28 * r, cy - 0.08 * r); g.stroke(); });
  if (on("body")) {
    var body = function (e) { g.beginPath(); g.moveTo(0, cy - bh - e);
      g.bezierCurveTo(bw * 0.75 + e, cy - bh - e, bw + e, cy - bh * 0.3, bw * 0.92 + e, cy + bh * 0.45);
      g.bezierCurveTo(bw * 0.8 + e, cy + bh * 0.95 + e, -bw * 0.8 - e, cy + bh * 0.95 + e, -bw * 0.92 - e, cy + bh * 0.45);
      g.bezierCurveTo(-bw - e, cy - bh * 0.3, -bw * 0.75 - e, cy - bh - e, 0, cy - bh - e); g.closePath(); g.fill(); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(-bw * 0.35, cy - bh * 0.5, bw * 0.1, 0, cy, bw * 1.25);
    gr.addColorStop(0, mix(col, "#ffffff", 0.45)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.82));
    g.fillStyle = gr; body(0);
    g.fillStyle = mix(col, "#FFF6D8", 0.6); g.beginPath(); g.ellipse(0, cy + bh * 0.35, bw * 0.52, bh * 0.45, 0, 0, 7); g.fill();
    g.strokeStyle = shade(col, 0.8); g.lineWidth = 0.03 * r; g.lineCap = "round";                          // seed lines
    [-0.5, 0.5].forEach(function (x) { g.beginPath(); g.moveTo(x * bw, cy - bh * 0.6); g.quadraticCurveTo(x * bw * 1.25, cy, x * bw * 0.9, cy + bh * 0.6); g.stroke(); });
    if (!ad) cheeks(g, 0.03 * r, cy + 0.06 * r, 0.42 * r, 0.1 * r);
    smile(g, 0.03 * r, cy + 0.18 * r, 0.1 * r, r * 0.05);
    g.strokeStyle = shade(col, 0.6); g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(0, cy - bh + 0.04 * r); g.lineTo(0.02 * r, cy - bh - 0.16 * r); g.stroke();   // the stalk
    if (o.phones) phonesAcc(g, 0, cy - 0.12 * r, bw * 1.05, "#A3B0F2");
    if (o.daisy) daisyAcc(g, -0.25 * r, cy, bw * 0.9, k);
  }
  // the flower: petals in the person's colour round a sunny middle
  if (on("flower")) { var fx = 0.02 * r, fy = cy - bh - 0.3 * r, n = 7;
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2;
      rimmed(g, shade(petal, 0.6), petal, grow * 0.8, function (e) { g.beginPath(); g.ellipse(fx + Math.cos(a) * 0.2 * r, fy + Math.sin(a) * 0.17 * r, 0.16 * r + e, 0.1 * r + e, a, 0, 7); g.fill(); }); }
    rimmed(g, "#C9932A", "#F4C95D", grow * 0.7, function (e) { g.beginPath(); g.arc(fx, fy, 0.12 * r + e, 0, 7); g.fill(); });
    g.fillStyle = "#C9932A"; [[-0.04, -0.03], [0.04, 0.02], [0, 0.05], [0.05, -0.04]].forEach(function (d) { g.beginPath(); g.arc(fx + d[0] * r, fy + d[1] * r, 0.015 * r, 0, 7); g.fill(); }); }
  if (on("eyes")) { var es = 0.18 * r * (ad ? 0.88 : 1);
    bigEye(g, -0.22 * r, cy - 0.2 * r, es, eyes, ad, "#7A4E2A"); bigEye(g, 0.26 * r, cy - 0.2 * r, es, eyes, ad, "#7A4E2A");
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#4A4560"; g.lineWidth = r * 0.03;
      [-0.22, 0.26].forEach(function (x) { g.beginPath(); g.arc(x * r, cy - 0.2 * r, es * 1.45, 0, 7); g.stroke(); });
      g.beginPath(); g.moveTo(-0.22 * r + es * 1.45, cy - 0.22 * r); g.lineTo(0.26 * r - es * 1.45, cy - 0.22 * r); g.stroke(); } }
  // a leaf raised to wave
  if (rig.part === "paw") {
    rimmed(g, rim, mix(col, "#2E7A4A", 0.25), grow, function (e) { g.beginPath(); g.moveTo(0.62 * r, cy - 0.1 * r);
      g.quadraticCurveTo(0.9 * r + e, cy - 0.3 * r, 1.0 * r + e, cy - 0.85 * r - e); g.quadraticCurveTo(0.64 * r - e, cy - 0.5 * r, 0.6 * r, cy + 0.06 * r); g.closePath(); g.fill(); }); }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}

export default {
  id: "alien_bloom", label: "Bloom (alien)", tg: 2.45, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["footL", "footR", "leafL", "leafR", "body", "flower", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.32, -0.16], footR: [0.32, -0.16], leafL: [-0.6, -0.86], leafR: [0.6, -0.86], body: [0, 0], flower: [0.02, -1.6], paw: [0.62, -0.9], eyes: [0, 0] } },
  hat: [0.02, -2.1, 0.05],
  timers: ["shake", "bnod"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var sway = aw * 0.05 * Math.sin(M.ph) * M.g, hop = -0.05 * M.air * aw;
    var breathe = sl * (0.06 + 0.014 * Math.sin(time * 1.4)) + aw * 0.008 * Math.sin(time * 2.2) * M.idle;
    var sh = M.spike(t.shake, 1.0), y = hop + breathe;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "body" || p === "eyes") return [sway, 0, y];
    if (p === "flower") return [sway + aw * (0.16 * Math.sin(time * 1.3) * M.idle + 0.25 * Math.sin(M.ph) * M.g + 0.4 * M.spike(t.bnod, 1.2) + 0.3 * sh * Math.sin(time * 20)) + sl * 1.15, 1.6 * sway + 0.18 * sl, y + 0.1 * sl];
    if (p === "leafL") return [aw * (0.4 * Math.sin(M.ph) * M.g + 0.1 * Math.sin(time * 1.6) * M.idle + 0.5 * sh * Math.sin(time * 22)) + 0.45 * sl, 0.86 * sway, y];
    if (p === "leafR") return [aw * (0.4 * Math.sin(M.ph) * M.g - 0.1 * Math.sin(time * 1.6 + 1) * M.idle - 0.5 * sh * Math.sin(time * 22)) - 0.45 * sl, 0.86 * sway, y];
    if (p === "paw") { var w = pawWave(M); return [w[0] * 0.7, 0, y]; }
  },
  life: function (t, dt, still, A) {
    var R = Math.random;
    if (still && !(t.shake > 0) && R() < dt * 0.045) { t.shake = 1.0; t.wait = Math.max(t.wait, 1.2); if (A && A.puff) A.puff("chip", t.x, t.y - t.r * 2.2, 5, "#F4E26A"); }
    if (!(t.bnod > 0) && R() < dt * 0.07) t.bnod = 1.2;
  }
};
