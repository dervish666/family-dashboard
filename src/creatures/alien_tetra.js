// Tetra, an alien for the space station: tall, thin and very polite, with four arms and a
// cup of tea always on the go. A long lilac bean of a body with a pale front and a bow
// tie in the person's colour, a round head on a slim neck, two droopy antennae with bobbles, two big eyes
// and a small third one above them. The top pair of arms swing as it walks; the bottom pair
// hold the saucer and the cup, and now and then it lifts the cup for a sip. Asleep it nods off
// with its head on one side and the cup lowered (never spilled). Adults wear round glasses.
import { rig, on, rimmed, shade, mix, INK, phonesAcc, daisyAcc } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, bigEye, cheeks, smile, hold, ownCol } from "./alien.js";

var CUP = "#F7F3EA", CUP_RIM = "#B9AE9A", TEA = "#B5703E", SKIN = "#A3B0F2", BOBBLE = "#F4C95D";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.2, 3.6, 0.3), g = P.g, ad = !!o.adult, hy = ad ? 1.08 : 1;
  var col = SKIN, BOW = ownCol(o, "#F4C95D"), rim = shade(col, 0.58), grow = 1.6 * k, lw = 0.13 * r;
  var hx = 0, hcy = -2.42 * r * hy, hr = 0.5 * r;
  function limb(x0, y0, cx, cy, x1, y1, c) { g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = lw + grow * 2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
    g.strokeStyle = c || col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); }
  function hand(x, y, s) { rimmed(g, rim, mix(col, "#ffffff", 0.15), grow * 0.8, function (e) { g.beginPath(); g.arc(x, y, 0.1 * r + e, 0, 7); g.fill();
    [-0.6, 0, 0.6].forEach(function (a) { g.beginPath(); g.arc(x + Math.sin(a) * 0.1 * r * s, y + Math.cos(a) * 0.1 * r, 0.05 * r + e, 0, 7); g.fill(); }); }); }
  // legs and long feet
  [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
    limb(s * 0.18 * r, -0.7 * r, s * 0.2 * r, -0.35 * r, s * 0.22 * r, -0.1 * r);
    rimmed(g, rim, shade(col, 0.85), grow, function (e) { g.beginPath(); g.ellipse(s * 0.3 * r, -0.07 * r, 0.24 * r + e, 0.1 * r + e, 0, 0, 7); g.fill(); }); });
  // the top arms, hanging at the sides
  [["armUL", -1], ["armUR", 1]].forEach(function (a) { if (!on(a[0])) return; var s = a[1];
    limb(s * 0.36 * r, -1.85 * r * hy, s * 0.66 * r, -1.55 * r * hy, s * 0.62 * r, -1.05 * r * hy); hand(s * 0.62 * r, -1.0 * r * hy, s); });
  if (on("body")) {
    var body = function (e) { g.beginPath(); g.moveTo(0, -1.98 * r * hy - e);
      g.bezierCurveTo(0.42 * r + e, -1.98 * r * hy - e, 0.36 * r + e, -1.35 * r * hy, 0.46 * r + e, -1.0 * r * hy);
      g.bezierCurveTo(0.56 * r + e, -0.62 * r + e, 0.3 * r, -0.52 * r + e, 0, -0.52 * r + e);
      g.bezierCurveTo(-0.3 * r, -0.52 * r + e, -0.56 * r - e, -0.62 * r + e, -0.46 * r - e, -1.0 * r * hy);
      g.bezierCurveTo(-0.36 * r - e, -1.35 * r * hy, -0.42 * r - e, -1.98 * r * hy - e, 0, -1.98 * r * hy - e); g.closePath(); g.fill(); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(-0.18 * r, -1.6 * r, 0.05 * r, 0, -1.2 * r, 0.9 * r);
    gr.addColorStop(0, mix(col, "#ffffff", 0.35)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, 0.85));
    g.fillStyle = gr; body(0);
    g.fillStyle = mix(col, "#ffffff", 0.55); g.beginPath(); g.ellipse(0, -1.05 * r * hy, 0.26 * r, 0.42 * r * hy, 0, 0, 7); g.fill();     // the pale front
    // the neck and bow tie
    rimmed(g, rim, col, grow, function (e) { g.fillRect(-0.09 * r - e, -2.18 * r * hy, 0.18 * r + 2 * e, 0.26 * r); });
    rimmed(g, shade(BOW, 0.6), BOW, grow * 0.7, function (e) { g.beginPath(); g.moveTo(0, -1.9 * r * hy); g.lineTo(-0.2 * r - e, -2.0 * r * hy - e); g.lineTo(-0.2 * r - e, -1.8 * r * hy + e); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0, -1.9 * r * hy); g.lineTo(0.2 * r + e, -2.0 * r * hy - e); g.lineTo(0.2 * r + e, -1.8 * r * hy + e); g.closePath(); g.fill(); });
    g.fillStyle = shade(BOW, 0.75); g.beginPath(); g.arc(0, -1.9 * r * hy, 0.05 * r, 0, 7); g.fill();
  }
  // the saucer, held low on the left
  if (on("saucer")) { limb(-0.34 * r, -1.4 * r * hy, -0.3 * r, -1.05 * r * hy, -0.06 * r, -1.0 * r * hy);
    rimmed(g, CUP_RIM, CUP, grow * 0.7, function (e) { g.beginPath(); g.ellipse(0.06 * r, -0.97 * r * hy, 0.3 * r + e, 0.07 * r + e, 0, 0, 7); g.fill(); });
    hand(-0.06 * r, -0.98 * r * hy, -1); }
  // the head: round, on the neck, with a small mouth
  if (on("head")) {
    rimmed(g, rim, col, grow, function (e) { g.beginPath(); g.ellipse(hx, hcy, hr * 1.1 + e, hr + e, 0, 0, 7); g.fill(); });
    var hg = g.createRadialGradient(hx - 0.2 * r, hcy - 0.2 * r, 0.03 * r, hx, hcy, hr * 1.1);
    hg.addColorStop(0, mix(col, "#ffffff", 0.35)); hg.addColorStop(1, col); g.fillStyle = hg; g.beginPath(); g.ellipse(hx, hcy, hr * 1.1, hr, 0, 0, 7); g.fill();
    if (!ad) cheeks(g, hx, hcy + 0.18 * r, 0.34 * r, 0.09 * r);
    smile(g, hx, hcy + 0.28 * r, 0.09 * r, r * 0.045);
    if (o.phones) phonesAcc(g, hx, hcy, hr * 1.12, "#A3B0F2");
  }
  // the antennae, droopy, with bobbles
  [["earL", -1], ["earR", 1]].forEach(function (a) { if (!on(a[0])) return; var s = a[1];
    var bx = hx + s * 0.2 * r, by = hcy - 0.42 * r, tx = hx + s * 0.62 * r, ty = hcy - 0.86 * r;
    g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.06 * r + grow * 2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(hx + s * 0.3 * r, hcy - 1.0 * r, tx, ty); g.stroke();
    g.strokeStyle = col; g.lineWidth = 0.06 * r; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(hx + s * 0.3 * r, hcy - 1.0 * r, tx, ty); g.stroke();
    rimmed(g, rim, mix(col, BOBBLE, 0.6), grow, function (e) { g.beginPath(); g.arc(tx, ty, 0.1 * r + e, 0, 7); g.fill(); }); });
  if (on("head") && o.daisy) daisyAcc(g, hx - 0.15 * r, hcy + 0.2 * r, 0.55 * r, k);
  // the cup, held in front on the right
  if (on("cup")) { limb(0.34 * r, -1.4 * r * hy, 0.32 * r, -1.1 * r * hy, 0.2 * r, -1.08 * r * hy);
    var cx = 0.06 * r, cy = -1.04 * r * hy;
    rimmed(g, CUP_RIM, CUP, grow * 0.7, function (e) { g.beginPath(); g.moveTo(cx - 0.16 * r - e, cy - 0.2 * r - e); g.lineTo(cx + 0.16 * r + e, cy - 0.2 * r - e);
      g.quadraticCurveTo(cx + 0.15 * r + e, cy + e, cx, cy + e); g.quadraticCurveTo(cx - 0.15 * r - e, cy + e, cx - 0.16 * r - e, cy - 0.2 * r - e); g.fill(); });
    g.strokeStyle = CUP_RIM; g.lineWidth = 0.035 * r; g.beginPath(); g.arc(cx + 0.18 * r, cy - 0.11 * r, 0.06 * r, -1.3, 1.3); g.stroke();
    g.fillStyle = TEA; g.beginPath(); g.ellipse(cx, cy - 0.2 * r, 0.14 * r, 0.035 * r, 0, 0, 7); g.fill();
    g.fillStyle = "#E86A5B"; g.fillRect(cx - 0.15 * r, cy - 0.13 * r, 0.3 * r, 0.03 * r);                 // a band round the cup
    hand(0.2 * r, -1.08 * r * hy, 1); }
  // the eyes: two big, one small above
  if (on("eyes")) {
    var es = 0.17 * r * (ad ? 0.88 : 1);
    bigEye(g, hx - 0.21 * r, hcy - 0.02 * r, es, eyes, ad, "#C2793A"); bigEye(g, hx + 0.21 * r, hcy - 0.02 * r, es, eyes, ad, "#C2793A");
    bigEye(g, hx, hcy - 0.3 * r, es * 0.55, eyes, false, "#C2793A");
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#4A4560"; g.lineWidth = r * 0.03;
      [-1, 1].forEach(function (s) { g.beginPath(); g.arc(hx + s * 0.21 * r, hcy - 0.02 * r, es * 1.45, 0, 7); g.stroke(); });
      g.beginPath(); g.moveTo(hx - 0.21 * r + es * 1.45, hcy - 0.04 * r); g.lineTo(hx + 0.21 * r - es * 1.45, hcy - 0.04 * r); g.stroke(); }
  }
  // the top right hand raised to wave
  if (rig.part === "paw") { limb(0.36 * r, -1.85 * r * hy, 0.7 * r, -1.9 * r * hy, 0.78 * r, -2.3 * r * hy); hand(0.78 * r, -2.36 * r * hy, 1); }
  void INK;
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}

