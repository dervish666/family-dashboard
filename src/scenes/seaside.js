// The seaside: a beach under a wide sky, a pier walking out to sea on the right with a
// kiosk at its end, rock pools on the left, a lighthouse on the far headland. The tide
// comes and goes with the clock, waves run up the sand, gulls wheel about and land on
// the beach, and a crab potters along the tideline. The family lives on the sand, out on
// the pier and on the rocks round the pools; the swimmers dive into the big pool.
// No village here: away duties leave along the beach to the right, and letters arrive by air.
//
// Everything is a fraction of the card, so it survives another resolution. Day and night
// come from the engine's darkness; this scene only adds its own lights over the dusk.
import { rand, pick, rr, rimmed, canvas, shade, mix, K } from "../engine/draw.js";

// ── Geometry, worked out once per size in layout() ─────────────────────────────
var G = null;

// The waterline at rest, before tide and waves.
function shore(x) { return G.shoreY + 9 * Math.sin(x / 170 + 0.6) + 5 * Math.sin(x / 73 + 1.3); }
// The pier deck's left and right edge at a depth y (a trapezoid narrowing out to sea).
function pierSpan(y) {
  var P = G.pier, k = (y - P.y0) / (P.y1 - P.y0), cx = P.cx0 + (P.cx1 - P.cx0) * k, hw = P.hw0 + (P.hw1 - P.hw0) * k;
  return [cx - hw, cx + hw];
}
function onPier(x, y, m) {
  var P = G.pier; m = m || 0;
  if (y < P.y0 + m * 0.4 || y > P.y1 + 4) return false;
  var s = pierSpan(y); return x > s[0] + m && x < s[1] - m;
}

function layout(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP;
  var shoreY = Math.round(H * 0.585);
  G = { W: W, H: H, HZ: HZ, TOP: TOP, shoreY: shoreY };
  var y1 = Math.round(shore(W * 0.79) + 26);
  G.pier = { y0: TOP + 34, y1: y1, cx0: W * 0.752, cx1: W * 0.79, hw0: 54, hw1: 94 };
  G.pool = { x: W * 0.17, y: H * 0.8, rx: Math.min(118, W * 0.092), ry: 32 };
  G.pool2 = { x: W * 0.305, y: H * 0.905, rx: 58, ry: 16 };
  G.rocks = [[0.045, 0.705, 52, 30], [0.31, 0.725, 46, 26], [0.075, 0.95, 58, 30], [0.425, 0.975, 40, 20], [0.235, 0.69, 30, 18]]
    .map(function (b) { return { x: W * b[0], y: H * b[1], rx: b[2], ry: b[3] }; });
  G.parasol = { x: W * 0.505, y: H * 0.875 };
  G.castle = { x: W * 0.64, y: H * 0.94 };
  G.lighthouse = { x: W * 0.925, y: HZ - 30 };
  var P = G.pier, zones = [G.pool, G.pool2].map(function (p) { return { x: p.x, y: p.y, rx: p.rx, ry: p.ry }; })
    .concat(G.rocks, [{ x: G.parasol.x, y: G.parasol.y - 4, rx: 62, ry: 24 }, { x: G.castle.x, y: G.castle.y - 6, rx: 34, ry: 16 }]);
  var beach = { x0: W * 0.36, x1: W * 0.7, y0: shoreY + 54, y1: H - 50, w: 3 };
  var deck = { w: 2, has: function (x, y) { return onPier(x, y, 22); },
    pick: function () { var y = rand(P.y0 + 12, P.y1 - 8), s = pierSpan(y); return { x: rand(s[0] + 26, s[1] - 26), y: y }; } };
  var rocks = { x0: W * 0.04, x1: W * 0.36, y0: H * 0.66, y1: H - 24, w: 1.2 };
  return {
    lay: { pier: P, pool: G.pool }, zones: zones, water: G.pool,
    patch: [beach, deck, rocks],
    roam: [{ x0: W * 0.36, x1: W - 30, y0: shoreY + 40, y1: H - 22 }, rocks],
    home: { x: W * 0.52, y: H * 0.76 },
    exit: { x: W - 46, y: H - 86, off: { x: W + 55, y: H - 86 } }                 // along the beach to the right
  };
}

