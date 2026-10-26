// Crow, side-on, facing +x, feet at y = 0 (units of r). A bird only reads as itself in
// profile. Hops rather than walks, cocks its head, and stoops for anything shiny.
import { on, rimmed, profileCanvas } from "../engine/draw.js";

export default {
  id: "crow", label: "Crow", tg: 2.25, editor: true,
  sprite: crowSprite,
  rig: { order: ["legB", "legA", "tail", "body", "wing", "head"], eyesIn: "head",
    piv: { legA: [-0.1, -0.46], legB: [0.16, -0.46], tail: [-0.8, -0.62], wing: [0.25, -1.3], head: [0.45, -1.45] } },
  hat: [0.6, -2.08, 0.15],
  timers: ["cock"],
  anim: function (t, p, time, M) {
    if (p === "legA") return [0.55 * M.air, 0, 0];
    if (p === "legB") return [0.45 * M.air, 0, 0];
    if (p === "tail") return [0.14 * Math.sin(M.ph * 1.5 - 0.9) * M.g + 0.05 * Math.sin(time * 1.3) * M.idle + 0.2 * M.air, 0, 0];
    if (p === "wing") return [0.95 * M.air + 0.3 * Math.sin(time * 22) * M.air + M.wave * (1.0 + 0.35 * Math.sin(time * 16)), 0, 0];
    if (p === "head") return [M.spike(t.cock, 1.4) * 0.38 * (t.cockDir || 1) - 0.08 * M.air, 0, 0];
  },
  life: function (t, dt, still) {
    if (still && !(t.cock > 0) && !t.shiny && Math.random() < dt * 0.3) { t.cock = 1.4; t.cockDir = Math.random() < 0.5 ? -1 : 1; }
  },
  // Spots something shiny and stoops for it. Pure animation: position only changes in steer().
  habits: function (t, dt, A) {
    if (!t.idle) { t.shiny = null; return; }
    if (!t.shiny && Math.random() < dt * 0.05) t.shiny = { x: t.x + t.face * t.r * 0.95, y: t.y + 2, k: 0 };
    if (t.shiny) { t.shiny.k += dt; t.wait = Math.max(t.wait, 0.3);
      if (t.shiny.k > 1.2 && !t.peck && t.shiny.k < 1.3) t.peck = 0.5;
      if (t.shiny.k > 1.55) { A.puff("heart", t.x, t.y - t.r * 2.3, 1, "#F4D35E"); t.happy = 1.4; t.shiny = null; } }
  }
};

