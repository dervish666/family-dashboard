// The meadow: the first scene, and the only one with the village. A high street along
// the back, the school down the left, the woodcutter down the right, the bandstand,
// garden, pitch and pond along the bottom, the family's patch in the middle.
// village: true hands the engine's village to it (walkers, queues, the school, the
// workshop, the bandstand show, the house party at the cottage, the postie); grazers:
// true brings the puffs, the wild foxes, the berries and the fireflies.
import { rand, pick, rr, rimmed } from "../engine/draw.js";

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
  }
};

// Painted once per size. S.place() takes the layout half way, once the pond is known,
// so the tufts and flowers can stay off every zone.
function bake(g, S) {
  var W = S.W, H = S.H, HZ = S.HZ, i;
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#BFE4F0"); sky.addColorStop(1, "#E9F7EC");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 20);
  function hills(y, amp, col, seed) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (var x = 0; x <= W; x += 16) g.lineTo(x, y - amp * (0.6 * Math.sin(x / 210 + seed) + 0.4 * Math.sin(x / 97 + seed * 2.3)));
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  hills(HZ - 18, 22, "#B7DFB4", 1.2);
  hills(HZ + 2, 14, "#9ED39E", 4.1);
  var gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, "#98D194"); gr.addColorStop(1, "#7EC47E");
  g.fillStyle = gr; g.fillRect(0, HZ + 8, W, H);
  hills(HZ + 12, 6, "#98D194", 2.7);
  // bushes on the horizon, behind anything that can walk
  for (i = 0; i < 9; i++) {
    var bx = rand(0, W), by = HZ + rand(4, 16), br = rand(18, 34);
    if (bx < 520 && by < HZ + 20 && i % 2) continue;
    [[0, 0, 1], [-0.7, 0.25, 0.7], [0.7, 0.25, 0.75]].forEach(function (p) {
      g.fillStyle = "#6FB673"; g.beginPath(); g.arc(bx + p[0] * br, by + p[1] * br, br * p[2], 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.35, br * 0.35, 0, 7); g.fill();
  }
  // soft mottles so the grass is not a flat fill
  for (i = 0; i < 90; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(40,110,50,.06)";
    g.beginPath(); g.ellipse(rand(0, W), rand(HZ + 20, H), rand(30, 110), rand(10, 30), 0, 0, 7); g.fill();
  }
  // pond, half off the bottom-right edge
  var POND = { x: W * 0.83, y: H * 0.93, rx: Math.min(210, W * 0.17), ry: 74 };
  g.fillStyle = "#6DB57A"; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx + 10, POND.ry + 8, 0, 0, 7); g.fill();
  var pg = g.createLinearGradient(0, POND.y - POND.ry, 0, POND.y + POND.ry);
  pg.addColorStop(0, "#9ED8E6"); pg.addColorStop(1, "#6FBBD3");
  g.fillStyle = pg; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.ellipse(POND.x - 30, POND.y - 22, 60, 14, 0, 3.6, 5.2); g.stroke();
  g.fillStyle = "#5FAE69"; g.beginPath(); g.ellipse(POND.x + 70, POND.y - 12, 26, 12, 0.3, 0.5, 6.0); g.fill();   // lily pad
  g.fillStyle = "#FFB3C7"; g.beginPath(); g.arc(POND.x + 74, POND.y - 16, 6, 0, 7); g.fill();
  S.place(layout(S, POND));
  // tufts and flowers
  for (i = 0; i < 160; i++) {
    var x = rand(0, W), y = rand(HZ + 26, H);
    if (S.inZone(x, y, 16)) continue;
    g.strokeStyle = "rgba(52,120,60,.45)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 4, y - 7); g.lineTo(x, y); g.lineTo(x + 1, y - 9); g.moveTo(x, y); g.lineTo(x + 5, y - 6); g.stroke();
  }
  for (i = 0; i < 70; i++) {
    var fx = rand(0, W), fy = rand(HZ + 30, H), fc = pick(["#FFFFFF", "#FFF3A8", "#FFC4D6", "#E4D2FF"]);
    if (S.inZone(fx, fy, 14)) continue;
    g.fillStyle = fc; for (var p = 0; p < 5; p++) { var a = p / 5 * 6.283;
      g.beginPath(); g.arc(fx + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 2.6, 0, 7); g.fill(); }
    g.fillStyle = "#F4B63C"; g.beginPath(); g.arc(fx, fy, 1.8, 0, 7); g.fill();
  }
  paintProps(g, S);
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

// Static village furniture, painted into the background once.
function paintProps(g, S) {
  var L = S.lay, W = S.W, B = L.B, R = L.R, x, y, i;
  function roofTri(x0, x1, base, apex, col, rim) {
    rimmed(g, rim, col, 2, function (e) { g.beginPath(); g.moveTo(x0 - e, base + e); g.lineTo((x0 + x1) / 2, apex - e); g.lineTo(x1 + e, base + e); g.closePath(); g.fill(); });
  }
  function walls(x0, w, top, h, col, rim) { rimmed(g, rim, col, 2, function (e) { g.fillRect(x0 - e, top - e, w + 2 * e, h + 2 * e); }); }
  function win(x0, y0, w, h) { g.fillStyle = "#FFE9A6"; rr(g, x0, y0, w, h, 4); g.fill();
    g.strokeStyle = "rgba(90,60,40,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x0 + w / 2, y0 + h); g.stroke(); }
  function door(x0, y0, w, h, col) { g.fillStyle = col || "#8A5A3C"; rr(g, x0, y0, w, h, Math.min(10, w / 2)); g.fill();
    g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x0 + w - 5, y0 + h / 2, 1.8, 0, 7); g.fill(); }

  // road and the two lanes down the sides
  g.fillStyle = "rgba(233,217,168,.85)"; rr(g, -10, R - 12, W + 20, 26, 12); g.fill();
  rr(g, L.school.x + 92, R, 17, L.school.y + 22 - R, 8); g.fill();
  rr(g, Math.round(W * 0.855) - 8, R, 17, L.wash.y + 18 - R, 8); g.fill();
  g.fillStyle = "rgba(170,150,110,.35)";
  for (i = 0; i < 70; i++) { g.beginPath(); g.arc(rand(0, W), R + rand(-9, 11), rand(1, 2.2), 0, 7); g.fill(); }

  x = L.well.x; y = B;                                              // well
  g.fillStyle = "#8D6440"; g.fillRect(x - 20, y - 64, 4, 50); g.fillRect(x + 16, y - 64, 4, 50);
  roofTri(x - 30, x + 30, y - 60, y - 80, "#B5654A", "#7E4331");
  g.fillStyle = "#9A9AA3"; g.fillRect(x - 22, y - 24, 44, 24);
  g.fillStyle = "#B7B7BF"; for (i = 0; i < 4; i++) g.fillRect(x - 20 + i * 11, y - 20 + (i % 2) * 8, 9, 5);
  g.fillStyle = "#6F6F78"; g.beginPath(); g.ellipse(x, y - 24, 22, 7, 0, 0, 7); g.fill();
  g.fillStyle = "#3B4A5A"; g.beginPath(); g.ellipse(x, y - 24, 16, 4.5, 0, 0, 7); g.fill();

  x = L.pub.x; y = B;                                               // the pub
  walls(x - 64, 128, y - 64, 64, "#F1E3C8", "#7A5238");
  g.fillStyle = "#7A5238"; [x - 64, x - 20, x + 20, x + 60].forEach(function (bx) { g.fillRect(bx, y - 64, 4, 64); });
  g.fillRect(x - 64, y - 36, 128, 4);
  roofTri(x - 76, x + 76, y - 62, y - 100, "#5E6E8C", "#3C4760");
  door(x - 42, y - 34, 24, 34, "#6B3F2A"); win(x - 4, y - 56, 20, 16); win(x + 30, y - 56, 20, 16);
  g.fillStyle = "#7A5238"; g.fillRect(x - 78, y - 58, 16, 3);
  g.fillStyle = "#FFF4E0"; rr(g, x - 84, y - 55, 20, 20, 5); g.fill();
  g.fillStyle = "#E8B33C"; g.fillRect(x - 79, y - 48, 9, 10); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x - 75, y - 49, 5, Math.PI, 0); g.fill();

  x = L.bakery.x; y = B;                                            // bakery
  g.fillStyle = "#A7584A"; g.fillRect(x + 30, y - 136, 16, 40);
  walls(x - 62, 124, y - 78, 78, "#F4D3BE", "#B98569");
  rimmed(g, "#8E4A3C", "#D0705A", 2, function (e) { g.beginPath(); g.moveTo(x - 76 - e, y - 74 + e); g.lineTo(x, y - 130 - e); g.lineTo(x + 76 + e, y - 74 + e); g.closePath(); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 2;
  for (i = 1; i <= 3; i++) { var yy = y - 74 - i * 14, hw = 76 * (1 - i * 14 / 56); g.beginPath(); g.moveTo(x - hw, yy); g.lineTo(x + hw, yy); g.stroke(); }
  door(x - 44, y - 46, 26, 46);
  g.fillStyle = "#FFE9A6"; rr(g, x + 4, y - 56, 36, 28, 5); g.fill();
  g.strokeStyle = "#B98569"; g.beginPath(); g.moveTo(x + 22, y - 56); g.lineTo(x + 22, y - 28); g.moveTo(x + 4, y - 42); g.lineTo(x + 40, y - 42); g.stroke();
  g.fillStyle = "#9C6B43"; g.fillRect(x + 1, y - 28, 42, 7);
  ["#FF8FB1", "#FFFFFF", "#FF8FB1", "#FFD35C"].forEach(function (c, n) { g.fillStyle = c; g.beginPath(); g.arc(x + 7 + n * 10, y - 30, 3, 0, 7); g.fill(); });
  g.fillStyle = "#FFF4E0"; rr(g, x - 52, y - 68, 42, 16, 8); g.fill();
  g.fillStyle = "#D89A55"; g.beginPath(); g.ellipse(x - 31, y - 60, 10, 4.5, 0, 0, 7); g.fill();

  x = L.post.x; y = B;                                              // post office
  walls(x - 48, 96, y - 62, 62, "#E7766A", "#9E3F36");
  g.fillStyle = "#9E3F36"; g.fillRect(x - 54, y - 74, 108, 14);
  g.fillStyle = "#FFF4E0"; rr(g, x - 16, y - 72, 32, 11, 3); g.fill();
  g.strokeStyle = "#9E3F36"; g.lineWidth = 1.4; g.strokeRect(x - 8, y - 70.5, 16, 8);
  g.beginPath(); g.moveTo(x - 8, y - 70.5); g.lineTo(x, y - 65.5); g.lineTo(x + 8, y - 70.5); g.stroke();
  door(x - 30, y - 38, 24, 38, "#5E3A2A"); win(x + 4, y - 50, 30, 20);
  rimmed(g, "#7E2A24", "#D9433A", 2, function (e) { rr(g, x + 50 - e, y - 30 - e, 14 + 2 * e, 30 + 2 * e, 6); g.fill(); });
  g.fillStyle = "#3B2A26"; g.fillRect(x + 53, y - 22, 8, 2);

  x = L.market.x; y = B;                                            // market stall: posts and awning
  g.fillStyle = "#A87A50"; g.fillRect(x - 62, y - 84, 6, 84); g.fillRect(x + 56, y - 84, 6, 84);
  g.fillStyle = "#C24E42"; g.fillRect(x - 74, y - 103, 148, 6);
  for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#FFF4E8" : "#E86A5B"; g.fillRect(x - 72 + i * 18, y - 98, 18, 20);
    g.beginPath(); g.arc(x - 63 + i * 18, y - 78, 9, 0, Math.PI); g.fill(); }

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

  x = L.mill.x; y = B;                                              // windmill tower (the sails turn, so they are drawn live)
  rimmed(g, "#B3A48C", "#F2E8D8", 2, function (e) { g.beginPath(); g.moveTo(x - 34 - e, y + e); g.lineTo(x - 21 - e, y - 120 - e);
    g.lineTo(x + 21 + e, y - 120 - e); g.lineTo(x + 34 + e, y + e); g.closePath(); g.fill(); });
  rimmed(g, "#7E4331", "#B5654A", 2, function (e) { g.beginPath(); g.arc(x, y - 118, 24 + e, Math.PI, 0); g.fill(); });
  door(x - 10, y - 32, 20, 32, "#8A5A3C"); win(x - 8, y - 84, 16, 18);

  x = L.school.x; y = L.school.y;                                   // school
  walls(x - 74, 148, y - 68, 68, "#F6E7B8", "#C2A25E");
  roofTri(x - 86, x + 86, y - 66, y - 108, "#C9594A", "#8E3B34");
  g.fillStyle = "#F6E7B8"; g.fillRect(x - 11, y - 126, 22, 22); g.fillStyle = "#8E3B34";
  g.beginPath(); g.moveTo(x - 15, y - 124); g.lineTo(x, y - 138); g.lineTo(x + 15, y - 124); g.closePath(); g.fill();
  door(x - 12, y - 38, 24, 38, "#4E7CA8"); win(x - 58, y - 52, 28, 20); win(x + 30, y - 52, 28, 20);
  g.fillStyle = "#FFFFFF"; rr(g, x - 24, y - 62, 48, 14, 5); g.fill();
  g.font = "600 10px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle";
  [["A", "#E86A5B"], ["B", "#3B5FA8"], ["C", "#4E9A5A"]].forEach(function (c, n) { g.fillStyle = c[1]; g.fillText(c[0], x - 12 + n * 12, y - 54.5); });
  g.fillStyle = "rgba(217,207,165,.55)"; g.beginPath(); g.ellipse(x + 12, y + 50, 96, 34, 0, 0, 7); g.fill();

  x = L.swing.x; y = L.swing.y;                                     // swing frame
  g.fillStyle = "rgba(140,110,70,.25)"; g.beginPath(); g.ellipse(x, y - 2, 30, 7, 0, 0, 7); g.fill();
  g.strokeStyle = "#A87A50"; g.lineWidth = 6; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - 52, y); g.lineTo(x - 40, y - 100); g.lineTo(x - 28, y); g.moveTo(x + 28, y); g.lineTo(x + 40, y - 100); g.lineTo(x + 52, y); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(x - 46, y - 100); g.lineTo(x + 46, y - 100); g.stroke();

  x = L.wood.x; y = L.wood.y;                                       // chopping stump
  g.fillStyle = "#9C6B43"; g.fillRect(x - 20, y - 16, 40, 16);
  g.fillStyle = "#E2C08E"; g.beginPath(); g.ellipse(x, y - 16, 20, 7, 0, 0, 7); g.fill();
  g.strokeStyle = "#B8905E"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - 16, 12, 4, 0, 0, 7); g.stroke();

  x = L.wash.x; y = L.wash.y;                                       // washing line poles
  g.fillStyle = "#A87A50"; g.fillRect(x - 66, y - 70, 5, 70); g.fillRect(x + 62, y - 70, 5, 70);

  x = L.garden.x; y = L.garden.y;                                   // vegetable patch
  g.fillStyle = "#F2E6D0"; g.fillRect(x - 94, y - 42, 188, 4);
  for (i = x - 92; i <= x + 92; i += 23) g.fillRect(i - 2, y - 50, 5, 20);
  rimmed(g, "#7E5536", "#A9794F", 2, function (e) { rr(g, x - 90 - e, y - 30 - e, 180 + 2 * e, 50 + 2 * e, 14); g.fill(); });
  g.strokeStyle = "rgba(80,50,30,.35)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x - 78, y - 14); g.lineTo(x + 78, y - 14); g.moveTo(x - 78, y + 4); g.lineTo(x + 78, y + 4); g.stroke();

  x = L.band.x; y = L.band.y;                                       // bandstand
  rimmed(g, "#8D6440", "#C69C6D", 2, function (e) { g.beginPath(); g.ellipse(x, y - 4, 76 + e, 18 + e, 0, 0, 7); g.fill(); });
  g.fillStyle = "#A87A50"; g.fillRect(x - 76, y - 4, 152, 10);
  g.fillStyle = "#FFFFFF"; [-66, -24, 24, 66].forEach(function (o) { g.fillRect(x + o - 2, y - 90, 4, 84); });
  for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#FFF4E8" : "#D9534F";
    g.beginPath(); g.moveTo(x, y - 132); g.lineTo(x - 82 + i * 20.5, y - 88); g.lineTo(x - 82 + (i + 1) * 20.5, y - 88); g.closePath(); g.fill(); }
  g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x, y - 134, 4, 0, 7); g.fill();

  x = L.pitch.x; y = L.pitch.y;                                     // pitch
  g.fillStyle = "#AEDDA3"; rr(g, x - 112, y - 34, 224, 68, 12); g.fill();
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2;
  rr(g, x - 104, y - 28, 208, 56, 8); g.stroke();
  g.beginPath(); g.moveTo(x, y - 28); g.lineTo(x, y + 28); g.stroke();
  g.beginPath(); g.ellipse(x, y, 16, 10, 0, 0, 7); g.stroke();
  g.lineWidth = 3; [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(x + s * 104, y - 14); g.lineTo(x + s * 112, y - 14);
    g.lineTo(x + s * 112, y + 14); g.lineTo(x + s * 104, y + 14); g.stroke(); });

  x = L.shop.x; y = L.shop.y;                                       // the workshop plot: bare earth and a few fence posts
  g.fillStyle = "rgba(196,166,118,.55)"; rr(g, x - 58, y - 46, 116, 56, 14); g.fill();
  g.fillStyle = "rgba(150,120,80,.35)"; for (i = 0; i < 14; i++) { g.beginPath(); g.arc(x + rand(-50, 50), y + rand(-38, 4), rand(1.5, 3), 0, 7); g.fill(); }
  g.fillStyle = "#A87A50"; [-62, -44, 46, 64].forEach(function (o) { g.fillRect(x + o - 2, y - 22, 4, 20); });
  g.fillRect(x - 62, y - 14, 20, 2.5); g.fillRect(x + 44, y - 14, 20, 2.5);
}

