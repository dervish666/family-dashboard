// Cat, front-facing, on the shared rig: a ginger tabby with an M on its forehead, a white
// muzzle and bib, white socks, whiskers, green eyes, a long striped tail curled up behind,
// and a collar in the person's own colour with a bell. Ears flick, the tail swishes, it gives
// the slow blink cats give to someone they like, and now and then it sits and washes a paw.
// Asleep it settles down with its tail laid out along the ground and its ears relaxed.
import { on, rimmed, shade, mix, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const FUR = "#E8A25E", STRIPE = "#C06F35", WHITE = "#FFF6EA", NOSE = "#E88A8A";

const SHAPE = {
  col: function () { return FUR; },
  light: 0.3,
  feet: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      rimmed(g, "#C9B9A6", WHITE, F.grow, function (e) { g.beginPath();
        g.ellipse(cx + s * r * 0.36, cy + r * 0.84, r * 0.2 + e, r * 0.13 + e, 0, 0, 7); g.fill(); });
      g.strokeStyle = "rgba(160,140,120,.6)"; g.lineWidth = r * 0.02;
      [-0.06, 0.06].forEach(function (o) { g.beginPath(); g.moveTo(cx + s * r * 0.36 + r * o, cy + r * 0.78); g.lineTo(cx + s * r * 0.36 + r * o, cy + r * 0.9); g.stroke(); }); });
  },
  tail: function (g, F) {                                 // up behind on the right, a curl at the tip, rings
    var cx = F.cx, cy = F.cy, r = F.r;
    var path = function () { g.beginPath(); g.moveTo(cx + r * 0.6, cy + r * 0.62);
      g.bezierCurveTo(cx + r * 1.45, cy + r * 0.6, cx + r * 1.5, cy - r * 0.3, cx + r * 1.28, cy - r * 0.78);
      g.quadraticCurveTo(cx + r * 1.12, cy - r * 1.08, cx + r * 0.98, cy - r * 0.86); };
    g.lineCap = "round"; g.strokeStyle = shade(FUR, 0.6); g.lineWidth = r * 0.3 + F.grow * 2; path(); g.stroke();
    g.strokeStyle = FUR; g.lineWidth = r * 0.3; path(); g.stroke();
    g.save(); g.strokeStyle = STRIPE; g.lineWidth = r * 0.3; g.setLineDash([r * 0.1, r * 0.2]); g.lineDashOffset = r * 0.05; path(); g.stroke(); g.restore();
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, FUR, F.grow, function (e) { g.beginPath(); g.moveTo(cx + s * (r * 0.14 - e), cy - r * 0.74);
      g.lineTo(cx + s * (r * 0.84 + e), cy - r * 0.5); g.quadraticCurveTo(cx + s * r * 0.78, cy - r * 1.1, cx + s * r * 0.62, cy - r * 1.3 - e); g.closePath(); g.fill(); });
    g.fillStyle = "#F7C2B8"; g.beginPath(); g.moveTo(cx + s * r * 0.32, cy - r * 0.72);
    g.lineTo(cx + s * r * 0.7, cy - r * 0.56); g.quadraticCurveTo(cx + s * r * 0.66, cy - r * 0.96, cx + s * r * 0.6, cy - r * 1.06); g.closePath(); g.fill();
  },
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy, F.r * 0.98 + e, F.r * 0.9 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    g.fillStyle = WHITE; g.beginPath(); g.ellipse(cx, cy + r * 0.48, r * 0.42, r * 0.38, 0, 0, 7); g.fill();
    g.strokeStyle = STRIPE; g.lineWidth = r * 0.07; g.lineCap = "round";                     // stripes down the sides
    [-1, 1].forEach(function (s) { [-0.15, 0.15, 0.45].forEach(function (y) { g.beginPath();
      g.moveTo(cx + s * r * 0.97, cy + r * y); g.quadraticCurveTo(cx + s * r * 0.8, cy + r * (y + 0.03), cx + s * r * 0.7, cy + r * (y + 0.1)); g.stroke(); }); });
  },
  faceY: 0.14,
  face: function (g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx, eyes = F.eyes, adult = F.o.adult;
    if (on("body")) {
      g.strokeStyle = STRIPE; g.lineWidth = r * 0.06; g.lineCap = "round";                  // the tabby M
      [-0.16, 0, 0.16].forEach(function (x) { g.beginPath(); g.moveTo(ox + r * x, fy - r * 0.62); g.lineTo(ox + r * x * 0.7, fy - r * 0.42); g.stroke(); });
      if (!adult) { g.fillStyle = "rgba(255,120,150,.38)";
        [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.42, fy + r * 0.2, r * 0.12, r * 0.07, 0, 0, 7); g.fill(); }); }
      g.fillStyle = WHITE; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.13, fy + r * 0.24, r * 0.16, r * 0.13, 0, 0, 7); g.fill(); });
      g.fillStyle = NOSE; g.beginPath(); g.moveTo(ox - r * 0.07, fy + r * 0.1); g.lineTo(ox + r * 0.07, fy + r * 0.1); g.lineTo(ox, fy + r * 0.17); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = r * 0.035; g.beginPath(); g.moveTo(ox, fy + r * 0.17); g.lineTo(ox, fy + r * 0.22);
      g.moveTo(ox - r * 0.09, fy + r * 0.24); g.quadraticCurveTo(ox - r * 0.045, fy + r * 0.29, ox, fy + r * 0.22);
      g.quadraticCurveTo(ox + r * 0.045, fy + r * 0.29, ox + r * 0.09, fy + r * 0.24); g.stroke();
      g.strokeStyle = "rgba(60,45,40,.55)"; g.lineWidth = r * 0.016;                         // whiskers
      [-1, 1].forEach(function (s) { [-0.05, 0.02, 0.09].forEach(function (a) { g.beginPath(); g.moveTo(ox + s * r * 0.26, fy + r * 0.22);
        g.quadraticCurveTo(ox + s * r * 0.45, fy + r * (0.2 + a), ox + s * r * 0.66, fy + r * (0.18 + a * 2)); g.stroke(); }); });
    }
    if (on("eyes")) {                                      // green, with a dark upright pupil
      var sz = eyes === "wide" ? 1.2 : 1, ey = fy - r * 0.12;
      [-1, 1].forEach(function (s) { var ex = ox + s * r * 0.3;
        g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * (adult ? 0.055 : 0.065);
        if (eyes === "open" || eyes === "wide") {
          g.fillStyle = "#3A3A2A"; g.beginPath(); g.ellipse(ex, ey, r * 0.13 * sz, r * 0.15 * sz, 0, 0, 7); g.fill();
          g.fillStyle = "#A7D46A"; g.beginPath(); g.ellipse(ex, ey, r * 0.11 * sz, r * 0.13 * sz, 0, 0, 7); g.fill();
          g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, r * (eyes === "wide" ? 0.085 : 0.045), r * 0.11 * sz, 0, 0, 7); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.04, ey - r * 0.05, r * 0.03, 0, 7); g.fill();
          if (adult) { g.strokeStyle = shade(FUR, 0.6); g.lineWidth = r * 0.045; g.beginPath(); g.moveTo(ex - r * 0.13, ey - r * 0.1); g.quadraticCurveTo(ex, ey - r * 0.18, ex + r * 0.13, ey - r * 0.1); g.stroke(); }
        } else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.11, ey); g.quadraticCurveTo(ex, ey + r * 0.07, ex + r * 0.11, ey); g.stroke(); }
        else { g.beginPath(); g.moveTo(ex - r * 0.11, ey + r * 0.03); g.quadraticCurveTo(ex, ey - r * 0.08, ex + r * 0.11, ey + r * 0.03); g.stroke(); } });
    }
  },
  extra: function (g, F) {                                // the collar, in the person's colour, and its bell
    if (!on("body")) return;
    var r = F.r, cx = F.cx, y = F.o.adult ? F.fy + r * 0.48 : F.cy + r * 0.3, col = /^#[0-9a-f]{6}$/i.test(F.o.col || "") ? F.o.col : "#D9534F";
    g.strokeStyle = shade(col, 0.7); g.lineWidth = r * 0.14; g.lineCap = "round";
    g.beginPath(); g.arc(cx, y - r * 0.6, r * 0.64, Math.PI * 0.28, Math.PI * 0.72); g.stroke();
    g.strokeStyle = col; g.lineWidth = r * 0.1; g.stroke();
    rimmed(g, "#A87A18", "#F2C94C", F.grow * 0.6, function (e) { g.beginPath(); g.arc(cx, y + r * 0.1, r * 0.08 + e, 0, 7); g.fill(); });
    g.fillStyle = "#8A6410"; g.fillRect(cx - r * 0.05, y + r * 0.11, r * 0.1, r * 0.02);
  },
  phones: [-0.04, 1],
  paw: { col: function () { return WHITE; }, x: 0.84, y: 0.28 }
};

