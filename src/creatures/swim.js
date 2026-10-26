// The swimmers' habit (shark, otter): idle within a hop of the scene's water, dive in,
// stay under a beat, come back up. Pure animation: dy and diving are read by the
// engine's draw, position only changes in steer(). A.water is the scene's water
// ellipse, or null where there is none to dive into.
export function waterDip(t, dt, A) {
  t.dipCool = (t.dipCool || 0) - dt;
  if (t.dipT >= 0) {
    t.dipT += dt; var D = t.dipD, k;
    if (t.dipT < 0.6) { k = t.dipT / 0.6; t.dy = D * k - Math.sin(k * Math.PI) * 36; t.diving = k; }
    else if (t.dipT < 2.8) { t.dy = D; t.diving = 1; if (t.dipT - dt < 0.6) A.puff("drop", t.x, t.y + D, 8, "#6FB6E8"); }
    else if (t.dipT < 3.4) { k = (t.dipT - 2.8) / 0.6; t.dy = D * (1 - k) - Math.sin(k * Math.PI) * 36; t.diving = 1 - k;
      if (t.dipT - dt < 2.8) { A.puff("drop", t.x, t.y + D, 8, "#6FB6E8"); t.happy = 1.5; } }
    else { t.dipT = -1; t.dy = 0; t.diving = 0; t.dipCool = 20; }
    t.wait = Math.max(t.wait, 0.5); t.idle = true;
    return;
  }
  var P = A.water; if (!P) return;
  // idle within a hop of the water: dive in
  var pdx = (t.x - P.x) / (P.rx + 40), pdy = (t.y + 60 - P.y) / (P.ry + 10);
  if (t.idle && t.dipCool <= 0 && pdx * pdx + pdy * pdy < 1) {
    var edge = P.y - P.ry * Math.sqrt(Math.max(0, 1 - Math.pow((t.x - P.x) / P.rx, 2)));
    t.dipD = Math.min(95, Math.max(30, edge + 24 - t.y)); t.dipT = 0;
  }
}
