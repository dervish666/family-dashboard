// Domo, an alien for the space station: a little scuttler that carries its home on its back,
// the way the snail does. A round coral body on six short legs, two eyes up on stalks, a pair
// of stubby claws, and on its back a glass dome with a tiny garden inside, banded in the
// person's colour. It scuttles with its legs going like clockwork, peers about on its stalks,
// and now and then polishes its dome with a claw. Asleep it tucks its legs in and lays its
// stalks down along the dome.
import { rig, on, rimmed, shade, mix, rr, phonesAcc, daisyAcc } from "../engine/draw.js";
import { pawWave } from "./front.js";
import { alienCanvas, bigEye, cheeks, smile, ownCol, hold } from "./alien.js";

var SKIN = "#F4A58A";

function sprite(o, eyes, k) {
  var r = o.r * k, P = alienCanvas(r, 3.6, 2.9, 0.3), g = P.g, ad = !!o.adult, hy = ad ? 1.08 : 1;
  var col = SKIN, band = ownCol(o, "#5FC2BE"), rim = shade(col, 0.56), grow = 1.6 * k;
  var cy = -0.62 * r * hy, bw = 0.86 * r, bh = 0.46 * r * hy, dcy = cy - bh + 0.02 * r;
  // the dome on its back, with its garden
  if (on("dome")) {
    rimmed(g, shade(band, 0.55), band, grow, function (e) { rr(g, -0.82 * r - e, dcy - 0.06 * r - e, 1.64 * r + 2 * e, 0.16 * r + 2 * e, 0.08 * r); g.fill(); });
    g.save(); g.beginPath(); g.ellipse(0, dcy, 0.74 * r, 0.82 * r * hy, 0, Math.PI, 0); g.closePath(); g.clip();
    g.fillStyle = "rgba(190,236,246,.55)"; g.fillRect(-r, dcy - r, 2 * r, r);
    g.fillStyle = "#8A6A50"; g.beginPath(); g.ellipse(0, dcy, 0.7 * r, 0.12 * r, 0, Math.PI, 0); g.fill();                 // soil
    [[-0.3, 0.32, "#7BC4A8"], [0.05, 0.46, "#8FD6B8"], [0.32, 0.28, "#6AB898"]].forEach(function (pl) { g.fillStyle = pl[2];
      g.beginPath(); g.ellipse(pl[0] * r, dcy - pl[1] * r * 0.5, 0.07 * r, pl[1] * r * 0.5, pl[0], 0, 7); g.fill(); });
    g.fillStyle = "#F2A0C8"; g.beginPath(); g.arc(0.05 * r, dcy - 0.46 * r, 0.06 * r, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = "rgba(94,99,146,.8)"; g.lineWidth = 0.04 * r + grow; g.beginPath(); g.ellipse(0, dcy, 0.74 * r, 0.82 * r * hy, 0, Math.PI, 0); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 0.05 * r; g.lineCap = "round"; g.beginPath(); g.ellipse(0, dcy, 0.6 * r, 0.68 * r * hy, 0, Math.PI * 1.15, Math.PI * 1.4); g.stroke();
    g.strokeStyle = "rgba(94,99,146,.8)"; g.lineWidth = 0.03 * r; g.beginPath(); g.moveTo(0, dcy - 0.82 * r * hy); g.lineTo(0, dcy - 0.95 * r * hy); g.stroke();
    g.fillStyle = band; g.beginPath(); g.arc(0, dcy - 0.98 * r * hy, 0.05 * r, 0, 7); g.fill();
  }
  // six short legs, three a side
  [["legL", -1], ["legR", 1]].forEach(function (l) { if (!on(l[0])) return; var s = l[1];
    [0.3, 0.55, 0.78].forEach(function (x) { var path = function () { g.beginPath(); g.moveTo(s * x * r, cy + 0.2 * r); g.quadraticCurveTo(s * (x + 0.18) * r, cy + 0.32 * r, s * (x + 0.12) * r, -0.02 * r); };
      g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.1 * r + grow * 2; path(); g.stroke(); g.strokeStyle = shade(col, 0.88); g.lineWidth = 0.1 * r; path(); g.stroke(); }); });
  // the claws, stubby, in front at the sides
  [["clawL", -1], ["clawR", 1]].forEach(function (c) { if (!on(c[0])) return; var s = c[1], x = s * 0.9 * r, y = cy + 0.08 * r;
    rimmed(g, rim, mix(col, "#ffffff", 0.15), grow, function (e) { g.beginPath(); g.arc(x, y, 0.17 * r + e, s > 0 ? -2.4 : -0.7, s > 0 ? 2.4 : 3.85); g.closePath(); g.fill(); }); });
  if (on("body")) {
    var body = function (e) { g.beginPath(); g.ellipse(0, cy, bw + e, bh + e, 0, 0, 7); g.fill(); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(-bw * 0.35, cy - bh * 0.5, bw * 0.1, 0, cy, bw * 1.15);
    gr.addColorStop(0, mix(col, "#ffffff", 0.45)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.84));
    g.fillStyle = gr; body(0);
    g.fillStyle = mix(col, "#FFF2E6", 0.55); g.beginPath(); g.ellipse(0, cy + bh * 0.35, bw * 0.6, bh * 0.45, 0, 0, 7); g.fill();
    if (!ad) cheeks(g, 0, cy + 0.02 * r, 0.42 * r, 0.1 * r);
    smile(g, 0, cy + 0.14 * r, 0.1 * r, r * 0.05);
    if (o.daisy) daisyAcc(g, -0.4 * r, cy + 0.3 * r, bw * 0.7, k);
  }
  // the eyes, up on stalks
  if (on("eyes")) { var es = 0.17 * r * (ad ? 0.88 : 1);
    [-1, 1].forEach(function (s) { var bx = s * 0.22 * r, by = cy - bh * 0.6, tx = s * 0.34 * r, ty = cy - bh - 0.5 * r * hy;
      g.lineCap = "round"; g.strokeStyle = rim; g.lineWidth = 0.08 * r + grow * 2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(s * 0.2 * r, (by + ty) / 2, tx, ty + es); g.stroke();
      g.strokeStyle = col; g.lineWidth = 0.08 * r; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(s * 0.2 * r, (by + ty) / 2, tx, ty + es); g.stroke();
      bigEye(g, tx, ty, es, eyes, ad, "#2E7A8C"); });
    if (o.glasses && eyes !== "shut") { g.strokeStyle = "#4A4560"; g.lineWidth = r * 0.03;
      [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.34 * r, cy - bh - 0.5 * r * hy, es * 1.45, 0, 7); g.stroke(); }); }
    if (o.phones) phonesAcc(g, 0, cy - bh - 0.45 * r * hy, 0.45 * r, "#A3B0F2"); }
  // a claw raised to wave
  if (rig.part === "paw") { rimmed(g, rim, mix(col, "#ffffff", 0.15), grow, function (e) { g.beginPath(); g.arc(1.0 * r, cy - 0.5 * r, 0.17 * r + e, -2.4, 2.4); g.closePath(); g.fill(); }); }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}

