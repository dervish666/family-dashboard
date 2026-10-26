// Tawny owl, front-facing, on the shared rig: an egg of a body, ear tufts, a pale heart of a
// facial disc with big amber eyes and a hooked beak, a speckled chest and wings folded at the
// sides. It turns its head to look about, tilts it at whatever it is listening to, and now
// and then rouses with a flap of both wings. Walking is a waddle. Asleep it sinks down into
// its feathers, tufts flat and wings drawn in.
import { on, rimmed, shade, mix, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const FEATHER = "#B5865A", WING = "#86603E", DISC = "#F3E3C6", CHEST = "#F0DDBB", TALON = "#E8A93A";

// The adult stretch, for the wings drawn outside it.
function stretch(g, F, draw) {
  if (!F.o.adult) { draw(); return; }
  g.save(); g.translate(F.cx, F.feet); g.scale(0.84, F.S); g.translate(-F.cx, -F.feet); draw(); g.restore();
}

const SHAPE = {
  col: function () { return FEATHER; },
  light: 0.3,
  feet: function (g, F) {                                 // three stubby toes a side
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1];
      [-0.12, 0, 0.12].forEach(function (o) {
        rimmed(g, "#A86E1E", TALON, F.grow * 0.8, function (e) { g.beginPath();
          g.ellipse(cx + s * r * 0.3 + r * o * 1.1, cy + r * 0.86, r * 0.07 + e, r * 0.1 + e, o * 2, 0, 7); g.fill(); }); }); });
  },
  ear: function (g, F, s) {                               // the tufts
    var cx = F.cx, cy = F.cy, r = F.r;
    // a slim feathered tuft leaning out, with a notch at its tip
    rimmed(g, shade(WING, 0.7), WING, F.grow, function (e) { g.beginPath();
      g.moveTo(cx + s * (r * 0.34 - e), cy - r * 0.8 + e);
      g.quadraticCurveTo(cx + s * r * 0.5, cy - r * 1.06, cx + s * (r * 0.74 + e), cy - r * 1.36 - e);
      g.lineTo(cx + s * r * 0.72, cy - r * 1.2);
      g.lineTo(cx + s * (r * 0.84 + e), cy - r * 1.26 - e);
      g.quadraticCurveTo(cx + s * r * 0.8, cy - r * 0.94, cx + s * (r * 0.66 + e), cy - r * 0.66 + e); g.closePath(); g.fill(); });
    g.strokeStyle = shade(FEATHER, 1.1); g.lineWidth = r * 0.035; g.lineCap = "round"; g.beginPath();
    g.moveTo(cx + s * r * 0.5, cy - r * 0.82); g.quadraticCurveTo(cx + s * r * 0.6, cy - r * 1.0, cx + s * r * 0.72, cy - r * 1.18); g.stroke();
  },
  body: function (g, F, e) {                              // an egg, fuller at the bottom
    var cx = F.cx, cy = F.cy, r = F.r;
    g.beginPath(); g.moveTo(cx, cy - r * 0.98 - e);
    g.bezierCurveTo(cx + r * 0.72 + e, cy - r * 0.98 - e, cx + r * 1.04 + e, cy - r * 0.2, cx + r * 0.96 + e, cy + r * 0.38);
    g.bezierCurveTo(cx + r * 0.9 + e, cy + r * 0.86 + e, cx + r * 0.4, cy + r * 0.95 + e, cx, cy + r * 0.95 + e);
    g.bezierCurveTo(cx - r * 0.4, cy + r * 0.95 + e, cx - r * 0.9 - e, cy + r * 0.86 + e, cx - r * 0.96 - e, cy + r * 0.38);
    g.bezierCurveTo(cx - r * 1.04 - e, cy - r * 0.2, cx - r * 0.72 - e, cy - r * 0.98 - e, cx, cy - r * 0.98 - e);
    g.closePath(); g.fill();
  },
  belly: function (g, F) {                                // the pale chest and its rows of little chevrons
    var cx = F.cx, cy = F.cy, r = F.r;
    g.fillStyle = CHEST; g.beginPath(); g.ellipse(cx, cy + r * 0.36, r * 0.56, r * 0.52, 0, 0, 7); g.fill();
    g.strokeStyle = shade(FEATHER, 0.8); g.lineWidth = r * 0.045; g.lineCap = "round";
    [[0.12, [-0.24, 0, 0.24]], [0.34, [-0.34, -0.12, 0.12, 0.34]], [0.56, [-0.24, 0, 0.24]], [0.74, [-0.12, 0.12]]].forEach(function (row) {
      row[1].forEach(function (x) { var px = cx + r * x, py = cy + r * row[0];
        g.beginPath(); g.moveTo(px - r * 0.06, py - r * 0.03); g.lineTo(px, py + r * 0.03); g.lineTo(px + r * 0.06, py - r * 0.03); g.stroke(); }); });
  },
  front: function (g, F) {                                // the folded wings, scalloped
    var cx = F.cx, cy = F.cy, r = F.r;
    [["wingL", -1], ["wingR", 1]].forEach(function (w) { if (!on(w[0])) return; var s = w[1];
      stretch(g, F, function () {
        rimmed(g, shade(WING, 0.62), WING, F.grow, function (e) { g.beginPath();
          g.moveTo(cx + s * r * 0.7, cy - r * 0.42 - e);
          g.bezierCurveTo(cx + s * (r * 1.12 + e), cy - r * 0.3, cx + s * (r * 1.12 + e), cy + r * 0.5, cx + s * r * 0.78, cy + r * 0.86 + e);
          g.bezierCurveTo(cx + s * (r * 0.6 - e), cy + r * 0.5, cx + s * (r * 0.56 - e), cy - r * 0.1, cx + s * r * 0.7, cy - r * 0.42 - e);
          g.closePath(); g.fill(); });
        g.strokeStyle = mix(WING, "#F3E3C6", 0.35); g.lineWidth = r * 0.04; g.lineCap = "round";
        [0.05, 0.3, 0.55].forEach(function (y) { g.beginPath(); g.arc(cx + s * r * 0.86, cy + r * y, r * 0.13, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); });
      }); });
  },
  faceY: 0.3,
  face: function (g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx, eyes = F.eyes, adult = F.o.adult;
    if (on("disc")) {                                      // the facial disc: two pale lobes, a brown rim, the beak
      rimmed(g, shade(FEATHER, 0.82), DISC, F.grow, function (e) {
        [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.26, fy, r * 0.37 + e, r * 0.38 + e, s * -0.15, 0, 7); g.fill(); }); });
      g.fillStyle = shade(DISC, 0.94);
      [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.25, fy + r * 0.06, r * 0.24, r * 0.25, 0, 0, 7); g.fill(); });
      g.fillStyle = shade(FEATHER, 0.86); g.beginPath();                                      // the V between the eyes
      g.moveTo(ox - r * 0.1, fy - r * 0.34); g.lineTo(ox, fy - r * 0.04); g.lineTo(ox + r * 0.1, fy - r * 0.34); g.closePath(); g.fill();
      if (!adult) { g.fillStyle = "rgba(255,120,150,.4)";
        [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.36, fy + r * 0.2, r * 0.1, r * 0.06, 0, 0, 7); g.fill(); }); }
      rimmed(g, "#5A4A3A", "#E9C26A", F.grow * 0.6, function (e) { g.beginPath();      // the beak
        g.moveTo(ox - r * 0.075 - e, fy + r * 0.05); g.lineTo(ox + r * 0.075 + e, fy + r * 0.05);
        g.quadraticCurveTo(ox + r * 0.05, fy + r * 0.2, ox, fy + r * 0.25 + e); g.quadraticCurveTo(ox - r * 0.05, fy + r * 0.2, ox - r * 0.075 - e, fy + r * 0.05); g.fill(); });
    }
    if (on("eyes")) {                                      // big amber eyes
      var sz = eyes === "wide" ? 1.18 : 1, ey = fy - r * 0.02;
      [-1, 1].forEach(function (s) { var ex = ox + s * r * 0.25;
        g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.06;
        if (eyes === "open" || eyes === "wide") {
          g.fillStyle = "#3A2A1E"; g.beginPath(); g.arc(ex, ey, r * 0.19 * sz, 0, 7); g.fill();
          g.fillStyle = "#F4AE2E"; g.beginPath(); g.arc(ex, ey, r * 0.165 * sz, 0, 7); g.fill();
          g.fillStyle = INK; g.beginPath(); g.arc(ex + s * r * 0.01, ey + r * 0.01, r * (eyes === "wide" ? 0.13 : 0.1), 0, 7); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.05, ey - r * 0.06, r * 0.045, 0, 7); g.fill();
          g.beginPath(); g.arc(ex + r * 0.04, ey + r * 0.05, r * 0.018, 0, 7); g.fill();
          if (adult) { g.strokeStyle = shade(FEATHER, 0.6); g.lineWidth = r * 0.05;              // heavier lids
            g.beginPath(); g.arc(ex, ey, r * 0.19, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
        } else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.14, ey); g.quadraticCurveTo(ex, ey + r * 0.09, ex + r * 0.14, ey); g.stroke(); }
        else { g.beginPath(); g.moveTo(ex - r * 0.14, ey + r * 0.04); g.quadraticCurveTo(ex, ey - r * 0.12, ex + r * 0.14, ey + r * 0.04); g.stroke(); } });
    }
  },
  phones: [-0.1, 1.02],
  paw: { col: function () { return WING; }, x: 0.92, y: 0.05 }
};