// ── The background, baked once per size ───────────────────────────────────────
function bake(g, S) {
  var L = layout(S), W = S.W, H = S.H, HZ = S.HZ, i, x, y;
  S.place(L);
  // sky
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#BCE2F2"); sky.addColorStop(1, "#EEF7F1");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 2);
  // a faint far island, and the headland with its lighthouse on the right
  g.fillStyle = "rgba(122,170,178,.45)"; g.beginPath(); g.moveTo(W * 0.38, HZ);
  g.quadraticCurveTo(W * 0.43, HZ - 16, W * 0.47, HZ - 9); g.quadraticCurveTo(W * 0.5, HZ - 13, W * 0.53, HZ); g.closePath(); g.fill();
  var lh = G.lighthouse;
  g.fillStyle = "#9CC39A"; g.beginPath(); g.moveTo(W * 0.8, HZ + 1);
  g.quadraticCurveTo(W * 0.86, HZ - 30, lh.x - 30, HZ - 30); g.lineTo(W + 10, HZ - 38); g.lineTo(W + 10, HZ + 1); g.closePath(); g.fill();
  g.fillStyle = "#86B487"; g.beginPath(); g.moveTo(W * 0.84, HZ + 1); g.quadraticCurveTo(W * 0.9, HZ - 18, W + 10, HZ - 22); g.lineTo(W + 10, HZ + 1); g.closePath(); g.fill();
  lighthouse(g, lh.x, lh.y);
  // the sea, horizon to shore
  var sea = g.createLinearGradient(0, HZ, 0, G.shoreY + 20);
  sea.addColorStop(0, "#8FCBD6"); sea.addColorStop(0.35, "#6EB9CC"); sea.addColorStop(0.8, "#7CCBCB"); sea.addColorStop(1, "#A4DDD0");
  g.fillStyle = sea; g.fillRect(0, HZ, W, G.shoreY + 30 - HZ);
  g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(0, HZ, W, 1.5);                       // the horizon's bright edge
  // the beach: wet sand at the tideline, dry sand behind
  var sand = g.createLinearGradient(0, G.shoreY, 0, H);
  sand.addColorStop(0, "#DCC08C"); sand.addColorStop(0.12, "#EBD2A0"); sand.addColorStop(1, "#E6C68E");
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, H);
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  g.lineTo(W, H); g.closePath(); g.fill();
  g.fillStyle = "rgba(180,150,100,.18)"; g.beginPath(); g.moveTo(0, H);                   // the wet band
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  for (x = W; x >= 0; x -= 16) g.lineTo(x, shore(x) + 26 + 6 * Math.sin(x / 50));
  g.closePath(); g.fill();
  // soft mottles and a scatter of shells and pebbles
  for (i = 0; i < 70; i++) {
    x = rand(0, W); y = rand(G.shoreY + 30, H);
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.08)" : "rgba(150,110,60,.06)";
    g.beginPath(); g.ellipse(x, y, rand(30, 100), rand(8, 24), 0, 0, 7); g.fill();
  }
  // the drift line at high water: weed and bits
  for (x = 10; x < W; x += rand(8, 40)) {
    y = shore(x) + 38 + 6 * Math.sin(x / 60) + rand(-4, 4);
    if (onPier(x, y) || Math.sin(x / 90) < -0.3) continue;
    g.fillStyle = pick(["#6E8F52", "#5E7F48", "#8A7A5A"]); g.beginPath(); g.ellipse(x, y, rand(3, 7), rand(1.2, 2.4), rand(-0.4, 0.4), 0, 7); g.fill();
  }
  for (i = 0; i < 46; i++) {
    x = rand(0, W); y = rand(G.shoreY + 50, H - 6);
    if (S.inZone(x, y, 12) || onPier(x, y)) continue;
    var kind = Math.random();
    if (kind < 0.45) { g.fillStyle = pick(["#FFF6EA", "#F7D9CC", "#EFE4D2"]); g.beginPath(); g.arc(x, y, 3.2, Math.PI, 0); g.fill();   // a shell
      g.strokeStyle = "rgba(170,130,100,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.6, y - 2.6); g.moveTo(x, y); g.lineTo(x + 1.6, y - 2.6); g.stroke(); }
    else { g.fillStyle = pick(["#B8B0A2", "#A69D90", "#C9C1B3"]); g.beginPath(); g.ellipse(x, y, rand(2, 4), rand(1.4, 2.6), 0, 0, 7); g.fill(); }
  }
  rockPools(g, S);
  pier(g);
  // the parasol, its towel, and a sandcastle with a bucket and spade
  var pa = G.parasol;
  g.fillStyle = "#6C8FD0"; rr(g, pa.x - 50, pa.y - 14, 96, 30, 6); g.fill();
  g.fillStyle = "#FFFFFF"; [0, 1, 2].forEach(function (k) { g.fillRect(pa.x - 40 + k * 32, pa.y - 14, 8, 30); });
  g.fillStyle = "rgba(120,90,50,.18)"; g.beginPath(); g.ellipse(pa.x + 18, pa.y + 2, 70, 14, 0, 0, 7); g.fill();
  g.strokeStyle = "#8D6440"; g.lineWidth = 3; g.beginPath(); g.moveTo(pa.x + 30, pa.y + 4); g.lineTo(pa.x + 22, pa.y - 92); g.stroke();
  var c = G.castle;
  rimmed(g, "#C9A66C", "#E9CD95", 1.5, function (e) { g.fillRect(c.x - 26 - e, c.y - 20 - e, 52 + 2 * e, 20 + 2 * e);
    g.fillRect(c.x - 30 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e); g.fillRect(c.x + 14 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e); g.fillRect(c.x - 9 - e, c.y - 42 - e, 18 + 2 * e, 24 + 2 * e); });
  g.fillStyle = "#C9A66C"; [-30, -24, -18, 14, 20, 26, -9, -3, 3].forEach(function (o, k) { g.fillRect(c.x + o, c.y - (k < 6 ? 38 : 46), 4, 4); });
  g.fillStyle = "#9C7B4E"; rr(g, c.x - 6, c.y - 12, 12, 12, 5); g.fill();
  g.strokeStyle = "#8D6440"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(c.x, c.y - 42); g.lineTo(c.x, c.y - 58); g.stroke();
  g.fillStyle = "#E86A5B"; g.beginPath(); g.moveTo(c.x, c.y - 58); g.lineTo(c.x + 12, c.y - 54); g.lineTo(c.x, c.y - 50); g.closePath(); g.fill();
  rimmed(g, "#B8462F", "#E86A5B", 1.5, function (e) { g.beginPath(); g.moveTo(c.x + 40 - e, c.y - 22 - e); g.lineTo(c.x + 60 + e, c.y - 22 - e);
    g.lineTo(c.x + 57 + e, c.y + e); g.lineTo(c.x + 43 - e, c.y + e); g.closePath(); g.fill(); });                      // bucket
  g.strokeStyle = "#B8462F"; g.lineWidth = 1.2; g.beginPath(); g.arc(c.x + 50, c.y - 22, 9, Math.PI, 0); g.stroke();
  g.strokeStyle = "#8D6440"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(c.x - 44, c.y - 2); g.lineTo(c.x - 56, c.y - 30); g.stroke();      // spade
  g.fillStyle = "#4E9A5A"; g.beginPath(); g.moveTo(c.x - 46, c.y); g.lineTo(c.x - 38, c.y - 6); g.lineTo(c.x - 44, c.y - 12); g.lineTo(c.x - 52, c.y - 6); g.closePath(); g.fill();
}

