// Otter, front-facing. A rudder of a tail that curls, whiskers that twitch, and in the
// water it floats on its back juggling a pebble (the engine draws the float).
import { on, rimmed, shade, face } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";
import { waterDip } from "./swim.js";

const SHAPE = {
  col: function () { return "#8B6247"; },
  light: 0.22,
  feet: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, F.rim, "#5A3E2C", F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.44, cy + r * 0.81, r * 0.27 + e, r * 0.13 + e, 0, 0, 7); g.fill(); }); });
  },
  tail: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.9), F.grow, function (e) { g.beginPath();
      g.moveTo(cx - r * 0.7, cy - r * 0.05 - e); g.quadraticCurveTo(cx - r * 1.4, cy + r * 0.05, cx - r * 1.65 - e, cy + r * 0.6);
      g.quadraticCurveTo(cx - r * 1.25, cy + r * 0.45, cx - r * 0.7, cy + r * 0.45 + e); g.closePath(); g.fill(); });
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.85), F.grow, function (e) { g.beginPath(); g.arc(cx + s * r * 0.6, cy - r * 0.68, r * 0.14 + e, 0, 7); g.fill(); });
  },
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy, F.r + e, F.r * 0.9 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {
    var r = F.r;
    g.fillStyle = "#EBD6BC";
    g.globalAlpha = 0.85; g.beginPath(); g.ellipse(F.cx, F.cy + r * 0.42, r * 0.56, r * 0.36, 0, 0, 7);
    g.fill(); g.globalAlpha = 1;
  },
  face: function (g, F) {
    var cx = F.cx, r = F.r, fy = F.fy, dx = F.dx, eyes = F.eyes, ox = cx + dx;
    if (on("body")) { g.fillStyle = "#EBD6BC"; g.beginPath(); g.ellipse(ox, fy + r * 0.18, r * 0.34, r * 0.23, 0, 0, 7); g.fill();
      face(g, cx, fy, r, eyes, dx, false, "rest");
      g.fillStyle = "#3A2A22"; g.beginPath(); g.ellipse(ox, fy + r * 0.1, r * 0.08, r * 0.055, 0, 0, 7); g.fill(); }
    if (on("eyes")) face(g, cx, fy, r, eyes, dx, false, "eyes");
    if (on("whiskers")) { g.strokeStyle = "rgba(90,62,44,.8)"; g.lineWidth = r * 0.025; g.lineCap = "round";
      [-1, 1].forEach(function (s) { [-0.06, 0.02, 0.1].forEach(function (o2) { g.beginPath();
        g.moveTo(ox + s * r * 0.2, fy + r * (0.18 + o2 * 0.5)); g.lineTo(ox + s * r * 0.48, fy + r * (0.12 + o2 * 1.4)); g.stroke(); }); }); }
  },
  paw: { col: function () { return "#5A3E2C"; }, x: 0.9, y: 0.05 }
};

export default {
  id: "otter", label: "Otter", tg: 2.55, editor: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "tail", "body", "paw", "whiskers", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.44, -0.1], footR: [0.44, -0.1], tail: [-0.7, -0.72], whiskers: [0.1, -0.82], paw: [0.8, -1.12] } },
  hat: [-0.14, -1.84, -0.15],
  timers: ["curl", "twitch"],
  anim: function (t, p, time, M) {
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "tail") return [0.16 * Math.sin(time * 1.6) - 0.35 * M.spike(t.curl, 1.6) + 0.22 * Math.sin(M.ph - 0.8) * M.g, 0, 0];
    if (p === "whiskers") return [0.1 * Math.sin(time * 30) * M.spike(t.twitch, 0.5), 0, -0.02 * M.spike(t.twitch, 0.5)];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt) {
    var R = Math.random;
    if (!(t.curl > 0) && R() < dt * 0.15) t.curl = 1.6; if (!(t.twitch > 0) && R() < dt * 0.4) t.twitch = 0.5;
  },
  habits: waterDip
};
