// Roe deer, front-facing, a young buck: four legs, a white rump, short antlers, a square
// muzzle. Twitches its ears, flicks its tail, grazes head-down and now and then pronks.
import { on, rimmed, shade, rr, INK } from "../engine/draw.js";
import { frontSprite, pawWave } from "./front.js";

// a deer leg, hip to hoof
function legLine(g, F, x, fill) {
  var r = F.r, hx = F.cx + x * r, top = F.cy + r * 0.42, bot = F.feet - r * 0.04;
  g.lineCap = "round"; g.strokeStyle = F.rim; g.lineWidth = r * 0.2; g.beginPath(); g.moveTo(hx, top); g.lineTo(hx, bot); g.stroke();
  g.strokeStyle = fill; g.lineWidth = r * 0.15; g.beginPath(); g.moveTo(hx, top); g.lineTo(hx, bot - r * 0.02); g.stroke();
  g.strokeStyle = "#2A1E18"; g.lineWidth = r * 0.17; g.beginPath(); g.moveTo(hx, bot - r * 0.07); g.lineTo(hx, bot); g.stroke();
}

const SHAPE = {
  col: function () { return "#B5652F"; },
  feet: function (g, F) {
    [["legBL", -0.26], ["legBR", 0.26]].forEach(function (l) { if (!on(l[0])) return; legLine(g, F, l[1], shade(F.col, 0.72)); });
  },
  tail: function (g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, "#9A8F80", "#FFFFFF", F.grow, function (e) { g.beginPath(); g.ellipse(cx - r * 0.86, cy + r * 0.12, r * 0.24 + e, r * 0.2 + e, 0.3, 0, 7); g.fill(); });  // white rump
    g.fillStyle = F.col; g.beginPath(); g.ellipse(cx - r * 0.8, cy - r * 0.02, r * 0.14, r * 0.07, 0.3, 0, 7); g.fill();
  },
  ear: function (g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, F.col, F.grow, function (e) { g.beginPath(); g.ellipse(cx + s * r * 0.84, cy - r * 0.64, r * 0.4 + e, r * 0.19 + e, -s * 0.38, 0, 7); g.fill(); });
    g.fillStyle = "#F2D6B8"; g.beginPath(); g.ellipse(cx + s * r * 0.86, cy - r * 0.65, r * 0.27, r * 0.1, -s * 0.38, 0, 7); g.fill();
  },
  body: function (g, F, e) {                             // a sturdier build: head, thick neck, chest forward
    var cx = F.cx, cy = F.cy, r = F.r;
    g.beginPath(); g.ellipse(cx, cy - r * 0.32, r * 0.86 + e, r * 0.62 + e, 0, 0, 7); g.fill();
    rr(g, cx - r * 0.62 - e, cy - r * 0.2 - e, r * 1.24 + 2 * e, r * 0.8 + 2 * e, r * 0.34 + e); g.fill();
  },
  belly: function (g, F) {
    var r = F.r;
    g.fillStyle = "#F3E3CC";
    g.globalAlpha = 0.85; g.beginPath(); g.ellipse(F.cx, F.cy + r * 0.3, r * 0.44, r * 0.3, 0, 0, 7);
    g.fill(); g.globalAlpha = 1;
  },
  front: function (g, F) { [["legFL", -0.46], ["legFR", 0.46]].forEach(function (l) { if (on(l[0])) legLine(g, F, l[1], F.col); }); },
  faceY: 0.36,
  face: function (g, F) {                                // the young buck: square muzzle, black nose, white chin band, a brow
    var r = F.r, fy = F.fy, mx = F.cx + F.dx;
    if (on("body")) {
      g.fillStyle = "#C98552"; rr(g, mx - r * 0.3, fy + r * 0.04, r * 0.6, r * 0.42, r * 0.14); g.fill();
      g.fillStyle = "#FFFFFF"; rr(g, mx - r * 0.24, fy + r * 0.34, r * 0.48, r * 0.12, r * 0.06); g.fill();
      g.fillStyle = "#1E1612"; rr(g, mx - r * 0.13, fy + r * 0.07, r * 0.26, r * 0.13, r * 0.06); g.fill();
      g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.04;
      g.beginPath(); g.moveTo(mx - r * 0.08, fy + r * 0.29); g.quadraticCurveTo(mx, fy + r * 0.32, mx + r * 0.08, fy + r * 0.29); g.stroke();
      g.strokeStyle = "#6B3418"; g.lineWidth = r * 0.07;                                   // darker brow
      [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(mx + s * r * 0.18, fy - r * 0.2); g.lineTo(mx + s * r * 0.4, fy - r * 0.22); g.stroke(); });
      antlers(g, F.cx, F.cy, r);
    }
    if (on("eyes")) buckEyes(g, mx, fy, r, F.eyes);
  },
  phones: [-0.3, 0.9],
  paw: { col: function (F) { return shade(F.col, 0.8); }, x: 0.72, y: 0.12 }
};

