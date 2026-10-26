// The space station: the observation deck of a friendly little station. The whole back
// of the room is one big window onto space: stars, a pink and teal nebula, a ringed planet
// rising over the sill, a moon, and ships going about their day. Under the window the hull
// wall carries the airlock to the shuttle bay on the far left, the comms console with its dish
// and speakers, an open door onto the corridor, the fabricator (the 3D printer bay) and the
// bridge terminal with the captain's chair. On the deck: the family's hab pod, the holo table
// in the middle where everyone gathers, cargo crates, and the hydroponics corner with its
// glowing plants, grow lights and a round pool. A cleaning bot potters about and a little drone
// waters the plants.
//
// Day and night are the station's cycle: by night the wall lights dim, the floor guide lights
// and the screens glow, the planet's dark side shows its cities and the stars come out
// brighter. The weather is what the window shows: cloud is drifting nebula, rain a meteor
// shower (and the hydroponics misters run), a storm a solar flare (shields up, amber
// beacons), snow an ice field drifting past with frost on the glass, fog a thick nebula, a
// rainbow an aurora over the planet. Wind is ignored inside. The engine's own sky layers are
// off (indoor: true); the next-event banner is towed past the window by a little tug.
//
// No village population: school and away duties go out through the airlock, off the left
// edge. The swimmers dive in the hydroponics pool.
import { rand, pick, rr, rimmed, canvas, mix, shade } from "../engine/draw.js";
import { around } from "../engine/route.js";

var G = null;

// space and window
var SPACE0 = "#141537", SPACE1 = "#22265A", SPACE2 = "#343A7E";
// the hull: pale lilac-grey panels, a teal stripe, coral and yellow accents
var HULL = "#DCDDF0", HULL2 = "#C9CBE4", SEAM = "#AEB1D2", TEAL = "#5FC2BE", CORAL = "#F08A7E", SUN = "#F4C95D";
var METAL = "#9095BC", METAL_D = "#5E6392", METAL_L = "#C6C9E6", INKY = "#3A3D66";
var HOLO = "#8CEFF5";

function layout(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP;
  var SILL = Math.round(HZ + 4), WT = SILL + 16, B = TOP + 70;
  G = { W: W, H: H, HZ: HZ, TOP: TOP, SILL: SILL, WT: WT, B: B, DPR: S.DPR || 1 };
  G.lock = { x: Math.round(Math.max(86, W * 0.07)), y: B };                 // the airlock, far left on the wall
  G.comms = { x: Math.round(W * 0.405), y: B };
  G.door = { x: Math.round(W * 0.548), y: B };                              // the corridor
  G.fab = { x: Math.round(W * 0.685), y: B };
  G.bridge = { x: Math.round(W * 0.875), y: B + 34 };
  G.pod = { x: Math.round(W * 0.245), y: Math.round(H * 0.6) };             // the hab pod, on the deck
  G.table = { x: Math.round(W * 0.5), y: Math.round(H * 0.71) };            // the holo table
  G.garden = { x: Math.round(W * 0.905), y: Math.round(H * 0.79) };          // hydroponics
  G.pool = { x: Math.round(W * 0.735), y: Math.round(H * 0.905), rx: Math.min(100, W * 0.078), ry: 30 };
  G.crates = { x: Math.round(W * 0.115), y: B + 74 };
  G.planet = { x: Math.round(W * 0.6), y: SILL + 26, r: Math.round(Math.min(150, W * 0.118)) };
  G.moon = { x: Math.round(W * 0.885), y: 132, r: 22 };
  G.mull = [Math.round(W * 0.29), Math.round(W * 0.752)];                    // the window's two mullions, clear of the clock and the corner
  var t = G.table, p = G.pod, gd = G.garden;
  var zones = [{ x: t.x, y: t.y + 2, rx: 112, ry: 40 }, { x: p.x, y: p.y - 18, rx: 118, ry: 50 },
    { x: gd.x, y: gd.y - 14, rx: 130, ry: 46 }, { x: G.bridge.x - 10, y: G.bridge.y + 8, rx: 120, ry: 34 },
    { x: G.pool.x, y: G.pool.y, rx: G.pool.rx, ry: G.pool.ry }, { x: G.crates.x, y: G.crates.y - 4, rx: 62, ry: 22 },
    { x: G.comms.x, y: B + 16, rx: 84, ry: 22 }, { x: G.fab.x, y: B + 16, rx: 70, ry: 20 }];
  G.big = zones.slice(0, 4);
  var deck = { has: function (x, y) { return y > B + 44 && y < H - 24 && x > 46 && x < W - 40; },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(56, W - 50), y = rand(B + 50, H - 30); if (deck.has(x, y)) return { x: x, y: y }; } return { x: W * 0.4, y: H * 0.8 }; } };
  return {
    lay: { table: zones[0], school: { x: G.lock.x, y: B + 14, tag: B - 84, cut: [G.lock.x - 86, B - 150, 240, 180] } },
    zones: zones, water: G.pool,
    patch: [deck], roam: [deck],
    home: { x: W * 0.4, y: H * 0.86 },
    // through the airlock to the shuttle bay, off the left edge
    exit: { x: G.lock.x + 8, y: B + 16, off: { x: -60, y: B + 12 } }
  };
}

// ── The background, baked once per size ───────────────────────────────────────
function bake(g, S) {
  var L = layout(S), W = S.W, H = S.H, B = G.B, i;
  S.place(L);
  space(g);
  wall(g);
  deckFloor(g);
  // on the wall, left to right
  airlockFrame(g, G.lock.x, B);
  comms(g, G.comms.x, B);
  corridor(g, G.door.x, B);
  fabricator(g, G.fab.x, B);
  holoPanels(g);
  bridge(g, G.bridge.x, G.bridge.y);
  // on the deck, back to front
  crates(g, G.crates.x, G.crates.y);
  pottedPlant(g, G.comms.x - 104, B + 30, 1);
  pottedPlant(g, G.fab.x + 92, B + 28, 0.85);
  habPod(g, G.pod.x, G.pod.y);
  holoTable(g, G.table.x, G.table.y);
  pool(g);
  garden(g, G.garden.x, G.garden.y);
  // the window frame and sill sit over the ships: baked on their own, drawn in back()
  G.frame = canvas(W * G.DPR, (G.WT + 30) * G.DPR); var f = G.frame.getContext("2d"); f.scale(G.DPR, G.DPR);
  frame(f);
  void H; void i;
}

function space(g) {
  var W = G.W, S = G.SILL, i, x, y;
  var sky = g.createLinearGradient(0, 0, 0, S);
  sky.addColorStop(0, SPACE0); sky.addColorStop(0.6, SPACE1); sky.addColorStop(1, SPACE2);
  g.fillStyle = sky; g.fillRect(0, 0, W, S + 2);
  // the nebula: soft pink, teal and violet clouds, brightest behind the planet
  [[0.5, 0.4, 260, "232,127,181", 0.3], [0.78, 0.55, 220, "92,201,201", 0.24], [0.62, 0.15, 180, "140,111,214", 0.28],
    [0.2, 0.75, 200, "140,111,214", 0.18], [0.94, 0.25, 160, "232,127,181", 0.18], [0.36, 0.2, 140, "92,201,201", 0.12]].forEach(function (n) {
    var nx = W * n[0], ny = S * n[1], gr = g.createRadialGradient(nx, ny, 4, nx, ny, n[2]);
    gr.addColorStop(0, "rgba(" + n[3] + "," + n[4] + ")"); gr.addColorStop(1, "rgba(" + n[3] + ",0)");
    g.fillStyle = gr; g.fillRect(nx - n[2], ny - n[2], n[2] * 2, n[2] * 2); });
  // stars: a dust of small ones, then a few bright four-point ones
  for (i = 0; i < 260; i++) { x = rand(0, W); y = rand(0, S); g.fillStyle = "rgba(255,255,255," + rand(0.25, 0.85).toFixed(2) + ")"; var s = Math.random() < 0.85 ? 1 : 1.8; g.fillRect(x, y, s, s); }
  for (i = 0; i < 16; i++) sparkle(g, rand(0, W), rand(6, S - 20), rand(3, 6), pick(["#FFFFFF", "#FFF2C4", "#CFE9FF"]));
  // a distant galaxy, a little spiral smudge
  var gx = W * 0.24, gy = S * 0.62; g.save(); g.translate(gx, gy); g.rotate(-0.4);
  var gg = g.createRadialGradient(0, 0, 1, 0, 0, 30); gg.addColorStop(0, "rgba(255,240,220,.55)"); gg.addColorStop(1, "rgba(200,180,255,0)");
  g.fillStyle = gg; g.beginPath(); g.ellipse(0, 0, 30, 10, 0, 0, 7); g.fill(); g.restore();
  planet(g);
  moon(g, G.moon.x, G.moon.y, G.moon.r);
}
function sparkle(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  g.beginPath(); g.arc(x, y, r * 0.22, 0, 7); g.fill();
}
// The ringed planet, lit from the right, its lower half behind the sill.
function planet(g) {
  var P = G.planet, x = P.x, y = P.y, r = P.r;
  ring(g, x, y, r, true);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
  var base = g.createRadialGradient(x + r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
  base.addColorStop(0, "#FFD9B0"); base.addColorStop(0.5, "#F2A983"); base.addColorStop(1, "#C7746E");
  g.fillStyle = base; g.fillRect(x - r, y - r, r * 2, r * 2);
  // cloud bands, gently wavy
  [[-0.72, 0.07, "rgba(255,236,206,.55)"], [-0.5, 0.1, "rgba(214,120,108,.45)"], [-0.28, 0.06, "rgba(255,226,190,.5)"], [-0.1, 0.12, "rgba(226,140,112,.4)"],
    [0.12, 0.06, "rgba(255,236,206,.45)"], [0.3, 0.09, "rgba(206,112,104,.4)"]].forEach(function (b) {
    g.fillStyle = b[2]; g.beginPath(); var by = y + r * b[0];
    g.moveTo(x - r, by); for (var k = 0; k <= 20; k++) { var px = x - r + k * r / 10; g.lineTo(px, by + Math.sin(k * 1.3 + b[0] * 9) * r * 0.02); }
    for (k = 20; k >= 0; k--) { px = x - r + k * r / 10; g.lineTo(px, by + r * b[1] + Math.sin(k * 1.1 + b[0] * 7) * r * 0.02); } g.closePath(); g.fill(); });
  // the storm spot
  g.fillStyle = "rgba(196,98,92,.55)"; g.beginPath(); g.ellipse(x + r * 0.32, y - r * 0.18, r * 0.16, r * 0.07, -0.05, 0, 7); g.fill();
  g.fillStyle = "rgba(255,226,196,.5)"; g.beginPath(); g.ellipse(x + r * 0.3, y - r * 0.2, r * 0.08, r * 0.03, -0.05, 0, 7); g.fill();
  // night side: the shadow from the left
  var sh = g.createLinearGradient(x - r, 0, x + r * 0.5, 0);
  sh.addColorStop(0, "rgba(28,26,74,.88)"); sh.addColorStop(0.45, "rgba(28,26,74,.5)"); sh.addColorStop(1, "rgba(28,26,74,0)");
  g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = "rgba(255,240,220,.65)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r - 1, -1.3, 0.4); g.stroke();   // the lit rim
  ring(g, x, y, r, false);
  // city lights on the dark side, used at night
  G.cities = []; for (var i = 0; i < 26; i++) { var a = rand(2.1, 3.9), d = rand(0.2, 0.92); var cx = x + Math.cos(a) * r * d, cy = y + Math.sin(a) * r * d * 0.9;
    if (cy < G.SILL - 4) G.cities.push({ x: cx, y: cy, s: rand(1, 2.2) }); }
}
function ring(g, x, y, r, backHalf) {
  g.save(); g.translate(x, y); g.rotate(-0.16);
  g.beginPath(); if (backHalf) g.rect(-r * 2.2, -r, r * 4.4, r); else g.rect(-r * 2.2, 0, r * 4.4, r); g.clip();
  [[1.95, 0.42, 9, "rgba(244,226,184,.55)"], [1.75, 0.37, 7, "rgba(230,190,160,.5)"], [1.55, 0.32, 4, "rgba(255,240,214,.45)"]].forEach(function (q) {
    g.strokeStyle = q[3]; g.lineWidth = q[2]; g.beginPath(); g.ellipse(0, 0, r * q[0], r * q[1], 0, 0, 7); g.stroke(); });
  g.restore();
}
function moon(g, x, y, r) {
  var gr = g.createRadialGradient(x + r * 0.3, y - r * 0.3, 1, x, y, r);
  gr.addColorStop(0, "#F1F2FA"); gr.addColorStop(1, "#A9ACC8");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = "rgba(120,124,160,.45)"; [[-0.3, -0.1, 0.22], [0.25, 0.3, 0.16], [0.1, -0.4, 0.12]].forEach(function (c) { g.beginPath(); g.arc(x + c[0] * r, y + c[1] * r, c[2] * r, 0, 7); g.fill(); });
  g.fillStyle = "rgba(28,26,74,.45)"; g.beginPath(); g.arc(x, y, r, 1.9, 4.4); g.closePath(); g.fill();
}

// The window frame: the sill, the two mullions, glass glints and a few things on the ledge.
function frame(g) {
  var W = G.W, S = G.SILL, WT = G.WT;
  // glass: two faint diagonal glints
  g.save(); g.beginPath(); g.rect(0, 0, W, S); g.clip();
  g.fillStyle = "rgba(255,255,255,.045)";
  [[0.08, 70], [0.15, 26], [0.57, 90], [0.63, 30]].forEach(function (s) { var x0 = W * s[0]; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + s[1], 0); g.lineTo(x0 + s[1] - 140, S); g.lineTo(x0 - 140, S); g.closePath(); g.fill(); });
  g.restore();
  // the mullions, with a bolt plate top and bottom
  G.mull.forEach(function (mx) {
    rimmed(g, METAL_D, METAL, 2, function (e) { g.fillRect(mx - 7 - e, -2, 14 + 2 * e, S + 4); });
    g.fillStyle = METAL_L; g.fillRect(mx - 4, 0, 3, S);
    [S - 24, 30].forEach(function (by) { rimmed(g, METAL_D, METAL_L, 1.5, function (e) { rr(g, mx - 11 - e, by - e, 22 + 2 * e, 18 + 2 * e, 4); g.fill(); });
      g.fillStyle = METAL_D; [[-5, 5], [5, 5], [-5, 13], [5, 13]].forEach(function (b) { g.beginPath(); g.arc(mx + b[0], by + b[1], 1.6, 0, 7); g.fill(); }); }); });
  // the sill: a ledge with a lit lip, a coral stripe under it
  var sg = g.createLinearGradient(0, S - 6, 0, WT);
  sg.addColorStop(0, METAL_L); sg.addColorStop(0.35, "#B5B9DA"); sg.addColorStop(1, "#8C91B8");
  g.fillStyle = METAL_D; g.fillRect(0, S - 8, W, WT - S + 10);
  g.fillStyle = sg; g.fillRect(0, S - 6, W, WT - S + 6);
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(0, S - 6, W, 2);
  g.fillStyle = CORAL; g.fillRect(0, WT, W, 3);
  g.fillStyle = "rgba(40,40,80,.18)"; g.fillRect(0, WT + 3, W, 6);
  // on the ledge: a pot of space succulent, a mug, a toy rocket, a little telescope
  var y = S - 6;
  succulent(g, W * 0.29, y);
  rimmed(g, "#3E7A8C", "#6CC4D6", 1.2, function (e) { rr(g, W * 0.465 - e, y - 14 - e, 13 + 2 * e, 14 + 2 * e, 3); g.fill(); });           // a mug
  g.strokeStyle = "#3E7A8C"; g.lineWidth = 2; g.beginPath(); g.arc(W * 0.465 + 15, y - 7, 4, -1.4, 1.4); g.stroke();
  toyRocket(g, W * 0.97, y);
  telescope(g, W * 0.765, y);
}
function succulent(g, x, y) {
  rimmed(g, "#B0563F", "#E68A63", 1.2, function (e) { g.beginPath(); g.moveTo(x - 12 - e, y - 16 - e); g.lineTo(x + 12 + e, y - 16 - e); g.lineTo(x + 9 + e, y); g.lineTo(x - 9 - e, y); g.closePath(); g.fill(); });
  [[-0.9, "#7BC4A8"], [-0.35, "#8FD6B8"], [0.3, "#7BC4A8"], [0.85, "#6AB898"], [0, "#A6E6C8"]].forEach(function (l) {
    g.save(); g.translate(x, y - 16); g.rotate(l[0]); rimmed(g, "#4E9A80", l[1], 1, function (e) { g.beginPath(); g.ellipse(0, -9, 4.5 + e, 10 + e, 0, 0, 7); g.fill(); }); g.restore(); });
  g.fillStyle = "#F4C95D"; g.beginPath(); g.arc(x + 2, y - 33, 3, 0, 7); g.fill();
}
function toyRocket(g, x, y) {
  rimmed(g, "#9A3E36", "#F08A7E", 1.2, function (e) { g.beginPath(); g.moveTo(x - 6 - e, y - 4); g.lineTo(x - 12 - e, y + e); g.lineTo(x + 12 + e, y + e); g.lineTo(x + 6 + e, y - 4); g.closePath(); g.fill(); });
  rimmed(g, "#8E93B8", "#F4F1F8", 1.2, function (e) { g.beginPath(); g.moveTo(x - 6 - e, y - 2); g.lineTo(x - 6 - e, y - 22); g.quadraticCurveTo(x, y - 38 - e, x + 6 + e, y - 22); g.lineTo(x + 6 + e, y - 2); g.closePath(); g.fill(); });
  g.fillStyle = "#6CC4D6"; g.beginPath(); g.arc(x, y - 18, 3, 0, 7); g.fill();
}
function telescope(g, x, y) {
  g.strokeStyle = INKY; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x - 8, y); g.moveTo(x, y - 14); g.lineTo(x + 8, y); g.moveTo(x, y - 14); g.lineTo(x, y); g.stroke();
  g.save(); g.translate(x, y - 16); g.rotate(-0.5);
  rimmed(g, "#3A3D66", "#F4C95D", 1.2, function (e) { rr(g, -14 - e, -4 - e, 30 + 2 * e, 8 + 2 * e, 3); g.fill(); });
  g.fillStyle = "#3A3D66"; g.fillRect(14, -5, 4, 10); g.restore();
}

