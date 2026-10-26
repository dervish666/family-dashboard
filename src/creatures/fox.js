// Fox, front-facing, on the shared rig: tall black-tipped ears, a white bib and cheeks,
// dark socks, and a brush of a tail that swishes. Flicks its ears, and when it has been
// standing still a while it crouches and pounces on nothing at all.
// (The meadow's wild foxes that chase the grazers are the older whole sprite in classic.js.)
import { on, rimmed, shade, face } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const FUR = "#E07B39", SOCK = "#3A2A22", WHITE = "#FFF4E6";

const SHAPE = {
  col: function () { return FUR; },
  light: 0.28,
  feet: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, "#1E1612", SOCK, F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.4, cy + r * 0.82, r * 0.22 + e, r * 0.13 + e, 0, 0, 7); g.fill(); }); });
  },
  tail: function (g, F) {                                 // the brush, curling up behind on the left, white tip
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(FUR, 0.95), F.grow, function (e) { g.beginPath();
      g.moveTo(cx - r * 0.6, cy + r * 0.55 + e);
      g.quadraticCurveTo(cx - r * 1.55 - e, cy + r * 0.7 + e, cx - r * 1.6 - e, cy - r * 0.2);
      g.quadraticCurveTo(cx - r * 1.62 - e, cy - r * 0.95 - e, cx - r * 1.2, cy - r * 1.05 - e);
      g.quadraticCurveTo(cx - r * 1.05, cy - r * 0.4, cx - r * 0.55, cy + r * 0.05 - e); g.closePath(); g.fill(); });
    g.fillStyle = WHITE; g.beginPath();
    g.moveTo(cx - r * 1.58, cy - r * 0.55);
    g.quadraticCurveTo(cx - r * 1.62, cy - r * 0.95, cx - r * 1.2, cy - r * 1.05);
    g.quadraticCurveTo(cx - r * 1.14, cy - r * 0.78, cx - r * 1.3, cy - r * 0.6); g.closePath(); g.fill();
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    var tri = function (e) { g.beginPath(); g.moveTo(cx + s * (r * 0.16 - e), cy - r * 0.7);
      g.lineTo(cx + s * (r * 0.86 + e), cy - r * 0.42); g.lineTo(cx + s * r * 0.64, cy - r * 1.38 - e); g.closePath(); g.fill(); };
    rimmed(g, F.rim, FUR, F.grow, tri);
    g.fillStyle = "#FFE3CF"; g.beginPath(); g.moveTo(cx + s * r * 0.34, cy - r * 0.68);
    g.lineTo(cx + s * r * 0.7, cy - r * 0.52); g.lineTo(cx + s * r * 0.62, cy - r * 1.1); g.closePath(); g.fill();
    g.fillStyle = SOCK; g.beginPath(); g.moveTo(cx + s * r * 0.55, cy - r * 1.12);                 // black tips
    g.lineTo(cx + s * r * 0.75, cy - r * 1.06); g.lineTo(cx + s * r * 0.64, cy - r * 1.38); g.closePath(); g.fill();
  },
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy, F.r + e, F.r * 0.9 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {                                // the white bib, a soft V down the chest
    var cx = F.cx, cy = F.cy, r = F.r;
    g.fillStyle = WHITE; g.globalAlpha = 0.95; g.beginPath();
    g.moveTo(cx - r * 0.42, cy - r * 0.05); g.quadraticCurveTo(cx, cy + r * 0.25, cx + r * 0.42, cy - r * 0.05);
    g.quadraticCurveTo(cx + r * 0.5, cy + r * 0.62, cx, cy + r * 0.82); g.quadraticCurveTo(cx - r * 0.5, cy + r * 0.62, cx - r * 0.42, cy - r * 0.05);
    g.fill(); g.globalAlpha = 1;
  },
  face: function (g, F) {
    var cx = F.cx, r = F.r, fy = F.fy, dx = F.dx, ox = cx + dx;
    if (on("body")) {
      g.fillStyle = WHITE;                                 // cheeks: the fox mask
      [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.3, fy + r * 0.2, r * 0.3, r * 0.2, s * 0.25, 0, 7); g.fill(); });
      g.beginPath(); g.ellipse(ox, fy + r * 0.24, r * 0.2, r * 0.16, 0, 0, 7); g.fill();
      face(g, cx, fy, r, F.eyes, dx, F.o.adult, "rest");
      g.fillStyle = "#2B2433"; g.beginPath(); g.ellipse(ox, fy + r * 0.1, r * 0.085, r * 0.06, 0, 0, 7); g.fill();   // nose
      g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(ox - r * 0.03, fy + r * 0.08, r * 0.022, 0, 7); g.fill();
    }
    if (on("eyes")) face(g, cx, fy, r, F.eyes, dx, F.o.adult, "eyes");
  },
  paw: { col: function () { return SOCK; }, x: 0.86, y: 0.25 }
};

export default {
  id: "fox", label: "Fox", tg: 2.6, editor: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "tail", "earL", "earR", "body", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.4, -0.12], footR: [0.4, -0.12], tail: [-0.62, -0.6], earL: [-0.42, -1.55], earR: [0.42, -1.55], paw: [0.76, -0.95] } },
  hat: [0, -1.86, 0],
  timers: ["fflickL", "fflickR", "swish", "pounce"],
  anim: function (t, p, time, M) {
    var crouch = t.pounce > 0 ? Math.min(1, t.pounce / 0.3, (1.2 - t.pounce) / 0.2) : 0;   // ears forward, tail up, then the leap
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "tail") return [0.12 * Math.sin(time * 1.7) * M.idle + 0.22 * Math.sin(M.ph - 0.8) * M.g + 0.4 * Math.sin(time * 15) * M.spike(t.swish, 0.9) - 0.35 * crouch, 0, 0];
    if (p === "earL") return [-M.spike(t.fflickL, 0.3) * 0.5 + 0.08 * Math.sin(M.ph - 0.6) * M.g + 0.25 * crouch, 0, 0.03 * crouch];
    if (p === "earR") return [M.spike(t.fflickR, 0.3) * 0.5 - 0.08 * Math.sin(M.ph - 0.6) * M.g - 0.25 * crouch, 0, 0.03 * crouch];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.fflickL > 0) && R() < dt * 0.3) t.fflickL = 0.3; if (!(t.fflickR > 0) && R() < dt * 0.3) t.fflickR = 0.3;
    if (!(t.swish > 0) && R() < dt * 0.12) t.swish = 0.9;
    if (still && !(t.pounce > 0) && R() < dt * 0.04) { t.pounce = 1.2; t.wait = Math.max(t.wait, 1.5); }
    if (t.pounce > 0 && t.pounce - dt <= 0.35 && t.pounce > 0.35) t.jump = 0.6;            // the leap, on the engine's hop
  }
};
