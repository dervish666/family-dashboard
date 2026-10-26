// Bunny, front-facing, on the shared rig: long ears that each twitch on their own, a cream
// muzzle with a pink nose that never stops working, big hind feet and a cotton tail peeping
// out at the side. Ears fold back as it hops along; now and then, when it is happy and
// standing about, it does a binky (a leap with a twist). Startled, it thumps a foot. Asleep
// it settles into a loaf with both ears laid down. (look: rabbit. The older whole-sprite
// bunny is look: bunny, kept as it was for configs that already use it.)
import { on, rimmed, shade, face } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const FUR = "#C9A386", CREAM = "#FBEFE0", PINK = "#F0AFB4";

const SHAPE = {
  col: function () { return FUR; },
  light: 0.32,
  feet: function (g, F) {                                 // long hind feet, pale soles
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, shade(FUR, 0.62), "#EADACB", F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.42, cy + r * 0.84, r * 0.3 + e, r * 0.13 + e, s * 0.12, 0, 7); g.fill(); });
      g.fillStyle = shade(FUR, 0.86); [-0.1, 0, 0.1].forEach(function (o) { g.beginPath(); g.arc(cx + s * r * (0.58 + o * 0.6), cy + r * 0.86, r * 0.025, 0, 7); g.fill(); }); });
  },
  tail: function (g, F) {                                 // the scut, a puff at the side
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, "#D9CFC4", "#FFFFFF", F.grow, function (e) {
      [[0.9, 0.5, 0.2], [1.02, 0.4, 0.15], [0.86, 0.32, 0.14]].forEach(function (b) { g.beginPath(); g.arc(cx + r * b[0], cy + r * b[1], r * b[2] + e, 0, 7); g.fill(); }); });
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r, L = F.o.adult ? 0.9 : 1.08, ex = cx + s * r * 0.32, ey = cy - r * (0.7 + L / 2);
    rimmed(g, shade(FUR, 0.62), FUR, F.grow, function (e) { g.beginPath(); g.ellipse(ex, ey, r * 0.2 + e, r * L / 2 + e, s * 0.1, 0, 7); g.fill(); });
    g.fillStyle = PINK; g.beginPath(); g.ellipse(ex + s * r * 0.01, ey + r * 0.06, r * 0.1, r * L / 2 - r * 0.12, s * 0.1, 0, 7); g.fill();
    g.fillStyle = shade(FUR, 0.8); g.beginPath(); g.ellipse(ex - s * r * 0.01, ey - r * L / 2 + r * 0.1, r * 0.12, r * 0.08, s * 0.1, 0, 7); g.fill();   // darker tips
  },
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy + F.r * 0.04, F.r * 0.94 + e, F.r * 0.9 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {
    var r = F.r;
    g.fillStyle = CREAM; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(F.cx, F.cy + r * 0.42, r * 0.5, r * 0.4, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  },
  faceY: 0.12,
  face: function (g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx;
    if (on("body")) face(g, F.cx, fy, r, F.eyes, F.dx, F.o.adult, "rest");      // cheeks
    if (on("nose")) {                                      // muzzle puffs, nose, teeth, whisker dots
      g.fillStyle = CREAM; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.12, fy + r * 0.2, r * 0.15, r * 0.12, 0, 0, 7); g.fill(); });
      g.fillStyle = "#FFFFFF"; g.fillRect(ox - r * 0.06, fy + r * 0.27, r * 0.12, r * 0.09);
      g.strokeStyle = "rgba(43,36,51,.35)"; g.lineWidth = r * 0.015; g.beginPath(); g.moveTo(ox, fy + r * 0.27); g.lineTo(ox, fy + r * 0.36); g.stroke();
      g.fillStyle = PINK; g.beginPath(); g.moveTo(ox - r * 0.07, fy + r * 0.09); g.lineTo(ox + r * 0.07, fy + r * 0.09); g.lineTo(ox, fy + r * 0.16); g.closePath(); g.fill();
      g.strokeStyle = "#B07A6A"; g.lineWidth = r * 0.03; g.lineCap = "round"; g.beginPath();
      g.moveTo(ox, fy + r * 0.16); g.lineTo(ox, fy + r * 0.21); g.moveTo(ox, fy + r * 0.21); g.quadraticCurveTo(ox - r * 0.06, fy + r * 0.25, ox - r * 0.1, fy + r * 0.22);
      g.moveTo(ox, fy + r * 0.21); g.quadraticCurveTo(ox + r * 0.06, fy + r * 0.25, ox + r * 0.1, fy + r * 0.22); g.stroke();
      g.fillStyle = "rgba(120,90,70,.5)"; [-1, 1].forEach(function (s) { [0.17, 0.23].forEach(function (y, n) { g.beginPath(); g.arc(ox + s * r * (0.18 + n * 0.04), fy + r * y, r * 0.016, 0, 7); g.fill(); }); });
      g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = r * 0.012;                      // whiskers, pale against the fur
      [-1, 1].forEach(function (s) { [-0.04, 0.04].forEach(function (a) { g.beginPath(); g.moveTo(ox + s * r * 0.24, fy + r * 0.2); g.lineTo(ox + s * r * 0.52, fy + r * (0.17 + a * 2)); g.stroke(); }); });
    }
    if (on("eyes")) face(g, F.cx, fy, r, F.eyes, F.dx, F.o.adult, "eyes");
  },
  paw: { col: function () { return CREAM; }, x: 0.84, y: 0.3 }
};

