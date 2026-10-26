// Canvas helpers shared by the engine, the creatures and the scenes. Pure functions:
// no card state lives here except the rig part being baked (see rig below).

export function rgb(h) { var v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
export function css(a, al) { return al == null ? "rgb(" + (a[0] | 0) + "," + (a[1] | 0) + "," + (a[2] | 0) + ")"
  : "rgba(" + (a[0] | 0) + "," + (a[1] | 0) + "," + (a[2] | 0) + "," + al + ")"; }
export function mix(h, h2, t) { var a = rgb(h), b = rgb(h2); return css([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
export function shade(h, k) { var a = rgb(h); return css([a[0] * k, a[1] * k, a[2] * k]); }
export function rand(a, b) { return a + Math.random() * (b - a); }
export function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
export function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
export function pad2(n) { return (n < 10 ? "0" : "") + n; }
export function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
export function canvas(w, h) { var c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
export function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
// A quick spike that fades: 0 at the start, a peak early, back to 0 at the end.
export function spike(tLeft, dur) { if (!(tLeft > 0)) return 0; var k = 1 - tLeft / dur; return Math.sin(k * Math.PI) * (1 - k * 0.5); }
// A scene's own random numbers for decoration (stars, pebbles, grass): seeded, so the sim's
// Math.random sequence is untouched and a bake draws the same set every time at a size.
export function prng(seed) { var s = seed | 0; return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// A soft contact shadow: an ellipse that fades out from its middle, for the ground under
// a building or a prop.
export function aoShadow(g, x, y, rx, ry, a, col) {
  var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, "rgba(" + (col || "30,60,30") + "," + a + ")"); gr.addColorStop(0.55, "rgba(" + (col || "30,60,30") + "," + (a * 0.55).toFixed(3) + ")"); gr.addColorStop(1, "rgba(" + (col || "30,60,30") + ",0)");
  g.save(); g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
}

// ── Sprites. Everything is baked once, then blitted: this panel is an Android 5
// tablet, and a creature built from paths every frame is ten rasterisations. ─────
export const K = 2;          // bake scale, so a sprite stays crisp if the panel reports dpr 2
export const INK = "#2B2433";

// Draw a shape twice: grown in the rim colour, then in its fill. Gives every
// silhouette (ears, fluff, shell) one clean outline without stroking overlaps.
export function rimmed(g, rim, fill, grow, draw) {
  g.fillStyle = rim; draw(grow); g.fillStyle = fill; draw(0);
}

// only: "eyes" draws just the eyes (a rig piece), "rest" everything else.
export function face(g, cx, ey, r, eyes, dx, adult, only) {
  // Grown-ups: smaller, closer eyes, brows, a plain smile, no blush. Same world, less baby.
  var ex = r * (adult ? 0.27 : 0.34), ew = r * (adult ? 0.085 : 0.13), eh = r * (adult ? 0.11 : 0.17);
  if (eyes === "wide") { ew *= 1.3; eh *= 1.3; eyes = "open"; }
  [-1, 1].forEach(function (s) {
    var x = cx + dx + s * ex;
    if (!adult && only !== "eyes") { g.fillStyle = "rgba(255,120,150,.42)";                     // cheeks
      g.beginPath(); g.ellipse(x + s * r * 0.1, ey + r * 0.22, r * 0.14, r * 0.085, 0, 0, 7); g.fill(); }
    if (only === "rest") return;
    g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = r * (adult ? 0.06 : 0.075);
    if (eyes === "open") {
      g.fillStyle = INK; g.beginPath(); g.ellipse(x, ey, ew, eh, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x - ew * 0.35, ey - eh * 0.4, ew * 0.42, 0, 7); g.fill();
      if (!adult) { g.beginPath(); g.arc(x + r * 0.045, ey + r * 0.06, r * 0.025, 0, 7); g.fill(); }
    } else if (eyes === "shut") {
      g.beginPath(); g.moveTo(x - ew * 0.92, ey); g.quadraticCurveTo(x, ey + ew * 0.77, x + ew * 0.92, ey); g.stroke();
    } else {                                                                  // happy ^ ^
      g.beginPath(); g.moveTo(x - ew * 0.92, ey + ew * 0.38); g.quadraticCurveTo(x, ey - ew, x + ew * 0.92, ey + ew * 0.38); g.stroke();
    }
    if (adult && eyes !== "shut") { g.lineWidth = r * 0.045; g.beginPath();
      g.moveTo(x - r * 0.1, ey - r * 0.21); g.quadraticCurveTo(x, ey - r * 0.26, x + r * 0.1, ey - r * 0.2); g.stroke(); }
  });
  if (only === "eyes") return;
  var mx = cx + dx, my = ey + r * 0.2;
  g.strokeStyle = INK; g.lineCap = "round";
  if (adult) { g.lineWidth = r * 0.045; g.beginPath(); g.arc(mx, my - r * 0.06, r * 0.08, 0.4, Math.PI - 0.4); g.stroke(); return; }
  g.lineWidth = r * 0.05; g.beginPath(); g.moveTo(mx - r * 0.08, my);                     // little w mouth
  g.quadraticCurveTo(mx - r * 0.04, my + r * 0.08, mx, my); g.quadraticCurveTo(mx + r * 0.04, my + r * 0.08, mx + r * 0.08, my); g.stroke();
}

// Accessories: headphones (phones) and a daisy (daisy), worn whatever animal they are.
export function phonesAcc(g, cx, cy, r, col) {
  g.strokeStyle = "#3C3950"; g.lineWidth = r * 0.13; g.lineCap = "round";
  g.beginPath(); g.arc(cx, cy - r * 0.02, r * 1.0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  [-1, 1].forEach(function (s) { g.fillStyle = "#3C3950"; rr(g, cx + s * r * 0.98 - r * 0.15, cy - r * 0.3, r * 0.3, r * 0.5, r * 0.12); g.fill();
    g.fillStyle = mix(col, "#ffffff", 0.3); g.beginPath(); g.arc(cx + s * r * 0.98, cy - r * 0.05, r * 0.07, 0, 7); g.fill(); });
}
export function daisyAcc(g, cx, cy, r, k) {
  var fx = cx + r * 0.3, fly = cy - r * 1.25;
  g.strokeStyle = "#4E9A5A"; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(cx + r * 0.08, cy - r * 0.86);
  g.quadraticCurveTo(cx + r * 0.1, fly + r * 0.2, fx, fly); g.stroke();
  for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2;
    rimmed(g, "rgba(180,170,200,.8)", "#FFFFFF", k, function (e) { g.beginPath(); g.arc(fx + Math.cos(a) * r * 0.17, fly + Math.sin(a) * r * 0.17, r * 0.13 + e, 0, 7); g.fill(); }); }
  g.fillStyle = "#FFCB47"; g.beginPath(); g.arc(fx, fly, r * 0.12, 0, 7); g.fill();
}
// Villager hats, so a baker reads as a baker at 40px.
export function hat(g, kind, cx, cy, r, grow) {
  var top = cy - r * 0.9;
  if (kind === "chef") {
    rimmed(g, "#B9B4AA", "#FFFFFF", grow, function (e) {
      g.fillRect(cx - r * 0.46 - e, top - r * 0.2 - e, r * 0.92 + e * 2, r * 0.32 + e * 2);
      [[-0.3, -0.42, 0.28], [0, -0.6, 0.34], [0.3, -0.42, 0.28]].forEach(function (p) { g.beginPath(); g.arc(cx + r * p[0], top + r * p[1], r * p[2] + e, 0, 7); g.fill(); }); });
  } else if (kind === "straw") {
    rimmed(g, "#B8923F", "#EDCB74", grow, function (e) { g.beginPath(); g.ellipse(cx, top + r * 0.12, r * 1.02 + e, r * 0.22 + e, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(cx, top - r * 0.08, r * 0.52 + e, r * 0.34 + e, 0, Math.PI, 0); g.fill(); });
    g.fillStyle = "#E0675A"; g.fillRect(cx - r * 0.52, top - r * 0.02, r * 1.04, r * 0.1);
  } else if (kind === "cap" || kind === "postcap") {
    rimmed(g, kind === "cap" ? "#2F5577" : "#8E2A24", kind === "cap" ? "#4E7CA8" : "#D9433A", grow, function (e) { g.beginPath(); g.arc(cx, top + r * 0.12, r * 0.62 + e, Math.PI, 0); g.fill();
      g.beginPath(); g.ellipse(cx + r * 0.55, top + r * 0.1, r * 0.4 + e, r * 0.1 + e, 0, 0, 7); g.fill(); });
  } else if (kind === "beanie" || kind === "beanie2") {
    var bc = kind === "beanie" ? "#D9534F" : "#6C8FD0";
    rimmed(g, shade(bc, 0.6), bc, grow, function (e) { g.beginPath(); g.arc(cx, top + r * 0.2, r * 0.7 + e, Math.PI, 0); g.fill();
      g.fillRect(cx - r * 0.74 - e, top + r * 0.08 - e, r * 1.48 + e * 2, r * 0.2 + e * 2); });
    rimmed(g, "#B9B4AA", "#FFFFFF", grow, function (e) { g.beginPath(); g.arc(cx, top - r * 0.52, r * 0.16 + e, 0, 7); g.fill(); });
  } else if (kind === "tricorn") {                                  // the town crier's
    rimmed(g, "#1E2438", "#33405F", grow, function (e) { g.beginPath(); g.moveTo(cx - r * 1.0 - e, top + r * 0.14);
      g.quadraticCurveTo(cx - r * 0.72, top - r * 0.64 - e, cx, top - r * 0.4 - e); g.quadraticCurveTo(cx + r * 0.72, top - r * 0.64 - e, cx + r * 1.0 + e, top + r * 0.14);
      g.quadraticCurveTo(cx, top + r * 0.36 + e, cx - r * 1.0 - e, top + r * 0.14); g.closePath(); g.fill(); });
    g.strokeStyle = "#E8C66A"; g.lineWidth = r * 0.08; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx - r * 0.92, top + r * 0.14); g.quadraticCurveTo(cx, top + r * 0.32, cx + r * 0.92, top + r * 0.14); g.stroke();
    g.fillStyle = "#D9433A"; g.beginPath(); g.arc(cx + r * 0.34, top - r * 0.06, r * 0.11, 0, 7); g.fill();
  } else if (kind === "antennae") {                                 // the station's herald
    g.strokeStyle = "#3C4A7A"; g.lineWidth = r * 0.09; g.lineCap = "round";
    [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(cx + s * r * 0.22, top + r * 0.2); g.quadraticCurveTo(cx + s * r * 0.5, top - r * 0.3, cx + s * r * 0.42, top - r * 0.62); g.stroke(); });
    [-1, 1].forEach(function (s) { rimmed(g, "#B8433A", "#FF8A5C", grow, function (e) { g.beginPath(); g.arc(cx + s * r * 0.42, top - r * 0.66, r * 0.16 + e, 0, 7); g.fill(); }); });
    g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(cx - r * 0.46, top - r * 0.71, r * 0.05, 0, 7); g.fill();
  } else if (kind === "bucket") {
    rimmed(g, "#3D6E6C", "#5E9C9A", grow, function (e) { g.beginPath(); g.ellipse(cx, top + r * 0.14, r * 0.86 + e, r * 0.18 + e, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(cx - r * 0.55 - e, top + r * 0.12); g.lineTo(cx - r * 0.4 - e, top - r * 0.36 - e);
      g.lineTo(cx + r * 0.4 + e, top - r * 0.36 - e); g.lineTo(cx + r * 0.55 + e, top + r * 0.12); g.closePath(); g.fill(); });
  }
}

// The crow and the lemon shark are drawn side-on, facing +x: a bird and
// a shark only read as themselves in profile. Units are r; the feet (or the shark's
// belly line) sit at y = 0.
export function profileCanvas(r, wR, upR, downR) {
  var c = canvas(r * wR, r * (upR + downR)), g = c.getContext("2d");
  var ox = r * wR / 2, oy = r * upR;
  g.translate(ox, oy);
  return { c: c, g: g, ax: ox, ay: oy };
}

// ── Rigged sprites ──────────────────────────────────────────────────────────
// Each rigged creature is drawn in pieces so the pieces can move: legs, tails, ears,
// wings, eyes. rig.part picks the piece a sprite function draws (null = the whole
// animal, used for card portraits and the otter's float). Every piece shares one
// coordinate frame, so the rig is baked once at boot, each piece cropped to its own
// bounds, and a frame is a handful of blits with a rotation about a pivot. Nothing
// is rasterised live.
export const rig = { part: null };
export function on(p) { return rig.part === null || rig.part === p; }
