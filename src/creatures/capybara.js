// Capybara, front-facing. A rounded box of a body, nub ears that flick, a snout that is
// its own piece so it can chew, eyes under heavy lids, and a yuzu balanced on its head.
import { on, rimmed, shade, mix, rr, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const SHAPE = {
  feet: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, F.rim, shade(F.col, 0.82), F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.42, cy + r * 0.81, r * 0.24 + e, r * 0.14 + e, 0, 0, 7); g.fill(); }); });
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.9), F.grow, function (e) { g.beginPath(); g.arc(cx + s * r * 0.58, cy - r * 0.76, r * 0.13 + e, 0, 7); g.fill(); });
    g.fillStyle = shade(F.col, 0.62); g.beginPath(); g.arc(cx + s * r * 0.58, cy - r * 0.76, r * 0.06, 0, 7); g.fill();
  },
  body: function (g, F, e) { var r = F.r; rr(g, F.cx - r * 1.0 - e, F.cy - r * 0.86 - e, r * 2 + 2 * e, r * 1.76 + 2 * e, r * 0.62 + e); g.fill(); },
  belly: function (g, F) {
    var r = F.r;
    g.fillStyle = mix(F.col, "#ffffff", 0.4);
    g.globalAlpha = 0.85; g.beginPath(); g.ellipse(F.cx, F.cy + r * 0.42, r * 0.56, r * 0.36, 0, 0, 7);
    g.fill(); g.globalAlpha = 1;
  },
  face: function (g, F) {
    if (on("muzzle")) capyMuzzle(g, F.cx + F.dx, F.fy, F.r, F.col);
    if (on("eyes")) capyEyes(g, F.cx + F.dx, F.fy, F.r, F.eyes, F.col);
  },
  extra: function (g, F) {
    if (!on("yuzu")) return;
    var r = F.r, yx = F.cx + r * 0.04, yy = F.headTop - r * 0.14;
    rimmed(g, "#C27A12", "#F7B32B", F.grow, function (e) { g.beginPath(); g.arc(yx, yy, r * 0.24 + e, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(yx - r * 0.08, yy - r * 0.08, r * 0.07, 0, 7); g.fill();
    g.fillStyle = "#5FA84F"; g.beginPath(); g.ellipse(yx + r * 0.12, yy - r * 0.24, r * 0.12, r * 0.06, -0.5, 0, 7); g.fill();
  },
  paw: { col: function (F) { return shade(F.col, 0.82); }, x: 0.86, y: 0.3 }
};

// The snout is its own piece so it can chew; the eyes sit under heavy lids.
function capyMuzzle(g, x, fy, r, col) {
  g.fillStyle = shade(col, 0.8); rr(g, x - r * 0.4, fy + r * 0.02, r * 0.8, r * 0.46, r * 0.2); g.fill();
  g.fillStyle = "rgba(43,36,51,.75)";
  [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(x + s * r * 0.14, fy + r * 0.12, r * 0.05, r * 0.035, 0, 0, 7); g.fill(); });
  g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.04;
  g.beginPath(); g.moveTo(x - r * 0.08, fy + r * 0.34); g.quadraticCurveTo(x, fy + r * 0.38, x + r * 0.08, fy + r * 0.34); g.stroke();
}
function capyEyes(g, x, fy, r, eyes, col) {
  [-1, 1].forEach(function (s) { var ex = x + s * r * 0.34, ey = fy - r * 0.16;
    g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.055;
    if (eyes === "open") { g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, r * 0.075, r * 0.07, 0, 0, 7); g.fill();
      g.fillStyle = col; g.fillRect(ex - r * 0.09, ey - r * 0.09, r * 0.18, r * 0.07);
      g.beginPath(); g.moveTo(ex - r * 0.09, ey - r * 0.02); g.lineTo(ex + r * 0.09, ey - r * 0.02); g.stroke(); }
    else if (eyes === "wide") { g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, r * 0.095, r * 0.095, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.03, ey - r * 0.03, r * 0.03, 0, 7); g.fill(); }
    else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.08, ey); g.quadraticCurveTo(ex, ey + r * 0.05, ex + r * 0.08, ey); g.stroke(); }
    else { g.beginPath(); g.moveTo(ex - r * 0.08, ey + r * 0.03); g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03); g.stroke(); } });
}

export default {
  id: "capybara", label: "Capybara", tg: 2.6, editor: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "earL", "earR", "body", "paw", "muzzle", "eyes", "yuzu"], eyesIn: "eyes",
    piv: { footL: [-0.35, -0.14], footR: [0.35, -0.14], earL: [-0.47, -1.85], earR: [0.47, -1.85],
      muzzle: [0.08, -1.17], yuzu: [0.04, -1.95], paw: [0.76, -0.9] } },
  hat: [-0.3, -2.02, -0.35],
  timers: ["flickL", "flickR", "chew"],
  anim: function (t, p, time, M) {
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "earL") return [-M.spike(t.flickL, 0.35) * 0.6 + 0.1 * Math.sin(M.ph - 0.7) * M.g, 0, 0];
    if (p === "earR") return [M.spike(t.flickR, 0.35) * 0.6 - 0.1 * Math.sin(M.ph - 0.7) * M.g, 0, 0];
    if (p === "muzzle") { var ch = t.chew > 0 || t.munch > 0 ? Math.abs(Math.sin(time * 6)) : 0; return [0.05 * ch, 0, 0.04 * ch]; }
    if (p === "yuzu") return [0.1 * Math.sin(M.ph - 0.9) * M.g + 0.04 * Math.sin(time * 1.5), 0, -0.05 * Math.abs(Math.sin(M.ph - 0.9)) * M.g];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still, A) {
    var R = Math.random;
    if (still && !(t.chew > 0) && R() < dt * 0.25) t.chew = A.rand(2, 5);
    if (!(t.flickL > 0) && R() < dt * 0.3) t.flickL = 0.35; if (!(t.flickR > 0) && R() < dt * 0.3) t.flickR = 0.35;
  }
};
