// The winter village: a British one, under snow. Along the back a lane of stone and
// whitewashed cottages, the village school with its bell, the church, the pub (The Robin,
// its sign on a post), the post office and the smithy, every roof deep in snow with smoke
// from the chimneys. Victorian lamps stand along the lane with Christmas lights strung
// between them, and the village tree stands lit by the pub. In front is the green: a frozen
// pond with skate marks on the left, snowmen, and the family's cottage on the right with a
// wreath on the door. A robin hops about the green and flies off from anyone close. When the
// speaker plays, carol singers gather at the church door and the bell swings. At dusk the
// windows, lamps and lights come on and spill warm light on the snow.
//
// The snow on the ground is always there (it is a winter scene); snow falling follows the
// engine's weather, and fresh snow covers the trodden paths while it falls. The pond is
// frozen, so there is no open water for the swimmers. No village population: school and
// away duties go along the lane past the school and off the left edge.
import { rand, pick, rr, rimmed, canvas, K, aoShadow } from "../engine/draw.js";
import { around } from "../engine/route.js";

var G = null;

// ── Geometry, worked out once per size ─────────────────────────────────────────
function layout(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP, B = TOP + 34;
  G = { W: W, H: H, HZ: HZ, TOP: TOP, B: B, wins: [], chims: [], lamps: [], bulbs: [], doors: [] };
  G.school = { x: Math.round(W * 0.095), y: B };
  G.church = { x: Math.round(W * 0.315), y: B - 4 };
  G.pub = { x: Math.round(W * 0.478), y: B };
  G.tree = { x: Math.round(W * 0.585), y: B + 40 };
  G.post = { x: Math.round(W * 0.69), y: B };
  G.smithy = { x: Math.round(W * 0.855), y: B };
  G.cot = [{ x: Math.round(W * 0.205), y: B + 2, w: 84, h: 54, wall: "#EDE3D2", roof: "#7A6C6C", door: "#3F6E55" },
    { x: Math.round(W * 0.775), y: B + 2, w: 76, h: 50, wall: "#E7C9B8", roof: "#5E6B7A", door: "#B8433A" }];
  G.home = { x: Math.round(W * 0.875), y: Math.round(H * 0.69) };
  G.pond = { x: Math.round(W * 0.215), y: Math.round(H * 0.835), rx: Math.min(175, W * 0.14), ry: 52 };
  G.snowmen = [{ x: W * 0.415, y: H * 0.6, s: 1 }, { x: W * 0.69, y: H * 0.93, s: 0.82, kid: true }];
  G.lane = { x: G.school.x + 96, y: B + 20 };
  var h = G.home;
  var zones = [{ x: G.pond.x, y: G.pond.y, rx: G.pond.rx, ry: G.pond.ry },
    { x: h.x, y: h.y - 46, rx: 128, ry: 76 },                                   // the cottage and its garden
    { x: G.tree.x, y: G.tree.y - 6, rx: 46, ry: 18 }]
    .concat([{ x: W * 0.67, y: H * 0.5 - 8, rx: 34, ry: 16 }])
    .concat(G.snowmen.map(function (m) { return { x: m.x, y: m.y - 6, rx: 26 * m.s, ry: 14 * m.s }; }));
  // the green: everything in front of the lane, less the cottage's corner
  G.big = zones;
  var green = { has: function (x, y) { return y > B + 66 && y < H - 26 && x > 40 && x < W - 40 && !(x > W * 0.76 && y < h.y + 40); },
    pick: function () { for (var i = 0; i < 30; i++) { var x = rand(60, W - 60), y = rand(B + 72, H - 32); if (green.has(x, y)) return { x: x, y: y }; } return { x: W * 0.5, y: H * 0.7 }; } };
  return {
    lay: { tree: G.tree, pond: G.pond, school: { x: G.school.x, y: G.school.y, tag: G.school.y - 64, cut: [G.school.x - 110, G.school.y - 150, 240, 180] } },
    zones: zones, water: null,
    patch: [green], roam: [green],
    home: { x: W * 0.5, y: H * 0.72 },
    // along the lane past the school, and off the left edge
    exit: { x: G.lane.x, y: G.lane.y, off: { x: -60, y: G.lane.y - 6 } }
  };
}

// ── The background, baked once per size ───────────────────────────────────────
function bake(g, S) {
  var L = layout(S), W = S.W, H = S.H, HZ = S.HZ, B = G.B, i, x, y;
  S.place(L);
  // a pale winter sky, warmer at the horizon
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#A7BFD6"); sky.addColorStop(0.6, "#D6E0E8"); sky.addColorStop(1, "#F3EEE6");
  g.fillStyle = sky; g.fillRect(0, 0, W, HZ + 40);
  var sun = g.createRadialGradient(W * 0.2, 30, 0, W * 0.2, 30, HZ * 0.9);                            // the low winter sun, left
  sun.addColorStop(0, "rgba(255,240,205,.6)"); sun.addColorStop(0.5, "rgba(255,236,200,.16)"); sun.addColorStop(1, "rgba(255,236,200,0)");
  g.fillStyle = sun; g.fillRect(0, 0, W, HZ + 40);
  // far snowy hills, then a fir wood dusted white
  hills(g, HZ - 30, 26, "#E4EAF0", 0.7); hills(g, HZ - 8, 18, "#D6E0EA", 2.9);
  for (i = 0; i < 46; i++) { x = (i / 45) * W * 1.04 - 20 + Math.sin(i * 7.3) * 9; y = HZ + 6 + Math.abs(Math.sin(i * 2.1)) * 6;
    if (x > W * 0.27 && x < W * 0.35) continue;
    fir(g, x, y, 20 + Math.abs(Math.sin(i * 4.7)) * 16, i % 3 ? "#7E978E" : "#6E8A82", 0.5); }
  // the snowfield, horizon to the bottom edge, with soft drifts
  var gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, "#EEF2F6"); gr.addColorStop(0.4, "#F5F7FA"); gr.addColorStop(1, "#E9EFF5");
  g.fillStyle = gr; g.fillRect(0, HZ + 8, W, H - HZ);
  var lit = g.createLinearGradient(0, B, W, H);                                                  // low winter sun from the left: warm, then cool
  lit.addColorStop(0, "rgba(255,244,225,.35)"); lit.addColorStop(0.5, "rgba(255,255,255,0)"); lit.addColorStop(1, "rgba(150,175,210,.18)");
  g.fillStyle = lit; g.fillRect(0, B + 30, W, H - B);
  for (i = 0; i < 40; i++) { x = rand(-60, W + 60); y = B + 70 + (i / 40) * (H - B - 60) + rand(-20, 20); drift(g, x, y, rand(50, 150) * (0.7 + 0.5 * (y - B) / (H - B)), rand(6, 13)); }
  // the lane along the back: trodden snow with wheel ruts
  g.fillStyle = "#E2E0DC"; rr(g, -20, B - 4, W + 40, 34, 14); g.fill();
  g.strokeStyle = "rgba(150,140,130,.35)"; g.lineWidth = 2;
  [B + 6, B + 18].forEach(function (yy) { g.beginPath(); for (var xx = -10; xx <= W + 10; xx += 20) { var yv = yy + Math.sin(xx / 90) * 1.5; if (xx === -10) g.moveTo(xx, yv); else g.lineTo(xx, yv); } g.stroke(); });
  g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.moveTo(-20, B + 30);                     // the snowbank along its front edge
  for (x = -20; x <= W + 20; x += 18) g.lineTo(x, B + 30 - 3 - 3 * Math.abs(Math.sin(x / 37)));
  g.lineTo(W + 20, B + 38); g.lineTo(-20, B + 38); g.closePath(); g.fill();
  // paths across the green: from the lane to the cottage gate, and to the pond
  G.paths = [[[G.tree.x - 30, B + 30], [W * 0.62, H * 0.62], [G.home.x, G.home.y + 34]], [[G.lane.x + 40, B + 30], [W * 0.25, H * 0.66], [G.pond.x + 60, G.pond.y - G.pond.ry]]];
  G.paths.forEach(function (p) { trodden(g, p, 26); });
  // the ground under the back row: blue shadow on the lane, before the walls go up
  [[G.school.x, 92], [G.cot[0].x, 52], [G.church.x + 16, 82], [G.pub.x, 74], [G.post.x, 62], [G.cot[1].x, 48], [G.smithy.x, 66]]
    .forEach(function (b) { aoShadow(g, b[0], B + 1, b[1], 9, 0.26, "80,100,150"); });
  // the back row, far to near does not matter here: left to right
  school(g, G.school.x, G.school.y);
  cottage(g, G.cot[0]);
  church(g, G.church.x, G.church.y);
  pub(g, G.pub.x, G.pub.y);
  postOffice(g, G.post.x, G.post.y);
  cottage(g, G.cot[1]);
  smithy(g, G.smithy.x, G.smithy.y);
  // the lamps along the lane, with Christmas lights strung between them
  var lx = [0.155, 0.255, 0.405, 0.535, 0.635, 0.735, 0.82, 0.93];
  lx.forEach(function (f) { lamp(g, W * f, B + 30); });
  g.fillStyle = "rgba(90,110,160,.2)";                                                                 // the lamps' long shadows, sun from the left
  G.lamps.forEach(function (l) { g.beginPath(); g.moveTo(l.x - 2, l.foot); g.lineTo(l.x + 2, l.foot); g.lineTo(l.x + 64, l.foot + 13); g.lineTo(l.x + 58, l.foot + 14); g.closePath(); g.fill(); });
  for (i = 0; i < G.lamps.length - 1; i++) { var a = G.lamps[i], b = G.lamps[i + 1];
    if (Math.abs(b.x - G.tree.x) < 30 || Math.abs(a.x - G.tree.x) < 30) continue;
    string(g, a.x, a.y + 10, b.x, b.y + 10, 16); }
  villageTree(g, G.tree.x, G.tree.y);
  pond(g);
  G.snowmen.forEach(function (m) { snowman(g, m.x, m.y, m.s, m.kid); });
  homeCottage(g, G.home.x, G.home.y);
  // snowy firs framing the green's left edge, tracks across it, a bird table by the pond
  [[22, H * 0.6, 92], [62, H * 0.52, 70], [W - 18, H * 0.47, 80]].forEach(function (f) { aoShadow(g, f[0] + f[2] * 0.4, f[1] + 2, f[2] * 0.55, 7, 0.28, "80,100,150"); fir(g, f[0], f[1], f[2], "#3F6B58", 1); });
  tracks(g, [[W * 0.1, H * 0.98], [W * 0.42, H * 0.72], [W * 0.66, H * 0.84]]);
  birdTable(g, G.pond.x + G.pond.rx + 40, G.pond.y - 10);
  snowballs(g, W * 0.665, H * 0.5);
  // bushes, a holly with berries, a sledge, tufts of grass poking through
  [[0.055, 0.6], [0.035, 0.95], [0.47, 0.985], [0.97, 0.94], [0.62, 0.99]].forEach(function (b) { snowBush(g, W * b[0], H * b[1], 1); });
  holly(g, W * 0.37, H * 0.965);
  sledge(g, W * 0.5, H * 0.9);
  for (i = 0; i < 34; i++) { x = rand(0, W); y = rand(B + 60, H - 4);
    if (S.inZone(x, y, 14)) continue;
    g.strokeStyle = "rgba(170,150,100,.55)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 3, y - 5); g.lineTo(x, y); g.lineTo(x + 1, y - 7); g.moveTo(x, y); g.lineTo(x + 4, y - 4); g.stroke(); }
  G.glints = []; for (i = 0; i < 46; i++) G.glints.push({ x: rand(0, W), y: rand(B + 50, H - 4), ph: rand(0, 6) });
}

