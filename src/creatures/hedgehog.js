// Hedgehog, front-facing, on the shared rig: a crown of spines behind a pale round face,
// a pointed snout with a black button nose, and little round ears. Snuffles about with its
// snout, and when something makes it jump its spines bristle up.
import { on, rimmed, shade, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const FACE = "#E8CBA4", SPINE = "#7A5A40", TIP = "#D8C2A2";

const SHAPE = {
  col: function () { return FACE; },
  light: 0.35,
  feet: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, "#5A4030", "#8C6A4E", F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.38, cy + r * 0.84, r * 0.2 + e, r * 0.12 + e, 0, 0, 7); g.fill(); }); });
  },
  back: function (g, F) {                                 // the spines: a zig-zag crown round the top and sides
    if (!on("spines")) return;
    var cx = F.cx, cy = F.cy, r = F.r, n = 15;
    var crown = function (e) { g.beginPath();
      for (var i = 0; i <= n; i++) { var a = Math.PI * (0.98 + 1.04 * i / n);
        var ro = r * 1.32 + e, ri = r * 0.98 + e, am = a + Math.PI * 0.52 / n;
        var x0 = cx + Math.cos(a) * ri, y0 = cy + r * 0.12 + Math.sin(a) * ri * 0.98;
        if (i === 0) g.moveTo(x0, y0); else g.lineTo(x0, y0);
        if (i < n) g.lineTo(cx + Math.cos(am) * ro, cy + r * 0.12 + Math.sin(am) * ro * 0.98); }
      g.lineTo(cx + r * 0.9, cy + r * 0.6); g.lineTo(cx - r * 0.9, cy + r * 0.6); g.closePath(); g.fill(); };
    rimmed(g, "#3E2C20", SPINE, F.grow, crown);
    g.strokeStyle = TIP; g.lineWidth = r * 0.045; g.lineCap = "round";            // pale tips on a few spines
    for (var i = 1; i < n; i += 2) { var a = Math.PI * (0.98 + 1.04 * i / n) + Math.PI * 0.52 / n;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 1.14, cy + r * 0.12 + Math.sin(a) * r * 1.12);
      g.lineTo(cx + Math.cos(a) * r * 1.28, cy + r * 0.12 + Math.sin(a) * r * 1.26); g.stroke(); }
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, shade(FACE, 0.55), shade(FACE, 0.92), F.grow, function (e) { g.beginPath(); g.arc(cx + s * r * 0.58, cy - r * 0.74, r * 0.16 + e, 0, 7); g.fill(); });
    g.fillStyle = "#D99A8C"; g.beginPath(); g.arc(cx + s * r * 0.58, cy - r * 0.74, r * 0.075, 0, 7); g.fill();
  },
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy + F.r * 0.06, F.r * 0.86 + e, F.r * 0.84 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {
    var r = F.r;
    g.fillStyle = "#FFF1DD"; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(F.cx, F.cy + r * 0.46, r * 0.48, r * 0.32, 0, 0, 7);
    g.fill(); g.globalAlpha = 1;
  },
  faceY: 0.1,
  face: function (g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx, eyes = F.eyes;
    if (on("body") && !F.o.adult) {                       // cheeks
      g.fillStyle = "rgba(255,120,150,.42)";
      [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.4, fy + r * 0.2, r * 0.13, r * 0.08, 0, 0, 7); g.fill(); });
    }
    if (on("snout")) {                                     // the snout, its own piece so it can snuffle
      rimmed(g, shade(FACE, 0.78), "#F6E3C8", F.grow * 0.5, function (e) { g.beginPath();
        g.ellipse(ox, fy + r * 0.17, r * 0.21 + e, r * 0.15 + e, 0, 0, 7); g.fill(); });
      g.fillStyle = INK; g.beginPath(); g.ellipse(ox, fy + r * 0.12, r * 0.08, r * 0.062, 0, 0, 7); g.fill();     // button nose
      g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(ox - r * 0.025, fy + r * 0.1, r * 0.02, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.035; g.beginPath();
      g.arc(ox, fy + r * 0.19, r * 0.07, 0.5, Math.PI - 0.5); g.stroke();
    }
    if (on("eyes")) {                                      // beady
      var ey = fy - r * 0.1, sz = eyes === "wide" ? 1.35 : 1;
      [-1, 1].forEach(function (s) { var ex = ox + s * r * 0.26;
        g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.055;
        if (eyes === "open" || eyes === "wide") { g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, r * 0.075 * sz, r * 0.085 * sz, 0, 0, 7); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.025, ey - r * 0.03, r * 0.028, 0, 7); g.fill(); }
        else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.08, ey); g.quadraticCurveTo(ex, ey + r * 0.05, ex + r * 0.08, ey); g.stroke(); }
        else { g.beginPath(); g.moveTo(ex - r * 0.08, ey + r * 0.03); g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03); g.stroke(); }
        if (F.o.adult && eyes !== "shut") { g.lineWidth = r * 0.04; g.beginPath();
          g.moveTo(ex - r * 0.09, ey - r * 0.17); g.quadraticCurveTo(ex, ey - r * 0.21, ex + r * 0.09, ey - r * 0.16); g.stroke(); } });
    }
  },
  paw: { col: function () { return "#8C6A4E"; }, x: 0.78, y: 0.32 }
};

export default {
  id: "hedgehog", label: "Hedgehog", tg: 2.35, editor: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "spines", "earL", "earR", "body", "paw", "snout", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.38, -0.1], footR: [0.38, -0.1], spines: [0, -0.9], earL: [-0.58, -1.66], earR: [0.58, -1.66], snout: [0.1, -0.92], paw: [0.7, -0.85] } },
  hat: [0.05, -2.02, 0.1],
  timers: ["snuffle", "bristle"],
  anim: function (t, p, time, M) {
    var up = M.spike(t.bristle, 1.2) + (t.startle > 0 ? 0.6 : 0);
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "spines") return [0.03 * Math.sin(time * 2.1) * M.idle + 0.05 * Math.sin(M.ph) * M.g + 0.04 * up * Math.sin(time * 40), 0, -0.06 * up - 0.015 * Math.sin(time * 2.1)];
    if (p === "snout") { var sn = M.spike(t.snuffle, 0.9); return [0.12 * sn * Math.sin(time * 26), 0, -0.02 * sn * Math.abs(Math.sin(time * 13))]; }
    if (p === "earL" || p === "earR") return [0, 0, -0.03 * up];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.snuffle > 0) && R() < dt * (still ? 0.45 : 0.2)) t.snuffle = 0.9;
    if (t.startle > 1.1 && !(t.bristle > 0)) t.bristle = 1.2;
  }
};
