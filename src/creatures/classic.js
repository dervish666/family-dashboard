// The older whole-sprite looks: one baked picture per eye state, no rig. The meadow's
// grazers ("puff"), its foxes ("nibfox"), the villagers ("villager"), and the person looks
// bear, bunny, phones, curls and flower all come from here.
import { K, canvas, shade, mix, rimmed, face, phonesAcc, daisyAcc, hat, rr } from "../engine/draw.js";

// o: { r, col, look, fluff, adult, glasses, hat }  eyes: open | shut | happy
export function classicSprite(o, eyes, k) {
  k = k || K;
  var r = o.r * k, w = r * 3.6, cy = r * 2.1, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, col = o.col, feet = cy + r * 0.92;
  var rim = shade(col, 0.6), grow = 1.7 * k, dark = shade(col, 0.82), inner = mix(col, "#FF9FB5", 0.55);
  var ek = o.adult ? 0.8 : 1;                           // grown-ups have neater ears
  // Grown-ups are the same body drawn narrower and taller, pinned at the feet:
  // no longer a ball, so they stop reading as babies.
  var STRETCH = 1.14;
  if (o.adult) { g.save(); g.translate(cx, feet); g.scale(0.84, STRETCH); g.translate(-cx, -feet); }

  // behind the body: feet, tail, ears
  rimmed(g, rim, dark, grow, function (e) { [-1, 1].forEach(function (s) {
    g.beginPath(); g.ellipse(cx + s * r * 0.42, cy + r * 0.8, r * 0.24 + e, r * 0.14 + e, 0, 0, 7); g.fill(); }); });
  if (o.look === "fox") {
    rimmed(g, rim, col, grow, function (e) { g.beginPath(); g.ellipse(cx - r * 1.0, cy + r * 0.05, r * 0.5 + e, r * 0.3 + e, -0.7, 0, 7); g.fill(); });
    g.fillStyle = "#FFF6EA"; g.beginPath(); g.ellipse(cx - r * 1.3, cy - r * 0.26, r * 0.2, r * 0.14, -0.7, 0, 7); g.fill();
  }
  var ears = { bear: "round", puff: "nub", villager: "nub", bunny: "long", fox: "point", phones: "point", flower: "nub", curls: "none" }[o.look];
  [-1, 1].forEach(function (s) {
    if (ears === "round" || ears === "nub") {
      var er = (ears === "round" ? 0.3 : 0.2) * ek, ey = ears === "round" ? -0.72 : -0.74, ex = ears === "round" ? 0.62 : 0.56;
      rimmed(g, rim, col, grow, function (e) { g.beginPath(); g.arc(cx + s * r * ex, cy + r * ey, r * er + e, 0, 7); g.fill(); });
      g.fillStyle = inner; g.beginPath(); g.arc(cx + s * r * ex, cy + r * ey, r * er * 0.52, 0, 7); g.fill();
    } else if (ears === "long") {
      rimmed(g, rim, col, grow, function (e) { g.beginPath(); g.ellipse(cx + s * r * 0.36, cy - r * 1.18, r * 0.21 * ek + e, r * 0.56 + e, s * 0.2, 0, 7); g.fill(); });
      g.fillStyle = inner; g.beginPath(); g.ellipse(cx + s * r * 0.37, cy - r * 1.14, r * 0.1 * ek, r * 0.4, s * 0.2, 0, 7); g.fill();
    } else if (ears === "point") {
      var tri = function (e) { g.beginPath(); g.moveTo(cx + s * (r * 0.18 - e), cy - r * 0.72);
        g.lineTo(cx + s * (r * 0.84 + e), cy - r * 0.45); g.lineTo(cx + s * r * 0.66, cy - r * 1.3 - e); g.closePath(); g.fill(); };
      rimmed(g, rim, col, grow, tri);
      g.fillStyle = inner; g.beginPath(); g.moveTo(cx + s * r * 0.36, cy - r * 0.7);
      g.lineTo(cx + s * r * 0.7, cy - r * 0.55); g.lineTo(cx + s * r * 0.63, cy - r * 1.08); g.closePath(); g.fill();
    }
  });

  // body: a mochi ellipse, scalloped for the fluffy grazers
  var body = function (e) {
    g.beginPath(); g.ellipse(cx, cy, r + e, r * 0.9 + e, 0, 0, 7); g.fill();
    if (o.fluff) for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2;
      g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.8, r * 0.24 + e, 0, 7); g.fill(); }
  };
  g.fillStyle = rim; body(grow);
  var gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.25);
  gr.addColorStop(0, mix(col, "#ffffff", o.adult ? 0.3 : 0.5)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.86));
  g.fillStyle = gr; body(0);
  g.fillStyle = o.look === "fox" ? "#FFF3E2" : mix(col, "#ffffff", 0.55);
  g.globalAlpha = 0.85; g.beginPath(); g.ellipse(cx, cy + r * 0.4, r * 0.55, r * 0.38, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  if (o.adult) g.restore();

  var dx = r * (o.adult ? 0.08 : 0.1);                  // looks the way it walks (+x)
  var fy = o.adult ? feet - (feet - cy) * STRETCH - r * 0.14 : cy - r * 0.08;
  face(g, cx, fy, r, eyes, dx, o.adult);
  if (o.glasses) {                                      // round reading glasses
    g.strokeStyle = "#3C3950"; g.lineWidth = r * 0.05;
    [-1, 1].forEach(function (s) { g.beginPath(); g.arc(cx + dx + s * r * 0.27, fy, r * 0.16, 0, 7); g.stroke(); });
    g.beginPath(); g.moveTo(cx + dx - r * 0.11, fy - r * 0.02); g.quadraticCurveTo(cx + dx, fy - r * 0.08, cx + dx + r * 0.11, fy - r * 0.02); g.stroke();
  }
  if (o.look === "fox" && eyes === "open") {           // cheeky brows: the one hunter cue
    g.strokeStyle = shade(col, 0.45); g.lineWidth = r * 0.06;
    [-1, 1].forEach(function (s) { var x = cx + dx + s * r * 0.34; g.beginPath();
      g.moveTo(x - r * 0.12, cy - r * (s < 0 ? 0.42 : 0.36)); g.lineTo(x + r * 0.12, cy - r * (s < 0 ? 0.36 : 0.42)); g.stroke(); });
  }

  // on top: accessories
  if (o.look === "phones") phonesAcc(g, cx, cy, r, col);
  else if (o.look === "curls") {
    [[-0.2, -0.95, 0.19], [0.04, -1.06, 0.22], [0.26, -0.96, 0.17]].forEach(function (p) {
      rimmed(g, rim, shade(col, 0.9), grow, function (e) { g.beginPath(); g.arc(cx + r * p[0], cy + r * p[1], r * p[2] + e, 0, 7); g.fill(); }); });
    g.fillStyle = "#FF8FB1"; var bx = cx + r * 0.46, by = cy - r * 0.84;   // bow
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - r * 0.2, by - r * 0.12); g.lineTo(bx - r * 0.2, by + r * 0.12); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + r * 0.2, by - r * 0.12); g.lineTo(bx + r * 0.2, by + r * 0.12); g.closePath(); g.fill();
    g.beginPath(); g.arc(bx, by, r * 0.06, 0, 7); g.fill();
  } else if (o.look === "flower") daisyAcc(g, cx, cy, r, k);
  if (o.hat) hat(g, o.hat, cx, cy, r, grow);
  return { c: c, ax: cx, ay: feet, k: k };
}