// A drift: a soft mound, lit on top, a blue shadow along its lee.
function drift(g, x, y, rw, rh) {
  var dg = g.createLinearGradient(0, y - rh, 0, y + 2);
  dg.addColorStop(0, "rgba(255,255,255,1)"); dg.addColorStop(0.6, "rgba(236,242,250,.6)"); dg.addColorStop(1, "rgba(190,208,232,.25)");
  g.fillStyle = dg; g.beginPath(); g.moveTo(x - rw, y); g.bezierCurveTo(x - rw * 0.5, y - rh * 1.2, x + rw * 0.2, y - rh * 1.3, x + rw, y); g.closePath(); g.fill();
  g.strokeStyle = "rgba(140,165,200,.42)"; g.lineWidth = 2.2; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - rw * 0.55, y - rh * 0.55); g.bezierCurveTo(x - rw * 0.1, y - rh * 1.05, x + rw * 0.35, y - rh * 0.8, x + rw * 0.8, y - rh * 0.1); g.stroke();
}
function hills(g, y, amp, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(0, G.H);
  for (var x = 0; x <= G.W; x += 16) g.lineTo(x, y - amp * (0.6 * Math.sin(x / 230 + seed) + 0.4 * Math.sin(x / 101 + seed * 2.3)));
  g.lineTo(G.W, G.H); g.closePath(); g.fill();
}
// A fir with snow lying on its tiers.
function fir(g, x, y, h, col, snow) {
  var w = h * 0.5;
  g.fillStyle = "#6B5A4C"; g.fillRect(x - 1.5, y - h * 0.12, 3, h * 0.14);
  for (var k = 0; k < 3; k++) { var ty = y - h * 0.1 - k * h * 0.28, tw = w * (1 - k * 0.24);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - tw, ty); g.lineTo(x, ty - h * 0.42); g.lineTo(x + tw, ty); g.closePath(); g.fill();
    if (snow) { g.fillStyle = "rgba(255,255,255," + (0.6 + 0.3 * snow) + ")"; g.beginPath(); g.moveTo(x - tw * 0.55, ty - h * 0.18); g.lineTo(x, ty - h * 0.42); g.lineTo(x + tw * 0.55, ty - h * 0.18);
      g.quadraticCurveTo(x, ty - h * 0.24, x - tw * 0.55, ty - h * 0.18); g.fill(); } }
}
// The first t of a quadratic curve, as a quadratic curve.
function part(p, t) {
  var a = p[0], b = p[1], c = p[2], ab = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bc = [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t];
  return [a, ab, [ab[0] + (bc[0] - ab[0]) * t, ab[1] + (bc[1] - ab[1]) * t]];
}
function trodden(g, p, w) {
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "rgba(205,200,195,.75)"; g.lineWidth = w; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.quadraticCurveTo(p[1][0], p[1][1], p[2][0], p[2][1]); g.stroke();
  g.strokeStyle = "rgba(180,172,165,.35)"; g.lineWidth = 2; g.setLineDash([3, 9]);                  // footprints
  [-5, 5].forEach(function (o) { g.beginPath(); g.moveTo(p[0][0] + o, p[0][1]); g.quadraticCurveTo(p[1][0] + o, p[1][1], p[2][0] + o, p[2][1]); g.stroke(); });
  g.setLineDash([]);
}

// ── Buildings ──────────────────────────────────────────────────────────────────
// Walls, then a roof in snow: a dark eave line, a white top shaded blue underneath, a soft
// overhang with drips, and icicles. The ridge runs along the lane.
function walls(g, x0, w, top, h, col) { rimmed(g, "rgba(80,70,70,.55)", col, 1.2, function (e) { g.fillRect(x0 - e, top - e, w + 2 * e, h + 2 * e); });
  var sg = g.createLinearGradient(x0 + w * 0.45, 0, x0 + w, 0); sg.addColorStop(0, "rgba(40,40,70,0)"); sg.addColorStop(1, "rgba(40,40,70,.13)");   // shaded on the right
  g.fillStyle = sg; g.fillRect(x0, top, w, h);
  var eg = g.createLinearGradient(0, top, 0, top + 10); eg.addColorStop(0, "rgba(40,40,70,.18)"); eg.addColorStop(1, "rgba(40,40,70,0)");          // under the eaves
  g.fillStyle = eg; g.fillRect(x0, top, w, 10); }
function snowRoof(g, x0, x1, base, rh, slate) {
  var o = 9, inset = Math.min(22, (x1 - x0) * 0.18);
  g.fillStyle = slate; g.beginPath(); g.moveTo(x0 - o, base + 2); g.lineTo(x0 + inset, base - rh); g.lineTo(x1 - inset, base - rh); g.lineTo(x1 + o, base + 2); g.closePath(); g.fill();
  var sg = g.createLinearGradient(0, base - rh, 0, base);
  sg.addColorStop(0, "#FFFFFF"); sg.addColorStop(1, "#E3EAF2");
  g.fillStyle = sg; g.beginPath(); g.moveTo(x0 - o + 2, base - 3); g.lineTo(x0 + inset - 1, base - rh - 4);
  g.quadraticCurveTo((x0 + x1) / 2, base - rh - 8, x1 - inset + 1, base - rh - 4); g.lineTo(x1 + o - 2, base - 3);
  for (var x = x1 + o - 2; x >= x0 - o + 2; x -= 9) g.quadraticCurveTo(x - 4.5, base + 2 + (Math.sin(x * 1.3) + 1) * 1.6, x - 9, base - 2);   // the overhang's soft drips
  g.closePath(); g.fill();
  g.fillStyle = "rgba(160,180,205,.35)"; g.fillRect(x0 - o + 3, base - 4, x1 - x0 + 2 * o - 6, 2);
  g.fillStyle = "rgba(225,240,255,.95)";                                                           // icicles
  for (x = x0 - 4; x < x1 + 4; x += 7 + (Math.abs(Math.sin(x)) * 8)) { var l = 4 + Math.abs(Math.sin(x * 3.1)) * 9;
    g.beginPath(); g.moveTo(x - 1.6, base + 1); g.lineTo(x + 1.6, base + 1); g.lineTo(x, base + 1 + l); g.closePath(); g.fill(); }
}
function chimney(g, x, y, w, h, col) {
  g.fillStyle = col || "#9C6A56"; g.fillRect(x - w / 2, y - h, w, h);
  g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x - w / 2, y - h + 4, w, 2);
  g.fillStyle = "#6E5A52"; g.fillRect(x - w / 2 - 2, y - h - 3, w + 4, 4);
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(x, y - h - 3, w / 2 + 3, 3.5, 0, Math.PI, 0); g.fill();
  G.chims.push({ x: x, y: y - h - 6, n: G.chims.length });
}
// A lit window: warm glass, glazing bars, snow on the sill. Kept for the light layer.
function win(g, x, y, w, h, arch) {
  g.fillStyle = "#5A4A42"; if (arch) { g.beginPath(); g.moveTo(x - 1.5, y + h + 1.5); g.lineTo(x - 1.5, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + 1.5, Math.PI, 0); g.lineTo(x + w + 1.5, y + h + 1.5); g.closePath(); g.fill(); }
  else g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  var wg = g.createLinearGradient(0, y, 0, y + h); wg.addColorStop(0, "#FFE7A8"); wg.addColorStop(1, "#F6B860");
  g.fillStyle = wg; if (arch) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fill(); }
  else g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(90,70,60,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + w / 2, y + (arch ? 2 : 0)); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.5); g.stroke();
  g.fillStyle = "#FFFFFF"; rr(g, x - 3, y + h, w + 6, 3.5, 1.5); g.fill();
  G.wins.push({ x: x + w / 2, y: y + h / 2, w: w, h: h });
}
function door(g, x, y, w, h, col, wreath) {
  g.fillStyle = "#5A4A42"; rr(g, x - 1.5, y - 1.5, w + 3, h + 1.5, Math.min(6, w / 2)); g.fill();
  g.fillStyle = col; rr(g, x, y, w, h, Math.min(5, w / 2)); g.fill();
  g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + w * 0.15, y + h * 0.18, w * 0.7, h * 0.25); g.fillRect(x + w * 0.15, y + h * 0.55, w * 0.7, h * 0.3);
  g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(x + w - 3.5, y + h * 0.55, 1.4, 0, 7); g.fill();
  if (wreath) { var cx = x + w / 2, cy = y + h * 0.3, r = Math.max(4, w * 0.28);
    g.strokeStyle = "#2F6B45"; g.lineWidth = r * 0.7; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.fillStyle = "#D23B3B"; for (var a = 0; a < 6; a++) { g.beginPath(); g.arc(cx + Math.cos(a * 1.05 + 0.3) * r, cy + Math.sin(a * 1.05 + 0.3) * r, 1.2, 0, 7); g.fill(); }
    g.fillStyle = "#D23B3B"; g.beginPath(); g.moveTo(cx - 3, cy + r + 1); g.lineTo(cx + 3, cy + r + 1); g.lineTo(cx, cy + r - 2); g.closePath(); g.fill(); }
  G.doors.push({ x: x + w / 2, y: y + h, w: w });
}