function lighthouse(g, x, y) {
  rimmed(g, "#9A9AA3", "#F4F2EC", 1.5, function (e) { g.beginPath(); g.moveTo(x - 11 - e, y + e); g.lineTo(x - 7 - e, y - 56 - e); g.lineTo(x + 7 + e, y - 56 - e); g.lineTo(x + 11 + e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = "#E86A5B"; [[-10.3, -9.4, -14, -24], [-8.8, -7.9, -36, -46]].forEach(function (b) {
    g.beginPath(); g.moveTo(x + b[0], y + b[2] + 10); g.lineTo(x + b[1], y + b[3] + 10); g.lineTo(x - b[1], y + b[3] + 10); g.lineTo(x - b[0], y + b[2] + 10); g.closePath(); g.fill(); });
  g.fillStyle = "#3E4A5A"; g.fillRect(x - 9, y - 60, 18, 4);
  g.fillStyle = "#FFE9A6"; g.fillRect(x - 6, y - 70, 12, 10);
  g.fillStyle = "#E86A5B"; g.beginPath(); g.moveTo(x - 9, y - 70); g.lineTo(x, y - 80); g.lineTo(x + 9, y - 70); g.closePath(); g.fill();
}

function rockPools(g, S) {
  var i, x, y;
  // the slabs the pools sit in: flat-topped rock, a dark wet edge, sand between
  var slabs = [[0.165, 0.815, 150, 52], [0.06, 0.86, 70, 40], [0.29, 0.875, 92, 40], [0.12, 0.945, 96, 34], [0.235, 0.955, 70, 26],
    [0.355, 0.93, 52, 24], [0.2, 0.735, 92, 26], [0.035, 0.775, 46, 30]];
  slabs.forEach(function (s) { var x0 = G.W * s[0], y0 = G.H * s[1];
    g.fillStyle = "rgba(90,80,60,.25)"; g.beginPath(); g.ellipse(x0 + 4, y0 + 6, s[2] + 4, s[3] + 3, 0, 0, 7); g.fill();
    g.fillStyle = "#7D766B"; g.beginPath(); g.ellipse(x0, y0 + 3, s[2], s[3], 0, 0, 7); g.fill();
    g.fillStyle = "#A9A193"; g.beginPath(); g.ellipse(x0, y0 - 2, s[2] - 4, s[3] - 5, 0, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.13)"; g.beginPath(); g.ellipse(x0 - s[2] * 0.25, y0 - s[3] * 0.35, s[2] * 0.45, s[3] * 0.3, 0, 0, 7); g.fill(); });
  for (i = 0; i < 70; i++) {                                                        // texture: cracks, barnacles, lichen
    x = G.W * 0.2 + rand(-260, 230); y = G.H * 0.86 + rand(-100, 90);
    var inside = slabs.some(function (s) { var dx = (x - G.W * s[0]) / (s[2] - 8), dy = (y - G.H * s[1]) / (s[3] - 8); return dx * dx + dy * dy < 1; });
    if (!inside) continue;
    var r0 = Math.random();
    g.fillStyle = r0 < 0.45 ? "rgba(80,74,66,.3)" : r0 < 0.75 ? "rgba(214,196,120,.45)" : "rgba(240,236,226,.6)";
    g.beginPath(); g.ellipse(x, y, rand(1.5, 7), rand(1, 2.6), rand(-0.5, 0.5), 0, 7); g.fill();
  }
  [G.pool, G.pool2].forEach(function (p, n) {
    g.fillStyle = "#6E675E"; g.beginPath(); g.ellipse(p.x, p.y, p.rx + 7, p.ry + 6, 0, 0, 7); g.fill();
    var pg = g.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry);
    pg.addColorStop(0, "#5FA9B8"); pg.addColorStop(1, "#8FD3D2");
    g.fillStyle = pg; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.lineCap = "round";
    g.beginPath(); g.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.35, p.rx * 0.4, p.ry * 0.25, 0, 3.6, 5.2); g.stroke();
    if (n === 0) {                                                                  // the big pool: weed, an anemone, a starfish
      g.fillStyle = "#4F8A54"; [[-0.6, 0.3], [-0.45, 0.45], [0.55, 0.4]].forEach(function (q) {
        g.beginPath(); g.ellipse(p.x + p.rx * q[0], p.y + p.ry * q[1], 9, 3.5, 0.4, 0, 7); g.fill(); });
      g.fillStyle = "#E86A8C"; for (var a = 0; a < 7; a++) { g.beginPath(); g.arc(p.x + p.rx * 0.35 + Math.cos(a) * 5, p.y + p.ry * 0.25 + Math.sin(a) * 3, 2.4, 0, 7); g.fill(); }
      star(g, p.x - p.rx * 0.15, p.y + p.ry * 0.4, 7, "#F29E4C");
    }
  });
  G.rocks.forEach(function (b) {                                                    // boulders, weed at their feet
    rimmed(g, "#5F584F", "#968E81", 2, function (e) { g.beginPath(); g.ellipse(b.x, b.y - b.ry * 0.35, b.rx + e, b.ry + e, 0, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(b.x - b.rx * 0.3, b.y - b.ry * 0.75, b.rx * 0.45, b.ry * 0.3, -0.2, 0, 7); g.fill();
    g.fillStyle = "#5E8F4E"; for (var k = 0; k < 5; k++) { g.beginPath(); g.ellipse(b.x - b.rx * 0.8 + k * b.rx * 0.4, b.y + b.ry * 0.45, 7, 3, rand(-0.5, 0.5), 0, 7); g.fill(); }
    g.fillStyle = "#3E3A4A"; for (k = 0; k < 4; k++) { g.beginPath(); g.ellipse(b.x + rand(-b.rx, b.rx) * 0.6, b.y + rand(-b.ry, b.ry) * 0.2, 3, 2, 0.5, 0, 7); g.fill(); }   // mussels
  });
  star(g, G.W * 0.33, G.H * 0.8, 6, "#E86A5B");
}
function star(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath();
  for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); }
  g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.arc(x - r * 0.15, y - r * 0.15, r * 0.18, 0, 7); g.fill();
}

// The pier: legs into the sea, a deck of planks, white railings, lamp posts, a kiosk at the end.
function pier(g) {
  var P = G.pier, i, y, s, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
  function legs(x, yTop, len, w) { g.fillStyle = "#6B5440"; g.fillRect(x - w / 2, yTop, w, len);
    g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(x, yTop + len, w * 1.3, w * 0.35, 0, 0, 7); g.fill(); }
  // legs under the far end and down both sides (only the sea side of the shore)
  for (i = 0; i <= 5; i++) legs(s0[0] + 6 + (s0[1] - s0[0] - 12) * i / 5, P.y0 + 4, 20, 4);
  for (y = P.y0 + 30; y < P.y1 - 10; y += 34) {
    var k = (y - P.y0) / (P.y1 - P.y0), len = 14 + 14 * k, w = 4 + 2 * k; s = pierSpan(y);
    if (y < shore(s[0]) - 4) legs(s[0] + 2, y, Math.min(len, shore(s[0]) - y), w);
    if (y < shore(s[1]) - 4) legs(s[1] - 2, y, Math.min(len, shore(s[1]) - y), w);
  }
  // deck, with a thin fascia at the far end and down the sides
  g.fillStyle = "#8C6A4A"; g.beginPath(); g.moveTo(s0[0] - 2, P.y0 + 6); g.lineTo(s0[1] + 2, P.y0 + 6); g.lineTo(s1[1] + 3, P.y1 + 8); g.lineTo(s1[0] - 3, P.y1 + 8); g.closePath(); g.fill();
  var dg = g.createLinearGradient(0, P.y0, 0, P.y1); dg.addColorStop(0, "#C89C6B"); dg.addColorStop(1, "#D9B17F");
  g.fillStyle = dg; g.beginPath(); g.moveTo(s0[0], P.y0); g.lineTo(s0[1], P.y0); g.lineTo(s1[1], P.y1); g.lineTo(s1[0], P.y1); g.closePath(); g.fill();
  g.strokeStyle = "rgba(120,86,56,.45)"; g.lineWidth = 1.2;                         // planks, closer together far away
  for (i = 1; i < 22; i++) { y = P.y0 + (P.y1 - P.y0) * Math.pow(i / 22, 1.25); s = pierSpan(y); g.beginPath(); g.moveTo(s[0], y); g.lineTo(s[1], y); g.stroke(); }
  // kiosk at the far end: striped awning, a hatch
  var kx = (s0[0] + s0[1]) / 2, ky = P.y0 + 6;
  rimmed(g, "#8E3B34", "#F4E6CF", 1.5, function (e) { g.fillRect(kx - 30 - e, ky - 40 - e, 60 + 2 * e, 40 + 2 * e); });
  g.fillStyle = "#7FC8D2"; rr(g, kx - 18, ky - 30, 36, 15, 3); g.fill();
  g.fillStyle = "#9C6B43"; g.fillRect(kx - 22, ky - 16, 44, 4);
  for (i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#FFF4E8" : "#D9534F"; g.fillRect(kx - 36 + i * 12, ky - 50, 12, 11);
    g.beginPath(); g.arc(kx - 30 + i * 12, ky - 39, 6, 0, Math.PI); g.fill(); }
  g.fillStyle = "#D9534F"; g.beginPath(); g.moveTo(kx - 36, ky - 50); g.lineTo(kx, ky - 60); g.lineTo(kx + 36, ky - 50); g.closePath(); g.fill();
  // railings down both sides: posts, a top rail, a lifebuoy; lamp posts every so often
  [0, 1].forEach(function (side) {
    g.strokeStyle = "#F7F4EE"; g.lineCap = "round";
    var ys = []; for (y = P.y0 + 2; y <= P.y1; y += 16) ys.push(y);
    ys.forEach(function (y2) { var k = (y2 - P.y0) / (P.y1 - P.y0), h = 14 + 10 * k, x = pierSpan(y2)[side];
      g.lineWidth = 1.6 + k; g.beginPath(); g.moveTo(x, y2); g.lineTo(x, y2 - h); g.stroke(); });
    g.lineWidth = 2.4; g.beginPath();
    ys.forEach(function (y2, n) { var k = (y2 - P.y0) / (P.y1 - P.y0), h = 14 + 10 * k, x = pierSpan(y2)[side]; if (n) g.lineTo(x, y2 - h); else g.moveTo(x, y2 - h); });
    g.stroke();
  });
  g.lineWidth = 2; g.beginPath(); g.moveTo(s0[0], P.y0 - 14); g.lineTo(kx - 32, P.y0 - 14); g.moveTo(kx + 32, P.y0 - 14); g.lineTo(s0[1], P.y0 - 14); g.stroke();
  var by = P.y0 + (P.y1 - P.y0) * 0.55, bx = pierSpan(by)[0];
  g.strokeStyle = "#E86A5B"; g.lineWidth = 4; g.beginPath(); g.arc(bx, by - 12, 7, 0, 7); g.stroke();
  g.strokeStyle = "#FFFFFF"; g.lineWidth = 4; [0.4, 2.0, 3.6, 5.2].forEach(function (a) { g.beginPath(); g.arc(bx, by - 12, 7, a, a + 0.5); g.stroke(); });
  G.lamps = [];
  [0.18, 0.55, 0.92].forEach(function (f) { [0, 1].forEach(function (side) {
    var y2 = P.y0 + (P.y1 - P.y0) * f, k = f, x = pierSpan(y2)[side], h = 34 + 22 * k;
    g.strokeStyle = "#3E6E78"; g.lineWidth = 2 + k; g.beginPath(); g.moveTo(x, y2); g.lineTo(x, y2 - h); g.stroke();
    g.fillStyle = "#3E6E78"; g.fillRect(x - 4 - k, y2 - h - 2, 8 + 2 * k, 3);
    g.fillStyle = "#FFF1B8"; rr(g, x - 3 - k, y2 - h - 10 - 2 * k, 6 + 2 * k, 8 + 2 * k, 2); g.fill();
    G.lamps.push({ x: x, y: y2 - h - 6 - k, k: k });
  }); });
}

// ── What moves: the sea, the gulls, the crab, the boat ────────────────────────
var A = null;

function setup(S) {
  A = { gulls: [], crab: null, boat: null, crests: [], stars: [], t: 0 };
  for (var i = 0; i < 3; i++) A.gulls.push({ x: rand(0, G.W), y: rand(70, G.HZ - 30), v: rand(28, 46) * (Math.random() < 0.5 ? -1 : 1), ph: rand(0, 6), s: rand(0.8, 1.1), mode: "fly" });
  A.gulls.push({ x: G.W * 0.55, y: G.shoreY + 90, v: 0, ph: 0, s: 1, mode: "walk", tx: G.W * 0.55, ty: G.shoreY + 90, wait: 2, peck: 0 });   // the one on the sand
  A.crab = { x: G.W * 0.42, y: G.shoreY + 60, tx: G.W * 0.42, ty: G.shoreY + 60, wait: 1, hide: 0, clack: 0, ph: 0 };
  A.boat = { x: rand(G.W * 0.1, G.W * 0.6), v: 7, ph: 0 };
  for (i = 0; i < 26; i++) A.crests.push({ x: rand(0, G.W), y: rand(G.HZ + 8, G.shoreY - 12), l: rand(10, 26), ph: rand(0, 6) });
  for (i = 0; i < 46; i++) A.stars.push({ x: rand(0, G.W), y: rand(8, G.HZ - 20), s: rand(1, 2.4), ph: rand(0, 6) });
  A.crabSpr = crabSprite();
  A.glow = canvas(48, 48); var gg = A.glow.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,244,200,1)"); gr.addColorStop(0.3, "rgba(255,214,130,.55)"); gr.addColorStop(1, "rgba(255,200,110,0)");
  gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48);
  A.boatSpr = boatSprite();
}

function nearFam(S, x, y, d) {
  for (var i = 0; i < S.fam.length; i++) { var t = S.fam[i]; if (Math.abs(t.x - x) + Math.abs(t.y - y) < d) return t; }
  return null;
}

function update(dt, S) {
  if (!A) return;
  var WX = S.WX || {}, asleep = S.nightness > 0.6, wind = WX.wind || 0.1, i;
  A.t += dt;
  // gulls: three wheeling about, one pottering on the sand that takes off when someone comes close
  for (i = 0; i < A.gulls.length; i++) { var gl = A.gulls[i];
    if (gl.mode === "fly") {
      if (asleep) continue;                                                            // roosting on the pier (see back)
      gl.ph += dt * (7 + wind * 4); gl.x += (gl.v + (gl.v > 0 ? 1 : -1) * wind * 20) * dt; gl.y += Math.sin(A.t * 0.6 + gl.ph * 0.1) * 6 * dt;
      if (gl.x < -40) gl.x = G.W + 40; if (gl.x > G.W + 40) gl.x = -40;
      if (gl.land && Math.abs(gl.x - gl.land.x) < 14) { gl.mode = "walk"; gl.x = gl.land.x; gl.y = gl.land.y; gl.tx = gl.x; gl.ty = gl.y; gl.wait = rand(2, 5); gl.land = null; gl.v = 0; }
      else if (gl.land) { gl.y += (gl.land.y - gl.y) * Math.min(1, dt * 1.2); gl.v = (gl.land.x > gl.x ? 1 : -1) * 70; }
    } else {
      gl.peck = Math.max(0, gl.peck - dt);
      var near = nearFam(S, gl.x, gl.y, 95);
      if (near && !asleep) {                                                           // shooed: off it goes, and lands again further along
        S.say("!", gl.x, gl.y - 26); gl.mode = "fly"; gl.v = (near.x > gl.x ? -1 : 1) * 60; gl.y -= 6; gl.ph = 0;
        gl.land = { x: rand(G.W * 0.38, G.W * 0.68), y: rand(G.shoreY + 60, G.H - 70) };
        continue;
      }
      if (asleep) continue;
      var dx = gl.tx - gl.x, dy = gl.ty - gl.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2) { var st = Math.min(d, 22 * dt); gl.x += dx / d * st; gl.y += dy / d * st; gl.ph += dt * 10; gl.face = dx > 0 ? 1 : -1; }
      else if ((gl.wait -= dt) < 0) {
        if (Math.random() < 0.35) gl.peck = 0.5;
        gl.tx = Math.max(G.W * 0.36, Math.min(G.W * 0.7, gl.x + rand(-70, 70))); gl.ty = Math.max(G.shoreY + 50, Math.min(G.H - 50, gl.y + rand(-30, 30))); gl.wait = rand(1.5, 4);
      }
    }
  }
  // the crab: sideways along the tideline, a pause, claws up; hides from anyone close, and at night
  var c = A.crab;
  c.clack = Math.max(0, c.clack - dt);
  if (c.hide > 0) { c.hide -= dt; if (c.hide <= 0 && asleep) c.hide = 5; }
  else if (asleep) c.hide = 5;
  else {
    var who = nearFam(S, c.x, c.y, 80);
    if (who) { c.hide = rand(6, 12); S.puff("crumb", c.x, c.y - 4, 4, "#E2C48E"); }
    else {
      var cx = c.tx - c.x, cy = c.ty - c.y, cd = Math.sqrt(cx * cx + cy * cy);
      if (cd > 2) { var cs = Math.min(cd, 30 * dt); c.x += cx / cd * cs; c.y += cy / cd * cs; c.ph += dt * 18; }
      else if ((c.wait -= dt) < 0) {
        if (Math.random() < 0.4) c.clack = 1.2;
        var nx = c.x + rand(-120, 120), base = shore(nx);
        c.tx = Math.max(G.W * 0.34, Math.min(G.W * 0.7, nx)); c.ty = base + rand(28, 70); c.wait = rand(1, 3.5);
      }
    }
  }
  // the boat drifts along the horizon, and stays in when it storms
  var b = A.boat; b.x += b.v * (0.6 + wind) * dt; b.ph += dt; if (b.x > G.W + 60) b.x = -60;
  for (i = 0; i < A.crests.length; i++) { var cr = A.crests[i]; cr.x += (6 + 26 * wind) * dt * (0.4 + (cr.y - G.HZ) / (G.shoreY - G.HZ)); if (cr.x > G.W + 30) cr.x = -30; }
}

// How far the water reaches up the sand at x right now: the tide from the clock (a
// half-day cycle of 12 h 25 min, high around noon and midnight), and the waves.
function swash(x, time, S) {
  var d = S.now(), hrs = d.getHours() + d.getMinutes() / 60, tide = Math.cos(hrs / 12.42 * Math.PI * 2);
  var WX = S.WX || {}, big = 1 + 1.4 * (WX.wind || 0.1) + 1.2 * (WX.storm || 0);
  var wave = Math.max(0, Math.sin(time * 0.9 + x / 260)) * 10 * big + Math.sin(time * 0.37 + x / 400) * 3;
  return tide * 9 + wave + 6;
}

// The sea's moving surface, under the weather.
function under(ctx, time, S) {
  if (!A) return;
  var W = G.W, WX = S.WX || {}, i, x, wind = WX.wind || 0.1;
  // the boat on the horizon (not in a storm)
  var stormy = (WX.storm || 0) > 0.4;
  if (!stormy) { var b = A.boat, bob = Math.sin(b.ph * 1.6) * 1.2; ctx.drawImage(A.boatSpr.c, b.x - A.boatSpr.w / 2, G.HZ - A.boatSpr.h + 6 + bob, A.boatSpr.w, A.boatSpr.h); }
  // crests and glints, more and whiter with the wind
  ctx.strokeStyle = "rgba(255,255,255," + (0.35 + 0.4 * wind).toFixed(2) + ")"; ctx.lineCap = "round"; ctx.lineWidth = 1.6; ctx.beginPath();
  var n = Math.round(A.crests.length * (0.45 + 0.55 * wind));
  for (i = 0; i < n; i++) { var c = A.crests[i], k = (c.y - G.HZ) / (G.shoreY - G.HZ), l = c.l * (0.4 + k), on = Math.sin(time * 0.8 + c.ph);
    if (on < -0.3) continue; ctx.moveTo(c.x - l / 2, c.y); ctx.quadraticCurveTo(c.x, c.y - 2 - 2 * k, c.x + l / 2, c.y); }
  ctx.stroke();
  if (S.DARK < 0.5) { ctx.fillStyle = "rgba(255,255,240,.7)";                               // sun glints
    for (i = 0; i < 14; i++) { var gx = W * 0.52 + Math.sin(i * 12.9) * W * 0.16, gy = G.HZ + 10 + ((i * 37) % 100) * (G.shoreY - G.HZ - 30) / 100, tw = Math.sin(time * 3 + i * 1.7);
      if (tw > 0.6) ctx.fillRect(gx - 1.5, gy - 0.6, 3 + tw * 2, 1.2); } }
  // rain rings on the sea
  if ((WX.rain || 0) > 0.1) { ctx.strokeStyle = "rgba(255,255,255," + (0.4 * WX.rain).toFixed(2) + ")"; ctx.lineWidth = 1; ctx.beginPath();
    for (i = 0; i < 12; i++) { var rx = rand(0, W), ry = rand(G.HZ + 20, G.shoreY - 6), rk = (ry - G.HZ) / (G.shoreY - G.HZ);
      ctx.moveTo(rx + 4 + 4 * rk, ry); ctx.ellipse(rx, ry, 4 + 4 * rk, 1.2 + rk, 0, 0, 7); } ctx.stroke(); }
  // the swash: water running up the wet sand and back, a foam line on its edge. The pier
  // stands above it, so its deck is cut out of the water.
  var P = G.pier, s0 = pierSpan(P.y0 + (P.y1 - P.y0) * 0.6), s1 = pierSpan(P.y1), y0 = P.y0 + (P.y1 - P.y0) * 0.6;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, G.H);
  ctx.moveTo(s0[0] - 3, y0); ctx.lineTo(s0[1] + 3, y0); ctx.lineTo(s1[1] + 3, P.y1 + 8); ctx.lineTo(s1[0] - 3, P.y1 + 8); ctx.closePath();
  ctx.clip("evenodd");
  var pts = [];
  for (x = -8; x <= W + 8; x += 16) pts.push([x, shore(x) + swash(x, time, S)]);
  ctx.fillStyle = "rgba(150,212,206,.78)"; ctx.beginPath(); ctx.moveTo(-8, G.shoreY - 30);
  for (i = 0; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(W + 8, G.shoreY - 30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2.5; ctx.beginPath();
  for (i = 0; i < pts.length; i++) { if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]); }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.beginPath();          // the next wave coming in
  for (i = 0; i < pts.length; i++) { var y2 = pts[i][1] - 12 - 6 * Math.sin(time * 0.9 + pts[i][0] / 260 + 1.6); if (i) ctx.lineTo(pts[i][0], y2); else ctx.moveTo(pts[i][0], y2); }
  ctx.stroke();
  // storms darken the sea
  if ((WX.storm || 0) > 0.05) { ctx.fillStyle = "rgba(40,60,80," + (0.22 * WX.storm).toFixed(3) + ")"; ctx.fillRect(0, G.HZ, W, G.shoreY - G.HZ + 10); }
  ctx.restore();
}

