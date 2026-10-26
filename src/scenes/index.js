// The scene registry. A scene is one module in this folder plus one line below; the
// card's scene option and the editor's scene list both come from here, in this order,
// and the first is the default (a config with no scene key gets it).
//
// A scene module's default export:
//   id, label        the scene's name in config and in the editor
//   creatures        the looks that suit it (ids from creatures/index.js), for the editor's hint
//   bake(g, S)       paints the static background (g is already scaled to the device pixel
//                    ratio) and, before anything asks S.inZone, calls S.place(layout) with
//                    { lay, zones, water, patch, roam, home, exit, doors? }:
//                      zones  ellipses { x, y, rx, ry } nothing wanders into
//                      water  the ellipse the swimmers dive into, or null
//                      patch  the family's areas, roam everyone else's: rects { x0, x1, y0, y1 }
//                             or { has(x, y), pick() }, with an optional weight w
//                      home   the fallback spot; exit { x, y, off } where someone leaves
//   weather.ground(ctx, S, WX)  lying snow and the like, over the background
// and optionally:
//   village, grazers  true to run the engine's village / the meadow's grazers (meadow only)
//   start(i, S)      where person i starts; swimSpot(S) where the swimmers go for a dip
//   via(t, dest, S)  a waypoint on the way from t to dest, or null for a straight walk
//   ambient          { setup(S), update(dt, S), under, back, front, light (ctx, time, S) }:
//                    the scene's own life, drawn under the weather, behind the family, in
//                    front of it, and as lights over the dusk
// tests/check.mjs fails if an entry breaks this shape or a module in this folder is not listed.
import meadow from "./meadow.js";

export const SCENE_LIST = [meadow];
export const SCENE_BY_ID = {};
SCENE_LIST.forEach(function (s) { SCENE_BY_ID[s.id] = s; });