// The village school: grey stone, tall arched windows, a bell-cote on the gable, a board.
function school(g, x, y) {
  var w = 158, h = 70;
  chimney(g, x + w / 2 - 22, y - h - 18, 10, 18, "#A39A8C");
  walls(g, x - w / 2, w, y - h, h, "#DCD3C2");
  g.strokeStyle = "rgba(140,130,115,.35)"; g.lineWidth = 1; for (var k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x - w / 2, y - h + k * h / 6); g.lineTo(x + w / 2, y - h + k * h / 6); g.stroke(); }
  snowRoof(g, x - w / 2, x + w / 2, y - h, 34, "#5E6878");
  // the gabled porch in the middle with the bell-cote above
  var px = x, pw = 44;
  g.fillStyle = "#D2C8B5"; g.fillRect(px - pw / 2, y - h - 6, pw, h + 6);
  g.fillStyle = "#5E6878"; g.beginPath(); g.moveTo(px - pw / 2 - 6, y - h - 4); g.lineTo(px, y - h - 34); g.lineTo(px + pw / 2 + 6, y - h - 4); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(px - pw / 2 - 7, y - h - 2); g.lineTo(px, y - h - 37); g.lineTo(px + pw / 2 + 7, y - h - 2); g.lineTo(px + pw / 2, y - h - 4); g.lineTo(px, y - h - 30); g.lineTo(px - pw / 2, y - h - 4); g.closePath(); g.fill();
  g.fillStyle = "#D2C8B5"; g.fillRect(px - 7, y - h - 52, 14, 20);
  g.fillStyle = "#3E4450"; rr(g, px - 4, y - h - 48, 8, 11, 4); g.fill();
  G.bell = { x: px, y: y - h - 46 };
  g.fillStyle = "#5E6878"; g.beginPath(); g.moveTo(px - 10, y - h - 51); g.lineTo(px, y - h - 62); g.lineTo(px + 10, y - h - 51); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(px - 11, y - h - 50); g.lineTo(px, y - h - 63); g.lineTo(px, y - h - 58); g.closePath(); g.fill();
  door(g, px - 10, y - 30, 20, 30, "#3B5FA8", true);
  win(g, px - 7, y - h + 4, 14, 14, true);
  [-1, 1].forEach(function (s) { win(g, x + s * 50 - 10, y - h + 14, 20, 34, true); });
  g.fillStyle = "#3B5FA8"; rr(g, x + 26, y - 26, 44, 13, 3); g.fill();                             // the board
  g.fillStyle = "#FFFFFF"; g.font = "600 8px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SCHOOL", x + 48, y - 19);
  g.strokeStyle = "#6B5440"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 32, y - 13); g.lineTo(x + 32, y); g.moveTo(x + 64, y - 13); g.lineTo(x + 64, y); g.stroke();
  // railings and the gate on to the lane
  g.strokeStyle = "#3E4450"; g.lineWidth = 1.4;
  for (var r = x - w / 2 - 8; r < x + w / 2 + 10; r += 6) { if (Math.abs(r - px) < 14) continue; g.beginPath(); g.moveTo(r, y + 6); g.lineTo(r, y - 6); g.stroke(); }
  g.beginPath(); g.moveTo(x - w / 2 - 8, y - 3); g.lineTo(px - 14, y - 3); g.moveTo(px + 14, y - 3); g.lineTo(x + w / 2 + 10, y - 3); g.stroke();
  g.fillStyle = "#FFFFFF"; g.fillRect(x - w / 2 - 9, y - 8, px - 14 - (x - w / 2 - 9), 2.2); g.fillRect(px + 14, y - 8, x + w / 2 + 10 - px - 14, 2.2);
}
function cottage(g, c) {
  var x = c.x, y = c.y, w = c.w, h = c.h;
  chimney(g, x - w * 0.3, y - h - 14, 10, 16);
  walls(g, x - w / 2, w, y - h, h, c.wall);
  snowRoof(g, x - w / 2, x + w / 2, y - h, 30, c.roof);
  chimney(g, x + w * 0.32, y - h - 18, 9, 10);
  door(g, x - 9, y - 26, 18, 26, c.door, true);
  win(g, x - w / 2 + 9, y - h + 12, 16, 14); win(g, x + w / 2 - 25, y - h + 12, 16, 14);
}
// The church: a square tower with a short spire on the left, the nave to its right, a
// round stained-glass window and a lychgate. The bell in the tower swings for carols.
function church(g, x, y) {
  var tx = x - 54, tw = 40, th = 112, nw = 120, nh = 62;
  walls(g, x - 34, nw, y - nh, nh, "#CFC6B4");
  snowRoof(g, x - 34, x - 34 + nw, y - nh, 40, "#5B6470");
  [x - 14, x + 18, x + 50].forEach(function (wx) { glass(g, wx, y - nh + 10, 14, 30); });
  walls(g, tx - tw / 2, tw, y - th, th, "#C7BEAB");                                                 // the tower
  g.strokeStyle = "rgba(120,110,95,.4)"; g.lineWidth = 1; for (var k = 1; k < 9; k++) { g.beginPath(); g.moveTo(tx - tw / 2, y - th + k * th / 9); g.lineTo(tx + tw / 2, y - th + k * th / 9); g.stroke(); }
  g.fillStyle = "#C7BEAB"; for (k = 0; k < 4; k++) g.fillRect(tx - tw / 2 + k * 11, y - th - 6, 7, 7);   // battlements
  g.fillStyle = "#FFFFFF"; for (k = 0; k < 4; k++) { g.beginPath(); g.ellipse(tx - tw / 2 + 3.5 + k * 11, y - th - 6, 5, 2.5, 0, Math.PI, 0); g.fill(); }
  g.fillStyle = "#56606E"; g.beginPath(); g.moveTo(tx - 14, y - th - 1); g.lineTo(tx, y - th - 52); g.lineTo(tx + 14, y - th - 1); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(tx - 15, y - th); g.lineTo(tx, y - th - 52); g.lineTo(tx - 4, y - th - 20); g.lineTo(tx + 2, y - th - 10); g.lineTo(tx - 6, y - th - 3); g.closePath(); g.fill();
  g.strokeStyle = "#C9A84A"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tx, y - th - 52); g.lineTo(tx, y - th - 62); g.moveTo(tx - 4, y - th - 58); g.lineTo(tx + 4, y - th - 58); g.stroke();
  g.fillStyle = "#3E4450"; rr(g, tx - 8, y - th + 8, 16, 18, 8); g.fill();                         // the belfry opening
  G.churchBell = { x: tx, y: y - th + 11 };
  g.fillStyle = "#F4F1E8"; g.beginPath(); g.arc(tx, y - th + 42, 9, 0, 7); g.fill();                // the clock
  g.strokeStyle = "#3E4450"; g.lineWidth = 1.4; g.beginPath(); g.arc(tx, y - th + 42, 9, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(tx, y - th + 42); g.lineTo(tx, y - th + 36); g.moveTo(tx, y - th + 42); g.lineTo(tx + 5, y - th + 43); g.stroke();
  door(g, tx - 9, y - 30, 18, 30, "#6B3F2A", true);
  var rx = x + 74;                                                                                  // the round window in the nave's end
  g.fillStyle = "#5A4A42"; g.beginPath(); g.arc(rx, y - nh + 22, 10, 0, 7); g.fill();
  ["#E86A5B", "#F2C14E", "#6C8FD0", "#7BC47F"].forEach(function (c, n) { g.fillStyle = c; g.beginPath(); g.moveTo(rx, y - nh + 22); g.arc(rx, y - nh + 22, 8, n * Math.PI / 2, (n + 1) * Math.PI / 2); g.closePath(); g.fill(); });
  G.wins.push({ x: rx, y: y - nh + 22, w: 16, h: 16, glass: true });
  G.churchDoor = { x: tx, y: y };
  // the lychgate on the lane: two posts and a little snowy roof
  var lg = x + 20;
  g.fillStyle = "#7A5A42"; g.fillRect(lg - 16, y - 2, 3, 26); g.fillRect(lg + 13, y - 2, 3, 26);
  g.fillStyle = "#5B6470"; g.beginPath(); g.moveTo(lg - 22, y + 1); g.lineTo(lg, y - 12); g.lineTo(lg + 22, y + 1); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(lg - 23, y + 2); g.lineTo(lg, y - 15); g.lineTo(lg + 23, y + 2); g.quadraticCurveTo(lg, y - 6, lg - 23, y + 2); g.fill();
  // gravestones in the snow beside it
  [[x + 64, 8], [x + 82, 10], [x + 98, 7]].forEach(function (s) { g.fillStyle = "#A9A69E"; rr(g, s[0] - 4, y + 10 - s[1], 8, s[1] + 2, 4); g.fill();
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(s[0], y + 10 - s[1], 4.5, 2, 0, Math.PI, 0); g.fill(); });
}
function glass(g, x, y, w, h) {
  g.fillStyle = "#4A3E3A"; g.beginPath(); g.moveTo(x - 1.5, y + h + 1.5); g.lineTo(x - 1.5, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + 1.5, Math.PI, 0); g.lineTo(x + w + 1.5, y + h + 1.5); g.closePath(); g.fill();
  var cols = ["#E86A5B", "#F2C14E", "#6C8FD0", "#7BC47F", "#C98AD8"];
  g.save(); g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip();
  for (var i = 0; i < 6; i++) for (var j = 0; j < 2; j++) { g.fillStyle = cols[(i * 2 + j) % cols.length]; g.fillRect(x + j * w / 2, y + i * h / 6, w / 2, h / 6); }
  g.restore();
  g.fillStyle = "#FFFFFF"; rr(g, x - 2, y + h, w + 4, 3, 1.5); g.fill();
  G.wins.push({ x: x + w / 2, y: y + h / 2, w: w, h: h, glass: true });
}
// The Robin: whitewashed, black window frames, a bay window, and its sign on a post.
function pub(g, x, y) {
  var w = 128, h = 76;
  chimney(g, x - w / 2 + 16, y - h - 22, 12, 22, "#B9705A"); chimney(g, x + w / 2 - 16, y - h - 22, 12, 22, "#B9705A");
  walls(g, x - w / 2, w, y - h, h, "#F3EEE4");
  g.fillStyle = "#2F2A2A"; g.fillRect(x - w / 2, y - h, w, 3); g.fillRect(x - w / 2, y - 4, w, 4);
  snowRoof(g, x - w / 2, x + w / 2, y - h, 34, "#4F5866");
  win(g, x - w / 2 + 12, y - h + 10, 18, 16); win(g, x - 9, y - h + 10, 18, 16); win(g, x + w / 2 - 30, y - h + 10, 18, 16);
  g.fillStyle = "#2F2A2A"; g.fillRect(x + 12, y - 36, 42, 30);                                        // the bay window
  win(g, x + 15, y - 33, 36, 22);
  g.fillStyle = "#2F2A2A"; g.fillRect(x + 10, y - 8, 46, 4);
  door(g, x - 30, y - 32, 20, 32, "#2E5B44", true);
  g.fillStyle = "#2F2A2A"; g.fillRect(x - w / 2 + 6, y - 46, w - 12, 9);                               // the fascia
  g.fillStyle = "#F2D27A"; g.font = "600 7.5px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("THE ROBIN", x, y - 41);
  // the sign post on the lane (the board swings live)
  var sx = x - w / 2 - 22; G.sign = { x: sx + 14, y: y - 70 };
  g.fillStyle = "#3A2E28"; g.fillRect(sx - 2, y - 78, 5, 84); g.fillRect(sx - 2, y - 78, 30, 4);
  g.fillStyle = "#FFFFFF"; g.fillRect(sx - 3, y - 81, 33, 3);
  // hanging baskets of holly by the door
  [x - 38, x - 2].forEach(function (bx) { g.fillStyle = "#3E7A4E"; g.beginPath(); g.arc(bx, y - 28, 5, 0, Math.PI); g.fill(); g.fillStyle = "#D23B3B"; g.beginPath(); g.arc(bx - 1.5, y - 27, 1.4, 0, 7); g.arc(bx + 2, y - 26, 1.4, 0, 7); g.fill(); });
}
function postOffice(g, x, y) {
  var w = 104, h = 70;
  chimney(g, x + w / 2 - 20, y - h - 16, 11, 18, "#8E4A3C");
  walls(g, x - w / 2, w, y - h, h, "#C9806A");
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; for (var k = 1; k < 10; k++) { g.beginPath(); g.moveTo(x - w / 2, y - h + k * 7); g.lineTo(x + w / 2, y - h + k * 7); g.stroke(); }
  snowRoof(g, x - w / 2, x + w / 2, y - h, 30, "#5B6470");
  win(g, x - w / 2 + 12, y - h + 8, 16, 14); win(g, x + w / 2 - 28, y - h + 8, 16, 14);
  g.fillStyle = "#B8302A"; g.fillRect(x - w / 2 + 4, y - 44, w - 8, 11);                              // fascia
  g.fillStyle = "#FFF4E0"; g.font = "600 7.5px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("POST OFFICE", x, y - 38.5);
  win(g, x - w / 2 + 8, y - 30, 40, 22);                                                            // the shop window, full of parcels
  [["#E86A5B", 0], ["#6C8FD0", 12], ["#7BC47F", 24]].forEach(function (p) { g.fillStyle = p[0]; g.fillRect(x - w / 2 + 12 + p[1], y - 15, 9, 7); g.fillStyle = "#F2C14E"; g.fillRect(x - w / 2 + 15.5 + p[1], y - 15, 2, 7); });
  door(g, x + 14, y - 30, 20, 30, "#3B5FA8", true);
  // the pillar box on the kerb
  var bx = x + w / 2 + 12; G.postbox = { x: bx, y: y + 12 };
  rimmed(g, "#7E2A24", "#D9433A", 1.5, function (e) { rr(g, bx - 7 - e, y - 18 - e, 14 + 2 * e, 30 + 2 * e, 7); g.fill(); });
  g.fillStyle = "#3B2A26"; g.fillRect(bx - 4, y - 10, 8, 2);
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(bx, y - 18, 8, 4, 0, Math.PI, 0); g.fill();
}
// The smithy: a dark timber forge with its big doors open on the fire, an anvil outside.
function smithy(g, x, y) {
  var w = 112, h = 64;
  chimney(g, x - 30, y - h - 22, 16, 30, "#7A6A62");
  walls(g, x - w / 2, w, y - h, h, "#6E5E54");
  g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 1; for (var k = 1; k < 12; k++) { g.beginPath(); g.moveTo(x - w / 2 + k * w / 12, y - h); g.lineTo(x - w / 2 + k * w / 12, y); g.stroke(); }
  snowRoof(g, x - w / 2, x + w / 2, y - h, 30, "#4E4A48");
  g.fillStyle = "#2A2220"; rr(g, x - 26, y - 44, 52, 44, 6); g.fill();                              // the open doors and the fire within
  var fg = g.createRadialGradient(x - 4, y - 14, 2, x - 4, y - 14, 26); fg.addColorStop(0, "#FFD27A"); fg.addColorStop(0.45, "#F08A3A"); fg.addColorStop(1, "rgba(120,40,20,0)");
  g.fillStyle = fg; g.fillRect(x - 26, y - 44, 52, 44);
  G.forge = { x: x - 4, y: y - 16 };
  g.fillStyle = "#4E3E36"; g.fillRect(x - 34, y - 46, 8, 46); g.fillRect(x + 26, y - 46, 8, 46);     // door leaves folded back
  g.fillStyle = "#3E4450"; g.fillRect(x - 26, y - 50, 52, 5);
  g.fillStyle = "#F2D27A"; g.font = "600 7px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("FORGE", x, y - 47);
  win(g, x + 36, y - h + 12, 14, 12);
  var ax = x + 50; G.anvil = { x: ax, y: y + 14 };                                                   // the anvil on its block, and a horseshoe on the wall
  g.fillStyle = "#7A5A42"; g.fillRect(ax - 5, y + 2, 10, 12);
  g.fillStyle = "#3E4450"; g.beginPath(); g.moveTo(ax - 12, y); g.lineTo(ax + 9, y); g.lineTo(ax + 14, y - 4); g.lineTo(ax - 9, y - 4); g.closePath(); g.fill(); g.fillRect(ax - 4, y, 8, 3);
  g.fillStyle = "#FFFFFF"; g.fillRect(ax - 9, y - 6, 18, 2);
  g.strokeStyle = "#B8B4AC"; g.lineWidth = 2; g.beginPath(); g.arc(x - 44, y - h + 20, 5, 0.2, Math.PI - 0.2, true); g.stroke();
}
// The family's cottage on the green: bigger, nearer, roses-over-the-door sort of place in
// the summer, a wreath and a lantern now, a picket fence, a path to the gate.
function homeCottage(g, x, y) {
  var w = 158, h = 84;
  g.fillStyle = "rgba(150,170,200,.25)"; g.beginPath(); g.ellipse(x, y + 4, w * 0.7, 14, 0, 0, 7); g.fill();
  chimney(g, x - w / 2 + 26, y - h - 26, 15, 30, "#B9705A");
  walls(g, x - w / 2, w, y - h, h, "#F2E6CF");
  g.fillStyle = "rgba(160,130,90,.14)"; for (var k = 0; k < 18; k++) { g.beginPath(); g.ellipse(x - w / 2 + rand(8, w - 8), y - h + rand(6, h - 6), rand(5, 10), rand(2, 4), 0, 0, 7); g.fill(); }
  snowRoof(g, x - w / 2, x + w / 2, y - h, 46, "#7A5A4E");
  chimney(g, x + w / 2 - 22, y - h - 30, 13, 20, "#B9705A");
  // a dormer in the roof
  g.fillStyle = "#F2E6CF"; g.fillRect(x - 14, y - h - 34, 28, 26);
  g.fillStyle = "#7A5A4E"; g.beginPath(); g.moveTo(x - 20, y - h - 32); g.lineTo(x, y - h - 48); g.lineTo(x + 20, y - h - 32); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(x - 22, y - h - 31); g.lineTo(x, y - h - 51); g.lineTo(x + 22, y - h - 31); g.quadraticCurveTo(x, y - h - 40, x - 22, y - h - 31); g.fill();
  win(g, x - 8, y - h - 28, 16, 14);
  win(g, x - w / 2 + 14, y - h + 14, 26, 22); win(g, x + w / 2 - 40, y - h + 14, 26, 22);
  win(g, x - w / 2 + 14, y - 34, 26, 22); win(g, x + w / 2 - 40, y - 34, 26, 22);
  // the porch: a little snowy hood over a red door with a wreath, a lantern beside it
  door(g, x - 13, y - 40, 26, 40, "#C0392B", true);
  g.fillStyle = "#7A5A4E"; g.beginPath(); g.moveTo(x - 22, y - 42); g.lineTo(x, y - 56); g.lineTo(x + 22, y - 42); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(x - 24, y - 41); g.lineTo(x, y - 59); g.lineTo(x + 24, y - 41); g.quadraticCurveTo(x, y - 49, x - 24, y - 41); g.fill();
  G.homeLamp = { x: x + 22, y: y - 34 };
  g.fillStyle = "#2F2A2A"; g.fillRect(x + 19, y - 40, 6, 9); g.fillStyle = "#FFD98A"; g.fillRect(x + 20, y - 38, 4, 6);
  // the picket fence along the front, a gap at the gate, snow along the rails
  g.fillStyle = "#FBF8F2";
  for (var px = x - w / 2 - 22; px <= x + w / 2 + 22; px += 9) { if (Math.abs(px - x) < 16) continue;
    g.beginPath(); g.moveTo(px - 2.5, y + 30); g.lineTo(px - 2.5, y + 16); g.lineTo(px, y + 13); g.lineTo(px + 2.5, y + 16); g.lineTo(px + 2.5, y + 30); g.closePath(); g.fill(); }
  g.fillRect(x - w / 2 - 24, y + 19, w / 2 + 8, 2.5); g.fillRect(x + 16, y + 19, w / 2 + 8, 2.5);
  g.strokeStyle = "rgba(150,160,180,.6)"; g.lineWidth = 0.8;
  for (px = x - w / 2 - 22; px <= x + w / 2 + 22; px += 9) { if (Math.abs(px - x) < 16) continue; g.beginPath(); g.moveTo(px - 2.5, y + 30); g.lineTo(px - 2.5, y + 16); g.lineTo(px, y + 13); g.lineTo(px + 2.5, y + 16); g.lineTo(px + 2.5, y + 30); g.stroke(); }
  g.fillStyle = "rgba(205,200,195,.8)"; g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x + 12, y); g.lineTo(x + 16, y + 32); g.lineTo(x - 16, y + 32); g.closePath(); g.fill();
  snowBush(g, x - w / 2 - 6, y + 4, 0.8); snowBush(g, x + w / 2 + 8, y + 2, 0.9);
  G.home.w = w; G.home.h = h;
}

