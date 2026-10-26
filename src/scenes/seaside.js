// The seaside: a British one. A grey-green sea under a soft grey-blue sky, chalk cliffs and
// a lighthouse on the right, a Victorian pier striding out to its pavilion, where a little
// brass band plays when the music does. On the left a sea wall holds up the promenade, with
// a row of beach huts, railings, lamps, a chip shop at the far end, and the lane up to town
// (and school) leaving past the huts. Deckchairs and a windbreak on the sand, rock pools by
// the wall, a boat shed down by the pier. The tide comes and goes with the clock, waves
// run up the sand and slap the wall, gulls wheel about and land, and a crab potters along
// the tideline. The family lives on the sand, the pier, the promenade and the rocks; the
// swimmers dive into the big pool. No village: away duties and school go up the slipway,
// along the promenade and off up the lane, and letters arrive by air.
//
// Everything is a fraction of the card, so it survives another resolution. Day and night
// come from the engine's darkness; this scene only adds its own lights over the dusk.
import { rand, pick, rr, rimmed, canvas, K } from "../engine/draw.js";

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

// The sea wall runs from the near left (u = 0) back to the horizon (u = 1). foot(u) is where
// it meets the sand or the sea; its top edge is wallH(u) above that; the promenade runs
// promW(u) inland (left) from the top edge, and the huts stand behind it.
function foot(u) { var A = G.wall; return { x: A.x0 + (A.x1 - A.x0) * u, y: A.y0 + (A.y1 - A.y0) * u }; }
function wallH(u) { return 40 - 32 * u; }
function promW(u) { return 84 - 66 * u; }
function scaleAt(u) { return 1 - 0.68 * u; }
function top(u) { var f = foot(u); return { x: f.x, y: f.y - wallH(u) }; }
// u of the top edge at screen height y (the top edge is a straight line too)
function uTop(y) { var A = G.wall, y0 = A.y0 - 40, y1 = A.y1 - 8; return (y0 - y) / (y0 - y1); }
function uFoot(y) { var A = G.wall; return (A.y0 - y) / (A.y0 - A.y1); }
// left of the wall's foot: the land (the wall face, the promenade, the huts, the town)
function onLand(x, y) { return x < foot(uFoot(y)).x + 2; }
function onProm(x, y, m) {
  m = m || 0; var u = uTop(y);
  if (u < 0.02 || u > 0.86) return false;
  var t = top(u); return x < t.x - m && x > t.x - promW(u) + m;
}

function layout(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP;
  var shoreY = Math.round(H * 0.585);
  G = { W: W, H: H, HZ: HZ, TOP: TOP, shoreY: shoreY };
  G.wall = { x0: W * 0.115, y0: H * 0.8, x1: W * 0.345, y1: HZ + 26 };
  var y1 = Math.round(shore(W * 0.79) + 26);
  G.pier = { y0: TOP + 40, y1: y1, cx0: W * 0.752, cx1: W * 0.79, hw0: 54, hw1: 94 };
  G.pool = { x: W * 0.275, y: H * 0.845, rx: Math.min(96, W * 0.075), ry: 26 };
  G.pool2 = { x: W * 0.395, y: H * 0.94, rx: 48, ry: 13 };
  G.rocks = [[0.205, 0.765, 40, 24], [0.365, 0.79, 38, 22], [0.2, 0.965, 50, 26], [0.47, 0.985, 34, 18], [0.33, 0.745, 26, 15]]
    .map(function (b) { return { x: W * b[0], y: H * b[1], rx: b[2], ry: b[3] }; });
  G.chairs = [[0.505, 0.835, "#D9534F"], [0.565, 0.87, "#4F7FBF"], [0.615, 0.815, "#5E9F6A"]]
    .map(function (c) { return { x: W * c[0], y: H * c[1], col: c[2] }; });
  G.breaker = { x0: W * 0.47, x1: W * 0.64, y: H * 0.775 };
  G.castle = { x: W * 0.69, y: H * 0.95 };
  G.lighthouse = { x: W * 0.925, y: HZ - 34 };
  G.shed = { x: W * 0.925, y: H * 0.725 };
  // the slipway down the wall's face, the lane to town, the beach huts (the family's is No. 7)
  G.slipTop = { x: top(0.3).x - promW(0.3) * 0.3, y: top(0.3).y + 2 };
  G.slipFoot = { x: foot(0.06).x + 30, y: foot(0.06).y + 8 };
  G.lane = { u: 0.36 };
  var lt = top(0.36);
  G.laneMouth = { x: lt.x - promW(0.36) * 0.5, y: lt.y + 1 };
  G.post = { x: lt.x - promW(0.36) - 8, y: lt.y - 4 };
  G.huts = [];
  [[0.05, "#F2B6C1"], [0.13, "#8FB8E0", 7], [0.21, "#F7D774"], [0.45, "#9FD3C7"], [0.51, "#C8B6E2"], [0.565, "#F29E7A"], [0.615, "#F2B6C1"], [0.66, "#F7D774"]]
    .forEach(function (h) { var t = top(h[0]), s = scaleAt(h[0]), w = 58 * s;
      G.huts.push({ u: h[0], col: h[1], no: h[2] || 0, s: s, w: w, x: t.x - promW(h[0]) - w * 0.55, y: t.y - 1 }); });
  G.home = G.huts[1];
  var cu = 0.74, ct = top(cu);
  G.chippy = { u: cu, s: scaleAt(cu) * 1.25, x: ct.x - promW(cu) - 34, y: ct.y - 1 };
  var P = G.pier;
  var zones = [G.pool, G.pool2].map(function (p) { return { x: p.x, y: p.y, rx: p.rx, ry: p.ry }; })
    .concat(G.rocks, G.chairs.map(function (c) { return { x: c.x, y: c.y - 6, rx: 30, ry: 14 }; }),
      [{ x: G.castle.x, y: G.castle.y - 6, rx: 34, ry: 16 }, { x: G.shed.x - 6, y: G.shed.y - 8, rx: 78, ry: 30 },
        { x: (G.breaker.x0 + G.breaker.x1) / 2, y: G.breaker.y, rx: (G.breaker.x1 - G.breaker.x0) / 2, ry: 8 }]);
  var beach = { w: 3, has: function (x, y) { return y > shore(x) + 46 && y < H - 40 && x > foot(uFoot(y)).x + 40 && x < W * 0.72; },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(W * 0.3, W * 0.72), y = rand(shoreY + 50, H - 44); if (beach.has(x, y)) return { x: x, y: y }; } return { x: W * 0.52, y: H * 0.76 }; } };
  var deck = { w: 2, has: function (x, y) { return onPier(x, y, 22); },
    pick: function () { var y = rand(P.y0 + 12, P.y1 - 8), s = pierSpan(y); return { x: rand(s[0] + 26, s[1] - 26), y: y }; } };
  var prom = { w: 1.4, has: function (x, y) { return onProm(x, y, 12); },
    pick: function () { var u = rand(0.08, 0.5), t = top(u), w = promW(u); return { x: t.x - w * rand(0.35, 0.65), y: t.y + 1 }; } };
  var rocks = { w: 1.2, has: function (x, y) { return x > W * 0.17 && x < W * 0.48 && y > H * 0.72 && y < H - 24 && x > foot(uFoot(y)).x + 30; },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(W * 0.17, W * 0.48), y = rand(H * 0.72, H - 24); if (rocks.has(x, y)) return { x: x, y: y }; } return { x: W * 0.33, y: H * 0.9 }; } };
  var sand = { has: function (x, y) { return y > shore(x) + 40 && y < H - 22 && x > foot(uFoot(y)).x + 30 && x < W - 30; },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(W * 0.2, W - 30), y = rand(shoreY + 44, H - 22); if (sand.has(x, y)) return { x: x, y: y }; } return { x: W * 0.52, y: H * 0.8 }; } };
  return {
    lay: { pier: P, pool: G.pool,
      // the School tag hangs over the fingerpost at the lane's mouth
      school: { x: G.post.x, y: G.post.y, tag: G.post.y - 66, cut: [G.post.x - 120, G.post.y - 130, 240, 170] } },
    zones: zones, water: G.pool,
    patch: [beach, deck, prom, rocks],
    roam: [sand],
    home: { x: W * 0.52, y: H * 0.74 },
    // up the slipway, along the promenade, and off up the lane to town
    exit: { x: G.laneMouth.x, y: G.laneMouth.y, off: { x: -60, y: G.laneMouth.y - 16 } }
  };
}

