// Boulder, an alien for the space station: a gentle giant made of stone. A big lumpy boulder
// of a body with a smoother front, cracks and lichen, a mossy cap with a sprout growing out of
// it, crystals on one shoulder in the person's own colour, a heavy brow over small kind eyes,
// a wide smile, great blocky arms that hang to its knees and flat stone feet. It walks with a
// slow stomp and a sway, and now and then reaches up to pat the sprout on its head. Asleep it
// hunkers down, arms resting, sprout drooping.
import { rig, on, rimmed, shade, mix, phonesAcc, daisyAcc, INK } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, cheeks, hold } from "./alien.js";

var STONE = "#A79E95", STONE_L = "#C9C1B6", STONE_D = "#6E655E", MOSS = "#7DB06A", MOSS_D = "#4E8A4A";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.6, 2.9, 0.3), g = P.g, ad = !!o.adult, hy = ad ? 1.06 : 1;
  var col = /^#[0-9a-f]{6}$/i.test(o.col || "") ? o.col : "#7FC8D2", grow = 1.8 * k;
  function blob(pts, e) { g.beginPath(); var n = pts.length;
    for (var i = 0; i <= n; i++) { var a = pts[i % n], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2 * r, my = (a[1] + b[1]) / 2 * r * hy;
      if (i === 0) g.moveTo(mx, my); else g.quadraticCurveTo(a[0] * r, a[1] * r * hy, mx, my); }
    g.closePath(); if (e) { g.lineWidth = e * 2; g.lineJoin = "round"; g.strokeStyle = g.fillStyle; g.stroke(); } g.fill(); }
  // flat stone feet
  [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
    rimmed(g, STONE_D, mix(STONE, STONE_D, 0.3), grow, function (e) { g.beginPath(); g.ellipse(s * 0.44 * r, -0.1 * r, 0.32 * r + e, 0.16 * r + e, 0, Math.PI, 0); g.lineTo(s * 0.44 * r + 0.32 * r + e, -0.02 * r + e); g.lineTo(s * 0.44 * r - 0.32 * r - e, -0.02 * r + e); g.closePath(); g.fill(); }); });
  // the arms, hanging at the sides, with knuckly fists: a shade darker than the body so they read
  var ARM = mix(STONE, STONE_D, 0.22);
  [["armL", -1], ["armR", 1]].forEach(function (a) { if (!on(a[0])) return; var s = a[1];
    rimmed(g, STONE_D, ARM, grow, function (e) { g.beginPath(); g.moveTo(s * 0.66 * r, -1.66 * r * hy - e); g.quadraticCurveTo(s * (1.24 * r + e), -1.58 * r * hy, s * (1.2 * r + e), -0.72 * r * hy);
      g.lineTo(s * (0.86 * r - e), -0.66 * r * hy); g.quadraticCurveTo(s * 0.9 * r, -1.2 * r * hy, s * 0.62 * r, -1.28 * r * hy); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(s * 1.04 * r, -0.54 * r * hy, 0.27 * r + e, 0.23 * r + e, 0, 0, 7); g.fill(); });
    g.strokeStyle = STONE_D; g.lineWidth = 0.03 * r; g.lineCap = "round";
    [-0.1, 0.02, 0.14].forEach(function (d) { g.beginPath(); g.moveTo(s * (1.04 + d) * r, -0.62 * r * hy); g.lineTo(s * (1.04 + d) * r, -0.42 * r * hy); g.stroke(); }); });
  if (on("body")) {
    var pts = [[-0.9, -0.1], [-1.06, -0.8], [-0.92, -1.55], [-0.45, -2.0], [0.2, -2.06], [0.78, -1.75], [1.05, -1.05], [0.98, -0.3], [0.45, -0.05], [-0.4, -0.04]];
    g.fillStyle = STONE_D; blob(pts, grow);
    var gr = g.createRadialGradient(-0.35 * r, -1.5 * r, 0.1 * r, 0, -1.0 * r, 1.3 * r);
    gr.addColorStop(0, STONE_L); gr.addColorStop(0.55, STONE); gr.addColorStop(1, shade(STONE, 0.85));
    g.fillStyle = gr; blob(pts, 0);
    g.fillStyle = mix(STONE_L, "#ffffff", 0.2); g.beginPath(); g.ellipse(0.02 * r, -0.72 * r * hy, 0.55 * r, 0.5 * r * hy, 0, 0, 7); g.fill();   // the smoother front
    // cracks and lichen
    g.strokeStyle = shade(STONE, 0.7); g.lineWidth = 0.03 * r; g.lineCap = "round";
    [[[-0.8, -1.2], [-0.62, -1.05], [-0.66, -0.86]], [[0.72, -0.5], [0.6, -0.36], [0.66, -0.2]], [[0.3, -1.9], [0.24, -1.74]]].forEach(function (c) {
      g.beginPath(); c.forEach(function (q, i) { if (i) g.lineTo(q[0] * r, q[1] * r * hy); else g.moveTo(q[0] * r, q[1] * r * hy); }); g.stroke(); });
    [[-0.75, -0.45, "#D9D27A"], [-0.68, -0.38, "#C9CF86"], [0.84, -1.2, "#D9D27A"]].forEach(function (l) { g.fillStyle = l[2]; g.beginPath(); g.arc(l[0] * r, l[1] * r * hy, 0.06 * r, 0, 7); g.fill(); });
    // the mossy cap
    rimmed(g, MOSS_D, MOSS, grow * 0.8, function (e) { g.beginPath(); g.moveTo(-0.62 * r - e, -1.78 * r * hy);
      for (var i = 0; i <= 6; i++) { var x = -0.62 + i * 0.16; g.quadraticCurveTo((x + 0.08) * r, (-2.12 - (i % 2) * 0.05) * r * hy - e, (x + 0.16) * r, -1.98 * r * hy); }
      g.quadraticCurveTo(0.2 * r, -1.82 * r * hy, -0.62 * r - e, -1.78 * r * hy); g.fill(); });
    // crystals on the right shoulder, in the person's colour
    [[0.62, -1.72, 0.32, -0.35, 0.09], [0.82, -1.6, 0.24, 0.1, 0.07], [0.46, -1.88, 0.2, -0.6, 0.06]].forEach(function (c) {
      g.save(); g.translate(c[0] * r, c[1] * r * hy); g.rotate(c[3]);
      rimmed(g, shade(col, 0.55), col, grow * 0.7, function (e) { g.beginPath(); g.moveTo(-c[4] * r - e, e); g.lineTo(-c[4] * r - e, -c[2] * r * 0.7); g.lineTo(0, -c[2] * r - e); g.lineTo(c[4] * r + e, -c[2] * r * 0.7); g.lineTo(c[4] * r + e, e); g.closePath(); g.fill(); });
      g.fillStyle = mix(col, "#ffffff", 0.55); g.beginPath(); g.moveTo(-c[4] * r * 0.5, 0); g.lineTo(-c[4] * r * 0.5, -c[2] * r * 0.65); g.lineTo(0, -c[2] * r * 0.92); g.lineTo(0, 0); g.closePath(); g.fill();
      g.restore(); });
    // the brow, the smile and (on kids) the cheeks
    g.fillStyle = shade(STONE, 0.78); g.beginPath(); g.moveTo(-0.55 * r, -1.5 * r * hy); g.quadraticCurveTo(0, -1.72 * r * hy, 0.58 * r, -1.5 * r * hy); g.quadraticCurveTo(0, -1.6 * r * hy, -0.55 * r, -1.5 * r * hy); g.fill();
    if (!ad) cheeks(g, 0.02 * r, -1.08 * r * hy, 0.46 * r, 0.12 * r);
    g.strokeStyle = INK; g.lineWidth = 0.055 * r; g.lineCap = "round"; g.beginPath(); g.moveTo(-0.24 * r, -1.02 * r * hy); g.quadraticCurveTo(0.02 * r, -0.86 * r * hy, 0.28 * r, -1.02 * r * hy); g.stroke();
    if (o.phones) phonesAcc(g, 0, -1.4 * r * hy, 1.0 * r, "#A3B0F2");
    if (o.daisy) daisyAcc(g, -0.35 * r, -1.2 * r * hy, 0.8 * r, k);
  }
  // the sprout on top
  if (on("sprout")) { var sx = -0.1 * r, sy = -2.0 * r * hy;
    g.strokeStyle = MOSS_D; g.lineWidth = 0.05 * r; g.lineCap = "round"; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx - 0.05 * r, sy - 0.2 * r, sx + 0.02 * r, sy - 0.36 * r); g.stroke();
    [-1, 1].forEach(function (s) { rimmed(g, MOSS_D, "#9ED68A", grow * 0.6, function (e) { g.beginPath(); g.ellipse(sx + s * 0.13 * r, sy - 0.24 * r, 0.12 * r + e, 0.055 * r + e, s * -0.5, 0, 7); g.fill(); }); });
    rimmed(g, "#C25A86", "#F2A0C8", grow * 0.6, function (e) { g.beginPath(); g.arc(sx + 0.02 * r, sy - 0.4 * r, 0.07 * r + e, 0, 7); g.fill(); }); }
  // small kind eyes under the brow
  if (on("eyes")) { var ey = -1.36 * r * hy;
    [-1, 1].forEach(function (s) { var x = s * 0.26 * r + 0.02 * r;
      g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.06;
      if (eyes === "open" || eyes === "wide") { var w = eyes === "wide" ? 1.3 : 1;
        g.fillStyle = INK; g.beginPath(); g.ellipse(x, ey, 0.09 * r * w, 0.11 * r * w, 0, 0, 7); g.fill();
        g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x - 0.03 * r, ey - 0.04 * r, 0.035 * r * w, 0, 7); g.fill(); }
      else if (eyes === "shut") { g.beginPath(); g.moveTo(x - 0.1 * r, ey); g.quadraticCurveTo(x, ey + 0.07 * r, x + 0.1 * r, ey); g.stroke(); }
      else { g.beginPath(); g.moveTo(x - 0.1 * r, ey + 0.03 * r); g.quadraticCurveTo(x, ey - 0.08 * r, x + 0.1 * r, ey + 0.03 * r); g.stroke(); } });
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#4A4560"; g.lineWidth = r * 0.035;
      [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.26 * r + 0.02 * r, ey, 0.17 * r, 0, 7); g.stroke(); }); } }
  // a big hand up to wave
  if (rig.part === "paw") {
    rimmed(g, STONE_D, mix(STONE, STONE_D, 0.22), grow, function (e) { g.beginPath(); g.moveTo(0.72 * r, -1.55 * r * hy); g.quadraticCurveTo(1.2 * r + e, -1.6 * r * hy, 1.18 * r + e, -2.1 * r * hy);
      g.lineTo(0.94 * r - e, -2.1 * r * hy); g.quadraticCurveTo(0.96 * r, -1.75 * r * hy, 0.72 * r, -1.3 * r * hy); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(1.06 * r, -2.22 * r * hy, 0.22 * r + e, 0.2 * r + e, 0, 0, 7); g.fill(); }); }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}