// ── Green furniture ────────────────────────────────────────────────────────────
function lamp(g, x, y) {
  g.fillStyle = "rgba(120,140,170,.25)"; g.beginPath(); g.ellipse(x, y + 1, 7, 2.5, 0, 0, 7); g.fill();
  g.fillStyle = "#2F3540"; g.fillRect(x - 1.8, y - 62, 3.6, 62); g.fillRect(x - 4, y - 6, 8, 6);
  g.fillRect(x - 6, y - 64, 12, 3);
  g.fillStyle = "#FFE29A"; g.beginPath(); g.moveTo(x - 5, y - 76); g.lineTo(x + 5, y - 76); g.lineTo(x + 4, y - 64); g.lineTo(x - 4, y - 64); g.closePath(); g.fill();
  g.fillStyle = "#2F3540"; g.beginPath(); g.moveTo(x - 7, y - 76); g.lineTo(x, y - 83); g.lineTo(x + 7, y - 76); g.closePath(); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(x, y - 78, 5, 2.5, 0, Math.PI, 0); g.fill();
  G.lamps.push({ x: x, y: y - 70, foot: y });
}
// Lights on a sagging wire between two points; the bulbs twinkle live.
function string(g, x0, y0, x1, y1, sag) {
  var cols = ["#FF5A5A", "#FFD24A", "#5AD27A", "#5AA8FF", "#FF8AD0"];
  g.strokeStyle = "rgba(50,50,60,.6)"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag * 2, x1, y1); g.stroke();
  var n = Math.max(4, Math.round((x1 - x0) / 11));
  for (var i = 1; i < n; i++) { var t = i / n, x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (Math.max(y0, y1) + sag * 2) + t * t * y1;
    G.bulbs.push({ x: x, y: y + 2, c: cols[G.bulbs.length % cols.length], ph: G.bulbs.length * 0.9 }); }
}
function villageTree(g, x, y) {
  g.fillStyle = "rgba(120,140,170,.3)"; g.beginPath(); g.ellipse(x, y + 2, 44, 9, 0, 0, 7); g.fill();
  g.fillStyle = "#7A5A42"; g.fillRect(x - 5, y - 16, 10, 16);
  g.fillStyle = "#B8433A"; rr(g, x - 14, y - 12, 28, 14, 3); g.fill();                              // a tub, wrapped
  g.fillStyle = "#F2C14E"; g.fillRect(x - 14, y - 7, 28, 3);
  var tiers = 5, h = 150, base = y - 12;
  G.treeBulbs = [];
  for (var k = 0; k < tiers; k++) { var ty = base - k * h / (tiers + 0.6), tw = 50 * (1 - k / (tiers + 0.4)), th = h / (tiers - 1.2);
    g.fillStyle = k % 2 ? "#2F6B4E" : "#357656"; g.beginPath(); g.moveTo(x - tw, ty); g.quadraticCurveTo(x - tw * 0.4, ty - th * 0.35, x, ty - th); g.quadraticCurveTo(x + tw * 0.4, ty - th * 0.35, x + tw, ty);
    g.quadraticCurveTo(x, ty + 6, x - tw, ty); g.fill();
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.moveTo(x - tw * 0.8, ty - 2); g.quadraticCurveTo(x - tw * 0.3, ty - th * 0.3, x, ty - th * 0.62);
    g.quadraticCurveTo(x + tw * 0.2, ty - th * 0.3, x + tw * 0.6, ty - 4); g.quadraticCurveTo(x, ty - th * 0.2, x - tw * 0.8, ty - 2); g.fill();
    for (var b = 0; b < 5; b++) { var bt = (b + 0.5) / 5, bx = x - tw * 0.85 + tw * 1.7 * bt, by = ty + 1 - Math.sin(bt * Math.PI) * 3;
      G.treeBulbs.push({ x: bx, y: by, c: ["#FF5A5A", "#FFD24A", "#5AA8FF", "#FF8AD0", "#FFFFFF"][(k + b) % 5], ph: k * 1.7 + b }); }
    [[-0.5, -0.3, "#D9433A"], [0.45, -0.35, "#F2C14E"]].forEach(function (o) { g.fillStyle = o[2]; g.beginPath(); g.arc(x + tw * o[0], ty + th * o[1], 3, 0, 7); g.fill(); });
  }
  G.star = { x: x, y: base - h - 6 };
  g.fillStyle = "#F2C14E"; starPath(g, x, base - h - 6, 9); g.fill();
}
function starPath(g, x, y, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
function pond(g) {
  var p = G.pond;
  g.fillStyle = "rgba(150,170,200,.35)"; g.beginPath(); g.ellipse(p.x + 4, p.y + 6, p.rx + 10, p.ry + 8, 0, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(p.x, p.y, p.rx + 8, p.ry + 7, 0, 0, 7); g.fill();          // the snowy bank
  var ig = g.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry); ig.addColorStop(0, "#A9C8DE"); ig.addColorStop(0.6, "#C7DDEB"); ig.addColorStop(1, "#DDEBF4");
  g.fillStyle = ig; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.2;                                        // skate marks
  [[-0.5, -0.1, 0.4, 0.3], [-0.2, 0.2, 0.5, 0.25], [0.1, -0.3, 0.3, 0.2]].forEach(function (s) { g.beginPath(); g.ellipse(p.x + p.rx * s[0], p.y + p.ry * s[1], p.rx * s[2], p.ry * s[3], 0.1, 0, 5.2); g.stroke(); });
  g.strokeStyle = "rgba(110,140,170,.35)"; g.lineWidth = 1; g.beginPath();                          // a crack or two
  g.moveTo(p.x + p.rx * 0.3, p.y - p.ry * 0.6); g.lineTo(p.x + p.rx * 0.38, p.y - p.ry * 0.2); g.lineTo(p.x + p.rx * 0.52, p.y - p.ry * 0.05); g.moveTo(p.x + p.rx * 0.38, p.y - p.ry * 0.2); g.lineTo(p.x + p.rx * 0.3, p.y + p.ry * 0.1); g.stroke();
  g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.45, p.rx * 0.35, p.ry * 0.12, -0.05, 0, 7); g.fill();
  // reeds poking through the snow at the far end, and a bench
  for (var i = 0; i < 9; i++) { var rx = p.x + p.rx * (0.55 + i * 0.05), ry = p.y - p.ry * (0.55 - i * 0.06);
    g.strokeStyle = "#9A8A5A"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(rx, ry + 6); g.quadraticCurveTo(rx + 2, ry - 10, rx + (i % 2 ? 4 : -2), ry - 18 - (i % 3) * 4); g.stroke();
    if (i % 3 === 0) { g.fillStyle = "#7A5A3A"; g.beginPath(); g.ellipse(rx + (i % 2 ? 3.5 : -1.5), ry - 16 - (i % 3) * 4, 2, 5, 0.1, 0, 7); g.fill(); } }
  var bx = p.x - p.rx * 0.2, by = p.y - p.ry - 14;
  g.fillStyle = "#7A5A42"; g.fillRect(bx - 22, by - 2, 44, 4); g.fillRect(bx - 22, by - 12, 44, 3); g.fillRect(bx - 19, by, 3, 9); g.fillRect(bx + 16, by, 3, 9);
  g.fillStyle = "#FFFFFF"; rr(g, bx - 23, by - 4, 46, 3, 1.5); g.fill(); rr(g, bx - 23, by - 14, 46, 2.5, 1); g.fill();
}
function snowman(g, x, y, s, kid) {
  g.fillStyle = "rgba(140,160,190,.3)"; g.beginPath(); g.ellipse(x + 4 * s, y + 2, 24 * s, 6 * s, 0, 0, 7); g.fill();
  rimmed(g, "#B8C6D6", "#FCFDFF", 1.5, function (e) { g.beginPath(); g.arc(x, y - 16 * s, 18 * s + e, 0, 7); g.fill(); g.beginPath(); g.arc(x, y - 40 * s, 13 * s + e, 0, 7); g.fill(); g.beginPath(); g.arc(x, y - 59 * s, 10 * s + e, 0, 7); g.fill(); });
  g.fillStyle = "rgba(170,190,215,.4)"; g.beginPath(); g.arc(x + 5 * s, y - 13 * s, 13 * s, -0.4, 1.8); g.fill();
  g.fillStyle = "#2B2433"; [[-3.5, -62], [3.5, -62]].forEach(function (p) { g.beginPath(); g.arc(x + p[0] * s, y + p[1] * s, 1.5 * s, 0, 7); g.fill(); });
  [-44, -37, -30].forEach(function (yy) { g.beginPath(); g.arc(x, y + yy * s, 1.5 * s, 0, 7); g.fill(); });
  for (var i = 0; i < 5; i++) { g.beginPath(); g.arc(x - 4 * s + i * 2 * s, y - 55 * s + Math.sin(i / 4 * Math.PI) * 1.5 * s, 0.9 * s, 0, 7); g.fill(); }
  g.fillStyle = "#F28C38"; g.beginPath(); g.moveTo(x, y - 59 * s); g.lineTo(x + 11 * s, y - 57 * s); g.lineTo(x, y - 56.5 * s); g.closePath(); g.fill();
  var sc = kid ? "#4F7FBF" : "#D9433A";                                                             // a scarf
  g.fillStyle = sc; rr(g, x - 11 * s, y - 51 * s, 22 * s, 5 * s, 2 * s); g.fill(); g.fillRect(x + 4 * s, y - 49 * s, 5 * s, 12 * s);
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(x - 6 * s, y - 51 * s, 2 * s, 5 * s); g.fillRect(x + 2 * s, y - 51 * s, 2 * s, 5 * s);
  if (kid) { g.fillStyle = "#4F7FBF"; g.beginPath(); g.arc(x, y - 63 * s, 9 * s, Math.PI, 0); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y - 73 * s, 3 * s, 0, 7); g.fill(); }
  else { g.fillStyle = "#2B2433"; g.fillRect(x - 9 * s, y - 68 * s, 18 * s, 3 * s); g.fillRect(x - 6 * s, y - 80 * s, 12 * s, 12 * s); g.fillStyle = "#D9433A"; g.fillRect(x - 6 * s, y - 71 * s, 12 * s, 2 * s); }
  g.strokeStyle = "#7A5238"; g.lineWidth = 2 * s; g.lineCap = "round";
  g.beginPath(); g.moveTo(x - 11 * s, y - 42 * s); g.lineTo(x - 24 * s, y - 52 * s); g.moveTo(x - 20 * s, y - 49 * s); g.lineTo(x - 23 * s, y - 56 * s);
  g.moveTo(x + 11 * s, y - 42 * s); g.lineTo(x + 24 * s, y - 36 * s); g.stroke();
}
function snowBush(g, x, y, s) {
  [[0, 0, 16], [-14, 3, 11], [14, 3, 12]].forEach(function (b) { g.fillStyle = "#4E7A62"; g.beginPath(); g.arc(x + b[0] * s, y - b[2] * s * 0.7 + b[1] * s, b[2] * s, 0, 7); g.fill(); });
  [[0, -6, 13], [-12, -1, 8], [13, -1, 9]].forEach(function (b) { g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(x + b[0] * s, y - b[2] * s * 0.9 + b[1] * s, b[2] * s, b[2] * s * 0.55, 0, Math.PI, 0); g.fill(); });
}
// Little paired prints wandering across the snow (a rabbit was here).
function tracks(g, p) {
  g.fillStyle = "rgba(150,165,190,.4)";
  for (var k = 0; k < 1; k += 0.035) { var x = (1 - k) * (1 - k) * p[0][0] + 2 * k * (1 - k) * p[1][0] + k * k * p[2][0], y = (1 - k) * (1 - k) * p[0][1] + 2 * k * (1 - k) * p[1][1] + k * k * p[2][1];
    g.beginPath(); g.ellipse(x - 3, y, 1.6, 1, 0, 0, 7); g.ellipse(x + 3, y + 1, 1.6, 1, 0, 0, 7); g.ellipse(x + 6, y - 2, 2.2, 1.2, 0, 0, 7); g.fill(); }
}
function snowballs(g, x, y) {
  g.fillStyle = "rgba(140,160,190,.3)"; g.beginPath(); g.ellipse(x + 3, y + 2, 22, 5, 0, 0, 7); g.fill();
  [[-12, 0, 7], [0, 0, 7], [12, 0, 7], [-6, -10, 7], [6, -10, 7], [0, -20, 7], [26, 2, 10]].forEach(function (b) {
    rimmed(g, "#C2CFDE", "#FCFDFF", 1.2, function (e) { g.beginPath(); g.arc(x + b[0], y + b[1] - b[2], b[2] + e, 0, 7); g.fill(); });
    g.fillStyle = "rgba(170,190,215,.4)"; g.beginPath(); g.arc(x + b[0] + 2, y + b[1] - b[2] + 2, b[2] * 0.7, -0.3, 1.9); g.fill(); });
}
function birdTable(g, x, y) {
  G.birdTable = { x: x, y: y - 46 };
  g.fillStyle = "rgba(140,160,190,.3)"; g.beginPath(); g.ellipse(x, y + 1, 12, 3, 0, 0, 7); g.fill();
  g.fillStyle = "#7A5A42"; g.fillRect(x - 2, y - 44, 4, 44); g.fillRect(x - 8, y - 2, 16, 3);
  g.fillRect(x - 13, y - 46, 26, 4);
  g.fillStyle = "#6B4A3A"; g.beginPath(); g.moveTo(x - 16, y - 58); g.lineTo(x, y - 68); g.lineTo(x + 16, y - 58); g.closePath(); g.fill();
  g.fillRect(x - 11, y - 58, 2, 12); g.fillRect(x + 9, y - 58, 2, 12);
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.moveTo(x - 17, y - 57); g.lineTo(x, y - 71); g.lineTo(x + 17, y - 57); g.quadraticCurveTo(x, y - 62, x - 17, y - 57); g.fill();
  rr(g, x - 14, y - 48, 28, 3, 1.5); g.fill();
  g.fillStyle = "#C9A060"; [-6, -2, 3, 7].forEach(function (o) { g.beginPath(); g.arc(x + o, y - 47.5, 1, 0, 7); g.fill(); });
}
function holly(g, x, y) {
  snowBush(g, x, y, 0.9);
  g.fillStyle = "#2F6B45"; for (var i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x - 14 + i * 6, y - 8 - (i % 2) * 5, 4, 2, i * 0.7, 0, 7); g.fill(); }
  g.fillStyle = "#D23B3B"; [[-6, -12], [-3, -10], [6, -14], [9, -11], [2, -6]].forEach(function (b) { g.beginPath(); g.arc(x + b[0], y + b[1], 1.9, 0, 7); g.fill(); });
}
function sledge(g, x, y) {
  g.fillStyle = "rgba(140,160,190,.3)"; g.beginPath(); g.ellipse(x, y + 3, 28, 4, 0, 0, 7); g.fill();
  g.strokeStyle = "#8E2F2A"; g.lineWidth = 2.4; g.lineCap = "round"; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x + 18, y); g.quadraticCurveTo(x + 28, y, x + 26, y - 8); g.stroke();
  g.fillStyle = "#C0392B"; [-18, -6, 6].forEach(function (o) { g.fillRect(x + o - 1.5, y - 7, 3, 7); });
  g.fillStyle = "#B8803A"; rr(g, x - 24, y - 10, 40, 5, 2); g.fill();
  g.strokeStyle = "#5A4A42"; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 24, y - 6); g.quadraticCurveTo(x + 34, y - 14, x + 30, y + 6); g.stroke();
}

