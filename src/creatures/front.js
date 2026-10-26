// The front-facing rig every four-legged family look shares: feet (or legs), a tail,
// two ears, a body with a lit gradient and a pale belly, then the face. An animal module
// fills in the parts that are its own through hooks, in this draw order:
//
//   feet(g, F)        feet or back legs, under the adult stretch
//   tail(g, F)        when the tail piece is drawn
//   back(g, F)        anything else behind the ears and body (the hedgehog's spines); checks on() itself
//   ear(g, F, side)   once per side, -1 then 1
//   body(g, F, e)     the body path, grown by e, filled by the template (rim, then gradient)
//   light             how much white the gradient's highlight takes (default 0.3)
//   belly(g, F)       the belly patch
//   front(g, F)       anything in front of the body but outside the stretch (the deer's front legs)
//   faceY             how far above the body centre the face sits for a kid, in r (default 0.08)
//   face(g, F)        muzzle, eyes, whiskers: checks on("eyes") etc. itself
//   phones            [dy, scale] of the headphones, in r (default [0, 1])
//   extra(g, F)       anything worn on top (the capybara's yuzu)
//   paw               { col(F), x, y } of the waving paw, in r from the body centre
//
// F carries o, eyes, k, r, cx, cy, feet, grow, S (the adult stretch), col, rim, and after
// the body dx (the look-ahead offset), fy (the face line) and headTop.
import { rig, on, canvas, shade, mix, rimmed, phonesAcc, daisyAcc } from "../engine/draw.js";

export function frontSprite(o, eyes, k, A) {
  var r = o.r * k, w = r * 3.6, cy = r * 2.1, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, feet = cy + r * 0.92, grow = 1.7 * k, S = 1.14;
  var col = (A.col && A.col(o)) || o.col, rim = shade(col, 0.6);
  var F = { o: o, eyes: eyes, k: k, r: r, cx: cx, cy: cy, feet: feet, grow: grow, S: S, col: col, rim: rim };
  if (o.adult) { g.save(); g.translate(cx, feet); g.scale(0.84, S); g.translate(-cx, -feet); }

  A.feet(g, F);
  if (on("tail") && A.tail) A.tail(g, F);
  if (A.back) A.back(g, F);
  [["earL", -1], ["earR", 1]].forEach(function (e2) { if (on(e2[0])) A.ear(g, F, e2[1]); });
  if (on("body")) {
    var body = function (e) { A.body(g, F, e); };
    g.fillStyle = rim; body(grow);
    var gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.25);
    gr.addColorStop(0, mix(col, "#ffffff", A.light == null ? 0.3 : A.light)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.86));
    g.fillStyle = gr; body(0);
    A.belly(g, F);
  }
  if (o.adult) g.restore();
  if (A.front) A.front(g, F);

  F.dx = r * (o.adult ? 0.08 : 0.1);
  F.headTop = o.adult ? feet - (feet - (cy - r * 0.86)) * S : cy - r * 0.9;
  F.fy = o.adult ? feet - (feet - cy) * S - r * 0.14 : cy - r * (A.faceY == null ? 0.08 : A.faceY);
  A.face(g, F);

  if (on("body")) {
    var ph = A.phones || [0, 1];
    if (o.phones) phonesAcc(g, cx, ph[0] ? cy + r * ph[0] : cy, ph[1] !== 1 ? r * ph[1] : r, "#A3B0F2");
    if (o.daisy) daisyAcc(g, cx, cy, r, k);
  }
  if (A.extra) A.extra(g, F);
  if (rig.part === "paw") {                                 // a waving paw, drawn only when someone says hello
    var P = A.paw, pc = P.col(F), pwy = cy + r * P.y, pwx = cx + r * P.x;
    rimmed(g, rim, pc, grow, function (e) { g.beginPath(); g.ellipse(pwx, pwy, r * 0.14 + e, r * 0.3 + e, 0.35, 0, 7); g.fill(); });
  }
  return { c: c, ax: cx, ay: feet, k: k };
}

// The paw wave every front-facing rig shares.
export function pawWave(M) { return [-0.9 * M.wave + 0.35 * Math.sin(M.time * 14) * M.wave, 0, 0]; }