// The parasol's canopy stands over whoever is behind it, so it is drawn in front of the family.
function front(ctx, time, S) {
  var pa = G.parasol, i, sway = Math.sin(time * 1.1) * (1 + 3 * ((S.WX || {}).wind || 0)) * 0.6;
  for (i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#FFF4E8" : "#F3C24B";
    ctx.beginPath(); ctx.moveTo(pa.x + 21, pa.y - 104); ctx.lineTo(pa.x - 40 + i * 15.5 + sway, pa.y - 78); ctx.lineTo(pa.x - 40 + (i + 1) * 15.5 + sway, pa.y - 78); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = "#E86A5B"; ctx.beginPath(); ctx.arc(pa.x + 21, pa.y - 105, 3, 0, 7); ctx.fill();
}

// Gulls and the crab, behind the family.
function back(ctx, time, S) {
  if (!A) return;
  var i, asleep = S.nightness > 0.6;
  // the crab
  var c = A.crab;
  if (c.hide <= 0) { var sc = S.depth(c.y), cl = c.clack > 0 ? Math.abs(Math.sin(c.clack * 9)) : 0, wob = Math.sin(c.ph) * 1.2;
    ctx.save(); ctx.translate(c.x, c.y + wob * 0.3); ctx.scale(sc / K, sc / K);
    ctx.drawImage(cl > 0.5 ? A.crabSpr.up : A.crabSpr.down, -A.crabSpr.ax, -A.crabSpr.ay); ctx.restore(); }
  else if (c.hide > 0 && !asleep) {                                                  // two eyes peeping out of the sand
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 2, 1.6, 0, 7); ctx.arc(c.x + 3, c.y - 2, 1.6, 0, 7); ctx.fill(); }
  // the gulls; at night the flyers roost on the pier's far rail
  if (asleep) { var P = G.pier, s0 = pierSpan(P.y0 + 6);
    [[s0[0] + 4, 0.75], [s0[1] - 6, -0.8], [s0[1] - 22, 0.85]].forEach(function (r, n) { gullStand(ctx, r[0], P.y0 - 8 + n * 2, S.depth(P.y0) * 0.75, r[1] > 0 ? 1 : -1, false, true, 0); }); }
  for (i = 0; i < A.gulls.length; i++) { var g = A.gulls[i];
    if (g.mode === "fly" && asleep) continue;
    if (g.mode === "fly") gullFly(ctx, g.x, g.y, g.s * (0.7 + 0.3 * (g.y / G.HZ)), Math.sin(g.ph), g.v >= 0 ? 1 : -1);
    else gullStand(ctx, g.x, g.y, S.depth(g.y), g.face || 1, g.peck > 0, asleep, time + g.ph); }
}