// ── What moves: smoke, the lights, the robin, carols, the pub sign, the forge ──
var A = null;
function setup(S) {
  A = { t: 0, smoke: [], robin: null, carol: 0, note: 0, spark: 2, sparks: [], stars: [], bell: 0 };
  for (var i = 0; i < 44; i++) A.stars.push({ x: rand(0, G.W), y: rand(8, G.HZ - 30), s: rand(1, 2.2), ph: rand(0, 6) });
  A.robin = { x: G.W * 0.55, y: G.H * 0.8, tx: G.W * 0.55, ty: G.H * 0.8, wait: 1, face: 1, hop: 0, peck: 0, fly: null };
  A.glow = canvas(48, 48); var gg = A.glow.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(0.3, "rgba(255,206,120,.55)"); gr.addColorStop(1, "rgba(255,190,100,0)");
  gg.fillStyle = gr; gg.fillRect(0, 0, 48, 48);
  A.carolSpr = carolSprites();
  A.signSpr = signSprite();
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
  // smoke from every chimney, leaning with the wind
  for (i = 0; i < G.chims.length; i++) { var c = G.chims[i];
    c.next = (c.next == null ? rand(0, 1) : c.next) - dt;
    if (c.next < 0) { c.next = rand(0.45, 0.9); A.smoke.push({ x: c.x + rand(-2, 2), y: c.y, r: 3, life: 0, max: rand(3.5, 5) }); } }
  for (i = A.smoke.length - 1; i >= 0; i--) { var p = A.smoke[i]; p.life += dt;
    if (p.life > p.max) { A.smoke.splice(i, 1); continue; }
    p.y -= (14 + 4 * Math.sin(p.life)) * dt; p.x -= (4 + 46 * wind) * dt * Math.min(1, p.life / 1.2) - Math.sin(A.t * 0.7 + p.max) * 3 * dt; p.r += 3.2 * dt; }
  // the robin: hops about the green, pecks, and flies off from anyone close (roosts at night)
  var rb = A.robin;
  if (rb.fly) { rb.fly.k += dt / rb.fly.d; var f = rb.fly, k = Math.min(1, f.k);
    rb.x = f.x0 + (f.x1 - f.x0) * k; rb.y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h; rb.face = f.x1 > f.x0 ? 1 : -1;
    if (f.k >= 1) { rb.fly = null; rb.tx = rb.x; rb.ty = rb.y; rb.wait = rand(1, 3); } }
  else if (!asleep) {
    rb.peck = Math.max(0, rb.peck - dt);
    var near = nearFam(S, rb.x, rb.y, 90);
    if (near) { S.say("!", rb.x, rb.y - 18); var nx = rand(G.W * 0.2, G.W * 0.75), ny = rand(G.B + 120, G.H - 40);
      if (Math.abs(nx - near.x) < 200) nx = near.x < G.W / 2 ? G.W * 0.7 : G.W * 0.3;
      rb.fly = { x0: rb.x, y0: rb.y, x1: nx, y1: ny, h: rand(60, 110), k: 0, d: rand(1.4, 2) }; }
    else { var dx = rb.tx - rb.x, dy = rb.ty - rb.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2) { var st = Math.min(d, 46 * dt); rb.x += dx / d * st; rb.y += dy / d * st; rb.hop += dt * 9; rb.face = dx > 0 ? 1 : -1; }
      else if ((rb.wait -= dt) < 0) { if (Math.random() < 0.45) rb.peck = 0.6;
        rb.tx = Math.max(60, Math.min(G.W * 0.74, rb.x + rand(-50, 50))); rb.ty = Math.max(G.B + 90, Math.min(G.H - 30, rb.y + rand(-24, 24))); rb.wait = rand(0.8, 2.5);
        if (S.inZone(rb.tx, rb.ty, 6)) { rb.tx = rb.x; rb.ty = rb.y; } } }
  }
  // carols at the church door while the music plays; the school and church bells swing
  A.carol += ((S.music || 0) > 0.5 && !asleep ? 1 : 0) * dt * 2 - dt * 1.2; A.carol = Math.max(0, Math.min(1, A.carol));
  if (A.carol > 0.6) { A.note -= dt;
    if (A.note < 0) { A.note = rand(0.5, 1.1); var cd = G.churchDoor; S.puff("note", cd.x + 40 + rand(-16, 16), cd.y - 40, 1, pick(["#C0392B", "#2E5B44", "#C9A84A", "#3B5FA8"])); } }
  // the forge: sparks off the anvil now and then while the smith is up
  if (!asleep) { A.spark -= dt; if (A.spark < 0) { A.spark = rand(3, 7); var an = G.anvil;
    for (i = 0; i < 9; i++) A.sparks.push({ x: an.x, y: an.y - 18, vx: rand(-60, 60), vy: rand(-90, -30), life: rand(0.4, 0.8) }); } }
  for (i = A.sparks.length - 1; i >= 0; i--) { var sp = A.sparks[i]; sp.life -= dt; if (sp.life < 0) { A.sparks.splice(i, 1); continue; }
    sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 220 * dt; }
}