// The hull wall under the window: pale panels, seams and rivets, the teal stripe, a kick plate.
function wall(g) {
  var W = G.W, WT = G.WT, B = G.B, i;
  var wg = g.createLinearGradient(0, WT, 0, B);
  wg.addColorStop(0, "#C4C6E2"); wg.addColorStop(0.18, HULL); wg.addColorStop(1, HULL2);
  g.fillStyle = wg; g.fillRect(0, WT, W, B - WT + 2);
  g.strokeStyle = SEAM; g.lineWidth = 1.2;
  for (i = 0; i <= 15; i++) { var x = i * W / 15 + 20; g.beginPath(); g.moveTo(x, WT + 6); g.lineTo(x, B - 22); g.stroke();
    g.fillStyle = SEAM; g.beginPath(); g.arc(x - 6, WT + 14, 1.5, 0, 7); g.arc(x + 6, WT + 14, 1.5, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(0, (WT + B) / 2 - 6); g.lineTo(W, (WT + B) / 2 - 6); g.stroke();
  // a vent grille under the sill every few panels
  for (i = 0; i < 6; i++) { var vx = W * (0.2 + i * 0.13); g.fillStyle = "#B7BAD8"; rr(g, vx - 22, WT + 8, 44, 10, 3); g.fill();
    g.fillStyle = "rgba(60,64,110,.35)"; for (var k = 0; k < 5; k++) g.fillRect(vx - 18 + k * 8, WT + 10, 4, 6); }
  g.fillStyle = TEAL; g.fillRect(0, B - 22, W, 6);
  g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, B - 22, W, 1.5);
  g.fillStyle = "#9EA2C6"; g.fillRect(0, B - 14, W, 14);
  g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, B - 14, W, 1.5);
  // the guide lights along the kick plate (lit at night in light())
  G.kick = []; for (i = 0; i < 40; i++) { var lx = (i + 0.5) * W / 40; G.kick.push(lx); g.fillStyle = "#E6F6F8"; rr(g, lx - 4, B - 9, 8, 3, 1.5); g.fill(); }
}
// The deck: plated, in perspective, with a ring under the holo table and guide strips.
function deckFloor(g) {
  var W = G.W, H = G.H, B = G.B, i;
  var fg = g.createLinearGradient(0, B, 0, H);
  fg.addColorStop(0, "#9FA4C9"); fg.addColorStop(0.25, "#B3B8D9"); fg.addColorStop(1, "#A6ACD0");
  g.fillStyle = fg; g.fillRect(0, B, W, H - B);
  // a soft pool of light in the middle
  var lg = g.createRadialGradient(W * 0.5, H * 0.72, 30, W * 0.5, H * 0.72, W * 0.5);
  lg.addColorStop(0, "rgba(255,250,240,.28)"); lg.addColorStop(1, "rgba(255,250,240,0)"); g.fillStyle = lg; g.fillRect(0, B, W, H - B);
  // the plates: rows closing up towards the wall, seams fanning to a point above the window
  g.strokeStyle = "rgba(80,86,140,.16)"; g.lineWidth = 1.2;
  var y = B; for (i = 0; y < H; i++) { y = B + 8 + Math.pow(i, 1.55) * 9; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  var vx = W * 0.5, vy = B - 600;
  for (i = -14; i <= 14; i++) { var bx = vx + i * W / 9; g.beginPath(); g.moveTo(vx + (bx - vx) * (B - vy) / (H - vy), B); g.lineTo(bx, H); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
  y = B; for (i = 0; y < H; i++) { y = B + 9 + Math.pow(i, 1.55) * 9; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = "rgba(40,40,80,.16)"; g.fillRect(0, B, W, 6);
  // the deck ring under the holo table
  var t = G.table;
  [[170, 56, "rgba(95,194,190,.28)", 6], [150, 48, "rgba(255,255,255,.35)", 2], [196, 66, "rgba(95,194,190,.18)", 3]].forEach(function (q) {
    g.strokeStyle = q[2]; g.lineWidth = q[3]; g.beginPath(); g.ellipse(t.x, t.y + 6, q[0], q[1], 0, 0, 7); g.stroke(); });
  // the hazard strip in front of the airlock, and guide dots from it to the middle
  var lx = G.lock.x;
  g.save(); g.beginPath(); g.moveTo(lx - 60, B + 4); g.lineTo(lx + 66, B + 4); g.lineTo(lx + 78, B + 22); g.lineTo(lx - 62, B + 22); g.closePath(); g.clip();
  g.fillStyle = SUN; g.fillRect(lx - 80, B, 180, 30); g.fillStyle = INKY;
  for (i = -6; i < 10; i++) { g.beginPath(); g.moveTo(lx - 60 + i * 16, B + 22); g.lineTo(lx - 52 + i * 16, B + 22); g.lineTo(lx - 40 + i * 16, B + 4); g.lineTo(lx - 48 + i * 16, B + 4); g.closePath(); g.fill(); }
  g.restore();
  G.guide = []; for (i = 0; i < 12; i++) { var k = i / 11, gx = lx + 40 + (t.x - 170 - lx - 40) * k, gy = B + 34 + (t.y - B - 34) * Math.pow(k, 1.4);
    G.guide.push({ x: gx, y: gy }); g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(gx, gy, 4, 1.8, 0, 0, 7); g.fill(); }
}

// ── Furniture on the wall ─────────────────────────────────────────────────────
// The airlock: a stadium-shaped hatch in a chevron frame. The door (drawn live) slides up
// into the wall for whoever is leaving; behind it the tunnel runs to the shuttle's lit door.
function airlockFrame(g, x, y) {
  var w = 96, h = 98, top = y - h, i;
  g.fillStyle = "rgba(40,40,80,.22)"; g.beginPath(); g.ellipse(x, y + 4, 70, 9, 0, 0, 7); g.fill();
  rimmed(g, METAL_D, "#B9BDDC", 2, function (e) { rr(g, x - w / 2 - 12 - e, top - 12 - e, w + 24 + 2 * e, h + 12 + 2 * e, 40); g.fill(); });
  g.save(); rr(g, x - w / 2 - 7, top - 7, w + 14, h + 7, 36); g.clip();                    // the chevron ring
  g.fillStyle = SUN; g.fillRect(x - w / 2 - 10, top - 10, w + 20, h + 12); g.fillStyle = INKY;
  for (i = -8; i < 12; i++) { g.beginPath(); g.moveTo(x - w / 2 - 10 + i * 18, top - 10); g.lineTo(x - w / 2 - 1 + i * 18, top - 10); g.lineTo(x - w / 2 - 1 + i * 18 - 70, y + 4); g.lineTo(x - w / 2 - 10 + i * 18 - 70, y + 4); g.closePath(); g.fill(); }
  g.restore();
  G.lockHole = { x: x - w / 2, y: top, w: w, h: h, r: 30 };
  var tg = g.createLinearGradient(0, top, 0, y); tg.addColorStop(0, "#2B2E5A"); tg.addColorStop(1, "#4A4F86");
  g.fillStyle = tg; rr(g, x - w / 2, top, w, h, 30); g.fill();
  g.strokeStyle = "rgba(140,239,245,.55)"; g.lineWidth = 2;                         // the tunnel's ribs
  [0.18, 0.4, 0.6].forEach(function (k) { rr(g, x - w * (0.46 - k * 0.32), top + h * (0.04 + k * 0.3), w * (0.92 - k * 0.64), h * (0.96 - k * 0.6), 30 * (1 - k * 0.7)); g.stroke(); });
  g.fillStyle = "#F4C95D"; rr(g, x - 9, y - h * 0.62, 18, 24, 6); g.fill();                     // the shuttle's lit door at the end
  g.fillStyle = "#FFF3C4"; g.beginPath(); g.arc(x, y - h * 0.62 + 9, 4, 0, 7); g.fill();
  G.lockLamp = { x: x + w / 2 + 22, y: top + 10 };
  rimmed(g, METAL_D, METAL_L, 1.5, function (e) { rr(g, x + w / 2 + 14 - e, top - 2 - e, 16 + 2 * e, 50 + 2 * e, 6); g.fill(); });
  g.fillStyle = INKY; rr(g, x + w / 2 + 17, top + 22, 10, 20, 3); g.fill();                              // the keypad
  g.fillStyle = "#8CEFF5"; for (i = 0; i < 6; i++) g.fillRect(x + w / 2 + 18.5 + (i % 2) * 4, top + 24 + Math.floor(i / 2) * 6, 3, 3);
}
// The comms console: a desk with a screen, two round speakers, a dish on a mast.
function comms(g, x, y) {
  g.fillStyle = "rgba(40,40,80,.22)"; g.beginPath(); g.ellipse(x, y + 6, 92, 10, 0, 0, 7); g.fill();
  // the mast and dish (the dish itself turns, drawn live)
  g.fillStyle = METAL_D; g.fillRect(x + 50, y - 120, 5, 64);
  G.dish = { x: x + 52, y: y - 124 };
  // the speakers either side
  [-1, 1].forEach(function (s) { var sx = x + s * 70;
    rimmed(g, INKY, "#7C80AE", 2, function (e) { rr(g, sx - 20 - e, y - 82 - e, 40 + 2 * e, 82 + 2 * e, 8); g.fill(); });
    g.fillStyle = "#4B4F82"; g.beginPath(); g.arc(sx, y - 56, 13, 0, 7); g.fill(); g.beginPath(); g.arc(sx, y - 22, 9, 0, 7); g.fill(); });
  G.speakers = [{ x: x - 70, y: y - 56 }, { x: x + 70, y: y - 56 }, { x: x - 70, y: y - 22 }, { x: x + 70, y: y - 22 }];
  // the desk
  rimmed(g, INKY, "#E8E9F6", 2, function (e) { g.beginPath(); g.moveTo(x - 52 - e, y + e); g.lineTo(x - 52 - e, y - 40); g.lineTo(x - 44, y - 50 - e); g.lineTo(x + 44, y - 50 - e); g.lineTo(x + 52 + e, y - 40); g.lineTo(x + 52 + e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = TEAL; g.fillRect(x - 52, y - 30, 104, 4);
  // its sloped top with knobs and sliders
  g.fillStyle = "#C9CBE4"; g.beginPath(); g.moveTo(x - 44, y - 50); g.lineTo(x + 44, y - 50); g.lineTo(x + 50, y - 40); g.lineTo(x - 50, y - 40); g.closePath(); g.fill();
  [CORAL, SUN, TEAL, "#9A8BE0", CORAL].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(x - 34 + i * 17, y - 45, 3, 0, 7); g.fill(); });
  // the screen, its waves drawn live
  rimmed(g, INKY, "#22264E", 2, function (e) { rr(g, x - 38 - e, y - 96 - e, 76 + 2 * e, 40 + 2 * e, 6); g.fill(); });
  G.commsScreen = { x: x - 34, y: y - 92, w: 68, h: 32 };
  g.fillStyle = "#3A3D66"; g.fillRect(x - 4, y - 56, 8, 6);
  rimmed(g, INKY, "#F4F1F8", 1.2, function (e) { rr(g, x - 24 - e, y - 24 - e, 48 + 2 * e, 13 + 2 * e, 4); g.fill(); });
  g.fillStyle = INKY; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("COMMS", x, y - 17.2);
}
// The corridor: an open door onto a lit passage with a floor light strip, door leaves slid away.
function corridor(g, x, y) {
  var w = 92, h = 104, top = y - h;
  rimmed(g, METAL_D, "#B9BDDC", 2, function (e) { rr(g, x - w / 2 - 10 - e, top - 10 - e, w + 20 + 2 * e, h + 10 + 2 * e, 14); g.fill(); });
  // the passage: walls converging to a far door
  var fx0 = x - 16, fx1 = x + 16, fy0 = top + 34, fy1 = y - 30;
  var cg = g.createLinearGradient(0, top, 0, y); cg.addColorStop(0, "#E9EAF8"); cg.addColorStop(1, "#C6C9E4");
  g.fillStyle = cg; g.fillRect(x - w / 2, top, w, h);
  g.fillStyle = "#AEB2D6"; g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(fx0, fy0); g.lineTo(fx0, fy1); g.lineTo(x - w / 2, y); g.closePath(); g.fill();
  g.fillStyle = "#B8BCDC"; g.beginPath(); g.moveTo(x + w / 2, top); g.lineTo(fx1, fy0); g.lineTo(fx1, fy1); g.lineTo(x + w / 2, y); g.closePath(); g.fill();
  g.fillStyle = "#9FA4C9"; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(fx0, fy1); g.lineTo(fx1, fy1); g.lineTo(x + w / 2, y); g.closePath(); g.fill();
  g.fillStyle = "#D6D8F0"; g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(fx0, fy0); g.lineTo(fx1, fy0); g.lineTo(x + w / 2, top); g.closePath(); g.fill();
  g.fillStyle = "#8C91B8"; g.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);                       // the far door
  g.fillStyle = TEAL; g.fillRect(fx0 + 4, fy0 + 4, fx1 - fx0 - 8, 3);
  g.strokeStyle = "rgba(140,239,245,.8)"; g.lineWidth = 2;                                 // the light strip down the floor
  g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x, fy1); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1;
  [0.3, 0.6].forEach(function (k) { g.beginPath(); g.moveTo(x - w / 2 + (fx0 - x + w / 2) * k, top + (fy0 - top) * k); g.lineTo(x - w / 2 + (fx0 - x + w / 2) * k, y + (fy1 - y) * k); g.stroke();
    g.beginPath(); g.moveTo(x + w / 2 + (fx1 - x - w / 2) * k, top + (fy0 - top) * k); g.lineTo(x + w / 2 + (fx1 - x - w / 2) * k, y + (fy1 - y) * k); g.stroke(); });
  G.corr = { x: x, top: top, y: y, w: w, fy0: fy0, fy1: fy1 };
  // the door leaves, slid into the frame, and the deck sign
  g.fillStyle = METAL; g.fillRect(x - w / 2 - 6, top, 6, h); g.fillRect(x + w / 2, top, 6, h);
  rimmed(g, INKY, TEAL, 1.5, function (e) { rr(g, x - 30 - e, top - 30 - e, 60 + 2 * e, 16 + 2 * e, 5); g.fill(); });
  g.fillStyle = "#FFFFFF"; g.font = "600 9px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DECK 3  →", x, top - 21.5);
}
// The fabricator: a glass cabinet on a plinth; the head, the print and the progress bar are live.
function fabricator(g, x, y) {
  var w = 96, h = 112, top = y - h;
  g.fillStyle = "rgba(40,40,80,.22)"; g.beginPath(); g.ellipse(x, y + 6, 70, 9, 0, 0, 7); g.fill();
  rimmed(g, INKY, "#EEEFF9", 2, function (e) { rr(g, x - w / 2 - e, top - e, w + 2 * e, h + 2 * e, 12); g.fill(); });
  g.fillStyle = CORAL; g.fillRect(x - w / 2, y - 22, w, 4);
  // the glass box
  var gx = x - w / 2 + 10, gy = top + 12, gw = w - 20, gh = h - 46;
  var gl = g.createLinearGradient(gx, gy, gx + gw, gy + gh); gl.addColorStop(0, "#3E4378"); gl.addColorStop(1, "#2A2D58");
  g.fillStyle = gl; rr(g, gx, gy, gw, gh, 6); g.fill();
  g.fillStyle = "#6B6FA2"; g.fillRect(gx + 6, gy + gh - 10, gw - 12, 5);                    // the bed
  g.fillStyle = METAL_L; g.fillRect(gx + 4, gy + 8, gw - 8, 3);                             // the gantry rail
  G.fabBox = { x: gx, y: gy, w: gw, h: gh, bed: gy + gh - 10 };
  g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(gx + 8, gy); g.lineTo(gx + 26, gy); g.lineTo(gx + 6, gy + gh); g.lineTo(gx, gy + gh); g.closePath(); g.fill();
  // the panel under it: a dial and the progress bar
  G.fabBar = { x: x - 30, y: y - 14, w: 60 };
  g.fillStyle = "#3A3D66"; rr(g, x - 32, y - 16, 64, 7, 3.5); g.fill();
  rimmed(g, INKY, "#F4F1F8", 1.2, function (e) { rr(g, x - 26 - e, top - 24 - e, 52 + 2 * e, 15 + 2 * e, 4); g.fill(); });
  g.fillStyle = INKY; g.font = "600 8.5px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FAB-3D", x, top - 16.3);
  // a spool of filament on the side
  rimmed(g, INKY, CORAL, 1.5, function (e) { g.beginPath(); g.arc(x + w / 2 + 12, top + 40, 12 + e, 0, 7); g.fill(); });
  g.fillStyle = "#3A3D66"; g.beginPath(); g.arc(x + w / 2 + 12, top + 40, 4, 0, 7); g.fill();
  g.strokeStyle = CORAL; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + w / 2 + 4, top + 48); g.quadraticCurveTo(x + w / 2 - 6, top + 30, x + w / 2 - 12, top + 22); g.stroke();
}
// The bridge terminal: a curved console with the star map screen, and the captain's chair.
function bridge(g, x, y) {
  var B = G.B;
  // the big screen on the wall
  rimmed(g, INKY, "#22264E", 2.5, function (e) { rr(g, x - 92 - e, B - 104 - e, 184 + 2 * e, 66 + 2 * e, 10); g.fill(); });
  G.map = { x: x - 86, y: B - 98, w: 172, h: 54 };
  g.strokeStyle = "rgba(140,239,245,.25)"; g.lineWidth = 1;
  for (var i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x - 86 + i * 172 / 6, B - 98); g.lineTo(x - 86 + i * 172 / 6, B - 44); g.stroke(); }
  for (i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x - 86, B - 98 + i * 18); g.lineTo(x + 86, B - 98 + i * 18); g.stroke(); }
  // the console: a curved desk with lit buttons
  g.fillStyle = "rgba(40,40,80,.24)"; g.beginPath(); g.ellipse(x, y + 10, 130, 16, 0, 0, 7); g.fill();
  rimmed(g, INKY, "#E8E9F6", 2, function (e) { g.beginPath(); g.moveTo(x - 118 - e, y - 4); g.quadraticCurveTo(x, y - 34 - e, x + 118 + e, y - 4); g.lineTo(x + 112 + e, y + 14 + e); g.quadraticCurveTo(x, y - 8 + e, x - 112 - e, y + 14 + e); g.closePath(); g.fill(); });
  g.fillStyle = "#C9CBE4"; g.beginPath(); g.moveTo(x - 110, y - 6); g.quadraticCurveTo(x, y - 32, x + 110, y - 6); g.quadraticCurveTo(x, y - 22, x - 110, y - 6); g.fill();
  G.buttons = []; for (i = 0; i < 14; i++) { var k = i / 13 - 0.5, bx = x + k * 190, by = y - 12 - (1 - 4 * k * k) * 11;
    G.buttons.push({ x: bx, y: by, c: [CORAL, SUN, TEAL, "#9A8BE0"][i % 4] }); g.fillStyle = G.buttons[i].c; rr(g, bx - 4, by - 2, 8, 4, 2); g.fill(); }
  // the captain's chair, turned towards the screen
  var cx = x - 6, cy = y + 52;
  g.fillStyle = "rgba(40,40,80,.24)"; g.beginPath(); g.ellipse(cx, cy + 4, 34, 7, 0, 0, 7); g.fill();
  g.fillStyle = METAL_D; g.fillRect(cx - 2.5, cy - 22, 5, 22); g.fillRect(cx - 18, cy - 2, 36, 4);
  rimmed(g, "#8A3A34", CORAL, 2, function (e) { rr(g, cx - 26 - e, cy - 62 - e, 52 + 2 * e, 42 + 2 * e, 16); g.fill(); });   // the back
  rimmed(g, "#8A3A34", "#F4A79B", 2, function (e) { rr(g, cx - 30 - e, cy - 30 - e, 60 + 2 * e, 12 + 2 * e, 6); g.fill(); });  // the seat
  [-1, 1].forEach(function (s) { rimmed(g, INKY, METAL_L, 1.5, function (e) { rr(g, cx + s * 30 - 5 - e, cy - 44 - e, 10 + 2 * e, 20 + 2 * e, 4); g.fill(); }); });
  g.fillStyle = SUN; g.beginPath(); g.arc(cx, cy - 46, 5, 0, 7); g.fill();                                // the star on its back
  g.fillStyle = "#FFFFFF"; g.font = "600 7px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("★", cx, cy - 45.6);
  G.chair = { x: cx, y: cy };
}
// Holo panels floating on the wall: drawn as dim frames here, their content in back().
function holoPanels(g) {
  var W = G.W, B = G.B;
  G.holo = [{ x: W * 0.17, y: B - 92, w: 70, h: 44, kind: "cycle" }, { x: W * 0.6, y: B - 98, w: 60, h: 40, kind: "orbit" }, { x: W * 0.765, y: B - 98, w: 54, h: 40, kind: "bars" }];
  G.holo.forEach(function (p) { g.fillStyle = "rgba(140,239,245,.14)"; rr(g, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 6); g.fill();
    g.fillStyle = "rgba(30,34,80,.35)"; rr(g, p.x, p.y, p.w, p.h, 5); g.fill();
    g.fillStyle = "rgba(140,239,245,.5)"; g.fillRect(p.x + p.w / 2 - 10, p.y + p.h + 6, 20, 3); });
}