function crowSprite(o, eyes, k) {
  var r = o.r * k, P = profileCanvas(r, 4.2, 2.25, 0.2), g = P.g, grow = 1.6 * k;
  var rim = "#12181A";
  function X(v) { return v * r; }
  function grad() { var gr = g.createLinearGradient(0, X(-2.1), 0, X(-0.4));
    gr.addColorStop(0, "#5E8E94"); gr.addColorStop(0.25, "#3A4B4E"); gr.addColorStop(0.6, "#2A3336"); gr.addColorStop(1, "#1E2527"); return gr; }
  g.strokeStyle = "#1E2426"; g.lineCap = "round"; g.lineJoin = "round";
  [["legA", -0.1, 0], ["legB", 0.16, 0.03]].forEach(function (l) { if (!on(l[0])) return; var lx = X(l[1]);
    g.strokeStyle = "#1E2426"; g.lineWidth = X(0.07); g.beginPath(); g.moveTo(lx, X(-0.46)); g.lineTo(lx + X(l[2]), X(-0.02)); g.stroke();
    g.lineWidth = X(0.05); g.beginPath();
    g.moveTo(lx - X(0.13), X(0.01)); g.lineTo(lx + X(0.2), X(0.01));
    g.moveTo(lx + X(0.2), X(0.01)); g.lineTo(lx + X(0.26), X(0.06)); g.stroke(); });
  if (on("tail")) {
    rimmed(g, rim, "#222B2E", grow, function (e) { g.beginPath();
      g.moveTo(X(-0.78), X(-0.78) - e); g.lineTo(X(-1.78) - e, X(-0.3) - e); g.lineTo(X(-1.82) - e, X(-0.06) + e);
      g.lineTo(X(-0.82), X(-0.46) + e); g.closePath(); g.fill(); });
    g.strokeStyle = "rgba(127,200,210,.25)"; g.lineWidth = X(0.025);
    [[-1.0, -0.62, -1.72, -0.24], [-1.0, -0.52, -1.74, -0.12]].forEach(function (l) { g.beginPath(); g.moveTo(X(l[0]), X(l[1])); g.lineTo(X(l[2]), X(l[3])); g.stroke(); });
  }
  if (on("body")) {
    var body = function (e) {
      g.beginPath(); g.ellipse(X(-0.2), X(-0.9), X(0.9) + e, X(0.48) + e, -0.55, 0, 7); g.fill();
      g.beginPath(); g.ellipse(X(0.28), X(-1.18), X(0.46) + e, X(0.44) + e, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(X(0.45), X(-1.5), X(0.34) + e, X(0.42) + e, -0.3, 0, 7); g.fill();
      g.beginPath(); g.ellipse(X(0.05), X(-1.48), X(0.47) + e, X(0.27) + e, -0.72, 0, 7); g.fill();
    };
    g.fillStyle = rim; body(grow); g.fillStyle = grad(); body(0);
  }
  if (on("wing")) {
    rimmed(g, rim, "#262F33", grow, function (e) { g.beginPath();
      g.moveTo(X(0.3), X(-1.38) - e); g.quadraticCurveTo(X(-0.4), X(-1.36) - e, X(-0.98), X(-0.74) - e);
      g.lineTo(X(-1.3) - e, X(-0.42)); g.lineTo(X(-1.06), X(-0.5)); g.lineTo(X(-1.22) - e, X(-0.3));
      g.lineTo(X(-0.98), X(-0.4)); g.lineTo(X(-1.06), X(-0.2) + e);
      g.quadraticCurveTo(X(-0.35), X(-0.52) + e, X(0.22), X(-1.0) + e); g.closePath(); g.fill(); });
    g.strokeStyle = "rgba(127,200,210,.55)"; g.lineWidth = X(0.045);
    g.beginPath(); g.moveTo(X(0.22), X(-1.38)); g.quadraticCurveTo(X(-0.4), X(-1.33), X(-0.94), X(-0.74)); g.stroke();
    g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = X(0.03);
    [[-0.5, -1.02, -0.92, -0.5], [-0.3, -0.92, -0.8, -0.38]].forEach(function (l) { g.beginPath(); g.moveTo(X(l[0]), X(l[1])); g.lineTo(X(l[2]), X(l[3])); g.stroke(); });
  }
  if (on("head")) {
    g.fillStyle = rim; g.beginPath(); g.arc(X(0.62), X(-1.76), X(0.35) + grow, 0, 7); g.fill();
    g.fillStyle = grad(); g.beginPath(); g.arc(X(0.62), X(-1.76), X(0.35), 0, 7); g.fill();
    rimmed(g, rim, "#2A3033", grow * 0.8, function (e) { g.beginPath();                    // the beak
      g.moveTo(X(0.84), X(-1.9) - e); g.quadraticCurveTo(X(1.22), X(-1.89) - e, X(1.48) + e, X(-1.69));
      g.quadraticCurveTo(X(1.43), X(-1.62) + e, X(1.33), X(-1.63) + e); g.quadraticCurveTo(X(1.12), X(-1.58) + e, X(0.86), X(-1.6) + e); g.closePath(); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = X(0.03);
    g.beginPath(); g.moveTo(X(0.92), X(-1.85)); g.quadraticCurveTo(X(1.2), X(-1.84), X(1.39), X(-1.72)); g.stroke();
    g.strokeStyle = "rgba(0,0,0,.5)"; g.beginPath(); g.moveTo(X(0.9), X(-1.71)); g.lineTo(X(1.31), X(-1.67)); g.stroke();
    var ex = X(0.67), ey = X(-1.82), wide = eyes === "wide";
    g.lineCap = "round"; g.strokeStyle = "#E4EEF1"; g.lineWidth = X(0.05);
    if (eyes === "open" || wide) { var ring = wide ? 0.14 : 0.1;
      g.fillStyle = "#E4EEF1"; g.beginPath(); g.arc(ex, ey, X(ring), 0, 7); g.fill();
      g.fillStyle = "#0B0F10"; g.beginPath(); g.arc(ex + X(0.015), ey, X(wide ? 0.06 : 0.075), 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - X(0.01), ey - X(0.03), X(0.028), 0, 7); g.fill(); }
    else if (eyes === "shut") { g.beginPath(); g.moveTo(ex - X(0.09), ey); g.quadraticCurveTo(ex, ey + X(0.06), ex + X(0.09), ey); g.stroke(); }
    else { g.beginPath(); g.moveTo(ex - X(0.09), ey + X(0.03)); g.quadraticCurveTo(ex, ey - X(0.08), ex + X(0.09), ey + X(0.03)); g.stroke(); }
    if (o.glasses) { g.strokeStyle = "#D8E6EA"; g.lineWidth = X(0.045);
      g.beginPath(); g.arc(ex + X(0.02), ey, X(0.16), 0, 7); g.stroke();
      g.beginPath(); g.moveTo(ex - X(0.14), ey - X(0.02)); g.lineTo(X(0.34), ey - X(0.04)); g.stroke(); }
  }
  return { c: P.c, ax: P.ax, ay: P.ay, k: k };
}
