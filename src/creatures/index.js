// The creature registry. Every look a person can be is one entry here, in this order;
// the first six are the default cast's, and the config falls back to them by position,
// so keep them first. A new animal is a module in this folder plus one line below.
//
// A creature module's default export:
//   id, label        the look's name in config and in the editor
//   sprite(o, eyes, k)  draws the whole animal (or, while rig.part is set, one piece) on a
//                    new canvas: { c, ax, ay, k }, anchored at the feet
//   editor           true to offer it in the visual editor's animal list
//   tg               where the name tag sits, in body radii above the feet
// and, for a rigged animal (all but the classic looks):
//   rig: { order, eyesIn, piv, extra? }   the pieces in draw order, the piece that carries
//                    the eyes, each piece's pivot from the feet in body radii, extra pieces
//   anim(t, p, time, M)  [rotation, dx, dy] for piece p this frame (undefined = still).
//                    M.g is the walk (0 to 1), M.idle its opposite, M.sleep 1 once the
//                    family is asleep (the eyes are shut by then; the pose is the module's)
//   sleeps           true when anim() has its own sleeping pose for M.sleep (tests check it)
//   hat              [x, y, tilt] of a party hat, sprite-local, in body radii
//   timers           the habit timers on t that the engine counts down
//   life(t, dt, still, A)   habits: sets timers at random. Nothing here moves a creature.
//   habits(t, dt, A)        longer acts (the crow's shiny, the swimmers' dive)
// tests/check.mjs fails if an entry breaks this shape or a module in this folder is not listed.
import { K, rig, canvas } from "../engine/draw.js";
import { classicSprite } from "./classic.js";
import crow from "./crow.js";
import capybara from "./capybara.js";
import deer from "./deer.js";
import shark from "./shark.js";
import otter from "./otter.js";
import snail from "./snail.js";
import fox from "./fox.js";
import hedgehog from "./hedgehog.js";
import owl from "./owl.js";
import rabbit from "./rabbit.js";
import frog from "./frog.js";
import cat from "./cat.js";

function classic(id, label, editor) { return { id: id, label: label, editor: editor, sprite: classicSprite }; }

export const CREATURES = [crow, capybara, deer, shark, otter, snail, fox, hedgehog, owl, rabbit, frog, cat,
  classic("bear", "Bear", true), classic("bunny", "Bunny (classic)", true),
  classic("phones", "Phones", false), classic("curls", "Curls", false), classic("flower", "Flower", false)];

export const CREATURE = {};
CREATURES.forEach(function (c) { CREATURE[c.id] = c; });

// Shared helper modules in this folder that are not creatures themselves.
export const HELPERS = ["index.js", "classic.js", "front.js", "swim.js"];

// o: { r, col, look, ... } a person or a stand-in. Unknown looks (the meadow's grazers,
// foxes and villagers) are classic sprites.
export function creatureSprite(o, eyes, k) {
  var c = CREATURE[o.look];
  return (c ? c.sprite : classicSprite)(o, eyes, k || K);
}

var EYE_STATES = ["open", "shut", "happy", "wide"];
// Draw one piece on a full-size canvas, then keep only its bounds.
function cropPart(full) {
  var c = full.c, g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data;
  var x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  var out = canvas(x1 - x0 + 1, y1 - y0 + 1); out.getContext("2d").drawImage(c, -x0, -y0);
  return { c: out, ox: x0, oy: y0 };
}
// Bake a person's rig once: every piece cropped to its bounds, the eye piece in four states.
export function bakeRig(p) {
  var C = CREATURE[p.look], D = C && C.rig; if (!D) return null;
  var R = { parts: {}, eyes: {}, ax: 0, ay: 0 };
  D.order.concat(D.extra || []).forEach(function (name) {
    if (name === D.eyesIn) return;
    rig.part = name; var full = C.sprite(p, "open", K); R.ax = full.ax; R.ay = full.ay;
    R.parts[name] = cropPart(full);
  });
  EYE_STATES.forEach(function (e) { rig.part = D.eyesIn; R.eyes[e] = cropPart(C.sprite(p, e, K)); });
  rig.part = null;
  return R;
}

// The habit timers the engine counts down: the common ones, then every creature's own.
export const TIMERS = ["cock", "flickL", "flickR", "chew", "curl", "twitch", "twL", "twR", "flick", "pronk", "graze", "wave", "startle", "gcool", "wcool", "scool"];
CREATURES.forEach(function (c) { (c.timers || []).forEach(function (k) { if (TIMERS.indexOf(k) < 0) TIMERS.push(k); }); });
