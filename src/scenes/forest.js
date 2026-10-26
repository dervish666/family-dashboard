// The forest camp: a clearing in a British wood. Firs and an old oak round the edges, a
// stream running down the right into a pool, the family's bell tent on the left with bunting
// and a lantern at the door, a little orange tent across the way, and in the middle the
// campfire with its log seats, a kettle on a tripod and a guitar leaning on a log. A string
// of paper lanterns hangs across the back of the clearing, the woodpile and the sawhorse
// stand by the trees, and up in the oak is the lookout. The trail leaves past the fingerpost
// on the left. By day a squirrel runs about, butterflies drift and a duck paddles on the pool;
// at dusk the fire throws its light on everyone round it, the lanterns come on, fireflies rise
// and two owls wake up in the trees. When the speaker plays, the fire leaps and notes rise.
//
// No village population: school and away duties go up the trail past the fingerpost and off
// the left edge. The swimmers dive in the pool.
import { rand, pick, rr, rimmed, canvas, K, aoShadow } from "../engine/draw.js";
import { around } from "../engine/route.js";

var G = null;

// The stream's centre line and width at k (0 at the back, 1 at the bottom edge).
function streamAt(k) {
  var P = G.stream, u = 1 - k;
  var x = u * u * u * P[0][0] + 3 * u * u * k * P[1][0] + 3 * u * k * k * P[2][0] + k * k * k * P[3][0];
  var y = u * u * u * P[0][1] + 3 * u * u * k * P[1][1] + 3 * u * k * k * P[2][1] + k * k * k * P[3][1];
  return { x: x, y: y, w: 12 + 52 * k * k };
}
// The stream's west bank at screen height y (the stream runs down the card, top to bottom).
function westBank(y) {
  var T = G.bank, i = Math.max(0, Math.min(T.length - 1, Math.round((y - T.y0) / T.dy)));
  return T[i];
}
function layout(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP, B = TOP + 30;
  G = { W: W, H: H, HZ: HZ, TOP: TOP, B: B, lanterns: [] };
  G.stream = [[W * 0.79, B - 22], [W * 0.68, H * 0.52], [W * 0.9, H * 0.66], [W * 0.82, H + 16]];
  G.pool = { x: Math.round(W * 0.835), y: Math.round(H * 0.865), rx: Math.min(104, W * 0.085), ry: 32 };
  G.tent = { x: Math.round(W * 0.27), y: Math.round(H * 0.57) };
  G.tent2 = { x: Math.round(W * 0.6), y: Math.round(B + 50) };
  G.fire = { x: Math.round(W * 0.5), y: Math.round(H * 0.68) };
  G.wood = { x: Math.round(W * 0.43), y: B + 22 };
  G.oak = { x: Math.round(W * 0.95), y: Math.round(H * 0.82) };
  G.look = { x: G.oak.x - 26, y: 262 };
  G.post = { x: Math.round(W * 0.12), y: B + 58 };
  var f = G.fire, t = G.tent, t2 = G.tent2;
  var zones = [{ x: f.x, y: f.y - 6, rx: 128, ry: 46 }, { x: t.x, y: t.y - 34, rx: 112, ry: 58 }, { x: t2.x, y: t2.y - 20, rx: 66, ry: 32 },
    { x: G.wood.x, y: G.wood.y - 6, rx: 70, ry: 22 }, { x: G.pool.x, y: G.pool.y, rx: G.pool.rx, ry: G.pool.ry },
    { x: G.oak.x, y: G.oak.y - 10, rx: 60, ry: 24 }];
  for (var k = 0; k <= 1.001; k += 0.07) { var s = streamAt(k); zones.push({ x: s.x, y: s.y, rx: s.w / 2 + 8, ry: 12 + 6 * k }); }
  // the west bank, row by row: the family's ground stops short of the water
  var T = []; T.y0 = B; T.dy = 4;
  for (var y = B; y <= H + 4; y += 4) { var bx = W, kk; for (kk = 0; kk <= 1.0001; kk += 0.01) { var q = streamAt(kk); if (Math.abs(q.y - y) < 6) bx = Math.min(bx, q.x - q.w / 2); } T.push(bx); }
  for (var j = 1; j < T.length; j++) if (T[j] >= W) T[j] = T[j - 1];
  G.bank = T;
  G.big = zones.slice(0, 6);
  var clear = { has: function (x, y) { return y > B + 40 && y < H - 24 && x > 50 && x < westBank(y) - 26 && !(x > W * 0.6 && y < B + 90); },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(60, W * 0.88), y = rand(B + 46, H - 30); if (clear.has(x, y)) return { x: x, y: y }; } return { x: W * 0.4, y: H * 0.8 }; } };
  return {
    lay: { fire: zones[0], school: { x: G.post.x, y: G.post.y, tag: G.post.y - 70, cut: [G.post.x - 110, G.post.y - 140, 240, 180] } },
    zones: zones, water: G.pool,
    patch: [clear], roam: [clear],
    home: { x: W * 0.42, y: H * 0.86 },
    // up the trail past the fingerpost, and off the left edge into the wood
    exit: { x: G.post.x + 34, y: G.post.y + 6, off: { x: -60, y: G.post.y - 10 } }
  };
}

// ── The background, baked once per size ───────────────────────────────────────
function bake(g, S) {
  var L = layout(S), W = S.W, H = S.H, HZ = S.HZ, B = G.B, i, x, y;
  S.place(L);
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#9CCBE2"); sky.addColorStop(0.65, "#D3E9E3"); sky.addColorStop(1, "#EEF1D8");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 40);
  var sg = g.createRadialGradient(W * 0.3, 20, 0, W * 0.3, 20, HZ);                                   // the sun, up and to the left
  sg.addColorStop(0, "rgba(255,250,215,.6)"); sg.addColorStop(0.5, "rgba(255,248,210,.16)"); sg.addColorStop(1, "rgba(255,248,210,0)");
  g.fillStyle = sg; g.fillRect(0, 0, W, HZ + 40);
  hills(g, HZ - 36, 20, "#CFE0D4", 0.4);                                                              // a far ridge in the haze
  hills(g, HZ - 22, 22, "#BCD6C6", 1.1); hills(g, HZ - 4, 14, "#A6C8B2", 3.3);
  // the far wood, pale with distance
  for (i = 0; i < 52; i++) { x = (i / 51) * W * 1.04 - 20 + Math.sin(i * 5.1) * 8; fir(g, x, HZ + 14 + Math.abs(Math.sin(i * 1.9)) * 6, 34 + Math.abs(Math.sin(i * 3.3)) * 22, i % 2 ? "#8FB5A0" : "#86AE99", false); }
  var hz = g.createLinearGradient(0, HZ - 30, 0, HZ + 40); hz.addColorStop(0, "rgba(220,238,228,.5)"); hz.addColorStop(1, "rgba(220,238,228,0)");   // the air in front of it
  g.fillStyle = hz; g.fillRect(0, HZ - 30, W, 70);
  // the clearing: grass, lighter in the middle where the sun gets in, darker under the trees
  var gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, "#9CC583"); gr.addColorStop(0.35, "#A7CF88"); gr.addColorStop(1, "#86BC72");
  g.fillStyle = gr; g.fillRect(0, HZ + 18, W, H - HZ);
  var sun = g.createRadialGradient(W * 0.48, H * 0.62, 20, W * 0.48, H * 0.62, W * 0.5);
  sun.addColorStop(0, "rgba(255,250,210,.28)"); sun.addColorStop(1, "rgba(255,250,210,0)");
  g.fillStyle = sun; g.fillRect(0, HZ, W, H);
  for (i = 0; i < 70; i++) { g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,220,.08)" : "rgba(40,90,40,.07)";
    g.beginPath(); g.ellipse(rand(0, W), rand(HZ + 30, H), rand(30, 110), rand(8, 26), 0, 0, 7); g.fill(); }
  var vg = g.createRadialGradient(W * 0.48, H * 0.64, H * 0.22, W * 0.48, H * 0.64, W * 0.68);        // darker under the trees at the edges
  vg.addColorStop(0, "rgba(15,50,25,0)"); vg.addColorStop(1, "rgba(15,50,25,.2)");
  g.fillStyle = vg; g.fillRect(0, HZ + 18, W, H - HZ);
  // the near wood along the back edge: a band of firs and bushes, taller on the right
  for (i = 0; i < 30; i++) { x = (i / 29) * W * 1.02 - 10; var big = x > W * 0.7 ? 1.5 : x < W * 0.2 ? 0.9 : 0.75;
    fir(g, x, B - 4 + Math.sin(i * 2.3) * 3, (60 + Math.abs(Math.sin(i * 4.1)) * 40) * big, i % 2 ? "#4E8A62" : "#5A9468", false); }
  for (i = 0; i < 26; i++) bush(g, (i / 25) * W, B + 4 + Math.sin(i * 3.7) * 4, 14 + Math.abs(Math.sin(i * 2.9)) * 10, i % 3 ? "#5E9A5E" : "#6AA66A");
  shadowBand(g, B);
  [[0.22, 0.46], [0.3, 0.55], [0.38, 0.64]].forEach(function (b, n) {                                 // sunbeams through the trees
    var bg = g.createLinearGradient(0, B - 40, 0, H * 0.78); bg.addColorStop(0, "rgba(255,250,210," + (0.11 - n * 0.02) + ")"); bg.addColorStop(1, "rgba(255,250,210,0)");
    g.fillStyle = bg; g.beginPath(); g.moveTo(W * b[0] - 14, B - 40); g.lineTo(W * b[0] + 14, B - 40); g.lineTo(W * b[1] + 70, H * 0.78); g.lineTo(W * b[1] - 10, H * 0.78); g.closePath(); g.fill(); });
  trail(g);
  stream(g);
  // flowers, ferns, tufts and toadstools, kept off the furniture
  for (i = 0; i < 120; i++) { x = rand(0, W); y = rand(B + 30, H);
    if (S.inZone(x, y, 18) || onTrail(x, y)) continue;
    g.strokeStyle = "rgba(52,110,50,.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y - 7); g.lineTo(x, y); g.lineTo(x + 1, y - 9); g.moveTo(x, y); g.lineTo(x + 5, y - 6); g.stroke(); }
  for (i = 0; i < 46; i++) { x = rand(0, W); y = rand(B + 30, H - 6);
    if (S.inZone(x, y, 16) || onTrail(x, y)) continue;
    var fc = pick(["#FFFFFF", "#FFF3A8", "#B8A8F2", "#8FA8F0"]);
    g.fillStyle = fc; for (var p = 0; p < 5; p++) { var a = p / 5 * 6.283; g.beginPath(); g.arc(x + Math.cos(a) * 2.8, y + Math.sin(a) * 2.8, 2.2, 0, 7); g.fill(); }
    g.fillStyle = "#F4B63C"; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill(); }
  [[0.04, 0.72], [0.17, 0.96], [0.65, 0.97], [0.36, 0.68], [0.7, 0.62], [0.98, 0.62]].forEach(function (f) { fern(g, W * f[0], H * f[1], 1); });
  [[0.085, 0.86], [0.095, 0.875], [0.58, 0.9], [0.92, 0.62], [0.4, 0.95]].forEach(function (m) { toadstool(g, W * m[0], H * m[1], 1); });
  // the furniture, back to front
  lanternString(g);
  woodpile(g, G.wood.x, G.wood.y);
  smallTent(g, G.tent2.x, G.tent2.y);
  fingerpost(g, G.post.x, G.post.y);
  bellTent(g, G.tent.x, G.tent.y);
  campfire(g, G.fire.x, G.fire.y);
  canoe(g, G.pool.x - G.pool.rx - 30, G.pool.y - 30);
  oak(g, G.oak.x, G.oak.y);
  // where snow can lie: the clearing, less the stream and the pool
  G.snowMask = canvas(W, H); var m = G.snowMask.getContext("2d"), k, s, left = [], right = [];
  var mg = m.createLinearGradient(0, B - 14, 0, B + 26); mg.addColorStop(0, "rgba(246,249,255,0)"); mg.addColorStop(1, "#F6F9FF");
  m.fillStyle = mg; m.fillRect(0, B - 14, W, H);
  m.globalCompositeOperation = "destination-out"; m.fillStyle = "#000";
  for (k = 0; k <= 1.0001; k += 0.05) { s = streamAt(k); left.push([s.x - s.w / 2, s.y]); right.push([s.x + s.w / 2, s.y]); }
  m.beginPath(); m.moveTo(left[0][0], left[0][1]); left.forEach(function (q) { m.lineTo(q[0], q[1]); }); for (k = right.length - 1; k >= 0; k--) m.lineTo(right[k][0], right[k][1]); m.closePath(); m.fill();
  m.beginPath(); m.ellipse(G.pool.x, G.pool.y, G.pool.rx, G.pool.ry, 0, 0, 7); m.fill();
}