export default {
  id: "alien_rock", label: "Boulder (alien)", tg: 2.55, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["footL", "footR", "body", "sprout", "eyes", "armL", "armR", "paw"], eyesIn: "eyes",
    piv: { footL: [-0.44, -0.06], footR: [0.44, -0.06], armL: [-0.78, -1.5], armR: [0.78, -1.5], body: [0, 0], sprout: [-0.1, -2.0], paw: [0.8, -1.45], eyes: [0, 0] } },
  hat: [-0.05, -2.15, -0.05],
  timers: ["pat", "rlook"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var sway = 0.05 * Math.sin(M.ph) * M.g * aw, stomp = -0.035 * M.air * aw;
    var breathe = aw * 0.009 * Math.sin(time * 1.4) * M.idle + sl * (0.1 + 0.016 * Math.sin(time * 1.1));
    var pat = aw * hold(t.pat, 2.2, 0.45), look = M.spike(t.rlook, 2) * (t.rlookDir || 1) * 0.06 * aw;
    var y = stomp + breathe;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "body") return [sway + look, 0, y];
    if (p === "eyes") return [sway + look, 0.1 * look, y];
    if (p === "sprout") return [sway + look + aw * (0.14 * Math.sin(time * 1.8) * M.idle - 0.3 * M.air + 0.25 * pat * Math.sin(time * 12)) + 0.7 * sl, 2.0 * (sway + look), y];
    if (p === "armL") return [aw * (0.24 * Math.sin(M.ph) * M.g + 0.03 * Math.sin(time * 1.2) * M.idle) + 0.12 * sl, 1.5 * sway, y + 0.05 * sl];
    if (p === "armR") return [aw * (-0.24 * Math.sin(M.ph) * M.g - 0.03 * Math.sin(time * 1.2 + 1) * M.idle) + 2.5 * pat - 0.12 * sl, 1.5 * sway, y + 0.05 * sl];
    if (p === "paw") { var w = pawWave(M); return [w[0] * 0.6, 0, y]; }
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (still && !(t.pat > 0) && R() < dt * 0.035) { t.pat = 2.2; t.wait = Math.max(t.wait, 2.6); }
    if (!(t.rlook > 0) && R() < dt * 0.06) { t.rlook = 2; t.rlookDir = R() < 0.5 ? -1 : 1; }
  }
};