// ── The background, baked once per size ───────────────────────────────────────
function bake(g, S) {
  var L = layout(S), W = S.W, H = S.H, HZ = S.HZ, i, x, y;
  S.place(L);
  // a soft grey-blue sky, paler and greyer towards the horizon, with a bank of cloud on it
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#B4CAD6"); sky.addColorStop(0.7, "#D5DEDF"); sky.addColorStop(1, "#E4E7E1");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 2);
  for (i = 0; i < 26; i++) { x = (i / 25) * W * 1.1 - W * 0.05; y = HZ - 12 - Math.abs(Math.sin(i * 1.7)) * 16;
    g.fillStyle = i % 3 ? "rgba(214,221,224,.55)" : "rgba(196,205,212,.45)"; g.beginPath(); g.ellipse(x, y, 60 + (i % 4) * 18, 14 + (i % 3) * 5, 0, 0, 7); g.fill(); }
  // a faint far headland
  g.fillStyle = "rgba(120,146,148,.45)"; g.beginPath(); g.moveTo(W * 0.42, HZ);
  g.quadraticCurveTo(W * 0.47, HZ - 13, W * 0.51, HZ - 8); g.quadraticCurveTo(W * 0.54, HZ - 11, W * 0.58, HZ); g.closePath(); g.fill();
  cliffs(g);
  // the sea, horizon to shore: grey-green, greener in the shallows
  var sea = g.createLinearGradient(0, HZ, 0, G.shoreY + 20);
  sea.addColorStop(0, "#9DB8B1"); sea.addColorStop(0.3, "#79A29A"); sea.addColorStop(0.8, "#7FAE9F"); sea.addColorStop(1, "#A6C9B5");
  g.fillStyle = sea; g.fillRect(0, HZ, W, G.shoreY + 30 - HZ);
  g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(0, HZ, W, 1.5);                       // the horizon's bright edge
  g.fillStyle = "rgba(255,255,255,.08)"; for (i = 0; i < 9; i++) g.fillRect(0, HZ + 14 + i * i * 3.4, W, 1.2);   // long swells
  // the beach: wet sand at the tideline, dry sand behind
  var sand = g.createLinearGradient(0, G.shoreY, 0, H);
  sand.addColorStop(0, "#CDBE98"); sand.addColorStop(0.12, "#E3D5B1"); sand.addColorStop(1, "#E0CFA6");
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, H);
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  g.lineTo(W, H); g.closePath(); g.fill();
  g.fillStyle = "rgba(150,135,100,.2)"; g.beginPath(); g.moveTo(0, H);                    // the wet band
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  for (x = W; x >= 0; x -= 16) g.lineTo(x, shore(x) + 26 + 6 * Math.sin(x / 50));
  g.closePath(); g.fill();
  for (i = 0; i < 70; i++) {                                                         // soft mottles
    x = rand(0, W); y = rand(G.shoreY + 30, H);
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.08)" : "rgba(130,110,70,.06)";
    g.beginPath(); g.ellipse(x, y, rand(30, 100), rand(8, 24), 0, 0, 7); g.fill();
  }
  for (x = 10; x < W; x += rand(8, 40)) {                                            // the drift line at high water
    y = shore(x) + 38 + 6 * Math.sin(x / 60) + rand(-4, 4);
    if (onPier(x, y) || onLand(x, y) || Math.sin(x / 90) < -0.3) continue;
    g.fillStyle = pick(["#6E7F52", "#5E6F48", "#7A6E58"]); g.beginPath(); g.ellipse(x, y, rand(3, 7), rand(1.2, 2.4), rand(-0.4, 0.4), 0, 7); g.fill();
  }
  for (i = 0; i < 60; i++) {                                                         // shells and pebbles
    x = rand(0, W); y = rand(G.shoreY + 50, H - 6);
    if (S.inZone(x, y, 12) || onPier(x, y) || onLand(x, y)) continue;
    if (Math.random() < 0.35) { g.fillStyle = pick(["#FFF6EA", "#F2DCD0", "#EFE4D2"]); g.beginPath(); g.arc(x, y, 3.2, Math.PI, 0); g.fill();
      g.strokeStyle = "rgba(150,120,100,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.6, y - 2.6); g.moveTo(x, y); g.lineTo(x + 1.6, y - 2.6); g.stroke(); }
    else { g.fillStyle = pick(["#ABA79F", "#98958E", "#BDB8AE", "#8E8A86"]); g.beginPath(); g.ellipse(x, y, rand(2, 4.5), rand(1.4, 2.8), 0, 0, 7); g.fill(); }
  }
  land(g, S);
  rockPools(g, S);
  pier(g);
  boatShed(g);
  beachThings(g);
}

