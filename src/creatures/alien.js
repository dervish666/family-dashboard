// Helpers the space station's aliens share (not a creature itself): a canvas anchored at the
// feet, big cartoon eyes in the four states the rig bakes, and cheeks.
import { INK, profileCanvas } from "../engine/draw.js";

// A canvas wR body radii wide, upR above the feet and downR below, with g moved to the feet.
export function alienCanvas(r, wR, upR, downR) { return profileCanvas(r, wR, upR, downR); }

// One eye: a white with an iris and a pupil, two glints; shut is a smile of a line, happy a ^.
// s is the eye's size (its half width), iris its colour.
export function bigEye(g, x, y, s, eyes, adult, iris) {
  g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = Math.max(1, s * (adult ? 0.2 : 0.24));
  if (eyes === "shut") { g.beginPath(); g.moveTo(x - s * 0.85, y); g.quadraticCurveTo(x, y + s * 0.6, x + s * 0.85, y); g.stroke(); return; }
  if (eyes === "happy") { g.beginPath(); g.moveTo(x - s * 0.85, y + s * 0.3); g.quadraticCurveTo(x, y - s * 0.75, x + s * 0.85, y + s * 0.3); g.stroke(); return; }
  var w = eyes === "wide" ? 1.15 : 1, ry = s * (adult ? 0.95 : 1.12);
  g.fillStyle = INK; g.beginPath(); g.ellipse(x, y, s * w + s * 0.14, ry * w + s * 0.14, 0, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(x, y, s * w, ry * w, 0, 0, 7); g.fill();
  g.fillStyle = iris; g.beginPath(); g.ellipse(x + s * 0.06, y + ry * 0.12, s * 0.66 * w, ry * 0.7 * w, 0, 0, 7); g.fill();
  g.fillStyle = INK; g.beginPath(); g.ellipse(x + s * 0.08, y + ry * 0.16, s * (eyes === "wide" ? 0.46 : 0.38), ry * (eyes === "wide" ? 0.5 : 0.42), 0, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x - s * 0.22, y - ry * 0.22, s * 0.26, 0, 7); g.fill();
  g.beginPath(); g.arc(x + s * 0.3, y + ry * 0.36, s * 0.1, 0, 7); g.fill();
  if (adult) { g.strokeStyle = INK; g.lineWidth = s * 0.16; g.beginPath(); g.moveTo(x - s * 0.8, y - ry * 1.2); g.quadraticCurveTo(x, y - ry * 1.5, x + s * 0.8, y - ry * 1.15); g.stroke(); }
}
// The owner's colour, for the one thing each alien wears or grows in it, else a default.
export function ownCol(o, dflt) { return /^#[0-9a-f]{6}$/i.test(o.col || "") ? o.col : dflt; }
export function cheeks(g, x, y, dx, s) {
  g.fillStyle = "rgba(255,120,150,.42)";
  [-1, 1].forEach(function (k) { g.beginPath(); g.ellipse(x + k * dx, y, s, s * 0.6, 0, 0, 7); g.fill(); });
}
export function smile(g, x, y, w, lw) {
  g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = lw; g.beginPath(); g.arc(x, y - w * 0.4, w, 0.5, Math.PI - 0.5); g.stroke();
}
// Hold a pose: 0 to 1 over the first and last `ramp` seconds of a timer of length `dur`.
export function hold(left, dur, ramp) { if (!(left > 0)) return 0; var k = Math.min(1, (dur - left) / ramp, left / ramp); k = Math.max(0, k); return k * k * (3 - 2 * k); }