function hills(g, y, amp, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, G.H);
  for (var x = 0; x <= G.W; x += 16) g.lineTo(x, y - amp * (0.6 * Math.sin(x / 230 + seed) + 0.4 * Math.sin(x / 101 + seed * 2.3)));
  g.lineTo(G.W, G.H); g.closePath(); g.fill();
}
function fir(g, x, y, h, col, edge) {
  var w = h * 0.36;
  g.fillStyle = "#5A4636"; g.fillRect(x - h * 0.03, y - h * 0.14, h * 0.06, h * 0.16);
  for (var k = 0; k < 4; k++) { var ty = y - h * 0.1 - k * h * 0.22, tw = w * (1 - k * 0.2);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - tw, ty); g.quadraticCurveTo(x - tw * 0.3, ty - h * 0.12, x, ty - h * 0.34); g.quadraticCurveTo(x + tw * 0.3, ty - h * 0.12, x + tw, ty);
    g.quadraticCurveTo(x, ty + h * 0.04, x - tw, ty); g.fill();
    g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.moveTo(x - tw * 0.7, ty - 2); g.quadraticCurveTo(x - tw * 0.3, ty - h * 0.1, x, ty - h * 0.3); g.lineTo(x - tw * 0.1, ty - h * 0.06); g.closePath(); g.fill(); }
  void edge;
}
function bush(g, x, y, r, col) {
  [[0, 0, 1], [-0.75, 0.3, 0.7], [0.75, 0.3, 0.75]].forEach(function (p) { g.fillStyle = col; g.beginPath(); g.arc(x + p[0] * r, y + p[1] * r - r * 0.4, r * p[2], 0, 7); g.fill(); });
  g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.8, r * 0.35, 0, 7); g.fill();
}
function shadowBand(g, B) {
  var sh = g.createLinearGradient(0, B, 0, B + 70); sh.addColorStop(0, "rgba(30,70,40,.22)"); sh.addColorStop(1, "rgba(30,70,40,0)");
  g.fillStyle = sh; g.fillRect(0, B, G.W, 70);
}
// The trail: from the bottom of the clearing up past the fingerpost and off to the left.
function trailPts() { var W = G.W, H = G.H, B = G.B; return [[W * 0.4, H + 20], [W * 0.3, H * 0.74], [W * 0.1, B + 110], [-20, B + 48]]; }
function trailAt(k) { var P = trailPts(), u = 1 - k;
  return { x: u * u * u * P[0][0] + 3 * u * u * k * P[1][0] + 3 * u * k * k * P[2][0] + k * k * k * P[3][0], y: u * u * u * P[0][1] + 3 * u * u * k * P[1][1] + 3 * u * k * k * P[2][1] + k * k * k * P[3][1] }; }
function onTrail(x, y) { for (var k = 0; k <= 1; k += 0.05) { var p = trailAt(k); if (Math.abs(p.x - x) < 26 && Math.abs(p.y - y) < 14) return true; } return false; }
function trail(g) {
  var P = trailPts();
  g.lineCap = "round"; g.lineJoin = "round";
  [[46, "rgba(60,90,40,.14)"], [40, "rgba(150,120,80,.35)"], [32, "#D9C49A"], [16, "rgba(240,225,190,.5)"]].forEach(function (s) {
    g.strokeStyle = s[1]; g.lineWidth = s[0]; g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); g.stroke(); });
  for (var i = 0; i < 40; i++) { var p = trailAt(rand(0, 1)); g.fillStyle = pick(["#B8A27A", "#A89070", "#C9B590"]);
    g.beginPath(); g.ellipse(p.x + rand(-12, 12), p.y + rand(-5, 5), rand(1.5, 3), rand(1, 2), 0, 0, 7); g.fill(); }
}
function stream(g) {
  var k, s, left = [], right = [];
  for (k = 0; k <= 1.0001; k += 0.025) { s = streamAt(k); left.push([s.x - s.w / 2, s.y]); right.push([s.x + s.w / 2, s.y]); }
  var p = G.pool;
  // the banks: a darker edge of mud and pebbles, then the water
  function band(grow, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(left[0][0] - grow, left[0][1]);
    left.forEach(function (q) { g.lineTo(q[0] - grow, q[1]); }); for (var i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0] + grow, right[i][1]); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(p.x, p.y, p.rx + grow, p.ry + grow * 0.6, 0, 0, 7); g.fill(); }
  band(9, "#7A9A62"); band(5, "#A8936E");
  var wg = g.createLinearGradient(0, G.B, 0, G.H); wg.addColorStop(0, "#8FC6CC"); wg.addColorStop(1, "#5FAABA");
  band(0, wg);
  g.strokeStyle = "rgba(30,90,110,.22)"; g.lineCap = "round";                                          // deeper down the middle
  for (k = 0.05; k < 1; k += 0.05) { s = streamAt(k); var s2 = streamAt(k + 0.05); g.lineWidth = s.w * 0.45; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s2.x, s2.y); g.stroke(); }
  var dp = g.createRadialGradient(p.x, p.y + 4, 0, p.x, p.y + 4, p.rx * 0.9); dp.addColorStop(0, "rgba(30,90,110,.3)"); dp.addColorStop(1, "rgba(30,90,110,0)");
  g.fillStyle = dp; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.ellipse(p.x - p.rx * 0.2, p.y - p.ry * 0.45, p.rx * 0.5, p.ry * 0.22, 0, 0, 7); g.fill();   // the sky in it
  g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 2; g.lineCap = "round";
  g.beginPath(); g.ellipse(p.x - p.rx * 0.2, p.y - p.ry * 0.3, p.rx * 0.45, p.ry * 0.3, 0, 3.5, 5.3); g.stroke();
  for (var i = 0; i < 26; i++) { s = streamAt(rand(0.05, 1)); var side = Math.random() < 0.5 ? -1 : 1;                 // pebbles on the banks
    g.fillStyle = pick(["#B9B3A6", "#9E998E", "#CFC8B8"]); g.beginPath(); g.ellipse(s.x + side * (s.w / 2 + rand(2, 7)), s.y + rand(-3, 3), rand(2, 4.5), rand(1.5, 3), 0, 0, 7); g.fill(); }
  // stepping stones across the middle, reeds and a lily pad on the pool
  var st = streamAt(0.42);
  [-0.6, 0, 0.6].forEach(function (o, n) { rimmed(g, "#6E6A60", "#B5AFA2", 1.5, function (e) { g.beginPath(); g.ellipse(st.x + o * st.w * 0.55, st.y + n * 2 - 2, 8 + e, 4.5 + e, 0, 0, 7); g.fill(); });
    g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.ellipse(st.x + o * st.w * 0.55 - 2, st.y + n * 2 - 4, 4, 1.6, 0, 0, 7); g.fill(); });
  for (i = 0; i < 8; i++) { var rx = p.x + p.rx * (0.7 + i * 0.05), ry = p.y - p.ry * (0.4 - i * 0.1);
    g.strokeStyle = "#5E8A4A"; g.lineWidth = 1.8; g.beginPath(); g.moveTo(rx, ry + 4); g.quadraticCurveTo(rx + 2, ry - 12, rx + (i % 2 ? 5 : -3), ry - 22 - (i % 3) * 5); g.stroke();
    if (i % 3 === 1) { g.fillStyle = "#7A5A3A"; g.beginPath(); g.ellipse(rx + 4, ry - 22, 2, 6, 0.15, 0, 7); g.fill(); } }
  g.fillStyle = "#5FAE69"; g.beginPath(); g.ellipse(p.x - p.rx * 0.45, p.y + p.ry * 0.2, 13, 5.5, 0.2, 0.4, 6.0); g.fill();
  g.fillStyle = "#FFB3C7"; g.beginPath(); g.arc(p.x - p.rx * 0.45 + 3, p.y + p.ry * 0.2 - 2, 3.2, 0, 7); g.fill();
}
function fern(g, x, y, s) {
  g.strokeStyle = "#4E8A4A"; g.lineWidth = 1.6; g.lineCap = "round";
  [-0.9, -0.4, 0.1, 0.6, 1.0].forEach(function (a) { var l = 22 * s, ex = x + Math.sin(a) * l, ey = y - Math.cos(a) * l * 0.9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * l * 0.5, y - l * 0.7, ex, ey); g.stroke();
    for (var k = 0.3; k < 1; k += 0.18) { var px = x + (ex - x) * k, py = y + (ey - y) * k - Math.sin(k * Math.PI) * 4;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px - 4 * s, py - 2); g.moveTo(px, py); g.lineTo(px + 4 * s, py - 1); g.stroke(); } });
}
function toadstool(g, x, y, s) {
  g.fillStyle = "#F4EEDC"; g.fillRect(x - 2 * s, y - 8 * s, 4 * s, 8 * s);
  rimmed(g, "#8E2A24", "#D9433A", 1, function (e) { g.beginPath(); g.ellipse(x, y - 8 * s, 7 * s + e, 5 * s + e, 0, Math.PI, 0); g.fill(); });
  g.fillStyle = "#FFFFFF"; [[-3, -10], [2, -11], [4, -9]].forEach(function (d) { g.beginPath(); g.arc(x + d[0] * s, y + d[1] * s, 1 * s, 0, 7); g.fill(); });
}

