// The meadow: the first scene, and the only one with the village. A high street along
// the back, the school down the left, the woodcutter down the right, the bandstand,
// garden, pitch and pond along the bottom, the family's patch in the middle.
// village: true hands the engine's village to it (walkers, queues, the school, the
// workshop, the bandstand show, the house party at the cottage, the postie); grazers:
// true brings the puffs, the wild foxes, the berries and the fireflies.
// The decoration (pebbles, stars, grass) draws from prng(), never Math.random, so the
// sim's own random sequence is the same as before the polish.
import { rand, pick, rr, rimmed, canvas, prng, aoShadow } from "../engine/draw.js";

export default {
  id: "meadow", label: "Meadow",
  blurb: "the meadow has the village: school, workshop, bandstand and cottage",
  village: true, grazers: true,
  creatures: ["crow", "capybara", "deer", "shark", "otter", "snail", "fox", "hedgehog", "rabbit", "frog", "cat", "owl", "bear", "bunny"],
  bake: bake,
  // spread out along the meadow, clear of the workshop plot on the right
  start: function (i, S) { return { x: S.W * (0.24 + (i % 3) * 0.22), y: i < 3 ? S.TOP + 150 : S.H - 200 }; },
  // where the swimmers stand when they fancy a dip: the pond's bank
  swimSpot: function (S) { return { x: rand(S.W * 0.72, S.W * 0.83), y: S.H - 172 }; },
  // The landmarks a tap opens (scenes/index.js has the ids): the school, the workshop plot,
  // the bandstand (and the now-playing sign over it), the blue cottage, and the office robot.
  // The town crier comes out of the cottage, down to the road, along it and down the
  // woodcutter's lane, and stands on the grass above the pond with the scroll to his left.
  crier: function (S) {
    var d = S.layout.doors.cottage, R = S.lay.R, lx = Math.round(S.W * 0.855), spot = { x: Math.round(S.W * 0.83), y: S.H - 150 };
    return { path: [{ x: d.x, y: d.y }, { x: d.x, y: R }, { x: lx, y: R }, { x: lx, y: spot.y - 24 }, spot], face: -1, top: R + 12 };
  },
  // The pillar box outside the post office: where a letter waits for the morning post.
  postbox: function (S) { var p = S.lay.post; return { x: p.x + 57, y: S.lay.B - 32 }; },
  hotspots: {
    school:  { box: function (S) { var s = S.lay.school; return [s.x - 90, s.y - 145, s.x + 90, s.y + 8]; },
               tap: function (S) { var s = S.lay.school; S.say("ding!", s.x + 22, s.y - 150); } },
    printer: { box: function (S) { var s = S.lay.shop; return [s.x - 90, s.y - 100, s.x + 66, s.y + 12]; },
               tap: function (S) { var s = S.lay.shop; S.puff("chip", s.x, s.y - 30, 6, "#D9B27A"); } },
    music:   { box: function (S) { var b = S.lay.band; return [b.x - 95, b.y - 140 - (S.sign || 0), b.x + 95, b.y + 22]; },
               tap: function (S) { var b = S.lay.band; S.puff("note", b.x + rand(-30, 30), b.y - 100, 5, "#D9534F"); } },
    home:    { box: function (S) { var c = S.lay.cottage; return [c.x - 58, c.y - 110, c.x + 58, c.y + 10]; },
               tap: function (S) { var c = S.lay.cottage; S.puff("heart", c.x + 18, c.y - 50, 3, "#FF7FA0"); } },
    office:  { robot: true }
  },
  weather: {
    // lying snow, and a snowman by the garden
    ground: function (ctx, S, WX) {
      if (WX.snow > 0.02) { ctx.fillStyle = "rgba(246,249,255," + (0.5 * WX.snow).toFixed(3) + ")"; ctx.fillRect(0, S.HZ - 30, S.W, S.H);
        ctx.globalAlpha = WX.snow; S.blit(S.sprites.snowman, S.W * 0.215, S.H - 120, 1, 1, 1, 1); ctx.globalAlpha = 1; }
    }
  },
  // The sky after dark (stars and the moon behind the roofs), the sunset band at dusk,
  // ripples on the pond, and the moon's glint on the water over the dusk.
  ambient: {
    setup: function (S) { NIGHT = bakeNight(S); },
    update: function () {},
    under: function (ctx, time, S) {
      var P = PONDREF; if (!P) return;
      var d = S.DARK || 0;
      if (d > 0 && NIGHT) {
        ctx.globalAlpha = Math.pow(d, 1.5); ctx.drawImage(NIGHT.c, 0, 0, S.W, S.H);
        ctx.globalAlpha = Math.pow(d, 1.5) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.7))); ctx.drawImage(NIGHT.t, 0, 0, S.W, S.H);
        ctx.globalAlpha = 1;
      }
      if (d > 0 && d < 1) {                                            // the sunset band on the horizon
        var a = Math.sin(d * Math.PI) * 0.32, gr = ctx.createLinearGradient(0, S.HZ - 120, 0, S.HZ + 10);
        gr.addColorStop(0, "rgba(255,160,90,0)"); gr.addColorStop(0.7, "rgba(255,150,80," + a.toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,190,120,0)");
        ctx.fillStyle = gr; ctx.fillRect(0, S.HZ - 120, S.W, 130);
      }
      // two ripples spreading on the pond
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5;
      for (var i = 0; i < 2; i++) { var k = ((time * 0.22 + i * 0.5) % 1), r = 0.15 + k * 0.6;
        ctx.globalAlpha = (1 - k) * 0.7; ctx.beginPath(); ctx.ellipse(P.x - 20, P.y - 6, P.rx * r, P.ry * r, 0, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    },
    light: function (ctx, time, S) {
      var P = PONDREF, d = S.DARK || 0; if (!P || d <= 0) return;
      ctx.globalAlpha = d * 0.22; ctx.fillStyle = "#FFF4D0";                 // moonlight on the water
      ctx.beginPath(); ctx.ellipse(P.x - 10, P.y - 10, P.rx * 0.5, P.ry * 0.22, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
};

var NIGHT = null, PONDREF = null;

// Painted once per size. S.place() takes the layout half way, once the pond is known,
// so the tufts and flowers can stay off every zone.
function bake(g, S) {
  var W = S.W, H = S.H, HZ = S.HZ, i, R = prng(7 + W * 3 + H);
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#9CCFEE"); sky.addColorStop(0.55, "#C4E5F2"); sky.addColorStop(1, "#EAF6E8");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 20);
  var sun = g.createRadialGradient(W * 0.72, 10, 0, W * 0.72, 10, HZ * 0.9);                // the sun's glow, high and right
  sun.addColorStop(0, "rgba(255,248,210,.55)"); sun.addColorStop(0.5, "rgba(255,244,200,.15)"); sun.addColorStop(1, "rgba(255,240,190,0)");
  g.fillStyle = sun; g.fillRect(0, 0, W, HZ + 20);
  hills(g, W, H, HZ - 40, 20, "#CFE4D6", 0.4);                                            // the far ridge, in the haze
  hills(g, W, H, HZ - 18, 22, "#B7DFB4", 1.2);
  hills(g, W, H, HZ + 2, 14, "#9ED39E", 4.1);
  var haze = g.createLinearGradient(0, HZ - 50, 0, HZ + 24);                              // the air between here and the hills
  haze.addColorStop(0, "rgba(225,242,236,.55)"); haze.addColorStop(1, "rgba(225,242,236,0)");
  g.fillStyle = haze; g.fillRect(0, HZ - 50, W, 74);
  var gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, "#9CD397"); gr.addColorStop(0.5, "#8BCB88"); gr.addColorStop(1, "#78BF7A");
  g.fillStyle = gr; g.fillRect(0, HZ + 8, W, H);
  hills(g, W, H, HZ + 12, 6, "#98D194", 2.7);
  // bushes on the horizon, behind anything that can walk
  for (i = 0; i < 9; i++) {
    var bx = rand(0, W), by = HZ + rand(4, 16), br = rand(18, 34);
    if (bx < 520 && by < HZ + 20 && i % 2) continue;
    aoShadow(g, bx, by + br * 0.42, br * 1.5, br * 0.3, 0.16);
    [[0, 0, 1], [-0.7, 0.25, 0.7], [0.7, 0.25, 0.75]].forEach(function (p) {
      g.fillStyle = "#6AB06E"; g.beginPath(); g.arc(bx + p[0] * br, by + p[1] * br, br * p[2], 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.38, br * 0.4, 0, 7); g.fill();
    g.fillStyle = "rgba(40,90,50,.14)"; g.beginPath(); g.arc(bx + br * 0.75, by + br * 0.4, br * 0.42, 0, 7); g.fill();
  }
  // soft mottles so the grass is not a flat fill
  for (i = 0; i < 90; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(40,110,50,.06)";
    g.beginPath(); g.ellipse(rand(0, W), rand(HZ + 20, H), rand(30, 110), rand(10, 30), 0, 0, 7); g.fill();
  }
  // the light falls off towards the edges, so the middle (the family) reads first
  var vg = g.createRadialGradient(W * 0.5, H * 0.58, H * 0.25, W * 0.5, H * 0.58, W * 0.72);
  vg.addColorStop(0, "rgba(20,70,30,0)"); vg.addColorStop(1, "rgba(20,70,30,.16)");
  g.fillStyle = vg; g.fillRect(0, HZ + 8, W, H);
  // pond, half off the bottom-right edge
  var POND = { x: W * 0.83, y: H * 0.93, rx: Math.min(210, W * 0.17), ry: 74 };
  aoShadow(g, POND.x, POND.y + 4, POND.rx + 30, POND.ry + 22, 0.2);
  g.fillStyle = "#67AF74"; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx + 10, POND.ry + 8, 0, 0, 7); g.fill();
  g.fillStyle = "#B9A072"; g.beginPath(); g.ellipse(POND.x, POND.y + 1, POND.rx + 4, POND.ry + 3, 0, 0, 7); g.fill();    // the muddy edge
  var pg = g.createLinearGradient(0, POND.y - POND.ry, 0, POND.y + POND.ry);
  pg.addColorStop(0, "#A9DDEA"); pg.addColorStop(0.5, "#75C0D8"); pg.addColorStop(1, "#5AA9C8");
  g.fillStyle = pg; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); g.fill();
  var deep = g.createRadialGradient(POND.x + 10, POND.y + 10, 0, POND.x + 10, POND.y + 10, POND.rx * 0.8);
  deep.addColorStop(0, "rgba(40,110,150,.22)"); deep.addColorStop(1, "rgba(40,110,150,0)");
  g.fillStyle = deep; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(POND.x - POND.rx * 0.25, POND.y - POND.ry * 0.45, POND.rx * 0.5, POND.ry * 0.22, 0, 0, 7); g.fill();   // the sky in it
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.ellipse(POND.x - 30, POND.y - 22, 60, 14, 0, 3.6, 5.2); g.stroke();
  g.lineWidth = 1.5; g.strokeStyle = "rgba(255,255,255,.35)";
  g.beginPath(); g.ellipse(POND.x + 40, POND.y + 20, 36, 9, 0, 3.4, 5.6); g.stroke();
  g.fillStyle = "#5FAE69"; g.beginPath(); g.ellipse(POND.x + 70, POND.y - 12, 26, 12, 0.3, 0.5, 6.0); g.fill();   // lily pad
  g.fillStyle = "#4E9A5A"; g.beginPath(); g.ellipse(POND.x + 30, POND.y + 34, 16, 8, -0.2, 0.5, 6.0); g.fill();   // and a small one
  g.fillStyle = "#FFB3C7"; g.beginPath(); g.arc(POND.x + 74, POND.y - 16, 6, 0, 7); g.fill();
  g.fillStyle = "#FFD6E2"; g.beginPath(); g.arc(POND.x + 72, POND.y - 18, 2.5, 0, 7); g.fill();
  reeds(g, POND.x + POND.rx * 0.78, POND.y - POND.ry * 0.62, R);                        // reeds on the far bank
  PONDREF = POND;
  S.place(layout(S, POND));
  // tufts and flowers
  for (i = 0; i < 160; i++) {
    var x = rand(0, W), y = rand(HZ + 26, H);
    if (S.inZone(x, y, 16)) continue;
    g.strokeStyle = i % 3 ? "rgba(52,120,60,.42)" : "rgba(255,255,255,.3)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 4, y - 7); g.lineTo(x, y); g.lineTo(x + 1, y - 9); g.moveTo(x, y); g.lineTo(x + 5, y - 6); g.stroke();
  }
  for (i = 0; i < 70; i++) {
    var fx = rand(0, W), fy = rand(HZ + 30, H), fc = pick(["#FFFFFF", "#FFF3A8", "#FFC4D6", "#E4D2FF"]);
    if (S.inZone(fx, fy, 14)) continue;
    g.fillStyle = "rgba(30,80,40,.12)"; g.beginPath(); g.ellipse(fx + 1, fy + 3, 5, 2, 0, 0, 7); g.fill();
    g.fillStyle = fc; for (var p = 0; p < 5; p++) { var a = p / 5 * 6.283;
      g.beginPath(); g.arc(fx + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 2.6, 0, 7); g.fill(); }
    g.fillStyle = "#F4B63C"; g.beginPath(); g.arc(fx, fy, 1.8, 0, 7); g.fill();
  }
  // a few clover patches and dandelion clocks, from the scene's own numbers
  for (i = 0; i < 24; i++) {
    var cx = R() * W, cy = HZ + 30 + R() * (H - HZ - 40);
    if (S.inZone(cx, cy, 18)) continue;
    g.fillStyle = "rgba(60,140,70,.35)"; for (p = 0; p < 3; p++) { g.beginPath(); g.arc(cx + Math.cos(p * 2.1) * 3, cy + Math.sin(p * 2.1) * 3, 3, 0, 7); g.fill(); }
    if (i % 4 === 0) { g.strokeStyle = "rgba(90,140,80,.5)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 8, cy + 2); g.lineTo(cx + 9, cy - 10); g.stroke();
      g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(cx + 9, cy - 12, 3.2, 0, 7); g.fill(); }
  }
  paintProps(g, S, function () { return Math.random(); });
}

function hills(g, W, H, y, amp, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
  for (var x = 0; x <= W; x += 16) g.lineTo(x, y - amp * (0.6 * Math.sin(x / 210 + seed) + 0.4 * Math.sin(x / 97 + seed * 2.3)));
  g.lineTo(W, H); g.closePath(); g.fill();
}
function reeds(g, x, y, R) {
  g.lineCap = "round";
  for (var i = 0; i < 7; i++) { var rx = x + (i - 3) * 6 + (R() - 0.5) * 4, h = 26 + R() * 18, lean = (R() - 0.5) * 10;
    g.strokeStyle = i % 2 ? "#4E8F57" : "#6AAE68"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(rx, y); g.quadraticCurveTo(rx + lean * 0.5, y - h * 0.6, rx + lean, y - h); g.stroke();
    if (i % 3 === 1) { g.fillStyle = "#8A5A3C"; rr(g, rx + lean - 2, y - h - 8, 4, 11, 2); g.fill(); } }
}

// The sky after dark, baked once: a deep blue that fades to the horizon, stars, the moon.
// The hills, bushes and village are cut out of it, so it sits behind the roofs.
function bakeNight(S) {
  var W = S.W, H = S.H, HZ = S.HZ, D = S.DPR || 1, c = canvas(W * D, H * D), g = c.getContext("2d"), R = prng(99 + W), i;
  g.scale(D, D);
  var sky = g.createLinearGradient(0, 0, 0, HZ + 10);
  sky.addColorStop(0, "rgba(8,14,52,.9)"); sky.addColorStop(0.6, "rgba(24,36,96,.7)"); sky.addColorStop(1, "rgba(60,70,130,0)");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 10);
  for (i = 0; i < 110; i++) { var sx = R() * W, sy = R() * R() * (HZ - 20), sr = 0.5 + R() * 1.1;
    g.fillStyle = "rgba(255,250,235," + (0.5 + R() * 0.5).toFixed(2) + ")"; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); }
  var mx = W * 0.7, my = 104;                                                          // the moon, clear of the chips and the hint
  var halo = g.createRadialGradient(mx, my, 18, mx, my, 90);
  halo.addColorStop(0, "rgba(255,245,210,.35)"); halo.addColorStop(1, "rgba(255,245,210,0)");
  g.fillStyle = halo; g.beginPath(); g.arc(mx, my, 90, 0, 7); g.fill();
  g.fillStyle = "#FFF6D8"; g.beginPath(); g.arc(mx, my, 22, 0, 7); g.fill();
  g.fillStyle = "rgba(200,190,160,.35)"; [[-7, -5, 5], [6, 4, 4], [2, -9, 2.5], [-4, 9, 3]].forEach(function (k) { g.beginPath(); g.arc(mx + k[0], my + k[1], k[2], 0, 7); g.fill(); });
  // cut the scenery out, so the sky stays behind it
  g.globalCompositeOperation = "destination-out";
  hills(g, W, H, HZ - 40, 20, "#000", 0.4); hills(g, W, H, HZ - 18, 22, "#000", 1.2);
  paintProps(g, S, prng(1), true);
  g.globalCompositeOperation = "source-over";
  // the handful that twinkle, on their own layer
  var t = canvas(W * D, H * D), tg = t.getContext("2d"); tg.scale(D, D);
  for (i = 0; i < 26; i++) { var tx = R() * W, ty = R() * (HZ - 70), tr = 1.4 + R() * 1.2;
    tg.fillStyle = "rgba(255,255,255,.95)"; tg.beginPath(); tg.arc(tx, ty, tr, 0, 7); tg.fill();
    tg.strokeStyle = "rgba(255,255,255,.55)"; tg.lineWidth = 1; tg.beginPath(); tg.moveTo(tx - tr * 3, ty); tg.lineTo(tx + tr * 3, ty); tg.moveTo(tx, ty - tr * 3); tg.lineTo(tx, ty + tr * 3); tg.stroke(); }
  tg.globalCompositeOperation = "destination-out";
  hills(tg, W, H, HZ - 40, 20, "#000", 0.4); paintProps(tg, S, prng(1), true);
  return { c: c, t: t };
}