export default {
  id: "cat", label: "Cat", tg: 2.55, editor: true, sleeps: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "tail", "earL", "earR", "body", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.36, -0.08], footR: [0.36, -0.08], tail: [0.62, -0.32], earL: [-0.44, -1.6], earR: [0.44, -1.6], paw: [0.72, -0.95] } },
  hat: [-0.05, -1.95, -0.1],
  timers: ["cflickL", "cflickR", "cswish", "groom", "slowblink"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "tail") return [aw * (0.1 * Math.sin(time * 1.2) * M.idle - 0.25 * M.g + 0.18 * Math.sin(time * 11) * M.spike(t.cswish, 1.0)) + sl * 1.2, -0.1 * sl, sl * 0.06];
    if (p === "body") return [0, 0, sl * (0.04 + 0.012 * Math.sin(time * 1.5))];
    if (p === "eyes") return [0, 0, sl * 0.05];
    if (p === "earL") return [aw * (-M.spike(t.cflickL, 0.3) * 0.5 + (t.startle > 0 ? -0.45 : 0)) - 0.22 * sl, 0, sl * 0.05];
    if (p === "earR") return [aw * (M.spike(t.cflickR, 0.3) * 0.5 + (t.startle > 0 ? 0.45 : 0)) + 0.22 * sl, 0, sl * 0.05];
    if (p === "paw") {
      if (t.groom > 0) { var lick = Math.sin(time * 9) * 0.06;                   // the paw up to the mouth, licked
        return [-0.7 + lick, -0.32, -0.22 + Math.abs(lick)]; }
      return pawWave(M);
    }
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.cflickL > 0) && R() < dt * 0.25) t.cflickL = 0.3; if (!(t.cflickR > 0) && R() < dt * 0.25) t.cflickR = 0.3;
    if (!(t.cswish > 0) && R() < dt * 0.1) t.cswish = 1.0;
    if (still && !(t.slowblink > 0) && R() < dt * 0.06) { t.slowblink = 0.9; t.blinkT = 0.75; }   // the slow blink
    if (still && !(t.groom > 0) && !(t.wave > 0) && R() < dt * 0.035) { t.groom = 2.6; t.wave = 2.6; t.wait = Math.max(t.wait, 3); }
  }
};