// ── Furniture ──────────────────────────────────────────────────────────────────
// Paper lanterns on a line across the back, hung between two poles.
function lanternString(g) {
  var W = G.W, x0 = W * 0.2, x1 = W * 0.74, y0 = G.B - 30, y1 = G.B - 36, sag = 30;
  [[x0, y0], [x1, y1]].forEach(function (p) { aoShadow(g, p[0] + 3, G.B + 26, 12, 3, 0.3); g.fillStyle = "#6B4E36"; g.fillRect(p[0] - 2, p[1] - 4, 4, G.B + 26 - p[1]); });
  g.strokeStyle = "rgba(60,50,40,.7)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag * 2, x1, y1); g.stroke();
  var cols = ["#F2C14E", "#E86A5B", "#F4F1E8", "#7BC4A8", "#F29E7A"], n = 13;
  for (var i = 1; i < n; i++) { var t = i / n, x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (Math.max(y0, y1) + sag * 2) + t * t * y1;
    var c = cols[i % cols.length];
    g.strokeStyle = "rgba(60,50,40,.6)"; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 4); g.stroke();
    rimmed(g, "rgba(90,60,40,.5)", c, 1, function (e) { g.beginPath(); g.ellipse(x, y + 10, 6 + e, 7 + e, 0, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(90,60,40,.35)"; g.beginPath(); g.moveTo(x - 6, y + 10); g.lineTo(x + 6, y + 10); g.moveTo(x - 5, y + 6); g.lineTo(x + 5, y + 6); g.moveTo(x - 5, y + 14); g.lineTo(x + 5, y + 14); g.stroke();
    g.fillStyle = "#4E3A2A"; g.fillRect(x - 3, y + 2.5, 6, 1.5); g.fillRect(x - 3, y + 16.5, 6, 1.5);
    G.lanterns.push({ x: x, y: y + 10, c: c, ph: i * 1.3 }); }
}
function woodpile(g, x, y) {
  g.fillStyle = "rgba(40,70,40,.25)"; g.beginPath(); g.ellipse(x, y + 3, 70, 10, 0, 0, 7); g.fill();
  // stacked logs, ends towards us
  for (var row = 0; row < 3; row++) for (var c = 0; c < 4 - row; c++) { var lx = x - 52 + c * 15 + row * 7.5, ly = y - 6 - row * 12;
    rimmed(g, "#6B4A30", "#B08458", 1.2, function (e) { g.beginPath(); g.arc(lx, ly, 7 + e, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(110,75,45,.6)"; g.lineWidth = 0.8; g.beginPath(); g.arc(lx, ly, 3.5, 0, 7); g.stroke(); }
  // the chopping block with the axe in it
  var bx = x + 14; G.block = { x: bx, y: y };
  g.fillStyle = "#8C6440"; g.fillRect(bx - 10, y - 14, 20, 14); g.fillStyle = "#D8B98A"; g.beginPath(); g.ellipse(bx, y - 14, 10, 4, 0, 0, 7); g.fill();
  g.strokeStyle = "#8C6440"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - 2, y - 16); g.lineTo(bx + 12, y - 32); g.stroke();
  g.fillStyle = "#8A929C"; g.beginPath(); g.moveTo(bx - 6, y - 20); g.lineTo(bx + 2, y - 13); g.lineTo(bx + 1, y - 21); g.closePath(); g.fill();
  // the sawhorse with a log on it, and a toolbox
  var sx = x + 46;
  g.strokeStyle = "#7A5A3A"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 12, y); g.lineTo(sx, y - 18); g.lineTo(sx + 12, y); g.moveTo(sx + 2, y); g.lineTo(sx + 14, y - 18); g.lineTo(sx + 26, y); g.stroke();
  rimmed(g, "#6B4A30", "#A87A50", 1.2, function (e) { rr(g, sx - 10 - e, y - 25 - e, 40 + 2 * e, 8 + 2 * e, 4); g.fill(); });
  g.fillStyle = "#D9433A"; rr(g, x - 70, y - 10, 20, 10, 2); g.fill(); g.fillStyle = "#8E2A24"; g.fillRect(x - 64, y - 13, 8, 3);
}
function smallTent(g, x, y) {
  g.fillStyle = "rgba(40,70,40,.25)"; g.beginPath(); g.ellipse(x, y + 2, 58, 9, 0, 0, 7); g.fill();
  rimmed(g, "#A44E28", "#E8834A", 1.5, function (e) { g.beginPath(); g.moveTo(x - 48 - e, y + e); g.lineTo(x - 8, y - 52 - e); g.lineTo(x + 30, y - 46 - e); g.lineTo(x + 54 + e, y + e); g.closePath(); g.fill(); });
  g.fillStyle = "#F29E6A"; g.beginPath(); g.moveTo(x - 8, y - 52); g.lineTo(x + 30, y - 46); g.lineTo(x + 54, y); g.lineTo(x + 8, y); g.closePath(); g.fill();
  g.fillStyle = "#5A3A2A"; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x - 8, y - 40); g.lineTo(x + 8, y); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 8, y - 52); g.lineTo(x - 8, y - 40); g.stroke();
  g.strokeStyle = "rgba(80,60,40,.6)"; g.beginPath(); g.moveTo(x - 8, y - 52); g.lineTo(x - 30, y + 4); g.moveTo(x + 30, y - 46); g.lineTo(x + 66, y + 2); g.stroke();
  G.tent2Door = { x: x - 8, y: y - 14 };
}
// The family's bell tent: a cream cone and wall, the door rolled up on a warm inside, bunting
// from the peak, a flag, guy ropes, and a lantern hung by the door. Wellies and a rucksack.
function bellTent(g, x, y) {
  var w = 96, wallH = 36, peak = 112;
  g.fillStyle = "rgba(40,70,40,.3)"; g.beginPath(); g.ellipse(x, y + 3, w + 18, 14, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(90,70,50,.6)"; g.lineWidth = 1;                                            // guy ropes and pegs
  [-1, -0.5, 0.5, 1].forEach(function (k) { g.beginPath(); g.moveTo(x + k * w * 0.8, y - wallH - 4); g.lineTo(x + k * (w + 26), y + 8); g.stroke();
    g.fillStyle = "#7A5A3A"; g.fillRect(x + k * (w + 26) - 1, y + 4, 2, 6); });
  rimmed(g, "#B8A47E", "#EFE3C6", 1.6, function (e) { g.beginPath(); g.moveTo(x - w - e, y + e); g.lineTo(x - w - e, y - wallH);
    g.quadraticCurveTo(x - w * 0.5, y - wallH - 30, x, y - peak - e); g.quadraticCurveTo(x + w * 0.5, y - wallH - 30, x + w + e, y - wallH); g.lineTo(x + w + e, y + e); g.closePath(); g.fill(); });
  var sh = g.createLinearGradient(x - w, 0, x + w, 0); sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(0.6, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(120,100,60,.2)");
  g.fillStyle = sh; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x - w, y - wallH); g.quadraticCurveTo(x - w * 0.5, y - wallH - 30, x, y - peak); g.quadraticCurveTo(x + w * 0.5, y - wallH - 30, x + w, y - wallH); g.lineTo(x + w, y); g.closePath(); g.fill();
  g.strokeStyle = "rgba(150,130,90,.45)"; g.lineWidth = 1.2;                                      // the seams of the cone
  [-0.7, -0.35, 0.35, 0.7].forEach(function (k) { g.beginPath(); g.moveTo(x, y - peak); g.quadraticCurveTo(x + k * w * 0.6, y - wallH - 22, x + k * w, y - wallH); g.stroke(); });
  g.beginPath(); g.moveTo(x - w, y - wallH); g.lineTo(x + w, y - wallH); g.stroke();
  // the door: a warm inside, the flaps tied back
  var dx = x + 4;
  g.fillStyle = "#6E4A2E"; g.beginPath(); g.moveTo(dx - 26, y); g.lineTo(dx - 12, y - 66); g.lineTo(dx + 12, y - 66); g.lineTo(dx + 26, y); g.closePath(); g.fill();
  var ig = g.createLinearGradient(0, y - 66, 0, y); ig.addColorStop(0, "#C98A4A"); ig.addColorStop(1, "#8E5A34");
  g.fillStyle = ig; g.beginPath(); g.moveTo(dx - 22, y); g.lineTo(dx - 10, y - 62); g.lineTo(dx + 10, y - 62); g.lineTo(dx + 22, y); g.closePath(); g.fill();
  g.fillStyle = "#E86A5B"; rr(g, dx - 16, y - 14, 32, 12, 4); g.fill();                                // a sleeping bag peeping out
  g.fillStyle = "#F4F1E8"; rr(g, dx - 12, y - 18, 12, 7, 3); g.fill();
  [-1, 1].forEach(function (s) { g.fillStyle = "#E3D3AE"; g.beginPath(); g.moveTo(dx + s * 12, y - 66); g.quadraticCurveTo(dx + s * 34, y - 40, dx + s * 26, y); g.lineTo(dx + s * 22, y); g.quadraticCurveTo(dx + s * 22, y - 40, dx + s * 10, y - 62); g.closePath(); g.fill();
    g.fillStyle = "#B8433A"; g.fillRect(dx + s * 27 - 2, y - 36, 4, 4); });
  G.tentDoor = { x: dx, y: y - 30 };
  // bunting from the peak to the walls, and a flag on top
  var bc = ["#E86A5B", "#F2C14E", "#6C8FD0", "#7BC47F", "#E68AB0"];
  [-1, 1].forEach(function (s) { var x0 = x, y0 = y - peak + 6, x1 = x + s * (w + 4), y1 = y - wallH + 2;
    g.strokeStyle = "rgba(90,70,50,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 22, x1, y1); g.stroke();
    for (var n = 1; n < 8; n++) { var t = n / 8, qx = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, qy = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + 22) + t * t * y1;
      g.fillStyle = bc[n % bc.length]; g.beginPath(); g.moveTo(qx - 3, qy); g.lineTo(qx + 3, qy); g.lineTo(qx, qy + 6); g.closePath(); g.fill(); } });
  g.strokeStyle = "#6B4E36"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - peak); g.lineTo(x, y - peak - 18); g.stroke();
  G.flag = { x: x, y: y - peak - 18 };
  // the lantern on its hook by the door
  G.tentLamp = { x: dx + 36, y: y - 50 };
  g.strokeStyle = "#4E3A2A"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(dx + 30, y - 62); g.lineTo(dx + 40, y - 62); g.lineTo(dx + 36, y - 56); g.stroke();
  g.fillStyle = "#3A3A40"; g.fillRect(dx + 32, y - 56, 8, 2); g.fillRect(dx + 32, y - 45, 8, 2);
  g.fillStyle = "#FFD98A"; rr(g, dx + 33, y - 54, 6, 9, 2); g.fill();
  // wellies and a rucksack
  [[x - 70, "#2E6B45"], [x - 61, "#2E6B45"]].forEach(function (b) { g.fillStyle = b[1]; rr(g, b[0] - 3, y - 12, 7, 13, 2); g.fill(); g.fillRect(b[0] - 3, y - 2, 10, 3); });
  rimmed(g, "#3E5A7A", "#5E86B0", 1.2, function (e) { rr(g, x + 50 - e, y - 26 - e, 22 + 2 * e, 26 + 2 * e, 6); g.fill(); });
  g.fillStyle = "#3E5A7A"; rr(g, x + 53, y - 14, 16, 9, 3); g.fill(); g.fillStyle = "#F2C14E"; g.fillRect(x + 59, y - 27, 4, 4);
}
// The campfire: a ring of stones, a tripod and kettle, log seats either side, a stump with
// mugs on it, and the guitar leaning on the right-hand log. The flames are drawn live.
function campfire(g, x, y) {
  g.save(); g.translate(x, y); g.scale(1.25, 1.25); g.translate(-x, -y);
  g.fillStyle = "rgba(40,30,20,.35)"; g.beginPath(); g.ellipse(x, y + 2, 44, 14, 0, 0, 7); g.fill();
  g.fillStyle = "#4A3A30"; g.beginPath(); g.ellipse(x, y, 30, 10, 0, 0, 7); g.fill();
  for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2, sx = x + Math.cos(a) * 32, sy = y + Math.sin(a) * 11;
    rimmed(g, "#6E6A62", i % 2 ? "#ABA79F" : "#9A968E", 1.2, function (e) { g.beginPath(); g.ellipse(sx, sy, 7 + e, 4.5 + e, 0, 0, 7); g.fill(); }); }
  rimmed(g, "#4A3020", "#8C6440", 1.2, function (e) { g.save(); g.translate(x, y - 3); g.rotate(0.35); rr(g, -18 - e, -3.5 - e, 36 + 2 * e, 7 + 2 * e, 3); g.fill(); g.restore();
    g.save(); g.translate(x, y - 3); g.rotate(-0.35); rr(g, -18 - e, -3.5 - e, 36 + 2 * e, 7 + 2 * e, 3); g.fill(); g.restore(); });
  // the tripod and kettle
  g.strokeStyle = "#3A3A40"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 24, y + 4); g.lineTo(x, y - 62); g.lineTo(x + 24, y + 4); g.moveTo(x, y - 62); g.lineTo(x + 4, y - 4); g.stroke();
  g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 62); g.lineTo(x, y - 44); g.stroke();
  G.kettle = { x: x, y: y - 38 };
  rimmed(g, "#2A2E36", "#4A5260", 1.2, function (e) { g.beginPath(); g.ellipse(x, y - 36, 9 + e, 7 + e, 0, 0, 7); g.fill(); });
  g.fillStyle = "#4A5260"; g.beginPath(); g.moveTo(x + 7, y - 37); g.lineTo(x + 15, y - 42); g.lineTo(x + 8, y - 34); g.fill();
  g.strokeStyle = "#2A2E36"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y - 42, 6, Math.PI, 0); g.stroke();
  // log seats, a stump with mugs, the guitar
  log(g, x - 92, y - 10, 62, -0.1); log(g, x + 94, y - 4, 58, 0.12);
  var st = { x: x + 40, y: y - 34 };
  g.fillStyle = "#7A5638"; g.fillRect(st.x - 11, st.y - 12, 22, 14); g.fillStyle = "#D8B98A"; g.beginPath(); g.ellipse(st.x, st.y - 12, 11, 4, 0, 0, 7); g.fill();
  g.strokeStyle = "#B8905E"; g.lineWidth = 0.8; g.beginPath(); g.ellipse(st.x, st.y - 12, 6, 2, 0, 0, 7); g.stroke();
  [["#E86A5B", -5], ["#6C8FD0", 4]].forEach(function (m) { g.fillStyle = m[0]; rr(g, st.x + m[1] - 3, st.y - 21, 6, 8, 1.5); g.fill(); g.strokeStyle = m[0]; g.lineWidth = 1.2; g.beginPath(); g.arc(st.x + m[1] + 3.5, st.y - 17, 2, -1.4, 1.4); g.stroke(); });
  var gx = x + 112, gy = y - 6;                                                                    // the guitar
  g.save(); g.translate(gx, gy); g.rotate(-0.35);
  g.fillStyle = "#6B3F22"; g.fillRect(-2, -46, 4, 30); g.fillStyle = "#3A2418"; g.fillRect(-3, -52, 6, 7);
  rimmed(g, "#6B3F22", "#D08A4A", 1.2, function (e) { g.beginPath(); g.ellipse(0, -10, 9 + e, 8 + e, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 2, 11 + e, 10 + e, 0, 0, 7); g.fill(); });
  g.fillStyle = "#3A2418"; g.beginPath(); g.arc(0, -4, 3.2, 0, 7); g.fill();
  g.restore();
  g.restore();
}
function log(g, x, y, l, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = "rgba(40,30,20,.25)"; g.beginPath(); g.ellipse(2, 8, l / 2 + 6, 5, 0, 0, 7); g.fill();
  rimmed(g, "#5A3E28", "#9A7048", 1.4, function (e) { rr(g, -l / 2 - e, -8 - e, l + 2 * e, 16 + 2 * e, 7); g.fill(); });
  g.strokeStyle = "rgba(90,60,35,.5)"; g.lineWidth = 1; [-4, 2].forEach(function (o) { g.beginPath(); g.moveTo(-l / 2 + 8, o); g.lineTo(l / 2 - 10, o + 1); g.stroke(); });
  g.fillStyle = "#D8B98A"; g.beginPath(); g.ellipse(l / 2, 0, 4, 8, 0, 0, 7); g.fill();
  g.strokeStyle = "#B8905E"; g.beginPath(); g.ellipse(l / 2, 0, 2, 4.5, 0, 0, 7); g.stroke();
  g.restore();
}
function fingerpost(g, x, y) {
  g.fillStyle = "rgba(40,70,40,.3)"; g.beginPath(); g.ellipse(x, y, 10, 3, 0, 0, 7); g.fill();
  g.fillStyle = "#8C6A48"; g.fillRect(x - 2.5, y - 58, 5, 58);
  g.strokeStyle = "#5A4030"; g.lineWidth = 1;
  [[-1, -50, "School"], [1, -40, "Camp"], [-1, -30, "Village"]].forEach(function (a) {
    var d = a[0], yy = y + a[1], w = 40;
    g.fillStyle = "#E8D6B0"; g.beginPath(); g.moveTo(x, yy - 5); g.lineTo(x + d * (w - 6), yy - 5); g.lineTo(x + d * w, yy); g.lineTo(x + d * (w - 6), yy + 5); g.lineTo(x, yy + 5); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#4A3A2A"; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(a[2], x + d * (w - 4) / 2, yy + 0.5); });
  g.fillStyle = "#5A4030"; g.beginPath(); g.moveTo(x - 5, y - 58); g.lineTo(x, y - 63); g.lineTo(x + 5, y - 58); g.closePath(); g.fill();
}
function canoe(g, x, y) {
  g.fillStyle = "rgba(40,70,40,.3)"; g.beginPath(); g.ellipse(x + 4, y + 4, 46, 6, -0.1, 0, 7); g.fill();
  g.save(); g.translate(x, y); g.rotate(-0.12);
  rimmed(g, "#8E2A24", "#D9533F", 1.4, function (e) { g.beginPath(); g.moveTo(-46 - e, -4); g.quadraticCurveTo(0, 14 + e, 46 + e, -4); g.quadraticCurveTo(0, -2, -46 - e, -4); g.fill(); });
  g.fillStyle = "#F2C14E"; g.beginPath(); g.moveTo(-44, -4); g.quadraticCurveTo(0, -1, 44, -4); g.quadraticCurveTo(0, 2, -44, -4); g.fill();
  g.fillStyle = "#8C6A48"; g.fillRect(-14, -4, 3, 6); g.fillRect(12, -4, 3, 6);
  g.strokeStyle = "#8C6A48"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-30, 10); g.lineTo(10, 18); g.stroke();
  g.fillStyle = "#8C6A48"; g.beginPath(); g.ellipse(14, 19, 7, 3, 0.2, 0, 7); g.fill();
  g.restore();
}
// The old oak on the right edge, and the lookout up in it: a plank hut on a platform, a
// window, a ladder down, a pennant. The owl perches on the branch below it at night.
function oak(g, x, y) {
  var L = G.look;
  g.fillStyle = "rgba(30,60,30,.3)"; g.beginPath(); g.ellipse(x, y + 4, 80, 14, 0, 0, 7); g.fill();
  rimmed(g, "#4A3626", "#7A5A40", 2, function (e) { g.beginPath(); g.moveTo(x - 30 - e, y + e); g.quadraticCurveTo(x - 14, y - 60, x - 20 - e, y - 200);
    g.lineTo(x - 50, y - 330); g.lineTo(x - 30, y - 340 - e); g.lineTo(x + 10 + e, y - 230); g.quadraticCurveTo(x + 14, y - 80, x + 34 + e, y + e); g.closePath(); g.fill(); });
  g.strokeStyle = "rgba(60,40,25,.45)"; g.lineWidth = 1.5;
  for (var k = 0; k < 7; k++) { g.beginPath(); g.moveTo(x - 14 + k * 5, y - 10); g.quadraticCurveTo(x - 10 + k * 4, y - 120, x - 18 + k * 3, y - 200); g.stroke(); }
  g.fillStyle = "#3A2A1E"; g.beginPath(); g.ellipse(x - 2, y - 150, 6, 9, 0, 0, 7); g.fill();       // a knot hole
  // a branch out to the left with the owl's perch
  rimmed(g, "#4A3626", "#7A5A40", 1.5, function (e) { g.beginPath(); g.moveTo(x - 16, y - 250 - e); g.quadraticCurveTo(x - 80, y - 270, x - 140 - e, y - 262 - e); g.lineTo(x - 138, y - 254 + e); g.quadraticCurveTo(x - 80, y - 256, x - 14, y - 236 + e); g.closePath(); g.fill(); });
  G.perch = { x: x - 116, y: y - 262 };
  // the canopy, in heavy rounded clumps
  var cl = [[-60, -360, 70], [10, -390, 80], [-130, -330, 50], [60, -330, 60], [-30, -300, 50], [-170, -280, 36], [30, -270, 46]];
  cl.forEach(function (c) { g.fillStyle = "#3F7A4E"; g.beginPath(); g.arc(x + c[0], y + c[1], c[2], 0, 7); g.fill(); });
  cl.forEach(function (c) { g.fillStyle = "#4E8E5C"; g.beginPath(); g.arc(x + c[0] - c[2] * 0.2, y + c[1] - c[2] * 0.25, c[2] * 0.75, 0, 7); g.fill(); });
  cl.forEach(function (c) { g.fillStyle = "rgba(255,255,220,.12)"; g.beginPath(); g.arc(x + c[0] - c[2] * 0.35, y + c[1] - c[2] * 0.45, c[2] * 0.4, 0, 7); g.fill(); });
  // the lookout
  g.fillStyle = "#6B4E36"; g.fillRect(L.x - 46, L.y + 2, 92, 7);
  g.strokeStyle = "#6B4E36"; g.lineWidth = 3; g.beginPath(); g.moveTo(L.x - 40, L.y + 8); g.lineTo(L.x - 6, L.y + 40); g.stroke();
  rimmed(g, "#5A3E28", "#B08458", 1.4, function (e) { g.fillRect(L.x - 30 - e, L.y - 40 - e, 60 + 2 * e, 42 + 2 * e); });
  g.strokeStyle = "rgba(90,60,35,.5)"; g.lineWidth = 1; for (k = 1; k < 6; k++) { g.beginPath(); g.moveTo(L.x - 30, L.y - 40 + k * 7); g.lineTo(L.x + 30, L.y - 40 + k * 7); g.stroke(); }
  rimmed(g, "#3E5A3A", "#5E8A56", 1.4, function (e) { g.beginPath(); g.moveTo(L.x - 38 - e, L.y - 38); g.lineTo(L.x, L.y - 62 - e); g.lineTo(L.x + 38 + e, L.y - 38); g.closePath(); g.fill(); });
  g.fillStyle = "#3A2A1E"; g.fillRect(L.x - 22, L.y - 30, 18, 16);
  g.fillStyle = "#FFE29A"; g.fillRect(L.x - 20, L.y - 28, 14, 12); G.lookWin = { x: L.x - 13, y: L.y - 22 };
  g.strokeStyle = "#3A2A1E"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(L.x - 13, L.y - 28); g.lineTo(L.x - 13, L.y - 16); g.stroke();
  g.fillStyle = "#5A3E28"; g.fillRect(L.x + 6, L.y - 26, 16, 28);
  g.strokeStyle = "#6B4E36"; g.lineWidth = 2; g.beginPath(); g.moveTo(L.x, L.y - 62); g.lineTo(L.x, L.y - 80); g.stroke();
  G.pennant = { x: L.x, y: L.y - 80 };
  // the railing and the ladder
  g.strokeStyle = "#6B4E36"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(L.x - 46, L.y + 2); g.lineTo(L.x - 46, L.y - 12); g.lineTo(L.x - 32, L.y - 12); g.moveTo(L.x + 32, L.y - 12); g.lineTo(L.x + 46, L.y - 12); g.lineTo(L.x + 46, L.y + 2); g.stroke();
  var lx = L.x - 58;
  g.strokeStyle = "#8C6A48"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(lx - 8, L.y + 8); g.lineTo(lx - 16, y - 2); g.moveTo(lx + 8, L.y + 8); g.lineTo(lx, y - 2); g.stroke();
  g.lineWidth = 1.8; for (k = 1; k < 14; k++) { var ty = L.y + 8 + (y - 2 - L.y - 8) * k / 14, off = -8 * k / 14; g.beginPath(); g.moveTo(lx - 8 + off, ty); g.lineTo(lx + 8 + off, ty); g.stroke(); }
}

// ── What moves: the fire, embers and smoke, lanterns, the duck, the squirrel,
// butterflies by day; fireflies and owls by night. ────────────────────────────
var A = null;
function setup(S) {
  A = { t: 0, embers: [], smoke: [], flies: [], bflies: [], stars: [], owls: [], duck: null, squirrel: null, music: 0, note: 0, flare: 0, steam: [] };
  var i;
  for (i = 0; i < 40; i++) A.stars.push({ x: rand(0, G.W), y: rand(8, G.HZ - 40), s: rand(1, 2.2), ph: rand(0, 6) });
  for (i = 0; i < 22; i++) A.flies.push({ x: rand(G.W * 0.05, G.W * 0.92), y: rand(G.B + 20, G.H - 30), a: rand(0, 6), s: rand(0.4, 1), ph: rand(0, 6) });
  for (i = 0; i < 3; i++) A.bflies.push({ x: rand(G.W * 0.1, G.W * 0.7), y: rand(G.B + 60, G.H - 80), ph: rand(0, 6), c: ["#F2C14E", "#E68AB0", "#8FA8F0"][i], vx: rand(-20, 20), vy: 0, t: rand(0, 3) });
  A.owls = [{ x: G.perch.x, y: G.perch.y, s: 1, turn: 0, tt: 3, blink: 2, hoot: rand(8, 20) }, { x: G.W * 0.2, y: G.B - 34, s: 0.8, turn: 0, tt: 5, blink: 3, hoot: rand(12, 30) }];
  var p = G.pool; A.duck = { x: p.x - 30, y: p.y, tx: p.x, ty: p.y, ph: 0, face: 1, wait: 2, dip: 0 };
  A.squirrel = { x: G.wood.x - 30, y: G.wood.y + 30, tx: G.wood.x, ty: G.wood.y + 30, face: 1, ph: 0, wait: 2, sit: 0, up: 0 };
  A.glow = canvas(48, 48); var gg = A.glow.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,236,190,1)"); gr.addColorStop(0.3, "rgba(255,190,110,.55)"); gr.addColorStop(1, "rgba(255,170,90,0)");
  gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48);
  A.fly = canvas(32, 32); gg = A.fly.getContext("2d"); gr = gg.createRadialGradient(16, 16, 1, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,250,190,1)"); gr.addColorStop(0.25, "rgba(220,255,140,.7)"); gr.addColorStop(1, "rgba(200,255,120,0)");
  gg.fillStyle = gr; gg.fillRect(0, 0, 32, 32);
  void S;
}
function nearFam(S, x, y, d) { for (var i = 0; i < S.fam.length; i++) { var t = S.fam[i]; if (Math.abs(t.x - x) + Math.abs(t.y - y) < d) return t; } return null; }
// How big the fire is: smaller in the rain, bigger at night and when the music plays.
function fireSize(S) { var WX = S.WX || {}; return Math.max(0.35, 1 - 0.5 * (WX.rain || 0) - 0.2 * (WX.snow || 0)) * (1 + 0.15 * S.DARK) * (1 + 0.25 * A.flare); }
function update(dt, S) {
  if (!A) return;
  var WX = S.WX || {}, asleep = S.nightness > 0.6, wind = WX.wind || 0.1, D = S.DARK, i, f = G.fire, fs = fireSize(S);
  A.t += dt;
  // embers up from the fire, smoke by day, steam when it rains
  if (Math.random() < dt * (3 + 5 * fs)) A.embers.push({ x: f.x + rand(-10, 10), y: f.y - 14, vx: rand(-8, 8) - wind * 20, vy: rand(-50, -26), life: rand(1, 2.2), m: 0 });
  if (D < 0.6 && Math.random() < dt * 2.2) A.smoke.push({ x: f.x + rand(-4, 4), y: f.y - 40, r: 4, life: 0, max: rand(3, 4.5) });
  if ((WX.rain || 0) > 0.2 && Math.random() < dt * 3) A.steam.push({ x: f.x + rand(-14, 14), y: f.y - 10, life: 0, max: 1.2 });
  for (i = A.embers.length - 1; i >= 0; i--) { var e = A.embers[i]; e.life -= dt; e.m += dt; if (e.life < 0) { A.embers.splice(i, 1); continue; }
    e.x += (e.vx + Math.sin(e.m * 5 + i) * 10) * dt; e.y += e.vy * dt; }
  for (i = A.smoke.length - 1; i >= 0; i--) { var p = A.smoke[i]; p.life += dt; if (p.life > p.max) { A.smoke.splice(i, 1); continue; }
    p.y -= 16 * dt; p.x -= (3 + 40 * wind) * dt * Math.min(1, p.life) - Math.sin(A.t + p.max) * 4 * dt; p.r += 3.5 * dt; }
  for (i = A.steam.length - 1; i >= 0; i--) { var sm = A.steam[i]; sm.life += dt; sm.y -= 30 * dt; if (sm.life > sm.max) A.steam.splice(i, 1); }
  // the music: the fire leaps on the beat and notes rise from it
  A.music += ((S.music || 0) > 0.5 && !asleep ? 1 : 0) * dt * 2 - dt * 1.2; A.music = Math.max(0, Math.min(1, A.music));
  A.flare = A.music * Math.max(0, Math.sin(A.t * 6.3));
  if (A.music > 0.6) { A.note -= dt; if (A.note < 0) { A.note = rand(0.5, 1); S.puff("note", f.x + rand(-26, 26), f.y - 60, 1, pick(["#E86A5B", "#F2C14E", "#6C8FD0", "#7BC47F"])); } }
  // fireflies wander at dusk and after
  for (i = 0; i < A.flies.length; i++) { var fl = A.flies[i]; fl.a += dt * (Math.sin(A.t * 0.3 + fl.ph) * 1.2); fl.x += Math.cos(fl.a) * 14 * fl.s * dt; fl.y += Math.sin(fl.a) * 8 * fl.s * dt;
    if (fl.x < 20 || fl.x > G.W - 20 || fl.y < G.B || fl.y > G.H - 10) fl.a += Math.PI; }
  // butterflies by day: flit about, drift off
  for (i = 0; i < A.bflies.length; i++) { var b = A.bflies[i]; b.ph += dt * 16; b.t -= dt;
    if (b.t < 0) { b.t = rand(1, 3); b.vx = rand(-28, 28); b.vy = rand(-14, 14); }
    b.x += b.vx * dt; b.y += (b.vy + Math.sin(b.ph * 0.2) * 10) * dt;
    if (b.x < 40 || b.x > G.W * 0.85) b.vx = -b.vx; if (b.y < G.B + 30 || b.y > G.H - 40) b.vy = -b.vy; }
  // the duck: potters about the pool, upends now and then; tucked in at night
  var dk = A.duck, P = G.pool; dk.dip = Math.max(0, dk.dip - dt);
  if (!asleep) { var dx = dk.tx - dk.x, dy = dk.ty - dk.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 2) { var st = Math.min(d, 12 * dt); dk.x += dx / d * st; dk.y += dy / d * st; dk.ph += dt * 4; dk.face = dx > 0 ? 1 : -1; }
    else if ((dk.wait -= dt) < 0) { if (Math.random() < 0.35) dk.dip = 1.6; var a = rand(0, 6.28), r = rand(0.1, 0.6); dk.tx = P.x + Math.cos(a) * P.rx * r; dk.ty = P.y + Math.sin(a) * P.ry * r * 0.6; dk.wait = rand(2, 5); } }
  // the squirrel: scampers along the back of the clearing, sits up to look, bolts from anyone close
  var sq = A.squirrel; sq.sit = Math.max(0, sq.sit - dt);
  if (!asleep && D < 0.6) {
    var who = nearFam(S, sq.x, sq.y, 90), sdx = sq.tx - sq.x, sdy = sq.ty - sq.y, sd = Math.sqrt(sdx * sdx + sdy * sdy);
    if (who && sd < 4) { S.say("!", sq.x, sq.y - 20); sq.tx = who.x < sq.x ? Math.min(G.W * 0.88, sq.x + 220) : Math.max(60, sq.x - 220); sq.ty = G.B + rand(26, 60); sq.fast = 1; }
    else if (sd > 2) { var ss = Math.min(sd, (sq.fast ? 150 : 70) * dt); sq.x += sdx / sd * ss; sq.y += sdy / sd * ss; sq.ph += dt * 16; sq.face = sdx > 0 ? 1 : -1; }
    else if ((sq.wait -= dt) < 0) { sq.fast = 0; if (Math.random() < 0.5) sq.sit = rand(1.5, 3);
      sq.tx = Math.max(70, Math.min(G.W * 0.86, sq.x + rand(-160, 160))); sq.ty = G.B + rand(24, 64); sq.wait = rand(1.5, 4);
      if (S.inZone(sq.tx, sq.ty, 6)) { sq.tx = sq.x; sq.ty = sq.y; } }
  }
  // the owls: wake at dusk, turn their heads, blink, hoot now and then
  for (i = 0; i < A.owls.length; i++) { var o = A.owls[i]; o.tt -= dt; o.blink -= dt;
    if (o.tt < 0) { o.tt = rand(2, 6); o.turnTo = pick([-1, 0, 0, 1]); }
    o.turn += ((o.turnTo || 0) - o.turn) * Math.min(1, dt * 4);
    if (o.blink < -0.15) o.blink = rand(2, 5);
    if (D > 0.5) { o.hoot -= dt; if (o.hoot < 0) { o.hoot = rand(14, 30); S.say("hoo", o.x, o.y - 26 * o.s); } } }
}

