// Frog, front-facing, on the shared rig: a wide squat body with spots, folded back legs at
// its sides, webbed feet, and two eyes up on bumps above a long smile. It croaks with the
// two vocal sacs at the corners of its mouth (they bulge out from behind its cheeks),
// sits very still and then leaps, and asleep it sinks low with its eyes drawn down.
import { on, rimmed, shade, mix, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

const SKIN = "#86C26A", DARK = "#4F8F45", BELLY = "#EEF2C4", SAC = "#F4F0C8";

function eyeBumps(g, F, ox, top) {
  var r = F.r;
  rimmed(g, shade(SKIN, 0.6), SKIN, F.grow, function (e) {
    [-1, 1].forEach(function (s) { g.beginPath(); g.arc(ox + s * r * 0.4, top, r * 0.27 + e, 0, 7); g.fill(); }); });
  g.fillStyle = "rgba(255,255,255,.22)";
  [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.4 - r * 0.08, top - r * 0.12, r * 0.1, r * 0.06, -0.4, 0, 7); g.fill(); });
}

const SHAPE = {
  col: function () { return SKIN; },
  light: 0.28,
  feet: function (g, F) {                                 // webbed, three round-tipped toes, splayed out
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function (f) { if (!on(f[0])) return; var s = f[1], fx = cx + s * r * 0.52, fy = cy + r * 0.86;
      rimmed(g, shade(SKIN, 0.6), mix(SKIN, BELLY, 0.3), F.grow, function (e) {
        g.beginPath(); g.ellipse(fx, fy, r * 0.22 + e, r * 0.1 + e, 0, 0, 7); g.fill();
        [-0.6, 0, 0.6].forEach(function (a) { g.beginPath(); g.arc(fx + s * r * 0.12 + Math.sin(a + s * 0.5) * r * 0.2, fy - r * 0.02 + Math.cos(a) * r * 0.03, r * 0.06 + e, 0, 7); g.fill(); }); }); });
  },
  back: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    if (on("legs")) rimmed(g, shade(SKIN, 0.6), shade(SKIN, 0.92), F.grow, function (e) {   // the folded back legs, haunches out at the sides
      [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(cx + s * r * 0.86, cy + r * 0.55, r * 0.34 + e, r * 0.28 + e, s * -0.5, 0, 7); g.fill(); }); });
    [["sacL", -1], ["sacR", 1]].forEach(function (q) { if (!on(q[0])) return; var s = q[1];   // vocal sacs, hidden behind the cheeks until a croak
      rimmed(g, "#C9C49A", SAC, F.grow, function (e) { g.beginPath(); g.arc(cx + s * r * 0.64, cy + r * 0.05, r * 0.22 + e, 0, 7); g.fill(); });
      g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(cx + s * r * 0.68, cy - r * 0.04, r * 0.07, r * 0.04, 0, 0, 7); g.fill(); });
  },
  ear: function () {},                                    // no ears to speak of
  body: function (g, F, e) { g.beginPath(); g.ellipse(F.cx, F.cy + F.r * 0.12, F.r * 1.02 + e, F.r * 0.8 + e, 0, 0, 7); g.fill(); },
  belly: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    g.fillStyle = BELLY; g.beginPath(); g.ellipse(cx, cy + r * 0.5, r * 0.6, r * 0.38, 0, 0, 7); g.fill();
    g.fillStyle = shade(SKIN, 0.82);                       // a few darker spots on the back
    [[-0.62, -0.18, 0.09], [0.66, -0.1, 0.07], [-0.42, 0.18, 0.06], [0.48, 0.24, 0.08], [0.78, 0.3, 0.05]].forEach(function (d) {
      g.beginPath(); g.ellipse(cx + r * d[0], cy + r * d[1], r * d[2] * 1.3, r * d[2], 0.3, 0, 7); g.fill(); });
  },
  faceY: -0.02,
  face: function (g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx, eyes = F.eyes, top = fy - r * 0.62;
    if (on("body")) {
      if (!F.o.adult) { g.fillStyle = "rgba(255,120,150,.4)";
        [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(ox + s * r * 0.5, fy + r * 0.04, r * 0.13, r * 0.07, 0, 0, 7); g.fill(); }); }
      g.fillStyle = shade(SKIN, 0.55); [-1, 1].forEach(function (s) { g.beginPath(); g.arc(ox + s * r * 0.07, fy - r * 0.14, r * 0.025, 0, 7); g.fill(); });   // nostrils
      g.strokeStyle = shade(SKIN, 0.45); g.lineCap = "round"; g.lineWidth = r * 0.05;          // the long smile
      g.beginPath(); g.moveTo(ox - r * 0.44, fy - r * 0.04); g.quadraticCurveTo(ox, fy + r * (F.o.adult ? 0.14 : 0.2), ox + r * 0.44, fy - r * 0.04); g.stroke();
    }
    if (on("eyes")) {                                      // the bumps carry the eyes, so they blink and droop together
      eyeBumps(g, F, ox, top);
      var sz = eyes === "wide" ? 1.2 : 1;
      [-1, 1].forEach(function (s) { var ex = ox + s * r * 0.4, ey = top + r * 0.02;
        g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.055;
        if (eyes === "open" || eyes === "wide") {
          g.fillStyle = "#FFFDF2"; g.beginPath(); g.arc(ex, ey, r * 0.17 * sz, 0, 7); g.fill();
          g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey + r * 0.01, r * 0.1 * sz, r * (eyes === "wide" ? 0.11 : 0.085), 0, 0, 7); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.04, ey - r * 0.03, r * 0.035, 0, 7); g.fill();
          if (F.o.adult) { g.fillStyle = SKIN; g.fillRect(ex - r * 0.19, ey - r * 0.2, r * 0.38, r * 0.08); }        // a lid half down
        } else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.13, ey); g.quadraticCurveTo(ex, ey + r * 0.08, ex + r * 0.13, ey); g.stroke(); }
        else { g.beginPath(); g.moveTo(ex - r * 0.13, ey + r * 0.04); g.quadraticCurveTo(ex, ey - r * 0.1, ex + r * 0.13, ey + r * 0.04); g.stroke(); } });
    }
  },
  phones: [-0.25, 1.1],
  paw: { col: function () { return mix(SKIN, BELLY, 0.3); }, x: 0.95, y: 0.2 }
};