function gullFly(ctx, x, y, s, flap, dir) {
  var w = 16 * s, up = flap * 7 * s;
  ctx.strokeStyle = "#5B6470"; ctx.lineWidth = 2.6 * s; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x - w, y - up); ctx.quadraticCurveTo(x - w * 0.45, y - 5 * s - up * 0.4, x, y);
  ctx.quadraticCurveTo(x + w * 0.45, y - 5 * s - up * 0.4, x + w, y - up); ctx.stroke();
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(x, y + 1.2 * s, 4.2 * s, 2.4 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#F3C24B"; ctx.beginPath(); ctx.moveTo(x + dir * 4 * s, y); ctx.lineTo(x + dir * 7 * s, y + 0.8 * s); ctx.lineTo(x + dir * 4 * s, y + 1.8 * s); ctx.fill();
}
function gullStand(ctx, x, y, sc, face, peck, asleep, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face * sc, sc);
  var bob = asleep ? 0 : Math.abs(Math.sin(t * 5)) * 0.8, dip = peck ? 6 : 0;
  ctx.strokeStyle = "#E3A23B"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2, 0); ctx.moveTo(2, -6); ctx.lineTo(3, 0); ctx.stroke();
  ctx.fillStyle = "#C9CFD6"; ctx.beginPath(); ctx.ellipse(-3, -12 - bob, 9, 6, -0.15, 0, 7); ctx.fill();                       // wing and back
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(1, -11 - bob, 8, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#3E4450"; ctx.beginPath(); ctx.moveTo(-12, -14 - bob); ctx.lineTo(-6, -12 - bob); ctx.lineTo(-11, -10 - bob); ctx.fill();  // tail tip
  if (asleep) { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(4, -16, 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = "#2B2433"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, -17); ctx.lineTo(7, -17); ctx.stroke(); }
  else { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(7, -19 - bob + dip, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(8.5, -20 - bob + dip, 1.1, 0, 7); ctx.fill();
    ctx.fillStyle = "#F3C24B"; ctx.beginPath(); ctx.moveTo(11, -20 - bob + dip); ctx.lineTo(16, -18.5 - bob + dip); ctx.lineTo(11, -17.5 - bob + dip); ctx.fill(); }
  ctx.restore();
}

function crabSprite() {
  function one(up) {
    var w = 40, h = 30, c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K);
    var x = w / 2, y = h - 4, body = "#E8704A", rim = "#A8432A";
    g.strokeStyle = rim; g.lineWidth = 1.6; g.lineCap = "round";
    [-1, 1].forEach(function (s) { for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + s * 6, y - 4 + i * 1.5); g.lineTo(x + s * (11 + i * 1.5), y - 5 + i * 2.5); g.lineTo(x + s * (13 + i * 1.5), y + 1); g.stroke(); } });
    [-1, 1].forEach(function (s) {                                                      // arms and claws, raised for the clack
      var cx = x + s * 12, cy = up ? y - 16 : y - 9;
      g.beginPath(); g.moveTo(x + s * 5, y - 7); g.lineTo(cx - s * 2, cy + 2); g.stroke();
      rimmed(g, rim, body, 1.4, function (e) { g.beginPath(); g.ellipse(cx, cy, 4 + e, 3.2 + e, s * 0.5, 0, 7); g.fill(); });
      g.fillStyle = rim; g.beginPath(); g.moveTo(cx + s * 1, cy - 1); g.lineTo(cx + s * 5, cy - 3.5); g.lineTo(cx + s * 3, cy + 0.5); g.fill(); });
    rimmed(g, rim, body, 1.4, function (e) { g.beginPath(); g.ellipse(x, y - 6, 9 + e, 6 + e, 0, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(x - 3, y - 8.5, 4, 1.8, 0, 0, 7); g.fill();
    g.strokeStyle = rim; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 3, y - 11); g.lineTo(x - 3.5, y - 15); g.moveTo(x + 3, y - 11); g.lineTo(x + 3.5, y - 15); g.stroke();
    g.fillStyle = "#2B2433"; g.beginPath(); g.arc(x - 3.5, y - 15.5, 1.7, 0, 7); g.arc(x + 3.5, y - 15.5, 1.7, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 4, y - 16, 0.6, 0, 7); g.arc(x + 3, y - 16, 0.6, 0, 7); g.fill();
    return c;
  }
  return { down: one(false), up: one(true), ax: 20 * K, ay: 26 * K };
}
function boatSprite() {
  var w = 44, h = 46, c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K);
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(22, 4); g.lineTo(22, 36); g.lineTo(6, 36); g.closePath(); g.fill();
  g.fillStyle = "#F7E7D0"; g.beginPath(); g.moveTo(24, 10); g.lineTo(24, 36); g.lineTo(36, 36); g.closePath(); g.fill();
  g.strokeStyle = "#6B5440"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(23, 2); g.lineTo(23, 38); g.stroke();
  g.fillStyle = "#E86A5B"; g.beginPath(); g.moveTo(4, 37); g.lineTo(40, 37); g.lineTo(35, 44); g.lineTo(9, 44); g.closePath(); g.fill();
  g.fillStyle = "#E86A5B"; g.beginPath(); g.moveTo(23, 2); g.lineTo(30, 4); g.lineTo(23, 6); g.fill();
  return { c: c, w: w * 0.62, h: h * 0.62 };
}