// Under the weather: the water's ripples and glints, flowing down the stream.
function under(ctx, time, S) {
  if (!A) return;
  var i, k, s, D0 = S.DARK || 0;
  if (D0 > 0 && D0 < 1) {                                                                            // the sunset behind the wood
    var sa = Math.sin(D0 * Math.PI) * 0.34, sg = ctx.createLinearGradient(0, G.HZ - 130, 0, G.HZ + 50);
    sg.addColorStop(0, "rgba(255,150,90,0)"); sg.addColorStop(0.6, "rgba(255,140,80," + sa.toFixed(3) + ")"); sg.addColorStop(1, "rgba(255,170,120,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, G.HZ - 130, G.W, 180);
  }
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.beginPath();
  for (i = 0; i < 18; i++) { k = ((i / 18) + time * 0.03) % 1; s = streamAt(k); var off = Math.sin(i * 2.7) * s.w * 0.25, l = 4 + s.w * 0.12;
    ctx.moveTo(s.x + off - l / 2, s.y); ctx.quadraticCurveTo(s.x + off, s.y - 1.5, s.x + off + l / 2, s.y); }
  ctx.stroke();
  var P = G.pool; ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath();
  for (i = 0; i < 3; i++) { var r = ((time * 0.25 + i / 3) % 1); ctx.moveTo(P.x + 10 + P.rx * 0.5 * r, P.y + 4); ctx.ellipse(P.x + 10, P.y + 4, P.rx * 0.5 * r + 0.1, P.ry * 0.3 * r + 0.1, 0, 0, 7); }
  ctx.globalAlpha = 1; ctx.stroke();
  if (S.DARK < 0.5) { ctx.fillStyle = "rgba(255,255,240,.7)";
    for (i = 0; i < 10; i++) { s = streamAt((i * 0.097 + 0.08) % 1); var tw = Math.sin(time * 3 + i * 1.9); if (tw > 0.7) ctx.fillRect(s.x - 1.5 + Math.sin(i) * s.w * 0.2, s.y - 0.6, 3 + tw * 2, 1.2); } }
}
// Behind the family: smoke, steam, the duck, the squirrel, the flag, the fire and its embers.
function back(ctx, time, S) {
  if (!A) return;
  var i, D = S.DARK, asleep = S.nightness > 0.6, WX = S.WX || {};
  // the pennant and the tent's flag, in the wind
  [[G.flag, "#E86A5B"], [G.pennant, "#F2C14E"]].forEach(function (f) { var w = Math.sin(time * 3 + f[0].x) * (2 + 4 * (WX.wind || 0.1));
    ctx.fillStyle = f[1]; ctx.beginPath(); ctx.moveTo(f[0].x, f[0].y); ctx.quadraticCurveTo(f[0].x + 8, f[0].y + 2 + w * 0.5, f[0].x + 16, f[0].y + 4 + w); ctx.lineTo(f[0].x, f[0].y + 9); ctx.closePath(); ctx.fill(); });
  ctx.fillStyle = "rgb(236,236,232)";
  for (i = 0; i < A.smoke.length; i++) { var p = A.smoke[i]; ctx.globalAlpha = Math.min(1, p.life / 0.5) * (1 - p.life / p.max) * 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgb(250,250,255)";
  for (i = 0; i < A.steam.length; i++) { var sm = A.steam[i]; ctx.globalAlpha = 0.5 * (1 - sm.life / sm.max); ctx.beginPath(); ctx.arc(sm.x, sm.y, 3 + sm.life * 6, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  duck(ctx, time, S, asleep);
  if (!asleep && D < 0.6) squirrel(ctx, time, S);
  fire(ctx, time, S);
  ctx.fillStyle = "#FFB04A";
  for (i = 0; i < A.embers.length; i++) { var e = A.embers[i]; ctx.globalAlpha = Math.min(1, e.life); ctx.fillRect(e.x - 1, e.y - 1, 2, 2); }
  ctx.globalAlpha = 1;
  if (D < 0.5) for (i = 0; i < A.bflies.length; i++) butterfly(ctx, A.bflies[i], 1 - D * 2);
}
function fire(ctx, time, S) {
  var f = G.fire, fs = fireSize(S), x = f.x, y = f.y - 5;
  var tongues = [[-9, 0.7, "#E8643A", 0], [8, 0.75, "#E8643A", 1.7], [0, 1, "#F28C38", 0.9], [-4, 0.62, "#F7C04A", 2.3], [4, 0.55, "#FFE29A", 3.1]];
  for (var i = 0; i < tongues.length; i++) { var T = tongues[i], h = 44 * T[1] * fs * (0.85 + 0.15 * Math.sin(time * 11 + T[3]) + 0.08 * Math.sin(time * 23 + T[3] * 2)),
      w = 13.5 * T[1] * Math.sqrt(fs), sway = Math.sin(time * 7 + T[3]) * 3 * fs, bx = x + T[0] * 1.25 * Math.sqrt(fs);
    ctx.fillStyle = T[2]; ctx.beginPath(); ctx.moveTo(bx - w, y);
    ctx.bezierCurveTo(bx - w, y - h * 0.5, bx + sway - w * 0.3, y - h * 0.7, bx + sway, y - h);
    ctx.bezierCurveTo(bx + sway + w * 0.3, y - h * 0.7, bx + w, y - h * 0.5, bx + w, y); ctx.closePath(); ctx.fill(); }
}
function duck(ctx, time, S, asleep) {
  var d = A.duck, sc = S.depth(d.y) * 0.9, bob = Math.sin(time * 2 + d.ph) * 0.8;
  ctx.save(); ctx.translate(d.x, d.y + bob); ctx.scale(d.face * sc, sc);
  if (d.dip > 0 && !asleep) {                                                                          // bottoms up
    ctx.fillStyle = "#8A7A5A"; ctx.beginPath(); ctx.ellipse(0, -3, 7, 6, -1.2, 0, 7); ctx.fill();
    ctx.fillStyle = "#F4F1E8"; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(0, -14); ctx.lineTo(3, -8); ctx.fill();
    ctx.strokeStyle = "#F28C38"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-1, -10); ctx.lineTo(-4, -16); ctx.moveTo(2, -10); ctx.lineTo(4, -15); ctx.stroke();
  } else {
    ctx.fillStyle = "#8A7A5A"; ctx.beginPath(); ctx.ellipse(0, -4, 11, 5.5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-14, -9); ctx.lineTo(-10, -3); ctx.fill();
    ctx.fillStyle = "#6E5E44"; ctx.beginPath(); ctx.ellipse(-2, -6, 6, 3, 0.1, 0, 7); ctx.fill();
    if (asleep) { ctx.fillStyle = "#2E6B4A"; ctx.beginPath(); ctx.arc(3, -9, 4, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = "#2E6B4A"; ctx.beginPath(); ctx.arc(7, -12, 4.2, 0, 7); ctx.fill(); ctx.fillStyle = "#F4F1E8"; ctx.fillRect(4, -9, 6, 1.4);
      ctx.fillStyle = "#F2C14E"; ctx.beginPath(); ctx.ellipse(12, -11.5, 3.2, 1.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(8, -13, 0.9, 0, 7); ctx.fill(); }
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(d.x, d.y + 1, 12 * sc, 2.5 * sc, 0, 0, 7); ctx.stroke();
}
function squirrel(ctx, time, S) {
  var q = A.squirrel, sc = S.depth(q.y), moving = Math.abs(q.tx - q.x) + Math.abs(q.ty - q.y) > 2, hop = moving ? Math.abs(Math.sin(q.ph)) * 5 : 0;
  ctx.save(); ctx.translate(q.x, q.y - hop); ctx.scale(q.face * sc, sc);
  if (!moving) { ctx.fillStyle = "rgba(40,70,40,.25)"; ctx.beginPath(); ctx.ellipse(0, hop, 8, 2, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#C4643A";
  ctx.beginPath(); ctx.moveTo(-5, -4); ctx.bezierCurveTo(-20, -2, -20, -24, -10, -26); ctx.bezierCurveTo(-6, -26, -6, -18, -10, -16); ctx.bezierCurveTo(-13, -12, -9, -8, -3, -8); ctx.fill();   // the tail
  if (q.sit > 0) { ctx.beginPath(); ctx.ellipse(0, -9, 5, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(1, -18, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#F4E2C8"; ctx.beginPath(); ctx.ellipse(1.5, -8, 2.5, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#C4643A"; ctx.beginPath(); ctx.moveTo(-1, -22); ctx.lineTo(0, -26); ctx.lineTo(2, -21); ctx.fill();
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(3, -19, 0.9, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); ctx.ellipse(1, -6, 8, 4.5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(8, -9, 3.8, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(7, -15.5); ctx.lineTo(9, -12); ctx.fill();
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(9.5, -9.8, 0.8, 0, 7); ctx.fill(); }
  ctx.restore();
}
function butterfly(ctx, b, a) {
  var fl = Math.abs(Math.sin(b.ph)) * 0.8 + 0.2;
  ctx.globalAlpha = a; ctx.fillStyle = b.c;
  ctx.beginPath(); ctx.ellipse(b.x - 3 * fl, b.y, 3.5 * fl, 3, -0.4, 0, 7); ctx.ellipse(b.x + 3 * fl, b.y, 3.5 * fl, 3, 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = "#3A2E28"; ctx.fillRect(b.x - 0.5, b.y - 3, 1, 5);
  ctx.globalAlpha = 1;
}
function owl(ctx, o, time, D) {
  var s = o.s, x = o.x, y = o.y, open = D > 0.5 && o.blink > 0, tx = o.turn * 2.5 * s;
  ctx.fillStyle = "#8A6440"; ctx.beginPath(); ctx.ellipse(x, y - 9 * s, 8 * s, 10 * s, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 7 * s + tx, y - 15 * s); ctx.lineTo(x - 6 * s + tx, y - 22 * s); ctx.lineTo(x - 2 * s + tx, y - 17 * s); ctx.moveTo(x + 7 * s + tx, y - 15 * s); ctx.lineTo(x + 6 * s + tx, y - 22 * s); ctx.lineTo(x + 2 * s + tx, y - 17 * s); ctx.fill();
  ctx.fillStyle = "#E8D4B0"; ctx.beginPath(); ctx.arc(x - 3.2 * s + tx, y - 13 * s, 3.6 * s, 0, 7); ctx.arc(x + 3.2 * s + tx, y - 13 * s, 3.6 * s, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 4.5 * s, 5 * s, 0, 0, 7); ctx.fill();
  if (open) { ctx.fillStyle = "#F4AE2E"; ctx.beginPath(); ctx.arc(x - 3.2 * s + tx, y - 13 * s, 2.4 * s, 0, 7); ctx.arc(x + 3.2 * s + tx, y - 13 * s, 2.4 * s, 0, 7); ctx.fill();
    ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(x - 3.2 * s + tx, y - 13 * s, 1.3 * s, 0, 7); ctx.arc(x + 3.2 * s + tx, y - 13 * s, 1.3 * s, 0, 7); ctx.fill(); }
  else { ctx.strokeStyle = "#2B2433"; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(x - 5.5 * s + tx, y - 13 * s); ctx.lineTo(x - 1 * s + tx, y - 13 * s); ctx.moveTo(x + 1 * s + tx, y - 13 * s); ctx.lineTo(x + 5.5 * s + tx, y - 13 * s); ctx.stroke(); }
  ctx.fillStyle = "#E9B44A"; ctx.beginPath(); ctx.moveTo(x - 1.2 * s + tx, y - 11 * s); ctx.lineTo(x + 1.2 * s + tx, y - 11 * s); ctx.lineTo(x + tx, y - 8.5 * s); ctx.fill();
  ctx.fillStyle = "#E9B44A"; ctx.fillRect(x - 4 * s, y - 0.5 * s, 2.5 * s, 1.5 * s); ctx.fillRect(x + 1.5 * s, y - 0.5 * s, 2.5 * s, 1.5 * s);
}

// Over the dusk: stars and the moon, the fire's light on everyone near it, the lanterns, the
// tent and the lookout, fireflies, and the owls (drawn over the dark so their eyes show).
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W, f = G.fire, fs = fireSize(S);
  if (D <= 0.02) return;
  var ng = ctx.createLinearGradient(0, 0, 0, G.HZ + 20); ng.addColorStop(0, "rgba(6,10,42,.55)"); ng.addColorStop(0.7, "rgba(10,16,52,.28)"); ng.addColorStop(1, "rgba(16,24,60,0)");   // a deep blue night sky
  ctx.globalAlpha = D; ctx.fillStyle = ng; ctx.fillRect(0, 0, W, G.HZ + 20);
  ctx.fillStyle = "rgba(20,40,110,.1)"; ctx.fillRect(0, G.HZ + 20, W, G.H - G.HZ);                      // moonlight cools the clearing, so the fire reads warm
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.stars.length; i++) { var st = A.stars[i], tw = 0.55 + 0.45 * Math.sin(time * 1.4 + st.ph), ss = st.s * 1.3; ctx.globalAlpha = D * tw * 0.9; ctx.fillRect(st.x - ss / 2, st.y - ss / 2, ss, ss);
    if (st.s > 1.9) { ctx.globalAlpha = D * tw * 0.4; ctx.fillRect(st.x - ss * 1.6, st.y - 0.5, ss * 3.2, 1); ctx.fillRect(st.x - 0.5, st.y - ss * 1.6, 1, ss * 3.2); } }
  var mx = W * 0.46, my = 100;
  var halo = ctx.createRadialGradient(mx, my, 14, mx, my, 70); halo.addColorStop(0, "rgba(255,245,210,.38)"); halo.addColorStop(1, "rgba(255,245,210,0)");
  ctx.globalAlpha = D; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, 70, 0, 7); ctx.fill();
  ctx.globalAlpha = D; ctx.fillStyle = "#FFF8DC"; ctx.beginPath(); ctx.arc(mx, my, 16, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(230,222,190,.7)"; ctx.beginPath(); ctx.arc(mx - 5, my - 3, 3.5, 0, 7); ctx.arc(mx + 6, my + 5, 2.5, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  var fl = 0.82 + 0.1 * Math.sin(time * 9) + 0.08 * Math.sin(time * 15.7);
  ctx.globalAlpha = D * 0.6 * fl * Math.min(1.2, fs); ctx.drawImage(A.glow, f.x - 210, f.y - 170, 420, 260);           // firelight on faces and the ground
  ctx.globalAlpha = D * 0.9 * fl; ctx.drawImage(A.glow, f.x - 46, f.y - 70, 92, 90);
  for (i = 0; i < G.lanterns.length; i++) { var l = G.lanterns[i], on = 0.85 + 0.15 * Math.sin(time * 1.6 + l.ph) + 0.2 * A.flare;
    ctx.globalAlpha = D * 0.75 * on; ctx.drawImage(A.glow, l.x - 15, l.y - 15, 30, 30); }
  var tl = G.tentLamp; ctx.globalAlpha = D; ctx.drawImage(A.glow, tl.x - 20, tl.y - 20, 40, 40);
  var td = G.tentDoor; ctx.globalAlpha = D * 0.7; ctx.drawImage(A.glow, td.x - 34, td.y - 30, 68, 70);
  ctx.globalAlpha = D * 0.4; ctx.drawImage(A.glow, td.x - 60, td.y + 20, 120, 30);
  var lw = G.lookWin; ctx.globalAlpha = D * 0.9; ctx.drawImage(A.glow, lw.x - 20, lw.y - 20, 40, 40);
  for (i = 0; i < A.flies.length; i++) { var ff = A.flies[i], pulse = 0.5 + 0.5 * Math.sin(time * 2 + ff.ph * 3);
    ctx.globalAlpha = D * (0.25 + 0.75 * pulse); ctx.drawImage(A.fly, ff.x - 10, ff.y - 10, 20, 20); }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = D * 0.85; ctx.fillStyle = "#FFE29A";
  for (i = 0; i < G.lanterns.length; i++) { var ln = G.lanterns[i]; ctx.beginPath(); ctx.ellipse(ln.x, ln.y, 4, 5, 0, 0, 7); ctx.fill(); }
  ctx.fillRect(lw.x - 7, lw.y - 6, 14, 12);
  ctx.globalAlpha = Math.min(1, D * 1.4);
  for (i = 0; i < A.owls.length; i++) owl(ctx, A.owls[i], time, D);
  ctx.globalAlpha = 1;
}

export default {
  id: "forest", label: "Forest camp",
  blurb: "the forest camp has the bell tent, the campfire with its log seats, the woodpile, the lookout in the oak and the trail to school past the fingerpost",
  shadow: "30,60,30",
  depth: [0.7, 0.32],
  creatures: ["owl", "frog", "fox", "hedgehog", "rabbit", "deer", "otter", "crow", "snail", "cat"],
  bake: function (g, S) { bake(g, S); },
  // round the fire, by the tent, down by the stream
  start: function (i, S) {
    var slots = [[0.36, 0.72], [0.62, 0.74], [0.5, 0.86], [0.42, 0.56], [0.68, 0.88], [0.18, 0.78], [0.56, 0.52], [0.3, 0.9]], s = slots[i % slots.length];
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  swimSpot: function (S) { var p = G.pool, y = p.y - p.ry - 40; void S; return { x: Math.min(p.x - p.rx * 0.2, westBank(y) - 30) - rand(0, p.rx * 0.4), y: y }; },
  // someone on a duty walks round the fire, the tents and the woodpile, not through them
  via: function (t, dest, S) { if (!t.pass) return null;
    return around(t, dest, G.big, 30, function (x, y) { return x > 20 && y > G.B + 20 && y < G.H - 10 && !S.inZone(x, y, 4); }); },
  // The landmarks a tap opens: the fingerpost up the trail to school, the woodpile (the
  // workshop), the campfire (the sing-song), the bell tent (home) and the lookout in the oak
  // (the office).
  hotspots: {
    school:  { box: function () { var p = G.post; return [p.x - 48, p.y - 70, p.x + 48, p.y + 14]; },
               tap: function (S) { var p = G.post; S.say("ding!", p.x, p.y - 76); } },
    printer: { box: function () { var w = G.wood; return [w.x - 74, w.y - 48, w.x + 76, w.y + 12]; },
               tap: function (S) { var b = G.block; S.puff("chip", b.x, b.y - 20, 7, "#D8B98A"); } },
    music:   { box: function () { var f = G.fire; return [f.x - 80, f.y - 78, f.x + 80, f.y + 20]; },
               tap: function (S) { var f = G.fire; S.puff("note", f.x + rand(-24, 24), f.y - 60, 5, "#E86A5B"); } },
    home:    { box: function () { var t = G.tent; return [t.x - 96, t.y - 132, t.x + 96, t.y + 12]; },
               tap: function (S) { var t = G.tent; S.puff("heart", t.x, t.y - 80, 3, "#FF7FA0"); } },
    office:  { box: function () { var l = G.look; return [l.x - 50, l.y - 84, l.x + 50, l.y + 12]; },
               tap: function (S) { var l = G.look; S.say("beep!", l.x, l.y - 88); } }
  },
  weather: {
    // snow lies on the clearing and the tents, never on the water
    ground: function (ctx, S, WX) {
      if (WX.snow <= 0.02) return;
      ctx.globalAlpha = 0.6 * WX.snow; ctx.drawImage(G.snowMask, 0, 0, G.W, G.H); ctx.globalAlpha = 1;
      ctx.globalAlpha = WX.snow; S.blit(S.sprites.snowman, G.W * 0.15, G.H - 40, 1, 1, 1, 1); ctx.globalAlpha = 1;
    }
  },
  ambient: { setup: setup, update: update, under: under, back: back, light: light }
};