// The right headland: chalk cliffs with a cap of grass, and the lighthouse on top.
function cliffs(g) {
  var W = G.W, HZ = G.HZ, lh = G.lighthouse, x0 = W * 0.8;
  g.fillStyle = "#93B486"; g.beginPath(); g.moveTo(x0 - 10, HZ + 1); g.quadraticCurveTo(W * 0.86, HZ - 40, lh.x - 34, HZ - 36);
  g.lineTo(W + 10, HZ - 44); g.lineTo(W + 10, HZ + 1); g.closePath(); g.fill();
  g.fillStyle = "#F1EEE4"; g.beginPath(); g.moveTo(x0, HZ + 1); g.quadraticCurveTo(W * 0.86, HZ - 32, lh.x - 34, HZ - 30);
  g.lineTo(W + 10, HZ - 37); g.lineTo(W + 10, HZ + 1); g.closePath(); g.fill();
  g.strokeStyle = "rgba(150,150,140,.45)"; g.lineWidth = 1.2;                         // the chalk's streaks
  for (var i = 0; i < 16; i++) { var x = x0 + 30 + i * (W - x0 - 20) / 16; g.beginPath(); g.moveTo(x, HZ - 22 + Math.abs(x - W * 0.9) * 0.05); g.lineTo(x - 3, HZ - 2); g.stroke(); }
  g.fillStyle = "rgba(120,140,140,.35)"; g.fillRect(x0, HZ - 3, W - x0, 3);
  lighthouse(g, lh.x, lh.y);
}
function lighthouse(g, x, y) {
  rimmed(g, "#9A9AA3", "#F7F5EF", 1.5, function (e) { g.beginPath(); g.moveTo(x - 11 - e, y + e); g.lineTo(x - 7 - e, y - 56 - e); g.lineTo(x + 7 + e, y - 56 - e); g.lineTo(x + 11 + e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = "#D9534F"; [[-10.3, -9.4, -14, -24], [-8.8, -7.9, -36, -46]].forEach(function (b) {
    g.beginPath(); g.moveTo(x + b[0], y + b[2] + 10); g.lineTo(x + b[1], y + b[3] + 10); g.lineTo(x - b[1], y + b[3] + 10); g.lineTo(x - b[0], y + b[2] + 10); g.closePath(); g.fill(); });
  g.fillStyle = "#3E4A5A"; g.fillRect(x - 9, y - 60, 18, 4);
  g.fillStyle = "#FFE9A6"; g.fillRect(x - 6, y - 70, 12, 10);
  g.fillStyle = "#3E4A5A"; g.beginPath(); g.moveTo(x - 9, y - 70); g.lineTo(x, y - 80); g.lineTo(x + 9, y - 70); g.closePath(); g.fill();
  g.fillStyle = "#F4F2EC"; g.fillRect(x + 12, y - 10, 16, 10); g.fillStyle = "#3E4A5A"; g.fillRect(x + 11, y - 13, 18, 3);   // the keeper's cottage
}

// The land on the left: the town on its hill, the lane, the promenade on its wall, the huts.
function land(g, S) {
  var W = G.W, HZ = G.HZ, A = G.wall, i, u, t, f;
  var far = top(1), nearFoot = foot(-0.6);
  // the land itself, everything left of the wall's foot, as a grassy slope up to the town
  g.fillStyle = "#A9C39C"; g.beginPath(); g.moveTo(nearFoot.x, nearFoot.y); g.lineTo(A.x1 + 2, A.y1); g.lineTo(A.x1 + 2, HZ - 2);
  g.quadraticCurveTo(W * 0.18, HZ - 22, -10, HZ - 10); g.closePath(); g.fill();
  var gr = g.createLinearGradient(0, HZ - 30, 0, G.H); gr.addColorStop(0, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(60,90,50,.12)");
  g.fillStyle = gr; g.fill();
  // the town: a terrace of painted houses, a chapel and roofs, over the hill
  var cols = ["#E8D9C0", "#C9DCE6", "#F0C9B4", "#E6E1A8", "#D8C8E0", "#F4EEE4", "#BFD7C7"];
  for (i = 0; i < 9; i++) { var hx = 2 + i * 29, hy = HZ + 12 + i * i * 0.9, hw = 28, hh = 24 - i;
    g.fillStyle = cols[i % cols.length]; g.fillRect(hx, hy - hh, hw, hh + 12);
    g.fillStyle = i % 2 ? "#7A6A68" : "#8C5E52"; g.beginPath(); g.moveTo(hx - 2, hy - hh + 1); g.lineTo(hx + hw / 2, hy - hh - 10); g.lineTo(hx + hw + 2, hy - hh + 1); g.closePath(); g.fill();
    g.fillStyle = "#5C6A78"; g.fillRect(hx + 6, hy - hh + 7, 5, 6); g.fillRect(hx + 17, hy - hh + 7, 5, 6);
    g.fillStyle = "#8C5E52"; g.fillRect(hx + hw - 8, hy - hh - 12, 4, 7); }
  g.fillStyle = "#EDE6D8"; g.fillRect(W * 0.2, HZ - 14, 12, 28);                      // the chapel's spire
  g.fillStyle = "#6E6A72"; g.beginPath(); g.moveTo(W * 0.2 - 2, HZ - 14); g.lineTo(W * 0.2 + 6, HZ - 36); g.lineTo(W * 0.2 + 14, HZ - 14); g.closePath(); g.fill();
  // the lane up to town: from the promenade by the huts, off to the left
  var lm = G.laneMouth, lw = 13;
  g.fillStyle = "#CBBFA6"; g.beginPath(); g.moveTo(lm.x + 16, lm.y - lw); g.lineTo(-12, lm.y - 16 - lw * 0.9); g.lineTo(-12, lm.y - 16 + lw * 0.9); g.lineTo(lm.x + 16, lm.y + 4); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(lm.x, lm.y - lw * 0.45); g.lineTo(-12, lm.y - 16); g.stroke(); g.setLineDash([]);
  // the promenade's paving, between its back edge and the top of the wall
  var nearT = top(-0.6);
  g.fillStyle = "#DCD2BE"; g.beginPath(); g.moveTo(nearT.x, nearT.y);
  for (u = -0.6; u <= 1.001; u += 0.05) { t = top(u); g.lineTo(t.x, t.y); }
  for (u = 1; u >= -0.601; u -= 0.05) { t = top(u); g.lineTo(t.x - promW(u), t.y); }
  g.closePath(); g.fill();
  g.strokeStyle = "rgba(150,135,110,.35)"; g.lineWidth = 1;                         // paving joints
  for (u = -0.6; u < 1; u += 0.035) { t = top(u); g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(t.x - promW(u), t.y); g.stroke(); }
  g.fillStyle = "#C2B69D"; g.beginPath();                                            // the kerb on its back edge
  for (u = -0.6; u <= 1.001; u += 0.05) { t = top(u); if (u === -0.6) g.moveTo(t.x - promW(u), t.y); else g.lineTo(t.x - promW(u), t.y); }
  for (u = 1; u >= -0.601; u -= 0.05) { t = top(u); g.lineTo(t.x - promW(u) + 4 * scaleAt(u), t.y + 2 * scaleAt(u)); }
  g.closePath(); g.fill();
  // the wall's face, in courses of stone, and its coping
  g.fillStyle = "#A39B8B"; g.beginPath(); t = top(-0.6); g.moveTo(t.x, t.y);
  for (u = -0.6; u <= 1.001; u += 0.05) { t = top(u); g.lineTo(t.x, t.y); }
  for (u = 1; u >= -0.601; u -= 0.05) { f = foot(u); g.lineTo(f.x, f.y); }
  g.closePath(); g.fill();
  g.strokeStyle = "rgba(110,100,85,.35)"; g.lineWidth = 1;
  [0.33, 0.66].forEach(function (k) { g.beginPath(); for (var uu = -0.6; uu <= 1.001; uu += 0.05) { var ff = foot(uu), yy = ff.y - wallH(uu) * k; if (uu === -0.6) g.moveTo(ff.x, yy); else g.lineTo(ff.x, yy); } g.stroke(); });
  for (u = -0.6; u < 1; u += 0.045) { f = foot(u); var hh = wallH(u), off = (Math.round(u / 0.045) % 2) * 0.33;
    g.beginPath(); g.moveTo(f.x + 3, f.y - hh * off); g.lineTo(f.x + 3, f.y - hh * (off + 0.33)); g.stroke(); }
  g.fillStyle = "rgba(70,90,70,.35)"; g.beginPath();                                 // weed and damp along the foot
  for (u = -0.6; u <= 1.001; u += 0.05) { f = foot(u); if (u === -0.6) g.moveTo(f.x, f.y); else g.lineTo(f.x, f.y); }
  for (u = 1; u >= -0.601; u -= 0.05) { f = foot(u); g.lineTo(f.x, f.y - wallH(u) * 0.18); }
  g.closePath(); g.fill();
  g.fillStyle = "#E6E0D2"; g.beginPath(); t = top(-0.6); g.moveTo(t.x, t.y);           // coping
  for (u = -0.6; u <= 1.001; u += 0.05) { t = top(u); g.lineTo(t.x + 1, t.y); }
  for (u = 1; u >= -0.601; u -= 0.05) { t = top(u); g.lineTo(t.x + 1, t.y + 4 * scaleAt(u)); }
  g.closePath(); g.fill();
  // the slipway, down the wall's face from the promenade to the sand
  var st = G.slipTop, sf = G.slipFoot, t3 = top(0.33), f0 = foot(0.03);
  var w3 = 16; g.fillStyle = "#C8BEA8"; g.beginPath(); g.moveTo(t3.x + 1, t3.y + 1); g.lineTo(f0.x + 1, f0.y - 2); g.lineTo(f0.x + w3 + 4, f0.y + 2); g.lineTo(t3.x + w3, t3.y + 6); g.closePath(); g.fill();
  g.strokeStyle = "rgba(120,105,80,.4)"; g.lineWidth = 1;
  for (i = 1; i < 10; i++) { var k = i / 10; g.beginPath(); g.moveTo(t3.x + 1 + (f0.x - t3.x) * k, t3.y + 1 + (f0.y - 3 - t3.y) * k); g.lineTo(t3.x + w3 + (f0.x + 4 - t3.x) * k, t3.y + 6 + (f0.y - 4 - t3.y) * k); g.stroke(); }
  void sf;
  void st;
  // the chip shop at the far end of the promenade
  chippy(g);
  // the beach huts, far to near
  G.huts.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (h) { hut(g, h); });
  // the fingerpost and bus stop at the lane's mouth: town and school that way
  fingerpost(g, G.post.x, G.post.y);
  // railings along the top of the wall (a gap for the slipway), and the lamp posts
  g.strokeStyle = "#5F9A93"; g.lineCap = "round";
  var rails = [[-0.6, 0.27], [0.34, 0.97]];
  rails.forEach(function (r) {
    for (u = r[0]; u <= r[1]; u += 0.018) { t = top(u); var s = scaleAt(u); g.lineWidth = 1 + s; g.beginPath(); g.moveTo(t.x - 1, t.y + 1); g.lineTo(t.x - 1, t.y - 13 * s); g.stroke(); }
    g.lineWidth = 2.2; g.beginPath();
    for (u = r[0]; u <= r[1] + 0.001; u += 0.03) { t = top(u); var s2 = scaleAt(u); if (u === r[0]) g.moveTo(t.x - 1, t.y - 13 * s2); else g.lineTo(t.x - 1, t.y - 13 * s2); }
    g.stroke();
  });
  G.promLamps = [];
  [0.02, 0.24, 0.48, 0.64, 0.82].forEach(function (uu) { var tt = top(uu), s = scaleAt(uu), hgt = 58 * s;
    g.strokeStyle = "#4E7F7A"; g.lineWidth = 2 + s; g.beginPath(); g.moveTo(tt.x - 3, tt.y); g.lineTo(tt.x - 3, tt.y - hgt); g.stroke();
    g.beginPath(); g.moveTo(tt.x - 3, tt.y - hgt); g.quadraticCurveTo(tt.x - 3, tt.y - hgt - 6 * s, tt.x + 5 * s, tt.y - hgt - 4 * s); g.stroke();
    g.fillStyle = "#FFF1B8"; rr(g, tt.x + 2 * s, tt.y - hgt - 4 * s, 7 * s, 8 * s, 2); g.fill();
    G.promLamps.push({ x: tt.x + 5.5 * s, y: tt.y - hgt + 0.5 * s, k: s }); });
  void S;
}
function hut(g, h) {
  var s = h.s, w = h.w, x = h.x, y = h.y, bh = 54 * s, rh = 17 * s;
  g.fillStyle = "rgba(90,80,60,.22)"; g.fillRect(x - w / 2 + 2, y - 2, w + 4, 4);
  rimmed(g, "rgba(70,60,60,.55)", h.col, 1.2, function (e) { g.fillRect(x - w / 2 - e, y - bh - e, w + 2 * e, bh + 2 * e); });
  g.fillStyle = "rgba(255,255,255,.28)"; for (var i = 1; i < 6; i++) g.fillRect(x - w / 2, y - bh + i * bh / 6, w, 0.9);   // weatherboards
  g.fillStyle = "#FBF7EE"; g.beginPath(); g.moveTo(x - w / 2 - 3 * s, y - bh + 1); g.lineTo(x, y - bh - rh); g.lineTo(x + w / 2 + 3 * s, y - bh + 1); g.closePath(); g.fill();
  g.fillStyle = h.no ? "#3E6E9E" : "#7A6A68"; g.beginPath(); g.moveTo(x - w / 2 - 1 * s, y - bh); g.lineTo(x, y - bh - rh + 3 * s); g.lineTo(x + w / 2 + 1 * s, y - bh); g.closePath(); g.fill();
  g.fillStyle = "#FBF7EE"; g.fillRect(x - w * 0.26, y - bh * 0.78, w * 0.52, bh * 0.78);   // the doors
  g.fillStyle = h.col; g.fillRect(x - w * 0.22, y - bh * 0.72, w * 0.2, bh * 0.72); g.fillRect(x + w * 0.02, y - bh * 0.72, w * 0.2, bh * 0.72);
  g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(x - w * 0.01, y - bh * 0.72, w * 0.02, bh * 0.72);
  if (h.no) {                                                                        // No. 7, the family's: a number, a flag and a bit of bunting
    g.fillStyle = "#FBF7EE"; g.beginPath(); g.arc(x, y - bh - rh * 0.35, 4.6 * s, 0, 7); g.fill();
    g.fillStyle = "#3E4A5A"; g.font = "600 " + Math.round(8 * s) + "px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(h.no), x, y - bh - rh * 0.35 + 0.5);
    g.strokeStyle = "#6B5440"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - bh - rh); g.lineTo(x, y - bh - rh - 18 * s); g.stroke();
    g.fillStyle = "#D9534F"; g.beginPath(); g.moveTo(x, y - bh - rh - 18 * s); g.lineTo(x + 11 * s, y - bh - rh - 15 * s); g.lineTo(x, y - bh - rh - 12 * s); g.closePath(); g.fill();
    var bc = ["#D9534F", "#FBF7EE", "#3E6E9E", "#F7D774"];
    for (i = 0; i < 6; i++) { var bx = x - w / 2 + (i + 0.5) * w / 6, by = y - bh + 2 + Math.sin((i + 0.5) / 6 * Math.PI) * 3;
      g.fillStyle = bc[i % 4]; g.beginPath(); g.moveTo(bx - 2.5 * s, by); g.lineTo(bx + 2.5 * s, by); g.lineTo(bx, by + 5 * s); g.closePath(); g.fill(); }
    g.fillStyle = "#E86A5B"; rr(g, x + w / 2 + 2, y - 10 * s, 8 * s, 10 * s, 2); g.fill();    // a bucket by the door
  }
}
function chippy(g) {
  var c = G.chippy, s = c.s, x = c.x, y = c.y, w = 64 * s, bh = 40 * s;
  rimmed(g, "rgba(70,60,60,.5)", "#F4F1E8", 1.2, function (e) { g.fillRect(x - w / 2 - e, y - bh - e, w + 2 * e, bh + 2 * e); });
  g.fillStyle = "#3E6E9E"; g.fillRect(x - w / 2 - 2, y - bh - 12 * s, w + 4, 12 * s);   // fascia
  g.fillStyle = "#FBF7EE"; g.font = "600 " + Math.max(6, Math.round(7.5 * s)) + "px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("FISH & CHIPS", x, y - bh - 6 * s + 0.5);
  for (var i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#FBF7EE" : "#3E6E9E"; g.fillRect(x - w / 2 + i * w / 6, y - bh, w / 6, 5 * s);
    g.beginPath(); g.arc(x - w / 2 + (i + 0.5) * w / 6, y - bh + 5 * s, w / 12, 0, Math.PI); g.fill(); }
  g.fillStyle = "#FFE29A"; g.fillRect(x - w * 0.42, y - bh * 0.62, w * 0.5, bh * 0.42);
  g.fillStyle = "#6B4A3A"; g.fillRect(x + w * 0.16, y - bh * 0.7, w * 0.22, bh * 0.7);
  g.fillStyle = "#9A9AA3"; g.fillRect(x + w * 0.3, y - bh - 22 * s, 5 * s, 12 * s);    // the fryer's chimney
  G.chipLight = { x: x - w * 0.17, y: y - bh * 0.41, w: w * 0.5, h: bh * 0.42 };
}
function fingerpost(g, x, y) {
  g.fillStyle = "rgba(90,80,60,.25)"; g.beginPath(); g.ellipse(x, y, 9, 3, 0, 0, 7); g.fill();
  g.fillStyle = "#F4F1E8"; g.fillRect(x - 2, y - 52, 4, 52);
  g.fillStyle = "#F4F1E8"; g.strokeStyle = "#3E4A5A"; g.lineWidth = 1;
  [[-1, -46, "School"], [-1, -34, "Town"], [1, -40, "Pier"]].forEach(function (a) {
    var d = a[0], yy = y + a[1], w = 38;
    g.beginPath(); g.moveTo(x, yy - 5); g.lineTo(x + d * (w - 6), yy - 5); g.lineTo(x + d * w, yy); g.lineTo(x + d * (w - 6), yy + 5); g.lineTo(x, yy + 5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#3E4A5A"; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(a[2], x + d * (w - 4) / 2, yy + 0.5); g.fillStyle = "#F4F1E8"; });
  g.fillStyle = "#3E4A5A"; g.beginPath(); g.arc(x, y - 53, 3, 0, 7); g.fill();
}

function rockPools(g, S) {
  var i, x, y;
  // the slabs the pools sit in: flat-topped rock, a dark wet edge, sand between
  var slabs = [[0.275, 0.86, 128, 44], [0.2, 0.9, 60, 34], [0.39, 0.91, 80, 34], [0.255, 0.965, 84, 28], [0.33, 0.975, 62, 22],
    [0.45, 0.955, 46, 20], [0.3, 0.79, 80, 22]];
  slabs.forEach(function (s) { var x0 = G.W * s[0], y0 = G.H * s[1];
    g.fillStyle = "rgba(70,70,60,.25)"; g.beginPath(); g.ellipse(x0 + 4, y0 + 6, s[2] + 4, s[3] + 3, 0, 0, 7); g.fill();
    g.fillStyle = "#6E6C66"; g.beginPath(); g.ellipse(x0, y0 + 3, s[2], s[3], 0, 0, 7); g.fill();
    g.fillStyle = "#9C9890"; g.beginPath(); g.ellipse(x0, y0 - 2, s[2] - 4, s[3] - 5, 0, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.ellipse(x0 - s[2] * 0.25, y0 - s[3] * 0.35, s[2] * 0.45, s[3] * 0.3, 0, 0, 7); g.fill(); });
  for (i = 0; i < 80; i++) {                                                        // texture: cracks, barnacles, lichen
    x = G.W * 0.3 + rand(-200, 220); y = G.H * 0.9 + rand(-100, 80);
    var inside = slabs.some(function (s) { var dx = (x - G.W * s[0]) / (s[2] - 8), dy = (y - G.H * s[1]) / (s[3] - 8); return dx * dx + dy * dy < 1; });
    if (!inside) continue;
    var r0 = Math.random();
    g.fillStyle = r0 < 0.45 ? "rgba(70,66,60,.3)" : r0 < 0.75 ? "rgba(200,190,120,.45)" : "rgba(240,236,226,.6)";
    g.beginPath(); g.ellipse(x, y, rand(1.5, 7), rand(1, 2.6), rand(-0.5, 0.5), 0, 7); g.fill();
  }
  [G.pool, G.pool2].forEach(function (p, n) {
    g.fillStyle = "#5E5C56"; g.beginPath(); g.ellipse(p.x, p.y, p.rx + 7, p.ry + 6, 0, 0, 7); g.fill();
    var pg = g.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry);
    pg.addColorStop(0, "#5E9590"); pg.addColorStop(1, "#8FBFB2");
    g.fillStyle = pg; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.lineCap = "round";
    g.beginPath(); g.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.35, p.rx * 0.4, p.ry * 0.25, 0, 3.6, 5.2); g.stroke();
    if (n === 0) {                                                                  // the big pool: weed, an anemone, a starfish
      g.fillStyle = "#4F7A50"; [[-0.6, 0.3], [-0.45, 0.45], [0.55, 0.4]].forEach(function (q) {
        g.beginPath(); g.ellipse(p.x + p.rx * q[0], p.y + p.ry * q[1], 9, 3.5, 0.4, 0, 7); g.fill(); });
      g.fillStyle = "#C9506E"; for (var a = 0; a < 7; a++) { g.beginPath(); g.arc(p.x + p.rx * 0.35 + Math.cos(a) * 5, p.y + p.ry * 0.25 + Math.sin(a) * 3, 2.4, 0, 7); g.fill(); }
      star(g, p.x - p.rx * 0.15, p.y + p.ry * 0.4, 7, "#E0874A");
    }
  });
  G.rocks.forEach(function (b) {                                                    // boulders, weed at their feet
    rimmed(g, "#55524C", "#8A867D", 2, function (e) { g.beginPath(); g.ellipse(b.x, b.y - b.ry * 0.35, b.rx + e, b.ry + e, 0, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.ellipse(b.x - b.rx * 0.3, b.y - b.ry * 0.75, b.rx * 0.45, b.ry * 0.3, -0.2, 0, 7); g.fill();
    g.fillStyle = "#5A7F48"; for (var k = 0; k < 5; k++) { g.beginPath(); g.ellipse(b.x - b.rx * 0.8 + k * b.rx * 0.4, b.y + b.ry * 0.45, 7, 3, rand(-0.5, 0.5), 0, 7); g.fill(); }
    g.fillStyle = "#3A3846"; for (k = 0; k < 4; k++) { g.beginPath(); g.ellipse(b.x + rand(-b.rx, b.rx) * 0.6, b.y + rand(-b.ry, b.ry) * 0.2, 3, 2, 0.5, 0, 7); g.fill(); }   // mussels
  });
  star(g, G.W * 0.43, G.H * 0.83, 6, "#D9534F");
  void S;
}
function star(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath();
  for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); }
  g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.arc(x - r * 0.15, y - r * 0.15, r * 0.18, 0, 7); g.fill();
}

// The pier: iron legs into the sea, a deck of planks, white railings, lamp posts, and the
// pavilion at the end with its green dome, where the band plays.
function pier(g) {
  var P = G.pier, i, y, s, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
  function legs(x, yTop, len, w) { g.fillStyle = "#4E5A5E"; g.fillRect(x - w / 2, yTop, w, len);
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(x, yTop + len, w * 1.3, w * 0.35, 0, 0, 7); g.fill(); }
  for (i = 0; i <= 5; i++) legs(s0[0] + 6 + (s0[1] - s0[0] - 12) * i / 5, P.y0 + 4, 22, 4);
  for (y = P.y0 + 30; y < P.y1 - 10; y += 34) {
    var k = (y - P.y0) / (P.y1 - P.y0), len = 14 + 14 * k, w = 4 + 2 * k; s = pierSpan(y);
    if (y < shore(s[0]) - 4) legs(s[0] + 2, y, Math.min(len, shore(s[0]) - y), w);
    if (y < shore(s[1]) - 4) legs(s[1] - 2, y, Math.min(len, shore(s[1]) - y), w);
    g.strokeStyle = "rgba(78,90,94,.6)"; g.lineWidth = 1.2;                            // cross bracing between the legs
    if (y < shore(s[0]) - 10) { g.beginPath(); g.moveTo(s[0] + 2, y + 2); g.lineTo(s[0] + 2, y + Math.min(len, shore(s[0]) - y) * 0.8); g.stroke(); }
  }
  g.fillStyle = "#6E5A48"; g.beginPath(); g.moveTo(s0[0] - 2, P.y0 + 6); g.lineTo(s0[1] + 2, P.y0 + 6); g.lineTo(s1[1] + 3, P.y1 + 8); g.lineTo(s1[0] - 3, P.y1 + 8); g.closePath(); g.fill();
  var dg = g.createLinearGradient(0, P.y0, 0, P.y1); dg.addColorStop(0, "#B8987A"); dg.addColorStop(1, "#CDAE88");
  g.fillStyle = dg; g.beginPath(); g.moveTo(s0[0], P.y0); g.lineTo(s0[1], P.y0); g.lineTo(s1[1], P.y1); g.lineTo(s1[0], P.y1); g.closePath(); g.fill();
  g.strokeStyle = "rgba(110,86,60,.45)"; g.lineWidth = 1.2;                         // planks, closer together far away
  for (i = 1; i < 22; i++) { y = P.y0 + (P.y1 - P.y0) * Math.pow(i / 22, 1.25); s = pierSpan(y); g.beginPath(); g.moveTo(s[0], y); g.lineTo(s[1], y); g.stroke(); }
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
  var by = P.y0 + (P.y1 - P.y0) * 0.55, bx = pierSpan(by)[0];
  g.strokeStyle = "#E86A5B"; g.lineWidth = 4; g.beginPath(); g.arc(bx, by - 12, 7, 0, 7); g.stroke();
  g.strokeStyle = "#FFFFFF"; g.lineWidth = 4; [0.4, 2.0, 3.6, 5.2].forEach(function (a) { g.beginPath(); g.arc(bx, by - 12, 7, a, a + 0.5); g.stroke(); });
  G.lamps = [];
  [0.3, 0.6, 0.92].forEach(function (f) { [0, 1].forEach(function (side) {
    var y2 = P.y0 + (P.y1 - P.y0) * f, k = f, x = pierSpan(y2)[side], h = 34 + 22 * k;
    g.strokeStyle = "#3E6E78"; g.lineWidth = 2 + k; g.beginPath(); g.moveTo(x, y2); g.lineTo(x, y2 - h); g.stroke();
    g.fillStyle = "#3E6E78"; g.fillRect(x - 4 - k, y2 - h - 2, 8 + 2 * k, 3);
    g.fillStyle = "#FFF1B8"; rr(g, x - 3 - k, y2 - h - 10 - 2 * k, 6 + 2 * k, 8 + 2 * k, 2); g.fill();
    G.lamps.push({ x: x, y: y2 - h - 6 - k, k: k });
  }); });
  // the pavilion at the far end: white walls, an open front for the band, a green dome and flags
  var kx = (s0[0] + s0[1]) / 2, ky = P.y0 + 8, pw = 116, ph = 50;
  G.pav = { x: kx, y: ky, w: pw, h: ph };
  rimmed(g, "#8C8A84", "#F4F1E8", 1.5, function (e) { g.fillRect(kx - pw / 2 - e, ky - ph - e, pw + 2 * e, ph + 2 * e); });
  g.fillStyle = "#3F4A50"; rr(g, kx - 34, ky - ph + 12, 68, ph - 12, 6); g.fill();          // the bandstage's dark mouth
  g.fillStyle = "#B8987A"; g.fillRect(kx - 34, ky - 8, 68, 8);                           // the stage
  g.fillStyle = "#F4F1E8"; [-34, 30].forEach(function (o) { g.fillRect(kx + o, ky - ph + 12, 4, ph - 12); });
  [-50, 38].forEach(function (o) { g.fillStyle = "#FFE29A"; rr(g, kx + o, ky - ph + 16, 12, 16, 5); g.fill(); });    // round-topped windows
  g.fillStyle = "#D9534F"; g.fillRect(kx - pw / 2 - 4, ky - ph - 6, pw + 8, 7);           // a red cornice
  rimmed(g, "#4F8A78", "#7FB8A4", 1.5, function (e) { g.beginPath(); g.ellipse(kx, ky - ph - 6, 44 + e, 30 + e, 0, Math.PI, 0); g.fill(); });   // verdigris dome
  g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.ellipse(kx - 14, ky - ph - 22, 10, 6, -0.5, 0, 7); g.fill();
  g.strokeStyle = "#4F8A78"; g.lineWidth = 2; g.beginPath(); g.moveTo(kx, ky - ph - 36); g.lineTo(kx, ky - ph - 52); g.stroke();
  g.fillStyle = "#D9534F"; g.beginPath(); g.moveTo(kx, ky - ph - 52); g.lineTo(kx + 13, ky - ph - 48); g.lineTo(kx, ky - ph - 44); g.closePath(); g.fill();
  [-1, 1].forEach(function (d) { var tx = kx + d * (pw / 2 - 6);                          // corner turrets
    rimmed(g, "#4F8A78", "#7FB8A4", 1.2, function (e) { g.beginPath(); g.ellipse(tx, ky - ph - 6, 9 + e, 12 + e, 0, Math.PI, 0); g.fill(); });
    g.strokeStyle = "#4F8A78"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx, ky - ph - 18); g.lineTo(tx, ky - ph - 26); g.stroke(); });
  // a string of bunting from the pavilion down the first lamps
  var l0 = G.lamps[0], l1 = G.lamps[1], bc = ["#D9534F", "#FBF7EE", "#3E6E9E", "#F7D774"];
  [[kx - pw / 2, ky - ph - 4, l0.x, l0.y + 6], [kx + pw / 2, ky - ph - 4, l1.x, l1.y + 6]].forEach(function (b) {
    g.strokeStyle = "rgba(90,90,90,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo((b[0] + b[2]) / 2, Math.max(b[1], b[3]) + 10, b[2], b[3]); g.stroke();
    for (var n = 1; n < 8; n++) { var tq = n / 8, qx = (1 - tq) * (1 - tq) * b[0] + 2 * tq * (1 - tq) * (b[0] + b[2]) / 2 + tq * tq * b[2], qy = (1 - tq) * (1 - tq) * b[1] + 2 * tq * (1 - tq) * (Math.max(b[1], b[3]) + 10) + tq * tq * b[3];
      g.fillStyle = bc[n % 4]; g.beginPath(); g.moveTo(qx - 2.5, qy); g.lineTo(qx + 2.5, qy); g.lineTo(qx, qy + 5); g.closePath(); g.fill(); } });
}

// The boat shed down by the pier: a tall black net shed, a red door, an upturned boat, a pot.
function boatShed(g) {
  var x = G.shed.x, y = G.shed.y, w = 64, h = 92;
  g.fillStyle = "rgba(80,70,50,.25)"; g.beginPath(); g.ellipse(x - 8, y + 2, 76, 12, 0, 0, 7); g.fill();
  rimmed(g, "#1F2328", "#33383E", 1.5, function (e) { g.fillRect(x - w / 2 - e, y - h - e, w + 2 * e, h + 2 * e); });
  g.fillStyle = "rgba(255,255,255,.07)"; for (var i = 1; i < 12; i++) g.fillRect(x - w / 2, y - h + i * h / 12, w, 1);
  rimmed(g, "#1F2328", "#2A2E33", 1.5, function (e) { g.beginPath(); g.moveTo(x - w / 2 - 6 - e, y - h + 2); g.lineTo(x, y - h - 30 - e); g.lineTo(x + w / 2 + 6 + e, y - h + 2); g.closePath(); g.fill(); });
  g.fillStyle = "#B8462F"; g.fillRect(x - 13, y - 40, 26, 40);
  g.fillStyle = "#FFE29A"; g.fillRect(x - 9, y - h + 14, 18, 14);
  g.strokeStyle = "#1F2328"; g.lineWidth = 1.5; g.strokeRect(x - 9, y - h + 14, 18, 14);
  g.fillStyle = "#F4F1E8"; g.font = "600 9px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BOATS", x, y - h + 6);
  G.shedWin = { x: x, y: y - h + 21 };
  // the upturned boat on trestles, left of the shed
  var bx = x - 74, by = y - 4;
  g.fillStyle = "#6B5440"; g.fillRect(bx - 22, by - 12, 3, 12); g.fillRect(bx + 20, by - 12, 3, 12);
  rimmed(g, "#24364A", "#3E6E9E", 1.5, function (e) { g.beginPath(); g.moveTo(bx - 36 - e, by - 12 + e); g.bezierCurveTo(bx - 30, by - 36 - e, bx + 22, by - 38 - e, bx + 36 + e, by - 14 + e); g.closePath(); g.fill(); });
  g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; [0.35, 0.65].forEach(function (k) { g.beginPath(); g.moveTo(bx - 36 + 6 * k, by - 12 - 4 * k); g.bezierCurveTo(bx - 28, by - 12 - 22 * k, bx + 20, by - 14 - 22 * k, bx + 36 - 6 * k, by - 14 - 4 * k); g.stroke(); });
  g.fillStyle = "#D9534F"; g.fillRect(bx - 36, by - 13, 72, 3);
  // a lobster pot and a coil of rope
  g.fillStyle = "#8C6A4A"; g.beginPath(); g.arc(x + 44, y - 2, 10, Math.PI, 0); g.fill();
  g.strokeStyle = "#5E4630"; g.lineWidth = 1; for (i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + 44 + i * 4, y - 2); g.lineTo(x + 44 + i * 2.5, y - 11); g.stroke(); }
  g.strokeStyle = "#C9B48A"; g.lineWidth = 2; g.beginPath(); g.ellipse(x - 40, y + 6, 9, 3, 0, 0, 7); g.ellipse(x - 40, y + 4, 6, 2, 0, 0, 7); g.stroke();
}

// Deckchairs, a striped windbreak, and a sandcastle with its bucket and spade.
function beachThings(g) {
  var b = G.breaker, i, n = 6;
  g.fillStyle = "rgba(120,100,60,.18)"; g.beginPath(); g.ellipse((b.x0 + b.x1) / 2, b.y + 3, (b.x1 - b.x0) / 2 + 6, 6, 0, 0, 7); g.fill();
  for (i = 0; i < n; i++) { var x0 = b.x0 + (b.x1 - b.x0) * i / n, x1 = b.x0 + (b.x1 - b.x0) * (i + 1) / n, sag = Math.sin(i * 1.3) * 2;
    g.fillStyle = ["#D9534F", "#F4F1E8", "#4F7FBF", "#F4F1E8", "#F2C14E", "#F4F1E8"][i];
    g.beginPath(); g.moveTo(x0, b.y - 30 + sag); g.lineTo(x1, b.y - 30 - sag); g.lineTo(x1, b.y); g.lineTo(x0, b.y); g.closePath(); g.fill(); }
  g.fillStyle = "#8D6440"; for (i = 0; i <= n; i++) g.fillRect(b.x0 + (b.x1 - b.x0) * i / n - 1.5, b.y - 36, 3, 38);
  G.chairs.forEach(function (c) { deckchair(g, c.x, c.y, c.col); });
  var c = G.castle;
  rimmed(g, "#C2A66C", "#E3CD98", 1.5, function (e) { g.fillRect(c.x - 26 - e, c.y - 20 - e, 52 + 2 * e, 20 + 2 * e);
    g.fillRect(c.x - 30 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e); g.fillRect(c.x + 14 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e); g.fillRect(c.x - 9 - e, c.y - 42 - e, 18 + 2 * e, 24 + 2 * e); });
  g.fillStyle = "#C2A66C"; [-30, -24, -18, 14, 20, 26, -9, -3, 3].forEach(function (o, k) { g.fillRect(c.x + o, c.y - (k < 6 ? 38 : 46), 4, 4); });
  g.fillStyle = "#9C7B4E"; rr(g, c.x - 6, c.y - 12, 12, 12, 5); g.fill();
  g.strokeStyle = "#8D6440"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(c.x, c.y - 42); g.lineTo(c.x, c.y - 58); g.stroke();
  g.fillStyle = "#D9534F"; g.beginPath(); g.moveTo(c.x, c.y - 58); g.lineTo(c.x + 12, c.y - 54); g.lineTo(c.x, c.y - 50); g.closePath(); g.fill();
  rimmed(g, "#B8462F", "#E86A5B", 1.5, function (e) { g.beginPath(); g.moveTo(c.x + 40 - e, c.y - 22 - e); g.lineTo(c.x + 60 + e, c.y - 22 - e);
    g.lineTo(c.x + 57 + e, c.y + e); g.lineTo(c.x + 43 - e, c.y + e); g.closePath(); g.fill(); });
  g.strokeStyle = "#B8462F"; g.lineWidth = 1.2; g.beginPath(); g.arc(c.x + 50, c.y - 22, 9, Math.PI, 0); g.stroke();
  g.strokeStyle = "#8D6440"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(c.x - 44, c.y - 2); g.lineTo(c.x - 56, c.y - 30); g.stroke();
  g.fillStyle = "#4E9A5A"; g.beginPath(); g.moveTo(c.x - 46, c.y); g.lineTo(c.x - 38, c.y - 6); g.lineTo(c.x - 44, c.y - 12); g.lineTo(c.x - 52, c.y - 6); g.closePath(); g.fill();
}
function deckchair(g, x, y, col) {
  g.fillStyle = "rgba(120,100,60,.2)"; g.beginPath(); g.ellipse(x + 2, y + 2, 26, 6, 0, 0, 7); g.fill();
  g.strokeStyle = "#9C7448"; g.lineWidth = 3; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 6, y - 44); g.moveTo(x + 14, y); g.lineTo(x - 8, y - 22); g.moveTo(x + 18, y); g.lineTo(x + 12, y - 16); g.stroke();
  // the canvas sling, striped
  g.save(); g.beginPath(); g.moveTo(x - 14, y - 6); g.quadraticCurveTo(x - 2, y - 14, x + 4, y - 42); g.lineTo(x + 12, y - 40); g.quadraticCurveTo(x + 6, y - 12, x - 6, y - 2); g.closePath(); g.clip();
  for (var i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#FBF7EE" : col; g.fillRect(x - 16 + i * 5, y - 46, 5, 48); }
  g.restore();
  g.strokeStyle = "rgba(60,50,40,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 14, y - 6); g.quadraticCurveTo(x - 2, y - 14, x + 4, y - 42); g.stroke();
}

// ── What moves: the sea, the gulls, the crab, the boat, the band ──────────────
var A = null;

function setup(S) {
  A = { gulls: [], crab: null, boat: null, crests: [], stars: [], t: 0, band: 0, note: 0 };
  for (var i = 0; i < 3; i++) A.gulls.push({ x: rand(0, G.W), y: rand(70, G.HZ - 30), v: rand(28, 46) * (Math.random() < 0.5 ? -1 : 1), ph: rand(0, 6), s: rand(0.8, 1.1), mode: "fly" });
  A.gulls.push({ x: G.W * 0.55, y: G.shoreY + 90, v: 0, ph: 0, s: 1, mode: "walk", tx: G.W * 0.55, ty: G.shoreY + 90, wait: 2, peck: 0 });   // the one on the sand
  A.crab = { x: G.W * 0.45, y: G.shoreY + 60, tx: G.W * 0.45, ty: G.shoreY + 60, wait: 1, hide: 0, clack: 0, ph: 0 };
  A.boat = { x: rand(G.W * 0.38, G.W * 0.6), v: 7, ph: 0 };
  for (i = 0; i < 30; i++) { var cy = rand(G.HZ + 8, G.shoreY - 12), cx = rand(0, G.W); A.crests.push({ x: cx, y: cy, l: rand(10, 26), ph: rand(0, 6) }); }
  for (i = 0; i < 40; i++) A.stars.push({ x: rand(0, G.W), y: rand(8, G.HZ - 40), s: rand(1, 2.2), ph: rand(0, 6) });
  A.crabSpr = crabSprite();
  A.glow = canvas(48, 48); var gg = A.glow.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,244,200,1)"); gr.addColorStop(0.3, "rgba(255,214,130,.55)"); gr.addColorStop(1, "rgba(255,200,110,0)");
  gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48);
  A.boatSpr = boatSprite();
  A.bandSpr = bandSprites();
  void S;
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
    if (who) { c.hide = rand(6, 12); S.puff("crumb", c.x, c.y - 4, 4, "#D8C69A"); }
    else {
      var cx = c.tx - c.x, cy = c.ty - c.y, cd = Math.sqrt(cx * cx + cy * cy);
      if (cd > 2) { var cs = Math.min(cd, 30 * dt); c.x += cx / cd * cs; c.y += cy / cd * cs; c.ph += dt * 18; }
      else if ((c.wait -= dt) < 0) {
        if (Math.random() < 0.4) c.clack = 1.2;
        var nx = c.x + rand(-120, 120), base = shore(nx);
        c.tx = Math.max(G.W * 0.36, Math.min(G.W * 0.7, nx)); c.ty = base + rand(28, 70); c.wait = rand(1, 3.5);
      }
    }
  }
  // the boat drifts along the horizon, and stays in when it storms
  var b = A.boat; b.x += b.v * (0.6 + wind) * dt; b.ph += dt; if (b.x > G.W + 60) b.x = G.W * 0.34;
  for (i = 0; i < A.crests.length; i++) { var cr = A.crests[i]; cr.x += (6 + 26 * wind) * dt * (0.4 + (cr.y - G.HZ) / (G.shoreY - G.HZ)); if (cr.x > G.W + 30) cr.x = foot(uFoot(cr.y)).x; }
  // the band plays while the music does (and a little in the evening, for the promenade)
  A.band += ((S.music || 0) > 0.5 && !asleep ? 1 : 0) * dt * 3 - dt * 1.5; A.band = Math.max(0, Math.min(1, A.band));
  if (A.band > 0.6) { A.note -= dt;
    if (A.note < 0) { A.note = rand(0.5, 1.1); var pv = G.pav; S.puff("note", pv.x + rand(-20, 20), pv.y - 40, 1, pick(["#3E6E9E", "#D9534F", "#4E9A5A", "#C9506E"])); } }
}