// Lights over the dusk: stars, a moon and its path on the sea, the lighthouse sweeping,
// the pier's lamps and the kiosk hatch.
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W;
  if (D <= 0.02) return;
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.stars.length; i++) { var st = A.stars[i], tw = 0.55 + 0.45 * Math.sin(time * 1.4 + st.ph);
    ctx.globalAlpha = D * tw * 0.85; ctx.fillRect(st.x, st.y, st.s, st.s); }
  var mx = W * 0.44, my = 118;
  ctx.globalAlpha = D; ctx.fillStyle = "#FFF8DC"; ctx.beginPath(); ctx.arc(mx, my, 17, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(230,222,190,.7)"; ctx.beginPath(); ctx.arc(mx - 5, my - 3, 3.5, 0, 7); ctx.arc(mx + 6, my + 5, 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = "#FFF3C4";                                                            // the moon's path on the water
  for (i = 0; i < 16; i++) { var py = G.HZ + 6 + i * (G.shoreY - G.HZ - 16) / 16, pw = 8 + i * 3.2, jit = Math.sin(time * 2 + i * 1.9) * (4 + i);
    ctx.globalAlpha = D * (0.55 - i * 0.022); ctx.fillRect(mx - pw / 2 + jit, py, pw, 2); }
  // the lighthouse: a beam turning, brightest as it faces us, fading along its length
  var lh = G.lighthouse, lx = lh.x, ly = lh.y - 65, a = time * 0.7, face = Math.cos(a), len = 460 * Math.abs(Math.sin(a)) + 30, dir = Math.sin(a) > 0 ? -1 : 1;
  ctx.globalCompositeOperation = "lighter";
  var bg = ctx.createLinearGradient(lx, 0, lx + dir * len, 0);
  bg.addColorStop(0, "rgba(255,240,190,.42)"); bg.addColorStop(1, "rgba(255,240,190,0)");
  ctx.globalAlpha = D * (0.35 + 0.45 * Math.max(0, face)); ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(lx, ly - 2); ctx.lineTo(lx + dir * len, ly - 16); ctx.lineTo(lx + dir * len, ly + 12); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = D * (0.7 + 0.3 * Math.max(0, face)); ctx.drawImage(A.glow, lx - 20, ly - 20, 40, 40);
  // pier lamps
  for (i = 0; i < G.lamps.length; i++) { var l = G.lamps[i], r = 12 + 12 * l.k;
    ctx.globalAlpha = D * 0.95; ctx.drawImage(A.glow, l.x - r, l.y - r, r * 2, r * 2); }
  ctx.globalCompositeOperation = "source-over";
  var P = G.pier, s0 = pierSpan(P.y0), kx = (s0[0] + s0[1]) / 2;
  ctx.globalAlpha = D * 0.85; ctx.fillStyle = "#FFE29A"; rr(ctx, kx - 18, P.y0 + 6 - 30, 36, 15, 3); ctx.fill();
  ctx.globalAlpha = 1;
}