export default {
  id: "alien_dome", label: "Domo (alien)", tg: 2.5, editor: true, sleeps: true,
  sprite: sprite,
  rig: { order: ["dome", "legL", "legR", "body", "clawL", "clawR", "paw", "eyes"], eyesIn: "eyes",
    piv: { dome: [0, -1.06], legL: [-0.5, -0.45], legR: [0.5, -0.45], body: [0, -0.62], clawL: [-0.8, -0.6], clawR: [0.8, -0.6], paw: [0.85, -0.7], eyes: [0, -0.9] } },
  hat: [0, -2.05, 0],
  timers: ["peek", "polish"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var scuttle = aw * M.g, bob = -0.035 * Math.abs(Math.sin(M.ph * 2)) * scuttle;
    var breathe = sl * (0.1 + 0.014 * Math.sin(time * 1.4)) + aw * 0.007 * Math.sin(time * 2.4) * M.idle, y = bob + breathe;
    var peek = M.spike(t.peek, 2.0) * (t.peekDir || 1) * aw, pol = aw * hold(t.polish, 2.0, 0.35);
    if (p === "dome") return [0.03 * Math.sin(M.ph * 2) * scuttle, 0, y - 0.02 * sl];
    if (p === "body") return [0, 0, y];
    if (p === "legL" || p === "legR") { var s = p === "legL" ? -1 : 1;
      return [s * (0.22 * Math.sin(M.ph * 3 + (s > 0 ? 1.5 : 0)) * scuttle) - s * 0.5 * sl, 0, y * 0.5 - 0.05 * sl]; }
    if (p === "eyes") return [0.4 * peek + aw * 0.05 * Math.sin(time * 1.1) * M.idle + 0.08 * Math.sin(M.ph * 2) * scuttle, 0.12 * peek, y + 0.3 * sl];
    if (p === "clawL") return [aw * (0.15 * Math.sin(M.ph) * M.g + 0.06 * Math.sin(time * 1.7) * M.idle) + 0.2 * sl, 0, y];
    if (p === "clawR") return [aw * (-0.15 * Math.sin(M.ph) * M.g - 0.06 * Math.sin(time * 1.7) * M.idle) - 1.3 * pol + 0.25 * pol * Math.sin(time * 14) - 0.2 * sl, 0, y - 0.25 * pol];
    if (p === "paw") { var w = pawWave(M); return [w[0] * 0.7, 0, y]; }
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.peek > 0) && R() < dt * 0.08) { t.peek = 2.0; t.peekDir = R() < 0.5 ? -1 : 1; }
    if (still && !(t.polish > 0) && R() < dt * 0.035) { t.polish = 2.0; t.wait = Math.max(t.wait, 2.4); }
  }
};