// How far the water reaches up the sand at x right now: the tide from the clock (a
// half-day cycle of 12 h 25 min, high around noon and midnight), and the waves.
function swash(x, time, S) {
  var d = S.now(), hrs = d.getHours() + d.getMinutes() / 60, tide = Math.cos(hrs / 12.42 * Math.PI * 2);
  var WX = S.WX || {}, big = 1 + 1.4 * (WX.wind || 0.1) + 1.2 * (WX.storm || 0);
  var wave = Math.max(0, Math.sin(time * 0.9 + x / 260)) * 10 * big + Math.sin(time * 0.37 + x / 400) * 3;
  return tide * 9 + wave + 6;
}

// The sea's moving surface, under the weather. The land and the pier stand over it, so
// both are cut out of whatever moves on the water.
function under(ctx, time, S) {
  if (!A) return;
  var W = G.W, WX = S.WX || {}, i, x, wind = WX.wind || 0.1;
  var stormy = (WX.storm || 0) > 0.4;
  if (!stormy) { var b = A.boat, bob = Math.sin(b.ph * 1.6) * 1.2; ctx.drawImage(A.boatSpr.c, b.x - A.boatSpr.w / 2, G.HZ - A.boatSpr.h + 6 + bob, A.boatSpr.w, A.boatSpr.h); }
  var P = G.pier, s0 = pierSpan(P.y0 + (P.y1 - P.y0) * 0.6), s1 = pierSpan(P.y1), y0 = P.y0 + (P.y1 - P.y0) * 0.6, A0 = G.wall, f9 = foot(-0.6);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, G.H);
  ctx.moveTo(s0[0] - 3, y0); ctx.lineTo(s0[1] + 3, y0); ctx.lineTo(s1[1] + 3, P.y1 + 8); ctx.lineTo(s1[0] - 3, P.y1 + 8); ctx.closePath();
  ctx.moveTo(f9.x - 2, f9.y); ctx.lineTo(A0.x1 - 1, A0.y1); ctx.lineTo(A0.x1 - 1, 0); ctx.lineTo(-20, 0); ctx.lineTo(-20, f9.y); ctx.closePath();
  var sh = G.shed;                                                                   // the boat shed's roof stands against the sea too
  ctx.moveTo(sh.x - 40, sh.y); ctx.lineTo(sh.x - 40, sh.y - 92); ctx.lineTo(sh.x, sh.y - 124); ctx.lineTo(sh.x + 40, sh.y - 92); ctx.lineTo(sh.x + 40, sh.y); ctx.closePath();
  ctx.clip("evenodd");
  // crests and glints, more and whiter with the wind
  ctx.strokeStyle = "rgba(255,255,255," + (0.3 + 0.45 * wind).toFixed(2) + ")"; ctx.lineCap = "round"; ctx.lineWidth = 1.6; ctx.beginPath();
  var n = Math.round(A.crests.length * (0.45 + 0.55 * wind));
  for (i = 0; i < n; i++) { var c = A.crests[i], k = (c.y - G.HZ) / (G.shoreY - G.HZ), l = c.l * (0.4 + k), on = Math.sin(time * 0.8 + c.ph);
    if (on < -0.3) continue; ctx.moveTo(c.x - l / 2, c.y); ctx.quadraticCurveTo(c.x, c.y - 2 - 2 * k, c.x + l / 2, c.y); }
  ctx.stroke();
  if (S.DARK < 0.5) { ctx.fillStyle = "rgba(255,255,240,.55)";                              // a little watery sun on the sea
    for (i = 0; i < 12; i++) { var gx = W * 0.58 + Math.sin(i * 12.9) * W * 0.12, gy = G.HZ + 10 + ((i * 37) % 100) * (G.shoreY - G.HZ - 30) / 100, tw = Math.sin(time * 3 + i * 1.7);
      if (tw > 0.65) ctx.fillRect(gx - 1.5, gy - 0.6, 3 + tw * 2, 1.2); } }
  if ((WX.rain || 0) > 0.1) { ctx.strokeStyle = "rgba(255,255,255," + (0.4 * WX.rain).toFixed(2) + ")"; ctx.lineWidth = 1; ctx.beginPath();     // rain rings on the sea
    for (i = 0; i < 14; i++) { var ry = rand(G.HZ + 20, G.shoreY - 6), rx = rand(foot(uFoot(ry)).x, W), rk = (ry - G.HZ) / (G.shoreY - G.HZ);
      ctx.moveTo(rx + 4 + 4 * rk, ry); ctx.ellipse(rx, ry, 4 + 4 * rk, 1.2 + rk, 0, 0, 7); } ctx.stroke(); }
  // the swash: water running up the wet sand and back, a foam line on its edge
  var pts = [];
  for (x = -8; x <= W + 8; x += 16) pts.push([x, shore(x) + swash(x, time, S)]);
  ctx.fillStyle = "rgba(140,190,172,.78)"; ctx.beginPath(); ctx.moveTo(-8, G.shoreY - 30);
  for (i = 0; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(W + 8, G.shoreY - 30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2.5; ctx.beginPath();
  for (i = 0; i < pts.length; i++) { if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]); }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.beginPath();          // the next wave coming in
  for (i = 0; i < pts.length; i++) { var y2 = pts[i][1] - 12 - 6 * Math.sin(time * 0.9 + pts[i][0] / 260 + 1.6); if (i) ctx.lineTo(pts[i][0], y2); else ctx.moveTo(pts[i][0], y2); }
  ctx.stroke();
  // the waves slapping the sea wall: foam along its foot, bursting up now and then
  var big = 1 + 1.6 * wind + 1.5 * (WX.storm || 0);
  ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath();
  for (var u = 0.42; u < 1; u += 0.03) { var f = foot(u), sc = 1 - 0.75 * u, burst = Math.max(0, Math.sin(time * 1.3 - u * 9)) * 9 * big * sc;
    ctx.moveTo(f.x + 3, f.y); ctx.ellipse(f.x + 3, f.y - burst * 0.4, 3 + 2 * sc, 1.5 + burst * 0.5, 0, 0, 7); }
  ctx.fill();
  if ((WX.storm || 0) > 0.05) { ctx.fillStyle = "rgba(40,55,65," + (0.25 * WX.storm).toFixed(3) + ")"; ctx.fillRect(0, G.HZ, W, G.shoreY - G.HZ + 10); }
  ctx.restore();
}