// Under the weather: glints on the snow and the pond.
function under(ctx, time, S) {
  if (!A) return;
  var i, p = G.pond, D0 = S.DARK || 0;
  if (D0 > 0 && D0 < 1) {                                                                        // a pink sunset over the hills
    var sa = Math.sin(D0 * Math.PI) * 0.34, sg = ctx.createLinearGradient(0, G.HZ - 120, 0, G.HZ + 40);
    sg.addColorStop(0, "rgba(255,150,120,0)"); sg.addColorStop(0.6, "rgba(255,140,110," + sa.toFixed(3) + ")"); sg.addColorStop(1, "rgba(255,170,140,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, G.HZ - 120, G.W, 160);
  }
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < G.glints.length; i++) { var gl = G.glints[i], tw = Math.sin(time * 1.7 + gl.ph * 3);
    if (tw > 0.75) { ctx.globalAlpha = (tw - 0.75) * 4 * (1 - 0.6 * S.DARK); ctx.fillRect(gl.x - 1.5, gl.y - 0.4, 3, 0.8); ctx.fillRect(gl.x - 0.4, gl.y - 1.5, 0.8, 3); } }
  ctx.globalAlpha = 1;
  var sw = ((time * 0.12) % 1.6) - 0.3;                                                           // a slow sheen across the ice
  if (sw > 0 && sw < 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); var sx = p.x - p.rx + sw * p.rx * 2;
    ctx.moveTo(sx - 10, p.y - p.ry); ctx.lineTo(sx + 14, p.y - p.ry); ctx.lineTo(sx - 6, p.y + p.ry); ctx.lineTo(sx - 30, p.y + p.ry); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
// Behind the family: smoke, the bells, the swinging sign, the singers, the robin, sparks,
// and the bulbs (lit by day too, just less).
function back(ctx, time, S) {
  if (!A) return;
  var i, asleep = S.nightness > 0.6, WX = S.WX || {}, D = S.DARK;
  ctx.fillStyle = D > 0.5 ? "rgb(200,206,222)" : "rgb(244,244,246)";
  for (i = 0; i < A.smoke.length; i++) { var p = A.smoke[i], a = Math.min(1, p.life / 0.6) * (1 - p.life / p.max);
    ctx.globalAlpha = a * 0.75; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  // the church bell, swinging for carols
  var b = G.churchBell, sw = A.carol * Math.sin(time * 4) * 0.5;
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(sw); ctx.fillStyle = "#C9A84A"; ctx.beginPath(); ctx.moveTo(-4.5, 9); ctx.quadraticCurveTo(-4, 1, 0, 0); ctx.quadraticCurveTo(4, 1, 4.5, 9); ctx.closePath(); ctx.fill(); ctx.restore();
  // The Robin's sign, swinging in the wind
  var s = G.sign, rot = Math.sin(time * 1.3) * (0.04 + 0.16 * (WX.wind || 0.1));
  ctx.save(); ctx.translate(s.x, s.y - 8); ctx.rotate(rot); ctx.drawImage(A.signSpr, -12, 0, 24, 28); ctx.restore();
  if (A.carol > 0.02) carols(ctx, time);
  // sparks from the anvil
  ctx.fillStyle = "#FFD27A"; for (i = 0; i < A.sparks.length; i++) { var sp = A.sparks[i]; ctx.globalAlpha = Math.min(1, sp.life * 3); ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2); }
  ctx.globalAlpha = 1;
  bulbs(ctx, time, D, 1);
  robin(ctx, time, S, asleep);
}
// The bulbs on the strings and the tree, a slow chase; lit = 1 draws them, the glow is light().
function bulbs(ctx, time, D, lit) {
  var all = G.bulbs.concat(G.treeBulbs), i;
  for (i = 0; i < all.length; i++) { var bl = all[i], on = 0.55 + 0.45 * Math.sin(time * 2.2 + bl.ph);
    ctx.globalAlpha = (0.55 + 0.45 * D) * (0.4 + 0.6 * on) * lit; ctx.fillStyle = bl.c; ctx.beginPath(); ctx.arc(bl.x, bl.y, 2.3, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function robin(ctx, time, S, asleep) {
  var rb = A.robin; if (asleep && !rb.fly) return;
  var sc = S.depth(rb.y), up = rb.fly ? 0 : Math.abs(Math.sin(rb.hop)) * 3, dip = rb.peck > 0 ? 3 : 0;
  ctx.save(); ctx.translate(rb.x, rb.y - up); ctx.scale(rb.face * sc, sc);
  if (!rb.fly) { ctx.fillStyle = "rgba(120,140,170,.3)"; ctx.beginPath(); ctx.ellipse(0, up, 6, 1.6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#5A4A3A"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, -3); ctx.lineTo(-1.5, 0); ctx.moveTo(1.5, -3); ctx.lineTo(2, 0); ctx.stroke(); }
  ctx.fillStyle = "#8A6A4A"; ctx.beginPath(); ctx.ellipse(-1, -8, 7, 5.5, -0.2, 0, 7); ctx.fill();          // back
  ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-12, -12); ctx.lineTo(-11, -7); ctx.closePath(); ctx.fill();   // tail
  if (rb.fly) { var fl = Math.sin(time * 30) * 5; ctx.fillStyle = "#6E5238"; ctx.beginPath(); ctx.ellipse(-2, -12 - fl * 0.5, 7, 2.5, -0.5 - fl * 0.1, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#E8643A"; ctx.beginPath(); ctx.ellipse(2.5, -7 + dip * 0.3, 4.5, 4.5, 0, 0, 7); ctx.fill();   // the red breast
  ctx.fillStyle = "#F4EFE6"; ctx.beginPath(); ctx.ellipse(1, -4, 4, 2, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = "#8A6A4A"; ctx.beginPath(); ctx.arc(3.5, -12 + dip, 3.6, 0, 7); ctx.fill();
  ctx.fillStyle = "#E8643A"; ctx.beginPath(); ctx.arc(5, -11 + dip, 2.4, -0.5, 2.2); ctx.fill();
  ctx.fillStyle = "#2B2433"; ctx.beginPath(); ctx.arc(4.6, -13 + dip, 0.9, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6.8, -12.5 + dip); ctx.lineTo(9.5, -11.5 + dip); ctx.lineTo(6.8, -11 + dip); ctx.fill();
  ctx.restore();
}
function carols(ctx, time) {
  var cd = G.churchDoor, spr = A.carolSpr;
  ctx.globalAlpha = A.carol;
  for (var i = 0; i < 3; i++) { var x = cd.x + 24 + i * 20, y = cd.y + 16 + (i % 2) * 4, sway = Math.sin(time * 3 + i * 1.2) * 0.06 * A.carol;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway); ctx.scale(1.2, 1.2); ctx.drawImage(spr[i], -spr.ax, -spr.ay, spr[i].width / K, spr[i].height / K); ctx.restore(); }
  ctx.globalAlpha = 1;
}
// Three carol singers: bonnet, top hat, woolly hat; scarves, song sheets, a lantern on a pole.
function carolSprites() {
  function one(kind) {
    var w = 22, h = 40, c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K);
    var x = 11, y = h - 1, coat = ["#2E5B44", "#5A3A5E", "#8E2F2A"][kind];
    g.fillStyle = "#2B2433"; g.fillRect(x - 4, y - 5, 3, 5); g.fillRect(x + 1, y - 5, 3, 5);
    rimmed(g, "rgba(0,0,0,.4)", coat, 1, function (e) { g.beginPath(); g.moveTo(x - 7 - e, y - 4); g.lineTo(x - 5 - e, y - 20 - e); g.lineTo(x + 5 + e, y - 20 - e); g.lineTo(x + 7 + e, y - 4); g.closePath(); g.fill(); });
    g.fillStyle = "#F2D2B4"; g.beginPath(); g.arc(x, y - 25, 4.6, 0, 7); g.fill();
    g.fillStyle = "#2B2433"; g.beginPath(); g.arc(x - 1.6, y - 25, 0.8, 0, 7); g.arc(x + 1.8, y - 25, 0.8, 0, 7); g.fill();
    g.strokeStyle = "#2B2433"; g.lineWidth = 0.9; g.beginPath(); g.arc(x, y - 23.5, 1.4, 0.2, Math.PI - 0.2); g.stroke();           // singing
    g.fillStyle = ["#F2C14E", "#D9433A", "#F4F1E8"][kind]; g.fillRect(x - 5, y - 21, 10, 2.5); g.fillRect(x + 2, y - 20, 2.5, 6);    // scarf
    if (kind === 0) { g.fillStyle = "#6E3A5A"; g.beginPath(); g.arc(x, y - 26, 6, Math.PI * 0.95, Math.PI * 2.05); g.fill(); g.fillStyle = "#F2C14E"; g.fillRect(x - 6, y - 26, 12, 1.4); }
    else if (kind === 1) { g.fillStyle = "#2B2433"; g.fillRect(x - 6, y - 30, 12, 2); g.fillRect(x - 4, y - 38, 8, 8); }
    else { g.fillStyle = "#D9433A"; g.beginPath(); g.arc(x, y - 27, 5, Math.PI, 0); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, y - 32.5, 2, 0, 7); g.fill(); }
    if (kind !== 1) { g.fillStyle = "#F4F1E8"; g.fillRect(x - 6, y - 17, 8, 6); g.strokeStyle = "#B8B0A0"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - 5, y - 15); g.lineTo(x + 1, y - 15); g.moveTo(x - 5, y - 13); g.lineTo(x + 1, y - 13); g.stroke(); }
    else { g.strokeStyle = "#5A4A42"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 6, y - 14); g.lineTo(x + 9, y - 36); g.stroke();
      g.fillStyle = "#2F2A2A"; g.fillRect(x + 6, y - 38, 6, 7); g.fillStyle = "#FFD98A"; g.fillRect(x + 7, y - 37, 4, 5); }
    return c;
  }
  var out = [one(0), one(1), one(2)]; out.ax = 11; out.ay = 39; return out;
}
function signSprite() {
  var c = canvas(24 * K, 28 * K), g = c.getContext("2d"); g.scale(K, K);
  g.strokeStyle = "#3A2E28"; g.lineWidth = 1; g.beginPath(); g.moveTo(5, 0); g.lineTo(5, 4); g.moveTo(19, 0); g.lineTo(19, 4); g.stroke();
  rimmed(g, "#3A2E28", "#2E5B44", 1.4, function (e) { rr(g, 1 - e, 4 - e, 22 + 2 * e, 22 + 2 * e, 3); g.fill(); });
  g.fillStyle = "#F4EFE6"; rr(g, 3.5, 6.5, 17, 17, 2); g.fill();
  g.fillStyle = "#8A6A4A"; g.beginPath(); g.ellipse(11, 16, 5.5, 4.5, -0.2, 0, 7); g.fill();                                    // a little robin, of course
  g.fillStyle = "#E8643A"; g.beginPath(); g.arc(13.5, 16, 3.4, 0, 7); g.fill();
  g.fillStyle = "#8A6A4A"; g.beginPath(); g.arc(14, 11.5, 2.8, 0, 7); g.fill();
  g.fillStyle = "#2B2433"; g.beginPath(); g.arc(15, 11, 0.7, 0, 7); g.fill(); g.beginPath(); g.moveTo(16.5, 11.5); g.lineTo(18.5, 12.2); g.lineTo(16.5, 12.6); g.fill();
  g.fillStyle = "#8A6A4A"; g.beginPath(); g.moveTo(6.5, 15); g.lineTo(3.5, 12); g.lineTo(5, 17); g.fill();
  return c;
}

// Over the dusk: stars, a moon, every window and lamp, pools of warm light on the snow, the
// forge, the bulbs glowing.
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W;
  if (D <= 0.02) return;
  var ng = ctx.createLinearGradient(0, 0, 0, G.HZ + 10); ng.addColorStop(0, "rgba(8,12,46,.55)"); ng.addColorStop(0.7, "rgba(12,18,56,.28)"); ng.addColorStop(1, "rgba(20,26,66,0)");   // a deep blue night sky
  ctx.globalAlpha = D; ctx.fillStyle = ng; ctx.fillRect(0, 0, W, G.HZ + 10);
  ctx.fillStyle = "rgba(30,50,120,.1)"; ctx.fillRect(0, G.B + 30, W, G.H - G.B);                        // moonlight blues the snow
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.stars.length; i++) { var st = A.stars[i], tw = 0.55 + 0.45 * Math.sin(time * 1.4 + st.ph), ss = st.s * 1.3; ctx.globalAlpha = D * tw * 0.9; ctx.fillRect(st.x - ss / 2, st.y - ss / 2, ss, ss);
    if (st.s > 1.9) { ctx.globalAlpha = D * tw * 0.4; ctx.fillRect(st.x - ss * 1.6, st.y - 0.5, ss * 3.2, 1); ctx.fillRect(st.x - 0.5, st.y - ss * 1.6, 1, ss * 3.2); } }
  var mx = W * 0.52, my = 92;                                                                     // a crescent moon
  ctx.globalAlpha = D * 0.3; ctx.drawImage(A.glow, mx - 56, my - 56, 112, 112);
  ctx.globalAlpha = D; ctx.fillStyle = "#FFF6D8"; ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 15, 0, 7); ctx.clip();
  ctx.beginPath(); ctx.rect(mx - 16, my - 16, 32, 32); ctx.arc(mx + 7, my - 5, 13, 0, 7); ctx.fill("evenodd"); ctx.restore();
  ctx.globalCompositeOperation = "lighter";
  // windows: a glow on the glass, and a pool of light on the snow below
  for (i = 0; i < G.wins.length; i++) { var w = G.wins[i], r = Math.max(w.w, w.h) * 1.2;
    ctx.globalAlpha = D * (w.glass ? 0.55 : 0.8); ctx.drawImage(A.glow, w.x - r, w.y - r, r * 2, r * 2); }
  for (i = 0; i < G.doors.length; i++) { var dd = G.doors[i]; ctx.globalAlpha = D * 0.35; ctx.drawImage(A.glow, dd.x - 26, dd.y - 6, 52, 18); }
  for (i = 0; i < G.lamps.length; i++) { var l = G.lamps[i];
    ctx.globalAlpha = D; ctx.drawImage(A.glow, l.x - 22, l.y - 22, 44, 44);
    ctx.globalAlpha = D * 0.55; ctx.drawImage(A.glow, l.x - 46, l.foot - 10, 92, 24); }
  var hl = G.homeLamp; ctx.globalAlpha = D; ctx.drawImage(A.glow, hl.x - 18, hl.y - 18, 36, 36);
  ctx.globalAlpha = D * 0.5; ctx.drawImage(A.glow, G.home.x - 70, G.home.y + 2, 140, 40);
  var f = G.forge, fl = 0.75 + 0.25 * Math.sin(time * 9) * Math.sin(time * 5.3);                  // the forge, flickering
  ctx.globalAlpha = Math.min(1, 0.25 + D) * fl; ctx.drawImage(A.glow, f.x - 40, f.y - 36, 80, 70);
  ctx.globalAlpha = D * 0.6 * fl; ctx.drawImage(A.glow, f.x - 50, f.y + 10, 100, 30);
  var all = G.bulbs.concat(G.treeBulbs);
  for (i = 0; i < all.length; i++) { var bl = all[i], on = 0.55 + 0.45 * Math.sin(time * 2.2 + bl.ph); ctx.globalAlpha = D * 0.7 * on; ctx.drawImage(A.glow, bl.x - 7, bl.y - 7, 14, 14); }
  var sr = G.star; ctx.globalAlpha = D * (0.8 + 0.2 * Math.sin(time * 2)); ctx.drawImage(A.glow, sr.x - 22, sr.y - 22, 44, 44);
  ctx.globalAlpha = D * 0.45; ctx.drawImage(A.glow, G.tree.x - 70, G.tree.y - 130, 140, 150);
  if (A.carol > 0.02) { var cd = G.churchDoor; ctx.globalAlpha = D * A.carol; ctx.drawImage(A.glow, cd.x + 30, cd.y - 18, 34, 34); }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  bulbs(ctx, time, D, D);                                                                          // the bulbs themselves, bright over the dark
}