export default {
  id: "seaside", label: "Seaside",
  shadow: "110,80,40",                                       // warm shadows on the sand
  depth: [0.64, 0.36],                                       // a deeper view than the meadow's, so the pier reads as going out to sea
  creatures: ["otter", "shark", "crow", "capybara", "snail", "fox", "hedgehog"],
  bake: function (g, S) { bake(g, S); },
  // spread over the beach, the pier and the rocks; the household's snail goes to the kiosk
  start: function (i, S) {
    var P = G.pier, slots = [[0.45, 0.71], [0.2, 0.74], ["pier", 0.55], [0.6, 0.76], [0.68, 0.86], ["pier", 0.12], [0.08, 0.86], [0.4, 0.82]];
    var s = slots[i % slots.length];
    if (s[0] === "pier") { var y = P.y0 + (P.y1 - P.y0) * s[1], sp = pierSpan(y); return { x: (sp[0] + sp[1]) / 2, y: y }; }
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  swimSpot: function (S) { var p = G.pool; return { x: p.x + rand(-p.rx * 0.5, p.rx * 0.5), y: p.y - p.ry - 52 }; },
  // On and off the pier only by its landward end; the sea is not for walking on.
  via: function (t, dest, S) {
    var a = onPier(t.x, t.y), b = onPier(dest.x, dest.y);
    if (a === b) return null;
    var foot = { x: (pierSpan(G.pier.y1)[0] + pierSpan(G.pier.y1)[1]) / 2, y: G.pier.y1 + 16 };
    if (Math.abs(t.x - foot.x) < 36 && Math.abs(t.y - foot.y) < 22) return null;
    return foot;
  },
  weather: {
    // snow lies on the sand and the pier deck, never on the sea; and someone builds a snowman
    ground: function (ctx, S, WX) {
      if (WX.snow <= 0.02) return;
      var x, P = G.pier, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
      ctx.fillStyle = "rgba(246,249,255," + (0.55 * WX.snow).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(0, G.H);
      for (x = 0; x <= G.W; x += 16) ctx.lineTo(x, shore(x) + 30);
      ctx.lineTo(G.W, G.H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s0[0], P.y0); ctx.lineTo(s0[1], P.y0); ctx.lineTo(s1[1], P.y1); ctx.lineTo(s1[0], P.y1); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = WX.snow; S.blit(S.sprites.snowman, G.W * 0.585, G.H - 64, 1, 1, 1, 1); ctx.globalAlpha = 1;
    }
  },
  ambient: { setup: setup, update: update, under: under, back: back, front: front, light: light }
};