// Gulls, the crab and the band, behind the family.
function back(ctx, time, S) {
  if (!A) return;
  var i, asleep = S.nightness > 0.6;
  band(ctx, time, asleep);
  var c = A.crab;
  if (c.hide <= 0) { var sc = S.depth(c.y), cl = c.clack > 0 ? Math.abs(Math.sin(c.clack * 9)) : 0, wob = Math.sin(c.ph) * 1.2;
    ctx.save(); ctx.translate(c.x, c.y + wob * 0.3); ctx.scale(sc / K, sc / K);
    ctx.drawImage(cl > 0.5 ? A.crabSpr.up : A.crabSpr.down, -A.crabSpr.ax, -A.crabSpr.ay); ctx.restore(); }
  else if (c.hide > 0 && !asleep) {                                                  // two eyes peeping out of the sand
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(c.x - 3, c.y - 2, 1.6, 0, 7); ctx.arc(c.x + 3, c.y - 2, 1.6, 0, 7); ctx.fill(); }
  // the gulls; at night the flyers roost on the pavilion's roof and the promenade railing
  if (asleep) { var pv = G.pav, t1 = top(0.12);
    [[pv.x - 30, pv.y - pv.h - 8, 1], [pv.x + 34, pv.y - pv.h - 8, -1], [t1.x - 2, t1.y - 12, 1]].forEach(function (r) { gullStand(ctx, r[0], r[1], S.depth(r[1]) * 0.75, r[2], false, true, 0); }); }
  for (i = 0; i < A.gulls.length; i++) { var g = A.gulls[i];
    if (g.mode === "fly" && asleep) continue;
    if (g.mode === "fly") gullFly(ctx, g.x, g.y, g.s * (0.7 + 0.3 * (g.y / G.HZ)), Math.sin(g.ph), g.v >= 0 ? 1 : -1);
    else gullStand(ctx, g.x, g.y, S.depth(g.y), g.face || 1, g.peck > 0, asleep, time + g.ph); }
}

