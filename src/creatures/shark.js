// Lemon shark, side-on, facing +x, belly line at y = 0. Swims across dry land in its own
// puddle (the engine draws that), and dives into the scene's water when idle on its bank.
import { rig, on, rimmed, shade, INK, profileCanvas } from "../engine/draw.js";
import { waterDip } from "./swim.js";

export default {
  id: "shark", label: "Shark", tg: 1.6, editor: true,
  sprite: sharkSprite,
  rig: { order: ["tail", "body", "pec", "mouth", "eyes"], eyesIn: "eyes", extra: ["mouthOpen"],
    piv: { tail: [-1.05, -0.62], pec: [0.45, -0.42], mouth: [1.15, -0.45], mouthOpen: [1.15, -0.45] } },
  hat: [0.55, -1.02, 0.35],
  anim: function (t, p, time, M) {
    if (p === "tail") return [Math.sin(time * (3 + 7 * M.g)) * (0.1 + 0.24 * M.g) + M.wave * 0.35 * Math.sin(time * 18), 0, 0];
    if (p === "pec") return [Math.sin(time * (4 + 6 * M.g) + 1) * 0.18 + M.wave * 0.5 * Math.sin(time * 20), 0, 0];
  },
  habits: waterDip
};

function sharkSprite(o, eyes, k) {
  var r = o.r * k, P = profileCanvas(r, 4.0, 1.9, 0.2), g = P.g, grow = 1.6 * k;
  var rim = "#6B5B22", back = "#A38F3E", mid = "#CDB76A", belly = "#F7EFCC";
  function X(v) { return v * r; }
  function fin(e, pts) { g.beginPath(); g.moveTo(X(pts[0]), X(pts[1]));
    g.quadraticCurveTo(X(pts[2]), X(pts[3]) - e, X(pts[4]) - e, X(pts[5]) - e);
    g.quadraticCurveTo(X(pts[6]), X(pts[7]), X(pts[8]), X(pts[9])); g.closePath(); g.fill(); }
  if (on("tail")) rimmed(g, rim, back, grow, function (e) { g.beginPath();
    g.moveTo(X(-1.02), X(-0.8) - e); g.quadraticCurveTo(X(-1.35), X(-1.05), X(-1.75) - e, X(-1.45) - e);
    g.quadraticCurveTo(X(-1.52), X(-0.95), X(-1.42), X(-0.64));
    g.quadraticCurveTo(X(-1.5), X(-0.4), X(-1.62) - e, X(-0.18) + e);
    g.quadraticCurveTo(X(-1.3), X(-0.35), X(-1.02), X(-0.5) + e); g.closePath(); g.fill(); });
  var body = function (e) { g.beginPath();
    g.moveTo(X(1.5) + e, X(-0.6));
    g.bezierCurveTo(X(1.25), X(-1.02) - e, X(0.5), X(-1.12) - e, X(-0.2), X(-1.02) - e);
    g.bezierCurveTo(X(-0.7), X(-0.95) - e, X(-0.95), X(-0.84) - e, X(-1.08) - e, X(-0.72));
    g.lineTo(X(-1.08) - e, X(-0.52));
    g.bezierCurveTo(X(-0.7), X(-0.3) + e, X(-0.2), X(-0.1) + e, X(0.35), X(-0.12) + e);
    g.bezierCurveTo(X(0.95), X(-0.14) + e, X(1.35), X(-0.35) + e, X(1.5) + e, X(-0.6));
    g.closePath(); g.fill(); };
  if (on("body")) {
    rimmed(g, rim, back, grow, function (e) { fin(e, [0.28, -1.02, 0.18, -1.45, -0.1, -1.64, -0.05, -1.25, -0.3, -1.0]); });
    rimmed(g, rim, back, grow, function (e) { fin(e, [-0.55, -0.9, -0.62, -1.24, -0.86, -1.42, -0.82, -1.1, -0.98, -0.8]); });
    g.fillStyle = rim; body(grow);
    var gr = g.createLinearGradient(0, X(-1.1), 0, X(-0.1)); gr.addColorStop(0, back); gr.addColorStop(0.5, mid); gr.addColorStop(1, mid);
    g.fillStyle = gr; body(0);
    g.save(); body(0); g.clip();
    g.fillStyle = belly; g.beginPath(); g.moveTo(X(1.6), X(-0.6));
    g.bezierCurveTo(X(1.0), X(-0.55), X(0.3), X(-0.46), X(-1.2), X(-0.62)); g.lineTo(X(-1.2), X(0.2)); g.lineTo(X(1.6), X(0.2)); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = shade(back, 0.62); g.lineWidth = X(0.035); g.lineCap = "round";
    for (var i = 0; i < 5; i++) { var gx = X(0.62 - i * 0.075); g.beginPath(); g.moveTo(gx, X(-0.88)); g.quadraticCurveTo(gx - X(0.03), X(-0.74), gx, X(-0.6)); g.stroke(); }
    g.fillStyle = "rgba(255,120,150,.45)"; g.beginPath(); g.ellipse(X(0.9), X(-0.58), X(0.12), X(0.07), 0, 0, 7); g.fill();
    g.fillStyle = "#FF8FB1"; var bx = X(0.02), by = X(-1.3);                               // the shark's bow
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - X(0.18), by - X(0.11)); g.lineTo(bx - X(0.18), by + X(0.11)); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + X(0.18), by - X(0.11)); g.lineTo(bx + X(0.18), by + X(0.11)); g.closePath(); g.fill();
    g.beginPath(); g.arc(bx, by, X(0.055), 0, 7); g.fill();
  }
  if (on("pec")) rimmed(g, rim, mid, grow, function (e) { g.beginPath(); g.moveTo(X(0.5), X(-0.45) - e);
    g.quadraticCurveTo(X(0.2), X(-0.22), X(-0.12) - e, X(-0.02) + e); g.quadraticCurveTo(X(0.18), X(-0.3), X(0.26), X(-0.46)); g.closePath(); g.fill(); });
  if (on("mouth")) {
    g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = X(0.045); g.beginPath(); g.moveTo(X(1.32), X(-0.47)); g.quadraticCurveTo(X(1.18), X(-0.38), X(1.02), X(-0.44)); g.stroke();
    g.fillStyle = "#FFFFFF"; [1.26, 1.14].forEach(function (tx) { g.beginPath();
      g.moveTo(X(tx) - X(0.03), X(-0.43)); g.lineTo(X(tx) + X(0.03), X(-0.43)); g.lineTo(X(tx), X(-0.37)); g.closePath(); g.fill(); });
  }
  if (rig.part === "mouthOpen") {                           // the dive: mouth open, all teeth
    g.fillStyle = "#6B2E3A"; g.beginPath(); g.moveTo(X(1.36), X(-0.5)); g.quadraticCurveTo(X(1.2), X(-0.22), X(0.98), X(-0.44)); g.closePath(); g.fill();
    g.fillStyle = "#FFFFFF"; [1.28, 1.18, 1.08].forEach(function (tx) { g.beginPath();
      g.moveTo(X(tx) - X(0.03), X(-0.47)); g.lineTo(X(tx) + X(0.03), X(-0.47)); g.lineTo(X(tx), X(-0.4)); g.closePath(); g.fill(); });
  }
  if (on("eyes")) {
    var ex = X(1.0), ey = X(-0.8), sz = eyes === "wide" ? 1.3 : 1;
    g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = X(0.06);
    if (eyes === "open" || eyes === "wide") { g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, X(0.12 * sz), X(0.14 * sz), 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - X(0.035), ey - X(0.05), X(0.05), 0, 7); g.fill();
      g.beginPath(); g.arc(ex + X(0.04), ey + X(0.05), X(0.022), 0, 7); g.fill(); }
    else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - X(0.1), ey); g.quadraticCurveTo(ex, ey + X(0.08), ex + X(0.1), ey); g.stroke(); }
    else { g.beginPath(); g.moveTo(ex - X(0.1), ey + X(0.04)); g.quadraticCurveTo(ex, ey - X(0.1), ex + X(0.1), ey + X(0.04)); g.stroke(); }
  }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}