// Roe buck antlers: a short beam each side with three tines, pale bone on a dark rim.
function antlers(g, cx, cy, r) {
  [-1, 1].forEach(function (s) {
    var bx = cx + s * r * 0.3, by = cy - r * 0.84;
    var lines = [[bx, by, bx + s * r * 0.06, by - r * 0.72],                               // beam
      [bx + s * r * 0.04, by - r * 0.36, bx + s * r * 0.26, by - r * 0.46],                // front tine
      [bx + s * r * 0.06, by - r * 0.72, bx - s * r * 0.06, by - r * 0.86],                // top fork, inner
      [bx + s * r * 0.06, by - r * 0.72, bx + s * r * 0.2, by - r * 0.82]];                // top fork, outer
    g.lineCap = "round";
    [["#6E5B40", r * 0.14], ["#EADBB8", r * 0.09]].forEach(function (st) { g.strokeStyle = st[0]; g.lineWidth = st[1];
      lines.forEach(function (l) { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); }); });
    g.fillStyle = "#8C7A5C"; g.beginPath(); g.ellipse(bx, by + r * 0.02, r * 0.1, r * 0.06, 0, 0, 7); g.fill();     // burr
  });
}
// A boy's eyes: smaller and level, no blush, no lashes.
function buckEyes(g, x, fy, r, eyes) {
  var ey = fy - r * 0.08, sz = eyes === "wide" ? 1.3 : 1;
  [-1, 1].forEach(function (s) { var ex = x + s * r * 0.29;
    g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * 0.06;
    if (eyes === "open" || eyes === "wide") { g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, r * 0.09 * sz, r * 0.095 * sz, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.03, ey - r * 0.035, r * 0.035, 0, 7); g.fill(); }
    else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - r * 0.09, ey); g.quadraticCurveTo(ex, ey + r * 0.06, ex + r * 0.09, ey); g.stroke(); }
    else { g.beginPath(); g.moveTo(ex - r * 0.09, ey + r * 0.03); g.quadraticCurveTo(ex, ey - r * 0.08, ex + r * 0.09, ey + r * 0.03); g.stroke(); } });
}

export default {
  id: "deer", label: "Deer", tg: 2.75, editor: true,
  sprite: function (o, eyes, k) { return frontSprite(o, eyes, k, SHAPE); },
  rig: { order: ["legBL", "legBR", "tail", "earL", "earR", "body", "legFL", "legFR", "paw", "eyes"], eyesIn: "eyes",
    piv: { legBL: [-0.26, -0.5], legBR: [0.26, -0.5], legFL: [-0.46, -0.5], legFR: [0.46, -0.5],
      earL: [-0.52, -1.5], earR: [0.52, -1.5], tail: [-0.7, -0.84], paw: [0.62, -0.62] } },
  hat: [0, -1.84, 0],
  timers: ["twL", "twR", "flick", "pronk", "graze"],
  anim: function (t, p, time, M) {
    if (p === "legFL" || p === "legBR") return [0, 0, M.stiff ? 0 : M.stepL];
    if (p === "legFR" || p === "legBL") return [0, 0, M.stiff ? 0 : M.stepR];
    if (p === "earL") return [-M.spike(t.twL, 0.3) * 0.55 + 0.15 * Math.sin(M.ph - 0.6) * M.g + 0.35 * M.stiff * Math.sin(time * 18), 0, 0];
    if (p === "earR") return [M.spike(t.twR, 0.3) * 0.55 - 0.15 * Math.sin(M.ph - 0.6) * M.g - 0.35 * M.stiff * Math.sin(time * 18), 0, 0];
    if (p === "tail") return [0.45 * Math.sin(time * 16) * M.spike(t.flick, 0.6) + 0.2 * Math.sin(M.ph - 1.0) * M.g, 0, 0];
    if (p === "paw") return pawWave(M);
  },
  life: function (t, dt, still, A) {
    var R = Math.random;
    if (!(t.twL > 0) && R() < dt * 0.35) t.twL = 0.3; if (!(t.twR > 0) && R() < dt * 0.35) t.twR = 0.3;
    if (!(t.flick > 0) && R() < dt * 0.2) t.flick = 0.6;
    if (still && !(t.pronk > 0) && !(t.graze > 0)) {
      if (R() < dt * 0.05) { t.pronk = 1.6; t.wait = Math.max(t.wait, 1.8); }
      else if (R() < dt * 0.07) { t.graze = A.rand(2.5, 4); t.wait = Math.max(t.wait, t.graze + 0.3); }
    }
  }
};