export default {
  id: "winter", label: "Winter village",
  blurb: "the winter village has the school, church, The Robin, the post office, the smithy and your cottage on the green, under snow",
  shadow: "70,90,130",                                       // blue shadows on snow
  depth: [0.72, 0.3],
  creatures: ["owl", "rabbit", "fox", "cat", "deer", "crow", "hedgehog", "capybara", "snail"],
  bake: function (g, S) { bake(g, S); },
  // spread over the green, two by the pond, none in the lane
  start: function (i, S) {
    var slots = [[0.36, 0.7], [0.52, 0.56], [0.6, 0.78], [0.3, 0.55], [0.47, 0.88], [0.72, 0.6], [0.15, 0.6], [0.8, 0.9]], s = slots[i % slots.length];
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  // The landmarks a tap opens: the school, the smithy (the workshop), the church (carols),
  // the family's cottage (home) and the post office (the office).
  // someone on a duty walks round the pond, the cottage and the snowmen, not across them
  via: function (t, dest, S) { if (!t.pass) return null;
    return around(t, dest, G.big, 30, function (x, y) { return x > 20 && x < G.W - 20 && y > G.B + 30 && y < G.H - 10 && !S.inZone(x, y, 4); }); },
  // The village has no hall, so the crier uses the church: out of its door, through the
  // lychgate on to the lane and down on to the green, with the scroll to his right.
  crier: function () {
    var d = G.churchDoor;
    return { path: [{ x: d.x, y: d.y }, { x: d.x, y: G.B + 30 }, { x: Math.round(G.W * 0.3), y: Math.round(G.H * 0.6) }], face: 1 };
  },
  // The pillar box on the post office's kerb.
  postbox: function () { var p = G.postbox; return { x: p.x, y: p.y - 36 }; },
  hotspots: {
    school:  { box: function () { var s = G.school; return [s.x - 84, s.y - 132, s.x + 84, s.y + 10]; },
               tap: function (S) { var s = G.school; S.say("ding!", s.x, s.y - 136); } },
    printer: { box: function () { var s = G.smithy; return [s.x - 60, s.y - 120, s.x + 64, s.y + 18]; },
               tap: function (S) { var s = G.forge; S.puff("chip", s.x, s.y - 8, 8, "#FFB04A"); } },
    music:   { box: function () { var c = G.church; return [c.x - 78, c.y - 176, c.x + 88, c.y + 26]; },
               tap: function (S) { var c = G.churchDoor; S.puff("note", c.x + rand(-10, 30), c.y - 60, 5, "#C0392B"); } },
    home:    { box: function () { var h = G.home; return [h.x - 86, h.y - 150, h.x + 86, h.y + 30]; },
               tap: function (S) { var h = G.home; S.puff("heart", h.x, h.y - 70, 3, "#FF7FA0"); } },
    office:  { box: function () { var p = G.post; return [p.x - 56, p.y - 110, p.x + 70, p.y + 14]; },
               tap: function (S) { var p = G.post; S.say("beep!", p.x, p.y - 114); } }
  },
  weather: {
    // fresh snow covers the trodden paths and the lane while it falls
    ground: function (ctx, S, WX) {
      if (WX.snow <= 0.02) return;
      ctx.globalAlpha = Math.min(1, WX.snow * 1.1);
      ctx.lineCap = "round"; ctx.strokeStyle = "#F7F9FC"; ctx.lineWidth = 5;                         // the ruts in the lane fill in
      [G.B + 6, G.B + 18].forEach(function (yy) { ctx.beginPath(); for (var xx = -10; xx <= G.W + 10; xx += 20) { var yv = yy + Math.sin(xx / 90) * 1.5; if (xx === -10) ctx.moveTo(xx, yv); else ctx.lineTo(xx, yv); } ctx.stroke(); });
      ctx.lineWidth = 26;                                                                          // and the paths, short of the gate
      G.paths.forEach(function (p) { var q = part(p, 0.9); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]); ctx.stroke(); });
      ctx.globalAlpha = 1;
    }
  },
  ambient: { setup: setup, update: update, under: under, back: back, light: light }
};