// ── Furniture on the deck ─────────────────────────────────────────────────────
function crates(g, x, y) {
  g.fillStyle = "rgba(40,40,80,.24)"; g.beginPath(); g.ellipse(x, y + 4, 66, 10, 0, 0, 7); g.fill();
  [[-28, 0, 46, 34, "#7C9CD8"], [24, 0, 40, 30, CORAL], [-6, -32, 40, 30, SUN]].forEach(function (c) {
    var cx = x + c[0], cy = y + c[1], w = c[2], h = c[3];
    rimmed(g, shade(c[4], 0.6), c[4], 1.8, function (e) { rr(g, cx - w / 2 - e, cy - h - e, w + 2 * e, h + 2 * e, 5); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(cx - w / 2 + 3, cy - h + 3, w - 6, 4);
    g.strokeStyle = shade(c[4], 0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - w / 2 + 6, cy - h / 2); g.lineTo(cx + w / 2 - 6, cy - h / 2); g.stroke();
    g.fillStyle = "rgba(255,255,255,.75)"; rr(g, cx - 8, cy - h / 2 + 4, 16, 8, 2); g.fill(); });
}
function pottedPlant(g, x, y, s) {
  g.fillStyle = "rgba(40,40,80,.22)"; g.beginPath(); g.ellipse(x, y + 2, 22 * s, 5 * s, 0, 0, 7); g.fill();
  [[-0.5, 46, "#7BC4A8"], [0.1, 58, "#8FD6B8"], [0.55, 42, "#6AB898"], [-0.15, 36, "#A6E6C8"]].forEach(function (l) {
    g.save(); g.translate(x, y - 22 * s); g.rotate(l[0]);
    rimmed(g, "#4E9A80", l[2], 1.2, function (e) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-10 * s - e, -l[1] * s * 0.5, 0, -l[1] * s - e); g.quadraticCurveTo(10 * s + e, -l[1] * s * 0.5, 0, 0); g.fill(); });
    g.restore(); });
  g.fillStyle = "#E77FB5"; g.beginPath(); g.arc(x + 4 * s, y - 70 * s, 4.5 * s, 0, 7); g.fill();
  rimmed(g, "#3E7A8C", "#6CC4D6", 1.5, function (e) { g.beginPath(); g.moveTo(x - 16 * s - e, y - 24 * s - e); g.lineTo(x + 16 * s + e, y - 24 * s - e); g.lineTo(x + 12 * s + e, y + e); g.lineTo(x - 12 * s - e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x - 14 * s, y - 22 * s, 28 * s, 3);
}
// The hab pod: the family's home on board. A round white capsule with a round door, a
// porthole with curtains, a welcome mat, a name plate and a pot of flowers.
function habPod(g, x, y) {
  var r = 92;
  g.fillStyle = "rgba(40,40,80,.26)"; g.beginPath(); g.ellipse(x, y + 4, r + 22, 16, 0, 0, 7); g.fill();
  // legs
  [-0.6, 0.6].forEach(function (k) { g.fillStyle = METAL_D; g.fillRect(x + k * r - 4, y - 20, 8, 22); g.fillStyle = METAL; rr(g, x + k * r - 12, y - 2, 24, 6, 3); g.fill(); });
  // the shell
  rimmed(g, "#8C90B8", "#F4F4FC", 2.5, function (e) { g.beginPath(); g.ellipse(x, y - 78, r + e, 66 + e, 0, 0, 7); g.fill(); });
  var sh = g.createRadialGradient(x - r * 0.4, y - 120, 10, x, y - 78, r * 1.1);
  sh.addColorStop(0, "rgba(255,255,255,.9)"); sh.addColorStop(0.6, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(120,124,170,.3)");
  g.fillStyle = sh; g.beginPath(); g.ellipse(x, y - 78, r, 66, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(140,144,184,.6)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - 78, r, 18, 0, 0, Math.PI); g.stroke();
  g.fillStyle = TEAL; g.beginPath(); g.ellipse(x, y - 78, r - 2, 20, 0, 0.05, Math.PI - 0.05); g.ellipse(x, y - 78, r - 2, 15, 0, Math.PI - 0.05, 0.05, true); g.fill();
  // the round door, ajar and warm inside
  var dx = x - 26, dy = y - 70;
  rimmed(g, "#8C90B8", METAL_L, 2, function (e) { g.beginPath(); g.ellipse(dx, dy, 30 + e, 40 + e, 0, 0, 7); g.fill(); });
  var ig = g.createLinearGradient(0, dy - 36, 0, dy + 36); ig.addColorStop(0, "#F7C886"); ig.addColorStop(1, "#D98E58");
  g.fillStyle = ig; g.beginPath(); g.ellipse(dx, dy, 24, 34, 0, 0, 7); g.fill();
  g.fillStyle = "#E86A5B"; rr(g, dx - 14, dy + 10, 28, 12, 5); g.fill(); g.fillStyle = "#F4F1E8"; rr(g, dx - 10, dy + 6, 11, 7, 3); g.fill();   // a bunk
  rimmed(g, "#8C90B8", "#E3E4F4", 1.5, function (e) { g.beginPath(); g.ellipse(dx - 30, dy, 9 + e, 36 + e, 0, 0, 7); g.fill(); });              // the door leaf, swung open
  G.podDoor = { x: dx, y: dy };
  // the porthole with curtains
  var px = x + 40, py = y - 96;
  rimmed(g, "#8C90B8", METAL_L, 2, function (e) { g.beginPath(); g.arc(px, py, 22 + e, 0, 7); g.fill(); });
  g.fillStyle = "#FFE3A6"; g.beginPath(); g.arc(px, py, 16, 0, 7); g.fill();
  g.fillStyle = "#E68AB0"; g.beginPath(); g.moveTo(px - 16, py - 6); g.quadraticCurveTo(px - 4, py - 2, px - 8, py + 14); g.lineTo(px - 16, py + 6); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(px + 16, py - 6); g.quadraticCurveTo(px + 4, py - 2, px + 8, py + 14); g.lineTo(px + 16, py + 6); g.closePath(); g.fill();
  G.porthole = { x: px, y: py };
  // the antenna with a heart on top
  g.strokeStyle = METAL_D; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 10, y - 142); g.lineTo(x + 14, y - 166); g.stroke();
  g.fillStyle = "#FF7FA0"; heartPath(g, x + 14, y - 170, 7); g.fill();
  G.podTop = { x: x + 14, y: y - 170 };
  // name plate and mat
  rimmed(g, INKY, "#F4F1F8", 1.2, function (e) { rr(g, x + 22 - e, y - 62 - e, 46 + 2 * e, 14 + 2 * e, 4); g.fill(); });
  g.fillStyle = INKY; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("HAB 7", x + 45, y - 54.6);
  g.fillStyle = "#7C9CD8"; rr(g, dx - 26, y - 6, 52, 9, 4); g.fill();
  pottedPlant(g, x + r + 12, y - 2, 0.7);
}
function heartPath(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.4, y, x - s * 0.8, y - s * 1.1, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.4, y, x, y + s * 0.9); g.closePath();
}
// The holo table: a round table on a pedestal with a projector lens; the hologram is live.
function holoTable(g, x, y) {
  g.fillStyle = "rgba(40,40,80,.26)"; g.beginPath(); g.ellipse(x, y + 6, 104, 18, 0, 0, 7); g.fill();
  rimmed(g, INKY, METAL, 2, function (e) { g.beginPath(); g.moveTo(x - 30 - e, y + 4); g.lineTo(x - 20 - e, y - 26); g.lineTo(x + 20 + e, y - 26); g.lineTo(x + 30 + e, y + 4); g.closePath(); g.fill(); });
  g.fillStyle = METAL_L; g.fillRect(x - 16, y - 24, 6, 26);
  rimmed(g, INKY, "#E8E9F6", 2.5, function (e) { g.beginPath(); g.ellipse(x, y - 30, 96 + e, 26 + e, 0, 0, 7); g.fill(); });
  g.fillStyle = "#C9CBE4"; g.beginPath(); g.ellipse(x, y - 26, 96, 26, 0, 0, Math.PI); g.fill();
  g.fillStyle = "#E8E9F6"; g.beginPath(); g.ellipse(x, y - 30, 96, 24, 0, 0, 7); g.fill();
  g.strokeStyle = TEAL; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 31, 84, 20, 0, 0, 7); g.stroke();
  g.fillStyle = "#2A2D58"; g.beginPath(); g.ellipse(x, y - 31, 26, 7, 0, 0, 7); g.fill();
  g.fillStyle = HOLO; g.beginPath(); g.ellipse(x, y - 31, 12, 3.2, 0, 0, 7); g.fill();
  [CORAL, SUN, "#9A8BE0", TEAL].forEach(function (c, i) { var a = 0.6 + i * 0.6; g.fillStyle = c; g.beginPath(); g.ellipse(x + Math.cos(a) * 62, y - 31 + Math.sin(a) * 15, 4, 1.8, 0, 0, 7); g.fill(); });
  G.lens = { x: x, y: y - 31 };
}
function pool(g) {
  var p = G.pool;
  rimmed(g, INKY, METAL_L, 3, function (e) { g.beginPath(); g.ellipse(p.x, p.y, p.rx + 10 + e, p.ry + 7 + e, 0, 0, 7); g.fill(); });
  var wg = g.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry); wg.addColorStop(0, "#5FB8D0"); wg.addColorStop(1, "#7ED6DC");
  g.fillStyle = wg; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.4, p.rx * 0.4, p.ry * 0.2, 0, 0, 7); g.fill();
  // glowing lily pads
  [[-0.5, 0.2], [0.45, -0.1]].forEach(function (l) { g.fillStyle = "#7BD0A0"; g.beginPath(); g.ellipse(p.x + l[0] * p.rx, p.y + l[1] * p.ry, 12, 5, 0.2, 0.4, 6.0); g.fill();
    g.fillStyle = "#F2A0D0"; g.beginPath(); g.arc(p.x + l[0] * p.rx + 3, p.y + l[1] * p.ry - 2, 3, 0, 7); g.fill(); });
}
// Hydroponics: a curved planter of alien plants under a grow-light arch, and a mister.
function garden(g, x, y) {
  var w = 230;
  g.fillStyle = "rgba(40,40,80,.24)"; g.beginPath(); g.ellipse(x, y + 6, w / 2 + 10, 16, 0, 0, 7); g.fill();
  // the grow-light arch
  g.strokeStyle = METAL_D; g.lineWidth = 6; g.beginPath(); g.moveTo(x - w / 2 + 6, y - 30); g.quadraticCurveTo(x, y - 230, x + w / 2 - 6, y - 30); g.stroke();
  g.strokeStyle = METAL_L; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w / 2 + 6, y - 30); g.quadraticCurveTo(x, y - 230, x + w / 2 - 6, y - 30); g.stroke();
  G.grow = []; for (var i = 1; i < 6; i++) { var k = i / 6, u = 1 - k, ax = u * u * (x - w / 2 + 6) + 2 * u * k * x + k * k * (x + w / 2 - 6), ay = u * u * (y - 30) + 2 * u * k * (y - 230) + k * k * (y - 30);
    G.grow.push({ x: ax, y: ay }); rimmed(g, INKY, "#E3A6F2", 1.5, function (e) { rr(g, ax - 9 - e, ay - 4 - e, 18 + 2 * e, 9 + 2 * e, 4); g.fill(); }); }
  // the plants: bulb-headed stalks, curly fronds and a fat glowing pod plant
  var plants = [[-90, 70, "#7BC4A8", "bulb", "#F4C95D"], [-58, 96, "#8FD6B8", "frond"], [-24, 84, "#6AB898", "bulb", "#E77FB5"], [8, 110, "#7BC4A8", "frond"],
    [42, 78, "#8FD6B8", "bulb", "#8CEFF5"], [74, 92, "#6AB898", "frond"], [98, 64, "#A6E6C8", "bulb", "#F08A7E"]];
  G.bulbs = [];
  plants.forEach(function (p) { var px = x + p[0], py = y - 34;
    if (p[3] === "bulb") { g.strokeStyle = "#4E9A80"; g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px - 8, py - p[1] * 0.5, px, py - p[1]); g.stroke();
      rimmed(g, shade(p[4], 0.65), p[4], 1.5, function (e) { g.beginPath(); g.arc(px, py - p[1], 9 + e, 0, 7); g.fill(); });
      g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(px - 3, py - p[1] - 3, 3, 0, 7); g.fill();
      G.bulbs.push({ x: px, y: py - p[1], c: p[4] });
      [-1, 1].forEach(function (s) { rimmed(g, "#4E9A80", p[2], 1, function (e) { g.beginPath(); g.ellipse(px + s * 9, py - p[1] * 0.35, 9 + e, 4 + e, s * -0.5, 0, 7); g.fill(); }); }); }
    else { for (var q = -2; q <= 2; q++) { g.save(); g.translate(px, py); g.rotate(q * 0.32);
      rimmed(g, "#4E9A80", p[2], 1.2, function (e) { g.beginPath(); g.moveTo(-3 - e, 0); g.quadraticCurveTo(-8 - e, -p[1] * 0.6, 0, -p[1] * (1 - Math.abs(q) * 0.15) - e); g.quadraticCurveTo(8 + e, -p[1] * 0.6, 3 + e, 0); g.closePath(); g.fill(); });
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -p[1] * 0.8); g.stroke();
      g.restore(); }
      g.strokeStyle = p[2]; g.lineWidth = 2.4; g.beginPath(); g.arc(px + 4, py - p[1] - 4, 6, 0.5, 5.2); g.stroke(); } });
  // the planter trough
  rimmed(g, INKY, "#E8E9F6", 2.5, function (e) { g.beginPath(); g.moveTo(x - w / 2 - e, y - 38 - e); g.quadraticCurveTo(x, y - 52 - e, x + w / 2 + e, y - 38 - e); g.lineTo(x + w / 2 - 8 + e, y + e); g.quadraticCurveTo(x, y - 10 + e, x - w / 2 + 8 - e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = "#7A5A4A"; g.beginPath(); g.moveTo(x - w / 2 + 6, y - 38); g.quadraticCurveTo(x, y - 50, x + w / 2 - 6, y - 38); g.quadraticCurveTo(x, y - 42, x - w / 2 + 6, y - 38); g.fill();
  g.fillStyle = TEAL; g.beginPath(); g.moveTo(x - w / 2 + 4, y - 24); g.quadraticCurveTo(x, y - 36, x + w / 2 - 4, y - 24); g.lineTo(x + w / 2 - 5, y - 19); g.quadraticCurveTo(x, y - 31, x - w / 2 + 5, y - 19); g.closePath(); g.fill();
  rimmed(g, INKY, "#F4F1F8", 1.2, function (e) { rr(g, x - 34 - e, y - 16 - e, 68 + 2 * e, 13 + 2 * e, 4); g.fill(); });
  g.fillStyle = INKY; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("HYDROPONICS", x, y - 9.2);
  G.misters = [{ x: x - w / 2 + 10, y: y - 44 }, { x: x + w / 2 - 10, y: y - 44 }];
}

// ── What moves ─────────────────────────────────────────────────────────────────
var A = null;
// Little ships, baked once: a tug, a shuttle, a saucer, a cargo hauler, a space whale.
function shipSprite(kind) {
  var c, g;
  if (kind === "hauler") {
    c = canvas(150, 40); g = c.getContext("2d");
    rimmed(g, METAL_D, "#C9CBE4", 1.5, function (e) { rr(g, 8 - e, 14 - e, 112 + 2 * e, 16 + 2 * e, 5); g.fill(); });
    [CORAL, SUN, TEAL, "#9A8BE0", CORAL].forEach(function (col, i) { rimmed(g, shade(col, 0.6), col, 1, function (e) { rr(g, 14 + i * 20 - e, 6 - e, 17 + 2 * e, 14 + 2 * e, 2); g.fill(); }); });
    rimmed(g, METAL_D, "#E8E9F6", 1.5, function (e) { g.beginPath(); g.moveTo(118 - e, 10 - e); g.lineTo(136 + e, 16); g.lineTo(136 + e, 28); g.lineTo(118 - e, 32 + e); g.closePath(); g.fill(); });
    g.fillStyle = HOLO; g.fillRect(124, 17, 8, 5);
    g.fillStyle = "#8CEFF5"; g.beginPath(); g.ellipse(6, 22, 5, 4, 0, 0, 7); g.fill();
    return { c: c, ax: 75, ay: 22 };
  }
  if (kind === "saucer") {
    c = canvas(60, 34); g = c.getContext("2d");
    g.fillStyle = "rgba(140,239,245,.55)"; g.beginPath(); g.arc(30, 15, 11, Math.PI, 0); g.fill();
    g.fillStyle = "#9EE0B4"; g.beginPath(); g.arc(30, 14, 4, 0, 7); g.fill();
    g.fillStyle = "#2B2433"; g.beginPath(); g.arc(31, 13, 1.4, 0, 7); g.fill();
    rimmed(g, METAL_D, "#D6D8F0", 1.5, function (e) { g.beginPath(); g.ellipse(30, 19, 26 + e, 7 + e, 0, 0, 7); g.fill(); });
    [10, 20, 30, 40, 50].forEach(function (x, i) { g.fillStyle = [SUN, CORAL, TEAL][i % 3]; g.beginPath(); g.arc(x, 20, 2, 0, 7); g.fill(); });
    return { c: c, ax: 30, ay: 18 };
  }
  if (kind === "whale") {
    c = canvas(200, 80); g = c.getContext("2d");
    var wg = g.createLinearGradient(0, 10, 0, 70); wg.addColorStop(0, "rgba(150,160,230,.75)"); wg.addColorStop(1, "rgba(110,120,200,.55)");
    g.fillStyle = wg; g.beginPath(); g.moveTo(10, 40); g.bezierCurveTo(30, 6, 130, 4, 172, 34); g.bezierCurveTo(182, 40, 182, 50, 170, 54); g.bezierCurveTo(130, 70, 50, 70, 26, 50);
    g.lineTo(4, 62); g.lineTo(8, 46); g.lineTo(0, 30); g.closePath(); g.fill();
    g.fillStyle = "rgba(230,236,255,.35)"; g.beginPath(); g.ellipse(120, 54, 44, 8, 0.05, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.7)"; [[60, 30], [86, 22], [110, 28], [74, 44], [140, 36]].forEach(function (s) { g.beginPath(); g.arc(s[0], s[1], 1.6, 0, 7); g.fill(); });
    g.fillStyle = "#2B2433"; g.beginPath(); g.arc(158, 40, 2.6, 0, 7); g.fill();
    g.fillStyle = "rgba(140,150,220,.6)"; g.beginPath(); g.ellipse(112, 62, 18, 6, 0.6, 0, 7); g.fill();
    return { c: c, ax: 100, ay: 40 };
  }
  // the shuttle
  c = canvas(64, 34); g = c.getContext("2d");
  rimmed(g, METAL_D, "#F4F4FC", 1.5, function (e) { g.beginPath(); g.moveTo(8 - e, 24 + e); g.lineTo(8 - e, 12 - e); g.quadraticCurveTo(30, 4 - e, 56 + e, 18); g.quadraticCurveTo(30, 30 + e, 8 - e, 24 + e); g.fill(); });
  g.fillStyle = CORAL; g.beginPath(); g.moveTo(10, 12); g.lineTo(4, 4); g.lineTo(18, 10); g.closePath(); g.fill();
  g.fillStyle = "#6CC4D6"; rr(g, 38, 12, 10, 6, 3); g.fill();
  g.fillStyle = TEAL; g.fillRect(14, 18, 26, 3);
  return { c: c, ax: 32, ay: 18 };
}
function setup(S) {
  A = { t: 0, ships: [], meteors: [], ice: [], twinkle: [], motes: [], mist: [], note: 0, music: 0, lock: 0, beat: 0, nextShip: 3, whaleT: rand(40, 90), comet: null, cometT: rand(20, 50),
    bot: null, drone: null, flareT: 0, courier: null, courierT: rand(6, 14) };
  var i;
  for (i = 0; i < 26; i++) A.twinkle.push({ x: rand(0, G.W), y: rand(4, G.SILL - 10), s: rand(1.2, 2.4), ph: rand(0, 6) });
  for (i = 0; i < 26; i++) A.ice.push({ x: rand(0, G.W), y: rand(6, G.SILL - 8), s: rand(0.5, 1.4), v: rand(10, 26), r: rand(0, 6), vr: rand(-0.6, 0.6) });
  for (i = 0; i < 30; i++) A.motes.push({ x: rand(0, G.W), y: rand(4, G.SILL - 4), v: rand(0.5, 1.5) });
  A.spr = { shuttle: shipSprite("shuttle"), hauler: shipSprite("hauler"), saucer: shipSprite("saucer"), whale: shipSprite("whale") };
  A.ships.push({ kind: "hauler", x: G.W * 0.3, y: 70, v: 9, s: 0.8, dir: 1 });
  A.ships.push({ kind: "shuttle", x: G.W * 0.12, y: 150, v: 26, s: 0.9, dir: -1 });
  A.bot = { x: G.W * 0.36, y: G.H * 0.84, tx: G.W * 0.36, ty: G.H * 0.84, face: 1, ph: 0, wait: 2, fast: 0 };
  A.drone = { x: G.garden.x - 60, y: G.garden.y - 150, ph: 0, tx: 0, wait: 0, spray: 0 };
  function glow(r0, a, b, c) { var cv = canvas(48, 48), gg = cv.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
    gr.addColorStop(0, a); gr.addColorStop(0.3, b); gr.addColorStop(1, c); gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48); void r0; return cv; }
  A.glow = glow(0, "rgba(255,236,190,1)", "rgba(255,190,110,.55)", "rgba(255,170,90,0)");
  A.cyan = glow(0, "rgba(220,255,255,1)", "rgba(140,239,245,.5)", "rgba(120,220,240,0)");
  A.pink = glow(0, "rgba(255,220,250,1)", "rgba(230,150,240,.5)", "rgba(220,130,230,0)");
  A.amber = glow(0, "rgba(255,240,200,1)", "rgba(255,170,60,.6)", "rgba(255,140,40,0)");
  // the nebula's drifting haze (cloud and fog), and frost for the glass (snow)
  A.haze = ["232,127,181", "92,201,201", "140,111,214"].map(function (c) { var cv = canvas(128, 128), gg = cv.getContext("2d"), gr = gg.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, "rgba(" + c + ",1)"); gr.addColorStop(1, "rgba(" + c + ",0)"); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128); return cv; });
  A.frost = canvas(G.W, G.SILL); var fg = A.frost.getContext("2d");
  [[0, G.SILL, 170], [G.W, G.SILL, 170], [G.mull[0], G.SILL, 80], [G.mull[1], G.SILL, 80], [0, 0, 110], [G.W, 0, 110]].forEach(function (p) {
    var gr = fg.createRadialGradient(p[0], p[1], 4, p[0], p[1], p[2]); gr.addColorStop(0, "rgba(240,248,255,.75)"); gr.addColorStop(0.6, "rgba(240,248,255,.25)"); gr.addColorStop(1, "rgba(240,248,255,0)");
    fg.fillStyle = gr; fg.fillRect(p[0] - p[2], p[1] - p[2], p[2] * 2, p[2] * 2); });
  fg.strokeStyle = "rgba(255,255,255,.55)"; fg.lineWidth = 1.2; fg.lineCap = "round";                     // a few frost ferns
  for (var fi = 0; fi < 26; fi++) { var fx = fi < 13 ? rand(0, 150) : G.W - rand(0, 150), fy = G.SILL - rand(0, 90), fa = rand(-2.6, -0.5);
    fg.beginPath(); fg.moveTo(fx, fy); var lx = fx + Math.cos(fa) * 22, ly = fy + Math.sin(fa) * 22; fg.lineTo(lx, ly);
    for (var fk = 0.3; fk < 1; fk += 0.25) { var mx = fx + (lx - fx) * fk, my = fy + (ly - fy) * fk; fg.moveTo(mx, my); fg.lineTo(mx + Math.cos(fa - 0.7) * 6, my + Math.sin(fa - 0.7) * 6); fg.moveTo(mx, my); fg.lineTo(mx + Math.cos(fa + 0.7) * 6, my + Math.sin(fa + 0.7) * 6); } fg.stroke(); }
  A.flare = null; A.hex = null; A.beam = null;
  void S;
}
function nearFam(S, x, y, d) { for (var i = 0; i < S.fam.length; i++) { var t = S.fam[i]; if (Math.abs(t.x - x) + Math.abs(t.y - y) < d) return t; } return null; }
function update(dt, S) {
  if (!A) return;
  var WX = S.WX || {}, asleep = S.nightness > 0.6, W = G.W, i;
  A.t += dt;
  // ships: one now and then, at a random depth and speed
  A.nextShip -= dt;
  if (A.nextShip < 0 && A.ships.length < 4) { var k = pick(["shuttle", "shuttle", "saucer", "hauler"]), d = Math.random() < 0.5 ? 1 : -1, sc = rand(0.55, 1);
    A.ships.push({ kind: k, x: d > 0 ? -90 : W + 90, y: rand(40, G.SILL - 50), v: (k === "hauler" ? 10 : k === "saucer" ? 40 : 28) * sc, s: sc, dir: d, ph: rand(0, 6) }); A.nextShip = rand(6, 16); }
  A.whaleT -= dt;
  if (A.whaleT < 0) { A.ships.push({ kind: "whale", x: W + 120, y: rand(70, 120), v: 12, s: 0.9, dir: -1, ph: 0 }); A.whaleT = rand(150, 260); }
  for (i = A.ships.length - 1; i >= 0; i--) { var sh = A.ships[i]; sh.x += sh.dir * sh.v * dt; sh.ph = (sh.ph || 0) + dt;
    if (sh.x < -160 || sh.x > W + 160) A.ships.splice(i, 1); }
  // a comet now and then
  A.cometT -= dt; if (A.cometT < 0 && !A.comet) { A.comet = { x: rand(W * 0.2, W * 0.9), y: rand(10, 60), vx: -rand(120, 180), vy: rand(30, 50), life: 2.2 }; A.cometT = rand(30, 70); }
  if (A.comet) { A.comet.x += A.comet.vx * dt; A.comet.y += A.comet.vy * dt; A.comet.life -= dt; if (A.comet.life < 0 || A.comet.y > G.SILL) A.comet = null; }
  // rain is a meteor shower; the hydroponics misters run with it
  var rain = WX.rain || 0;
  if (rain > 0.05 && Math.random() < dt * 14 * rain) A.meteors.push({ x: rand(W * 0.1, W * 1.2), y: rand(-20, G.SILL * 0.5), v: rand(260, 420), life: rand(0.5, 0.9), m: 0 });
  for (i = A.meteors.length - 1; i >= 0; i--) { var m = A.meteors[i]; m.m += dt; m.x -= m.v * dt * 0.7; m.y += m.v * dt * 0.45; if (m.m > m.life || m.y > G.SILL) A.meteors.splice(i, 1); }
  if (rain > 0.2 && Math.random() < dt * 6 * rain) { var ms = pick(G.misters); A.mist.push({ x: ms.x + rand(-4, 4), y: ms.y, vx: (ms.x < G.garden.x ? 1 : -1) * rand(10, 30), life: 0, max: rand(0.8, 1.4) }); }
  for (i = A.mist.length - 1; i >= 0; i--) { var q = A.mist[i]; q.life += dt; q.x += q.vx * dt; q.y -= 16 * dt; if (q.life > q.max) A.mist.splice(i, 1); }
  // snow is an ice field drifting past
  if ((WX.snow || 0) > 0.02) for (i = 0; i < A.ice.length; i++) { var c = A.ice[i]; c.x -= c.v * dt; c.r += c.vr * dt; if (c.x < -20) { c.x = W + 20; c.y = rand(6, G.SILL - 8); } }
  // wind is dust on the solar wind, outside only
  for (i = 0; i < A.motes.length; i++) { var mo = A.motes[i]; mo.x -= (4 + 120 * (WX.wind || 0)) * mo.v * dt; if (mo.x < -4) mo.x = W + 4; }
  // the music: the speakers thump, notes rise from the console, the hologram dances
  A.music += ((S.music || 0) > 0.5 && !asleep ? 1 : 0) * dt * 2 - dt * 1.2; A.music = Math.max(0, Math.min(1, A.music));
  A.beat = A.music * Math.max(0, Math.sin(A.t * 7.5));
  if (A.music > 0.6) { A.note -= dt; if (A.note < 0) { A.note = rand(0.4, 0.9); var sp = pick(G.speakers); S.puff("note", sp.x, sp.y - 20, 1, pick([CORAL, SUN, TEAL, "#9A8BE0"])); } }
  // the airlock opens for anyone at it
  var at = nearFam(S, G.lock.x, G.B + 14, 90);
  A.lock = Math.max(0, Math.min(1, A.lock + (at ? 1.6 : -1.1) * dt));
  // the cleaning bot: trundles about the deck, scoots off from anyone close; parked at night
  var b = A.bot;
  if (!asleep) {
    var who = nearFam(S, b.x, b.y, 80), dx = b.tx - b.x, dy = b.ty - b.y, dd = Math.sqrt(dx * dx + dy * dy);
    if (who && dd < 4) { S.say("bip!", b.x, b.y - 26); b.tx = Math.max(70, Math.min(W - 70, b.x + (who.x < b.x ? 200 : -200))); b.ty = Math.max(G.B + 60, Math.min(G.H - 30, b.y + rand(-60, 60))); b.fast = 1; }
    else if (dd > 2) { var st = Math.min(dd, (b.fast ? 120 : 46) * dt); b.x += dx / dd * st; b.y += dy / dd * st; b.ph += dt * 10; b.face = dx > 0 ? 1 : -1; }
    else if ((b.wait -= dt) < 0) { b.fast = 0; b.tx = Math.max(70, Math.min(W - 70, b.x + rand(-220, 220))); b.ty = rand(G.B + 60, G.H - 30); b.wait = rand(1.5, 4);
      if (S.inZone(b.tx, b.ty, 14)) { b.tx = b.x; b.ty = b.y; } }
  }
  // the drone: bobs about over the plants by day, spraying them now and then
  var dr = A.drone; dr.ph += dt; dr.wait -= dt; dr.spray = Math.max(0, dr.spray - dt);
  if (dr.wait < 0) { dr.tx = asleep ? G.garden.x + 70 : G.garden.x + rand(-90, 90); dr.wait = rand(3, 6); if (!asleep && Math.random() < 0.5) dr.spray = 1.6; }
  dr.x += ((dr.tx || dr.x) - dr.x) * Math.min(1, dt * 1.2);
  dr.y = G.garden.y - (asleep ? 110 : 160) + Math.sin(dr.ph * 2) * 4;
  // a courier bot zips across the corridor door now and then
  A.courierT -= dt; if (A.courierT < 0 && !A.courier && !asleep) { A.courier = { k: 0, dir: Math.random() < 0.5 ? 1 : -1 }; A.courierT = rand(10, 24); }
  if (A.courier) { A.courier.k += dt * 0.7; if (A.courier.k > 1) A.courier = null; }
}