// The village. A high street along the back with a road in front of it, the school
// and playground down the left, the woodcutter and washing line down the right, and
// the bandstand, garden, pitch and pond along the bottom. The middle is the family's
// patch, and nothing in the village is allowed to plan a route through it.
// Fractions of the screen, so it survives another resolution.
function layout(S, POND) {
  var W = S.W, H = S.H, TOP = S.TOP, B = TOP + 36, R = TOP + 62;
  var LAY = {
    B: B, R: R,
    well:    { x: Math.round(W * 0.06),  y: B },
    pub:     { x: Math.round(W * 0.195), y: B },
    bakery:  { x: Math.round(W * 0.345), y: B },
    post:    { x: Math.round(W * 0.48),  y: B },
    market:  { x: Math.round(W * 0.61),  y: B },
    bus:     { x: Math.round(W * 0.715), y: R + 16 },
    cottage: { x: Math.round(W * 0.79),  y: B },
    mill:    { x: Math.round(W * 0.905), y: B },
    // The printer's workshop goes on the cottage's back plot, below it and left of
    // the woodcutter: the one patch the village had not used. The family patch
    // starts just below its zone.
    shop:    { x: Math.round(W * 0.79),  y: TOP + 172 },
    school:  { x: Math.round(W * 0.075), y: TOP + 190 },
    swing:   { x: Math.round(W * 0.05),  y: H - 160 },
    wood:    { x: Math.round(W * 0.9),   y: TOP + 175 },
    wash:    { x: Math.round(W * 0.925), y: H - 200 },
    garden:  { x: Math.round(W * 0.14),  y: H - 58 },
    band:    { x: Math.round(W * 0.33),  y: H - 30 },
    pitch:   { x: Math.round(W * 0.52),  y: H - 60 },
    fish:    { x: POND.x + Math.cos(3.45) * (POND.rx + 8), y: POND.y + Math.sin(3.45) * (POND.ry + 8), bx: POND.x - POND.rx * 0.5, by: POND.y - POND.ry * 0.3 }
  };
  var L = LAY, lx = Math.round(W * 0.855), sx = L.school.x + 100;
  function back(x, y) { return { x: x, y: y || B + 3, lane: [{ x: x, y: R }] }; }
  var DOORS = {
    pub: back(L.pub.x - 30), bakery: back(L.bakery.x - 31), post: back(L.post.x - 18),
    cottage: back(L.cottage.x - 14), mill: back(L.mill.x),
    bakeryside: back(L.bakery.x + 84, B + 12), marketside: back(L.market.x - 84, B + 14),
    marketq: back(L.market.x + 10, B + 20), wellq: back(L.well.x + 60, R), busq: back(L.bus.x - 30, R + 12),
    school: { x: L.school.x, y: L.school.y + 3, lane: [{ x: sx, y: L.school.y + 12 }, { x: sx, y: R }] },
    wood: { x: L.wood.x - 34, y: L.wood.y + 4, lane: [{ x: lx, y: L.wood.y + 4 }, { x: lx, y: R }] },
    wash: { x: L.wash.x - 44, y: L.wash.y + 8, lane: [{ x: lx, y: L.wash.y + 8 }, { x: lx, y: R }] },
    left: { x: -24, y: R, lane: [] }, right: { x: W + 24, y: R, lane: [] }
  };
  var ZONES = [{ x: POND.x, y: POND.y, rx: POND.rx, ry: POND.ry },
    { x: L.school.x + 5, y: L.school.y + 50, rx: 112, ry: 165 },        // school, yard and swing
    { x: L.wood.x + 30, y: L.wood.y + 90, rx: 105, ry: 165 },           // woodcutter and washing line
    { x: L.garden.x + 20, y: L.garden.y - 8, rx: 140, ry: 52 },
    { x: L.band.x, y: L.band.y - 22, rx: 92, ry: 58 },
    { x: L.pitch.x, y: L.pitch.y, rx: 128, ry: 50 },
    { x: L.fish.x - 10, y: L.fish.y, rx: 46, ry: 30 },
    { x: L.shop.x, y: L.shop.y - 16, rx: 74, ry: 46 }];                 // the workshop plot
  return { lay: LAY, doors: DOORS, zones: ZONES, water: POND,
    exit: { x: LAY.bus.x - 36, y: LAY.R + 14, off: { x: W + 55, y: LAY.R } },   // out by the bus stop
    // inner: the family's patch, the middle. Everything else wanders south of the road.
    patch: [{ x0: W * 0.16, x1: W * 0.84, y0: TOP + 118, y1: H - 170 }], roam: [{ x0: 30, x1: W - 30, y0: LAY.R + 16, y1: H - 22 }],
    home: { x: W / 2, y: (TOP + H) / 2 } };
}