export default {
  id: "frog", label: "Frog", tg: 2.1, editor: true, sleeps: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["footL", "footR", "legs", "sacL", "sacR", "body", "paw", "eyes"], eyesIn: "eyes",
    piv: { footL: [-0.52, -0.06], footR: [0.52, -0.06], legs: [0, -0.4], sacL: [-0.64, -0.87], sacR: [0.64, -0.87], paw: [0.85, -0.75] } },
  hat: [0.1, -1.7, 0],
  timers: ["croak", "leap", "gulp"],
  anim: function (t, p, time, M) {
    var sl = M.sleep || 0, aw = 1 - sl, hop = Math.abs(Math.sin(M.ph)) * M.g;
    var ck = t.croak > 0 ? Math.abs(Math.sin((1 - t.croak / 1.5) * Math.PI * 3)) : 0;    // three puffs a croak
    var crouch = t.leap > 0 ? Math.min(1, (1 - t.leap / 1.0) * 3) * (t.leap > 0.35 ? 1 : 0) : 0;
    var breathe = aw * 0.01 * Math.sin(time * 3.2) * M.idle;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "legs") return [0, 0, -0.08 * hop + 0.03 * crouch];
    if (p === "sacL") return [0, -0.44 * ck, 0.04 * ck];
    if (p === "sacR") return [0, 0.44 * ck, 0.04 * ck];
    if (p === "body") return [0, 0, 0.05 * crouch + sl * (0.07 + 0.012 * Math.sin(time * 1.5)) + breathe - 0.02 * M.spike(t.gulp, 0.4)];
    if (p === "eyes") return [0, 0, 0.06 * crouch + sl * 0.17 + breathe - 0.05 * M.spike(t.gulp, 0.4)];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still) {
    var R = Math.random;
    if (!(t.croak > 0) && R() < dt * (still ? 0.12 : 0.04)) t.croak = 1.5;
    if (!(t.gulp > 0) && R() < dt * 0.15) t.gulp = 0.4;
    if (still && !(t.leap > 0) && R() < dt * 0.035) { t.leap = 1.0; t.wait = Math.max(t.wait, 1.4); }
    if (t.leap > 0 && t.leap - dt <= 0.35 && t.leap > 0.35) t.jump = 0.6;              // crouch, then the leap on the engine's hop
  }
};