// Under the weather: the pool's ripples and the deck ring's slow pulse.
function under(ctx, time, S) {
  if (!A) return;
  var P = G.pool, i;
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1.3; ctx.beginPath();
  for (i = 0; i < 3; i++) { var r = ((time * 0.25 + i / 3) % 1); ctx.moveTo(P.x + P.rx * 0.5 * r, P.y + 3); ctx.ellipse(P.x, P.y + 3, P.rx * 0.5 * r + 0.1, P.ry * 0.32 * r + 0.1, 0, 0, 7); }
  ctx.stroke();
  var t = G.table, pulse = 0.5 + 0.5 * Math.sin(time * 1.6);
  ctx.strokeStyle = "rgba(140,239,245," + (0.12 + 0.12 * pulse + 0.3 * A.beat).toFixed(3) + ")"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 6, 170 + 6 * pulse, 56 + 2 * pulse, 0, 0, 7); ctx.stroke();
  void S;
}

// Behind the family: everything outside the window, the frame over it, then the live parts
// of the room (the airlock door, screens, the fabricator, the hologram, the bot and drone).
function back(ctx, time, S) {
  if (!A) return;
  var W = G.W, SL = G.SILL, WX = S.WX || {}, D = S.DARK, i;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SL); ctx.clip();
  // twinkles, dust
  for (i = 0; i < A.twinkle.length; i++) { var tw = A.twinkle[i], a = 0.5 + 0.5 * Math.sin(time * 1.7 + tw.ph); ctx.globalAlpha = a * 0.9; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(tw.x, tw.y, tw.s, tw.s); }
  ctx.globalAlpha = 0.25 + 0.4 * (WX.wind || 0); ctx.fillStyle = "#CFE9FF";
  for (i = 0; i < A.motes.length; i++) { var mo = A.motes[i]; ctx.fillRect(mo.x, mo.y, 1 + 10 * (WX.wind || 0) * mo.v, 1); }
  ctx.globalAlpha = 1;
  // cloud is a drift of nebula; fog a thick one
  var neb = Math.max(0, (WX.cloud || 0) - 0.3) * 0.5 + (WX.fog || 0) * 0.8;
  if (neb > 0.02) nebulaHaze(ctx, time, neb);
  // a rainbow is an aurora over the planet's pole
  if ((WX.bow || 0) > 0.01) aurora(ctx, time, WX.bow);
  // the ships
  for (i = 0; i < A.ships.length; i++) ship(ctx, A.ships[i], time);
  if (A.comet) { var cm = A.comet; ctx.lineCap = "round";
    [[90, 1.5, ".25"], [50, 2.5, ".5"], [20, 3, ".95"]].forEach(function (q) { ctx.strokeStyle = "rgba(200,240,255," + q[2] + ")"; ctx.lineWidth = q[1];
      ctx.beginPath(); ctx.moveTo(cm.x, cm.y); ctx.lineTo(cm.x + q[0], cm.y - q[0] * 0.29); ctx.stroke(); });
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cm.x, cm.y, 2.6, 0, 7); ctx.fill(); }
  // meteor shower
  ctx.lineCap = "round";
  if (A.meteors.length) { ctx.strokeStyle = "rgba(255,214,170,.35)"; ctx.lineWidth = 2; ctx.beginPath();
    for (i = 0; i < A.meteors.length; i++) { var m = A.meteors[i]; ctx.moveTo(m.x + 12, m.y - 8); ctx.lineTo(m.x + 46, m.y - 30); } ctx.stroke();
    ctx.strokeStyle = "rgba(255,248,224,.9)"; ctx.beginPath();
    for (i = 0; i < A.meteors.length; i++) { m = A.meteors[i]; ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + 12, m.y - 8); } ctx.stroke(); }
  // the ice field
  var sn = WX.snow || 0;
  if (sn > 0.02) for (i = 0; i < A.ice.length; i++) { var c = A.ice[i]; ctx.globalAlpha = Math.min(1, sn * 1.4); iceChunk(ctx, c.x, c.y, 6 * c.s + 2, c.r); }
  ctx.globalAlpha = 1;
  // a storm is a solar flare: the window floods with light, the shield shimmers
  var storm = WX.storm || 0;
  if (storm > 0.05) solarFlare(ctx, time, storm, WX.flash || 0);
  // frost on the glass with the ice field
  if (sn > 0.05) frost(ctx, sn);
  ctx.restore();
  ctx.drawImage(G.frame, 0, 0, W, G.WT + 30);
  // the room
  airlockDoor(ctx, time);
  screens(ctx, time, S);
  fabLive(ctx, time, S);
  corridorLife(ctx);
  ctx.globalAlpha = 1;
  // hydroponics mist
  ctx.fillStyle = "rgb(236,248,255)";
  for (i = 0; i < A.mist.length; i++) { var q = A.mist[i]; ctx.globalAlpha = 0.5 * (1 - q.life / q.max); ctx.beginPath(); ctx.arc(q.x, q.y, 3 + q.life * 7, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  if ((WX.storm || 0) > 0.05) alertRoom(ctx, time, Math.min(1, WX.storm * 1.3));
  hologram(ctx, time, S);
  bot(ctx, time, S);
  drone(ctx, time, S);
  void D;
}
function nebulaHaze(ctx, time, a) {
  var W = G.W, SL = G.SILL;
  [[0.2, 0.5, 260, 0, 0.05], [0.55, 0.35, 300, 1, -0.04], [0.85, 0.6, 240, 2, 0.03], [0.38, 0.8, 220, 2, -0.03], [0.7, 0.2, 260, 0, 0.04]].forEach(function (n, i) {
    var x = ((W * n[0] + time * 14 * n[4] * 60) % (W + 400) + W + 400) % (W + 400) - 200, y = SL * n[1] + Math.sin(time * 0.2 + i) * 10;
    ctx.globalAlpha = Math.min(0.85, a * 0.9); ctx.drawImage(A.haze[n[3]], x - n[2], y - n[2], n[2] * 2, n[2] * 2); });
  ctx.globalAlpha = 1;
}
function aurora(ctx, time, a) {
  var P = G.planet;
  ctx.save(); ctx.globalAlpha = a * 0.7; ctx.lineCap = "round";
  for (var i = 0; i < 18; i++) { var k = i / 17, ang = -2.4 + k * 1.6, bx = P.x + Math.cos(ang) * P.r * 1.02, by = P.y + Math.sin(ang) * P.r * 1.02;
    var h = 18 + 10 * Math.sin(time * 1.5 + i * 0.8), gr = ctx.createLinearGradient(bx, by, bx + Math.cos(ang) * h, by + Math.sin(ang) * h);
    gr.addColorStop(0, "rgba(140,255,190,.9)"); gr.addColorStop(1, "rgba(190,140,255,0)");
    ctx.strokeStyle = gr; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * h, by + Math.sin(ang) * h); ctx.stroke(); }
  ctx.restore();
}
function ship(ctx, sh, time) {
  var spr = A.spr[sh.kind], bob = Math.sin(time * 1.3 + (sh.ph || 0)) * (sh.kind === "whale" ? 4 : 1.5);
  ctx.save(); ctx.translate(sh.x, sh.y + bob); ctx.scale(sh.dir * sh.s, sh.s);
  if (sh.kind === "whale") ctx.rotate(Math.sin(time * 0.6) * 0.04);
  ctx.drawImage(spr.c, -spr.ax, -spr.ay);
  if (sh.kind === "shuttle" || sh.kind === "hauler") { var fl = 0.6 + 0.4 * Math.sin(time * 30 + sh.x);             // engine flame
    ctx.fillStyle = "rgba(140,239,245," + fl.toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(-spr.ax - 3, sh.kind === "hauler" ? 0 : 3, 6 * fl + 3, 2.6, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function iceChunk(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = "rgba(220,240,255,.9)"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, -r * 0.2); ctx.lineTo(r * 0.5, r * 0.8); ctx.lineTo(-r * 0.6, r * 0.7); ctx.lineTo(-r * 0.9, -r * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, -r * 0.2); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function frost(ctx, a) { ctx.globalAlpha = Math.min(1, a); ctx.drawImage(A.frost, 0, 0, G.W, G.SILL); ctx.globalAlpha = 1; }
// The solar flare, the shield and the room's alert. The flare and the honeycomb are baked once
// (bakeFlare); a frame is a few blits.
function bakeFlare() {
  var W = G.W, SL = G.SILL, d = G.DPR, cx = W + 30, cy = SL * 0.58, i, c, g;
  A.flare = c = canvas(W * d, SL * d); g = c.getContext("2d"); g.scale(d, d);
  for (i = 0; i < 9; i++) { var ang = Math.PI + (i - 4) * 0.15, len = W * (0.55 + 0.1 * Math.sin(i * 2));
    var rg = g.createLinearGradient(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
    rg.addColorStop(0, "rgba(255,214,140,.32)"); rg.addColorStop(1, "rgba(255,160,90,0)");
    g.fillStyle = rg; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang - 0.035) * len, cy + Math.sin(ang - 0.035) * len); g.lineTo(cx + Math.cos(ang + 0.035) * len, cy + Math.sin(ang + 0.035) * len); g.closePath(); g.fill(); }
  var gr = g.createRadialGradient(cx, cy, 20, cx, cy, W * 0.5);
  gr.addColorStop(0, "rgba(255,240,190,.9)"); gr.addColorStop(0.3, "rgba(255,160,90,.35)"); gr.addColorStop(1, "rgba(255,120,80,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, SL);
  g.fillStyle = "rgba(255,250,226,1)"; g.beginPath(); g.arc(cx, cy, 66, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,196,110,.8)"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.arc(cx - 64, cy - 10, 27, Math.PI * 0.55, Math.PI * 1.7); g.stroke();
  // the honeycomb
  A.hex = c = canvas(W * d, SL * d); g = c.getContext("2d"); g.scale(d, d);
  g.strokeStyle = "rgba(140,239,245,1)"; g.lineWidth = 1.4; g.beginPath();
  var s = 22, h = s * 0.866;
  for (var row = 0; row * h < SL + h; row++) for (var col = 0; col * s * 1.5 < W + s; col++) {
    var hx = col * s * 1.5, hy = row * h * 2 + (col % 2) * h;
    for (var k = 0; k < 6; k++) { var a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3; g.moveTo(hx + Math.cos(a0) * s * 0.95, hy + Math.sin(a0) * s * 0.95); g.lineTo(hx + Math.cos(a1) * s * 0.95, hy + Math.sin(a1) * s * 0.95); } }
  g.stroke();
  // a beacon's beam, pointing right
  A.beam = c = canvas(128, 48); g = c.getContext("2d");
  var bg = g.createLinearGradient(0, 0, 128, 0); bg.addColorStop(0, "rgba(255,190,90,.55)"); bg.addColorStop(1, "rgba(255,150,60,0)");
  g.fillStyle = bg; g.beginPath(); g.moveTo(0, 24); g.lineTo(128, 2); g.lineTo(128, 46); g.closePath(); g.fill();
}
function solarFlare(ctx, time, a, flash) {
  var W = G.W, SL = G.SILL, pulse = 0.8 + 0.2 * Math.sin(time * 2.2);
  if (!A.flare) bakeFlare();
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, a * pulse); ctx.drawImage(A.flare, 0, 0, W, SL); ctx.restore();
  // the shield: the honeycomb, lit in a band that sweeps across the glass (all of it in a flash)
  var sweep = (time * 220) % (W + 400) - 200, d = G.DPR;
  ctx.globalAlpha = Math.min(1, 0.22 * a + 0.4 * flash);
  if (flash >= 0.2) ctx.drawImage(A.hex, 0, 0, W, SL);
  else { var x0 = Math.max(0, sweep - 260), x1 = Math.min(W, sweep + 260); if (x1 > x0) ctx.drawImage(A.hex, x0 * d, 0, (x1 - x0) * d, SL * d, x0, 0, x1 - x0, SL); }
  ctx.globalAlpha = 1;
  if (flash > 0) { ctx.fillStyle = "rgba(255,246,220," + (0.5 * flash).toFixed(3) + ")"; ctx.fillRect(0, 0, W, SL); }
}
// The room on alert: the wall stripe pulses amber and three beacons turn on the wall.
function alertRoom(ctx, time, a) {
  var W = G.W, B = G.B, on = 0.5 + 0.5 * Math.sin(time * 5);
  if (!A.beam) bakeFlare();
  ctx.fillStyle = "rgba(255,170,60," + (a * (0.55 + 0.45 * on)).toFixed(3) + ")"; ctx.fillRect(0, B - 22, W, 6);
  [G.lock.x + 74, W * 0.475, W * 0.79].forEach(function (bx, j) { var by = G.WT + 12, ang = time * 3.2 + j * 2;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
    [0, Math.PI].forEach(function (o) { var dd = Math.cos(ang + o), len = 120 * Math.abs(dd) + 20;
      ctx.save(); ctx.translate(bx, by); ctx.scale((dd > 0 ? 1 : -1) * len / 128, 1); ctx.drawImage(A.beam, 0, -24); ctx.restore(); });
    ctx.globalAlpha = a * (0.5 + 0.5 * on); ctx.drawImage(A.amber, bx - 30, by - 30, 60, 60);
    ctx.restore();
    rimmed(ctx, INKY, METAL_L, 1.2, function (e) { rr(ctx, bx - 9 - e, by + 4 - e, 18 + 2 * e, 5 + 2 * e, 2); ctx.fill(); });
    ctx.fillStyle = "rgba(255," + Math.round(150 + 60 * on) + ",60," + Math.min(1, a * 1.5).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(bx, by + 4, 8, Math.PI, 0); ctx.fill(); });
}
// The airlock door: one round-topped leaf with a porthole and a wheel; it slides up into the
// wall while someone is at it. The lamp beside it blinks amber while it is open.
function airlockDoor(ctx, time) {
  var h = G.lockHole, open = A.lock, ease = open * open * (3 - 2 * open), dy = -h.h * 0.92 * ease, x = h.x + h.w / 2;
  if (ease < 0.999) {
    ctx.save(); rr(ctx, h.x, h.y, h.w, h.h, h.r); ctx.clip(); ctx.translate(0, dy);
    var dg = ctx.createLinearGradient(h.x, 0, h.x + h.w, 0); dg.addColorStop(0, "#E3E4F4"); dg.addColorStop(1, "#C3C6E2");
    ctx.fillStyle = dg; rr(ctx, h.x, h.y, h.w, h.h, h.r); ctx.fill();
    ctx.strokeStyle = "rgba(94,99,146,.5)"; ctx.lineWidth = 1.5; rr(ctx, h.x + 6, h.y + 6, h.w - 12, h.h - 10, h.r - 6); ctx.stroke();
    ctx.fillStyle = METAL_D; ctx.beginPath(); ctx.arc(x, h.y + 32, 17, 0, 7); ctx.fill();                 // the porthole
    ctx.fillStyle = "#4A4F86"; ctx.beginPath(); ctx.arc(x, h.y + 32, 13, 0, 7); ctx.fill();
    ctx.fillStyle = "#F4C95D"; ctx.beginPath(); ctx.arc(x + 3, h.y + 35, 3.5, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(x - 4, h.y + 27, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = CORAL; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, h.y + 70, 12, 0, 7); ctx.stroke();      // the wheel
    ctx.lineWidth = 2.5; ctx.beginPath(); for (var k = 0; k < 3; k++) { var a = k * Math.PI / 3 + ease * 3; ctx.moveTo(x + Math.cos(a) * 12, h.y + 70 + Math.sin(a) * 12); ctx.lineTo(x - Math.cos(a) * 12, h.y + 70 - Math.sin(a) * 12); } ctx.stroke();
    ctx.fillStyle = INKY; ctx.beginPath(); ctx.arc(x, h.y + 70, 3, 0, 7); ctx.fill();
    ctx.restore();
  }
  var L = G.lockLamp, blink = open > 0.02 ? (Math.sin(time * 8) > 0 ? 1 : 0.3) : 1;
  ctx.fillStyle = open > 0.02 ? "rgba(255,190,80," + blink + ")" : "#7BE07F"; ctx.beginPath(); ctx.arc(L.x, L.y, 4, 0, 7); ctx.fill();
}
function screens(ctx, time, S) {
  var i, WX = S.WX || {}, alert = (WX.storm || 0) > 0.4;
  // the comms screen: a waveform, big when the music plays
  var cs = G.commsScreen; ctx.save(); ctx.beginPath(); ctx.rect(cs.x, cs.y, cs.w, cs.h); ctx.clip();
  ctx.strokeStyle = HOLO; ctx.lineWidth = 1.6; ctx.beginPath();
  for (i = 0; i <= 34; i++) { var x = cs.x + i * cs.w / 34, amp = 3 + 10 * A.music; ctx.lineTo(x, cs.y + cs.h / 2 + Math.sin(i * 0.7 + time * 6) * amp * Math.sin(i * 0.19 + time)); }
  ctx.stroke(); ctx.restore();
  // the dish: sweeps slowly, faster with music
  var d = G.dish, ang = Math.sin(time * 0.4) * 0.5;
  ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(ang - 0.4);
  ctx.fillStyle = "#E8E9F6"; ctx.strokeStyle = INKY; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INKY; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke(); ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(0, -17, 3, 0, 7); ctx.fill();
  ctx.restore();
  // speakers pulse on the beat
  if (A.beat > 0.05) { ctx.strokeStyle = "rgba(140,239,245," + (0.6 * A.beat).toFixed(2) + ")"; ctx.lineWidth = 2;
    for (i = 0; i < 2; i++) { var sp = G.speakers[i]; ctx.beginPath(); ctx.arc(sp.x, sp.y, 15 + 5 * A.beat, 0, 7); ctx.stroke(); } }
  // the holo panels
  for (i = 0; i < G.holo.length; i++) { var p = G.holo[i], fl = 0.75 + 0.25 * Math.sin(time * 9 + i * 3) * Math.sin(time * 1.3 + i);
    ctx.save(); ctx.globalAlpha = fl; ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
    ctx.strokeStyle = HOLO; ctx.fillStyle = HOLO; ctx.lineWidth = 1.4;
    if (alert && p.kind === "cycle") { ctx.fillStyle = "rgba(255,176,90,.9)"; ctx.font = "600 9px Fredoka"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("SHIELDS", p.x + p.w / 2, p.y + p.h / 2 - 6); ctx.fillText("UP", p.x + p.w / 2, p.y + p.h / 2 + 6); }
    else if (p.kind === "cycle") { var day = 1 - S.DARK; ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h - 6, 16, Math.PI, 0); ctx.stroke();
      var sa = Math.PI + Math.PI * (0.15 + 0.7 * day); ctx.beginPath(); ctx.arc(p.x + p.w / 2 + Math.cos(sa) * 16, p.y + p.h - 6 + Math.sin(sa) * 16, 4, 0, 7); ctx.fill();
      ctx.font = "600 7.5px Fredoka"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(S.DARK > 0.5 ? "NIGHT CYCLE" : "DAY CYCLE", p.x + p.w / 2, p.y + 8); }
    else if (p.kind === "orbit") { var cx = p.x + p.w / 2, cy = p.y + p.h / 2; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, cy, 22, 9, 0, 0, 7); ctx.stroke(); var oa = time * 0.9; ctx.beginPath(); ctx.arc(cx + Math.cos(oa) * 22, cy + Math.sin(oa) * 9, 2.5, 0, 7); ctx.fill(); }
    else { for (var k = 0; k < 6; k++) { var bh = 6 + (p.h - 14) * (0.5 + 0.5 * Math.sin(time * (1.3 + k * 0.4) + k)) * (0.4 + 0.6 * Math.max(A.music, 0.3)); ctx.fillRect(p.x + 6 + k * 8, p.y + p.h - 4 - bh, 5, bh); } }
    ctx.restore(); }
  // the star map: blips and a course line
  var m = G.map; ctx.save(); ctx.beginPath(); ctx.rect(m.x, m.y, m.w, m.h); ctx.clip();
  ctx.strokeStyle = "rgba(244,201,93,.85)"; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -time * 12; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(m.x + 16, m.y + m.h - 12); ctx.quadraticCurveTo(m.x + m.w * 0.5, m.y + 4, m.x + m.w - 20, m.y + m.h * 0.45); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = HOLO; [[0.2, 0.3], [0.45, 0.7], [0.7, 0.25], [0.85, 0.75]].forEach(function (b, j) { var a = 0.4 + 0.6 * Math.max(0, Math.sin(time * 2 + j * 1.7));
    ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(m.x + m.w * b[0], m.y + m.h * b[1], 2.5, 0, 7); ctx.fill(); });
  ctx.globalAlpha = 1; ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(m.x + m.w - 20, m.y + m.h * 0.45, 4, 0, 7); ctx.fill();
  if (alert && Math.sin(time * 4) > -0.3) { ctx.fillStyle = "rgba(34,38,78,.85)"; ctx.fillRect(m.x, m.y + m.h / 2 - 12, m.w, 24);
    ctx.fillStyle = "#FFB04A"; ctx.font = "600 12px Fredoka"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SOLAR FLARE \u00b7 SHIELDS UP", m.x + m.w / 2, m.y + m.h / 2 + 0.5); }
  ctx.restore();
  // the console's buttons twinkle
  for (i = 0; i < G.buttons.length; i++) { var bt = G.buttons[i]; if (Math.sin(time * 3 + i * 2.1) > 0.6) { ctx.fillStyle = "rgba(255,255,255,.7)"; rr(ctx, bt.x - 4, bt.y - 2, 8, 4, 2); ctx.fill(); } }
}
// The fabricator: while a print runs the head shuttles and the model grows; done, it sparkles.
function fabLive(ctx, time, S) {
  var f = G.fabBox, pr = S.printer ? S.printer() : { state: "empty", progress: 0 }, st = pr.state, k = Math.max(0, Math.min(1, (pr.progress || 0) / 100));
  var running = st === "running" || st === "prepare", done = st === "finish";
  var h = done ? 1 : running || st === "pause" ? k : 0;
  var cx = f.x + f.w / 2, bed = f.bed, mh = (f.h - 34) * h;
  if (h > 0) {                                                             // the model: a little rocket, printed bottom up
    ctx.save(); ctx.beginPath(); ctx.rect(f.x, bed - mh, f.w, mh + 1); ctx.clip();
    rimmed(ctx, "#B04E44", CORAL, 1, function (e) { ctx.beginPath(); ctx.moveTo(cx - 10 - e, bed); ctx.lineTo(cx - 10 - e, bed - (f.h - 50)); ctx.quadraticCurveTo(cx, bed - (f.h - 30) - e, cx + 10 + e, bed - (f.h - 50)); ctx.lineTo(cx + 10 + e, bed); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = "#F4F1F8"; ctx.beginPath(); ctx.arc(cx, bed - (f.h - 50) * 0.55, 4, 0, 7); ctx.fill();
    ctx.restore();
  }
  var hx = running ? cx + Math.sin(time * 3.1) * (f.w / 2 - 12) : cx, hy = Math.max(f.y + 12, bed - mh - 10);
  ctx.fillStyle = METAL_L; ctx.fillRect(hx - 1.5, f.y + 9, 3, hy - f.y - 9);
  rimmed(ctx, INKY, "#E8E9F6", 1.2, function (e) { rr(ctx, hx - 8 - e, hy - 6 - e, 16 + 2 * e, 9 + 2 * e, 3); ctx.fill(); });
  if (running) { ctx.fillStyle = "rgba(255,190,90," + (0.6 + 0.4 * Math.sin(time * 20)).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(hx, hy + 5, 2.4, 0, 7); ctx.fill(); }
  if (done && Math.sin(time * 4) > 0.3) { ctx.fillStyle = "#FFFFFF"; sparkle(ctx, cx + 14, bed - (f.h - 40), 4, "#FFFFFF"); }
  var b = G.fabBar; ctx.fillStyle = st === "failed" ? CORAL : done ? "#7BE07F" : TEAL; rr(ctx, b.x, b.y, Math.max(4, b.w * (done ? 1 : running || st === "pause" ? k : 0)), 3, 1.5); ctx.fill();
}
function corridorLife(ctx) {
  var c = G.corr; if (!A.courier) return;
  var k = A.courier.k, y = c.fy1 + 2, x = A.courier.dir > 0 ? c.x - 26 + 52 * k : c.x + 26 - 52 * k;
  ctx.save(); ctx.beginPath(); ctx.rect(c.x - c.w / 2, c.top, c.w, c.y - c.top); ctx.clip();
  rimmed(ctx, INKY, SUN, 1, function (e) { rr(ctx, x - 7 - e, y - 12 - e, 14 + 2 * e, 10 + 2 * e, 4); ctx.fill(); });
  ctx.fillStyle = INKY; ctx.fillRect(x - 2, y - 9, 4, 3); ctx.beginPath(); ctx.arc(x - 4, y - 1, 2, 0, 7); ctx.arc(x + 4, y - 1, 2, 0, 7); ctx.fill();
  ctx.restore();
}
// The hologram over the table: the planet and its ring turning, a ring of tiny days round it;
// when the music plays it turns into a dancing equaliser.
function hologram(ctx, time, S) {
  var L = G.lens, x = L.x, y = L.y - 70, fl = 0.85 + 0.15 * Math.sin(time * 17) * Math.sin(time * 2.3);
  ctx.save(); ctx.globalAlpha = 0.8 * fl;
  var beam = ctx.createLinearGradient(0, L.y, 0, y - 50); beam.addColorStop(0, "rgba(140,239,245,.45)"); beam.addColorStop(1, "rgba(140,239,245,0)");
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x - 12, L.y); ctx.lineTo(x - 52, y - 40); ctx.lineTo(x + 52, y - 40); ctx.lineTo(x + 12, L.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = HOLO; ctx.fillStyle = HOLO; ctx.lineWidth = 2;
  ctx.globalAlpha = 0.35 * fl; ctx.drawImage(A.cyan, x - 60, y - 60, 120, 120); ctx.globalAlpha = 0.8 * fl;
  if (A.music > 0.3) {
    for (var k = 0; k < 9; k++) { var bh = 8 + 36 * (0.5 + 0.5 * Math.sin(time * (2 + k * 0.7) + k)) * A.music; ctx.globalAlpha = 0.85 * fl; ctx.fillStyle = [HOLO, "#E3A6F2", "#F4C95D"][k % 3];
      ctx.fillRect(x - 40 + k * 9, y + 20 - bh, 6, bh); }
  } else {
    var r = 22, rot = time * 0.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    for (var m = -2; m <= 2; m++) { ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(Math.cos(rot + m * 0.6)), r, 0, 0, 7); ctx.globalAlpha = 0.35 * fl; ctx.stroke(); }
    ctx.globalAlpha = 0.8 * fl; ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.42, -0.16, 0, 7); ctx.stroke();
    for (var d = 0; d < 7; d++) { var a = rot * 0.5 + d / 7 * Math.PI * 2; ctx.globalAlpha = 0.7 * fl * (0.6 + 0.4 * Math.sin(a)); ctx.beginPath(); ctx.arc(x + Math.cos(a) * 52, y + 14 + Math.sin(a) * 10, 2.4, 0, 7); ctx.fill(); }
  }
  ctx.restore();
  void S;
}
// The cleaning bot: a dome on a disc, a little face, a brush that spins, an antenna.
function bot(ctx, time, S) {
  var b = A.bot, sc = S.depth(b.y), moving = Math.abs(b.tx - b.x) + Math.abs(b.ty - b.y) > 2, asleep = S.nightness > 0.6;
  ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.face * sc, sc);
  ctx.fillStyle = "rgba(40,40,80,.25)"; ctx.beginPath(); ctx.ellipse(0, 1, 18, 4, 0, 0, 7); ctx.fill();
  rimmed(ctx, INKY, "#E8E9F6", 1.5, function (e) { ctx.beginPath(); ctx.ellipse(0, -5, 16 + e, 6 + e, 0, 0, 7); ctx.fill(); });
  rimmed(ctx, INKY, "#F4F4FC", 1.5, function (e) { ctx.beginPath(); ctx.arc(0, -8, 11 + e, Math.PI, 0); ctx.closePath(); ctx.fill(); });
  ctx.fillStyle = TEAL; ctx.fillRect(-16, -6, 32, 2);
  ctx.fillStyle = "#2B2433";
  if (asleep) { ctx.strokeStyle = "#2B2433"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, -12); ctx.lineTo(5, -12); ctx.moveTo(7, -12); ctx.lineTo(10, -12); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(3, -12, 1.6, 0, 7); ctx.arc(8, -12, 1.6, 0, 7); ctx.fill(); }
  ctx.strokeStyle = INKY; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(-6, -27); ctx.stroke();
  ctx.fillStyle = asleep ? "#9EA2C6" : moving && Math.sin(time * 10) > 0 ? CORAL : SUN; ctx.beginPath(); ctx.arc(-6, -28, 2.6, 0, 7); ctx.fill();
  var spin = time * 20; ctx.strokeStyle = "rgba(90,96,140,.6)"; ctx.lineWidth = 1;                    // the brush
  for (var i = 0; i < 4; i++) { var a = spin + i * 1.57; ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(14 + Math.cos(a) * 6, -1 + Math.sin(a) * 2); ctx.stroke(); }
  ctx.restore();
}
function drone(ctx, time, S) {
  var d = A.drone, x = d.x, y = d.y, sc = 0.9;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.strokeStyle = METAL_D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.stroke();
  var w = Math.abs(Math.sin(time * 40)) * 9 + 3; ctx.fillStyle = "rgba(200,205,235,.7)";
  ctx.beginPath(); ctx.ellipse(-14, -8, w, 1.6, 0, 0, 7); ctx.ellipse(14, -8, w, 1.6, 0, 0, 7); ctx.fill();
  rimmed(ctx, INKY, SUN, 1.5, function (e) { ctx.beginPath(); ctx.arc(0, 0, 8 + e, 0, 7); ctx.fill(); });
  ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(2, -1, 2, 0, 7); ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(2.6, -1.6, 0.7, 0, 7); ctx.fill();
  ctx.restore();
  if (d.spray > 0) { ctx.fillStyle = "rgba(150,210,255,.7)"; for (var i = 0; i < 6; i++) { var k = ((time * 3 + i / 6) % 1); ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.3) * 8 * k, y + 10 + k * 40, 1.5, 0, 7); ctx.fill(); } }
  void S;
}
// In front of the family: the airlock's left jamb, so whoever leaves goes in, not over it.
function front(ctx, time, S) {
  if (!A) return;
  var st = S && S.WX ? S.WX.storm || 0 : 0;                               // a warm wash over the room in a flare
  if (st > 0.05) { ctx.fillStyle = "rgba(255,160,70," + (0.07 * st * (0.7 + 0.3 * Math.sin(time * 5))).toFixed(3) + ")"; ctx.fillRect(0, 0, G.W, G.H); }
  var h = G.lockHole, x1 = Math.max(0, h.x - 12);
  ctx.fillStyle = "#B9BDDC"; ctx.fillRect(0, h.y - 8, x1, h.h + 26);
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(0, h.y - 8, x1, 2);
  ctx.fillStyle = METAL_D; ctx.fillRect(x1 - 2, h.y - 8, 2, h.h + 26);
}
// Over the night: the stars brighter, the planet's cities, the window glow, the room's
// lights (guide strips, screens, the pod, the grow lights) and, in a flare, amber beacons.
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W;
  if (D <= 0.02) return;
  // undo some of the dusk on the window: space is not dimmed by the station's lights
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, G.SILL); ctx.clip();
  ctx.globalAlpha = D * 0.9; ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.twinkle.length; i++) { var tw = A.twinkle[i], a = 0.55 + 0.45 * Math.sin(time * 1.4 + tw.ph); ctx.globalAlpha = D * a; ctx.fillRect(tw.x, tw.y, tw.s + 0.5, tw.s + 0.5); }
  ctx.globalAlpha = D; ctx.fillStyle = "#FFE29A";
  for (i = 0; i < G.cities.length; i++) { var c = G.cities[i]; if (Math.sin(time * 0.7 + i) > -0.6) ctx.fillRect(c.x, c.y, c.s, c.s); }
  ctx.restore();
  ctx.globalCompositeOperation = "lighter";
  // guide lights along the wall and the deck
  for (i = 0; i < G.kick.length; i++) { var on2 = 0.6 + 0.4 * Math.sin(time * 2 - i * 0.4) + 0.4 * A.beat; ctx.globalAlpha = D * 0.5 * on2; ctx.drawImage(A.cyan, G.kick[i] - 9, G.B - 16, 18, 14); }
  for (i = 0; i < G.guide.length; i++) { var gd = G.guide[i], ph = (time * 1.5 - i * 0.25) % 1.5; ctx.globalAlpha = D * (ph > 0 && ph < 0.4 ? 0.9 : 0.35); ctx.drawImage(A.cyan, gd.x - 12, gd.y - 6, 24, 12); }
  // screens and panels
  var cs = G.commsScreen; ctx.globalAlpha = D * 0.5; ctx.drawImage(A.cyan, cs.x - 14, cs.y - 14, cs.w + 28, cs.h + 28);
  var m = G.map; ctx.globalAlpha = D * 0.45; ctx.drawImage(A.cyan, m.x - 20, m.y - 18, m.w + 40, m.h + 36);
  for (i = 0; i < G.holo.length; i++) { var p = G.holo[i]; ctx.globalAlpha = D * 0.4; ctx.drawImage(A.cyan, p.x - 12, p.y - 12, p.w + 24, p.h + 24); }
  var f = G.fabBox; ctx.globalAlpha = D * 0.35; ctx.drawImage(A.amber, f.x - 10, f.y - 10, f.w + 20, f.h + 20);
  // the hab pod's door and porthole, warm
  var pd = G.podDoor; ctx.globalAlpha = D * 0.75; ctx.drawImage(A.glow, pd.x - 40, pd.y - 48, 80, 96);
  ctx.globalAlpha = D * 0.4; ctx.drawImage(A.glow, pd.x - 70, pd.y + 30, 140, 40);
  var ph2 = G.porthole; ctx.globalAlpha = D * 0.8; ctx.drawImage(A.glow, ph2.x - 30, ph2.y - 30, 60, 60);
  // the hologram and the table's ring
  var L = G.lens; ctx.globalAlpha = D * 0.6; ctx.drawImage(A.cyan, L.x - 90, L.y - 140, 180, 160);
  // grow lights and the glowing bulbs, the pool
  for (i = 0; i < G.grow.length; i++) { var gl = G.grow[i]; ctx.globalAlpha = D * 0.55; ctx.drawImage(A.pink, gl.x - 26, gl.y - 18, 52, 52); }
  for (i = 0; i < G.bulbs.length; i++) { var bb = G.bulbs[i], pu = 0.7 + 0.3 * Math.sin(time * 1.3 + i); ctx.globalAlpha = D * 0.7 * pu; ctx.drawImage(A.cyan, bb.x - 16, bb.y - 16, 32, 32); }
  var P = G.pool; ctx.globalAlpha = D * 0.45; ctx.drawImage(A.cyan, P.x - P.rx, P.y - P.ry * 1.6, P.rx * 2, P.ry * 3.2);
  // the airlock lamp, the pod's heart, the bot's antenna
  var ll = G.lockLamp; ctx.globalAlpha = D * 0.8; ctx.drawImage(A.lock > 0.02 ? A.amber : A.cyan, ll.x - 12, ll.y - 12, 24, 24);
  var pt = G.podTop; ctx.globalAlpha = D * 0.8; ctx.drawImage(A.pink, pt.x - 14, pt.y - 14, 28, 28);
  ctx.globalCompositeOperation = "source-over";
  // the lamps themselves, so they read as lit
  ctx.globalAlpha = D * 0.9; ctx.fillStyle = "#E6FBFF";
  for (i = 0; i < G.kick.length; i++) { rr(ctx, G.kick[i] - 4, G.B - 9, 8, 3, 1.5); ctx.fill(); }
  ctx.fillStyle = "#FFE3A6"; ctx.beginPath(); ctx.arc(ph2.x, ph2.y, 14, 0, 7); ctx.fill();
  ctx.fillStyle = "#F7E9FF"; for (i = 0; i < G.grow.length; i++) { rr(ctx, G.grow[i].x - 7, G.grow[i].y - 2.5, 14, 5, 2.5); ctx.fill(); }
  ctx.globalAlpha = 1;
}