// Static village furniture, painted into the background once. R is the random source for
// the road grit and the plot's earth (Math.random for the real bake, prng for the night
// layer's cut-out); mask: true paints silhouettes only, no shading or shadows.
function paintProps(g, S, R, mask) {
  var L = S.lay, W = S.W, B = L.B, Rd = L.R, x, y, i;
  function rnd(a, b) { return a + R() * (b - a); }
  function roofTri(x0, x1, base, apex, col, rim) {
    rimmed(g, rim, col, 2, function (e) { g.beginPath(); g.moveTo(x0 - e, base + e); g.lineTo((x0 + x1) / 2, apex - e); g.lineTo(x1 + e, base + e); g.closePath(); g.fill(); });
    if (mask) return;
    var mx = (x0 + x1) / 2;                                                                   // lit from the left, shaded on the right
    g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(x0 + 1, base); g.lineTo(mx, apex + 2); g.lineTo(mx, base); g.closePath(); g.fill();
    g.fillStyle = "rgba(40,20,30,.1)"; g.beginPath(); g.moveTo(mx, apex + 2); g.lineTo(x1 - 1, base); g.lineTo(mx, base); g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 + 6, base - 3); g.lineTo(mx - 1, apex + 5); g.stroke();
  }
  function walls(x0, w, top, h, col, rim) { rimmed(g, rim, col, 2, function (e) { g.fillRect(x0 - e, top - e, w + 2 * e, h + 2 * e); });
    if (mask) return;
    var sg = g.createLinearGradient(x0 + w * 0.4, 0, x0 + w, 0); sg.addColorStop(0, "rgba(60,35,30,0)"); sg.addColorStop(1, "rgba(60,35,30,.13)");
    g.fillStyle = sg; g.fillRect(x0, top, w, h);
    var bg = g.createLinearGradient(0, top + h - 16, 0, top + h); bg.addColorStop(0, "rgba(60,35,30,0)"); bg.addColorStop(1, "rgba(60,35,30,.16)");
    g.fillStyle = bg; g.fillRect(x0, top + h - 16, w, 16); }
  function win(x0, y0, w, h) { g.fillStyle = "#FFE9A6"; rr(g, x0, y0, w, h, 4); g.fill();
    if (mask) return;
    g.fillStyle = "rgba(255,255,255,.45)"; rr(g, x0 + 2, y0 + 2, w * 0.45, h * 0.4, 3); g.fill();
    g.strokeStyle = "rgba(90,60,40,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x0 + w / 2, y0 + h); g.stroke();
    g.strokeStyle = "rgba(90,60,40,.35)"; g.lineWidth = 1.5; rr(g, x0, y0, w, h, 4); g.stroke(); }
  function door(x0, y0, w, h, col) { g.fillStyle = col || "#8A5A3C"; rr(g, x0, y0, w, h, Math.min(10, w / 2)); g.fill();
    if (mask) return;
    g.fillStyle = "rgba(0,0,0,.12)"; rr(g, x0 + 3, y0 + 3, w - 6, h - 3, Math.min(8, w / 2 - 3)); g.fill();
    g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x0 + w - 5, y0 + h / 2, 1.8, 0, 7); g.fill(); }
  function shadow(x, y, rx, ry, a) { if (!mask) aoShadow(g, x, y, rx, ry, a == null ? 0.22 : a); }

  // road and the two lanes down the sides
  if (!mask) { g.fillStyle = "rgba(120,100,60,.14)"; rr(g, -10, Rd - 10, W + 20, 28, 12); g.fill(); }        // the kerb's shade
  g.fillStyle = "rgba(233,217,168,.85)"; rr(g, -10, Rd - 12, W + 20, 26, 12); g.fill();
  rr(g, L.school.x + 92, Rd, 17, L.school.y + 22 - Rd, 8); g.fill();
  rr(g, Math.round(W * 0.855) - 8, Rd, 17, L.wash.y + 18 - Rd, 8); g.fill();
  if (!mask) { g.fillStyle = "rgba(255,255,255,.3)"; rr(g, -10, Rd - 12, W + 20, 4, 2); g.fill(); }        // the sunny top edge
  g.fillStyle = "rgba(170,150,110,.35)";
  for (i = 0; i < 70; i++) { g.beginPath(); g.arc(rnd(0, W), Rd + rnd(-9, 11), rnd(1, 2.2), 0, 7); g.fill(); }
  // the ground under every building, before the walls go up
  [[L.well.x, 34, 8], [L.pub.x, 82, 9], [L.bakery.x, 84, 9], [L.post.x, 60, 8], [L.market.x, 76, 8], [L.cottage.x, 60, 8], [L.mill.x, 42, 8]].forEach(function (b) { shadow(b[0], B + 1, b[1], b[2]); });
  shadow(L.school.x, L.school.y + 2, 100, 12);

  x = L.well.x; y = B;                                              // well
  g.fillStyle = "#8D6440"; g.fillRect(x - 20, y - 64, 4, 50); g.fillRect(x + 16, y - 64, 4, 50);
  roofTri(x - 30, x + 30, y - 60, y - 80, "#B5654A", "#7E4331");
  g.fillStyle = "#9A9AA3"; g.fillRect(x - 22, y - 24, 44, 24);
  g.fillStyle = "#B7B7BF"; for (i = 0; i < 4; i++) g.fillRect(x - 20 + i * 11, y - 20 + (i % 2) * 8, 9, 5);
  g.fillStyle = "#6F6F78"; g.beginPath(); g.ellipse(x, y - 24, 22, 7, 0, 0, 7); g.fill();
  g.fillStyle = "#3B4A5A"; g.beginPath(); g.ellipse(x, y - 24, 16, 4.5, 0, 0, 7); g.fill();
  if (!mask) { g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.ellipse(x - 4, y - 25, 7, 1.6, 0, 0, 7); g.fill(); }

  x = L.pub.x; y = B;                                               // the pub
  walls(x - 64, 128, y - 64, 64, "#F1E3C8", "#7A5238");
  g.fillStyle = "#7A5238"; [x - 64, x - 20, x + 20, x + 60].forEach(function (bx) { g.fillRect(bx, y - 64, 4, 64); });
  g.fillRect(x - 64, y - 36, 128, 4);
  roofTri(x - 76, x + 76, y - 62, y - 100, "#5E6E8C", "#3C4760");
  door(x - 42, y - 34, 24, 34, "#6B3F2A"); win(x - 4, y - 56, 20, 16); win(x + 30, y - 56, 20, 16);
  g.fillStyle = "#7A5238"; g.fillRect(x - 78, y - 58, 16, 3);
  g.fillStyle = "#FFF4E0"; rr(g, x - 84, y - 55, 20, 20, 5); g.fill();
  g.fillStyle = "#E8B33C"; g.fillRect(x - 79, y - 48, 9, 10); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x - 75, y - 49, 5, Math.PI, 0); g.fill();
  if (!mask) { ["#FF8FB1", "#FFD35C", "#FF8FB1"].forEach(function (c, n) { g.fillStyle = c; g.beginPath(); g.arc(x + 4 + n * 9, y - 38, 3, 0, 7); g.fill(); });   // a window box
    g.fillStyle = "#8A5A3C"; g.fillRect(x - 5, y - 37, 30, 3); }

  x = L.bakery.x; y = B;                                            // bakery
  g.fillStyle = "#A7584A"; g.fillRect(x + 30, y - 136, 16, 40);
  if (!mask) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x + 40, y - 136, 6, 40); g.fillStyle = "#8E4A3C"; g.fillRect(x + 28, y - 138, 20, 4); }
  walls(x - 62, 124, y - 78, 78, "#F4D3BE", "#B98569");
  rimmed(g, "#8E4A3C", "#D0705A", 2, function (e) { g.beginPath(); g.moveTo(x - 76 - e, y - 74 + e); g.lineTo(x, y - 130 - e); g.lineTo(x + 76 + e, y - 74 + e); g.closePath(); g.fill(); });
  if (!mask) { g.fillStyle = "rgba(40,20,30,.1)"; g.beginPath(); g.moveTo(x, y - 128); g.lineTo(x + 75, y - 74); g.lineTo(x, y - 74); g.closePath(); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 2;
  for (i = 1; i <= 3; i++) { var yy = y - 74 - i * 14, hw = 76 * (1 - i * 14 / 56); g.beginPath(); g.moveTo(x - hw, yy); g.lineTo(x + hw, yy); g.stroke(); }
  door(x - 44, y - 46, 26, 46);
  g.fillStyle = "#FFE9A6"; rr(g, x + 4, y - 56, 36, 28, 5); g.fill();
  if (!mask) { g.fillStyle = "rgba(255,255,255,.4)"; rr(g, x + 6, y - 54, 14, 10, 3); g.fill(); }
  g.strokeStyle = "#B98569"; g.beginPath(); g.moveTo(x + 22, y - 56); g.lineTo(x + 22, y - 28); g.moveTo(x + 4, y - 42); g.lineTo(x + 40, y - 42); g.stroke();
  g.fillStyle = "#9C6B43"; g.fillRect(x + 1, y - 28, 42, 7);
  ["#FF8FB1", "#FFFFFF", "#FF8FB1", "#FFD35C"].forEach(function (c, n) { g.fillStyle = c; g.beginPath(); g.arc(x + 7 + n * 10, y - 30, 3, 0, 7); g.fill(); });
  g.fillStyle = "#FFF4E0"; rr(g, x - 52, y - 68, 42, 16, 8); g.fill();
  g.fillStyle = "#D89A55"; g.beginPath(); g.ellipse(x - 31, y - 60, 10, 4.5, 0, 0, 7); g.fill();
  if (!mask) { g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(x - 34, y - 61.5, 4, 1.5, 0, 0, 7); g.fill(); }

  x = L.post.x; y = B;                                              // post office
  walls(x - 48, 96, y - 62, 62, "#E7766A", "#9E3F36");
  g.fillStyle = "#9E3F36"; g.fillRect(x - 54, y - 74, 108, 14);
  if (!mask) { g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x - 54, y - 74, 108, 3); }
  g.fillStyle = "#FFF4E0"; rr(g, x - 16, y - 72, 32, 11, 3); g.fill();
  g.strokeStyle = "#9E3F36"; g.lineWidth = 1.4; g.strokeRect(x - 8, y - 70.5, 16, 8);
  g.beginPath(); g.moveTo(x - 8, y - 70.5); g.lineTo(x, y - 65.5); g.lineTo(x + 8, y - 70.5); g.stroke();
  door(x - 30, y - 38, 24, 38, "#5E3A2A"); win(x + 4, y - 50, 30, 20);
  rimmed(g, "#7E2A24", "#D9433A", 2, function (e) { rr(g, x + 50 - e, y - 30 - e, 14 + 2 * e, 30 + 2 * e, 6); g.fill(); });
  g.fillStyle = "#3B2A26"; g.fillRect(x + 53, y - 22, 8, 2);
  if (!mask) { g.fillStyle = "rgba(255,255,255,.3)"; rr(g, x + 52, y - 28, 4, 8, 2); g.fill(); }

  x = L.market.x; y = B;                                            // market stall: posts and awning
  g.fillStyle = "#A87A50"; g.fillRect(x - 62, y - 84, 6, 84); g.fillRect(x + 56, y - 84, 6, 84);
  g.fillStyle = "#C24E42"; g.fillRect(x - 74, y - 103, 148, 6);
  for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#FFF4E8" : "#E86A5B"; g.fillRect(x - 72 + i * 18, y - 98, 18, 20);
    g.beginPath(); g.arc(x - 63 + i * 18, y - 78, 9, 0, Math.PI); g.fill(); }
  if (!mask) { var ag = g.createLinearGradient(0, y - 98, 0, y - 69); ag.addColorStop(0, "rgba(255,255,255,.18)"); ag.addColorStop(1, "rgba(60,20,20,.12)");
    g.fillStyle = ag; g.fillRect(x - 72, y - 98, 144, 20); for (i = 0; i < 8; i++) { g.beginPath(); g.arc(x - 63 + i * 18, y - 78, 9, 0, Math.PI); g.fill(); } }

  x = L.bus.x; y = L.bus.y;                                         // bus stop roundel
  g.fillStyle = "#6E6E78"; g.fillRect(x - 2, y - 52, 4, 52);
  g.fillStyle = "#D9433A"; g.beginPath(); g.arc(x, y - 58, 11, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y - 58, 6.5, 0, 7); g.fill();
  g.fillStyle = "#3B5FA8"; g.fillRect(x - 13, y - 61, 26, 6);

  x = L.cottage.x; y = B;                                           // cottage
  g.fillStyle = "#8C6E62"; g.fillRect(x + 18, y - 104, 12, 26);
  walls(x - 44, 88, y - 56, 56, "#CFE3F2", "#6D8FB5");
  roofTri(x - 54, x + 54, y - 54, y - 98, "#6D8FB5", "#48648A");
  door(x - 26, y - 36, 22, 36, "#B5654A"); win(x + 6, y - 44, 26, 20);
  ["#FF8FB1", "#FFD35C", "#FFFFFF"].forEach(function (c, n) { g.fillStyle = c; g.beginPath(); g.arc(x + 11 + n * 8, y - 22, 3, 0, 7); g.fill(); });
  if (!mask) { g.strokeStyle = "#5E9A62"; g.lineWidth = 2; g.lineCap = "round";                  // a climbing rose up the wall
    g.beginPath(); g.moveTo(x - 40, y - 2); g.quadraticCurveTo(x - 46, y - 30, x - 36, y - 50); g.stroke();
    [[x - 43, y - 14], [x - 44, y - 30], [x - 38, y - 44]].forEach(function (p) { g.fillStyle = "#FF8FB1"; g.beginPath(); g.arc(p[0], p[1], 3, 0, 7); g.fill(); }); }

  x = L.mill.x; y = B;                                              // windmill tower (the sails turn, so they are drawn live)
  rimmed(g, "#B3A48C", "#F2E8D8", 2, function (e) { g.beginPath(); g.moveTo(x - 34 - e, y + e); g.lineTo(x - 21 - e, y - 120 - e);
    g.lineTo(x + 21 + e, y - 120 - e); g.lineTo(x + 34 + e, y + e); g.closePath(); g.fill(); });
  if (!mask) { var mg = g.createLinearGradient(x - 20, 0, x + 34, 0); mg.addColorStop(0, "rgba(255,255,255,.2)"); mg.addColorStop(0.5, "rgba(120,100,80,0)"); mg.addColorStop(1, "rgba(120,100,80,.2)");
    g.fillStyle = mg; g.beginPath(); g.moveTo(x - 34, y); g.lineTo(x - 21, y - 120); g.lineTo(x + 21, y - 120); g.lineTo(x + 34, y); g.closePath(); g.fill();
    g.strokeStyle = "rgba(120,100,80,.18)"; g.lineWidth = 1.5; for (i = 1; i < 4; i++) { var ky = y - i * 30, kw = 34 - 13 * i * 30 / 120; g.beginPath(); g.moveTo(x - kw, ky); g.lineTo(x + kw, ky); g.stroke(); } }
  rimmed(g, "#7E4331", "#B5654A", 2, function (e) { g.beginPath(); g.arc(x, y - 118, 24 + e, Math.PI, 0); g.fill(); });
  if (!mask) { g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.arc(x - 6, y - 118, 18, Math.PI * 1.05, Math.PI * 1.6); g.lineTo(x - 6, y - 118); g.fill(); }
  door(x - 10, y - 32, 20, 32, "#8A5A3C"); win(x - 8, y - 84, 16, 18);

  x = L.school.x; y = L.school.y;                                   // school
  g.fillStyle = "rgba(217,207,165,.55)"; g.beginPath(); g.ellipse(x + 12, y + 50, 96, 34, 0, 0, 7); g.fill();
  walls(x - 74, 148, y - 68, 68, "#F6E7B8", "#C2A25E");
  roofTri(x - 86, x + 86, y - 66, y - 108, "#C9594A", "#8E3B34");
  g.fillStyle = "#F6E7B8"; g.fillRect(x - 11, y - 126, 22, 22); g.fillStyle = "#8E3B34";
  g.beginPath(); g.moveTo(x - 15, y - 124); g.lineTo(x, y - 138); g.lineTo(x + 15, y - 124); g.closePath(); g.fill();
  if (!mask) { g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x, y - 114, 3.5, 0, 7); g.fill(); g.fillStyle = "#8A5A3C"; g.fillRect(x - 1, y - 118, 2, 6); }   // the bell
  door(x - 12, y - 38, 24, 38, "#4E7CA8"); win(x - 58, y - 52, 28, 20); win(x + 30, y - 52, 28, 20);
  g.fillStyle = "#FFFFFF"; rr(g, x - 24, y - 62, 48, 14, 5); g.fill();
  if (!mask) { g.font = "600 10px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle";
    [["A", "#E86A5B"], ["B", "#3B5FA8"], ["C", "#4E9A5A"]].forEach(function (c, n) { g.fillStyle = c[1]; g.fillText(c[0], x - 12 + n * 12, y - 54.5); });
    g.fillStyle = "rgba(255,255,255,.4)"; for (i = 0; i < 6; i++) { g.beginPath(); g.arc(x + 12 + Math.cos(i * 1.05) * 60, y + 50 + Math.sin(i * 1.05) * 20, 2, 0, 7); g.fill(); }   // hopscotch chalk
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.5; g.strokeRect(x - 62, y + 42, 10, 9); g.strokeRect(x - 62, y + 33, 10, 9); g.strokeRect(x - 67, y + 24, 10, 9); g.strokeRect(x - 57, y + 24, 10, 9); }   // hopscotch chalk

  x = L.swing.x; y = L.swing.y;                                     // swing frame
  g.fillStyle = "rgba(140,110,70,.25)"; g.beginPath(); g.ellipse(x, y - 2, 30, 7, 0, 0, 7); g.fill();
  shadow(x, y, 58, 7, 0.16);
  g.strokeStyle = "#A87A50"; g.lineWidth = 6; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - 52, y); g.lineTo(x - 40, y - 100); g.lineTo(x - 28, y); g.moveTo(x + 28, y); g.lineTo(x + 40, y - 100); g.lineTo(x + 52, y); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(x - 46, y - 100); g.lineTo(x + 46, y - 100); g.stroke();
  if (!mask) { g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 44, y - 102); g.lineTo(x + 44, y - 102); g.stroke(); }

  x = L.wood.x; y = L.wood.y;                                       // chopping stump
  shadow(x, y + 1, 30, 7, 0.2);
  g.fillStyle = "#9C6B43"; g.fillRect(x - 20, y - 16, 40, 16);
  if (!mask) { g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x + 8, y - 16, 12, 16); }
  g.fillStyle = "#E2C08E"; g.beginPath(); g.ellipse(x, y - 16, 20, 7, 0, 0, 7); g.fill();
  g.strokeStyle = "#B8905E"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - 16, 12, 4, 0, 0, 7); g.stroke();
  if (!mask) { g.beginPath(); g.ellipse(x, y - 16, 5, 1.8, 0, 0, 7); g.stroke(); }

  x = L.wash.x; y = L.wash.y;                                       // washing line poles
  g.fillStyle = "#A87A50"; g.fillRect(x - 66, y - 70, 5, 70); g.fillRect(x + 62, y - 70, 5, 70);
  shadow(x - 63, y + 1, 10, 3, 0.2); shadow(x + 65, y + 1, 10, 3, 0.2);

  x = L.garden.x; y = L.garden.y;                                   // vegetable patch
  shadow(x, y + 16, 110, 12, 0.2);
  g.fillStyle = "#F2E6D0"; g.fillRect(x - 94, y - 42, 188, 4);
  for (i = x - 92; i <= x + 92; i += 23) g.fillRect(i - 2, y - 50, 5, 20);
  rimmed(g, "#7E5536", "#A9794F", 2, function (e) { rr(g, x - 90 - e, y - 30 - e, 180 + 2 * e, 50 + 2 * e, 14); g.fill(); });
  if (!mask) { var eg = g.createLinearGradient(0, y - 30, 0, y + 20); eg.addColorStop(0, "rgba(255,255,255,.1)"); eg.addColorStop(1, "rgba(60,30,10,.14)");
    g.fillStyle = eg; rr(g, x - 90, y - 30, 180, 50, 14); g.fill(); }
  g.strokeStyle = "rgba(80,50,30,.35)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x - 78, y - 14); g.lineTo(x + 78, y - 14); g.moveTo(x - 78, y + 4); g.lineTo(x + 78, y + 4); g.stroke();

  x = L.band.x; y = L.band.y;                                       // bandstand
  shadow(x, y + 4, 92, 16, 0.22);
  rimmed(g, "#8D6440", "#C69C6D", 2, function (e) { g.beginPath(); g.ellipse(x, y - 4, 76 + e, 18 + e, 0, 0, 7); g.fill(); });
  g.fillStyle = "#A87A50"; g.fillRect(x - 76, y - 4, 152, 10);
  if (!mask) { g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(x - 76, y + 2, 152, 4); g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.ellipse(x - 10, y - 7, 44, 8, 0, 0, 7); g.fill(); }
  g.fillStyle = "#FFFFFF"; [-66, -24, 24, 66].forEach(function (o) { g.fillRect(x + o - 2, y - 90, 4, 84); });
  if (!mask) { g.fillStyle = "rgba(0,0,0,.08)"; [-66, -24, 24, 66].forEach(function (o) { g.fillRect(x + o, y - 90, 2, 84); }); }
  for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#FFF4E8" : "#D9534F";
    g.beginPath(); g.moveTo(x, y - 132); g.lineTo(x - 82 + i * 20.5, y - 88); g.lineTo(x - 82 + (i + 1) * 20.5, y - 88); g.closePath(); g.fill(); }
  if (!mask) { g.fillStyle = "rgba(40,20,30,.1)"; g.beginPath(); g.moveTo(x, y - 132); g.lineTo(x + 82, y - 88); g.lineTo(x, y - 88); g.closePath(); g.fill();
    g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(x - 82, y - 89, 164, 3); }
  g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x, y - 134, 4, 0, 7); g.fill();

  x = L.pitch.x; y = L.pitch.y;                                     // pitch
  g.fillStyle = "#AEDDA3"; rr(g, x - 112, y - 34, 224, 68, 12); g.fill();
  if (!mask) { g.fillStyle = "rgba(255,255,255,.09)"; for (i = 0; i < 7; i += 2) { g.fillRect(x - 112 + i * 32, y - 30, 32, 60); } }   // mown stripes
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2;
  rr(g, x - 104, y - 28, 208, 56, 8); g.stroke();
  g.beginPath(); g.moveTo(x, y - 28); g.lineTo(x, y + 28); g.stroke();
  g.beginPath(); g.ellipse(x, y, 16, 10, 0, 0, 7); g.stroke();
  g.lineWidth = 3; [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(x + s * 104, y - 14); g.lineTo(x + s * 112, y - 14);
    g.lineTo(x + s * 112, y + 14); g.lineTo(x + s * 104, y + 14); g.stroke(); });

  x = L.shop.x; y = L.shop.y;                                       // the workshop plot: bare earth and a few fence posts
  shadow(x, y - 16, 66, 32, 0.12);
  g.fillStyle = "rgba(196,166,118,.55)"; rr(g, x - 58, y - 46, 116, 56, 14); g.fill();
  g.fillStyle = "rgba(150,120,80,.35)"; for (i = 0; i < 14; i++) { g.beginPath(); g.arc(x + rnd(-50, 50), y + rnd(-38, 4), rnd(1.5, 3), 0, 7); g.fill(); }
  g.fillStyle = "#A87A50"; [-62, -44, 46, 64].forEach(function (o) { g.fillRect(x + o - 2, y - 22, 4, 20); });
  g.fillRect(x - 62, y - 14, 20, 2.5); g.fillRect(x + 44, y - 14, 20, 2.5);
}