export default {
  id: "owl", label: "Owl", tg: 2.45, editor: true, sleeps: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "earL", "earR", "body", "wingL", "wingR", "paw", "disc", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.3, -0.06], footR: [0.3, -0.06], earL: [-0.42, -1.7], earR: [0.42, -1.7], wingL: [-0.8, -1.3], wingR: [0.8, -1.3],
      disc: [0.1, -1.22], eyes: [0.1, -1.22], paw: [0.82, -1.0] } },
  hat: [0, -1.98, 0],
  timers: ["swivel", "tilt", "rouse", "otuftL", "otuftR"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl;
    var sway = 0.05 * Math.sin(M.ph) * M.g * aw;                                  // the waddle, side to side
    var sink = sl * (0.06 + 0.015 * Math.sin(time * 1.4)) + aw * 0.006 * Math.sin(time * 2.1) * M.idle;   // breathing; deeper asleep
    // the head turn: round, a hold, and back
    var turn = 0; if (t.swivel > 0) { var k = 1 - t.swivel / 2.2; turn = (t.swivelDir || 1) * Math.sin(Math.min(1, k * 3) * Math.PI / 2) * Math.min(1, (1 - k) * 4); }
    var tilt = M.spike(t.tilt, 1.6) * (t.tiltDir || 1) * 0.32 * aw;
    var flap = M.spike(t.rouse, 0.9);
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "body") return [0, sway, sink];
    if (p === "disc" || p === "eyes") return [tilt + 0.06 * turn, sway + 0.16 * turn * aw, sink * 1.3];
    if (p === "earL") return [-0.55 * sl - M.spike(t.otuftL, 0.3) * 0.3 + tilt * 0.6 + 0.12 * flap, sway + 0.1 * turn * aw - 0.04 * sl, sink * 1.3 + 0.05 * sl];
    if (p === "earR") return [0.55 * sl + M.spike(t.otuftR, 0.3) * 0.3 + tilt * 0.6 - 0.12 * flap, sway + 0.1 * turn * aw + 0.04 * sl, sink * 1.3 + 0.05 * sl];
    if (p === "wingL" || p === "wingR") { var s = p === "wingL" ? -1 : 1;
      return [s * (0.14 * Math.abs(Math.sin(M.ph)) * M.g + flap * (0.9 + 0.35 * Math.sin(time * 34)) - 0.06 * sl), sway - s * 0.03 * sl, sink]; }
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (still && !(t.swivel > 0) && R() < dt * 0.09) { t.swivel = 2.2; t.swivelDir = R() < 0.5 ? -1 : 1; }
    if (!(t.tilt > 0) && !(t.swivel > 0) && R() < dt * 0.07) { t.tilt = 1.6; t.tiltDir = R() < 0.5 ? -1 : 1; }
    if (!(t.otuftL > 0) && R() < dt * 0.2) t.otuftL = 0.3; if (!(t.otuftR > 0) && R() < dt * 0.2) t.otuftR = 0.3;
    if (still && !(t.rouse > 0) && R() < dt * 0.025) { t.rouse = 0.9; t.jump = 0.45; t.wait = Math.max(t.wait, 1.2); }
  }
};