// Three bandsmen on the pavilion's stage: a drum, a trumpet and a tuba. They stand easy when
// nothing is playing and sway on the beat when the speaker is.
function band(ctx, time, asleep) {
  var pv = G.pav, on = A.band, spr = A.bandSpr;
  if (asleep) return;
  for (var i = 0; i < 3; i++) { var bx = pv.x - 20 + i * 20, by = pv.y - 6, beat = on * Math.max(0, Math.sin(time * 6.3 + i * 1.3)), sway = on * Math.sin(time * 3.1 + i) * 0.08;
    ctx.save(); ctx.translate(bx, by - beat * 2.5); ctx.rotate(sway); ctx.drawImage(spr[i], -spr.ax, -spr.ay, spr[i].width / K, spr[i].height / K); ctx.restore(); }
}
function bandSprites() {
  function one(kind) {
    var w = 22, h = 34, c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K);
    var x = 11, y = h - 1;
    g.fillStyle = "#2B3A55"; g.fillRect(x - 4, y - 8, 3, 8); g.fillRect(x + 1, y - 8, 3, 8);           // trousers
    rimmed(g, "#8E2F2A", "#D9534F", 1, function (e) { rr(g, x - 6 - e, y - 20 - e, 12 + 2 * e, 13 + 2 * e, 3); g.fill(); });   // red jacket
    g.fillStyle = "#F2C14E"; g.fillRect(x - 0.6, y - 19, 1.2, 11);
    g.fillStyle = "#F2D2B4"; g.beginPath(); g.arc(x, y - 24, 4.6, 0, 7); g.fill();                   // face
    g.fillStyle = "#2B3A55"; g.fillRect(x - 5, y - 31, 10, 5); g.fillRect(x - 6, y - 27, 12, 1.6);    // peaked cap
    g.fillStyle = "#2B2433"; g.beginPath(); g.arc(x - 1.6, y - 24, 0.8, 0, 7); g.arc(x + 1.8, y - 24, 0.8, 0, 7); g.fill();
    g.fillStyle = "#E6B84A"; g.strokeStyle = "#B88A2A"; g.lineWidth = 1;
    if (kind === 0) { g.fillStyle = "#F4F1E8"; g.beginPath(); g.ellipse(x, y - 11, 7, 6, 0, 0, 7); g.fill(); g.strokeStyle = "#D9534F"; g.lineWidth = 1.4; g.stroke(); }   // the drum
    else if (kind === 1) { g.fillRect(x + 2, y - 24, 9, 2); g.beginPath(); g.moveTo(x + 10, y - 26); g.lineTo(x + 13, y - 27.5); g.lineTo(x + 13, y - 20.5); g.lineTo(x + 10, y - 22); g.closePath(); g.fill(); }  // trumpet
    else { g.beginPath(); g.ellipse(x - 3, y - 14, 5, 6, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(x - 4, y - 25, 4.5, 0, 7); g.fill(); g.stroke(); }                     // tuba
    return c;
  }
  var out = [one(0), one(1), one(2)]; out.ax = 11; out.ay = 33; return out;
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
  ctx.fillStyle = "#C9CFD6"; ctx.beginPath(); ctx.ellipse(-3, -12 - bob, 9, 6, -0.15, 0, 7); ctx.fill();
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(1, -11 - bob, 8, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#3E4450"; ctx.beginPath(); ctx.moveTo(-12, -14 - bob); ctx.lineTo(-6, -12 - bob); ctx.lineTo(-11, -10 - bob); ctx.fill();
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
    [-1, 1].forEach(function (s) {
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
// A little fishing boat: a red-brown sail and a tan hull.
function boatSprite() {
  var w = 44, h = 46, c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K);
  g.fillStyle = "#B5583A"; g.beginPath(); g.moveTo(22, 6); g.lineTo(22, 34); g.lineTo(8, 34); g.closePath(); g.fill();
  g.fillStyle = "#C98A5A"; g.beginPath(); g.moveTo(24, 12); g.lineTo(24, 34); g.lineTo(34, 34); g.closePath(); g.fill();
  g.strokeStyle = "#4E3A2A"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(23, 3); g.lineTo(23, 38); g.stroke();
  g.fillStyle = "#3E4A5A"; g.beginPath(); g.moveTo(4, 37); g.lineTo(40, 37); g.lineTo(35, 44); g.lineTo(9, 44); g.closePath(); g.fill();
  g.fillStyle = "#F4F1E8"; g.fillRect(6, 37, 32, 1.6);
  return { c: c, w: w * 0.62, h: h * 0.62 };
}

// Lights over the dusk: stars, a moon and its path on the sea, the lighthouse sweeping, the
// lamps along the pier and the promenade, the pavilion's windows and the chip shop.
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W;
  if (D <= 0.02) return;
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.stars.length; i++) { var st = A.stars[i], tw = 0.55 + 0.45 * Math.sin(time * 1.4 + st.ph);
    ctx.globalAlpha = D * tw * 0.8; ctx.fillRect(st.x, st.y, st.s, st.s); }
  var mx = W * 0.56, my = 112;
  ctx.globalAlpha = D; ctx.fillStyle = "#FFF8DC"; ctx.beginPath(); ctx.arc(mx, my, 17, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(230,222,190,.7)"; ctx.beginPath(); ctx.arc(mx - 5, my - 3, 3.5, 0, 7); ctx.arc(mx + 6, my + 5, 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = "#FFF3C4";
  for (i = 0; i < 16; i++) { var py = G.HZ + 6 + i * (G.shoreY - G.HZ - 16) / 16, pw = 8 + i * 3.2, jit = Math.sin(time * 2 + i * 1.9) * (4 + i);
    ctx.globalAlpha = D * (0.55 - i * 0.022); ctx.fillRect(mx - pw / 2 + jit, py, pw, 2); }
  var lh = G.lighthouse, lx = lh.x, ly = lh.y - 65, a = time * 0.7, face = Math.cos(a), len = 460 * Math.abs(Math.sin(a)) + 30, dir = Math.sin(a) > 0 ? -1 : 1;
  ctx.globalCompositeOperation = "lighter";
  var bg = ctx.createLinearGradient(lx, 0, lx + dir * len, 0);
  bg.addColorStop(0, "rgba(255,240,190,.42)"); bg.addColorStop(1, "rgba(255,240,190,0)");
  ctx.globalAlpha = D * (0.35 + 0.45 * Math.max(0, face)); ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(lx, ly - 2); ctx.lineTo(lx + dir * len, ly - 16); ctx.lineTo(lx + dir * len, ly + 12); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = D * (0.7 + 0.3 * Math.max(0, face)); ctx.drawImage(A.glow, lx - 20, ly - 20, 40, 40);
  var lamps = G.lamps.concat(G.promLamps);
  for (i = 0; i < lamps.length; i++) { var l = lamps[i], r = 10 + 14 * (l.k > 0.99 ? 0.7 : l.k);
    ctx.globalAlpha = D * 0.95; ctx.drawImage(A.glow, l.x - r, l.y - r, r * 2, r * 2); }
  var pv = G.pav;
  [-44, 44].forEach(function (o) { ctx.globalAlpha = D * 0.8; ctx.drawImage(A.glow, pv.x + o - 14, pv.y - pv.h + 10, 28, 28); });
  ctx.globalAlpha = D * 0.6; ctx.drawImage(A.glow, pv.x - 30, pv.y - pv.h, 60, 50);
  var cl = G.chipLight; ctx.globalAlpha = D * 0.7; ctx.drawImage(A.glow, cl.x - cl.w, cl.y - cl.w, cl.w * 2, cl.w * 2);
  ctx.globalAlpha = D * 0.6; ctx.drawImage(A.glow, G.shedWin.x - 16, G.shedWin.y - 16, 32, 32);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = D * 0.85; ctx.fillStyle = "#FFE29A";
  [-50, 38].forEach(function (o) { rr(ctx, pv.x + o, pv.y - pv.h + 16, 12, 16, 5); ctx.fill(); });
  ctx.fillRect(cl.x - cl.w / 2, cl.y - cl.h / 2, cl.w, cl.h);
  ctx.fillRect(G.shedWin.x - 9, G.shedWin.y - 7, 18, 14);
  ctx.globalAlpha = 1;
}

// On and off the pier by its landward end, and on and off the promenade by the slipway;
// the sea is not for walking on. regionOf: "pier", "prom" or "sand".
function regionOf(x, y) { return onPier(x, y) ? "pier" : onProm(x, y) || onLand(x, y) ? "prom" : "sand"; }
function near(t, p, dx, dy) { return Math.abs(t.x - p.x) < dx && Math.abs(t.y - p.y) < dy; }
function via(t, dest) {
  var a = regionOf(t.x, t.y), b = regionOf(dest.x, dest.y);
  if (a === b) return null;
  var pf = { x: (pierSpan(G.pier.y1)[0] + pierSpan(G.pier.y1)[1]) / 2, y: G.pier.y1 + 16 }, sf = G.slipFoot, st = G.slipTop;
  if (a === "pier") return near(t, pf, 36, 22) ? null : pf;
  if (a === "prom") return near(t, st, 20, 14) ? sf : st;
  // on the sand
  if (b === "pier") return near(t, pf, 36, 22) ? null : pf;
  return near(t, sf, 22, 14) ? st : sf;
}

export default {
  id: "seaside", label: "Seaside",
  shadow: "100,85,55",                                       // warm-grey shadows on the sand
  depth: [0.64, 0.36],                                       // a deeper view than the meadow's, so the pier reads as going out to sea
  creatures: ["otter", "shark", "crow", "capybara", "snail", "fox", "hedgehog"],
  bake: function (g, S) { bake(g, S); },
  // spread over the beach, the pier, the promenade and the rocks
  start: function (i, S) {
    var P = G.pier, slots = [[0.47, 0.7], ["prom", 0.18], ["pier", 0.62], [0.58, 0.74], [0.68, 0.86], ["pier", 0.36], [0.34, 0.86], [0.42, 0.78]];
    var s = slots[i % slots.length];
    if (s[0] === "pier") { var y = P.y0 + (P.y1 - P.y0) * s[1], sp = pierSpan(y); return { x: (sp[0] + sp[1]) / 2, y: y }; }
    if (s[0] === "prom") { var t = top(s[1]); return { x: t.x - promW(s[1]) * 0.5, y: t.y + 1 }; }
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  swimSpot: function (S) { var p = G.pool; void S; return { x: p.x + rand(-p.rx * 0.5, p.rx * 0.5), y: p.y - p.ry - 48 }; },
  via: function (t, dest) { return via(t, dest); },
  // The landmarks a tap opens: the fingerpost up the lane to school, the boat shed (the
  // workshop), the band in the pier's pavilion, beach hut No. 7 (home) and the lighthouse
  // (the office, where someone keeps watch).
  hotspots: {
    school:  { box: function () { var p = G.post; return [p.x - 46, p.y - 64, p.x + 46, p.y + 14]; },
               tap: function (S) { var p = G.post; S.say("ding!", p.x, p.y - 72); } },
    printer: { box: function () { var s = G.shed; return [s.x - 112, s.y - 132, s.x + 58, s.y + 14]; },
               tap: function (S) { var s = G.shed; S.puff("chip", s.x, s.y - 50, 6, "#C9A877"); } },
    music:   { box: function () { var p = G.pav; return [p.x - p.w / 2 - 6, p.y - p.h - 56, p.x + p.w / 2 + 6, p.y + 14]; },
               tap: function (S) { var p = G.pav; S.puff("note", p.x + rand(-24, 24), p.y - 40, 5, "#D9534F"); } },
    home:    { box: function () { var h = G.home; return [h.x - Math.max(40, h.w * 0.8), h.y - 90, h.x + Math.max(40, h.w * 0.8), h.y + 12]; },
               tap: function (S) { var h = G.home; S.puff("heart", h.x, h.y - 50, 3, "#FF7FA0"); } },
    office:  { box: function () { var l = G.lighthouse; return [l.x - 40, l.y - 92, l.x + 40, l.y + 12]; },
               tap: function (S) { var l = G.lighthouse; S.say("beep!", l.x, l.y - 96); } }
  },
  weather: {
    // snow lies on the sand, the pier deck and the promenade, never on the sea; and someone builds a snowman
    ground: function (ctx, S, WX) {
      if (WX.snow <= 0.02) return;
      var x, u, t, P = G.pier, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
      ctx.fillStyle = "rgba(246,249,255," + (0.55 * WX.snow).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(0, G.H);
      for (x = 0; x <= G.W; x += 16) ctx.lineTo(x, shore(x) + 30);
      ctx.lineTo(G.W, G.H); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s0[0], P.y0); ctx.lineTo(s0[1], P.y0); ctx.lineTo(s1[1], P.y1); ctx.lineTo(s1[0], P.y1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); t = top(-0.6); ctx.moveTo(t.x, t.y);
      for (u = -0.6; u <= 1.001; u += 0.05) { t = top(u); ctx.lineTo(t.x, t.y); }
      for (u = 1; u >= -0.601; u -= 0.05) { t = top(u); ctx.lineTo(t.x - promW(u), t.y); }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = WX.snow; S.blit(S.sprites.snowman, G.W * 0.585, G.H - 54, 1, 1, 1, 1); ctx.globalAlpha = 1;
    }
  },
  ambient: { setup: setup, update: update, under: under, back: back, light: light }
};
