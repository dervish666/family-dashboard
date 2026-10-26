// The scene registry. A scene is one module in this folder plus one line below; the
// card's scene option and the editor's scene list both come from here, in this order,
// and the first is the default (a config with no scene key gets it).
//
// A scene module's default export:
//   id, label        the scene's name in config and in the editor
//   creatures        the looks that suit it (ids from creatures/index.js), for the editor's hint
//   blurb            what it has, a phrase for the editor's Scene hint ("the meadow has ...")
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
//   indoor           true for a scene under a roof: the engine's clouds, rainbow, falling rain and
//                    snow, mist, lightning and blown leaves stay off; the scene draws its weather
//   darkSky          true when the top of the card is always dark: the clock and corner go light
//   flyer(ctx, x, y, dir, time, S)  draws the craft that tows the next-event banner (the plane)
//   disco(S)         { x, y, top }: where a party's glitter ball hangs and its cord starts
//   demoCast         looks for the default cast, by position, when the config names no people
//   experimental     true for a draft: the editor says so
//   start(i, S)      where person i starts; swimSpot(S) where the swimmers go for a dip
//   via(t, dest, S)  a waypoint on the way from t to dest, or null for a straight walk
//   ambient          { setup(S), update(dt, S), under, back, front, light (ctx, time, S) }:
//                    the scene's own life, drawn under the weather, behind the family, in
//                    front of it, and as lights over the dusk. S.music and S.party say how far
//                    the speaker's music and a party have faded in (0 to 1)
//   crier(S)         the town crier's walk for a new announcement (v1.7.0): { path, face, top?, look?,
//                    say?, head?, style? }. path runs from the door it comes out of to the spot it
//                    stands on (two points or more, inside the card); face is the side the scroll
//                    hangs (1 right, -1 left); top the scroll's top edge (default below the back
//                    row); look { col, hat } its colour and hat; say the shout ("Hear ye!"), head
//                    the scroll's heading, style "parchment" or "holo". It walks the path back home.
//   hotspots         the landmarks a tap opens, one for every id in HOTSPOT_IDS below:
//                    { box(S) -> [x0, y0, x1, y1], tap(S) } where tap() makes the puff or the
//                    "ding!". school opens the School card; home, music, printer and office
//                    open the card's view.<id> (a null view leaves that landmark as scenery).
//                    office may be { robot: true }: the office robot, where it walks.
//                    lay.school, if set, is where the School tag hangs: tag is its y, and cut
//                    [x, y, w, h] the piece of background the School card's portrait shows.
// tests/check.mjs fails if an entry breaks this shape or a module in this folder is not listed.
import meadow from "./meadow.js";
import seaside from "./seaside.js";
import winter from "./winter.js";
import forest from "./forest.js";
import station from "./station.js";

export const SCENE_LIST = [meadow, seaside, winter, forest, station];
// Every scene maps each of these to a landmark, in this order of tap priority.
export const HOTSPOT_IDS = ["school", "printer", "music", "home", "office"];
export const SCENE_BY_ID = {};
SCENE_LIST.forEach(function (s) { SCENE_BY_ID[s.id] = s; });