export default {
  id: "alien_tetra", label: "Tetra (alien)", tg: 3.05, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["footL", "footR", "armUL", "armUR", "body", "saucer", "head", "earL", "earR", "cup", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.2, -0.7], footR: [0.2, -0.7], armUL: [-0.36, -1.85], armUR: [0.36, -1.85], body: [0, -0.55], saucer: [-0.34, -1.4],
      head: [0, -2.05], earL: [-0.2, -2.84], earR: [0.2, -2.84], cup: [0.34, -1.4], paw: [0.36, -1.85], eyes: [0, -2.05] } },
  hat: [0, -2.9, -0.06],
  timers: ["sip", "ttilt", "twig"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var sway = 0.045 * Math.sin(M.ph) * M.g * aw;
    var breathe = sl * (0.05 + 0.014 * Math.sin(time * 1.3)) + aw * 0.007 * Math.sin(time * 2) * M.idle;
    var sip = aw * hold(t.sip, 2.6, 0.5), tilt = M.spike(t.ttilt, 1.6) * (t.ttiltDir || 1) * 0.22 * aw;
    var nod = sl * 0.34 + aw * 0.04 * Math.sin(time * 0.9) * M.idle + tilt - 0.12 * sip;
    var hdx = sway * 1.5 + 0.08 * sl, hdy = breathe * 1.4 + 0.06 * sl;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "body") return [sway, 0, breathe];
    if (p === "head" || p === "eyes") return [nod, hdx, hdy];
    if (p === "earL" || p === "earR") { var s = p === "earL" ? -1 : 1;
      return [nod + aw * (0.14 * Math.sin(time * 1.7 + s) * M.idle + 0.25 * Math.sin(time * 16) * M.spike(t.twig, 0.5) - 0.2 * M.air * s) + sl * 0.5 * s, hdx + 0.8 * nod, hdy]; }
    if (p === "armUL") return [aw * (0.28 * Math.sin(M.ph) * M.g + 0.04 * Math.sin(time * 1.1) * M.idle) + 0.08 * sl, sway * 1.8, breathe];
    if (p === "armUR") return [aw * (-0.28 * Math.sin(M.ph) * M.g - 0.04 * Math.sin(time * 1.1 + 1) * M.idle) - 0.08 * sl, sway * 1.8, breathe];
    if (p === "saucer") return [0, sway * 1.2, breathe + 0.03 * sl];
    if (p === "cup") return [-0.35 * sip, sway * 1.2 - 0.06 * sip, breathe - 0.95 * sip + 0.04 * sl];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still, A) {
    var R = Math.random;
    if (still && !(t.sip > 0) && R() < dt * 0.06) { t.sip = 2.6; t.wait = Math.max(t.wait, 3); if (A && A.puff) A.puff("smoke", t.x + (t.face || 1) * t.r * 0.1, t.y - t.r * 2.1, 2, "#FFFFFF"); }
    if (!(t.ttilt > 0) && R() < dt * 0.06) { t.ttilt = 1.6; t.ttiltDir = R() < 0.5 ? -1 : 1; }
    if (!(t.twig > 0) && R() < dt * 0.12) t.twig = 0.5;
  }
};