export default {
  id: "rabbit", label: "Bunny", tg: 2.75, editor: true, sleeps: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "tail", "earL", "earR", "body", "paw", "nose", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.42, -0.08], footR: [0.42, -0.08], tail: [0.75, -0.5], earL: [-0.3, -1.66], earR: [0.3, -1.66], nose: [0.1, -0.95], paw: [0.74, -0.95] } },
  hat: [0, -1.95, 0],
  timers: ["rtwL", "rtwR", "sniff", "binky", "thump"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl, hop = Math.abs(Math.sin(M.ph)) * M.g;
    var bk = M.spike(t.binky, 0.9);                                                // the binky's twist
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") { var th = t.thump > 0 ? -0.05 * Math.max(0, Math.sin(time * 26)) : 0; return [0, 0, M.stepR + th]; }
    if (p === "body") return [0.12 * bk, 0, sl * (0.05 + 0.012 * Math.sin(time * 1.6))];
    if (p === "nose") return [0.12 * bk, 0, sl * 0.06 + aw * (0.012 * Math.sin(time * 18) * (t.sniff > 0 ? 1 : 0.35))];
    if (p === "tail") return [0.15 * Math.sin(time * 9) * hop, 0, -0.05 * hop + sl * 0.05];
    if (p === "earL" || p === "earR") { var s = p === "earL" ? -1 : 1, tw = M.spike(p === "earL" ? t.rtwL : t.rtwR, 0.35);
      // up and swaying, folded back on the hop, flat out to the sides asleep, pricked when startled
      var up = aw * (s * (0.05 * Math.sin(time * 1.3 + s) * M.idle + 0.38 * hop - 0.4 * tw + 0.5 * bk) - (t.startle > 0 ? s * 0.12 : 0));
      return [up + sl * s * 0.55, sl * s * 0.06, sl * 0.62]; }
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.rtwL > 0) && R() < dt * 0.35) t.rtwL = 0.35; if (!(t.rtwR > 0) && R() < dt * 0.35) t.rtwR = 0.35;
    if (!(t.sniff > 0) && R() < dt * 0.3) t.sniff = 1.4;
    if (still && t.happy > 0 && !(t.binky > 0) && R() < dt * 0.5) { t.binky = 0.9; t.jump = 0.6; }
    else if (still && !(t.binky > 0) && R() < dt * 0.02) { t.binky = 0.9; t.jump = 0.6; }
    if (t.startle > 1.1 && !(t.thump > 0)) t.thump = 0.8;
  }
};
