// Gloop, an alien for the space station: a one-eyed jelly. A wobbly mint gumdrop you can
// half see through (a darker nucleus and a few bubbles inside), a curl of jelly
// on top with a bow in the person's colour, two little stub feet, two nubby arms, one big eye and a small smile. Walking is a
// bouncy squish; standing it wobbles, and now and then it gives itself a good jiggle. Asleep it
// settles into a puddle with its curl flopped over. Adults wear glasses as a monocle.
import { rig, on, rimmed, shade, mix, phonesAcc, daisyAcc } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, bigEye, cheeks, smile, ownCol } from "./alien.js";

const JELLY = "#8FDDB5";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.4, 2.5, 0.3), g = P.g, ad = !!o.adult, hy = ad ? 1.12 : 1, wx = ad ? 0.94 : 1;
  var col = JELLY, own = ownCol(o, "#F08A7E"), rim = shade(col, 0.58), grow = 1.7 * k;
  var top = -1.72 * r * hy, ey = -1.02 * r * hy;
  // the stub feet
  [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
    rimmed(g, rim, shade(col, 0.82), grow, function (e) { g.beginPath(); g.ellipse(s * 0.42 * r, -0.01 * r, 0.24 * r + e, 0.13 * r + e, 0, 0, 7); g.fill(); }); });
  // the nubby arms, behind the body
  [["armL", -1], ["armR", 1]].forEach(function (a) { if (!on(a[0])) return; var s = a[1];
    rimmed(g, rim, mix(col, "#ffffff", 0.12), grow, function (e) { g.beginPath(); g.ellipse(s * 1.04 * r * wx, -0.62 * r * hy, 0.3 * r + e, 0.15 * r + e, s * 0.5, 0, 7); g.fill(); }); });
  if (on("body")) {
    var body = function (e) { g.beginPath(); g.moveTo(-1.0 * r * wx - e, -0.14 * r);
      g.bezierCurveTo(-1.08 * r * wx - e, -0.9 * r * hy, -0.62 * r * wx - e, top - e, 0, top - e);
      g.bezierCurveTo(0.62 * r * wx + e, top - e, 1.08 * r * wx + e, -0.9 * r * hy, 1.0 * r * wx + e, -0.14 * r);
      // the scalloped hem
      for (var i = 0; i < 5; i++) { var x0 = (1 - i * 0.4) * r * wx, x1 = (0.6 - i * 0.4) * r * wx; g.quadraticCurveTo((x0 + x1) / 2, 0.04 * r + e, x1, -0.12 * r); }
      g.closePath(); g.fill(); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(-0.4 * r, -1.25 * r * hy, 0.1 * r, 0, -0.8 * r, 1.3 * r);
    gr.addColorStop(0, mix(col, "#ffffff", 0.55)); gr.addColorStop(0.5, col); gr.addColorStop(1, shade(col, 0.82));
    g.fillStyle = gr; body(0);
    // inside the jelly: a nucleus and some bubbles
    g.fillStyle = shade(col, 0.7); g.globalAlpha = 0.3; g.beginPath(); g.ellipse(-0.36 * r, -0.42 * r * hy, 0.26 * r, 0.18 * r, -0.3, 0, 7); g.fill();
    g.globalAlpha = 0.45; g.fillStyle = "#FFFFFF";
    [[0.52, -0.45, 0.09], [0.66, -0.7, 0.05], [-0.62, -0.95, 0.06], [0.3, -0.25, 0.05]].forEach(function (b) { g.beginPath(); g.arc(b[0] * r, b[1] * r * hy, b[2] * r, 0, 7); g.fill(); });
    g.globalAlpha = 1;
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-0.55 * r * wx, -1.15 * r * hy, 0.1 * r, 0.26 * r, 0.45, 0, 7); g.fill();   // the shine
    if (!ad) cheeks(g, 0.06 * r, -0.6 * r * hy, 0.4 * r, 0.11 * r);
    smile(g, 0.06 * r, -0.52 * r * hy, 0.12 * r, r * 0.05);
    if (o.phones) phonesAcc(g, 0, ey, 0.9 * r, "#A3B0F2");
    if (o.daisy) daisyAcc(g, -0.2 * r, ey + 0.1 * r, 0.75 * r, k);
  }
  // the curl on top
  if (on("curl")) { var cp = function () { g.beginPath(); g.moveTo(-0.04 * r, top + 0.08 * r); g.quadraticCurveTo(-0.06 * r, top - 0.3 * r, 0.16 * r, top - 0.32 * r); g.quadraticCurveTo(0.32 * r, top - 0.3 * r, 0.24 * r, top - 0.16 * r); };
    g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.16 * r + grow * 2; cp(); g.stroke(); g.strokeStyle = mix(col, "#ffffff", 0.25); g.lineWidth = 0.16 * r; cp(); g.stroke();
    // a bow at the foot of the curl, in the owner's colour
    var bx = -0.04 * r, by = top + 0.06 * r;
    rimmed(g, shade(own, 0.6), own, grow * 0.8, function (e) { [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + s * (0.26 * r + e), by - 0.13 * r - e); g.lineTo(bx + s * (0.26 * r + e), by + 0.13 * r + e); g.closePath(); g.fill(); }); });
    g.fillStyle = shade(own, 0.75); g.beginPath(); g.arc(bx, by, 0.06 * r, 0, 7); g.fill(); }
  // the eye: one, big
  if (on("eyes")) {
    bigEye(g, 0.06 * r, ey, 0.34 * r * (ad ? 0.86 : 1), eyes, ad, "#5B3FA6");
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#E8C46A"; g.lineWidth = r * 0.05; g.beginPath(); g.arc(0.06 * r, ey, 0.44 * r, 0, 7); g.stroke();      // the monocle
      g.lineWidth = r * 0.025; g.beginPath(); g.moveTo(0.48 * r, ey + 0.12 * r); g.quadraticCurveTo(0.6 * r, ey + 0.5 * r, 0.5 * r, ey + 0.7 * r); g.stroke(); }
  }
  // a nub raised to wave
  if (rig.part === "paw") {
    rimmed(g, rim, mix(col, "#ffffff", 0.12), grow, function (e) { g.beginPath(); g.ellipse(0.98 * r, -1.1 * r * hy, 0.14 * r + e, 0.3 * r + e, 0.3, 0, 7); g.fill(); });
  }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}
