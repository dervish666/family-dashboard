// The House: a snail carrying a cottage. Stalks and cottage are separate pieces.
import { rig, on, rimmed, shade, rr, canvas, INK } from "../engine/draw.js";

export default {
  id: "snail", label: "Snail", tg: 2.05, editor: true,
  sprite: snailSprite,
  rig: { order: ["body", "house", "stalks"], eyesIn: "stalks", piv: { house: [-0.25, -0.58], stalks: [0.95, -1.22] } },
  hat: [-0.25, -1.98, 0],
  anim: function (t, p, time, M) {
    if (p === "stalks") return [0.12 * Math.sin(time * 1.8 - 0.8) + 0.12 * M.g * Math.sin(time * 3 - 1.0) + M.wave * 0.3 * Math.sin(time * 9), 0, 0];
    if (p === "house") return [0.04 * Math.sin(time * 2.2 - 1.2) + 0.03 * M.g * Math.sin(time * 4 - 1.6), 0, 0.03 * Math.sin(time * 2.2 - 1.2) + 0.025 * M.g * Math.abs(Math.sin(time * 4 - 1.4))];
  }
};

function snailSprite(o, eyes, k) {
  var r = o.r * k, w = r * 3.6, cy = r * 1.75, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, col = o.col, grow = 1.7 * k;
  var slug = "#F6D9A9", slugRim = "#B98A4E";
  if (on("body")) {
    rimmed(g, slugRim, slug, grow, function (e) {
      g.beginPath(); g.ellipse(cx, cy + r * 0.56, r * 1.3 + e, r * 0.36 + e, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(cx + r * 0.95, cy + r * 0.1, r * 0.42 + e, r * 0.6 + e, 0, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,120,150,.42)"; g.beginPath(); g.ellipse(cx + r * 1.12, cy + r * 0.2, r * 0.12, r * 0.07, 0, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = r * 0.05; g.lineCap = "round"; g.beginPath(); g.arc(cx + r * 1.0, cy + r * 0.12, r * 0.1, 0.3, 2.6); g.stroke();
  }
  if (on("stalks")) {
    var tips = [[0.8, -0.72], [1.12, -0.66]], sz = eyes === "wide" ? 1.35 : 1;
    g.strokeStyle = slugRim; g.lineWidth = r * 0.1; g.lineCap = "round";
    tips.forEach(function (p) { g.beginPath(); g.moveTo(cx + r * 0.95, cy - r * 0.3); g.lineTo(cx + r * p[0], cy + r * p[1]); g.stroke(); });
    g.strokeStyle = slug; g.lineWidth = r * 0.05;
    tips.forEach(function (p) { g.beginPath(); g.moveTo(cx + r * 0.95, cy - r * 0.3); g.lineTo(cx + r * p[0], cy + r * p[1]); g.stroke(); });
    tips.forEach(function (p) { var ex = cx + r * p[0], ey = cy + r * p[1];
      if (eyes === "open" || eyes === "wide") { g.fillStyle = INK; g.beginPath(); g.arc(ex, ey, r * 0.1 * sz, 0, 7); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - r * 0.03, ey - r * 0.04, r * 0.035, 0, 7); g.fill(); }
      else { g.strokeStyle = INK; g.lineWidth = r * 0.06; g.beginPath();
        if (eyes === "shut") { g.moveTo(ex - r * 0.08, ey); g.lineTo(ex + r * 0.08, ey); }
        else { g.moveTo(ex - r * 0.08, ey + r * 0.03); g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03); }
        g.stroke(); } });
  }
  if (on("house")) {
    var hx = cx - r * 0.25, base = cy + r * 0.34, ww = r * 1.3, wh = r * 0.8, roof = shade(col, 0.68);
    rimmed(g, shade(col, 0.5), col, grow, function (e) { g.fillRect(hx - ww / 2 - e, base - wh - e, ww + e * 2, wh + e * 2); });
    g.fillStyle = shade(col, 0.5); g.fillRect(hx + r * 0.3, base - wh - r * 0.55, r * 0.18, r * 0.4);
    rimmed(g, shade(col, 0.45), roof, grow, function (e) { g.beginPath(); g.moveTo(hx - ww / 2 - r * 0.18 - e, base - wh + e);
      g.lineTo(hx, base - wh - r * 0.62 - e); g.lineTo(hx + ww / 2 + r * 0.18 + e, base - wh + e); g.closePath(); g.fill(); });
    g.fillStyle = "#7A4B2A"; rr(g, hx - r * 0.42, base - r * 0.48, r * 0.3, r * 0.48, r * 0.1); g.fill();
    g.fillStyle = "#FFE9A6"; rr(g, hx + r * 0.1, base - r * 0.62, r * 0.32, r * 0.28, r * 0.05); g.fill();
    g.strokeStyle = shade(col, 0.5); g.lineWidth = r * 0.04; g.beginPath(); g.moveTo(hx + r * 0.26, base - r * 0.62); g.lineTo(hx + r * 0.26, base - r * 0.34); g.stroke();
  }
  return { c: c, ax: cx, ay: cy + r * 0.92, k: k };
}