// The tug that tows the next-event banner past the window: a round little ship with a beam.
function flyer(ctx, x, y, dir, time) {
  ctx.save(); ctx.translate(x, y - 14); ctx.scale(dir, 1);
  var fl = 0.6 + 0.4 * Math.sin(time * 30);
  ctx.fillStyle = "rgba(140,239,245," + fl.toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(-26, 2, 8 * fl + 4, 3, 0, 0, 7); ctx.fill();
  rimmed(ctx, METAL_D, "#F4F4FC", 1.5, function (e) { ctx.beginPath(); ctx.ellipse(0, 0, 22 + e, 12 + e, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(0, 4, 22, 5, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#6CC4D6"; ctx.beginPath(); ctx.arc(8, -3, 6, 0, 7); ctx.fill();
  ctx.fillStyle = "#9EE0B4"; ctx.beginPath(); ctx.arc(8, -2, 3.2, 0, 7); ctx.fill();                       // the pilot, waving
  ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(9, -3, 1, 0, 7); ctx.fill();
  ctx.strokeStyle = METAL_D; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-10, -18); ctx.stroke();
  ctx.fillStyle = Math.sin(time * 5) > 0 ? (dir > 0 ? "#7BE07F" : "#FF6B6B") : "#C9CBE4"; ctx.beginPath(); ctx.arc(-10, -19, 2.4, 0, 7); ctx.fill();
  ctx.restore();
}

export default {
  id: "station", label: "Space station",
  blurb: "the space station has the airlock to the shuttles, the comms console, the fabricator, the bridge, your hab pod, the holo table and the hydroponics pool, under a big window onto space",
  shadow: "40,40,90",
  depth: [0.7, 0.32],
  indoor: true, darkSky: true,
  // the default cast are aliens here (a config with its own people keeps their looks)
  demoCast: ["alien_tetra", "alien_rock", "alien_zib", "alien_gloop", "alien_bloom", "alien_dome"],
  creatures: ["alien_gloop", "alien_tetra", "alien_zib", "alien_rock", "alien_bloom", "alien_dome", "cat", "owl", "frog", "shark", "otter", "snail"],
  bake: function (g, S) { bake(g, S); },
  // round the holo table, by the pod, near the plants
  start: function (i, S) {
    var slots = [[0.38, 0.8], [0.62, 0.84], [0.5, 0.94], [0.36, 0.62], [0.66, 0.66], [0.2, 0.8], [0.8, 0.6], [0.3, 0.92]], s = slots[i % slots.length];
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  swimSpot: function (S) { var p = G.pool; void S; return { x: p.x - rand(-p.rx * 0.3, p.rx * 0.3), y: p.y - p.ry - 34 }; },
  // someone on a duty walks round the table, the pod, the plants and the bridge, not through them
  via: function (t, dest, S) { if (!t.pass) return null;
    return around(t, dest, G.big, 30, function (x, y) { return x > 20 && x < G.W - 20 && y > G.B + 20 && y < G.H - 10 && !S.inZone(x, y, 4); }); },
  // The landmarks a tap opens: the airlock (the School card), the comms console (music), the
  // fabricator (the printer), the hab pod (home) and the bridge (the office).
  hotspots: {
    school:  { box: function () { var l = G.lock; return [l.x - 66, l.y - 116, l.x + 66, l.y + 20]; },
               tap: function (S) { var l = G.lock; S.say("whoosh!", l.x, l.y - 124); } },
    printer: { box: function () { var f = G.fab; return [f.x - 58, f.y - 128, f.x + 70, f.y + 16]; },
               tap: function (S) { var f = G.fab; S.puff("chip", f.x, f.y - 60, 7, "#F08A7E"); } },
    music:   { box: function () { var c = G.comms; return [c.x - 92, c.y - 126, c.x + 92, c.y + 16]; },
               tap: function (S) { var c = G.comms; S.puff("note", c.x + rand(-30, 30), c.y - 100, 5, "#5FC2BE"); } },
    home:    { box: function () { var p = G.pod; return [p.x - 104, p.y - 172, p.x + 104, p.y + 10]; },
               tap: function (S) { var p = G.pod; S.puff("heart", p.x, p.y - 130, 3, "#FF7FA0"); } },
    office:  { box: function () { var b = G.bridge; return [b.x - 120, b.y - 140, b.x + 120, b.y + 60]; },
               tap: function (S) { var b = G.bridge; S.say("beep!", b.x, b.y - 148); } }
  },
  weather: {
    // snow lies nowhere indoors: the ice field is outside, the frost on the glass (back())
    ground: function (ctx, S, WX) { void ctx; void S; void WX; }
  },
  flyer: function (ctx, x, y, dir, time) { flyer(ctx, x, y, dir, time); },
  // a party's glitter ball hangs indoors, from the window sill over the deck, not out in space
  disco: function () { return { x: Math.round(G.W * 0.475), y: G.WT + 52, top: G.WT + 3 }; },
  ambient: { setup: setup, update: update, under: under, back: back, front: front, light: light }
};