export default {
  id: "alien_gloop", label: "Gloop (alien)", tg: 2.35, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["footL", "footR", "armL", "armR", "body", "curl", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.42, -0.06], footR: [0.42, -0.06], armL: [-0.78, -0.6], armR: [0.78, -0.6], body: [0, 0], curl: [0, -1.72], paw: [0.85, -0.85], eyes: [0, 0] } },
  hat: [0.02, -1.9, 0.08],
  timers: ["gjiggle", "gcurl"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var jig = M.spike(t.gjiggle, 1.2);
    var wob = aw * (0.03 * Math.sin(time * 2.6) * M.idle + jig * 0.14 * Math.sin(time * 19) + 0.06 * Math.sin(M.ph) * M.g);
    var hop = -0.08 * M.air * aw, breathe = sl * (0.09 + 0.018 * Math.sin(time * 1.5)) + aw * 0.01 * Math.sin(time * 3.1) * M.idle;
    var y = hop + breathe;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "body" || p === "eyes") return [wob, 0, y];
    if (p === "curl") return [wob + aw * (0.22 * Math.sin(time * 2.1 + 1) * M.idle - 0.35 * Math.sin(M.ph) * M.g + 0.5 * M.spike(t.gcurl, 0.6) + jig * 0.5 * Math.sin(time * 14)) + sl * 1.1, 1.72 * wob, y + 0.06 * sl];
    if (p === "armL") return [aw * (-0.55 * M.air - 0.12 * Math.sin(time * 2) * M.idle) + 0.5 * sl, 0.6 * wob, y + 0.03 * sl];
    if (p === "armR") return [aw * (0.55 * M.air + 0.12 * Math.sin(time * 2 + 1) * M.idle) - 0.5 * sl, 0.6 * wob, y + 0.03 * sl];
    if (p === "paw") { var w = pawWave(M); return [w[0], 0, y]; }
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (still && !(t.gjiggle > 0) && R() < dt * 0.05) { t.gjiggle = 1.2; t.wait = Math.max(t.wait, 1.4); }
    if (!(t.gcurl > 0) && R() < dt * 0.15) t.gcurl = 0.6;
  }
};
