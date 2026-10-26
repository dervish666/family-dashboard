// A way round for someone on a duty. The engine lets a duty walk (school, an appointment)
// pass straight through a scene's zones, which is right for a gate but wrong for a campfire
// or a frozen pond. around() is for a scene's via(): it finds the first zone the straight
// line from t to dest cuts through and answers the next waypoint round its edge, a short
// step along the nearer way, or null when the way is clear. Asked again from each
// waypoint, it walks them round the edge until dest is in sight. Pure geometry: nothing
// moves here.
//   zones   ellipses { x, y, rx, ry } to keep out of
//   pad     how far outside an ellipse to walk round it (px)
//   ok(x,y) optional: a waypoint must satisfy it (on the card, clear of other zones)
export function around(t, dest, zones, pad, ok) {
  var best = null, bk = 2, i;
  for (i = 0; i < zones.length; i++) {
    var z = zones[i];
    if (inside(z, t.x, t.y, 0) || inside(z, dest.x, dest.y, 0)) continue;  // in it already, or going there: steer() deals
    var ax = z.rx + pad * 0.6, ay = z.ry + pad * 0.6;
    var x0 = (t.x - z.x) / ax, y0 = (t.y - z.y) / ay, dx = (dest.x - z.x) / ax - x0, dy = (dest.y - z.y) / ay - y0, L = dx * dx + dy * dy;
    if (L < 1e-9) continue;
    var k = Math.max(0, Math.min(1, -(x0 * dx + y0 * dy) / L)), cx = x0 + dx * k, cy = y0 + dy * k;
    if (cx * cx + cy * cy >= 1 || k >= bk) continue;
    bk = k; best = z;
  }
  if (!best) return null;
  // round the edge, pad outside it: a step of at most 0.7 rad from where t is, towards dest
  var A = best.rx + pad, B = best.ry + pad;
  var a0 = Math.atan2((t.y - best.y) / B, (t.x - best.x) / A), a1 = Math.atan2((dest.y - best.y) / B, (dest.x - best.x) / A);
  var diff = a1 - a0; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
  var dirs = [diff >= 0 ? 1 : -1, diff >= 0 ? -1 : 1];
  for (i = 0; i < 2; i++) {
    var a = a0 + dirs[i] * Math.min(0.7, i ? 0.7 : Math.abs(diff) || 0.7), wx = best.x + Math.cos(a) * A, wy = best.y + Math.sin(a) * B;
    if (!ok || ok(wx, wy)) return { x: wx, y: wy };
  }
  return null;
}
function inside(z, x, y, pad) { var dx = (x - z.x) / (z.rx + pad), dy = (y - z.y) / (z.ry + pad); return dx * dx + dy * dy < 1; }
