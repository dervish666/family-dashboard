// Family Dashboard card. Built from src/ by esbuild: edit src/ and run npm run build, never this file.

// src/version.js
var VERSION = "1.3.0";

// src/engine/draw.js
function rgb(h) {
  var v = parseInt(h.slice(1), 16);
  return [v >> 16, v >> 8 & 255, v & 255];
}
function css(a, al) {
  return al == null ? "rgb(" + (a[0] | 0) + "," + (a[1] | 0) + "," + (a[2] | 0) + ")" : "rgba(" + (a[0] | 0) + "," + (a[1] | 0) + "," + (a[2] | 0) + "," + al + ")";
}
function mix(h, h2, t) {
  var a = rgb(h), b = rgb(h2);
  return css([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}
function shade(h, k) {
  var a = rgb(h);
  return css([a[0] * k, a[1] * k, a[2] * k]);
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function pick(arr) {
  return arr[Math.random() * arr.length | 0];
}
function dist(a, b) {
  var dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}
function ymd(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function canvas(w, h) {
  var c = document.createElement("canvas");
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  return c;
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function spike(tLeft, dur) {
  if (!(tLeft > 0)) return 0;
  var k = 1 - tLeft / dur;
  return Math.sin(k * Math.PI) * (1 - k * 0.5);
}
var K = 2;
var INK = "#2B2433";
function rimmed(g, rim, fill, grow, draw) {
  g.fillStyle = rim;
  draw(grow);
  g.fillStyle = fill;
  draw(0);
}
function face(g, cx, ey, r, eyes, dx, adult, only) {
  var ex = r * (adult ? 0.27 : 0.34), ew = r * (adult ? 0.085 : 0.13), eh = r * (adult ? 0.11 : 0.17);
  if (eyes === "wide") {
    ew *= 1.3;
    eh *= 1.3;
    eyes = "open";
  }
  [-1, 1].forEach(function(s) {
    var x = cx + dx + s * ex;
    if (!adult && only !== "eyes") {
      g.fillStyle = "rgba(255,120,150,.42)";
      g.beginPath();
      g.ellipse(x + s * r * 0.1, ey + r * 0.22, r * 0.14, r * 0.085, 0, 0, 7);
      g.fill();
    }
    if (only === "rest") return;
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = r * (adult ? 0.06 : 0.075);
    if (eyes === "open") {
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(x, ey, ew, eh, 0, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(x - ew * 0.35, ey - eh * 0.4, ew * 0.42, 0, 7);
      g.fill();
      if (!adult) {
        g.beginPath();
        g.arc(x + r * 0.045, ey + r * 0.06, r * 0.025, 0, 7);
        g.fill();
      }
    } else if (eyes === "shut") {
      g.beginPath();
      g.moveTo(x - ew * 0.92, ey);
      g.quadraticCurveTo(x, ey + ew * 0.77, x + ew * 0.92, ey);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(x - ew * 0.92, ey + ew * 0.38);
      g.quadraticCurveTo(x, ey - ew, x + ew * 0.92, ey + ew * 0.38);
      g.stroke();
    }
    if (adult && eyes !== "shut") {
      g.lineWidth = r * 0.045;
      g.beginPath();
      g.moveTo(x - r * 0.1, ey - r * 0.21);
      g.quadraticCurveTo(x, ey - r * 0.26, x + r * 0.1, ey - r * 0.2);
      g.stroke();
    }
  });
  if (only === "eyes") return;
  var mx = cx + dx, my = ey + r * 0.2;
  g.strokeStyle = INK;
  g.lineCap = "round";
  if (adult) {
    g.lineWidth = r * 0.045;
    g.beginPath();
    g.arc(mx, my - r * 0.06, r * 0.08, 0.4, Math.PI - 0.4);
    g.stroke();
    return;
  }
  g.lineWidth = r * 0.05;
  g.beginPath();
  g.moveTo(mx - r * 0.08, my);
  g.quadraticCurveTo(mx - r * 0.04, my + r * 0.08, mx, my);
  g.quadraticCurveTo(mx + r * 0.04, my + r * 0.08, mx + r * 0.08, my);
  g.stroke();
}
function phonesAcc(g, cx, cy, r, col) {
  g.strokeStyle = "#3C3950";
  g.lineWidth = r * 0.13;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx, cy - r * 0.02, r * 1, Math.PI * 1.08, Math.PI * 1.92);
  g.stroke();
  [-1, 1].forEach(function(s) {
    g.fillStyle = "#3C3950";
    rr(g, cx + s * r * 0.98 - r * 0.15, cy - r * 0.3, r * 0.3, r * 0.5, r * 0.12);
    g.fill();
    g.fillStyle = mix(col, "#ffffff", 0.3);
    g.beginPath();
    g.arc(cx + s * r * 0.98, cy - r * 0.05, r * 0.07, 0, 7);
    g.fill();
  });
}
function daisyAcc(g, cx, cy, r, k) {
  var fx = cx + r * 0.3, fly = cy - r * 1.25;
  g.strokeStyle = "#4E9A5A";
  g.lineWidth = r * 0.07;
  g.beginPath();
  g.moveTo(cx + r * 0.08, cy - r * 0.86);
  g.quadraticCurveTo(cx + r * 0.1, fly + r * 0.2, fx, fly);
  g.stroke();
  for (var i = 0; i < 6; i++) {
    var a = i / 6 * Math.PI * 2;
    rimmed(g, "rgba(180,170,200,.8)", "#FFFFFF", k, function(e) {
      g.beginPath();
      g.arc(fx + Math.cos(a) * r * 0.17, fly + Math.sin(a) * r * 0.17, r * 0.13 + e, 0, 7);
      g.fill();
    });
  }
  g.fillStyle = "#FFCB47";
  g.beginPath();
  g.arc(fx, fly, r * 0.12, 0, 7);
  g.fill();
}
function hat(g, kind, cx, cy, r, grow) {
  var top2 = cy - r * 0.9;
  if (kind === "chef") {
    rimmed(g, "#B9B4AA", "#FFFFFF", grow, function(e) {
      g.fillRect(cx - r * 0.46 - e, top2 - r * 0.2 - e, r * 0.92 + e * 2, r * 0.32 + e * 2);
      [[-0.3, -0.42, 0.28], [0, -0.6, 0.34], [0.3, -0.42, 0.28]].forEach(function(p) {
        g.beginPath();
        g.arc(cx + r * p[0], top2 + r * p[1], r * p[2] + e, 0, 7);
        g.fill();
      });
    });
  } else if (kind === "straw") {
    rimmed(g, "#B8923F", "#EDCB74", grow, function(e) {
      g.beginPath();
      g.ellipse(cx, top2 + r * 0.12, r * 1.02 + e, r * 0.22 + e, 0, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(cx, top2 - r * 0.08, r * 0.52 + e, r * 0.34 + e, 0, Math.PI, 0);
      g.fill();
    });
    g.fillStyle = "#E0675A";
    g.fillRect(cx - r * 0.52, top2 - r * 0.02, r * 1.04, r * 0.1);
  } else if (kind === "cap" || kind === "postcap") {
    rimmed(g, kind === "cap" ? "#2F5577" : "#8E2A24", kind === "cap" ? "#4E7CA8" : "#D9433A", grow, function(e) {
      g.beginPath();
      g.arc(cx, top2 + r * 0.12, r * 0.62 + e, Math.PI, 0);
      g.fill();
      g.beginPath();
      g.ellipse(cx + r * 0.55, top2 + r * 0.1, r * 0.4 + e, r * 0.1 + e, 0, 0, 7);
      g.fill();
    });
  } else if (kind === "beanie" || kind === "beanie2") {
    var bc = kind === "beanie" ? "#D9534F" : "#6C8FD0";
    rimmed(g, shade(bc, 0.6), bc, grow, function(e) {
      g.beginPath();
      g.arc(cx, top2 + r * 0.2, r * 0.7 + e, Math.PI, 0);
      g.fill();
      g.fillRect(cx - r * 0.74 - e, top2 + r * 0.08 - e, r * 1.48 + e * 2, r * 0.2 + e * 2);
    });
    rimmed(g, "#B9B4AA", "#FFFFFF", grow, function(e) {
      g.beginPath();
      g.arc(cx, top2 - r * 0.52, r * 0.16 + e, 0, 7);
      g.fill();
    });
  } else if (kind === "bucket") {
    rimmed(g, "#3D6E6C", "#5E9C9A", grow, function(e) {
      g.beginPath();
      g.ellipse(cx, top2 + r * 0.14, r * 0.86 + e, r * 0.18 + e, 0, 0, 7);
      g.fill();
      g.beginPath();
      g.moveTo(cx - r * 0.55 - e, top2 + r * 0.12);
      g.lineTo(cx - r * 0.4 - e, top2 - r * 0.36 - e);
      g.lineTo(cx + r * 0.4 + e, top2 - r * 0.36 - e);
      g.lineTo(cx + r * 0.55 + e, top2 + r * 0.12);
      g.closePath();
      g.fill();
    });
  }
}
function profileCanvas(r, wR, upR, downR) {
  var c = canvas(r * wR, r * (upR + downR)), g = c.getContext("2d");
  var ox = r * wR / 2, oy = r * upR;
  g.translate(ox, oy);
  return { c, g, ax: ox, ay: oy };
}
var rig = { part: null };
function on(p) {
  return rig.part === null || rig.part === p;
}

// src/creatures/classic.js
function classicSprite(o, eyes, k) {
  k = k || K;
  var r = o.r * k, w = r * 3.6, cy = r * 2.1, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, col = o.col, feet = cy + r * 0.92;
  var rim = shade(col, 0.6), grow = 1.7 * k, dark = shade(col, 0.82), inner = mix(col, "#FF9FB5", 0.55);
  var ek = o.adult ? 0.8 : 1;
  var STRETCH = 1.14;
  if (o.adult) {
    g.save();
    g.translate(cx, feet);
    g.scale(0.84, STRETCH);
    g.translate(-cx, -feet);
  }
  rimmed(g, rim, dark, grow, function(e) {
    [-1, 1].forEach(function(s) {
      g.beginPath();
      g.ellipse(cx + s * r * 0.42, cy + r * 0.8, r * 0.24 + e, r * 0.14 + e, 0, 0, 7);
      g.fill();
    });
  });
  if (o.look === "fox") {
    rimmed(g, rim, col, grow, function(e) {
      g.beginPath();
      g.ellipse(cx - r * 1, cy + r * 0.05, r * 0.5 + e, r * 0.3 + e, -0.7, 0, 7);
      g.fill();
    });
    g.fillStyle = "#FFF6EA";
    g.beginPath();
    g.ellipse(cx - r * 1.3, cy - r * 0.26, r * 0.2, r * 0.14, -0.7, 0, 7);
    g.fill();
  }
  var ears = { bear: "round", puff: "nub", villager: "nub", bunny: "long", fox: "point", phones: "point", flower: "nub", curls: "none" }[o.look];
  [-1, 1].forEach(function(s) {
    if (ears === "round" || ears === "nub") {
      var er = (ears === "round" ? 0.3 : 0.2) * ek, ey = ears === "round" ? -0.72 : -0.74, ex = ears === "round" ? 0.62 : 0.56;
      rimmed(g, rim, col, grow, function(e) {
        g.beginPath();
        g.arc(cx + s * r * ex, cy + r * ey, r * er + e, 0, 7);
        g.fill();
      });
      g.fillStyle = inner;
      g.beginPath();
      g.arc(cx + s * r * ex, cy + r * ey, r * er * 0.52, 0, 7);
      g.fill();
    } else if (ears === "long") {
      rimmed(g, rim, col, grow, function(e) {
        g.beginPath();
        g.ellipse(cx + s * r * 0.36, cy - r * 1.18, r * 0.21 * ek + e, r * 0.56 + e, s * 0.2, 0, 7);
        g.fill();
      });
      g.fillStyle = inner;
      g.beginPath();
      g.ellipse(cx + s * r * 0.37, cy - r * 1.14, r * 0.1 * ek, r * 0.4, s * 0.2, 0, 7);
      g.fill();
    } else if (ears === "point") {
      var tri = function(e) {
        g.beginPath();
        g.moveTo(cx + s * (r * 0.18 - e), cy - r * 0.72);
        g.lineTo(cx + s * (r * 0.84 + e), cy - r * 0.45);
        g.lineTo(cx + s * r * 0.66, cy - r * 1.3 - e);
        g.closePath();
        g.fill();
      };
      rimmed(g, rim, col, grow, tri);
      g.fillStyle = inner;
      g.beginPath();
      g.moveTo(cx + s * r * 0.36, cy - r * 0.7);
      g.lineTo(cx + s * r * 0.7, cy - r * 0.55);
      g.lineTo(cx + s * r * 0.63, cy - r * 1.08);
      g.closePath();
      g.fill();
    }
  });
  var body = function(e) {
    g.beginPath();
    g.ellipse(cx, cy, r + e, r * 0.9 + e, 0, 0, 7);
    g.fill();
    if (o.fluff) for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      g.beginPath();
      g.arc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.8, r * 0.24 + e, 0, 7);
      g.fill();
    }
  };
  g.fillStyle = rim;
  body(grow);
  var gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.25);
  gr.addColorStop(0, mix(col, "#ffffff", o.adult ? 0.3 : 0.5));
  gr.addColorStop(0.55, col);
  gr.addColorStop(1, shade(col, 0.86));
  g.fillStyle = gr;
  body(0);
  g.fillStyle = o.look === "fox" ? "#FFF3E2" : mix(col, "#ffffff", 0.55);
  g.globalAlpha = 0.85;
  g.beginPath();
  g.ellipse(cx, cy + r * 0.4, r * 0.55, r * 0.38, 0, 0, 7);
  g.fill();
  g.globalAlpha = 1;
  if (o.adult) g.restore();
  var dx = r * (o.adult ? 0.08 : 0.1);
  var fy = o.adult ? feet - (feet - cy) * STRETCH - r * 0.14 : cy - r * 0.08;
  face(g, cx, fy, r, eyes, dx, o.adult);
  if (o.glasses) {
    g.strokeStyle = "#3C3950";
    g.lineWidth = r * 0.05;
    [-1, 1].forEach(function(s) {
      g.beginPath();
      g.arc(cx + dx + s * r * 0.27, fy, r * 0.16, 0, 7);
      g.stroke();
    });
    g.beginPath();
    g.moveTo(cx + dx - r * 0.11, fy - r * 0.02);
    g.quadraticCurveTo(cx + dx, fy - r * 0.08, cx + dx + r * 0.11, fy - r * 0.02);
    g.stroke();
  }
  if (o.look === "fox" && eyes === "open") {
    g.strokeStyle = shade(col, 0.45);
    g.lineWidth = r * 0.06;
    [-1, 1].forEach(function(s) {
      var x = cx + dx + s * r * 0.34;
      g.beginPath();
      g.moveTo(x - r * 0.12, cy - r * (s < 0 ? 0.42 : 0.36));
      g.lineTo(x + r * 0.12, cy - r * (s < 0 ? 0.36 : 0.42));
      g.stroke();
    });
  }
  if (o.look === "phones") phonesAcc(g, cx, cy, r, col);
  else if (o.look === "curls") {
    [[-0.2, -0.95, 0.19], [0.04, -1.06, 0.22], [0.26, -0.96, 0.17]].forEach(function(p) {
      rimmed(g, rim, shade(col, 0.9), grow, function(e) {
        g.beginPath();
        g.arc(cx + r * p[0], cy + r * p[1], r * p[2] + e, 0, 7);
        g.fill();
      });
    });
    g.fillStyle = "#FF8FB1";
    var bx = cx + r * 0.46, by = cy - r * 0.84;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx - r * 0.2, by - r * 0.12);
    g.lineTo(bx - r * 0.2, by + r * 0.12);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + r * 0.2, by - r * 0.12);
    g.lineTo(bx + r * 0.2, by + r * 0.12);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(bx, by, r * 0.06, 0, 7);
    g.fill();
  } else if (o.look === "flower") daisyAcc(g, cx, cy, r, k);
  if (o.hat) hat(g, o.hat, cx, cy, r, grow);
  return { c, ax: cx, ay: feet, k };
}

// src/creatures/crow.js
var crow_default = {
  id: "crow",
  label: "Crow",
  tg: 2.25,
  editor: true,
  sprite: crowSprite,
  rig: {
    order: ["legB", "legA", "tail", "body", "wing", "head"],
    eyesIn: "head",
    piv: { legA: [-0.1, -0.46], legB: [0.16, -0.46], tail: [-0.8, -0.62], wing: [0.25, -1.3], head: [0.45, -1.45] }
  },
  hat: [0.6, -2.08, 0.15],
  timers: ["cock"],
  anim: function(t, p, time, M) {
    if (p === "legA") return [0.55 * M.air, 0, 0];
    if (p === "legB") return [0.45 * M.air, 0, 0];
    if (p === "tail") return [0.14 * Math.sin(M.ph * 1.5 - 0.9) * M.g + 0.05 * Math.sin(time * 1.3) * M.idle + 0.2 * M.air, 0, 0];
    if (p === "wing") return [0.95 * M.air + 0.3 * Math.sin(time * 22) * M.air + M.wave * (1 + 0.35 * Math.sin(time * 16)), 0, 0];
    if (p === "head") return [M.spike(t.cock, 1.4) * 0.38 * (t.cockDir || 1) - 0.08 * M.air, 0, 0];
  },
  life: function(t, dt, still) {
    if (still && !(t.cock > 0) && !t.shiny && Math.random() < dt * 0.3) {
      t.cock = 1.4;
      t.cockDir = Math.random() < 0.5 ? -1 : 1;
    }
  },
  // Spots something shiny and stoops for it. Pure animation: position only changes in steer().
  habits: function(t, dt, A2) {
    if (!t.idle) {
      t.shiny = null;
      return;
    }
    if (!t.shiny && Math.random() < dt * 0.05) t.shiny = { x: t.x + t.face * t.r * 0.95, y: t.y + 2, k: 0 };
    if (t.shiny) {
      t.shiny.k += dt;
      t.wait = Math.max(t.wait, 0.3);
      if (t.shiny.k > 1.2 && !t.peck && t.shiny.k < 1.3) t.peck = 0.5;
      if (t.shiny.k > 1.55) {
        A2.puff("heart", t.x, t.y - t.r * 2.3, 1, "#F4D35E");
        t.happy = 1.4;
        t.shiny = null;
      }
    }
  }
};
function crowSprite(o, eyes, k) {
  var r = o.r * k, P = profileCanvas(r, 4.2, 2.25, 0.2), g = P.g, grow = 1.6 * k;
  var rim = "#12181A";
  function X(v) {
    return v * r;
  }
  function grad() {
    var gr = g.createLinearGradient(0, X(-2.1), 0, X(-0.4));
    gr.addColorStop(0, "#5E8E94");
    gr.addColorStop(0.25, "#3A4B4E");
    gr.addColorStop(0.6, "#2A3336");
    gr.addColorStop(1, "#1E2527");
    return gr;
  }
  g.strokeStyle = "#1E2426";
  g.lineCap = "round";
  g.lineJoin = "round";
  [["legA", -0.1, 0], ["legB", 0.16, 0.03]].forEach(function(l) {
    if (!on(l[0])) return;
    var lx = X(l[1]);
    g.strokeStyle = "#1E2426";
    g.lineWidth = X(0.07);
    g.beginPath();
    g.moveTo(lx, X(-0.46));
    g.lineTo(lx + X(l[2]), X(-0.02));
    g.stroke();
    g.lineWidth = X(0.05);
    g.beginPath();
    g.moveTo(lx - X(0.13), X(0.01));
    g.lineTo(lx + X(0.2), X(0.01));
    g.moveTo(lx + X(0.2), X(0.01));
    g.lineTo(lx + X(0.26), X(0.06));
    g.stroke();
  });
  if (on("tail")) {
    rimmed(g, rim, "#222B2E", grow, function(e) {
      g.beginPath();
      g.moveTo(X(-0.78), X(-0.78) - e);
      g.lineTo(X(-1.78) - e, X(-0.3) - e);
      g.lineTo(X(-1.82) - e, X(-0.06) + e);
      g.lineTo(X(-0.82), X(-0.46) + e);
      g.closePath();
      g.fill();
    });
    g.strokeStyle = "rgba(127,200,210,.25)";
    g.lineWidth = X(0.025);
    [[-1, -0.62, -1.72, -0.24], [-1, -0.52, -1.74, -0.12]].forEach(function(l) {
      g.beginPath();
      g.moveTo(X(l[0]), X(l[1]));
      g.lineTo(X(l[2]), X(l[3]));
      g.stroke();
    });
  }
  if (on("body")) {
    var body = function(e) {
      g.beginPath();
      g.ellipse(X(-0.2), X(-0.9), X(0.9) + e, X(0.48) + e, -0.55, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(X(0.28), X(-1.18), X(0.46) + e, X(0.44) + e, 0, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(X(0.45), X(-1.5), X(0.34) + e, X(0.42) + e, -0.3, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(X(0.05), X(-1.48), X(0.47) + e, X(0.27) + e, -0.72, 0, 7);
      g.fill();
    };
    g.fillStyle = rim;
    body(grow);
    g.fillStyle = grad();
    body(0);
  }
  if (on("wing")) {
    rimmed(g, rim, "#262F33", grow, function(e) {
      g.beginPath();
      g.moveTo(X(0.3), X(-1.38) - e);
      g.quadraticCurveTo(X(-0.4), X(-1.36) - e, X(-0.98), X(-0.74) - e);
      g.lineTo(X(-1.3) - e, X(-0.42));
      g.lineTo(X(-1.06), X(-0.5));
      g.lineTo(X(-1.22) - e, X(-0.3));
      g.lineTo(X(-0.98), X(-0.4));
      g.lineTo(X(-1.06), X(-0.2) + e);
      g.quadraticCurveTo(X(-0.35), X(-0.52) + e, X(0.22), X(-1) + e);
      g.closePath();
      g.fill();
    });
    g.strokeStyle = "rgba(127,200,210,.55)";
    g.lineWidth = X(0.045);
    g.beginPath();
    g.moveTo(X(0.22), X(-1.38));
    g.quadraticCurveTo(X(-0.4), X(-1.33), X(-0.94), X(-0.74));
    g.stroke();
    g.strokeStyle = "rgba(0,0,0,.35)";
    g.lineWidth = X(0.03);
    [[-0.5, -1.02, -0.92, -0.5], [-0.3, -0.92, -0.8, -0.38]].forEach(function(l) {
      g.beginPath();
      g.moveTo(X(l[0]), X(l[1]));
      g.lineTo(X(l[2]), X(l[3]));
      g.stroke();
    });
  }
  if (on("head")) {
    g.fillStyle = rim;
    g.beginPath();
    g.arc(X(0.62), X(-1.76), X(0.35) + grow, 0, 7);
    g.fill();
    g.fillStyle = grad();
    g.beginPath();
    g.arc(X(0.62), X(-1.76), X(0.35), 0, 7);
    g.fill();
    rimmed(g, rim, "#2A3033", grow * 0.8, function(e) {
      g.beginPath();
      g.moveTo(X(0.84), X(-1.9) - e);
      g.quadraticCurveTo(X(1.22), X(-1.89) - e, X(1.48) + e, X(-1.69));
      g.quadraticCurveTo(X(1.43), X(-1.62) + e, X(1.33), X(-1.63) + e);
      g.quadraticCurveTo(X(1.12), X(-1.58) + e, X(0.86), X(-1.6) + e);
      g.closePath();
      g.fill();
    });
    g.strokeStyle = "rgba(255,255,255,.28)";
    g.lineWidth = X(0.03);
    g.beginPath();
    g.moveTo(X(0.92), X(-1.85));
    g.quadraticCurveTo(X(1.2), X(-1.84), X(1.39), X(-1.72));
    g.stroke();
    g.strokeStyle = "rgba(0,0,0,.5)";
    g.beginPath();
    g.moveTo(X(0.9), X(-1.71));
    g.lineTo(X(1.31), X(-1.67));
    g.stroke();
    var ex = X(0.67), ey = X(-1.82), wide = eyes === "wide";
    g.lineCap = "round";
    g.strokeStyle = "#E4EEF1";
    g.lineWidth = X(0.05);
    if (eyes === "open" || wide) {
      var ring = wide ? 0.14 : 0.1;
      g.fillStyle = "#E4EEF1";
      g.beginPath();
      g.arc(ex, ey, X(ring), 0, 7);
      g.fill();
      g.fillStyle = "#0B0F10";
      g.beginPath();
      g.arc(ex + X(0.015), ey, X(wide ? 0.06 : 0.075), 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex - X(0.01), ey - X(0.03), X(0.028), 0, 7);
      g.fill();
    } else if (eyes === "shut") {
      g.beginPath();
      g.moveTo(ex - X(0.09), ey);
      g.quadraticCurveTo(ex, ey + X(0.06), ex + X(0.09), ey);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(ex - X(0.09), ey + X(0.03));
      g.quadraticCurveTo(ex, ey - X(0.08), ex + X(0.09), ey + X(0.03));
      g.stroke();
    }
    if (o.glasses) {
      g.strokeStyle = "#D8E6EA";
      g.lineWidth = X(0.045);
      g.beginPath();
      g.arc(ex + X(0.02), ey, X(0.16), 0, 7);
      g.stroke();
      g.beginPath();
      g.moveTo(ex - X(0.14), ey - X(0.02));
      g.lineTo(X(0.34), ey - X(0.04));
      g.stroke();
    }
  }
  return { c: P.c, ax: P.ax, ay: P.ay, k };
}

// src/creatures/front.js
function frontSprite(o, eyes, k, A2) {
  var r = o.r * k, w = r * 3.6, cy = r * 2.1, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, feet = cy + r * 0.92, grow = 1.7 * k, S = 1.14;
  var col = A2.col && A2.col(o) || o.col, rim = shade(col, 0.6);
  var F = { o, eyes, k, r, cx, cy, feet, grow, S, col, rim };
  if (o.adult) {
    g.save();
    g.translate(cx, feet);
    g.scale(0.84, S);
    g.translate(-cx, -feet);
  }
  A2.feet(g, F);
  if (on("tail") && A2.tail) A2.tail(g, F);
  if (A2.back) A2.back(g, F);
  [["earL", -1], ["earR", 1]].forEach(function(e2) {
    if (on(e2[0])) A2.ear(g, F, e2[1]);
  });
  if (on("body")) {
    var body = function(e) {
      A2.body(g, F, e);
    };
    g.fillStyle = rim;
    body(grow);
    var gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.25);
    gr.addColorStop(0, mix(col, "#ffffff", A2.light == null ? 0.3 : A2.light));
    gr.addColorStop(0.55, col);
    gr.addColorStop(1, shade(col, 0.86));
    g.fillStyle = gr;
    body(0);
    A2.belly(g, F);
  }
  if (o.adult) g.restore();
  if (A2.front) A2.front(g, F);
  F.dx = r * (o.adult ? 0.08 : 0.1);
  F.headTop = o.adult ? feet - (feet - (cy - r * 0.86)) * S : cy - r * 0.9;
  F.fy = o.adult ? feet - (feet - cy) * S - r * 0.14 : cy - r * (A2.faceY == null ? 0.08 : A2.faceY);
  A2.face(g, F);
  if (on("body")) {
    var ph = A2.phones || [0, 1];
    if (o.phones) phonesAcc(g, cx, ph[0] ? cy + r * ph[0] : cy, ph[1] !== 1 ? r * ph[1] : r, "#A3B0F2");
    if (o.daisy) daisyAcc(g, cx, cy, r, k);
  }
  if (A2.extra) A2.extra(g, F);
  if (rig.part === "paw") {
    var P = A2.paw, pc = P.col(F), pwy = cy + r * P.y, pwx = cx + r * P.x;
    rimmed(g, rim, pc, grow, function(e) {
      g.beginPath();
      g.ellipse(pwx, pwy, r * 0.14 + e, r * 0.3 + e, 0.35, 0, 7);
      g.fill();
    });
  }
  return { c, ax: cx, ay: feet, k };
}
function pawWave(M) {
  return [-0.9 * M.wave + 0.35 * Math.sin(M.time * 14) * M.wave, 0, 0];
}

// src/creatures/capybara.js
var SHAPE = {
  feet: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function(f) {
      if (!on(f[0])) return;
      var s = f[1];
      rimmed(g, F.rim, shade(F.col, 0.82), F.grow, function(e) {
        g.beginPath();
        g.ellipse(cx + s * r * 0.42, cy + r * 0.81, r * 0.24 + e, r * 0.14 + e, 0, 0, 7);
        g.fill();
      });
    });
  },
  ear: function(g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.9), F.grow, function(e) {
      g.beginPath();
      g.arc(cx + s * r * 0.58, cy - r * 0.76, r * 0.13 + e, 0, 7);
      g.fill();
    });
    g.fillStyle = shade(F.col, 0.62);
    g.beginPath();
    g.arc(cx + s * r * 0.58, cy - r * 0.76, r * 0.06, 0, 7);
    g.fill();
  },
  body: function(g, F, e) {
    var r = F.r;
    rr(g, F.cx - r * 1 - e, F.cy - r * 0.86 - e, r * 2 + 2 * e, r * 1.76 + 2 * e, r * 0.62 + e);
    g.fill();
  },
  belly: function(g, F) {
    var r = F.r;
    g.fillStyle = mix(F.col, "#ffffff", 0.4);
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(F.cx, F.cy + r * 0.42, r * 0.56, r * 0.36, 0, 0, 7);
    g.fill();
    g.globalAlpha = 1;
  },
  face: function(g, F) {
    if (on("muzzle")) capyMuzzle(g, F.cx + F.dx, F.fy, F.r, F.col);
    if (on("eyes")) capyEyes(g, F.cx + F.dx, F.fy, F.r, F.eyes, F.col);
  },
  extra: function(g, F) {
    if (!on("yuzu")) return;
    var r = F.r, yx = F.cx + r * 0.04, yy = F.headTop - r * 0.14;
    rimmed(g, "#C27A12", "#F7B32B", F.grow, function(e) {
      g.beginPath();
      g.arc(yx, yy, r * 0.24 + e, 0, 7);
      g.fill();
    });
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.arc(yx - r * 0.08, yy - r * 0.08, r * 0.07, 0, 7);
    g.fill();
    g.fillStyle = "#5FA84F";
    g.beginPath();
    g.ellipse(yx + r * 0.12, yy - r * 0.24, r * 0.12, r * 0.06, -0.5, 0, 7);
    g.fill();
  },
  paw: { col: function(F) {
    return shade(F.col, 0.82);
  }, x: 0.86, y: 0.3 }
};
function capyMuzzle(g, x, fy, r, col) {
  g.fillStyle = shade(col, 0.8);
  rr(g, x - r * 0.4, fy + r * 0.02, r * 0.8, r * 0.46, r * 0.2);
  g.fill();
  g.fillStyle = "rgba(43,36,51,.75)";
  [-1, 1].forEach(function(s) {
    g.beginPath();
    g.ellipse(x + s * r * 0.14, fy + r * 0.12, r * 0.05, r * 0.035, 0, 0, 7);
    g.fill();
  });
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineWidth = r * 0.04;
  g.beginPath();
  g.moveTo(x - r * 0.08, fy + r * 0.34);
  g.quadraticCurveTo(x, fy + r * 0.38, x + r * 0.08, fy + r * 0.34);
  g.stroke();
}
function capyEyes(g, x, fy, r, eyes, col) {
  [-1, 1].forEach(function(s) {
    var ex = x + s * r * 0.34, ey = fy - r * 0.16;
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = r * 0.055;
    if (eyes === "open") {
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(ex, ey, r * 0.075, r * 0.07, 0, 0, 7);
      g.fill();
      g.fillStyle = col;
      g.fillRect(ex - r * 0.09, ey - r * 0.09, r * 0.18, r * 0.07);
      g.beginPath();
      g.moveTo(ex - r * 0.09, ey - r * 0.02);
      g.lineTo(ex + r * 0.09, ey - r * 0.02);
      g.stroke();
    } else if (eyes === "wide") {
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(ex, ey, r * 0.095, r * 0.095, 0, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex - r * 0.03, ey - r * 0.03, r * 0.03, 0, 7);
      g.fill();
    } else if (eyes === "shut") {
      g.beginPath();
      g.moveTo(ex - r * 0.08, ey);
      g.quadraticCurveTo(ex, ey + r * 0.05, ex + r * 0.08, ey);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(ex - r * 0.08, ey + r * 0.03);
      g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03);
      g.stroke();
    }
  });
}
var capybara_default = {
  id: "capybara",
  label: "Capybara",
  tg: 2.6,
  editor: true,
  sprite: function(o, eyes, k) {
    return frontSprite(o, eyes, k, SHAPE);
  },
  rig: {
    order: ["footL", "footR", "earL", "earR", "body", "paw", "muzzle", "eyes", "yuzu"],
    eyesIn: "eyes",
    piv: {
      footL: [-0.35, -0.14],
      footR: [0.35, -0.14],
      earL: [-0.47, -1.85],
      earR: [0.47, -1.85],
      muzzle: [0.08, -1.17],
      yuzu: [0.04, -1.95],
      paw: [0.76, -0.9]
    }
  },
  hat: [-0.3, -2.02, -0.35],
  timers: ["flickL", "flickR", "chew"],
  anim: function(t, p, time, M) {
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "earL") return [-M.spike(t.flickL, 0.35) * 0.6 + 0.1 * Math.sin(M.ph - 0.7) * M.g, 0, 0];
    if (p === "earR") return [M.spike(t.flickR, 0.35) * 0.6 - 0.1 * Math.sin(M.ph - 0.7) * M.g, 0, 0];
    if (p === "muzzle") {
      var ch = t.chew > 0 || t.munch > 0 ? Math.abs(Math.sin(time * 6)) : 0;
      return [0.05 * ch, 0, 0.04 * ch];
    }
    if (p === "yuzu") return [0.1 * Math.sin(M.ph - 0.9) * M.g + 0.04 * Math.sin(time * 1.5), 0, -0.05 * Math.abs(Math.sin(M.ph - 0.9)) * M.g];
    if (p === "paw") return pawWave(M);
  },
  life: function(t, dt, still, A2) {
    var R = Math.random;
    if (still && !(t.chew > 0) && R() < dt * 0.25) t.chew = A2.rand(2, 5);
    if (!(t.flickL > 0) && R() < dt * 0.3) t.flickL = 0.35;
    if (!(t.flickR > 0) && R() < dt * 0.3) t.flickR = 0.35;
  }
};

// src/creatures/deer.js
function legLine(g, F, x, fill) {
  var r = F.r, hx = F.cx + x * r, top2 = F.cy + r * 0.42, bot = F.feet - r * 0.04;
  g.lineCap = "round";
  g.strokeStyle = F.rim;
  g.lineWidth = r * 0.2;
  g.beginPath();
  g.moveTo(hx, top2);
  g.lineTo(hx, bot);
  g.stroke();
  g.strokeStyle = fill;
  g.lineWidth = r * 0.15;
  g.beginPath();
  g.moveTo(hx, top2);
  g.lineTo(hx, bot - r * 0.02);
  g.stroke();
  g.strokeStyle = "#2A1E18";
  g.lineWidth = r * 0.17;
  g.beginPath();
  g.moveTo(hx, bot - r * 0.07);
  g.lineTo(hx, bot);
  g.stroke();
}
var SHAPE2 = {
  col: function() {
    return "#B5652F";
  },
  feet: function(g, F) {
    [["legBL", -0.26], ["legBR", 0.26]].forEach(function(l) {
      if (!on(l[0])) return;
      legLine(g, F, l[1], shade(F.col, 0.72));
    });
  },
  tail: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, "#9A8F80", "#FFFFFF", F.grow, function(e) {
      g.beginPath();
      g.ellipse(cx - r * 0.86, cy + r * 0.12, r * 0.24 + e, r * 0.2 + e, 0.3, 0, 7);
      g.fill();
    });
    g.fillStyle = F.col;
    g.beginPath();
    g.ellipse(cx - r * 0.8, cy - r * 0.02, r * 0.14, r * 0.07, 0.3, 0, 7);
    g.fill();
  },
  ear: function(g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, F.col, F.grow, function(e) {
      g.beginPath();
      g.ellipse(cx + s * r * 0.84, cy - r * 0.64, r * 0.4 + e, r * 0.19 + e, -s * 0.38, 0, 7);
      g.fill();
    });
    g.fillStyle = "#F2D6B8";
    g.beginPath();
    g.ellipse(cx + s * r * 0.86, cy - r * 0.65, r * 0.27, r * 0.1, -s * 0.38, 0, 7);
    g.fill();
  },
  body: function(g, F, e) {
    var cx = F.cx, cy = F.cy, r = F.r;
    g.beginPath();
    g.ellipse(cx, cy - r * 0.32, r * 0.86 + e, r * 0.62 + e, 0, 0, 7);
    g.fill();
    rr(g, cx - r * 0.62 - e, cy - r * 0.2 - e, r * 1.24 + 2 * e, r * 0.8 + 2 * e, r * 0.34 + e);
    g.fill();
  },
  belly: function(g, F) {
    var r = F.r;
    g.fillStyle = "#F3E3CC";
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(F.cx, F.cy + r * 0.3, r * 0.44, r * 0.3, 0, 0, 7);
    g.fill();
    g.globalAlpha = 1;
  },
  front: function(g, F) {
    [["legFL", -0.46], ["legFR", 0.46]].forEach(function(l) {
      if (on(l[0])) legLine(g, F, l[1], F.col);
    });
  },
  faceY: 0.36,
  face: function(g, F) {
    var r = F.r, fy = F.fy, mx = F.cx + F.dx;
    if (on("body")) {
      g.fillStyle = "#C98552";
      rr(g, mx - r * 0.3, fy + r * 0.04, r * 0.6, r * 0.42, r * 0.14);
      g.fill();
      g.fillStyle = "#FFFFFF";
      rr(g, mx - r * 0.24, fy + r * 0.34, r * 0.48, r * 0.12, r * 0.06);
      g.fill();
      g.fillStyle = "#1E1612";
      rr(g, mx - r * 0.13, fy + r * 0.07, r * 0.26, r * 0.13, r * 0.06);
      g.fill();
      g.strokeStyle = INK;
      g.lineCap = "round";
      g.lineWidth = r * 0.04;
      g.beginPath();
      g.moveTo(mx - r * 0.08, fy + r * 0.29);
      g.quadraticCurveTo(mx, fy + r * 0.32, mx + r * 0.08, fy + r * 0.29);
      g.stroke();
      g.strokeStyle = "#6B3418";
      g.lineWidth = r * 0.07;
      [-1, 1].forEach(function(s) {
        g.beginPath();
        g.moveTo(mx + s * r * 0.18, fy - r * 0.2);
        g.lineTo(mx + s * r * 0.4, fy - r * 0.22);
        g.stroke();
      });
      antlers(g, F.cx, F.cy, r);
    }
    if (on("eyes")) buckEyes(g, mx, fy, r, F.eyes);
  },
  phones: [-0.3, 0.9],
  paw: { col: function(F) {
    return shade(F.col, 0.8);
  }, x: 0.72, y: 0.12 }
};
function antlers(g, cx, cy, r) {
  [-1, 1].forEach(function(s) {
    var bx = cx + s * r * 0.3, by = cy - r * 0.84;
    var lines = [
      [bx, by, bx + s * r * 0.06, by - r * 0.72],
      // beam
      [bx + s * r * 0.04, by - r * 0.36, bx + s * r * 0.26, by - r * 0.46],
      // front tine
      [bx + s * r * 0.06, by - r * 0.72, bx - s * r * 0.06, by - r * 0.86],
      // top fork, inner
      [bx + s * r * 0.06, by - r * 0.72, bx + s * r * 0.2, by - r * 0.82]
    ];
    g.lineCap = "round";
    [["#6E5B40", r * 0.14], ["#EADBB8", r * 0.09]].forEach(function(st) {
      g.strokeStyle = st[0];
      g.lineWidth = st[1];
      lines.forEach(function(l) {
        g.beginPath();
        g.moveTo(l[0], l[1]);
        g.lineTo(l[2], l[3]);
        g.stroke();
      });
    });
    g.fillStyle = "#8C7A5C";
    g.beginPath();
    g.ellipse(bx, by + r * 0.02, r * 0.1, r * 0.06, 0, 0, 7);
    g.fill();
  });
}
function buckEyes(g, x, fy, r, eyes) {
  var ey = fy - r * 0.08, sz = eyes === "wide" ? 1.3 : 1;
  [-1, 1].forEach(function(s) {
    var ex = x + s * r * 0.29;
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = r * 0.06;
    if (eyes === "open" || eyes === "wide") {
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(ex, ey, r * 0.09 * sz, r * 0.095 * sz, 0, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex - r * 0.03, ey - r * 0.035, r * 0.035, 0, 7);
      g.fill();
    } else if (eyes === "shut") {
      g.beginPath();
      g.moveTo(ex - r * 0.09, ey);
      g.quadraticCurveTo(ex, ey + r * 0.06, ex + r * 0.09, ey);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(ex - r * 0.09, ey + r * 0.03);
      g.quadraticCurveTo(ex, ey - r * 0.08, ex + r * 0.09, ey + r * 0.03);
      g.stroke();
    }
  });
}
var deer_default = {
  id: "deer",
  label: "Deer",
  tg: 2.75,
  editor: true,
  sprite: function(o, eyes, k) {
    return frontSprite(o, eyes, k, SHAPE2);
  },
  rig: {
    order: ["legBL", "legBR", "tail", "earL", "earR", "body", "legFL", "legFR", "paw", "eyes"],
    eyesIn: "eyes",
    piv: {
      legBL: [-0.26, -0.5],
      legBR: [0.26, -0.5],
      legFL: [-0.46, -0.5],
      legFR: [0.46, -0.5],
      earL: [-0.52, -1.5],
      earR: [0.52, -1.5],
      tail: [-0.7, -0.84],
      paw: [0.62, -0.62]
    }
  },
  hat: [0, -1.84, 0],
  timers: ["twL", "twR", "flick", "pronk", "graze"],
  anim: function(t, p, time, M) {
    if (p === "legFL" || p === "legBR") return [0, 0, M.stiff ? 0 : M.stepL];
    if (p === "legFR" || p === "legBL") return [0, 0, M.stiff ? 0 : M.stepR];
    if (p === "earL") return [-M.spike(t.twL, 0.3) * 0.55 + 0.15 * Math.sin(M.ph - 0.6) * M.g + 0.35 * M.stiff * Math.sin(time * 18), 0, 0];
    if (p === "earR") return [M.spike(t.twR, 0.3) * 0.55 - 0.15 * Math.sin(M.ph - 0.6) * M.g - 0.35 * M.stiff * Math.sin(time * 18), 0, 0];
    if (p === "tail") return [0.45 * Math.sin(time * 16) * M.spike(t.flick, 0.6) + 0.2 * Math.sin(M.ph - 1) * M.g, 0, 0];
    if (p === "paw") return pawWave(M);
  },
  life: function(t, dt, still, A2) {
    var R = Math.random;
    if (!(t.twL > 0) && R() < dt * 0.35) t.twL = 0.3;
    if (!(t.twR > 0) && R() < dt * 0.35) t.twR = 0.3;
    if (!(t.flick > 0) && R() < dt * 0.2) t.flick = 0.6;
    if (still && !(t.pronk > 0) && !(t.graze > 0)) {
      if (R() < dt * 0.05) {
        t.pronk = 1.6;
        t.wait = Math.max(t.wait, 1.8);
      } else if (R() < dt * 0.07) {
        t.graze = A2.rand(2.5, 4);
        t.wait = Math.max(t.wait, t.graze + 0.3);
      }
    }
  }
};

// src/creatures/swim.js
function waterDip(t, dt, A2) {
  t.dipCool = (t.dipCool || 0) - dt;
  if (t.dipT >= 0) {
    t.dipT += dt;
    var D = t.dipD, k;
    if (t.dipT < 0.6) {
      k = t.dipT / 0.6;
      t.dy = D * k - Math.sin(k * Math.PI) * 36;
      t.diving = k;
    } else if (t.dipT < 2.8) {
      t.dy = D;
      t.diving = 1;
      if (t.dipT - dt < 0.6) A2.puff("drop", t.x, t.y + D, 8, "#6FB6E8");
    } else if (t.dipT < 3.4) {
      k = (t.dipT - 2.8) / 0.6;
      t.dy = D * (1 - k) - Math.sin(k * Math.PI) * 36;
      t.diving = 1 - k;
      if (t.dipT - dt < 2.8) {
        A2.puff("drop", t.x, t.y + D, 8, "#6FB6E8");
        t.happy = 1.5;
      }
    } else {
      t.dipT = -1;
      t.dy = 0;
      t.diving = 0;
      t.dipCool = 20;
    }
    t.wait = Math.max(t.wait, 0.5);
    t.idle = true;
    return;
  }
  var P = A2.water;
  if (!P) return;
  var pdx = (t.x - P.x) / (P.rx + 40), pdy = (t.y + 60 - P.y) / (P.ry + 10);
  if (t.idle && t.dipCool <= 0 && pdx * pdx + pdy * pdy < 1) {
    var edge = P.y - P.ry * Math.sqrt(Math.max(0, 1 - Math.pow((t.x - P.x) / P.rx, 2)));
    t.dipD = Math.min(95, Math.max(30, edge + 24 - t.y));
    t.dipT = 0;
  }
}

// src/creatures/shark.js
var shark_default = {
  id: "shark",
  label: "Shark",
  tg: 1.6,
  editor: true,
  sprite: sharkSprite,
  rig: {
    order: ["tail", "body", "pec", "mouth", "eyes"],
    eyesIn: "eyes",
    extra: ["mouthOpen"],
    piv: { tail: [-1.05, -0.62], pec: [0.45, -0.42], mouth: [1.15, -0.45], mouthOpen: [1.15, -0.45] }
  },
  hat: [0.55, -1.02, 0.35],
  anim: function(t, p, time, M) {
    if (p === "tail") return [Math.sin(time * (3 + 7 * M.g)) * (0.1 + 0.24 * M.g) + M.wave * 0.35 * Math.sin(time * 18), 0, 0];
    if (p === "pec") return [Math.sin(time * (4 + 6 * M.g) + 1) * 0.18 + M.wave * 0.5 * Math.sin(time * 20), 0, 0];
  },
  habits: waterDip
};
function sharkSprite(o, eyes, k) {
  var r = o.r * k, P = profileCanvas(r, 4, 1.9, 0.2), g = P.g, grow = 1.6 * k;
  var rim = "#6B5B22", back2 = "#A38F3E", mid = "#CDB76A", belly = "#F7EFCC";
  function X(v) {
    return v * r;
  }
  function fin(e, pts) {
    g.beginPath();
    g.moveTo(X(pts[0]), X(pts[1]));
    g.quadraticCurveTo(X(pts[2]), X(pts[3]) - e, X(pts[4]) - e, X(pts[5]) - e);
    g.quadraticCurveTo(X(pts[6]), X(pts[7]), X(pts[8]), X(pts[9]));
    g.closePath();
    g.fill();
  }
  if (on("tail")) rimmed(g, rim, back2, grow, function(e) {
    g.beginPath();
    g.moveTo(X(-1.02), X(-0.8) - e);
    g.quadraticCurveTo(X(-1.35), X(-1.05), X(-1.75) - e, X(-1.45) - e);
    g.quadraticCurveTo(X(-1.52), X(-0.95), X(-1.42), X(-0.64));
    g.quadraticCurveTo(X(-1.5), X(-0.4), X(-1.62) - e, X(-0.18) + e);
    g.quadraticCurveTo(X(-1.3), X(-0.35), X(-1.02), X(-0.5) + e);
    g.closePath();
    g.fill();
  });
  var body = function(e) {
    g.beginPath();
    g.moveTo(X(1.5) + e, X(-0.6));
    g.bezierCurveTo(X(1.25), X(-1.02) - e, X(0.5), X(-1.12) - e, X(-0.2), X(-1.02) - e);
    g.bezierCurveTo(X(-0.7), X(-0.95) - e, X(-0.95), X(-0.84) - e, X(-1.08) - e, X(-0.72));
    g.lineTo(X(-1.08) - e, X(-0.52));
    g.bezierCurveTo(X(-0.7), X(-0.3) + e, X(-0.2), X(-0.1) + e, X(0.35), X(-0.12) + e);
    g.bezierCurveTo(X(0.95), X(-0.14) + e, X(1.35), X(-0.35) + e, X(1.5) + e, X(-0.6));
    g.closePath();
    g.fill();
  };
  if (on("body")) {
    rimmed(g, rim, back2, grow, function(e) {
      fin(e, [0.28, -1.02, 0.18, -1.45, -0.1, -1.64, -0.05, -1.25, -0.3, -1]);
    });
    rimmed(g, rim, back2, grow, function(e) {
      fin(e, [-0.55, -0.9, -0.62, -1.24, -0.86, -1.42, -0.82, -1.1, -0.98, -0.8]);
    });
    g.fillStyle = rim;
    body(grow);
    var gr = g.createLinearGradient(0, X(-1.1), 0, X(-0.1));
    gr.addColorStop(0, back2);
    gr.addColorStop(0.5, mid);
    gr.addColorStop(1, mid);
    g.fillStyle = gr;
    body(0);
    g.save();
    body(0);
    g.clip();
    g.fillStyle = belly;
    g.beginPath();
    g.moveTo(X(1.6), X(-0.6));
    g.bezierCurveTo(X(1), X(-0.55), X(0.3), X(-0.46), X(-1.2), X(-0.62));
    g.lineTo(X(-1.2), X(0.2));
    g.lineTo(X(1.6), X(0.2));
    g.closePath();
    g.fill();
    g.restore();
    g.strokeStyle = shade(back2, 0.62);
    g.lineWidth = X(0.035);
    g.lineCap = "round";
    for (var i = 0; i < 5; i++) {
      var gx = X(0.62 - i * 0.075);
      g.beginPath();
      g.moveTo(gx, X(-0.88));
      g.quadraticCurveTo(gx - X(0.03), X(-0.74), gx, X(-0.6));
      g.stroke();
    }
    g.fillStyle = "rgba(255,120,150,.45)";
    g.beginPath();
    g.ellipse(X(0.9), X(-0.58), X(0.12), X(0.07), 0, 0, 7);
    g.fill();
    g.fillStyle = "#FF8FB1";
    var bx = X(0.02), by = X(-1.3);
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx - X(0.18), by - X(0.11));
    g.lineTo(bx - X(0.18), by + X(0.11));
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx + X(0.18), by - X(0.11));
    g.lineTo(bx + X(0.18), by + X(0.11));
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(bx, by, X(0.055), 0, 7);
    g.fill();
  }
  if (on("pec")) rimmed(g, rim, mid, grow, function(e) {
    g.beginPath();
    g.moveTo(X(0.5), X(-0.45) - e);
    g.quadraticCurveTo(X(0.2), X(-0.22), X(-0.12) - e, X(-0.02) + e);
    g.quadraticCurveTo(X(0.18), X(-0.3), X(0.26), X(-0.46));
    g.closePath();
    g.fill();
  });
  if (on("mouth")) {
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = X(0.045);
    g.beginPath();
    g.moveTo(X(1.32), X(-0.47));
    g.quadraticCurveTo(X(1.18), X(-0.38), X(1.02), X(-0.44));
    g.stroke();
    g.fillStyle = "#FFFFFF";
    [1.26, 1.14].forEach(function(tx) {
      g.beginPath();
      g.moveTo(X(tx) - X(0.03), X(-0.43));
      g.lineTo(X(tx) + X(0.03), X(-0.43));
      g.lineTo(X(tx), X(-0.37));
      g.closePath();
      g.fill();
    });
  }
  if (rig.part === "mouthOpen") {
    g.fillStyle = "#6B2E3A";
    g.beginPath();
    g.moveTo(X(1.36), X(-0.5));
    g.quadraticCurveTo(X(1.2), X(-0.22), X(0.98), X(-0.44));
    g.closePath();
    g.fill();
    g.fillStyle = "#FFFFFF";
    [1.28, 1.18, 1.08].forEach(function(tx) {
      g.beginPath();
      g.moveTo(X(tx) - X(0.03), X(-0.47));
      g.lineTo(X(tx) + X(0.03), X(-0.47));
      g.lineTo(X(tx), X(-0.4));
      g.closePath();
      g.fill();
    });
  }
  if (on("eyes")) {
    var ex = X(1), ey = X(-0.8), sz = eyes === "wide" ? 1.3 : 1;
    g.lineCap = "round";
    g.strokeStyle = INK;
    g.lineWidth = X(0.06);
    if (eyes === "open" || eyes === "wide") {
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(ex, ey, X(0.12 * sz), X(0.14 * sz), 0, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex - X(0.035), ey - X(0.05), X(0.05), 0, 7);
      g.fill();
      g.beginPath();
      g.arc(ex + X(0.04), ey + X(0.05), X(0.022), 0, 7);
      g.fill();
    } else if (eyes === "shut") {
      g.beginPath();
      g.moveTo(ex - X(0.1), ey);
      g.quadraticCurveTo(ex, ey + X(0.08), ex + X(0.1), ey);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(ex - X(0.1), ey + X(0.04));
      g.quadraticCurveTo(ex, ey - X(0.1), ex + X(0.1), ey + X(0.04));
      g.stroke();
    }
  }
  return { c: P.c, ax: P.ax, ay: P.ay, k };
}

// src/creatures/otter.js
var SHAPE3 = {
  col: function() {
    return "#8B6247";
  },
  light: 0.22,
  feet: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function(f) {
      if (!on(f[0])) return;
      var s = f[1];
      rimmed(g, F.rim, "#5A3E2C", F.grow, function(e) {
        g.beginPath();
        g.ellipse(cx + s * r * 0.44, cy + r * 0.81, r * 0.27 + e, r * 0.13 + e, 0, 0, 7);
        g.fill();
      });
    });
  },
  tail: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.9), F.grow, function(e) {
      g.beginPath();
      g.moveTo(cx - r * 0.7, cy - r * 0.05 - e);
      g.quadraticCurveTo(cx - r * 1.4, cy + r * 0.05, cx - r * 1.65 - e, cy + r * 0.6);
      g.quadraticCurveTo(cx - r * 1.25, cy + r * 0.45, cx - r * 0.7, cy + r * 0.45 + e);
      g.closePath();
      g.fill();
    });
  },
  ear: function(g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(F.col, 0.85), F.grow, function(e) {
      g.beginPath();
      g.arc(cx + s * r * 0.6, cy - r * 0.68, r * 0.14 + e, 0, 7);
      g.fill();
    });
  },
  body: function(g, F, e) {
    g.beginPath();
    g.ellipse(F.cx, F.cy, F.r + e, F.r * 0.9 + e, 0, 0, 7);
    g.fill();
  },
  belly: function(g, F) {
    var r = F.r;
    g.fillStyle = "#EBD6BC";
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(F.cx, F.cy + r * 0.42, r * 0.56, r * 0.36, 0, 0, 7);
    g.fill();
    g.globalAlpha = 1;
  },
  face: function(g, F) {
    var cx = F.cx, r = F.r, fy = F.fy, dx = F.dx, eyes = F.eyes, ox = cx + dx;
    if (on("body")) {
      g.fillStyle = "#EBD6BC";
      g.beginPath();
      g.ellipse(ox, fy + r * 0.18, r * 0.34, r * 0.23, 0, 0, 7);
      g.fill();
      face(g, cx, fy, r, eyes, dx, false, "rest");
      g.fillStyle = "#3A2A22";
      g.beginPath();
      g.ellipse(ox, fy + r * 0.1, r * 0.08, r * 0.055, 0, 0, 7);
      g.fill();
    }
    if (on("eyes")) face(g, cx, fy, r, eyes, dx, false, "eyes");
    if (on("whiskers")) {
      g.strokeStyle = "rgba(90,62,44,.8)";
      g.lineWidth = r * 0.025;
      g.lineCap = "round";
      [-1, 1].forEach(function(s) {
        [-0.06, 0.02, 0.1].forEach(function(o2) {
          g.beginPath();
          g.moveTo(ox + s * r * 0.2, fy + r * (0.18 + o2 * 0.5));
          g.lineTo(ox + s * r * 0.48, fy + r * (0.12 + o2 * 1.4));
          g.stroke();
        });
      });
    }
  },
  paw: { col: function() {
    return "#5A3E2C";
  }, x: 0.9, y: 0.05 }
};
var otter_default = {
  id: "otter",
  label: "Otter",
  tg: 2.55,
  editor: true,
  sprite: function(o, eyes, k) {
    return frontSprite(o, eyes, k, SHAPE3);
  },
  rig: {
    order: ["footL", "footR", "tail", "body", "paw", "whiskers", "eyes"],
    eyesIn: "eyes",
    piv: { footL: [-0.44, -0.1], footR: [0.44, -0.1], tail: [-0.7, -0.72], whiskers: [0.1, -0.82], paw: [0.8, -1.12] }
  },
  hat: [-0.14, -1.84, -0.15],
  timers: ["curl", "twitch"],
  anim: function(t, p, time, M) {
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "tail") return [0.16 * Math.sin(time * 1.6) - 0.35 * M.spike(t.curl, 1.6) + 0.22 * Math.sin(M.ph - 0.8) * M.g, 0, 0];
    if (p === "whiskers") return [0.1 * Math.sin(time * 30) * M.spike(t.twitch, 0.5), 0, -0.02 * M.spike(t.twitch, 0.5)];
    if (p === "paw") return pawWave(M);
  },
  life: function(t, dt) {
    var R = Math.random;
    if (!(t.curl > 0) && R() < dt * 0.15) t.curl = 1.6;
    if (!(t.twitch > 0) && R() < dt * 0.4) t.twitch = 0.5;
  },
  habits: waterDip
};

// src/creatures/snail.js
var snail_default = {
  id: "snail",
  label: "Snail",
  tg: 2.05,
  editor: true,
  sprite: snailSprite,
  rig: { order: ["body", "house", "stalks"], eyesIn: "stalks", piv: { house: [-0.25, -0.58], stalks: [0.95, -1.22] } },
  hat: [-0.25, -1.98, 0],
  anim: function(t, p, time, M) {
    if (p === "stalks") return [0.12 * Math.sin(time * 1.8 - 0.8) + 0.12 * M.g * Math.sin(time * 3 - 1) + M.wave * 0.3 * Math.sin(time * 9), 0, 0];
    if (p === "house") return [0.04 * Math.sin(time * 2.2 - 1.2) + 0.03 * M.g * Math.sin(time * 4 - 1.6), 0, 0.03 * Math.sin(time * 2.2 - 1.2) + 0.025 * M.g * Math.abs(Math.sin(time * 4 - 1.4))];
  }
};
function snailSprite(o, eyes, k) {
  var r = o.r * k, w = r * 3.6, cy = r * 1.75, h = cy + r * 1.05;
  var c = canvas(w, h), g = c.getContext("2d"), cx = w / 2, col = o.col, grow = 1.7 * k;
  var slug = "#F6D9A9", slugRim = "#B98A4E";
  if (on("body")) {
    rimmed(g, slugRim, slug, grow, function(e) {
      g.beginPath();
      g.ellipse(cx, cy + r * 0.56, r * 1.3 + e, r * 0.36 + e, 0, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(cx + r * 0.95, cy + r * 0.1, r * 0.42 + e, r * 0.6 + e, 0, 0, 7);
      g.fill();
    });
    g.fillStyle = "rgba(255,120,150,.42)";
    g.beginPath();
    g.ellipse(cx + r * 1.12, cy + r * 0.2, r * 0.12, r * 0.07, 0, 0, 7);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = r * 0.05;
    g.lineCap = "round";
    g.beginPath();
    g.arc(cx + r * 1, cy + r * 0.12, r * 0.1, 0.3, 2.6);
    g.stroke();
  }
  if (on("stalks")) {
    var tips = [[0.8, -0.72], [1.12, -0.66]], sz = eyes === "wide" ? 1.35 : 1;
    g.strokeStyle = slugRim;
    g.lineWidth = r * 0.1;
    g.lineCap = "round";
    tips.forEach(function(p) {
      g.beginPath();
      g.moveTo(cx + r * 0.95, cy - r * 0.3);
      g.lineTo(cx + r * p[0], cy + r * p[1]);
      g.stroke();
    });
    g.strokeStyle = slug;
    g.lineWidth = r * 0.05;
    tips.forEach(function(p) {
      g.beginPath();
      g.moveTo(cx + r * 0.95, cy - r * 0.3);
      g.lineTo(cx + r * p[0], cy + r * p[1]);
      g.stroke();
    });
    tips.forEach(function(p) {
      var ex = cx + r * p[0], ey = cy + r * p[1];
      if (eyes === "open" || eyes === "wide") {
        g.fillStyle = INK;
        g.beginPath();
        g.arc(ex, ey, r * 0.1 * sz, 0, 7);
        g.fill();
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(ex - r * 0.03, ey - r * 0.04, r * 0.035, 0, 7);
        g.fill();
      } else {
        g.strokeStyle = INK;
        g.lineWidth = r * 0.06;
        g.beginPath();
        if (eyes === "shut") {
          g.moveTo(ex - r * 0.08, ey);
          g.lineTo(ex + r * 0.08, ey);
        } else {
          g.moveTo(ex - r * 0.08, ey + r * 0.03);
          g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03);
        }
        g.stroke();
      }
    });
  }
  if (on("house")) {
    var hx = cx - r * 0.25, base = cy + r * 0.34, ww = r * 1.3, wh = r * 0.8, roof = shade(col, 0.68);
    rimmed(g, shade(col, 0.5), col, grow, function(e) {
      g.fillRect(hx - ww / 2 - e, base - wh - e, ww + e * 2, wh + e * 2);
    });
    g.fillStyle = shade(col, 0.5);
    g.fillRect(hx + r * 0.3, base - wh - r * 0.55, r * 0.18, r * 0.4);
    rimmed(g, shade(col, 0.45), roof, grow, function(e) {
      g.beginPath();
      g.moveTo(hx - ww / 2 - r * 0.18 - e, base - wh + e);
      g.lineTo(hx, base - wh - r * 0.62 - e);
      g.lineTo(hx + ww / 2 + r * 0.18 + e, base - wh + e);
      g.closePath();
      g.fill();
    });
    g.fillStyle = "#7A4B2A";
    rr(g, hx - r * 0.42, base - r * 0.48, r * 0.3, r * 0.48, r * 0.1);
    g.fill();
    g.fillStyle = "#FFE9A6";
    rr(g, hx + r * 0.1, base - r * 0.62, r * 0.32, r * 0.28, r * 0.05);
    g.fill();
    g.strokeStyle = shade(col, 0.5);
    g.lineWidth = r * 0.04;
    g.beginPath();
    g.moveTo(hx + r * 0.26, base - r * 0.62);
    g.lineTo(hx + r * 0.26, base - r * 0.34);
    g.stroke();
  }
  return { c, ax: cx, ay: cy + r * 0.92, k };
}

// src/creatures/fox.js
var FUR = "#E07B39";
var SOCK = "#3A2A22";
var WHITE = "#FFF4E6";
var SHAPE4 = {
  col: function() {
    return FUR;
  },
  light: 0.28,
  feet: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function(f) {
      if (!on(f[0])) return;
      var s = f[1];
      rimmed(g, "#1E1612", SOCK, F.grow, function(e) {
        g.beginPath();
        g.ellipse(cx + s * r * 0.4, cy + r * 0.82, r * 0.22 + e, r * 0.13 + e, 0, 0, 7);
        g.fill();
      });
    });
  },
  tail: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, F.rim, shade(FUR, 0.95), F.grow, function(e) {
      g.beginPath();
      g.moveTo(cx - r * 0.6, cy + r * 0.55 + e);
      g.quadraticCurveTo(cx - r * 1.55 - e, cy + r * 0.7 + e, cx - r * 1.6 - e, cy - r * 0.2);
      g.quadraticCurveTo(cx - r * 1.62 - e, cy - r * 0.95 - e, cx - r * 1.2, cy - r * 1.05 - e);
      g.quadraticCurveTo(cx - r * 1.05, cy - r * 0.4, cx - r * 0.55, cy + r * 0.05 - e);
      g.closePath();
      g.fill();
    });
    g.fillStyle = WHITE;
    g.beginPath();
    g.moveTo(cx - r * 1.58, cy - r * 0.55);
    g.quadraticCurveTo(cx - r * 1.62, cy - r * 0.95, cx - r * 1.2, cy - r * 1.05);
    g.quadraticCurveTo(cx - r * 1.14, cy - r * 0.78, cx - r * 1.3, cy - r * 0.6);
    g.closePath();
    g.fill();
  },
  ear: function(g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    var tri = function(e) {
      g.beginPath();
      g.moveTo(cx + s * (r * 0.16 - e), cy - r * 0.7);
      g.lineTo(cx + s * (r * 0.86 + e), cy - r * 0.42);
      g.lineTo(cx + s * r * 0.64, cy - r * 1.38 - e);
      g.closePath();
      g.fill();
    };
    rimmed(g, F.rim, FUR, F.grow, tri);
    g.fillStyle = "#FFE3CF";
    g.beginPath();
    g.moveTo(cx + s * r * 0.34, cy - r * 0.68);
    g.lineTo(cx + s * r * 0.7, cy - r * 0.52);
    g.lineTo(cx + s * r * 0.62, cy - r * 1.1);
    g.closePath();
    g.fill();
    g.fillStyle = SOCK;
    g.beginPath();
    g.moveTo(cx + s * r * 0.55, cy - r * 1.12);
    g.lineTo(cx + s * r * 0.75, cy - r * 1.06);
    g.lineTo(cx + s * r * 0.64, cy - r * 1.38);
    g.closePath();
    g.fill();
  },
  body: function(g, F, e) {
    g.beginPath();
    g.ellipse(F.cx, F.cy, F.r + e, F.r * 0.9 + e, 0, 0, 7);
    g.fill();
  },
  belly: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    g.fillStyle = WHITE;
    g.globalAlpha = 0.95;
    g.beginPath();
    g.moveTo(cx - r * 0.42, cy - r * 0.05);
    g.quadraticCurveTo(cx, cy + r * 0.25, cx + r * 0.42, cy - r * 0.05);
    g.quadraticCurveTo(cx + r * 0.5, cy + r * 0.62, cx, cy + r * 0.82);
    g.quadraticCurveTo(cx - r * 0.5, cy + r * 0.62, cx - r * 0.42, cy - r * 0.05);
    g.fill();
    g.globalAlpha = 1;
  },
  face: function(g, F) {
    var cx = F.cx, r = F.r, fy = F.fy, dx = F.dx, ox = cx + dx;
    if (on("body")) {
      g.fillStyle = WHITE;
      [-1, 1].forEach(function(s) {
        g.beginPath();
        g.ellipse(ox + s * r * 0.3, fy + r * 0.2, r * 0.3, r * 0.2, s * 0.25, 0, 7);
        g.fill();
      });
      g.beginPath();
      g.ellipse(ox, fy + r * 0.24, r * 0.2, r * 0.16, 0, 0, 7);
      g.fill();
      face(g, cx, fy, r, F.eyes, dx, F.o.adult, "rest");
      g.fillStyle = "#2B2433";
      g.beginPath();
      g.ellipse(ox, fy + r * 0.1, r * 0.085, r * 0.06, 0, 0, 7);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.7)";
      g.beginPath();
      g.arc(ox - r * 0.03, fy + r * 0.08, r * 0.022, 0, 7);
      g.fill();
    }
    if (on("eyes")) face(g, cx, fy, r, F.eyes, dx, F.o.adult, "eyes");
  },
  paw: { col: function() {
    return SOCK;
  }, x: 0.86, y: 0.25 }
};
var fox_default = {
  id: "fox",
  label: "Fox",
  tg: 2.6,
  editor: true,
  sprite: function(o, eyes, k) {
    return frontSprite(o, eyes, k, SHAPE4);
  },
  rig: {
    order: ["footL", "footR", "tail", "earL", "earR", "body", "paw", "eyes"],
    eyesIn: "eyes",
    piv: { footL: [-0.4, -0.12], footR: [0.4, -0.12], tail: [-0.62, -0.6], earL: [-0.42, -1.55], earR: [0.42, -1.55], paw: [0.76, -0.95] }
  },
  hat: [0, -1.86, 0],
  timers: ["fflickL", "fflickR", "swish", "pounce"],
  anim: function(t, p, time, M) {
    var crouch = t.pounce > 0 ? Math.min(1, t.pounce / 0.3, (1.2 - t.pounce) / 0.2) : 0;
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "tail") return [0.12 * Math.sin(time * 1.7) * M.idle + 0.22 * Math.sin(M.ph - 0.8) * M.g + 0.4 * Math.sin(time * 15) * M.spike(t.swish, 0.9) - 0.35 * crouch, 0, 0];
    if (p === "earL") return [-M.spike(t.fflickL, 0.3) * 0.5 + 0.08 * Math.sin(M.ph - 0.6) * M.g + 0.25 * crouch, 0, 0.03 * crouch];
    if (p === "earR") return [M.spike(t.fflickR, 0.3) * 0.5 - 0.08 * Math.sin(M.ph - 0.6) * M.g - 0.25 * crouch, 0, 0.03 * crouch];
    if (p === "paw") return pawWave(M);
  },
  life: function(t, dt, still) {
    var R = Math.random;
    if (!(t.fflickL > 0) && R() < dt * 0.3) t.fflickL = 0.3;
    if (!(t.fflickR > 0) && R() < dt * 0.3) t.fflickR = 0.3;
    if (!(t.swish > 0) && R() < dt * 0.12) t.swish = 0.9;
    if (still && !(t.pounce > 0) && R() < dt * 0.04) {
      t.pounce = 1.2;
      t.wait = Math.max(t.wait, 1.5);
    }
    if (t.pounce > 0 && t.pounce - dt <= 0.35 && t.pounce > 0.35) t.jump = 0.6;
  }
};

// src/creatures/hedgehog.js
var FACE = "#E8CBA4";
var SPINE = "#7A5A40";
var TIP = "#D8C2A2";
var SHAPE5 = {
  col: function() {
    return FACE;
  },
  light: 0.35,
  feet: function(g, F) {
    var cx = F.cx, cy = F.cy, r = F.r;
    [["footL", -1], ["footR", 1]].forEach(function(f) {
      if (!on(f[0])) return;
      var s = f[1];
      rimmed(g, "#5A4030", "#8C6A4E", F.grow, function(e) {
        g.beginPath();
        g.ellipse(cx + s * r * 0.38, cy + r * 0.84, r * 0.2 + e, r * 0.12 + e, 0, 0, 7);
        g.fill();
      });
    });
  },
  back: function(g, F) {
    if (!on("spines")) return;
    var cx = F.cx, cy = F.cy, r = F.r, n = 15;
    var crown = function(e) {
      g.beginPath();
      for (var i2 = 0; i2 <= n; i2++) {
        var a2 = Math.PI * (0.98 + 1.04 * i2 / n);
        var ro = r * 1.32 + e, ri = r * 0.98 + e, am = a2 + Math.PI * 0.52 / n;
        var x0 = cx + Math.cos(a2) * ri, y0 = cy + r * 0.12 + Math.sin(a2) * ri * 0.98;
        if (i2 === 0) g.moveTo(x0, y0);
        else g.lineTo(x0, y0);
        if (i2 < n) g.lineTo(cx + Math.cos(am) * ro, cy + r * 0.12 + Math.sin(am) * ro * 0.98);
      }
      g.lineTo(cx + r * 0.9, cy + r * 0.6);
      g.lineTo(cx - r * 0.9, cy + r * 0.6);
      g.closePath();
      g.fill();
    };
    rimmed(g, "#3E2C20", SPINE, F.grow, crown);
    g.strokeStyle = TIP;
    g.lineWidth = r * 0.045;
    g.lineCap = "round";
    for (var i = 1; i < n; i += 2) {
      var a = Math.PI * (0.98 + 1.04 * i / n) + Math.PI * 0.52 / n;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r * 1.14, cy + r * 0.12 + Math.sin(a) * r * 1.12);
      g.lineTo(cx + Math.cos(a) * r * 1.28, cy + r * 0.12 + Math.sin(a) * r * 1.26);
      g.stroke();
    }
  },
  ear: function(g, F, s) {
    var cx = F.cx, cy = F.cy, r = F.r;
    rimmed(g, shade(FACE, 0.55), shade(FACE, 0.92), F.grow, function(e) {
      g.beginPath();
      g.arc(cx + s * r * 0.58, cy - r * 0.74, r * 0.16 + e, 0, 7);
      g.fill();
    });
    g.fillStyle = "#D99A8C";
    g.beginPath();
    g.arc(cx + s * r * 0.58, cy - r * 0.74, r * 0.075, 0, 7);
    g.fill();
  },
  body: function(g, F, e) {
    g.beginPath();
    g.ellipse(F.cx, F.cy + F.r * 0.06, F.r * 0.86 + e, F.r * 0.84 + e, 0, 0, 7);
    g.fill();
  },
  belly: function(g, F) {
    var r = F.r;
    g.fillStyle = "#FFF1DD";
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(F.cx, F.cy + r * 0.46, r * 0.48, r * 0.32, 0, 0, 7);
    g.fill();
    g.globalAlpha = 1;
  },
  faceY: 0.1,
  face: function(g, F) {
    var r = F.r, fy = F.fy, ox = F.cx + F.dx, eyes = F.eyes;
    if (on("body") && !F.o.adult) {
      g.fillStyle = "rgba(255,120,150,.42)";
      [-1, 1].forEach(function(s) {
        g.beginPath();
        g.ellipse(ox + s * r * 0.4, fy + r * 0.2, r * 0.13, r * 0.08, 0, 0, 7);
        g.fill();
      });
    }
    if (on("snout")) {
      rimmed(g, shade(FACE, 0.78), "#F6E3C8", F.grow * 0.5, function(e) {
        g.beginPath();
        g.ellipse(ox, fy + r * 0.17, r * 0.21 + e, r * 0.15 + e, 0, 0, 7);
        g.fill();
      });
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(ox, fy + r * 0.12, r * 0.08, r * 0.062, 0, 0, 7);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.7)";
      g.beginPath();
      g.arc(ox - r * 0.025, fy + r * 0.1, r * 0.02, 0, 7);
      g.fill();
      g.strokeStyle = INK;
      g.lineCap = "round";
      g.lineWidth = r * 0.035;
      g.beginPath();
      g.arc(ox, fy + r * 0.19, r * 0.07, 0.5, Math.PI - 0.5);
      g.stroke();
    }
    if (on("eyes")) {
      var ey = fy - r * 0.1, sz = eyes === "wide" ? 1.35 : 1;
      [-1, 1].forEach(function(s) {
        var ex = ox + s * r * 0.26;
        g.strokeStyle = INK;
        g.lineCap = "round";
        g.lineWidth = r * 0.055;
        if (eyes === "open" || eyes === "wide") {
          g.fillStyle = INK;
          g.beginPath();
          g.ellipse(ex, ey, r * 0.075 * sz, r * 0.085 * sz, 0, 0, 7);
          g.fill();
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(ex - r * 0.025, ey - r * 0.03, r * 0.028, 0, 7);
          g.fill();
        } else if (eyes === "shut") {
          g.beginPath();
          g.moveTo(ex - r * 0.08, ey);
          g.quadraticCurveTo(ex, ey + r * 0.05, ex + r * 0.08, ey);
          g.stroke();
        } else {
          g.beginPath();
          g.moveTo(ex - r * 0.08, ey + r * 0.03);
          g.quadraticCurveTo(ex, ey - r * 0.07, ex + r * 0.08, ey + r * 0.03);
          g.stroke();
        }
        if (F.o.adult && eyes !== "shut") {
          g.lineWidth = r * 0.04;
          g.beginPath();
          g.moveTo(ex - r * 0.09, ey - r * 0.17);
          g.quadraticCurveTo(ex, ey - r * 0.21, ex + r * 0.09, ey - r * 0.16);
          g.stroke();
        }
      });
    }
  },
  paw: { col: function() {
    return "#8C6A4E";
  }, x: 0.78, y: 0.32 }
};
var hedgehog_default = {
  id: "hedgehog",
  label: "Hedgehog",
  tg: 2.35,
  editor: true,
  sprite: function(o, eyes, k) {
    return frontSprite(o, eyes, k, SHAPE5);
  },
  rig: {
    order: ["footL", "footR", "spines", "earL", "earR", "body", "paw", "snout", "eyes"],
    eyesIn: "eyes",
    piv: { footL: [-0.38, -0.1], footR: [0.38, -0.1], spines: [0, -0.9], earL: [-0.58, -1.66], earR: [0.58, -1.66], snout: [0.1, -0.92], paw: [0.7, -0.85] }
  },
  hat: [0.05, -2.02, 0.1],
  timers: ["snuffle", "bristle"],
  anim: function(t, p, time, M) {
    var up = M.spike(t.bristle, 1.2) + (t.startle > 0 ? 0.6 : 0);
    if (p === "footL") return [0, 0, M.stepL];
    if (p === "footR") return [0, 0, M.stepR];
    if (p === "spines") return [0.03 * Math.sin(time * 2.1) * M.idle + 0.05 * Math.sin(M.ph) * M.g + 0.04 * up * Math.sin(time * 40), 0, -0.06 * up - 0.015 * Math.sin(time * 2.1)];
    if (p === "snout") {
      var sn = M.spike(t.snuffle, 0.9);
      return [0.12 * sn * Math.sin(time * 26), 0, -0.02 * sn * Math.abs(Math.sin(time * 13))];
    }
    if (p === "earL" || p === "earR") return [0, 0, -0.03 * up];
    if (p === "paw") return pawWave(M);
  },
  life: function(t, dt, still) {
    var R = Math.random;
    if (!(t.snuffle > 0) && R() < dt * (still ? 0.45 : 0.2)) t.snuffle = 0.9;
    if (t.startle > 1.1 && !(t.bristle > 0)) t.bristle = 1.2;
  }
};

// src/creatures/index.js
function classic(id, label, editor) {
  return { id, label, editor, sprite: classicSprite };
}
var CREATURES = [
  crow_default,
  capybara_default,
  deer_default,
  shark_default,
  otter_default,
  snail_default,
  fox_default,
  hedgehog_default,
  classic("bear", "Bear", true),
  classic("bunny", "Bunny", true),
  classic("phones", "Phones", false),
  classic("curls", "Curls", false),
  classic("flower", "Flower", false)
];
var CREATURE = {};
CREATURES.forEach(function(c) {
  CREATURE[c.id] = c;
});
var HELPERS = ["index.js", "classic.js", "front.js", "swim.js"];
function creatureSprite(o, eyes, k) {
  var c = CREATURE[o.look];
  return (c ? c.sprite : classicSprite)(o, eyes, k || K);
}
var EYE_STATES = ["open", "shut", "happy", "wide"];
function cropPart(full) {
  var c = full.c, g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data;
  var x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) return null;
  var out = canvas(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext("2d").drawImage(c, -x0, -y0);
  return { c: out, ox: x0, oy: y0 };
}
function bakeRig(p) {
  var C = CREATURE[p.look], D = C && C.rig;
  if (!D) return null;
  var R = { parts: {}, eyes: {}, ax: 0, ay: 0 };
  D.order.concat(D.extra || []).forEach(function(name) {
    if (name === D.eyesIn) return;
    rig.part = name;
    var full = C.sprite(p, "open", K);
    R.ax = full.ax;
    R.ay = full.ay;
    R.parts[name] = cropPart(full);
  });
  EYE_STATES.forEach(function(e) {
    rig.part = D.eyesIn;
    R.eyes[e] = cropPart(C.sprite(p, e, K));
  });
  rig.part = null;
  return R;
}
var TIMERS = ["cock", "flickL", "flickR", "chew", "curl", "twitch", "twL", "twR", "flick", "pronk", "graze", "wave", "startle", "gcool", "wcool", "scool"];
CREATURES.forEach(function(c) {
  (c.timers || []).forEach(function(k) {
    if (TIMERS.indexOf(k) < 0) TIMERS.push(k);
  });
});

// src/scenes/meadow.js
var meadow_default = {
  id: "meadow",
  label: "Meadow",
  village: true,
  grazers: true,
  creatures: ["crow", "capybara", "deer", "shark", "otter", "snail", "fox", "hedgehog", "bear", "bunny"],
  bake,
  // spread out along the meadow, clear of the workshop plot on the right
  start: function(i, S) {
    return { x: S.W * (0.24 + i % 3 * 0.22), y: i < 3 ? S.TOP + 150 : S.H - 200 };
  },
  // where the swimmers stand when they fancy a dip: the pond's bank
  swimSpot: function(S) {
    return { x: rand(S.W * 0.72, S.W * 0.83), y: S.H - 172 };
  },
  // The landmarks a tap opens (scenes/index.js has the ids): the school, the workshop plot,
  // the bandstand (and the now-playing sign over it), the blue cottage, and the office robot.
  hotspots: {
    school: {
      box: function(S) {
        var s = S.lay.school;
        return [s.x - 90, s.y - 145, s.x + 90, s.y + 8];
      },
      tap: function(S) {
        var s = S.lay.school;
        S.say("ding!", s.x + 22, s.y - 150);
      }
    },
    printer: {
      box: function(S) {
        var s = S.lay.shop;
        return [s.x - 90, s.y - 100, s.x + 66, s.y + 12];
      },
      tap: function(S) {
        var s = S.lay.shop;
        S.puff("chip", s.x, s.y - 30, 6, "#D9B27A");
      }
    },
    music: {
      box: function(S) {
        var b = S.lay.band;
        return [b.x - 95, b.y - 140 - (S.sign || 0), b.x + 95, b.y + 22];
      },
      tap: function(S) {
        var b = S.lay.band;
        S.puff("note", b.x + rand(-30, 30), b.y - 100, 5, "#D9534F");
      }
    },
    home: {
      box: function(S) {
        var c = S.lay.cottage;
        return [c.x - 58, c.y - 110, c.x + 58, c.y + 10];
      },
      tap: function(S) {
        var c = S.lay.cottage;
        S.puff("heart", c.x + 18, c.y - 50, 3, "#FF7FA0");
      }
    },
    office: { robot: true }
  },
  weather: {
    // lying snow, and a snowman by the garden
    ground: function(ctx, S, WX) {
      if (WX.snow > 0.02) {
        ctx.fillStyle = "rgba(246,249,255," + (0.5 * WX.snow).toFixed(3) + ")";
        ctx.fillRect(0, S.HZ - 30, S.W, S.H);
        ctx.globalAlpha = WX.snow;
        S.blit(S.sprites.snowman, S.W * 0.215, S.H - 120, 1, 1, 1, 1);
        ctx.globalAlpha = 1;
      }
    }
  }
};
function bake(g, S) {
  var W = S.W, H = S.H, HZ = S.HZ, i;
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#BFE4F0");
  sky.addColorStop(1, "#E9F7EC");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, HZ + 20);
  function hills(y2, amp, col, seed) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, H);
    for (var x2 = 0; x2 <= W; x2 += 16) g.lineTo(x2, y2 - amp * (0.6 * Math.sin(x2 / 210 + seed) + 0.4 * Math.sin(x2 / 97 + seed * 2.3)));
    g.lineTo(W, H);
    g.closePath();
    g.fill();
  }
  hills(HZ - 18, 22, "#B7DFB4", 1.2);
  hills(HZ + 2, 14, "#9ED39E", 4.1);
  var gr = g.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, "#98D194");
  gr.addColorStop(1, "#7EC47E");
  g.fillStyle = gr;
  g.fillRect(0, HZ + 8, W, H);
  hills(HZ + 12, 6, "#98D194", 2.7);
  for (i = 0; i < 9; i++) {
    var bx = rand(0, W), by = HZ + rand(4, 16), br = rand(18, 34);
    if (bx < 520 && by < HZ + 20 && i % 2) continue;
    [[0, 0, 1], [-0.7, 0.25, 0.7], [0.7, 0.25, 0.75]].forEach(function(p2) {
      g.fillStyle = "#6FB673";
      g.beginPath();
      g.arc(bx + p2[0] * br, by + p2[1] * br, br * p2[2], 0, 7);
      g.fill();
    });
    g.fillStyle = "rgba(255,255,255,.18)";
    g.beginPath();
    g.arc(bx - br * 0.3, by - br * 0.35, br * 0.35, 0, 7);
    g.fill();
  }
  for (i = 0; i < 90; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(40,110,50,.06)";
    g.beginPath();
    g.ellipse(rand(0, W), rand(HZ + 20, H), rand(30, 110), rand(10, 30), 0, 0, 7);
    g.fill();
  }
  var POND = { x: W * 0.83, y: H * 0.93, rx: Math.min(210, W * 0.17), ry: 74 };
  g.fillStyle = "#6DB57A";
  g.beginPath();
  g.ellipse(POND.x, POND.y, POND.rx + 10, POND.ry + 8, 0, 0, 7);
  g.fill();
  var pg = g.createLinearGradient(0, POND.y - POND.ry, 0, POND.y + POND.ry);
  pg.addColorStop(0, "#9ED8E6");
  pg.addColorStop(1, "#6FBBD3");
  g.fillStyle = pg;
  g.beginPath();
  g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.6)";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.ellipse(POND.x - 30, POND.y - 22, 60, 14, 0, 3.6, 5.2);
  g.stroke();
  g.fillStyle = "#5FAE69";
  g.beginPath();
  g.ellipse(POND.x + 70, POND.y - 12, 26, 12, 0.3, 0.5, 6);
  g.fill();
  g.fillStyle = "#FFB3C7";
  g.beginPath();
  g.arc(POND.x + 74, POND.y - 16, 6, 0, 7);
  g.fill();
  S.place(layout(S, POND));
  for (i = 0; i < 160; i++) {
    var x = rand(0, W), y = rand(HZ + 26, H);
    if (S.inZone(x, y, 16)) continue;
    g.strokeStyle = "rgba(52,120,60,.45)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, y - 7);
    g.lineTo(x, y);
    g.lineTo(x + 1, y - 9);
    g.moveTo(x, y);
    g.lineTo(x + 5, y - 6);
    g.stroke();
  }
  for (i = 0; i < 70; i++) {
    var fx = rand(0, W), fy = rand(HZ + 30, H), fc = pick(["#FFFFFF", "#FFF3A8", "#FFC4D6", "#E4D2FF"]);
    if (S.inZone(fx, fy, 14)) continue;
    g.fillStyle = fc;
    for (var p = 0; p < 5; p++) {
      var a = p / 5 * 6.283;
      g.beginPath();
      g.arc(fx + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 2.6, 0, 7);
      g.fill();
    }
    g.fillStyle = "#F4B63C";
    g.beginPath();
    g.arc(fx, fy, 1.8, 0, 7);
    g.fill();
  }
  paintProps(g, S);
}
function layout(S, POND) {
  var W = S.W, H = S.H, TOP = S.TOP, B = TOP + 36, R = TOP + 62;
  var LAY = {
    B,
    R,
    well: { x: Math.round(W * 0.06), y: B },
    pub: { x: Math.round(W * 0.195), y: B },
    bakery: { x: Math.round(W * 0.345), y: B },
    post: { x: Math.round(W * 0.48), y: B },
    market: { x: Math.round(W * 0.61), y: B },
    bus: { x: Math.round(W * 0.715), y: R + 16 },
    cottage: { x: Math.round(W * 0.79), y: B },
    mill: { x: Math.round(W * 0.905), y: B },
    // The printer's workshop goes on the cottage's back plot, below it and left of
    // the woodcutter: the one patch the village had not used. The family patch
    // starts just below its zone.
    shop: { x: Math.round(W * 0.79), y: TOP + 172 },
    school: { x: Math.round(W * 0.075), y: TOP + 190 },
    swing: { x: Math.round(W * 0.05), y: H - 160 },
    wood: { x: Math.round(W * 0.9), y: TOP + 175 },
    wash: { x: Math.round(W * 0.925), y: H - 200 },
    garden: { x: Math.round(W * 0.14), y: H - 58 },
    band: { x: Math.round(W * 0.33), y: H - 30 },
    pitch: { x: Math.round(W * 0.52), y: H - 60 },
    fish: { x: POND.x + Math.cos(3.45) * (POND.rx + 8), y: POND.y + Math.sin(3.45) * (POND.ry + 8), bx: POND.x - POND.rx * 0.5, by: POND.y - POND.ry * 0.3 }
  };
  var L = LAY, lx = Math.round(W * 0.855), sx = L.school.x + 100;
  function back2(x, y) {
    return { x, y: y || B + 3, lane: [{ x, y: R }] };
  }
  var DOORS = {
    pub: back2(L.pub.x - 30),
    bakery: back2(L.bakery.x - 31),
    post: back2(L.post.x - 18),
    cottage: back2(L.cottage.x - 14),
    mill: back2(L.mill.x),
    bakeryside: back2(L.bakery.x + 84, B + 12),
    marketside: back2(L.market.x - 84, B + 14),
    marketq: back2(L.market.x + 10, B + 20),
    wellq: back2(L.well.x + 60, R),
    busq: back2(L.bus.x - 30, R + 12),
    school: { x: L.school.x, y: L.school.y + 3, lane: [{ x: sx, y: L.school.y + 12 }, { x: sx, y: R }] },
    wood: { x: L.wood.x - 34, y: L.wood.y + 4, lane: [{ x: lx, y: L.wood.y + 4 }, { x: lx, y: R }] },
    wash: { x: L.wash.x - 44, y: L.wash.y + 8, lane: [{ x: lx, y: L.wash.y + 8 }, { x: lx, y: R }] },
    left: { x: -24, y: R, lane: [] },
    right: { x: W + 24, y: R, lane: [] }
  };
  var ZONES = [
    { x: POND.x, y: POND.y, rx: POND.rx, ry: POND.ry },
    { x: L.school.x + 5, y: L.school.y + 50, rx: 112, ry: 165 },
    // school, yard and swing
    { x: L.wood.x + 30, y: L.wood.y + 90, rx: 105, ry: 165 },
    // woodcutter and washing line
    { x: L.garden.x + 20, y: L.garden.y - 8, rx: 140, ry: 52 },
    { x: L.band.x, y: L.band.y - 22, rx: 92, ry: 58 },
    { x: L.pitch.x, y: L.pitch.y, rx: 128, ry: 50 },
    { x: L.fish.x - 10, y: L.fish.y, rx: 46, ry: 30 },
    { x: L.shop.x, y: L.shop.y - 16, rx: 74, ry: 46 }
  ];
  return {
    lay: LAY,
    doors: DOORS,
    zones: ZONES,
    water: POND,
    exit: { x: LAY.bus.x - 36, y: LAY.R + 14, off: { x: W + 55, y: LAY.R } },
    // out by the bus stop
    // inner: the family's patch, the middle. Everything else wanders south of the road.
    patch: [{ x0: W * 0.16, x1: W * 0.84, y0: TOP + 118, y1: H - 170 }],
    roam: [{ x0: 30, x1: W - 30, y0: LAY.R + 16, y1: H - 22 }],
    home: { x: W / 2, y: (TOP + H) / 2 }
  };
}
function paintProps(g, S) {
  var L = S.lay, W = S.W, B = L.B, R = L.R, x, y, i;
  function roofTri(x0, x1, base, apex, col, rim) {
    rimmed(g, rim, col, 2, function(e) {
      g.beginPath();
      g.moveTo(x0 - e, base + e);
      g.lineTo((x0 + x1) / 2, apex - e);
      g.lineTo(x1 + e, base + e);
      g.closePath();
      g.fill();
    });
  }
  function walls(x0, w, top2, h, col, rim) {
    rimmed(g, rim, col, 2, function(e) {
      g.fillRect(x0 - e, top2 - e, w + 2 * e, h + 2 * e);
    });
  }
  function win(x0, y0, w, h) {
    g.fillStyle = "#FFE9A6";
    rr(g, x0, y0, w, h, 4);
    g.fill();
    g.strokeStyle = "rgba(90,60,40,.5)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0 + w / 2, y0);
    g.lineTo(x0 + w / 2, y0 + h);
    g.stroke();
  }
  function door(x0, y0, w, h, col) {
    g.fillStyle = col || "#8A5A3C";
    rr(g, x0, y0, w, h, Math.min(10, w / 2));
    g.fill();
    g.fillStyle = "#E8C66A";
    g.beginPath();
    g.arc(x0 + w - 5, y0 + h / 2, 1.8, 0, 7);
    g.fill();
  }
  g.fillStyle = "rgba(233,217,168,.85)";
  rr(g, -10, R - 12, W + 20, 26, 12);
  g.fill();
  rr(g, L.school.x + 92, R, 17, L.school.y + 22 - R, 8);
  g.fill();
  rr(g, Math.round(W * 0.855) - 8, R, 17, L.wash.y + 18 - R, 8);
  g.fill();
  g.fillStyle = "rgba(170,150,110,.35)";
  for (i = 0; i < 70; i++) {
    g.beginPath();
    g.arc(rand(0, W), R + rand(-9, 11), rand(1, 2.2), 0, 7);
    g.fill();
  }
  x = L.well.x;
  y = B;
  g.fillStyle = "#8D6440";
  g.fillRect(x - 20, y - 64, 4, 50);
  g.fillRect(x + 16, y - 64, 4, 50);
  roofTri(x - 30, x + 30, y - 60, y - 80, "#B5654A", "#7E4331");
  g.fillStyle = "#9A9AA3";
  g.fillRect(x - 22, y - 24, 44, 24);
  g.fillStyle = "#B7B7BF";
  for (i = 0; i < 4; i++) g.fillRect(x - 20 + i * 11, y - 20 + i % 2 * 8, 9, 5);
  g.fillStyle = "#6F6F78";
  g.beginPath();
  g.ellipse(x, y - 24, 22, 7, 0, 0, 7);
  g.fill();
  g.fillStyle = "#3B4A5A";
  g.beginPath();
  g.ellipse(x, y - 24, 16, 4.5, 0, 0, 7);
  g.fill();
  x = L.pub.x;
  y = B;
  walls(x - 64, 128, y - 64, 64, "#F1E3C8", "#7A5238");
  g.fillStyle = "#7A5238";
  [x - 64, x - 20, x + 20, x + 60].forEach(function(bx) {
    g.fillRect(bx, y - 64, 4, 64);
  });
  g.fillRect(x - 64, y - 36, 128, 4);
  roofTri(x - 76, x + 76, y - 62, y - 100, "#5E6E8C", "#3C4760");
  door(x - 42, y - 34, 24, 34, "#6B3F2A");
  win(x - 4, y - 56, 20, 16);
  win(x + 30, y - 56, 20, 16);
  g.fillStyle = "#7A5238";
  g.fillRect(x - 78, y - 58, 16, 3);
  g.fillStyle = "#FFF4E0";
  rr(g, x - 84, y - 55, 20, 20, 5);
  g.fill();
  g.fillStyle = "#E8B33C";
  g.fillRect(x - 79, y - 48, 9, 10);
  g.fillStyle = "#FFFFFF";
  g.beginPath();
  g.arc(x - 75, y - 49, 5, Math.PI, 0);
  g.fill();
  x = L.bakery.x;
  y = B;
  g.fillStyle = "#A7584A";
  g.fillRect(x + 30, y - 136, 16, 40);
  walls(x - 62, 124, y - 78, 78, "#F4D3BE", "#B98569");
  rimmed(g, "#8E4A3C", "#D0705A", 2, function(e) {
    g.beginPath();
    g.moveTo(x - 76 - e, y - 74 + e);
    g.lineTo(x, y - 130 - e);
    g.lineTo(x + 76 + e, y - 74 + e);
    g.closePath();
    g.fill();
  });
  g.strokeStyle = "rgba(255,255,255,.22)";
  g.lineWidth = 2;
  for (i = 1; i <= 3; i++) {
    var yy = y - 74 - i * 14, hw = 76 * (1 - i * 14 / 56);
    g.beginPath();
    g.moveTo(x - hw, yy);
    g.lineTo(x + hw, yy);
    g.stroke();
  }
  door(x - 44, y - 46, 26, 46);
  g.fillStyle = "#FFE9A6";
  rr(g, x + 4, y - 56, 36, 28, 5);
  g.fill();
  g.strokeStyle = "#B98569";
  g.beginPath();
  g.moveTo(x + 22, y - 56);
  g.lineTo(x + 22, y - 28);
  g.moveTo(x + 4, y - 42);
  g.lineTo(x + 40, y - 42);
  g.stroke();
  g.fillStyle = "#9C6B43";
  g.fillRect(x + 1, y - 28, 42, 7);
  ["#FF8FB1", "#FFFFFF", "#FF8FB1", "#FFD35C"].forEach(function(c, n) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x + 7 + n * 10, y - 30, 3, 0, 7);
    g.fill();
  });
  g.fillStyle = "#FFF4E0";
  rr(g, x - 52, y - 68, 42, 16, 8);
  g.fill();
  g.fillStyle = "#D89A55";
  g.beginPath();
  g.ellipse(x - 31, y - 60, 10, 4.5, 0, 0, 7);
  g.fill();
  x = L.post.x;
  y = B;
  walls(x - 48, 96, y - 62, 62, "#E7766A", "#9E3F36");
  g.fillStyle = "#9E3F36";
  g.fillRect(x - 54, y - 74, 108, 14);
  g.fillStyle = "#FFF4E0";
  rr(g, x - 16, y - 72, 32, 11, 3);
  g.fill();
  g.strokeStyle = "#9E3F36";
  g.lineWidth = 1.4;
  g.strokeRect(x - 8, y - 70.5, 16, 8);
  g.beginPath();
  g.moveTo(x - 8, y - 70.5);
  g.lineTo(x, y - 65.5);
  g.lineTo(x + 8, y - 70.5);
  g.stroke();
  door(x - 30, y - 38, 24, 38, "#5E3A2A");
  win(x + 4, y - 50, 30, 20);
  rimmed(g, "#7E2A24", "#D9433A", 2, function(e) {
    rr(g, x + 50 - e, y - 30 - e, 14 + 2 * e, 30 + 2 * e, 6);
    g.fill();
  });
  g.fillStyle = "#3B2A26";
  g.fillRect(x + 53, y - 22, 8, 2);
  x = L.market.x;
  y = B;
  g.fillStyle = "#A87A50";
  g.fillRect(x - 62, y - 84, 6, 84);
  g.fillRect(x + 56, y - 84, 6, 84);
  g.fillStyle = "#C24E42";
  g.fillRect(x - 74, y - 103, 148, 6);
  for (i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#FFF4E8" : "#E86A5B";
    g.fillRect(x - 72 + i * 18, y - 98, 18, 20);
    g.beginPath();
    g.arc(x - 63 + i * 18, y - 78, 9, 0, Math.PI);
    g.fill();
  }
  x = L.bus.x;
  y = L.bus.y;
  g.fillStyle = "#6E6E78";
  g.fillRect(x - 2, y - 52, 4, 52);
  g.fillStyle = "#D9433A";
  g.beginPath();
  g.arc(x, y - 58, 11, 0, 7);
  g.fill();
  g.fillStyle = "#FFFFFF";
  g.beginPath();
  g.arc(x, y - 58, 6.5, 0, 7);
  g.fill();
  g.fillStyle = "#3B5FA8";
  g.fillRect(x - 13, y - 61, 26, 6);
  x = L.cottage.x;
  y = B;
  g.fillStyle = "#8C6E62";
  g.fillRect(x + 18, y - 104, 12, 26);
  walls(x - 44, 88, y - 56, 56, "#CFE3F2", "#6D8FB5");
  roofTri(x - 54, x + 54, y - 54, y - 98, "#6D8FB5", "#48648A");
  door(x - 26, y - 36, 22, 36, "#B5654A");
  win(x + 6, y - 44, 26, 20);
  ["#FF8FB1", "#FFD35C", "#FFFFFF"].forEach(function(c, n) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x + 11 + n * 8, y - 22, 3, 0, 7);
    g.fill();
  });
  x = L.mill.x;
  y = B;
  rimmed(g, "#B3A48C", "#F2E8D8", 2, function(e) {
    g.beginPath();
    g.moveTo(x - 34 - e, y + e);
    g.lineTo(x - 21 - e, y - 120 - e);
    g.lineTo(x + 21 + e, y - 120 - e);
    g.lineTo(x + 34 + e, y + e);
    g.closePath();
    g.fill();
  });
  rimmed(g, "#7E4331", "#B5654A", 2, function(e) {
    g.beginPath();
    g.arc(x, y - 118, 24 + e, Math.PI, 0);
    g.fill();
  });
  door(x - 10, y - 32, 20, 32, "#8A5A3C");
  win(x - 8, y - 84, 16, 18);
  x = L.school.x;
  y = L.school.y;
  walls(x - 74, 148, y - 68, 68, "#F6E7B8", "#C2A25E");
  roofTri(x - 86, x + 86, y - 66, y - 108, "#C9594A", "#8E3B34");
  g.fillStyle = "#F6E7B8";
  g.fillRect(x - 11, y - 126, 22, 22);
  g.fillStyle = "#8E3B34";
  g.beginPath();
  g.moveTo(x - 15, y - 124);
  g.lineTo(x, y - 138);
  g.lineTo(x + 15, y - 124);
  g.closePath();
  g.fill();
  door(x - 12, y - 38, 24, 38, "#4E7CA8");
  win(x - 58, y - 52, 28, 20);
  win(x + 30, y - 52, 28, 20);
  g.fillStyle = "#FFFFFF";
  rr(g, x - 24, y - 62, 48, 14, 5);
  g.fill();
  g.font = "600 10px Fredoka";
  g.textAlign = "center";
  g.textBaseline = "middle";
  [["A", "#E86A5B"], ["B", "#3B5FA8"], ["C", "#4E9A5A"]].forEach(function(c, n) {
    g.fillStyle = c[1];
    g.fillText(c[0], x - 12 + n * 12, y - 54.5);
  });
  g.fillStyle = "rgba(217,207,165,.55)";
  g.beginPath();
  g.ellipse(x + 12, y + 50, 96, 34, 0, 0, 7);
  g.fill();
  x = L.swing.x;
  y = L.swing.y;
  g.fillStyle = "rgba(140,110,70,.25)";
  g.beginPath();
  g.ellipse(x, y - 2, 30, 7, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#A87A50";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x - 52, y);
  g.lineTo(x - 40, y - 100);
  g.lineTo(x - 28, y);
  g.moveTo(x + 28, y);
  g.lineTo(x + 40, y - 100);
  g.lineTo(x + 52, y);
  g.stroke();
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x - 46, y - 100);
  g.lineTo(x + 46, y - 100);
  g.stroke();
  x = L.wood.x;
  y = L.wood.y;
  g.fillStyle = "#9C6B43";
  g.fillRect(x - 20, y - 16, 40, 16);
  g.fillStyle = "#E2C08E";
  g.beginPath();
  g.ellipse(x, y - 16, 20, 7, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#B8905E";
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(x, y - 16, 12, 4, 0, 0, 7);
  g.stroke();
  x = L.wash.x;
  y = L.wash.y;
  g.fillStyle = "#A87A50";
  g.fillRect(x - 66, y - 70, 5, 70);
  g.fillRect(x + 62, y - 70, 5, 70);
  x = L.garden.x;
  y = L.garden.y;
  g.fillStyle = "#F2E6D0";
  g.fillRect(x - 94, y - 42, 188, 4);
  for (i = x - 92; i <= x + 92; i += 23) g.fillRect(i - 2, y - 50, 5, 20);
  rimmed(g, "#7E5536", "#A9794F", 2, function(e) {
    rr(g, x - 90 - e, y - 30 - e, 180 + 2 * e, 50 + 2 * e, 14);
    g.fill();
  });
  g.strokeStyle = "rgba(80,50,30,.35)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 78, y - 14);
  g.lineTo(x + 78, y - 14);
  g.moveTo(x - 78, y + 4);
  g.lineTo(x + 78, y + 4);
  g.stroke();
  x = L.band.x;
  y = L.band.y;
  rimmed(g, "#8D6440", "#C69C6D", 2, function(e) {
    g.beginPath();
    g.ellipse(x, y - 4, 76 + e, 18 + e, 0, 0, 7);
    g.fill();
  });
  g.fillStyle = "#A87A50";
  g.fillRect(x - 76, y - 4, 152, 10);
  g.fillStyle = "#FFFFFF";
  [-66, -24, 24, 66].forEach(function(o) {
    g.fillRect(x + o - 2, y - 90, 4, 84);
  });
  for (i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#FFF4E8" : "#D9534F";
    g.beginPath();
    g.moveTo(x, y - 132);
    g.lineTo(x - 82 + i * 20.5, y - 88);
    g.lineTo(x - 82 + (i + 1) * 20.5, y - 88);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#E8C66A";
  g.beginPath();
  g.arc(x, y - 134, 4, 0, 7);
  g.fill();
  x = L.pitch.x;
  y = L.pitch.y;
  g.fillStyle = "#AEDDA3";
  rr(g, x - 112, y - 34, 224, 68, 12);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.85)";
  g.lineWidth = 2;
  rr(g, x - 104, y - 28, 208, 56, 8);
  g.stroke();
  g.beginPath();
  g.moveTo(x, y - 28);
  g.lineTo(x, y + 28);
  g.stroke();
  g.beginPath();
  g.ellipse(x, y, 16, 10, 0, 0, 7);
  g.stroke();
  g.lineWidth = 3;
  [-1, 1].forEach(function(s) {
    g.beginPath();
    g.moveTo(x + s * 104, y - 14);
    g.lineTo(x + s * 112, y - 14);
    g.lineTo(x + s * 112, y + 14);
    g.lineTo(x + s * 104, y + 14);
    g.stroke();
  });
  x = L.shop.x;
  y = L.shop.y;
  g.fillStyle = "rgba(196,166,118,.55)";
  rr(g, x - 58, y - 46, 116, 56, 14);
  g.fill();
  g.fillStyle = "rgba(150,120,80,.35)";
  for (i = 0; i < 14; i++) {
    g.beginPath();
    g.arc(x + rand(-50, 50), y + rand(-38, 4), rand(1.5, 3), 0, 7);
    g.fill();
  }
  g.fillStyle = "#A87A50";
  [-62, -44, 46, 64].forEach(function(o) {
    g.fillRect(x + o - 2, y - 22, 4, 20);
  });
  g.fillRect(x - 62, y - 14, 20, 2.5);
  g.fillRect(x + 44, y - 14, 20, 2.5);
}

// src/scenes/seaside.js
var G = null;
function shore(x) {
  return G.shoreY + 9 * Math.sin(x / 170 + 0.6) + 5 * Math.sin(x / 73 + 1.3);
}
function pierSpan(y) {
  var P = G.pier, k = (y - P.y0) / (P.y1 - P.y0), cx = P.cx0 + (P.cx1 - P.cx0) * k, hw = P.hw0 + (P.hw1 - P.hw0) * k;
  return [cx - hw, cx + hw];
}
function onPier(x, y, m) {
  var P = G.pier;
  m = m || 0;
  if (y < P.y0 + m * 0.4 || y > P.y1 + 4) return false;
  var s = pierSpan(y);
  return x > s[0] + m && x < s[1] - m;
}
function foot(u) {
  var A2 = G.wall;
  return { x: A2.x0 + (A2.x1 - A2.x0) * u, y: A2.y0 + (A2.y1 - A2.y0) * u };
}
function wallH(u) {
  return 40 - 32 * u;
}
function promW(u) {
  return 84 - 66 * u;
}
function scaleAt(u) {
  return 1 - 0.68 * u;
}
function top(u) {
  var f = foot(u);
  return { x: f.x, y: f.y - wallH(u) };
}
function uTop(y) {
  var A2 = G.wall, y0 = A2.y0 - 40, y1 = A2.y1 - 8;
  return (y0 - y) / (y0 - y1);
}
function uFoot(y) {
  var A2 = G.wall;
  return (A2.y0 - y) / (A2.y0 - A2.y1);
}
function onLand(x, y) {
  return x < foot(uFoot(y)).x + 2;
}
function onProm(x, y, m) {
  m = m || 0;
  var u = uTop(y);
  if (u < 0.02 || u > 0.86) return false;
  var t = top(u);
  return x < t.x - m && x > t.x - promW(u) + m;
}
function layout2(S) {
  var W = S.W, H = S.H, HZ = S.HZ, TOP = S.TOP;
  var shoreY = Math.round(H * 0.585);
  G = { W, H, HZ, TOP, shoreY };
  G.wall = { x0: W * 0.115, y0: H * 0.8, x1: W * 0.345, y1: HZ + 26 };
  var y1 = Math.round(shore(W * 0.79) + 26);
  G.pier = { y0: TOP + 40, y1, cx0: W * 0.752, cx1: W * 0.79, hw0: 54, hw1: 94 };
  G.pool = { x: W * 0.275, y: H * 0.845, rx: Math.min(96, W * 0.075), ry: 26 };
  G.pool2 = { x: W * 0.395, y: H * 0.94, rx: 48, ry: 13 };
  G.rocks = [[0.205, 0.765, 40, 24], [0.365, 0.79, 38, 22], [0.2, 0.965, 50, 26], [0.47, 0.985, 34, 18], [0.33, 0.745, 26, 15]].map(function(b) {
    return { x: W * b[0], y: H * b[1], rx: b[2], ry: b[3] };
  });
  G.chairs = [[0.505, 0.835, "#D9534F"], [0.565, 0.87, "#4F7FBF"], [0.615, 0.815, "#5E9F6A"]].map(function(c) {
    return { x: W * c[0], y: H * c[1], col: c[2] };
  });
  G.breaker = { x0: W * 0.47, x1: W * 0.64, y: H * 0.775 };
  G.castle = { x: W * 0.69, y: H * 0.95 };
  G.lighthouse = { x: W * 0.925, y: HZ - 34 };
  G.shed = { x: W * 0.925, y: H * 0.725 };
  G.slipTop = { x: top(0.3).x - promW(0.3) * 0.3, y: top(0.3).y + 2 };
  G.slipFoot = { x: foot(0.06).x + 30, y: foot(0.06).y + 8 };
  G.lane = { u: 0.36 };
  var lt = top(0.36);
  G.laneMouth = { x: lt.x - promW(0.36) * 0.5, y: lt.y + 1 };
  G.post = { x: lt.x - promW(0.36) - 8, y: lt.y - 4 };
  G.huts = [];
  [[0.05, "#F2B6C1"], [0.13, "#8FB8E0", 7], [0.21, "#F7D774"], [0.45, "#9FD3C7"], [0.51, "#C8B6E2"], [0.565, "#F29E7A"], [0.615, "#F2B6C1"], [0.66, "#F7D774"]].forEach(function(h) {
    var t = top(h[0]), s = scaleAt(h[0]), w = 58 * s;
    G.huts.push({ u: h[0], col: h[1], no: h[2] || 0, s, w, x: t.x - promW(h[0]) - w * 0.55, y: t.y - 1 });
  });
  G.home = G.huts[1];
  var cu = 0.74, ct = top(cu);
  G.chippy = { u: cu, s: scaleAt(cu) * 1.25, x: ct.x - promW(cu) - 34, y: ct.y - 1 };
  var P = G.pier;
  var zones = [G.pool, G.pool2].map(function(p) {
    return { x: p.x, y: p.y, rx: p.rx, ry: p.ry };
  }).concat(
    G.rocks,
    G.chairs.map(function(c) {
      return { x: c.x, y: c.y - 6, rx: 30, ry: 14 };
    }),
    [
      { x: G.castle.x, y: G.castle.y - 6, rx: 34, ry: 16 },
      { x: G.shed.x - 6, y: G.shed.y - 8, rx: 78, ry: 30 },
      { x: (G.breaker.x0 + G.breaker.x1) / 2, y: G.breaker.y, rx: (G.breaker.x1 - G.breaker.x0) / 2, ry: 8 }
    ]
  );
  var beach = {
    w: 3,
    has: function(x, y) {
      return y > shore(x) + 46 && y < H - 40 && x > foot(uFoot(y)).x + 40 && x < W * 0.72;
    },
    pick: function() {
      for (var i = 0; i < 30; i++) {
        var x = rand(W * 0.3, W * 0.72), y = rand(shoreY + 50, H - 44);
        if (beach.has(x, y)) return { x, y };
      }
      return { x: W * 0.52, y: H * 0.76 };
    }
  };
  var deck = {
    w: 2,
    has: function(x, y) {
      return onPier(x, y, 22);
    },
    pick: function() {
      var y = rand(P.y0 + 12, P.y1 - 8), s = pierSpan(y);
      return { x: rand(s[0] + 26, s[1] - 26), y };
    }
  };
  var prom = {
    w: 1.4,
    has: function(x, y) {
      return onProm(x, y, 12);
    },
    pick: function() {
      var u = rand(0.08, 0.5), t = top(u), w = promW(u);
      return { x: t.x - w * rand(0.35, 0.65), y: t.y + 1 };
    }
  };
  var rocks = {
    w: 1.2,
    has: function(x, y) {
      return x > W * 0.17 && x < W * 0.48 && y > H * 0.72 && y < H - 24 && x > foot(uFoot(y)).x + 30;
    },
    pick: function() {
      for (var i = 0; i < 30; i++) {
        var x = rand(W * 0.17, W * 0.48), y = rand(H * 0.72, H - 24);
        if (rocks.has(x, y)) return { x, y };
      }
      return { x: W * 0.33, y: H * 0.9 };
    }
  };
  var sand = {
    has: function(x, y) {
      return y > shore(x) + 40 && y < H - 22 && x > foot(uFoot(y)).x + 30 && x < W - 30;
    },
    pick: function() {
      for (var i = 0; i < 30; i++) {
        var x = rand(W * 0.2, W - 30), y = rand(shoreY + 44, H - 22);
        if (sand.has(x, y)) return { x, y };
      }
      return { x: W * 0.52, y: H * 0.8 };
    }
  };
  return {
    lay: {
      pier: P,
      pool: G.pool,
      // the School tag hangs over the fingerpost at the lane's mouth
      school: { x: G.post.x, y: G.post.y, tag: G.post.y - 66, cut: [G.post.x - 120, G.post.y - 130, 240, 170] }
    },
    zones,
    water: G.pool,
    patch: [beach, deck, prom, rocks],
    roam: [sand],
    home: { x: W * 0.52, y: H * 0.74 },
    // up the slipway, along the promenade, and off up the lane to town
    exit: { x: G.laneMouth.x, y: G.laneMouth.y, off: { x: -60, y: G.laneMouth.y - 16 } }
  };
}
function bake2(g, S) {
  var L = layout2(S), W = S.W, H = S.H, HZ = S.HZ, i, x, y;
  S.place(L);
  var sky = g.createLinearGradient(0, 0, 0, HZ);
  sky.addColorStop(0, "#B4CAD6");
  sky.addColorStop(0.7, "#D5DEDF");
  sky.addColorStop(1, "#E4E7E1");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, HZ + 2);
  for (i = 0; i < 26; i++) {
    x = i / 25 * W * 1.1 - W * 0.05;
    y = HZ - 12 - Math.abs(Math.sin(i * 1.7)) * 16;
    g.fillStyle = i % 3 ? "rgba(214,221,224,.55)" : "rgba(196,205,212,.45)";
    g.beginPath();
    g.ellipse(x, y, 60 + i % 4 * 18, 14 + i % 3 * 5, 0, 0, 7);
    g.fill();
  }
  g.fillStyle = "rgba(120,146,148,.45)";
  g.beginPath();
  g.moveTo(W * 0.42, HZ);
  g.quadraticCurveTo(W * 0.47, HZ - 13, W * 0.51, HZ - 8);
  g.quadraticCurveTo(W * 0.54, HZ - 11, W * 0.58, HZ);
  g.closePath();
  g.fill();
  cliffs(g);
  var sea = g.createLinearGradient(0, HZ, 0, G.shoreY + 20);
  sea.addColorStop(0, "#9DB8B1");
  sea.addColorStop(0.3, "#79A29A");
  sea.addColorStop(0.8, "#7FAE9F");
  sea.addColorStop(1, "#A6C9B5");
  g.fillStyle = sea;
  g.fillRect(0, HZ, W, G.shoreY + 30 - HZ);
  g.fillStyle = "rgba(255,255,255,.45)";
  g.fillRect(0, HZ, W, 1.5);
  g.fillStyle = "rgba(255,255,255,.08)";
  for (i = 0; i < 9; i++) g.fillRect(0, HZ + 14 + i * i * 3.4, W, 1.2);
  var sand = g.createLinearGradient(0, G.shoreY, 0, H);
  sand.addColorStop(0, "#CDBE98");
  sand.addColorStop(0.12, "#E3D5B1");
  sand.addColorStop(1, "#E0CFA6");
  g.fillStyle = sand;
  g.beginPath();
  g.moveTo(0, H);
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(150,135,100,.2)";
  g.beginPath();
  g.moveTo(0, H);
  for (x = 0; x <= W; x += 16) g.lineTo(x, shore(x));
  for (x = W; x >= 0; x -= 16) g.lineTo(x, shore(x) + 26 + 6 * Math.sin(x / 50));
  g.closePath();
  g.fill();
  for (i = 0; i < 70; i++) {
    x = rand(0, W);
    y = rand(G.shoreY + 30, H);
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.08)" : "rgba(130,110,70,.06)";
    g.beginPath();
    g.ellipse(x, y, rand(30, 100), rand(8, 24), 0, 0, 7);
    g.fill();
  }
  for (x = 10; x < W; x += rand(8, 40)) {
    y = shore(x) + 38 + 6 * Math.sin(x / 60) + rand(-4, 4);
    if (onPier(x, y) || onLand(x, y) || Math.sin(x / 90) < -0.3) continue;
    g.fillStyle = pick(["#6E7F52", "#5E6F48", "#7A6E58"]);
    g.beginPath();
    g.ellipse(x, y, rand(3, 7), rand(1.2, 2.4), rand(-0.4, 0.4), 0, 7);
    g.fill();
  }
  for (i = 0; i < 60; i++) {
    x = rand(0, W);
    y = rand(G.shoreY + 50, H - 6);
    if (S.inZone(x, y, 12) || onPier(x, y) || onLand(x, y)) continue;
    if (Math.random() < 0.35) {
      g.fillStyle = pick(["#FFF6EA", "#F2DCD0", "#EFE4D2"]);
      g.beginPath();
      g.arc(x, y, 3.2, Math.PI, 0);
      g.fill();
      g.strokeStyle = "rgba(150,120,100,.6)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x - 1.6, y - 2.6);
      g.moveTo(x, y);
      g.lineTo(x + 1.6, y - 2.6);
      g.stroke();
    } else {
      g.fillStyle = pick(["#ABA79F", "#98958E", "#BDB8AE", "#8E8A86"]);
      g.beginPath();
      g.ellipse(x, y, rand(2, 4.5), rand(1.4, 2.8), 0, 0, 7);
      g.fill();
    }
  }
  land(g, S);
  rockPools(g, S);
  pier(g);
  boatShed(g);
  beachThings(g);
}
function cliffs(g) {
  var W = G.W, HZ = G.HZ, lh = G.lighthouse, x0 = W * 0.8;
  g.fillStyle = "#93B486";
  g.beginPath();
  g.moveTo(x0 - 10, HZ + 1);
  g.quadraticCurveTo(W * 0.86, HZ - 40, lh.x - 34, HZ - 36);
  g.lineTo(W + 10, HZ - 44);
  g.lineTo(W + 10, HZ + 1);
  g.closePath();
  g.fill();
  g.fillStyle = "#F1EEE4";
  g.beginPath();
  g.moveTo(x0, HZ + 1);
  g.quadraticCurveTo(W * 0.86, HZ - 32, lh.x - 34, HZ - 30);
  g.lineTo(W + 10, HZ - 37);
  g.lineTo(W + 10, HZ + 1);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(150,150,140,.45)";
  g.lineWidth = 1.2;
  for (var i = 0; i < 16; i++) {
    var x = x0 + 30 + i * (W - x0 - 20) / 16;
    g.beginPath();
    g.moveTo(x, HZ - 22 + Math.abs(x - W * 0.9) * 0.05);
    g.lineTo(x - 3, HZ - 2);
    g.stroke();
  }
  g.fillStyle = "rgba(120,140,140,.35)";
  g.fillRect(x0, HZ - 3, W - x0, 3);
  lighthouse(g, lh.x, lh.y);
}
function lighthouse(g, x, y) {
  rimmed(g, "#9A9AA3", "#F7F5EF", 1.5, function(e) {
    g.beginPath();
    g.moveTo(x - 11 - e, y + e);
    g.lineTo(x - 7 - e, y - 56 - e);
    g.lineTo(x + 7 + e, y - 56 - e);
    g.lineTo(x + 11 + e, y + e);
    g.closePath();
    g.fill();
  });
  g.fillStyle = "#D9534F";
  [[-10.3, -9.4, -14, -24], [-8.8, -7.9, -36, -46]].forEach(function(b) {
    g.beginPath();
    g.moveTo(x + b[0], y + b[2] + 10);
    g.lineTo(x + b[1], y + b[3] + 10);
    g.lineTo(x - b[1], y + b[3] + 10);
    g.lineTo(x - b[0], y + b[2] + 10);
    g.closePath();
    g.fill();
  });
  g.fillStyle = "#3E4A5A";
  g.fillRect(x - 9, y - 60, 18, 4);
  g.fillStyle = "#FFE9A6";
  g.fillRect(x - 6, y - 70, 12, 10);
  g.fillStyle = "#3E4A5A";
  g.beginPath();
  g.moveTo(x - 9, y - 70);
  g.lineTo(x, y - 80);
  g.lineTo(x + 9, y - 70);
  g.closePath();
  g.fill();
  g.fillStyle = "#F4F2EC";
  g.fillRect(x + 12, y - 10, 16, 10);
  g.fillStyle = "#3E4A5A";
  g.fillRect(x + 11, y - 13, 18, 3);
}
function land(g, S) {
  var W = G.W, HZ = G.HZ, A2 = G.wall, i, u, t, f;
  var far = top(1), nearFoot = foot(-0.6);
  g.fillStyle = "#A9C39C";
  g.beginPath();
  g.moveTo(nearFoot.x, nearFoot.y);
  g.lineTo(A2.x1 + 2, A2.y1);
  g.lineTo(A2.x1 + 2, HZ - 2);
  g.quadraticCurveTo(W * 0.18, HZ - 22, -10, HZ - 10);
  g.closePath();
  g.fill();
  var gr = g.createLinearGradient(0, HZ - 30, 0, G.H);
  gr.addColorStop(0, "rgba(255,255,255,.12)");
  gr.addColorStop(1, "rgba(60,90,50,.12)");
  g.fillStyle = gr;
  g.fill();
  var cols = ["#E8D9C0", "#C9DCE6", "#F0C9B4", "#E6E1A8", "#D8C8E0", "#F4EEE4", "#BFD7C7"];
  for (i = 0; i < 9; i++) {
    var hx = 2 + i * 29, hy = HZ + 12 + i * i * 0.9, hw = 28, hh = 24 - i;
    g.fillStyle = cols[i % cols.length];
    g.fillRect(hx, hy - hh, hw, hh + 12);
    g.fillStyle = i % 2 ? "#7A6A68" : "#8C5E52";
    g.beginPath();
    g.moveTo(hx - 2, hy - hh + 1);
    g.lineTo(hx + hw / 2, hy - hh - 10);
    g.lineTo(hx + hw + 2, hy - hh + 1);
    g.closePath();
    g.fill();
    g.fillStyle = "#5C6A78";
    g.fillRect(hx + 6, hy - hh + 7, 5, 6);
    g.fillRect(hx + 17, hy - hh + 7, 5, 6);
    g.fillStyle = "#8C5E52";
    g.fillRect(hx + hw - 8, hy - hh - 12, 4, 7);
  }
  g.fillStyle = "#EDE6D8";
  g.fillRect(W * 0.2, HZ - 14, 12, 28);
  g.fillStyle = "#6E6A72";
  g.beginPath();
  g.moveTo(W * 0.2 - 2, HZ - 14);
  g.lineTo(W * 0.2 + 6, HZ - 36);
  g.lineTo(W * 0.2 + 14, HZ - 14);
  g.closePath();
  g.fill();
  var lm = G.laneMouth, lw = 13;
  g.fillStyle = "#CBBFA6";
  g.beginPath();
  g.moveTo(lm.x + 16, lm.y - lw);
  g.lineTo(-12, lm.y - 16 - lw * 0.9);
  g.lineTo(-12, lm.y - 16 + lw * 0.9);
  g.lineTo(lm.x + 16, lm.y + 4);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.5)";
  g.lineWidth = 1.2;
  g.setLineDash([6, 6]);
  g.beginPath();
  g.moveTo(lm.x, lm.y - lw * 0.45);
  g.lineTo(-12, lm.y - 16);
  g.stroke();
  g.setLineDash([]);
  var nearT = top(-0.6);
  g.fillStyle = "#DCD2BE";
  g.beginPath();
  g.moveTo(nearT.x, nearT.y);
  for (u = -0.6; u <= 1.001; u += 0.05) {
    t = top(u);
    g.lineTo(t.x, t.y);
  }
  for (u = 1; u >= -0.601; u -= 0.05) {
    t = top(u);
    g.lineTo(t.x - promW(u), t.y);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(150,135,110,.35)";
  g.lineWidth = 1;
  for (u = -0.6; u < 1; u += 0.035) {
    t = top(u);
    g.beginPath();
    g.moveTo(t.x, t.y);
    g.lineTo(t.x - promW(u), t.y);
    g.stroke();
  }
  g.fillStyle = "#C2B69D";
  g.beginPath();
  for (u = -0.6; u <= 1.001; u += 0.05) {
    t = top(u);
    if (u === -0.6) g.moveTo(t.x - promW(u), t.y);
    else g.lineTo(t.x - promW(u), t.y);
  }
  for (u = 1; u >= -0.601; u -= 0.05) {
    t = top(u);
    g.lineTo(t.x - promW(u) + 4 * scaleAt(u), t.y + 2 * scaleAt(u));
  }
  g.closePath();
  g.fill();
  g.fillStyle = "#A39B8B";
  g.beginPath();
  t = top(-0.6);
  g.moveTo(t.x, t.y);
  for (u = -0.6; u <= 1.001; u += 0.05) {
    t = top(u);
    g.lineTo(t.x, t.y);
  }
  for (u = 1; u >= -0.601; u -= 0.05) {
    f = foot(u);
    g.lineTo(f.x, f.y);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(110,100,85,.35)";
  g.lineWidth = 1;
  [0.33, 0.66].forEach(function(k2) {
    g.beginPath();
    for (var uu = -0.6; uu <= 1.001; uu += 0.05) {
      var ff = foot(uu), yy = ff.y - wallH(uu) * k2;
      if (uu === -0.6) g.moveTo(ff.x, yy);
      else g.lineTo(ff.x, yy);
    }
    g.stroke();
  });
  for (u = -0.6; u < 1; u += 0.045) {
    f = foot(u);
    var hh = wallH(u), off = Math.round(u / 0.045) % 2 * 0.33;
    g.beginPath();
    g.moveTo(f.x + 3, f.y - hh * off);
    g.lineTo(f.x + 3, f.y - hh * (off + 0.33));
    g.stroke();
  }
  g.fillStyle = "rgba(70,90,70,.35)";
  g.beginPath();
  for (u = -0.6; u <= 1.001; u += 0.05) {
    f = foot(u);
    if (u === -0.6) g.moveTo(f.x, f.y);
    else g.lineTo(f.x, f.y);
  }
  for (u = 1; u >= -0.601; u -= 0.05) {
    f = foot(u);
    g.lineTo(f.x, f.y - wallH(u) * 0.18);
  }
  g.closePath();
  g.fill();
  g.fillStyle = "#E6E0D2";
  g.beginPath();
  t = top(-0.6);
  g.moveTo(t.x, t.y);
  for (u = -0.6; u <= 1.001; u += 0.05) {
    t = top(u);
    g.lineTo(t.x + 1, t.y);
  }
  for (u = 1; u >= -0.601; u -= 0.05) {
    t = top(u);
    g.lineTo(t.x + 1, t.y + 4 * scaleAt(u));
  }
  g.closePath();
  g.fill();
  var st = G.slipTop, sf = G.slipFoot, t3 = top(0.33), f0 = foot(0.03);
  var w3 = 16;
  g.fillStyle = "#C8BEA8";
  g.beginPath();
  g.moveTo(t3.x + 1, t3.y + 1);
  g.lineTo(f0.x + 1, f0.y - 2);
  g.lineTo(f0.x + w3 + 4, f0.y + 2);
  g.lineTo(t3.x + w3, t3.y + 6);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(120,105,80,.4)";
  g.lineWidth = 1;
  for (i = 1; i < 10; i++) {
    var k = i / 10;
    g.beginPath();
    g.moveTo(t3.x + 1 + (f0.x - t3.x) * k, t3.y + 1 + (f0.y - 3 - t3.y) * k);
    g.lineTo(t3.x + w3 + (f0.x + 4 - t3.x) * k, t3.y + 6 + (f0.y - 4 - t3.y) * k);
    g.stroke();
  }
  void sf;
  void st;
  chippy(g);
  G.huts.slice().sort(function(a, b) {
    return a.y - b.y;
  }).forEach(function(h) {
    hut(g, h);
  });
  fingerpost(g, G.post.x, G.post.y);
  g.strokeStyle = "#5F9A93";
  g.lineCap = "round";
  var rails = [[-0.6, 0.27], [0.34, 0.97]];
  rails.forEach(function(r) {
    for (u = r[0]; u <= r[1]; u += 0.018) {
      t = top(u);
      var s = scaleAt(u);
      g.lineWidth = 1 + s;
      g.beginPath();
      g.moveTo(t.x - 1, t.y + 1);
      g.lineTo(t.x - 1, t.y - 13 * s);
      g.stroke();
    }
    g.lineWidth = 2.2;
    g.beginPath();
    for (u = r[0]; u <= r[1] + 1e-3; u += 0.03) {
      t = top(u);
      var s2 = scaleAt(u);
      if (u === r[0]) g.moveTo(t.x - 1, t.y - 13 * s2);
      else g.lineTo(t.x - 1, t.y - 13 * s2);
    }
    g.stroke();
  });
  G.promLamps = [];
  [0.02, 0.24, 0.48, 0.64, 0.82].forEach(function(uu) {
    var tt = top(uu), s = scaleAt(uu), hgt = 58 * s;
    g.strokeStyle = "#4E7F7A";
    g.lineWidth = 2 + s;
    g.beginPath();
    g.moveTo(tt.x - 3, tt.y);
    g.lineTo(tt.x - 3, tt.y - hgt);
    g.stroke();
    g.beginPath();
    g.moveTo(tt.x - 3, tt.y - hgt);
    g.quadraticCurveTo(tt.x - 3, tt.y - hgt - 6 * s, tt.x + 5 * s, tt.y - hgt - 4 * s);
    g.stroke();
    g.fillStyle = "#FFF1B8";
    rr(g, tt.x + 2 * s, tt.y - hgt - 4 * s, 7 * s, 8 * s, 2);
    g.fill();
    G.promLamps.push({ x: tt.x + 5.5 * s, y: tt.y - hgt + 0.5 * s, k: s });
  });
  void S;
}
function hut(g, h) {
  var s = h.s, w = h.w, x = h.x, y = h.y, bh = 54 * s, rh = 17 * s;
  g.fillStyle = "rgba(90,80,60,.22)";
  g.fillRect(x - w / 2 + 2, y - 2, w + 4, 4);
  rimmed(g, "rgba(70,60,60,.55)", h.col, 1.2, function(e) {
    g.fillRect(x - w / 2 - e, y - bh - e, w + 2 * e, bh + 2 * e);
  });
  g.fillStyle = "rgba(255,255,255,.28)";
  for (var i = 1; i < 6; i++) g.fillRect(x - w / 2, y - bh + i * bh / 6, w, 0.9);
  g.fillStyle = "#FBF7EE";
  g.beginPath();
  g.moveTo(x - w / 2 - 3 * s, y - bh + 1);
  g.lineTo(x, y - bh - rh);
  g.lineTo(x + w / 2 + 3 * s, y - bh + 1);
  g.closePath();
  g.fill();
  g.fillStyle = h.no ? "#3E6E9E" : "#7A6A68";
  g.beginPath();
  g.moveTo(x - w / 2 - 1 * s, y - bh);
  g.lineTo(x, y - bh - rh + 3 * s);
  g.lineTo(x + w / 2 + 1 * s, y - bh);
  g.closePath();
  g.fill();
  g.fillStyle = "#FBF7EE";
  g.fillRect(x - w * 0.26, y - bh * 0.78, w * 0.52, bh * 0.78);
  g.fillStyle = h.col;
  g.fillRect(x - w * 0.22, y - bh * 0.72, w * 0.2, bh * 0.72);
  g.fillRect(x + w * 0.02, y - bh * 0.72, w * 0.2, bh * 0.72);
  g.fillStyle = "rgba(255,255,255,.4)";
  g.fillRect(x - w * 0.01, y - bh * 0.72, w * 0.02, bh * 0.72);
  if (h.no) {
    g.fillStyle = "#FBF7EE";
    g.beginPath();
    g.arc(x, y - bh - rh * 0.35, 4.6 * s, 0, 7);
    g.fill();
    g.fillStyle = "#3E4A5A";
    g.font = "600 " + Math.round(8 * s) + "px Fredoka";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(h.no), x, y - bh - rh * 0.35 + 0.5);
    g.strokeStyle = "#6B5440";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, y - bh - rh);
    g.lineTo(x, y - bh - rh - 18 * s);
    g.stroke();
    g.fillStyle = "#D9534F";
    g.beginPath();
    g.moveTo(x, y - bh - rh - 18 * s);
    g.lineTo(x + 11 * s, y - bh - rh - 15 * s);
    g.lineTo(x, y - bh - rh - 12 * s);
    g.closePath();
    g.fill();
    var bc = ["#D9534F", "#FBF7EE", "#3E6E9E", "#F7D774"];
    for (i = 0; i < 6; i++) {
      var bx = x - w / 2 + (i + 0.5) * w / 6, by = y - bh + 2 + Math.sin((i + 0.5) / 6 * Math.PI) * 3;
      g.fillStyle = bc[i % 4];
      g.beginPath();
      g.moveTo(bx - 2.5 * s, by);
      g.lineTo(bx + 2.5 * s, by);
      g.lineTo(bx, by + 5 * s);
      g.closePath();
      g.fill();
    }
    g.fillStyle = "#E86A5B";
    rr(g, x + w / 2 + 2, y - 10 * s, 8 * s, 10 * s, 2);
    g.fill();
  }
}
function chippy(g) {
  var c = G.chippy, s = c.s, x = c.x, y = c.y, w = 64 * s, bh = 40 * s;
  rimmed(g, "rgba(70,60,60,.5)", "#F4F1E8", 1.2, function(e) {
    g.fillRect(x - w / 2 - e, y - bh - e, w + 2 * e, bh + 2 * e);
  });
  g.fillStyle = "#3E6E9E";
  g.fillRect(x - w / 2 - 2, y - bh - 12 * s, w + 4, 12 * s);
  g.fillStyle = "#FBF7EE";
  g.font = "600 " + Math.max(6, Math.round(7.5 * s)) + "px Fredoka";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("FISH & CHIPS", x, y - bh - 6 * s + 0.5);
  for (var i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "#FBF7EE" : "#3E6E9E";
    g.fillRect(x - w / 2 + i * w / 6, y - bh, w / 6, 5 * s);
    g.beginPath();
    g.arc(x - w / 2 + (i + 0.5) * w / 6, y - bh + 5 * s, w / 12, 0, Math.PI);
    g.fill();
  }
  g.fillStyle = "#FFE29A";
  g.fillRect(x - w * 0.42, y - bh * 0.62, w * 0.5, bh * 0.42);
  g.fillStyle = "#6B4A3A";
  g.fillRect(x + w * 0.16, y - bh * 0.7, w * 0.22, bh * 0.7);
  g.fillStyle = "#9A9AA3";
  g.fillRect(x + w * 0.3, y - bh - 22 * s, 5 * s, 12 * s);
  G.chipLight = { x: x - w * 0.17, y: y - bh * 0.41, w: w * 0.5, h: bh * 0.42 };
}
function fingerpost(g, x, y) {
  g.fillStyle = "rgba(90,80,60,.25)";
  g.beginPath();
  g.ellipse(x, y, 9, 3, 0, 0, 7);
  g.fill();
  g.fillStyle = "#F4F1E8";
  g.fillRect(x - 2, y - 52, 4, 52);
  g.fillStyle = "#F4F1E8";
  g.strokeStyle = "#3E4A5A";
  g.lineWidth = 1;
  [[-1, -46, "School"], [-1, -34, "Town"], [1, -40, "Pier"]].forEach(function(a) {
    var d = a[0], yy = y + a[1], w = 38;
    g.beginPath();
    g.moveTo(x, yy - 5);
    g.lineTo(x + d * (w - 6), yy - 5);
    g.lineTo(x + d * w, yy);
    g.lineTo(x + d * (w - 6), yy + 5);
    g.lineTo(x, yy + 5);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#3E4A5A";
    g.font = "600 8px Fredoka";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(a[2], x + d * (w - 4) / 2, yy + 0.5);
    g.fillStyle = "#F4F1E8";
  });
  g.fillStyle = "#3E4A5A";
  g.beginPath();
  g.arc(x, y - 53, 3, 0, 7);
  g.fill();
}
function rockPools(g, S) {
  var i, x, y;
  var slabs = [
    [0.275, 0.86, 128, 44],
    [0.2, 0.9, 60, 34],
    [0.39, 0.91, 80, 34],
    [0.255, 0.965, 84, 28],
    [0.33, 0.975, 62, 22],
    [0.45, 0.955, 46, 20],
    [0.3, 0.79, 80, 22]
  ];
  slabs.forEach(function(s) {
    var x0 = G.W * s[0], y0 = G.H * s[1];
    g.fillStyle = "rgba(70,70,60,.25)";
    g.beginPath();
    g.ellipse(x0 + 4, y0 + 6, s[2] + 4, s[3] + 3, 0, 0, 7);
    g.fill();
    g.fillStyle = "#6E6C66";
    g.beginPath();
    g.ellipse(x0, y0 + 3, s[2], s[3], 0, 0, 7);
    g.fill();
    g.fillStyle = "#9C9890";
    g.beginPath();
    g.ellipse(x0, y0 - 2, s[2] - 4, s[3] - 5, 0, 0, 7);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.12)";
    g.beginPath();
    g.ellipse(x0 - s[2] * 0.25, y0 - s[3] * 0.35, s[2] * 0.45, s[3] * 0.3, 0, 0, 7);
    g.fill();
  });
  for (i = 0; i < 80; i++) {
    x = G.W * 0.3 + rand(-200, 220);
    y = G.H * 0.9 + rand(-100, 80);
    var inside = slabs.some(function(s) {
      var dx = (x - G.W * s[0]) / (s[2] - 8), dy = (y - G.H * s[1]) / (s[3] - 8);
      return dx * dx + dy * dy < 1;
    });
    if (!inside) continue;
    var r0 = Math.random();
    g.fillStyle = r0 < 0.45 ? "rgba(70,66,60,.3)" : r0 < 0.75 ? "rgba(200,190,120,.45)" : "rgba(240,236,226,.6)";
    g.beginPath();
    g.ellipse(x, y, rand(1.5, 7), rand(1, 2.6), rand(-0.5, 0.5), 0, 7);
    g.fill();
  }
  [G.pool, G.pool2].forEach(function(p, n) {
    g.fillStyle = "#5E5C56";
    g.beginPath();
    g.ellipse(p.x, p.y, p.rx + 7, p.ry + 6, 0, 0, 7);
    g.fill();
    var pg = g.createLinearGradient(0, p.y - p.ry, 0, p.y + p.ry);
    pg.addColorStop(0, "#5E9590");
    pg.addColorStop(1, "#8FBFB2");
    g.fillStyle = pg;
    g.beginPath();
    g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)";
    g.lineWidth = 2;
    g.lineCap = "round";
    g.beginPath();
    g.ellipse(p.x - p.rx * 0.25, p.y - p.ry * 0.35, p.rx * 0.4, p.ry * 0.25, 0, 3.6, 5.2);
    g.stroke();
    if (n === 0) {
      g.fillStyle = "#4F7A50";
      [[-0.6, 0.3], [-0.45, 0.45], [0.55, 0.4]].forEach(function(q) {
        g.beginPath();
        g.ellipse(p.x + p.rx * q[0], p.y + p.ry * q[1], 9, 3.5, 0.4, 0, 7);
        g.fill();
      });
      g.fillStyle = "#C9506E";
      for (var a = 0; a < 7; a++) {
        g.beginPath();
        g.arc(p.x + p.rx * 0.35 + Math.cos(a) * 5, p.y + p.ry * 0.25 + Math.sin(a) * 3, 2.4, 0, 7);
        g.fill();
      }
      star(g, p.x - p.rx * 0.15, p.y + p.ry * 0.4, 7, "#E0874A");
    }
  });
  G.rocks.forEach(function(b) {
    rimmed(g, "#55524C", "#8A867D", 2, function(e) {
      g.beginPath();
      g.ellipse(b.x, b.y - b.ry * 0.35, b.rx + e, b.ry + e, 0, 0, 7);
      g.fill();
    });
    g.fillStyle = "rgba(255,255,255,.16)";
    g.beginPath();
    g.ellipse(b.x - b.rx * 0.3, b.y - b.ry * 0.75, b.rx * 0.45, b.ry * 0.3, -0.2, 0, 7);
    g.fill();
    g.fillStyle = "#5A7F48";
    for (var k = 0; k < 5; k++) {
      g.beginPath();
      g.ellipse(b.x - b.rx * 0.8 + k * b.rx * 0.4, b.y + b.ry * 0.45, 7, 3, rand(-0.5, 0.5), 0, 7);
      g.fill();
    }
    g.fillStyle = "#3A3846";
    for (k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(b.x + rand(-b.rx, b.rx) * 0.6, b.y + rand(-b.ry, b.ry) * 0.2, 3, 2, 0.5, 0, 7);
      g.fill();
    }
  });
  star(g, G.W * 0.43, G.H * 0.83, 6, "#D9534F");
  void S;
}
function star(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_);
  }
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,255,255,.4)";
  g.beginPath();
  g.arc(x - r * 0.15, y - r * 0.15, r * 0.18, 0, 7);
  g.fill();
}
function pier(g) {
  var P = G.pier, i, y, s, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
  function legs(x, yTop, len2, w2) {
    g.fillStyle = "#4E5A5E";
    g.fillRect(x - w2 / 2, yTop, w2, len2);
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.ellipse(x, yTop + len2, w2 * 1.3, w2 * 0.35, 0, 0, 7);
    g.fill();
  }
  for (i = 0; i <= 5; i++) legs(s0[0] + 6 + (s0[1] - s0[0] - 12) * i / 5, P.y0 + 4, 22, 4);
  for (y = P.y0 + 30; y < P.y1 - 10; y += 34) {
    var k = (y - P.y0) / (P.y1 - P.y0), len = 14 + 14 * k, w = 4 + 2 * k;
    s = pierSpan(y);
    if (y < shore(s[0]) - 4) legs(s[0] + 2, y, Math.min(len, shore(s[0]) - y), w);
    if (y < shore(s[1]) - 4) legs(s[1] - 2, y, Math.min(len, shore(s[1]) - y), w);
    g.strokeStyle = "rgba(78,90,94,.6)";
    g.lineWidth = 1.2;
    if (y < shore(s[0]) - 10) {
      g.beginPath();
      g.moveTo(s[0] + 2, y + 2);
      g.lineTo(s[0] + 2, y + Math.min(len, shore(s[0]) - y) * 0.8);
      g.stroke();
    }
  }
  g.fillStyle = "#6E5A48";
  g.beginPath();
  g.moveTo(s0[0] - 2, P.y0 + 6);
  g.lineTo(s0[1] + 2, P.y0 + 6);
  g.lineTo(s1[1] + 3, P.y1 + 8);
  g.lineTo(s1[0] - 3, P.y1 + 8);
  g.closePath();
  g.fill();
  var dg = g.createLinearGradient(0, P.y0, 0, P.y1);
  dg.addColorStop(0, "#B8987A");
  dg.addColorStop(1, "#CDAE88");
  g.fillStyle = dg;
  g.beginPath();
  g.moveTo(s0[0], P.y0);
  g.lineTo(s0[1], P.y0);
  g.lineTo(s1[1], P.y1);
  g.lineTo(s1[0], P.y1);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(110,86,60,.45)";
  g.lineWidth = 1.2;
  for (i = 1; i < 22; i++) {
    y = P.y0 + (P.y1 - P.y0) * Math.pow(i / 22, 1.25);
    s = pierSpan(y);
    g.beginPath();
    g.moveTo(s[0], y);
    g.lineTo(s[1], y);
    g.stroke();
  }
  [0, 1].forEach(function(side) {
    g.strokeStyle = "#F7F4EE";
    g.lineCap = "round";
    var ys = [];
    for (y = P.y0 + 2; y <= P.y1; y += 16) ys.push(y);
    ys.forEach(function(y2) {
      var k2 = (y2 - P.y0) / (P.y1 - P.y0), h = 14 + 10 * k2, x = pierSpan(y2)[side];
      g.lineWidth = 1.6 + k2;
      g.beginPath();
      g.moveTo(x, y2);
      g.lineTo(x, y2 - h);
      g.stroke();
    });
    g.lineWidth = 2.4;
    g.beginPath();
    ys.forEach(function(y2, n) {
      var k2 = (y2 - P.y0) / (P.y1 - P.y0), h = 14 + 10 * k2, x = pierSpan(y2)[side];
      if (n) g.lineTo(x, y2 - h);
      else g.moveTo(x, y2 - h);
    });
    g.stroke();
  });
  var by = P.y0 + (P.y1 - P.y0) * 0.55, bx = pierSpan(by)[0];
  g.strokeStyle = "#E86A5B";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(bx, by - 12, 7, 0, 7);
  g.stroke();
  g.strokeStyle = "#FFFFFF";
  g.lineWidth = 4;
  [0.4, 2, 3.6, 5.2].forEach(function(a) {
    g.beginPath();
    g.arc(bx, by - 12, 7, a, a + 0.5);
    g.stroke();
  });
  G.lamps = [];
  [0.3, 0.6, 0.92].forEach(function(f) {
    [0, 1].forEach(function(side) {
      var y2 = P.y0 + (P.y1 - P.y0) * f, k2 = f, x = pierSpan(y2)[side], h = 34 + 22 * k2;
      g.strokeStyle = "#3E6E78";
      g.lineWidth = 2 + k2;
      g.beginPath();
      g.moveTo(x, y2);
      g.lineTo(x, y2 - h);
      g.stroke();
      g.fillStyle = "#3E6E78";
      g.fillRect(x - 4 - k2, y2 - h - 2, 8 + 2 * k2, 3);
      g.fillStyle = "#FFF1B8";
      rr(g, x - 3 - k2, y2 - h - 10 - 2 * k2, 6 + 2 * k2, 8 + 2 * k2, 2);
      g.fill();
      G.lamps.push({ x, y: y2 - h - 6 - k2, k: k2 });
    });
  });
  var kx = (s0[0] + s0[1]) / 2, ky = P.y0 + 8, pw = 116, ph = 50;
  G.pav = { x: kx, y: ky, w: pw, h: ph };
  rimmed(g, "#8C8A84", "#F4F1E8", 1.5, function(e) {
    g.fillRect(kx - pw / 2 - e, ky - ph - e, pw + 2 * e, ph + 2 * e);
  });
  g.fillStyle = "#3F4A50";
  rr(g, kx - 34, ky - ph + 12, 68, ph - 12, 6);
  g.fill();
  g.fillStyle = "#B8987A";
  g.fillRect(kx - 34, ky - 8, 68, 8);
  g.fillStyle = "#F4F1E8";
  [-34, 30].forEach(function(o) {
    g.fillRect(kx + o, ky - ph + 12, 4, ph - 12);
  });
  [-50, 38].forEach(function(o) {
    g.fillStyle = "#FFE29A";
    rr(g, kx + o, ky - ph + 16, 12, 16, 5);
    g.fill();
  });
  g.fillStyle = "#D9534F";
  g.fillRect(kx - pw / 2 - 4, ky - ph - 6, pw + 8, 7);
  rimmed(g, "#4F8A78", "#7FB8A4", 1.5, function(e) {
    g.beginPath();
    g.ellipse(kx, ky - ph - 6, 44 + e, 30 + e, 0, Math.PI, 0);
    g.fill();
  });
  g.fillStyle = "rgba(255,255,255,.25)";
  g.beginPath();
  g.ellipse(kx - 14, ky - ph - 22, 10, 6, -0.5, 0, 7);
  g.fill();
  g.strokeStyle = "#4F8A78";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(kx, ky - ph - 36);
  g.lineTo(kx, ky - ph - 52);
  g.stroke();
  g.fillStyle = "#D9534F";
  g.beginPath();
  g.moveTo(kx, ky - ph - 52);
  g.lineTo(kx + 13, ky - ph - 48);
  g.lineTo(kx, ky - ph - 44);
  g.closePath();
  g.fill();
  [-1, 1].forEach(function(d) {
    var tx = kx + d * (pw / 2 - 6);
    rimmed(g, "#4F8A78", "#7FB8A4", 1.2, function(e) {
      g.beginPath();
      g.ellipse(tx, ky - ph - 6, 9 + e, 12 + e, 0, Math.PI, 0);
      g.fill();
    });
    g.strokeStyle = "#4F8A78";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(tx, ky - ph - 18);
    g.lineTo(tx, ky - ph - 26);
    g.stroke();
  });
  var l0 = G.lamps[0], l1 = G.lamps[1], bc = ["#D9534F", "#FBF7EE", "#3E6E9E", "#F7D774"];
  [[kx - pw / 2, ky - ph - 4, l0.x, l0.y + 6], [kx + pw / 2, ky - ph - 4, l1.x, l1.y + 6]].forEach(function(b) {
    g.strokeStyle = "rgba(90,90,90,.6)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(b[0], b[1]);
    g.quadraticCurveTo((b[0] + b[2]) / 2, Math.max(b[1], b[3]) + 10, b[2], b[3]);
    g.stroke();
    for (var n = 1; n < 8; n++) {
      var tq = n / 8, qx = (1 - tq) * (1 - tq) * b[0] + 2 * tq * (1 - tq) * (b[0] + b[2]) / 2 + tq * tq * b[2], qy = (1 - tq) * (1 - tq) * b[1] + 2 * tq * (1 - tq) * (Math.max(b[1], b[3]) + 10) + tq * tq * b[3];
      g.fillStyle = bc[n % 4];
      g.beginPath();
      g.moveTo(qx - 2.5, qy);
      g.lineTo(qx + 2.5, qy);
      g.lineTo(qx, qy + 5);
      g.closePath();
      g.fill();
    }
  });
}
function boatShed(g) {
  var x = G.shed.x, y = G.shed.y, w = 64, h = 92;
  g.fillStyle = "rgba(80,70,50,.25)";
  g.beginPath();
  g.ellipse(x - 8, y + 2, 76, 12, 0, 0, 7);
  g.fill();
  rimmed(g, "#1F2328", "#33383E", 1.5, function(e) {
    g.fillRect(x - w / 2 - e, y - h - e, w + 2 * e, h + 2 * e);
  });
  g.fillStyle = "rgba(255,255,255,.07)";
  for (var i = 1; i < 12; i++) g.fillRect(x - w / 2, y - h + i * h / 12, w, 1);
  rimmed(g, "#1F2328", "#2A2E33", 1.5, function(e) {
    g.beginPath();
    g.moveTo(x - w / 2 - 6 - e, y - h + 2);
    g.lineTo(x, y - h - 30 - e);
    g.lineTo(x + w / 2 + 6 + e, y - h + 2);
    g.closePath();
    g.fill();
  });
  g.fillStyle = "#B8462F";
  g.fillRect(x - 13, y - 40, 26, 40);
  g.fillStyle = "#FFE29A";
  g.fillRect(x - 9, y - h + 14, 18, 14);
  g.strokeStyle = "#1F2328";
  g.lineWidth = 1.5;
  g.strokeRect(x - 9, y - h + 14, 18, 14);
  g.fillStyle = "#F4F1E8";
  g.font = "600 9px Fredoka";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("BOATS", x, y - h + 6);
  G.shedWin = { x, y: y - h + 21 };
  var bx = x - 74, by = y - 4;
  g.fillStyle = "#6B5440";
  g.fillRect(bx - 22, by - 12, 3, 12);
  g.fillRect(bx + 20, by - 12, 3, 12);
  rimmed(g, "#24364A", "#3E6E9E", 1.5, function(e) {
    g.beginPath();
    g.moveTo(bx - 36 - e, by - 12 + e);
    g.bezierCurveTo(bx - 30, by - 36 - e, bx + 22, by - 38 - e, bx + 36 + e, by - 14 + e);
    g.closePath();
    g.fill();
  });
  g.strokeStyle = "rgba(255,255,255,.3)";
  g.lineWidth = 1;
  [0.35, 0.65].forEach(function(k) {
    g.beginPath();
    g.moveTo(bx - 36 + 6 * k, by - 12 - 4 * k);
    g.bezierCurveTo(bx - 28, by - 12 - 22 * k, bx + 20, by - 14 - 22 * k, bx + 36 - 6 * k, by - 14 - 4 * k);
    g.stroke();
  });
  g.fillStyle = "#D9534F";
  g.fillRect(bx - 36, by - 13, 72, 3);
  g.fillStyle = "#8C6A4A";
  g.beginPath();
  g.arc(x + 44, y - 2, 10, Math.PI, 0);
  g.fill();
  g.strokeStyle = "#5E4630";
  g.lineWidth = 1;
  for (i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(x + 44 + i * 4, y - 2);
    g.lineTo(x + 44 + i * 2.5, y - 11);
    g.stroke();
  }
  g.strokeStyle = "#C9B48A";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(x - 40, y + 6, 9, 3, 0, 0, 7);
  g.ellipse(x - 40, y + 4, 6, 2, 0, 0, 7);
  g.stroke();
}
function beachThings(g) {
  var b = G.breaker, i, n = 6;
  g.fillStyle = "rgba(120,100,60,.18)";
  g.beginPath();
  g.ellipse((b.x0 + b.x1) / 2, b.y + 3, (b.x1 - b.x0) / 2 + 6, 6, 0, 0, 7);
  g.fill();
  for (i = 0; i < n; i++) {
    var x0 = b.x0 + (b.x1 - b.x0) * i / n, x1 = b.x0 + (b.x1 - b.x0) * (i + 1) / n, sag = Math.sin(i * 1.3) * 2;
    g.fillStyle = ["#D9534F", "#F4F1E8", "#4F7FBF", "#F4F1E8", "#F2C14E", "#F4F1E8"][i];
    g.beginPath();
    g.moveTo(x0, b.y - 30 + sag);
    g.lineTo(x1, b.y - 30 - sag);
    g.lineTo(x1, b.y);
    g.lineTo(x0, b.y);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#8D6440";
  for (i = 0; i <= n; i++) g.fillRect(b.x0 + (b.x1 - b.x0) * i / n - 1.5, b.y - 36, 3, 38);
  G.chairs.forEach(function(c2) {
    deckchair(g, c2.x, c2.y, c2.col);
  });
  var c = G.castle;
  rimmed(g, "#C2A66C", "#E3CD98", 1.5, function(e) {
    g.fillRect(c.x - 26 - e, c.y - 20 - e, 52 + 2 * e, 20 + 2 * e);
    g.fillRect(c.x - 30 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e);
    g.fillRect(c.x + 14 - e, c.y - 34 - e, 16 + 2 * e, 16 + 2 * e);
    g.fillRect(c.x - 9 - e, c.y - 42 - e, 18 + 2 * e, 24 + 2 * e);
  });
  g.fillStyle = "#C2A66C";
  [-30, -24, -18, 14, 20, 26, -9, -3, 3].forEach(function(o, k) {
    g.fillRect(c.x + o, c.y - (k < 6 ? 38 : 46), 4, 4);
  });
  g.fillStyle = "#9C7B4E";
  rr(g, c.x - 6, c.y - 12, 12, 12, 5);
  g.fill();
  g.strokeStyle = "#8D6440";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(c.x, c.y - 42);
  g.lineTo(c.x, c.y - 58);
  g.stroke();
  g.fillStyle = "#D9534F";
  g.beginPath();
  g.moveTo(c.x, c.y - 58);
  g.lineTo(c.x + 12, c.y - 54);
  g.lineTo(c.x, c.y - 50);
  g.closePath();
  g.fill();
  rimmed(g, "#B8462F", "#E86A5B", 1.5, function(e) {
    g.beginPath();
    g.moveTo(c.x + 40 - e, c.y - 22 - e);
    g.lineTo(c.x + 60 + e, c.y - 22 - e);
    g.lineTo(c.x + 57 + e, c.y + e);
    g.lineTo(c.x + 43 - e, c.y + e);
    g.closePath();
    g.fill();
  });
  g.strokeStyle = "#B8462F";
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(c.x + 50, c.y - 22, 9, Math.PI, 0);
  g.stroke();
  g.strokeStyle = "#8D6440";
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(c.x - 44, c.y - 2);
  g.lineTo(c.x - 56, c.y - 30);
  g.stroke();
  g.fillStyle = "#4E9A5A";
  g.beginPath();
  g.moveTo(c.x - 46, c.y);
  g.lineTo(c.x - 38, c.y - 6);
  g.lineTo(c.x - 44, c.y - 12);
  g.lineTo(c.x - 52, c.y - 6);
  g.closePath();
  g.fill();
}
function deckchair(g, x, y, col) {
  g.fillStyle = "rgba(120,100,60,.2)";
  g.beginPath();
  g.ellipse(x + 2, y + 2, 26, 6, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#9C7448";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x - 16, y);
  g.lineTo(x + 6, y - 44);
  g.moveTo(x + 14, y);
  g.lineTo(x - 8, y - 22);
  g.moveTo(x + 18, y);
  g.lineTo(x + 12, y - 16);
  g.stroke();
  g.save();
  g.beginPath();
  g.moveTo(x - 14, y - 6);
  g.quadraticCurveTo(x - 2, y - 14, x + 4, y - 42);
  g.lineTo(x + 12, y - 40);
  g.quadraticCurveTo(x + 6, y - 12, x - 6, y - 2);
  g.closePath();
  g.clip();
  for (var i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "#FBF7EE" : col;
    g.fillRect(x - 16 + i * 5, y - 46, 5, 48);
  }
  g.restore();
  g.strokeStyle = "rgba(60,50,40,.35)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x - 14, y - 6);
  g.quadraticCurveTo(x - 2, y - 14, x + 4, y - 42);
  g.stroke();
}
var A = null;
function setup(S) {
  A = { gulls: [], crab: null, boat: null, crests: [], stars: [], t: 0, band: 0, note: 0 };
  for (var i = 0; i < 3; i++) A.gulls.push({ x: rand(0, G.W), y: rand(70, G.HZ - 30), v: rand(28, 46) * (Math.random() < 0.5 ? -1 : 1), ph: rand(0, 6), s: rand(0.8, 1.1), mode: "fly" });
  A.gulls.push({ x: G.W * 0.55, y: G.shoreY + 90, v: 0, ph: 0, s: 1, mode: "walk", tx: G.W * 0.55, ty: G.shoreY + 90, wait: 2, peck: 0 });
  A.crab = { x: G.W * 0.45, y: G.shoreY + 60, tx: G.W * 0.45, ty: G.shoreY + 60, wait: 1, hide: 0, clack: 0, ph: 0 };
  A.boat = { x: rand(G.W * 0.38, G.W * 0.6), v: 7, ph: 0 };
  for (i = 0; i < 30; i++) {
    var cy = rand(G.HZ + 8, G.shoreY - 12), cx = rand(0, G.W);
    A.crests.push({ x: cx, y: cy, l: rand(10, 26), ph: rand(0, 6) });
  }
  for (i = 0; i < 40; i++) A.stars.push({ x: rand(0, G.W), y: rand(8, G.HZ - 40), s: rand(1, 2.2), ph: rand(0, 6) });
  A.crabSpr = crabSprite();
  A.glow = canvas(48, 48);
  var gg = A.glow.getContext("2d"), gr = gg.createRadialGradient(24, 24, 1, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,244,200,1)");
  gr.addColorStop(0.3, "rgba(255,214,130,.55)");
  gr.addColorStop(1, "rgba(255,200,110,0)");
  gg.fillStyle = gr;
  gg.fillRect(0, 0, 48, 48);
  A.boatSpr = boatSprite();
  A.bandSpr = bandSprites();
  void S;
}
function nearFam(S, x, y, d) {
  for (var i = 0; i < S.fam.length; i++) {
    var t = S.fam[i];
    if (Math.abs(t.x - x) + Math.abs(t.y - y) < d) return t;
  }
  return null;
}
function update(dt, S) {
  if (!A) return;
  var WX = S.WX || {}, asleep = S.nightness > 0.6, wind = WX.wind || 0.1, i;
  A.t += dt;
  for (i = 0; i < A.gulls.length; i++) {
    var gl = A.gulls[i];
    if (gl.mode === "fly") {
      if (asleep) continue;
      gl.ph += dt * (7 + wind * 4);
      gl.x += (gl.v + (gl.v > 0 ? 1 : -1) * wind * 20) * dt;
      gl.y += Math.sin(A.t * 0.6 + gl.ph * 0.1) * 6 * dt;
      if (gl.x < -40) gl.x = G.W + 40;
      if (gl.x > G.W + 40) gl.x = -40;
      if (gl.land && Math.abs(gl.x - gl.land.x) < 14) {
        gl.mode = "walk";
        gl.x = gl.land.x;
        gl.y = gl.land.y;
        gl.tx = gl.x;
        gl.ty = gl.y;
        gl.wait = rand(2, 5);
        gl.land = null;
        gl.v = 0;
      } else if (gl.land) {
        gl.y += (gl.land.y - gl.y) * Math.min(1, dt * 1.2);
        gl.v = (gl.land.x > gl.x ? 1 : -1) * 70;
      }
    } else {
      gl.peck = Math.max(0, gl.peck - dt);
      var near2 = nearFam(S, gl.x, gl.y, 95);
      if (near2 && !asleep) {
        S.say("!", gl.x, gl.y - 26);
        gl.mode = "fly";
        gl.v = (near2.x > gl.x ? -1 : 1) * 60;
        gl.y -= 6;
        gl.ph = 0;
        gl.land = { x: rand(G.W * 0.38, G.W * 0.68), y: rand(G.shoreY + 60, G.H - 70) };
        continue;
      }
      if (asleep) continue;
      var dx = gl.tx - gl.x, dy = gl.ty - gl.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2) {
        var st = Math.min(d, 22 * dt);
        gl.x += dx / d * st;
        gl.y += dy / d * st;
        gl.ph += dt * 10;
        gl.face = dx > 0 ? 1 : -1;
      } else if ((gl.wait -= dt) < 0) {
        if (Math.random() < 0.35) gl.peck = 0.5;
        gl.tx = Math.max(G.W * 0.36, Math.min(G.W * 0.7, gl.x + rand(-70, 70)));
        gl.ty = Math.max(G.shoreY + 50, Math.min(G.H - 50, gl.y + rand(-30, 30)));
        gl.wait = rand(1.5, 4);
      }
    }
  }
  var c = A.crab;
  c.clack = Math.max(0, c.clack - dt);
  if (c.hide > 0) {
    c.hide -= dt;
    if (c.hide <= 0 && asleep) c.hide = 5;
  } else if (asleep) c.hide = 5;
  else {
    var who = nearFam(S, c.x, c.y, 80);
    if (who) {
      c.hide = rand(6, 12);
      S.puff("crumb", c.x, c.y - 4, 4, "#D8C69A");
    } else {
      var cx = c.tx - c.x, cy = c.ty - c.y, cd = Math.sqrt(cx * cx + cy * cy);
      if (cd > 2) {
        var cs = Math.min(cd, 30 * dt);
        c.x += cx / cd * cs;
        c.y += cy / cd * cs;
        c.ph += dt * 18;
      } else if ((c.wait -= dt) < 0) {
        if (Math.random() < 0.4) c.clack = 1.2;
        var nx = c.x + rand(-120, 120), base = shore(nx);
        c.tx = Math.max(G.W * 0.36, Math.min(G.W * 0.7, nx));
        c.ty = base + rand(28, 70);
        c.wait = rand(1, 3.5);
      }
    }
  }
  var b = A.boat;
  b.x += b.v * (0.6 + wind) * dt;
  b.ph += dt;
  if (b.x > G.W + 60) b.x = G.W * 0.34;
  for (i = 0; i < A.crests.length; i++) {
    var cr = A.crests[i];
    cr.x += (6 + 26 * wind) * dt * (0.4 + (cr.y - G.HZ) / (G.shoreY - G.HZ));
    if (cr.x > G.W + 30) cr.x = foot(uFoot(cr.y)).x;
  }
  A.band += ((S.music || 0) > 0.5 && !asleep ? 1 : 0) * dt * 3 - dt * 1.5;
  A.band = Math.max(0, Math.min(1, A.band));
  if (A.band > 0.6) {
    A.note -= dt;
    if (A.note < 0) {
      A.note = rand(0.5, 1.1);
      var pv = G.pav;
      S.puff("note", pv.x + rand(-20, 20), pv.y - 40, 1, pick(["#3E6E9E", "#D9534F", "#4E9A5A", "#C9506E"]));
    }
  }
}
function swash(x, time, S) {
  var d = S.now(), hrs = d.getHours() + d.getMinutes() / 60, tide = Math.cos(hrs / 12.42 * Math.PI * 2);
  var WX = S.WX || {}, big = 1 + 1.4 * (WX.wind || 0.1) + 1.2 * (WX.storm || 0);
  var wave = Math.max(0, Math.sin(time * 0.9 + x / 260)) * 10 * big + Math.sin(time * 0.37 + x / 400) * 3;
  return tide * 9 + wave + 6;
}
function under(ctx, time, S) {
  if (!A) return;
  var W = G.W, WX = S.WX || {}, i, x, wind = WX.wind || 0.1;
  var stormy = (WX.storm || 0) > 0.4;
  if (!stormy) {
    var b = A.boat, bob = Math.sin(b.ph * 1.6) * 1.2;
    ctx.drawImage(A.boatSpr.c, b.x - A.boatSpr.w / 2, G.HZ - A.boatSpr.h + 6 + bob, A.boatSpr.w, A.boatSpr.h);
  }
  var P = G.pier, s0 = pierSpan(P.y0 + (P.y1 - P.y0) * 0.6), s1 = pierSpan(P.y1), y0 = P.y0 + (P.y1 - P.y0) * 0.6, A0 = G.wall, f9 = foot(-0.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, G.H);
  ctx.moveTo(s0[0] - 3, y0);
  ctx.lineTo(s0[1] + 3, y0);
  ctx.lineTo(s1[1] + 3, P.y1 + 8);
  ctx.lineTo(s1[0] - 3, P.y1 + 8);
  ctx.closePath();
  ctx.moveTo(f9.x - 2, f9.y);
  ctx.lineTo(A0.x1 - 1, A0.y1);
  ctx.lineTo(A0.x1 - 1, 0);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-20, f9.y);
  ctx.closePath();
  var sh = G.shed;
  ctx.moveTo(sh.x - 40, sh.y);
  ctx.lineTo(sh.x - 40, sh.y - 92);
  ctx.lineTo(sh.x, sh.y - 124);
  ctx.lineTo(sh.x + 40, sh.y - 92);
  ctx.lineTo(sh.x + 40, sh.y);
  ctx.closePath();
  ctx.clip("evenodd");
  ctx.strokeStyle = "rgba(255,255,255," + (0.3 + 0.45 * wind).toFixed(2) + ")";
  ctx.lineCap = "round";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  var n = Math.round(A.crests.length * (0.45 + 0.55 * wind));
  for (i = 0; i < n; i++) {
    var c = A.crests[i], k = (c.y - G.HZ) / (G.shoreY - G.HZ), l = c.l * (0.4 + k), on2 = Math.sin(time * 0.8 + c.ph);
    if (on2 < -0.3) continue;
    ctx.moveTo(c.x - l / 2, c.y);
    ctx.quadraticCurveTo(c.x, c.y - 2 - 2 * k, c.x + l / 2, c.y);
  }
  ctx.stroke();
  if (S.DARK < 0.5) {
    ctx.fillStyle = "rgba(255,255,240,.55)";
    for (i = 0; i < 12; i++) {
      var gx = W * 0.58 + Math.sin(i * 12.9) * W * 0.12, gy = G.HZ + 10 + i * 37 % 100 * (G.shoreY - G.HZ - 30) / 100, tw = Math.sin(time * 3 + i * 1.7);
      if (tw > 0.65) ctx.fillRect(gx - 1.5, gy - 0.6, 3 + tw * 2, 1.2);
    }
  }
  if ((WX.rain || 0) > 0.1) {
    ctx.strokeStyle = "rgba(255,255,255," + (0.4 * WX.rain).toFixed(2) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < 14; i++) {
      var ry = rand(G.HZ + 20, G.shoreY - 6), rx = rand(foot(uFoot(ry)).x, W), rk = (ry - G.HZ) / (G.shoreY - G.HZ);
      ctx.moveTo(rx + 4 + 4 * rk, ry);
      ctx.ellipse(rx, ry, 4 + 4 * rk, 1.2 + rk, 0, 0, 7);
    }
    ctx.stroke();
  }
  var pts = [];
  for (x = -8; x <= W + 8; x += 16) pts.push([x, shore(x) + swash(x, time, S)]);
  ctx.fillStyle = "rgba(140,190,172,.78)";
  ctx.beginPath();
  ctx.moveTo(-8, G.shoreY - 30);
  for (i = 0; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(W + 8, G.shoreY - 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (i = 0; i < pts.length; i++) {
    if (i) ctx.lineTo(pts[i][0], pts[i][1]);
    else ctx.moveTo(pts[i][0], pts[i][1]);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (i = 0; i < pts.length; i++) {
    var y2 = pts[i][1] - 12 - 6 * Math.sin(time * 0.9 + pts[i][0] / 260 + 1.6);
    if (i) ctx.lineTo(pts[i][0], y2);
    else ctx.moveTo(pts[i][0], y2);
  }
  ctx.stroke();
  var big = 1 + 1.6 * wind + 1.5 * (WX.storm || 0);
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.beginPath();
  for (var u = 0.42; u < 1; u += 0.03) {
    var f = foot(u), sc = 1 - 0.75 * u, burst = Math.max(0, Math.sin(time * 1.3 - u * 9)) * 9 * big * sc;
    ctx.moveTo(f.x + 3, f.y);
    ctx.ellipse(f.x + 3, f.y - burst * 0.4, 3 + 2 * sc, 1.5 + burst * 0.5, 0, 0, 7);
  }
  ctx.fill();
  if ((WX.storm || 0) > 0.05) {
    ctx.fillStyle = "rgba(40,55,65," + (0.25 * WX.storm).toFixed(3) + ")";
    ctx.fillRect(0, G.HZ, W, G.shoreY - G.HZ + 10);
  }
  ctx.restore();
}
function back(ctx, time, S) {
  if (!A) return;
  var i, asleep = S.nightness > 0.6;
  band(ctx, time, asleep);
  var c = A.crab;
  if (c.hide <= 0) {
    var sc = S.depth(c.y), cl = c.clack > 0 ? Math.abs(Math.sin(c.clack * 9)) : 0, wob = Math.sin(c.ph) * 1.2;
    ctx.save();
    ctx.translate(c.x, c.y + wob * 0.3);
    ctx.scale(sc / K, sc / K);
    ctx.drawImage(cl > 0.5 ? A.crabSpr.up : A.crabSpr.down, -A.crabSpr.ax, -A.crabSpr.ay);
    ctx.restore();
  } else if (c.hide > 0 && !asleep) {
    ctx.fillStyle = "#2B2433";
    ctx.beginPath();
    ctx.arc(c.x - 3, c.y - 2, 1.6, 0, 7);
    ctx.arc(c.x + 3, c.y - 2, 1.6, 0, 7);
    ctx.fill();
  }
  if (asleep) {
    var pv = G.pav, t1 = top(0.12);
    [[pv.x - 30, pv.y - pv.h - 8, 1], [pv.x + 34, pv.y - pv.h - 8, -1], [t1.x - 2, t1.y - 12, 1]].forEach(function(r) {
      gullStand(ctx, r[0], r[1], S.depth(r[1]) * 0.75, r[2], false, true, 0);
    });
  }
  for (i = 0; i < A.gulls.length; i++) {
    var g = A.gulls[i];
    if (g.mode === "fly" && asleep) continue;
    if (g.mode === "fly") gullFly(ctx, g.x, g.y, g.s * (0.7 + 0.3 * (g.y / G.HZ)), Math.sin(g.ph), g.v >= 0 ? 1 : -1);
    else gullStand(ctx, g.x, g.y, S.depth(g.y), g.face || 1, g.peck > 0, asleep, time + g.ph);
  }
}
function band(ctx, time, asleep) {
  var pv = G.pav, on2 = A.band, spr = A.bandSpr;
  if (asleep) return;
  for (var i = 0; i < 3; i++) {
    var bx = pv.x - 20 + i * 20, by = pv.y - 6, beat = on2 * Math.max(0, Math.sin(time * 6.3 + i * 1.3)), sway = on2 * Math.sin(time * 3.1 + i) * 0.08;
    ctx.save();
    ctx.translate(bx, by - beat * 2.5);
    ctx.rotate(sway);
    ctx.drawImage(spr[i], -spr.ax, -spr.ay, spr[i].width / K, spr[i].height / K);
    ctx.restore();
  }
}
function bandSprites() {
  function one(kind) {
    var w = 22, h = 34, c = canvas(w * K, h * K), g = c.getContext("2d");
    g.scale(K, K);
    var x = 11, y = h - 1;
    g.fillStyle = "#2B3A55";
    g.fillRect(x - 4, y - 8, 3, 8);
    g.fillRect(x + 1, y - 8, 3, 8);
    rimmed(g, "#8E2F2A", "#D9534F", 1, function(e) {
      rr(g, x - 6 - e, y - 20 - e, 12 + 2 * e, 13 + 2 * e, 3);
      g.fill();
    });
    g.fillStyle = "#F2C14E";
    g.fillRect(x - 0.6, y - 19, 1.2, 11);
    g.fillStyle = "#F2D2B4";
    g.beginPath();
    g.arc(x, y - 24, 4.6, 0, 7);
    g.fill();
    g.fillStyle = "#2B3A55";
    g.fillRect(x - 5, y - 31, 10, 5);
    g.fillRect(x - 6, y - 27, 12, 1.6);
    g.fillStyle = "#2B2433";
    g.beginPath();
    g.arc(x - 1.6, y - 24, 0.8, 0, 7);
    g.arc(x + 1.8, y - 24, 0.8, 0, 7);
    g.fill();
    g.fillStyle = "#E6B84A";
    g.strokeStyle = "#B88A2A";
    g.lineWidth = 1;
    if (kind === 0) {
      g.fillStyle = "#F4F1E8";
      g.beginPath();
      g.ellipse(x, y - 11, 7, 6, 0, 0, 7);
      g.fill();
      g.strokeStyle = "#D9534F";
      g.lineWidth = 1.4;
      g.stroke();
    } else if (kind === 1) {
      g.fillRect(x + 2, y - 24, 9, 2);
      g.beginPath();
      g.moveTo(x + 10, y - 26);
      g.lineTo(x + 13, y - 27.5);
      g.lineTo(x + 13, y - 20.5);
      g.lineTo(x + 10, y - 22);
      g.closePath();
      g.fill();
    } else {
      g.beginPath();
      g.ellipse(x - 3, y - 14, 5, 6, 0, 0, 7);
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(x - 4, y - 25, 4.5, 0, 7);
      g.fill();
      g.stroke();
    }
    return c;
  }
  var out = [one(0), one(1), one(2)];
  out.ax = 11;
  out.ay = 33;
  return out;
}
function gullFly(ctx, x, y, s, flap, dir) {
  var w = 16 * s, up = flap * 7 * s;
  ctx.strokeStyle = "#5B6470";
  ctx.lineWidth = 2.6 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - w, y - up);
  ctx.quadraticCurveTo(x - w * 0.45, y - 5 * s - up * 0.4, x, y);
  ctx.quadraticCurveTo(x + w * 0.45, y - 5 * s - up * 0.4, x + w, y - up);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(x, y + 1.2 * s, 4.2 * s, 2.4 * s, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#F3C24B";
  ctx.beginPath();
  ctx.moveTo(x + dir * 4 * s, y);
  ctx.lineTo(x + dir * 7 * s, y + 0.8 * s);
  ctx.lineTo(x + dir * 4 * s, y + 1.8 * s);
  ctx.fill();
}
function gullStand(ctx, x, y, sc, face2, peck, asleep, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face2 * sc, sc);
  var bob = asleep ? 0 : Math.abs(Math.sin(t * 5)) * 0.8, dip = peck ? 6 : 0;
  ctx.strokeStyle = "#E3A23B";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, -6);
  ctx.lineTo(-2, 0);
  ctx.moveTo(2, -6);
  ctx.lineTo(3, 0);
  ctx.stroke();
  ctx.fillStyle = "#C9CFD6";
  ctx.beginPath();
  ctx.ellipse(-3, -12 - bob, 9, 6, -0.15, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.ellipse(1, -11 - bob, 8, 6, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#3E4450";
  ctx.beginPath();
  ctx.moveTo(-12, -14 - bob);
  ctx.lineTo(-6, -12 - bob);
  ctx.lineTo(-11, -10 - bob);
  ctx.fill();
  if (asleep) {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(4, -16, 4.5, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#2B2433";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, -17);
    ctx.lineTo(7, -17);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(7, -19 - bob + dip, 4.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#2B2433";
    ctx.beginPath();
    ctx.arc(8.5, -20 - bob + dip, 1.1, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#F3C24B";
    ctx.beginPath();
    ctx.moveTo(11, -20 - bob + dip);
    ctx.lineTo(16, -18.5 - bob + dip);
    ctx.lineTo(11, -17.5 - bob + dip);
    ctx.fill();
  }
  ctx.restore();
}
function crabSprite() {
  function one(up) {
    var w = 40, h = 30, c = canvas(w * K, h * K), g = c.getContext("2d");
    g.scale(K, K);
    var x = w / 2, y = h - 4, body = "#E8704A", rim = "#A8432A";
    g.strokeStyle = rim;
    g.lineWidth = 1.6;
    g.lineCap = "round";
    [-1, 1].forEach(function(s) {
      for (var i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(x + s * 6, y - 4 + i * 1.5);
        g.lineTo(x + s * (11 + i * 1.5), y - 5 + i * 2.5);
        g.lineTo(x + s * (13 + i * 1.5), y + 1);
        g.stroke();
      }
    });
    [-1, 1].forEach(function(s) {
      var cx = x + s * 12, cy = up ? y - 16 : y - 9;
      g.beginPath();
      g.moveTo(x + s * 5, y - 7);
      g.lineTo(cx - s * 2, cy + 2);
      g.stroke();
      rimmed(g, rim, body, 1.4, function(e) {
        g.beginPath();
        g.ellipse(cx, cy, 4 + e, 3.2 + e, s * 0.5, 0, 7);
        g.fill();
      });
      g.fillStyle = rim;
      g.beginPath();
      g.moveTo(cx + s * 1, cy - 1);
      g.lineTo(cx + s * 5, cy - 3.5);
      g.lineTo(cx + s * 3, cy + 0.5);
      g.fill();
    });
    rimmed(g, rim, body, 1.4, function(e) {
      g.beginPath();
      g.ellipse(x, y - 6, 9 + e, 6 + e, 0, 0, 7);
      g.fill();
    });
    g.fillStyle = "rgba(255,255,255,.35)";
    g.beginPath();
    g.ellipse(x - 3, y - 8.5, 4, 1.8, 0, 0, 7);
    g.fill();
    g.strokeStyle = rim;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x - 3, y - 11);
    g.lineTo(x - 3.5, y - 15);
    g.moveTo(x + 3, y - 11);
    g.lineTo(x + 3.5, y - 15);
    g.stroke();
    g.fillStyle = "#2B2433";
    g.beginPath();
    g.arc(x - 3.5, y - 15.5, 1.7, 0, 7);
    g.arc(x + 3.5, y - 15.5, 1.7, 0, 7);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(x - 4, y - 16, 0.6, 0, 7);
    g.arc(x + 3, y - 16, 0.6, 0, 7);
    g.fill();
    return c;
  }
  return { down: one(false), up: one(true), ax: 20 * K, ay: 26 * K };
}
function boatSprite() {
  var w = 44, h = 46, c = canvas(w * K, h * K), g = c.getContext("2d");
  g.scale(K, K);
  g.fillStyle = "#B5583A";
  g.beginPath();
  g.moveTo(22, 6);
  g.lineTo(22, 34);
  g.lineTo(8, 34);
  g.closePath();
  g.fill();
  g.fillStyle = "#C98A5A";
  g.beginPath();
  g.moveTo(24, 12);
  g.lineTo(24, 34);
  g.lineTo(34, 34);
  g.closePath();
  g.fill();
  g.strokeStyle = "#4E3A2A";
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(23, 3);
  g.lineTo(23, 38);
  g.stroke();
  g.fillStyle = "#3E4A5A";
  g.beginPath();
  g.moveTo(4, 37);
  g.lineTo(40, 37);
  g.lineTo(35, 44);
  g.lineTo(9, 44);
  g.closePath();
  g.fill();
  g.fillStyle = "#F4F1E8";
  g.fillRect(6, 37, 32, 1.6);
  return { c, w: w * 0.62, h: h * 0.62 };
}
function light(ctx, time, S) {
  if (!A) return;
  var D = S.DARK, i, W = G.W;
  if (D <= 0.02) return;
  ctx.fillStyle = "#FFFFFF";
  for (i = 0; i < A.stars.length; i++) {
    var st = A.stars[i], tw = 0.55 + 0.45 * Math.sin(time * 1.4 + st.ph);
    ctx.globalAlpha = D * tw * 0.8;
    ctx.fillRect(st.x, st.y, st.s, st.s);
  }
  var mx = W * 0.56, my = 112;
  ctx.globalAlpha = D;
  ctx.fillStyle = "#FFF8DC";
  ctx.beginPath();
  ctx.arc(mx, my, 17, 0, 7);
  ctx.fill();
  ctx.fillStyle = "rgba(230,222,190,.7)";
  ctx.beginPath();
  ctx.arc(mx - 5, my - 3, 3.5, 0, 7);
  ctx.arc(mx + 6, my + 5, 2.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#FFF3C4";
  for (i = 0; i < 16; i++) {
    var py = G.HZ + 6 + i * (G.shoreY - G.HZ - 16) / 16, pw = 8 + i * 3.2, jit = Math.sin(time * 2 + i * 1.9) * (4 + i);
    ctx.globalAlpha = D * (0.55 - i * 0.022);
    ctx.fillRect(mx - pw / 2 + jit, py, pw, 2);
  }
  var lh = G.lighthouse, lx = lh.x, ly = lh.y - 65, a = time * 0.7, face2 = Math.cos(a), len = 460 * Math.abs(Math.sin(a)) + 30, dir = Math.sin(a) > 0 ? -1 : 1;
  ctx.globalCompositeOperation = "lighter";
  var bg = ctx.createLinearGradient(lx, 0, lx + dir * len, 0);
  bg.addColorStop(0, "rgba(255,240,190,.42)");
  bg.addColorStop(1, "rgba(255,240,190,0)");
  ctx.globalAlpha = D * (0.35 + 0.45 * Math.max(0, face2));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(lx, ly - 2);
  ctx.lineTo(lx + dir * len, ly - 16);
  ctx.lineTo(lx + dir * len, ly + 12);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = D * (0.7 + 0.3 * Math.max(0, face2));
  ctx.drawImage(A.glow, lx - 20, ly - 20, 40, 40);
  var lamps = G.lamps.concat(G.promLamps);
  for (i = 0; i < lamps.length; i++) {
    var l = lamps[i], r = 10 + 14 * (l.k > 0.99 ? 0.7 : l.k);
    ctx.globalAlpha = D * 0.95;
    ctx.drawImage(A.glow, l.x - r, l.y - r, r * 2, r * 2);
  }
  var pv = G.pav;
  [-44, 44].forEach(function(o) {
    ctx.globalAlpha = D * 0.8;
    ctx.drawImage(A.glow, pv.x + o - 14, pv.y - pv.h + 10, 28, 28);
  });
  ctx.globalAlpha = D * 0.6;
  ctx.drawImage(A.glow, pv.x - 30, pv.y - pv.h, 60, 50);
  var cl = G.chipLight;
  ctx.globalAlpha = D * 0.7;
  ctx.drawImage(A.glow, cl.x - cl.w, cl.y - cl.w, cl.w * 2, cl.w * 2);
  ctx.globalAlpha = D * 0.6;
  ctx.drawImage(A.glow, G.shedWin.x - 16, G.shedWin.y - 16, 32, 32);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = D * 0.85;
  ctx.fillStyle = "#FFE29A";
  [-50, 38].forEach(function(o) {
    rr(ctx, pv.x + o, pv.y - pv.h + 16, 12, 16, 5);
    ctx.fill();
  });
  ctx.fillRect(cl.x - cl.w / 2, cl.y - cl.h / 2, cl.w, cl.h);
  ctx.fillRect(G.shedWin.x - 9, G.shedWin.y - 7, 18, 14);
  ctx.globalAlpha = 1;
}
function regionOf(x, y) {
  return onPier(x, y) ? "pier" : onProm(x, y) || onLand(x, y) ? "prom" : "sand";
}
function near(t, p, dx, dy) {
  return Math.abs(t.x - p.x) < dx && Math.abs(t.y - p.y) < dy;
}
function via(t, dest) {
  var a = regionOf(t.x, t.y), b = regionOf(dest.x, dest.y);
  if (a === b) return null;
  var pf = { x: (pierSpan(G.pier.y1)[0] + pierSpan(G.pier.y1)[1]) / 2, y: G.pier.y1 + 16 }, sf = G.slipFoot, st = G.slipTop;
  if (a === "pier") return near(t, pf, 36, 22) ? null : pf;
  if (a === "prom") return near(t, st, 20, 14) ? sf : st;
  if (b === "pier") return near(t, pf, 36, 22) ? null : pf;
  return near(t, sf, 22, 14) ? st : sf;
}
var seaside_default = {
  id: "seaside",
  label: "Seaside",
  shadow: "100,85,55",
  // warm-grey shadows on the sand
  depth: [0.64, 0.36],
  // a deeper view than the meadow's, so the pier reads as going out to sea
  creatures: ["otter", "shark", "crow", "capybara", "snail", "fox", "hedgehog"],
  bake: function(g, S) {
    bake2(g, S);
  },
  // spread over the beach, the pier, the promenade and the rocks
  start: function(i, S) {
    var P = G.pier, slots = [[0.47, 0.7], ["prom", 0.18], ["pier", 0.62], [0.58, 0.74], [0.68, 0.86], ["pier", 0.36], [0.34, 0.86], [0.42, 0.78]];
    var s = slots[i % slots.length];
    if (s[0] === "pier") {
      var y = P.y0 + (P.y1 - P.y0) * s[1], sp = pierSpan(y);
      return { x: (sp[0] + sp[1]) / 2, y };
    }
    if (s[0] === "prom") {
      var t = top(s[1]);
      return { x: t.x - promW(s[1]) * 0.5, y: t.y + 1 };
    }
    return { x: S.W * s[0], y: S.H * s[1] };
  },
  swimSpot: function(S) {
    var p = G.pool;
    void S;
    return { x: p.x + rand(-p.rx * 0.5, p.rx * 0.5), y: p.y - p.ry - 48 };
  },
  via: function(t, dest) {
    return via(t, dest);
  },
  // The landmarks a tap opens: the fingerpost up the lane to school, the boat shed (the
  // workshop), the band in the pier's pavilion, beach hut No. 7 (home) and the lighthouse
  // (the office, where someone keeps watch).
  hotspots: {
    school: {
      box: function() {
        var p = G.post;
        return [p.x - 46, p.y - 64, p.x + 46, p.y + 14];
      },
      tap: function(S) {
        var p = G.post;
        S.say("ding!", p.x, p.y - 72);
      }
    },
    printer: {
      box: function() {
        var s = G.shed;
        return [s.x - 112, s.y - 132, s.x + 58, s.y + 14];
      },
      tap: function(S) {
        var s = G.shed;
        S.puff("chip", s.x, s.y - 50, 6, "#C9A877");
      }
    },
    music: {
      box: function() {
        var p = G.pav;
        return [p.x - p.w / 2 - 6, p.y - p.h - 56, p.x + p.w / 2 + 6, p.y + 14];
      },
      tap: function(S) {
        var p = G.pav;
        S.puff("note", p.x + rand(-24, 24), p.y - 40, 5, "#D9534F");
      }
    },
    home: {
      box: function() {
        var h = G.home;
        return [h.x - Math.max(40, h.w * 0.8), h.y - 90, h.x + Math.max(40, h.w * 0.8), h.y + 12];
      },
      tap: function(S) {
        var h = G.home;
        S.puff("heart", h.x, h.y - 50, 3, "#FF7FA0");
      }
    },
    office: {
      box: function() {
        var l = G.lighthouse;
        return [l.x - 40, l.y - 92, l.x + 40, l.y + 12];
      },
      tap: function(S) {
        var l = G.lighthouse;
        S.say("beep!", l.x, l.y - 96);
      }
    }
  },
  weather: {
    // snow lies on the sand, the pier deck and the promenade, never on the sea; and someone builds a snowman
    ground: function(ctx, S, WX) {
      if (WX.snow <= 0.02) return;
      var x, u, t, P = G.pier, s0 = pierSpan(P.y0), s1 = pierSpan(P.y1);
      ctx.fillStyle = "rgba(246,249,255," + (0.55 * WX.snow).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(0, G.H);
      for (x = 0; x <= G.W; x += 16) ctx.lineTo(x, shore(x) + 30);
      ctx.lineTo(G.W, G.H);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s0[0], P.y0);
      ctx.lineTo(s0[1], P.y0);
      ctx.lineTo(s1[1], P.y1);
      ctx.lineTo(s1[0], P.y1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      t = top(-0.6);
      ctx.moveTo(t.x, t.y);
      for (u = -0.6; u <= 1.001; u += 0.05) {
        t = top(u);
        ctx.lineTo(t.x, t.y);
      }
      for (u = 1; u >= -0.601; u -= 0.05) {
        t = top(u);
        ctx.lineTo(t.x - promW(u), t.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = WX.snow;
      S.blit(S.sprites.snowman, G.W * 0.585, G.H - 54, 1, 1, 1, 1);
      ctx.globalAlpha = 1;
    }
  },
  ambient: { setup, update, under, back, light }
};

// src/scenes/index.js
var SCENE_LIST = [meadow_default, seaside_default];
var HOTSPOT_IDS = ["school", "printer", "music", "home", "office"];
var SCENE_BY_ID = {};
SCENE_LIST.forEach(function(s) {
  SCENE_BY_ID[s.id] = s;
});

// src/school.js
var DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
var WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
var TIMETABLE_ATTR = "timetable";
var LUNCH_ATTR = "menu";
var LONG = { sunday: "sun", monday: "mon", tuesday: "tue", wednesday: "wed", thursday: "thu", friday: "fri", saturday: "sat" };
var DAY_MS = 864e5;
function pad22(n) {
  return (n < 10 ? "0" : "") + n;
}
function ymdOf(d) {
  return d.getFullYear() + "-" + pad22(d.getMonth() + 1) + "-" + pad22(d.getDate());
}
function toDay(v) {
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12);
  const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(v == null ? "" : v));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
}
function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
}
function mondayOf(d) {
  return addDays(d, -((d.getDay() + 6) % 7));
}
function weeksBetween(a, b) {
  return Math.round((b - a) / (7 * DAY_MS));
}
function dayKey(k) {
  const s = String(k).toLowerCase();
  return LONG[s] || (DAY_KEYS.indexOf(s.slice(0, 3)) >= 0 ? s.slice(0, 3) : null);
}
function str(v) {
  return v == null ? "" : String(v).trim();
}
function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function attrOf(state, attribute) {
  const a = state && state.attributes || {};
  let v = a[attribute];
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch (e) {
      v = void 0;
    }
  }
  return v;
}
function unavailable(state, attribute) {
  if (!state) return "not found";
  if (/^(unavailable|unknown)$/.test(String(state.state))) return "is " + state.state;
  return "has no " + attribute + " attribute";
}
function lessonOf(l, i) {
  if (typeof l === "string") {
    const s = l.split("|");
    return { p: i + 1, subject: s[0].trim(), room: str(s[1]) === "—" ? "" : str(s[1]) };
  }
  if (!isObj(l)) return null;
  return { p: l.p == null || l.p === "" ? i + 1 : l.p, subject: str(l.subject), room: str(l.room), start: str(l.start), end: str(l.end) };
}
function normTimetable(t) {
  const days = {};
  Object.keys(isObj(t.days) ? t.days : {}).forEach(function(w) {
    const src = t.days[w], out = {};
    if (isObj(src)) Object.keys(src).forEach(function(k) {
      const key = dayKey(k);
      if (key && Array.isArray(src[k])) out[key] = src[k].map(lessonOf).filter(function(l) {
        return l && l.subject;
      });
    });
    days[String(w)] = out;
  });
  const weeks = (Array.isArray(t.weeks) && t.weeks.length ? t.weeks : Object.keys(days)).map(String);
  const periods = (Array.isArray(t.periods) ? t.periods : []).filter(isObj).map(function(p, i) {
    return { p: p.p == null ? i + 1 : p.p, start: str(p.start), end: str(p.end) };
  });
  const closed = {};
  (Array.isArray(t.closed) ? t.closed : []).forEach(function(c) {
    const d = toDay(isObj(c) ? c.date : c);
    if (d) closed[ymdOf(d)] = isObj(c) ? str(c.note) : "";
  });
  const weekOf = {};
  Object.keys(isObj(t.week_of) ? t.week_of : {}).forEach(function(k) {
    const d = toDay(k);
    if (d) weekOf[ymdOf(mondayOf(d))] = t.week_of[k] == null || t.week_of[k] === "" ? null : String(t.week_of[k]);
  });
  const anchor = toDay(t.anchor);
  return { weeks, days, periods, closed, weekOf, anchor: anchor ? mondayOf(anchor) : null };
}
function weekFor(T, mon) {
  const key = ymdOf(mon);
  if (Object.prototype.hasOwnProperty.call(T.weekOf, key)) {
    const v = T.weekOf[key];
    if (v === null) return { week: null, off: true };
    return T.weeks.indexOf(v) >= 0 ? { week: v } : { week: null, reason: "week_of " + key + " names week " + v + ", which is not in weeks" };
  }
  if (T.weeks.length === 1) return { week: T.weeks[0] };
  if (!T.weeks.length) return { week: null, reason: "no weeks" };
  const refs = [];
  if (T.anchor) refs.push({ at: T.anchor, i: 0 });
  Object.keys(T.weekOf).forEach(function(k) {
    const i2 = T.weeks.indexOf(T.weekOf[k]);
    if (i2 >= 0) refs.push({ at: toDay(k), i: i2 });
  });
  if (!refs.length) return { week: null, reason: "no anchor or week_of to count from" };
  const before = refs.filter(function(r) {
    return r.at <= mon;
  }).sort(function(a, b) {
    return b.at - a.at;
  });
  const ref = before[0] || refs.sort(function(a, b) {
    return a.at - b.at;
  })[0];
  const n = T.weeks.length, i = ((ref.i + weeksBetween(ref.at, mon)) % n + n) % n;
  return { week: T.weeks[i] };
}
function withTimes(T, list) {
  const at = {};
  T.periods.forEach(function(p) {
    at[String(p.p)] = p;
  });
  return list.map(function(l) {
    const p = at[String(l.p)] || {};
    return { p: l.p, start: l.start || p.start || "", end: l.end || p.end || "", subject: l.subject, room: l.room };
  });
}
function gridFor(T, d) {
  const mon = mondayOf(d), wk = weekFor(T, mon), lessons = wk.week ? T.days[wk.week] || {} : {};
  const order = T.periods.map(function(p) {
    return String(p.p);
  });
  const days = WEEKDAY_KEYS.map(function(k, i) {
    const date = ymdOf(addDays(mon, i)), off = Object.prototype.hasOwnProperty.call(T.closed, date);
    const list = withTimes(T, lessons[k] || []);
    list.forEach(function(l) {
      if (order.indexOf(String(l.p)) < 0) order.push(String(l.p));
    });
    return { key: k, date, closed: off || !!wk.off, note: off ? T.closed[date] : "", lessons: list };
  });
  const rows = order.map(function(p) {
    const per = T.periods.filter(function(x) {
      return String(x.p) === p;
    })[0] || {};
    return {
      p: per.p != null ? per.p : p,
      start: per.start || "",
      end: per.end || "",
      cells: days.map(function(dd) {
        return dd.closed ? null : dd.lessons.filter(function(l) {
          return String(l.p) === p;
        })[0] || null;
      })
    };
  });
  return { monday: ymdOf(mon), week: wk.week, off: !!wk.off, reason: wk.reason || "", days, rows };
}
function fromLegacy(state, today) {
  const a = state.attributes || {}, wk = str(state.state), t0 = toDay(today), t1 = addDays(t0, 1);
  const grid = isObj(a.grid) ? a.grid : {}, days = {};
  Object.keys(grid).forEach(function(w) {
    days[w] = grid[w];
  });
  if (!days[wk]) days[wk] = {};
  const wt = str(a.week_tomorrow) || wk;
  if (!days[wt]) days[wt] = {};
  function fill(w, d, list) {
    const k = DAY_KEYS[d.getDay()];
    if (Array.isArray(list) && list.length && !(days[w][k] || days[w][LONG_NAME[k]])) days[w][k] = list;
  }
  fill(wk, t0, a.lessons_today);
  fill(wt, t1, a.lessons_tomorrow);
  const closed = [];
  if (a.open_today === false) closed.push(ymdOf(t0));
  if (a.open_tomorrow === false) closed.push(ymdOf(t1));
  const weekOf = {};
  weekOf[ymdOf(mondayOf(t0))] = wk;
  if (ymdOf(mondayOf(t1)) !== ymdOf(mondayOf(t0))) weekOf[ymdOf(mondayOf(t1))] = wt;
  return { weeks: Object.keys(days), days, week_of: weekOf, closed };
}
var LONG_NAME = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
function isLegacyTimetable(a) {
  return !!a && ("lessons_today" in a || "open_today" in a || isObj(a.grid));
}
function parseTimetable(state, date, today, attribute) {
  const d = toDay(date), attr = attribute || TIMETABLE_ATTR;
  const out = { status: "unavailable", date: d ? ymdOf(d) : "", day: d ? DAY_KEYS[d.getDay()] : "", week: null, lessons: [], note: "", reason: "", grid: null };
  if (!d) {
    out.reason = "no date";
    return out;
  }
  let raw = attrOf(state, attr);
  if (!isObj(raw) && state && isLegacyTimetable(state.attributes)) raw = fromLegacy(state, today || d);
  if (!isObj(raw) || !isObj(raw.days)) {
    out.reason = isObj(raw) ? "no days in the " + attr + " attribute" : unavailable(state, attr);
    return out;
  }
  const T = normTimetable(raw), g = gridFor(T, d);
  out.grid = g;
  out.week = g.week;
  const dow = d.getDay();
  if (dow === 0 || dow === 6) {
    out.status = "weekend";
    return out;
  }
  if (Object.prototype.hasOwnProperty.call(T.closed, out.date)) {
    out.status = "closed";
    out.note = T.closed[out.date];
    return out;
  }
  if (g.off) {
    out.status = "closed";
    out.note = "not a timetable week";
    return out;
  }
  if (!g.week) {
    out.status = "no_week";
    out.reason = g.reason;
    return out;
  }
  out.status = "ok";
  out.lessons = g.days[dow - 1].lessons;
  return out;
}
var LESSONS_FALLBACK = 15 * 60 + 30;
function lessonsEnd(day) {
  let end = null;
  (day && day.lessons || []).forEach(function(l) {
    const m = /^(\d{1,2}):(\d\d)/.exec(str(l.end));
    if (m) {
      const v = +m[1] * 60 + +m[2];
      if (end === null || v > end) end = v;
    }
  });
  return end;
}
function lessonsOver(day, at, fallback) {
  const end = lessonsEnd(day), cut = end === null ? fallback == null ? LESSONS_FALLBACK : fallback : end;
  return at.getHours() * 60 + at.getMinutes() >= cut;
}
function allergensOf(v) {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/\s*,\s*/) : [];
  const out = [];
  list.forEach(function(x) {
    const s = str(x);
    if (s && out.indexOf(s) < 0) out.push(s);
  });
  return out;
}
function dishOf(v) {
  if (typeof v === "string") return v.trim() ? { name: v.trim(), kind: "", allergens: [] } : null;
  if (!isObj(v) || !str(v.name)) return null;
  return { name: str(v.name), kind: str(v.kind), allergens: allergensOf(v.allergens) };
}
function fromLegacyLunch(a, d, today) {
  const t0 = toDay(today), k = ymdOf(d) === ymdOf(t0) ? "today" : ymdOf(d) === ymdOf(addDays(t0, 1)) ? "tomorrow" : null;
  const menu = {};
  if (k) {
    const st = str(a["status_" + k]) || (a["served_" + k] ? "served" : "");
    if (st) menu[ymdOf(d)] = {
      status: st,
      pudding: a["pudding_" + k],
      options: [{ name: a["main_" + k], kind: "main" }, { name: a["veg_" + k], kind: "veg" }].filter(function(o) {
        return str(o.name);
      })
    };
  }
  return { menu, menu_ends: a.menu_ends };
}
function parseLunch(state, date, today, attribute) {
  const d = toDay(date), attr = attribute || LUNCH_ATTR;
  const out = { status: "unavailable", date: d ? ymdOf(d) : "", options: [], pudding: null, note: "", choice: "", menuEnds: "", reason: "" };
  if (!d) {
    out.reason = "no date";
    return out;
  }
  const a = state && state.attributes || {};
  let raw = attrOf(state, attr), menu, ends;
  if (isObj(raw) && isObj(raw.menu)) {
    menu = raw.menu;
    ends = raw.menu_ends;
  } else if (isObj(raw)) {
    menu = raw;
    ends = a.menu_ends;
  } else if (state && ("status_today" in a || "main_today" in a)) {
    const L = fromLegacyLunch(a, d, today || d);
    menu = L.menu;
    ends = L.menu_ends;
  } else {
    out.reason = unavailable(state, attr);
    return out;
  }
  const e = toDay(ends);
  out.menuEnds = e ? ymdOf(e) : "";
  const entry = menu[out.date], dow = d.getDay();
  if (isObj(entry)) {
    out.options = (Array.isArray(entry.options) ? entry.options : []).map(dishOf).filter(Boolean);
    out.pudding = dishOf(entry.pudding);
    out.note = str(entry.note);
    out.choice = str(entry.choice);
    const st = str(entry.status);
    out.status = st === "served" || st === "closed" || st === "no_menu" ? st : out.options.length ? "served" : "no_menu";
    return out;
  }
  if (dow === 0 || dow === 6) out.status = "weekend";
  else if (out.menuEnds && out.date > out.menuEnds) out.status = "ended";
  else out.status = "no_menu";
  return out;
}
function choiceText(v) {
  const s = str(v);
  if (!s || /^(none|off|unknown|unavailable|-)$/i.test(s)) return "";
  if (/^pack/i.test(s)) return "Packed lunch";
  if (/^(school|dinner|hot|school (dinner|lunch|meal))$/i.test(s)) return "School dinner";
  if (/^home$/i.test(s)) return "Lunch at home";
  return s;
}
function lunchChoice(conf, date, live, fromData) {
  const d = toDay(date);
  let err = "";
  if (conf && conf.entity) {
    const t = live ? choiceText(live.state) : "";
    if (t) return { text: t, from: conf.entity, err: "" };
    err = conf.entity + (live ? " is " + (str(live.state) || "empty") : " not found");
  }
  const fd = choiceText(fromData);
  if (fd) return { text: fd, from: "menu", err };
  const fixed = conf && conf.days && d ? choiceText(conf.days[DAY_KEYS[d.getDay()]]) : conf && conf.value ? choiceText(conf.value) : "";
  if (fixed) return { text: fixed, from: "config", err };
  return err ? { text: "", from: "", err } : null;
}

// src/config.js
var DEFAULTS = {
  people: [
    { name: "Parent 1", col: "#7FC8D2", r: 37, look: "crow", tg: 2.25, adult: true, glasses: true, bee: true },
    { name: "Parent 2", col: "#9A72C8", r: 36, look: "capybara", tg: 2.6, adult: true },
    { name: "Kid 1", col: "#A3B0F2", r: 40, look: "deer", tg: 2.75, phones: true, school: true },
    { name: "Kid 2", col: "#D4A8F5", r: 36, look: "shark", tg: 1.6, school: true },
    { name: "Kid 3", col: "#9EE0B4", r: 31, look: "otter", tg: 2.55, daisy: true, school: true },
    { name: "House", col: "#E0A050", r: 37, look: "snail", tg: 2.05 }
  ],
  // The two who get a party on a calendar event titled "Anniversary".
  anniversary: ["Parent 1", "Parent 2"],
  // Home Assistant entities. The first two are required; the rest are optional and a
  // missing one blanks only its own part of the School card.
  sensors: {
    week: "sensor.family_week",
    // every event on every calendar for the next 7 days, tagged who/what/day/at/all_day
    extra: "sensor.family_extra",
    // school items, kit, flags, term dates, and which sources could not be checked
    timetable: "sensor.family_timetable",
    // v1.1.0: one child's lessons; now people[].timetable
    kit: "sensor.family_kit",
    // what kit is needed today
    lunch: "sensor.family_lunch",
    // v1.1.0: one child's lunch menu; now people[].lunch
    sun: "sun.sun",
    weather: "weather.forecast_home",
    // Optional extras. null switches that part of the meadow off and nothing else.
    printer: null,
    // e.g. "sensor.a1mini_SERIAL_": a Bambu Lab printer's sensor prefix (ha-bambulab); the workshop builds the print
    letter: "input_text.family_letter",
    // the postie's letters, typed on a phone as "Kid 3: tea's at six"
    music: "media_player.music",
    // the speaker: the meadow dances while it plays music
    rain: null,
    // e.g. "sensor.rain_sensor": adds rain the forecast misses (see rainStates)
    trips: "calendar.family"
    // events titled "Holiday ..." on this calendar become countdowns
  },
  // Whose card the optional school sensors belong to. For timetable and lunch this is the
  // v1.1.0 way: normalize() copies them onto that person (people[].timetable, .lunch).
  schoolWho: { timetable: "Kid 2", kit: "Kid 3", lunch: "Kid 3" },
  // sensor.family_extra names its sources, not people. Map a source name (regex) to the
  // person whose card should say "couldn't check", so a missing source does not read
  // as a quiet week. The House card lists every missing source.
  sourceOwner: [[/parent-mail/, "Parent 2"], [/high-school/, "Kid 1"], [/primary/, "Kid 3"], [/academy/, "Kid 2"]],
  // The order the school kids stand in at the school door, front to back. Put the
  // tallest name tag (highest tg) first so the tags open out rather than overlap.
  schoolLine: ["Kid 1", "Kid 3", "Kid 2"],
  // What the rain sensor's states mean (sensors.rain). Anything else is no reading.
  rainStates: { wet: ["raining", "wet", "on"], dry: ["none", "dry", "off"] },
  // Countdowns in the sky. Birthdays are month-day and must use names from people;
  // each one throws the party on the day. The fixed days work for anyone.
  dates: {
    birthdays: { "Parent 1": "03-14", "Parent 2": "06-02", "Kid 1": "01-22", "Kid 2": "10-09", "Kid 3": "07-27" },
    fixed: [
      { key: "halloween", label: "Halloween", icon: "pumpkin", md: "10-31", rave: "halloween", party: "Happy Halloween!" },
      { key: "bonfire", label: "Bonfire night", icon: "fire", md: "11-05", rave: "bonfire", party: "Bonfire night!" },
      { key: "christmas", label: "Christmas", icon: "tree", md: "12-25", rave: "christmas", party: "Merry Christmas!" },
      { key: "nye", label: "New Year's Eve", icon: "sparkle", md: "12-31", rave: "new years eve", party: "Happy New Year!" }
    ]
  },
  // Tap shortcuts: a building opens its own dashboard view. null leaves that
  // building as scenery. Paths are views in dashboards/wall-panel.yaml.
  view: { home: "/wall-panel/home", music: "/wall-panel/music", printer: "/wall-panel/printer", office: null },
  // The office robot: a URL that answers GET with an agent office's state as JSON,
  // cross-origin (docs/06-views.md, "A page from another server"). null keeps the
  // robot out of the meadow entirely, which is what you want unless you run one.
  officeUrl: null
};
var LOOKS = CREATURES.map(function(c) {
  return c.id;
});
var LOOK_TG = {};
CREATURES.forEach(function(c) {
  if (c.tg) LOOK_TG[c.id] = c.tg;
});
var PALETTE = ["#7FC8D2", "#9A72C8", "#A3B0F2", "#D4A8F5", "#9EE0B4", "#E0A050", "#F2A0A0", "#E8D070"];
var ACCESSORIES = ["glasses", "phones", "daisy", "bee"];
var SCENES = SCENE_LIST.map(function(s) {
  return { id: s.id, name: s.label };
});
var CARD_KEYS = ["demo", "query", "height", "scene"];
var OPTIONAL_SENSORS = ["extra", "timetable", "kit", "lunch", "printer", "letter", "music", "rain", "trips"];
function cfgError(msg) {
  return new Error("family-dashboard-card: " + msg);
}
function hexColour(v, i) {
  if (v == null || v === "") return PALETTE[i % PALETTE.length];
  if (Array.isArray(v) && v.length === 3) return rgbHex(v);
  const s = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  throw cfgError("people[" + i + '].col must be a hex colour like "#7FC8D2", got ' + JSON.stringify(v));
}
function rgbHex(a) {
  return "#" + a.map(function(n) {
    const h = Math.max(0, Math.min(255, Math.round(+n || 0))).toString(16);
    return h.length < 2 ? "0" + h : h;
  }).join("");
}
function calendarsOf(p, i) {
  const v = p.calendar != null ? p.calendar : p.calendars;
  if (v == null || v === "") return [];
  const list = Array.isArray(v) ? v : [v];
  list.forEach(function(id) {
    if (typeof id !== "string" || !/^calendar\.[a-z0-9_]+$/.test(id))
      throw cfgError("people[" + i + "].calendar must be a calendar entity id like calendar.family, got " + JSON.stringify(id));
  });
  return list.filter(function(id, k) {
    return list.indexOf(id) === k;
  });
}
function normPerson(p, i) {
  if (!p || typeof p !== "object" || Array.isArray(p)) throw cfgError("people[" + i + "] must be an object with at least a name");
  const name = typeof p.name === "string" ? p.name.trim() : typeof p.name === "number" ? String(p.name) : "";
  if (!name) throw cfgError("people[" + i + "] needs a name");
  const look = p.look == null || p.look === "" ? LOOKS[i % 6] : String(p.look);
  if (LOOKS.indexOf(look) < 0) throw cfgError(name + ": look must be one of " + LOOKS.join(", ") + ", got " + JSON.stringify(p.look));
  const out = Object.assign({}, p);
  out.name = name;
  out.look = look;
  out.col = hexColour(p.col, i);
  if (p.role != null) {
    if (p.role !== "adult" && p.role !== "kid") throw cfgError(name + ": role must be adult or kid, got " + JSON.stringify(p.role));
    if (p.adult == null) out.adult = p.role === "adult";
  }
  out.adult = !!out.adult;
  out.r = isFinite(+p.r) && +p.r > 0 ? +p.r : out.adult ? 37 : 34;
  out.tg = isFinite(+p.tg) && +p.tg > 0 ? +p.tg : LOOK_TG[look] || 2.3;
  out.calendars = calendarsOf(p, i);
  out.timetable = schoolSource(p.timetable, TIMETABLE_ATTR, name, "timetable");
  out.lunch = schoolSource(p.lunch, LUNCH_ATTR, name, "lunch");
  out.choice = lunchChoiceConf(p.choice, name);
  delete out.calendar;
  delete out.role;
  return out;
}
function schoolSource(v, attr, name, key) {
  if (v == null || v === "") return null;
  const o = typeof v === "string" ? { entity: v } : v && typeof v === "object" && !Array.isArray(v) ? v : null;
  const bad = name + ": " + key + " must be a sensor entity id like sensor.kid_" + key + ", or { entity, attribute }, got " + JSON.stringify(v);
  if (!o || typeof o.entity !== "string" || !/^sensor\.[a-z0-9_]+$/.test(o.entity.trim())) throw cfgError(bad);
  if (o.attribute != null && (typeof o.attribute !== "string" || !o.attribute.trim())) throw cfgError(name + ": " + key + ".attribute must be an attribute name, got " + JSON.stringify(o.attribute));
  return { entity: o.entity.trim(), attribute: o.attribute ? o.attribute.trim() : attr };
}
function lunchChoiceConf(v, name) {
  if (v == null || v === "") return null;
  if (typeof v === "string") return /^[a-z_]+\.[a-z0-9_]+$/.test(v.trim()) ? { entity: v.trim() } : { value: v.trim() };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    if (typeof v.entity === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(v.entity)) return { entity: v.entity };
    const days = {};
    Object.keys(v).forEach(function(k) {
      const key = String(k).toLowerCase().slice(0, 3);
      if (DAY_KEYS.indexOf(key) < 0 || typeof v[k] !== "string") throw cfgError(name + ": choice days must be weekdays mapped to words, like { fri: packed }, got " + JSON.stringify(k) + ": " + JSON.stringify(v[k]));
      days[key] = v[k];
    });
    return { days };
  }
  throw cfgError(name + ": choice must be a word (packed, school), a weekday map or an entity id, got " + JSON.stringify(v));
}
var WARNED = {};
function warnOnce(msg) {
  if (WARNED[msg]) return;
  WARNED[msg] = 1;
  console.warn("family-dashboard-card: " + msg);
}
function normalize(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw cfgError("config must be an object");
  if (raw.people != null && !Array.isArray(raw.people)) throw cfgError("people must be a list");
  if (raw.people && !raw.people.length) throw cfgError("people needs at least one person (the last one is the household)");
  ["sensors", "view", "dates", "schoolWho", "rainStates"].forEach(function(k) {
    if (raw[k] != null && (typeof raw[k] !== "object" || Array.isArray(raw[k]))) throw cfgError(k + " must be a mapping of keys to values");
  });
  const people = (raw.people || DEFAULTS.people).map(normPerson);
  const names = people.map(function(p) {
    return p.name;
  });
  names.forEach(function(n, i) {
    if (names.indexOf(n) !== i) throw cfgError("two people are called " + JSON.stringify(n) + "; names must be unique");
  });
  const calendarMode = people.some(function(p) {
    return p.calendars.length;
  });
  const out = {};
  Object.keys(DEFAULTS).forEach(function(k) {
    const d = DEFAULTS[k], v = raw[k];
    if (v === void 0) out[k] = d;
    else out[k] = d && v && typeof d === "object" && typeof v === "object" && !Array.isArray(d) && !Array.isArray(v) ? Object.assign({}, d, v) : v;
  });
  CARD_KEYS.forEach(function(k) {
    if (raw[k] !== void 0) out[k] = raw[k];
  });
  out.people = people;
  out.demo = raw.demo === true;
  out.calendarMode = calendarMode && !out.demo;
  if (calendarMode) {
    const s = Object.assign({}, DEFAULTS.sensors);
    OPTIONAL_SENSORS.forEach(function(k) {
      s[k] = null;
    });
    s.week = null;
    out.sensors = Object.assign(s, raw.sensors || {});
    out.view = Object.assign({ home: null, music: null, printer: null, office: null }, raw.view || {});
    if (!raw.dates) out.dates = { birthdays: {}, fixed: DEFAULTS.dates.fixed };
    if (!raw.anniversary) out.anniversary = names.slice(0, 2);
  }
  Object.keys(out.sensors).forEach(function(k) {
    const v = out.sensors[k];
    if (v === "" || v === void 0) out.sensors[k] = null;
    else if (v !== null && typeof v !== "string") throw cfgError("sensors." + k + " must be an entity id or null, got " + JSON.stringify(v));
  });
  out.schoolOrphans = [];
  ["timetable", "lunch"].forEach(function(k) {
    const id = out.sensors[k];
    if (!id) return;
    const who = out.schoolWho && out.schoolWho[k], owner = people.filter(function(p) {
      return p.name === who;
    })[0];
    if (owner) {
      if (!owner[k]) owner[k] = { entity: id, attribute: k === "timetable" ? TIMETABLE_ATTR : LUNCH_ATTR, legacy: true };
      return;
    }
    if (raw.sensors && raw.sensors[k] || raw.schoolWho && raw.schoolWho[k]) {
      warnOnce("sensors." + k + " (" + id + ") belongs to schoolWho." + k + " = " + JSON.stringify(who) + ", who is not in people. Set people[]." + k + " on the child instead.");
      out.schoolOrphans.push({ key: k, entity: id, who: who == null ? null : String(who) });
    }
  });
  if (!out.demo && !calendarMode && !out.sensors.week)
    throw cfgError("give at least one person a calendar (people[].calendar), or set sensors.week, or set demo: true");
  out.scene = out.scene == null ? SCENES[0].id : out.scene;
  if (!SCENES.some(function(s) {
    return s.id === out.scene;
  }))
    throw cfgError("scene must be one of " + SCENES.map(function(s) {
      return s.id;
    }).join(", ") + ", got " + JSON.stringify(out.scene));
  const kids = people.filter(function(p) {
    return p.school;
  }).map(function(p) {
    return p.name;
  });
  const line = (Array.isArray(out.schoolLine) ? out.schoolLine : []).filter(function(n) {
    return kids.indexOf(n) >= 0;
  });
  out.schoolLine = line.concat(kids.filter(function(n) {
    return line.indexOf(n) < 0;
  }));
  out.sourceOwner = (Array.isArray(out.sourceOwner) ? out.sourceOwner : []).map(function(p) {
    if (!Array.isArray(p) || p.length < 2) throw cfgError("sourceOwner entries must be [pattern, name] pairs");
    return [p[0] instanceof RegExp ? p[0] : new RegExp(String(p[0]), "i"), p[1]];
  });
  return out;
}
function stubConfig(hass) {
  const states = hass && hass.states || {};
  const ids = Object.keys(states).sort();
  const cals = ids.filter(function(id) {
    return id.indexOf("calendar.") === 0;
  });
  const shared = /family|home|house|holiday|birthday/;
  const own = cals.filter(function(id) {
    return !shared.test(id);
  });
  const people = clone(DEFAULTS.people);
  const last = people.length - 1;
  function toHouse(id) {
    const h = people[last];
    h.calendar = h.calendar ? [].concat(h.calendar, id) : id;
  }
  if (cals.length === 1) toHouse(cals[0]);
  else {
    own.forEach(function(id, i) {
      if (i < last) people[i].calendar = id;
      else toHouse(id);
    });
    cals.filter(function(id) {
      return shared.test(id);
    }).forEach(toHouse);
  }
  const weather = states["weather.forecast_home"] ? "weather.forecast_home" : ids.filter(function(id) {
    return id.indexOf("weather.") === 0;
  })[0] || null;
  const cfg = { demo: true, people };
  if (cals.length) cfg.sensors = { weather };
  return cfg;
}
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

// src/editor.js
var EDITOR_LOOKS = CREATURES.filter(function(c) {
  return c.editor;
}).map(function(c) {
  return c.id;
});
var ACCESSORY_LABELS = { glasses: "Glasses", phones: "Headphones", daisy: "Daisy", bee: "Bee (one person only)" };
var SENSOR_FIELDS = [
  ["weather", "weather", "Weather"],
  ["music", "media_player", "Music speaker (the meadow dances)"],
  ["letter", "input_text", "Letter helper (the postie)"],
  ["trips", "calendar", "Trips calendar (Holiday events become countdowns)"],
  ["printer", null, "3D printer sensor prefix (Bambu Lab)"],
  ["extra", "sensor", "School data (family_extra)"],
  ["kit", "sensor", "School kit"]
];
var LABELS = {
  name: "Name",
  role: "Role",
  look: "Animal",
  col: "Colour",
  calendar: "Calendar",
  accessories: "Accessories",
  school: "Goes to school",
  timetable: "Timetable sensor",
  lunch: "Lunch menu sensor",
  demo: "Demo cast (no Home Assistant data)",
  scene: "Scene",
  week: "Week template sensor (v1.0.0 setups)"
};
SENSOR_FIELDS.forEach(function(f) {
  LABELS[f[0]] = f[2];
});
function hexRgb(h) {
  const v = parseInt(String(h).slice(1), 16);
  return [v >> 16, v >> 8 & 255, v & 255];
}
function entityField(name, domain) {
  return domain ? { name, selector: { entity: { filter: { domain } } } } : { name, selector: { text: {} } };
}
var TOP_SCHEMA = [{ type: "grid", name: "", schema: [
  { name: "scene", required: true, selector: { select: { mode: "dropdown", options: SCENES.map(function(s) {
    return { value: s.id, label: s.name };
  }) } } },
  { name: "demo", selector: { boolean: {} } }
] }];
var PERSON_BASE = [
  { type: "grid", name: "", schema: [
    { name: "name", required: true, selector: { text: {} } },
    { name: "role", required: true, selector: { select: { mode: "dropdown", options: [{ value: "adult", label: "Adult" }, { value: "kid", label: "Kid" }] } } }
  ] },
  { type: "grid", name: "", schema: [
    { name: "look", required: true, selector: { select: { mode: "dropdown", options: EDITOR_LOOKS.map(function(l) {
      return { value: l, label: CREATURE[l].label };
    }) } } },
    { name: "col", selector: { color_rgb: {} } }
  ] },
  { name: "calendar", selector: { entity: { multiple: true, filter: { domain: "calendar" } } } },
  { name: "accessories", selector: { select: { multiple: true, mode: "list", options: ACCESSORIES.map(function(a) {
    return { value: a, label: ACCESSORY_LABELS[a] };
  }) } } },
  { name: "school", selector: { boolean: {} } }
];
var SCHOOL_FIELDS = [{ type: "grid", name: "", schema: [entityField("timetable", "sensor"), entityField("lunch", "sensor")] }];
function personSchema(school) {
  return school ? PERSON_BASE.concat(SCHOOL_FIELDS) : PERSON_BASE;
}
function entityOf(v) {
  return v == null || v === "" ? "" : typeof v === "string" ? v : v.entity || "";
}
function sensorSchema(withWeek) {
  const s = SENSOR_FIELDS.map(function(f) {
    return entityField(f[0], f[1]);
  });
  return withWeek ? [entityField("week", "sensor")].concat(s) : s;
}
function flatFields(schema) {
  return [].concat.apply([], schema.map(function(f) {
    return f.type === "grid" ? flatFields(f.schema) : [f];
  }));
}
function makeForm(schema, onChange) {
  if (customElements.get("ha-form")) {
    const f = document.createElement("ha-form");
    f.schema = schema;
    f.computeLabel = function(s) {
      return LABELS[s.name] || s.name;
    };
    f.addEventListener("value-changed", function(e) {
      e.stopPropagation();
      onChange(e.detail.value);
    });
    return { el: f, set: function(d) {
      f.data = d;
    }, hass: function(h) {
      f.hass = h;
    } };
  }
  const box = document.createElement("div");
  box.className = "plain";
  let data = {}, hass = null;
  const inputs = flatFields(schema).map(function(s) {
    const sel = s.selector, row = document.createElement("label"), cap = document.createElement("span"), kind = Object.keys(sel)[0];
    cap.textContent = LABELS[s.name] || s.name;
    row.appendChild(cap);
    let get, put, el;
    if (kind === "boolean") {
      el = document.createElement("input");
      el.type = "checkbox";
      row.className = "check";
      get = function() {
        return el.checked;
      };
      put = function(v) {
        el.checked = !!v;
      };
    } else if (kind === "select" && sel.select.multiple) {
      el = document.createElement("span");
      const boxes = sel.select.options.map(function(o) {
        const l = document.createElement("label"), c = document.createElement("input");
        c.type = "checkbox";
        c.value = o.value;
        l.appendChild(c);
        l.appendChild(document.createTextNode(" " + o.label));
        el.appendChild(l);
        return c;
      });
      get = function() {
        return boxes.filter(function(c) {
          return c.checked;
        }).map(function(c) {
          return c.value;
        });
      };
      put = function(v) {
        boxes.forEach(function(c) {
          c.checked = (v || []).indexOf(c.value) >= 0;
        });
      };
    } else if (kind === "select") {
      el = document.createElement("select");
      sel.select.options.forEach(function(o) {
        const op = document.createElement("option");
        op.value = o.value;
        op.textContent = o.label;
        el.appendChild(op);
      });
      get = function() {
        return el.value;
      };
      put = function(v) {
        el.value = v == null ? "" : v;
      };
    } else if (kind === "color_rgb") {
      el = document.createElement("input");
      el.type = "color";
      get = function() {
        return hexRgb(el.value);
      };
      put = function(v) {
        el.value = Array.isArray(v) ? rgbHex(v) : "#888888";
      };
    } else {
      el = document.createElement("input");
      el.type = "text";
      const multi = kind === "entity" && sel.entity.multiple;
      if (kind === "entity") {
        el.placeholder = sel.entity.filter.domain + "." + (multi ? " (comma between several)" : "");
        el.setAttribute("list", "fd-" + sel.entity.filter.domain);
      }
      get = function() {
        const v = el.value.trim();
        return multi ? v.split(/\s*,\s*/).filter(Boolean) : v;
      };
      put = function(v) {
        el.value = Array.isArray(v) ? v.join(", ") : v == null ? "" : v;
      };
    }
    el.addEventListener("change", function() {
      const d = Object.assign({}, data);
      d[s.name] = get();
      data = d;
      onChange(d);
    });
    row.appendChild(el);
    box.appendChild(row);
    return { put: function() {
      put(data[s.name]);
    }, domain: kind === "entity" && sel.entity.filter.domain };
  });
  function lists() {
    if (!hass) return;
    inputs.forEach(function(i) {
      if (!i.domain || box.querySelector("#fd-" + i.domain)) return;
      const dl = document.createElement("datalist");
      dl.id = "fd-" + i.domain;
      Object.keys(hass.states).filter(function(id) {
        return id.indexOf(i.domain + ".") === 0;
      }).sort().forEach(function(id) {
        const o = document.createElement("option");
        o.value = id;
        dl.appendChild(o);
      });
      box.appendChild(dl);
    });
  }
  return {
    el: box,
    set: function(d) {
      data = d || {};
      inputs.forEach(function(i) {
        i.put();
      });
    },
    hass: function(h) {
      const first = !hass;
      hass = h;
      if (first) lists();
    }
  };
}
var EDITOR_STYLE = `
  :host { display: block; }
  .sec { margin: 0 0 18px; }
  .sec > h3 { margin: 0 0 6px; font-size: 15px; font-weight: 500; }
  .hint { margin: 0 0 10px; color: var(--secondary-text-color); font-size: 13px; }
  .person { border: 1px solid var(--divider-color, #ddd); border-radius: 12px; padding: 10px 12px 12px; margin: 0 0 10px; }
  .phead { display: flex; align-items: center; gap: 6px; margin: 0 0 6px; }
  .phead b { flex: 1; font-weight: 500; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex: none; }
  button { font: inherit; font-size: 13px; padding: 4px 10px; border-radius: 16px; cursor: pointer;
    border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff); color: var(--primary-text-color, #222); }
  button.add { color: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4); }
  button:disabled { opacity: .35; cursor: default; }
  .plain label { display: block; margin: 0 0 8px; }
  .plain label > span:first-child { display: block; font-size: 12px; color: var(--secondary-text-color, #666); }
  .plain label.check { display: flex; gap: 8px; align-items: center; flex-direction: row-reverse; justify-content: flex-end; }
  .plain label.check > span:first-child { font-size: 14px; color: inherit; }
  .plain input[type=text], .plain select { width: 100%; box-sizing: border-box; padding: 6px; font: inherit; }
  .plain span > label { display: inline-block; margin-right: 12px; }
`;
var FamilyDashboardCardEditor = class extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._forms = null;
    this.attachShadow({ mode: "open" });
  }
  setConfig(config) {
    this._config = clone(config || {});
    this._update();
  }
  set hass(h) {
    this._hass = h;
    if (this._forms) this._forms.all.forEach(function(f) {
      f.hass(h);
    });
  }
  _people() {
    return Array.isArray(this._config.people) && this._config.people.length ? this._config.people : clone(DEFAULTS.people);
  }
  _emit(cfg) {
    this._config = cfg;
    this._update();
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  // Rebuilds the DOM only when the cast changes size, so typing never loses focus.
  _update() {
    if (!this._config) return;
    const people = this._people(), withWeek = !!(this._config.sensors && this._config.sensors.week) || Array.isArray(this._config.people) && !this._config.people.some(function(p) {
      return p && (p.calendar || p.calendars);
    });
    const mask = people.map(function(p) {
      return p && p.school ? 1 : 0;
    }).join("");
    if (!this._forms || this._forms.n !== people.length || this._forms.week !== withWeek || this._forms.mask !== mask) this._build(people.length, withWeek, mask);
    let eff = null;
    try {
      eff = normalize(this._config);
    } catch (e) {
      eff = null;
    }
    const sensors = eff ? eff.sensors : Object.assign({}, this._config.sensors);
    this._forms.top.set({ scene: this._config.scene || SCENES[0].id, demo: this._config.demo === true });
    this._forms.sensors.set(sensors);
    const self = this;
    this._shown = [];
    people.forEach(function(p, i) {
      const cal = p.calendar != null ? p.calendar : p.calendars;
      const ep = eff && eff.people[i], shown = {};
      ["timetable", "lunch"].forEach(function(k) {
        shown[k] = entityOf(p[k]) || (ep && ep[k] && ep[k].legacy ? ep[k].entity : "");
        shown[k + "Legacy"] = !entityOf(p[k]) && !!shown[k];
      });
      self._shown[i] = shown;
      self._forms.people[i].set({
        timetable: shown.timetable,
        lunch: shown.lunch,
        name: p.name == null ? "" : String(p.name),
        role: p.adult || p.role === "adult" ? "adult" : "kid",
        look: EDITOR_LOOKS.indexOf(p.look) >= 0 ? p.look : p.look || "crow",
        col: hexRgb(/^#[0-9a-f]{6}$/i.test(p.col || "") ? p.col : PALETTE[i % PALETTE.length]),
        calendar: cal == null || cal === "" ? [] : [].concat(cal),
        accessories: ACCESSORIES.filter(function(a) {
          return p[a];
        }),
        school: !!p.school
      });
      self._forms.heads[i].querySelector(".dot").style.background = /^#[0-9a-f]{6}$/i.test(p.col || "") ? p.col : PALETTE[i % PALETTE.length];
      self._forms.heads[i].querySelector("b").textContent = (p.name || "Unnamed") + (i === people.length - 1 && people.length > 1 ? " (household)" : "");
    });
  }
  _build(n, withWeek, mask) {
    const self = this, sr = this.shadowRoot;
    sr.innerHTML = "<style>" + EDITOR_STYLE + "</style>";
    const F = { n, week: withWeek, mask, people: [], heads: [], all: [] };
    function sec(title, hint) {
      const s = document.createElement("div");
      s.className = "sec";
      s.innerHTML = "<h3>" + title + "</h3>" + (hint ? '<p class="hint">' + hint + "</p>" : "");
      sr.appendChild(s);
      return s;
    }
    F.top = makeForm(TOP_SCHEMA, function(d) {
      const c = clone(self._config);
      if (d.demo) c.demo = true;
      else delete c.demo;
      if (d.scene && d.scene !== SCENES[0].id) c.scene = d.scene;
      else delete c.scene;
      self._emit(c);
    });
    sec("Scene", "The meadow has the village: school, workshop, bandstand and cottage. The seaside has the promenade and beach huts, the pier and its band, a boat shed and a lighthouse. Winter village, Forest camp and Space station are coming. The demo cast runs on made-up data, so turn it off to see your calendars.").appendChild(F.top.el);
    const ps = sec("People", "One creature each. Give each person their calendar. The last one is the household: bin day and anything nobody owns.");
    for (let i = 0; i < n; i++) {
      const box = document.createElement("div");
      box.className = "person";
      const head = document.createElement("div");
      head.className = "phead";
      head.innerHTML = '<span class="dot"></span><b></b>';
      [["Up", -1], ["Down", 1]].forEach(function(b) {
        const bt = document.createElement("button");
        bt.textContent = b[0];
        bt.disabled = i + b[1] < 0 || i + b[1] >= n;
        bt.addEventListener("click", function() {
          self._move(i, b[1]);
        });
        head.appendChild(bt);
      });
      const rm = document.createElement("button");
      rm.textContent = "Remove";
      rm.disabled = n < 2;
      rm.addEventListener("click", function() {
        self._remove(i);
      });
      head.appendChild(rm);
      const f = makeForm(personSchema(mask && mask[i] === "1"), function(d) {
        self._person(i, d);
      });
      box.appendChild(head);
      box.appendChild(f.el);
      ps.appendChild(box);
      F.people.push(f);
      F.heads.push(head);
    }
    const add = document.createElement("button");
    add.className = "add";
    add.textContent = "Add person";
    add.addEventListener("click", function() {
      self._add();
    });
    ps.appendChild(add);
    F.sensors = makeForm(sensorSchema(withWeek), function(d) {
      self._sensors(d);
    });
    sec("Sensors", "All optional. Leave one empty and that part of the scene stays off. A sensor that is set but missing says unavailable on the cards.").appendChild(F.sensors.el);
    F.all = [F.top, F.sensors].concat(F.people);
    this._forms = F;
    if (this._hass) F.all.forEach(function(f) {
      f.hass(self._hass);
    });
  }
  _person(i, d) {
    const c = clone(this._config), people = clone(this._people()), p = people[i];
    if (d.name != null) p.name = d.name;
    if (d.role === "adult") p.adult = true;
    else delete p.adult;
    delete p.role;
    if (d.look && d.look !== p.look) {
      p.look = d.look;
      if (LOOK_TG[d.look]) p.tg = LOOK_TG[d.look];
      else delete p.tg;
    }
    if (Array.isArray(d.col) && rgbHex(d.col) !== String(p.col || "").toLowerCase()) p.col = rgbHex(d.col);
    const cal = (d.calendar == null ? [] : [].concat(d.calendar)).filter(Boolean);
    delete p.calendars;
    if (!cal.length) delete p.calendar;
    else p.calendar = cal.length === 1 ? cal[0] : cal;
    const acc = d.accessories || [];
    ACCESSORIES.forEach(function(a) {
      if (acc.indexOf(a) >= 0) p[a] = true;
      else delete p[a];
    });
    if (p.bee) people.forEach(function(q, k) {
      if (k !== i) delete q.bee;
    });
    if (d.school) p.school = true;
    else delete p.school;
    const shown = this._shown && this._shown[i] || {};
    ["timetable", "lunch"].forEach(function(k) {
      if (!(k in d)) return;
      const v = (d[k] || "").trim();
      if (v === (shown[k] || "")) return;
      if (!v) {
        delete p[k];
        if (shown[k + "Legacy"]) {
          c.sensors = Object.assign({}, c.sensors || {});
          c.sensors[k] = null;
        }
      } else if (p[k] && typeof p[k] === "object") p[k] = Object.assign({}, p[k], { entity: v });
      else p[k] = v;
    });
    c.people = people;
    this._emit(c);
  }
  _add() {
    const c = clone(this._config), people = clone(this._people()), n = people.length;
    let k = n, name;
    do {
      name = "Person " + k++;
    } while (people.some(function(p2) {
      return p2.name === name;
    }));
    const look = EDITOR_LOOKS[n % 6];
    const p = { name, col: PALETTE[n % PALETTE.length], look, tg: LOOK_TG[look], adult: false };
    people.splice(Math.max(0, n - 1), 0, p);
    c.people = people;
    this._emit(c);
  }
  _remove(i) {
    const c = clone(this._config), people = clone(this._people());
    people.splice(i, 1);
    c.people = people;
    this._emit(c);
  }
  _move(i, d) {
    const c = clone(this._config), people = clone(this._people()), j = i + d;
    if (j < 0 || j >= people.length) return;
    const t = people[i];
    people[i] = people[j];
    people[j] = t;
    c.people = people;
    this._emit(c);
  }
  _sensors(d) {
    const c = clone(this._config), prev = (function() {
      try {
        return normalize(c).sensors;
      } catch (e) {
        return c.sensors || {};
      }
    })();
    const s = Object.assign({}, c.sensors || {});
    Object.keys(d).forEach(function(k) {
      const v = d[k] === "" || d[k] == null ? null : d[k];
      if (v !== (prev[k] == null ? null : prev[k])) s[k] = v;
    });
    c.sensors = s;
    this._emit(c);
  }
};
if (!customElements.get("family-dashboard-card-editor")) customElements.define("family-dashboard-card-editor", FamilyDashboardCardEditor);
function loadFormParts() {
  if (customElements.get("ha-form")) return Promise.resolve();
  const helpers = window.loadCardHelpers ? window.loadCardHelpers() : Promise.reject(new Error("no loadCardHelpers"));
  const load = helpers.then(function(h) {
    return h.createCardElement({ type: "entities", entities: [] });
  }).then(function(c) {
    return c && c.constructor && c.constructor.getConfigElement ? c.constructor.getConfigElement() : null;
  }).then(function() {
    return customElements.whenDefined("ha-form");
  }).catch(function(e) {
    console.warn("family-dashboard-card: ha-form not available, using plain inputs", e);
  });
  return Promise.race([load, new Promise(function(r) {
    setTimeout(r, 2e3);
  })]);
}

// src/calendar.js
function weekRange(d) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { start: a, end: new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7) };
}
function calendarPath(id, range) {
  return "calendars/" + id + "?start=" + encodeURIComponent(range.start.toISOString()) + "&end=" + encodeURIComponent(range.end.toISOString());
}
function localYmd(d) {
  return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
}
function parseCalendarEvents(evs, who, range) {
  if (!Array.isArray(evs)) throw new Error("calendar answer is not a list");
  const first = localYmd(range.start);
  return evs.map(function(e) {
    if (!e || !e.start) return null;
    const allDay = !!e.start.date && !e.start.dateTime, s = String(allDay ? e.start.date : e.start.dateTime || "");
    if (!/^\d{4}-\d\d-\d\d/.test(s)) return null;
    let day = s.slice(0, 10);
    if (day < first) day = first;
    return {
      who,
      what: String(e.summary || "Busy"),
      day,
      all_day: allDay,
      start: allDay ? day : s,
      at: allDay ? "" : s.slice(11, 16)
    };
  }).filter(function(r) {
    return r;
  });
}

// src/engine/engine.js
function engine(ROOT, WRAP, CONFIG, HOOKS, HA) {
  "use strict";
  var PEOPLE = CONFIG.people, ANNIVERSARY = CONFIG.anniversary, SENSORS = CONFIG.sensors, SCHOOL_WHO = CONFIG.schoolWho, SOURCE_OWNER = CONFIG.sourceOwner, SCHOOL_LINE = CONFIG.schoolLine, RAIN_STATES = CONFIG.rainStates, DATES = CONFIG.dates, VIEW = CONFIG.view, OFFICE_URL = CONFIG.officeUrl;
  var Q = HOOKS ? "?" + String(HOOKS).replace(/^\?/, "") : "";
  var DEMO = CONFIG.demo === true || /[?&]demo\b/.test(Q);
  var TIMERS2 = [], STOPPED = false, STARTED = false, RAF = 0;
  function setInterval(f, ms) {
    var id = window.setInterval(f, ms);
    TIMERS2.push(id);
    return id;
  }
  function requestAnimationFrame(f) {
    if (!STOPPED) RAF = window.requestAnimationFrame(f);
    return RAF;
  }
  var HOUR = (Q.match(/[?&]hour=([\d.]+)/) || [])[1];
  var DATE = (Q.match(/[?&]date=(\d{4}-\d\d-\d\d)/) || [])[1];
  var OPEN = (Q.match(/[?&]open=([^&]+)/) || [])[1];
  if (OPEN) OPEN = decodeURIComponent(OPEN.replace(/\+/g, " "));
  var WFORCE = (Q.match(/[?&]weather=(\w+)/) || [])[1];
  var PFORCE = (Q.match(/[?&]party=([^&]+)/) || [])[1];
  var PRFORCE = (Q.match(/[?&]printer=([\w:.]+)/) || [])[1];
  var LFORCE = (Q.match(/[?&]letter=([^&]+)/) || [])[1];
  var FPS = /[?&]fps\b/.test(Q);
  var MFORCE = (Q.match(/[?&]music=(\w+)/) || [])[1];
  var OFORCE = (Q.match(/[?&]office=([^&]+)/) || [])[1];
  var WARM = +(Q.match(/[?&]warm=([\d.]+)/) || [])[1] || 0;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function now() {
    var d = /* @__PURE__ */ new Date();
    if (DATE) d.setFullYear(+DATE.slice(0, 4), +DATE.slice(5, 7) - 1, +DATE.slice(8, 10));
    if (HOUR) {
      var h = parseFloat(HOUR);
      d.setHours(h | 0, Math.round(h % 1 * 60), 0, 0);
    }
    return d;
  }
  function dayLabel(ds) {
    var t = now(), today = ymd(t), tm = new Date(t.getTime() + 864e5);
    if (ds === today) return "Today";
    if (ds === ymd(tm)) return "Tomorrow";
    var d = /* @__PURE__ */ new Date(ds + "T12:00:00"), days = (d - t) / 864e5;
    return DAYS[d.getDay()] + " " + d.getDate() + (days > 6 ? " " + MONTHS[d.getMonth()] : "");
  }
  function foodSprite(berry) {
    var s = 18 * K, c = canvas(s * 2, s * 2), g = c.getContext("2d"), x = s, y = s * 1.3;
    g.strokeStyle = "#3F8A4A";
    g.lineWidth = 1.6 * K;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y + s * 0.5);
    g.quadraticCurveTo(x + 2 * K, y, x, y - s * 0.2);
    g.stroke();
    if (berry) {
      rimmed(g, "#2E6B38", "#6CC070", K, function(e) {
        g.beginPath();
        g.ellipse(x - s * 0.3, y - s * 0.2, s * 0.32 + e, s * 0.18 + e, -0.5, 0, 7);
        g.fill();
      });
      [[-0.05, -0.45], [0.28, -0.28], [0.1, -0.1]].forEach(function(p) {
        rimmed(g, "#A3263E", "#F0506E", K, function(e) {
          g.beginPath();
          g.arc(x + s * p[0], y + s * p[1], s * 0.19 + e, 0, 7);
          g.fill();
        });
        g.fillStyle = "rgba(255,255,255,.8)";
        g.beginPath();
        g.arc(x + s * p[0] - s * 0.06, y + s * p[1] - s * 0.06, s * 0.05, 0, 7);
        g.fill();
      });
    } else {
      [-2.2, -0.95, 0.3].forEach(function(a) {
        var lx = x, ly = y - s * 0.25;
        rimmed(g, "#2E6B38", "#72C878", K, function(e) {
          g.beginPath();
          g.arc(lx + Math.cos(a) * s * 0.3, ly + Math.sin(a) * s * 0.3, s * 0.28 + e, 0, 7);
          g.fill();
        });
      });
    }
    return { c, ax: x, ay: y + s * 0.5, k: K };
  }
  function shadowSprite() {
    var c = canvas(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32), sh = SCENE.shadow || "30,70,40";
    gr.addColorStop(0, "rgba(" + sh + ",.32)");
    gr.addColorStop(1, "rgba(" + sh + ",0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  function glowSprite() {
    var c = canvas(32, 32), g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 1, 16, 16, 16);
    gr.addColorStop(0, "rgba(255,250,190,1)");
    gr.addColorStop(0.25, "rgba(230,255,140,.7)");
    gr.addColorStop(1, "rgba(200,255,120,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return c;
  }
  function cloudSprite(w) {
    var c = canvas(w, w * 0.5), g = c.getContext("2d");
    g.fillStyle = "rgba(255,255,255,.92)";
    [[0.3, 0.62, 0.2], [0.5, 0.45, 0.26], [0.7, 0.6, 0.2], [0.5, 0.68, 0.2]].forEach(function(p) {
      g.beginPath();
      g.arc(w * p[0], w * 0.5 * p[1], w * p[2] * 0.5 + w * 0.02, 0, 7);
      g.fill();
    });
    return c;
  }
  var cv = ROOT.getElementById("world"), ctx = cv.getContext("2d");
  var W, H, DPR, HZ, TOP, BG, POND;
  var LAY = {}, ZONES = [];
  var SCENE = SCENE_BY_ID[CONFIG.scene] || SCENE_LIST[0], VIL = !!SCENE.village, GRAZE = !!SCENE.grazers;
  var PATCH = [], ROAM = [], HOME = null, EXIT = null;
  var SV = {
    place: function(L) {
      LAY = L.lay || {};
      DOORS = L.doors || {};
      ZONES = L.zones || [];
      POND = L.water || null;
      PATCH = L.patch;
      ROAM = L.roam;
      HOME = L.home;
      EXIT = L.exit;
      SV.lay = LAY;
      SV.layout = L;
    },
    inZone: function(x, y, pad) {
      return inZone(x, y, pad);
    },
    blit: function(spr, x, y, face2, sx, sy, sc, rot) {
      blit(spr, x, y, face2, sx, sy, sc, rot);
    },
    puff: function(kind, x, y, n, col) {
      puff(kind, x, y, n, col);
    },
    say: function(txt, x, y) {
      say(txt, x, y);
    },
    depth: function(y) {
      return depth(y);
    },
    now: function() {
      return now();
    },
    rand,
    sprites: {},
    fam: [],
    WX: null,
    DARK: 0,
    nightness: 0,
    time: 0
  };
  function bakeBackground() {
    var c = canvas(W * DPR, H * DPR), g = c.getContext("2d");
    g.scale(DPR, DPR);
    SV.W = W;
    SV.H = H;
    SV.HZ = HZ;
    SV.TOP = TOP;
    SV.DPR = DPR;
    SCENE.bake(g, SV);
    BG = c;
  }
  function inZone(x, y, pad) {
    for (var i = 0; i < ZONES.length; i++) {
      var z = ZONES[i], dx = (x - z.x) / (z.rx + pad), dy = (y - z.y) / (z.ry + pad);
      if (dx * dx + dy * dy < 1) return z;
    }
    return null;
  }
  function inArea(a, x, y) {
    return a.has ? a.has(x, y) : x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1;
  }
  function inBounds(x, y, inner) {
    var A2 = inner ? PATCH : ROAM;
    for (var i = 0; i < A2.length; i++) if (inArea(A2[i], x, y)) return true;
    return false;
  }
  function pickArea(A2) {
    if (A2.length === 1) return A2[0];
    var tot = 0, i;
    for (i = 0; i < A2.length; i++) tot += A2[i].w || 1;
    var r = Math.random() * tot;
    for (i = 0; i < A2.length; i++) {
      r -= A2[i].w || 1;
      if (r < 0) return A2[i];
    }
    return A2[A2.length - 1];
  }
  function spot(inner) {
    var A2 = inner ? PATCH : ROAM;
    for (var i = 0; i < 40; i++) {
      var a = pickArea(A2), p = a.pick ? a.pick() : null;
      var x = p ? p.x : rand(a.x0, a.x1), y = p ? p.y : rand(a.y0, a.y1);
      if (!inZone(x, y, 30)) return { x, y };
    }
    return { x: HOME.x, y: HOME.y };
  }
  var DEPTH = SCENE.depth || [0.8, 0.2];
  function depth(y) {
    return DEPTH[0] + DEPTH[1] * Math.max(0, Math.min(1, (y - TOP) / (H - TOP)));
  }
  var SHADOW, GLOW, CLOUDS = [], FOOD_SPR, PUFF_LOOKS = [];
  var things = [], food = [], parts = [], flies = [];
  var fam = [], BEE_HOST = null;
  function makeSprites(o, fn) {
    fn = fn || creatureSprite;
    return { open: fn(o, "open"), shut: fn(o, "shut"), happy: fn(o, "happy") };
  }
  function spawn(kind, opts, x, y) {
    var p = x == null ? spot(kind === "fam") : { x, y };
    var t = {
      kind,
      x: p.x,
      y: p.y,
      tx: p.x,
      ty: p.y,
      wait: rand(0, 3),
      face: Math.random() < 0.5 ? -1 : 1,
      phase: rand(0, 6),
      hunger: rand(0.1, 0.6),
      blink: rand(1, 5),
      blinkT: 0,
      happy: 0,
      munch: 0,
      age: 0,
      grow: 1,
      alert: rand(0.35, 1),
      cool: rand(10, 30),
      chase: null,
      chaseT: 0,
      full: 0,
      flee: 0,
      jump: 0,
      idle: true,
      gait: 0,
      slide: 0,
      scared: 0,
      ycool: 0,
      yielding: false,
      sq: 0,
      sqv: 0,
      wasMoving: false,
      dipT: -1,
      dy: 0,
      diving: 0,
      peck: 0,
      shiny: null
    };
    for (var k in opts) t[k] = opts[k];
    things.push(t);
    return t;
  }
  function setup2() {
    SHADOW = shadowSprite();
    GLOW = glowSprite();
    FOOD_SPR = [foodSprite(false), foodSprite(true)];
    CLOUDS = [200, 150, 230].map(function(w, i2) {
      return { c: cloudSprite(w), x: rand(0, W), y: [16, 46, 26][i2], v: rand(4, 9) };
    });
    things = [];
    food = [];
    parts = [];
    var i;
    if (GRAZE) {
      PUFF_LOOKS = ["#FFF6D6", "#FFFFFF", "#FFE0D2", "#E8F4FF"].map(function(col) {
        return makeSprites({ r: 20, col, look: "puff", fluff: true }, classicSprite);
      });
      var FOX = makeSprites({ r: 25, col: "#F4A259", look: "fox" }, classicSprite);
      for (i = 0; i < 12; i++) spawn("puff", { r: 20, spr: pick(PUFF_LOOKS), speed: 34 });
      for (i = 0; i < 2; i++) spawn("nib", { r: 25, spr: FOX, speed: 30 });
    }
    fam = PEOPLE.map(function(p, i2) {
      var at = SCENE.start ? SCENE.start(i2, SV) : { x: null, y: null };
      return spawn("fam", { r: p.r, spr: makeSprites(p), rig: bakeRig(p), person: p, speed: p.look === "snail" ? 11 : 26, hunger: rand(0, 0.4) }, at.x, at.y);
    });
    SV.fam = fam;
    BEE_HOST = fam.filter(function(t) {
      return t.person.bee;
    })[0] || null;
    if (GRAZE) for (i = 0; i < 26; i++) addFood();
    ICON = makeIcons();
    BUBS = makeBubbles();
    if (VIL) {
      MFRONT = marketFront();
      SHOP = makeShop();
      VILLAGE = makeVillage();
    } else {
      VILLAGE = [];
      makeDrops();
    }
    PLANE = planeSprite();
    makeWeatherSprites();
    flies = [];
    if (GRAZE) for (i = 0; i < 16; i++) flies.push({ x: rand(0, W), y: rand(HZ, H), a: rand(0, 6), s: rand(0.4, 1) });
    if (SCENE.ambient) SCENE.ambient.setup(SV);
  }
  function addFood() {
    var p = spot();
    food.push({ x: p.x, y: p.y, spr: FOOD_SPR[Math.random() < 0.3 ? 1 : 0], grow: 0 });
  }
  function nearest(list, from, max, ok) {
    var best = null, bd = max;
    for (var i = 0; i < list.length; i++) {
      var o = list[i];
      if (ok && !ok(o)) continue;
      var d = dist(o, from);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
  function puff(kind, x, y, n, col) {
    for (var i = 0; i < n; i++) parts.push({ kind, x, y, vx: rand(-40, 40), vy: rand(-70, -20), life: 1, max: rand(0.6, 1.1), col });
  }
  function say(txt, x, y) {
    parts.push({ kind: "text", txt, x, y, vx: 0, vy: -26, life: 1.3, max: 1.3 });
  }
  var nightness = 0;
  function go(t, x, y) {
    t.tx = x;
    t.ty = y;
    t.idle = false;
  }
  function steer(t, speed, dt) {
    var dx = t.tx - t.x, dy = t.ty - t.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2) return true;
    var st = Math.min(d, speed * dt), ux = dx / d, uy = dy / d, pad = t.r * 0.6, mind = !t.pass;
    if (mind && inZone(t.tx, t.ty, pad)) return true;
    var inside = mind ? inZone(t.x, t.y, pad * 0.5) : null, nx, ny, z;
    if (inside) {
      var ox = t.x - inside.x, oy = t.y - inside.y, ol = Math.sqrt(ox * ox + oy * oy) || 1;
      nx = t.x + ox / ol * st;
      ny = t.y + oy / ol * st;
    } else {
      nx = t.x + ux * st;
      ny = t.y + uy * st;
      z = mind ? inZone(nx, ny, pad) : null;
      if (z) {
        var ax = z.rx + pad, ay = z.ry + pad, gx = (nx - z.x) / (ax * ax), gy = (ny - z.y) / (ay * ay), gl = Math.sqrt(gx * gx + gy * gy) || 1;
        var sx = -gy / gl, sy = gx / gl;
        if (!t.slide) t.sdir = sx * ux + sy * uy < 0 ? -1 : 1;
        sx *= t.sdir;
        sy *= t.sdir;
        nx = t.x + sx * st;
        ny = t.y + sy * st;
        t.slide = (t.slide || 0) + dt;
        if (inZone(nx, ny, pad) || t.slide > 4) {
          t.slide = 0;
          return true;
        }
      } else t.slide = 0;
    }
    t.x = nx;
    t.y = ny;
    if (Math.abs(ux) > 0.15) t.face = ux > 0 ? 1 : -1;
    t.phase += st / (t.r * 0.9);
    return false;
  }
  function wanderSpot(t) {
    var x = t.x + rand(-360, 360), y = t.y + rand(-220, 220);
    return inBounds(x, y, false) && !inZone(x, y, 30) ? { x, y } : spot(false);
  }
  function famSpot(t) {
    var duty = t.duty = dutyFor(t);
    if (duty) {
      t.pass = true;
      if (VIL && duty.where !== "away") return dutySpot(t, duty);
      var bus = { x: EXIT.x, y: EXIT.y };
      if (t.gone) return { x: t.x, y: t.y };
      if (Math.abs(t.x - bus.x) < 30 && Math.abs(t.y - bus.y) < 20) {
        t.gone = true;
        return { x: EXIT.off.x, y: EXIT.off.y };
      }
      return SCENE.via && SCENE.via(t, bus, SV) || bus;
    }
    if (t.gone) {
      t.gone = false;
      t.pass = true;
      return { x: EXIT.x, y: EXIT.y };
    }
    t.pass = false;
    var look = t.person.look;
    if ((look === "shark" || look === "otter") && SCENE.swimSpot) {
      var mate = fam.filter(function(o2) {
        return o2 !== t && o2.dipT >= 0;
      })[0];
      if (Math.random() < (mate ? 0.6 : 0.3)) {
        var ps = SCENE.swimSpot(SV), clear = !inZone(ps.x, ps.y, 30);
        for (var q = 0; clear && q < fam.length; q++) if (fam[q] !== t && fam[q].dipT < 0 && Math.hypot(fam[q].x - ps.x, fam[q].y - ps.y) < 110) clear = false;
        if (clear) return ps;
      }
    }
    var best = null, bs = -1;
    for (var n = 0; n < 24; n++) {
      var c = spot(true), score = 1e9;
      for (var j = 0; j < fam.length; j++) {
        var o = fam[j];
        if (o === t) continue;
        score = Math.min(score, Math.hypot(o.x - c.x, (o.y - c.y) * 1.6), Math.hypot(o.tx - c.x, (o.ty - c.y) * 1.6));
      }
      if (score > bs) {
        bs = score;
        best = c;
      }
    }
    if (SCENE.via) {
      var w = SCENE.via(t, best, SV);
      if (w) {
        t.dest = best;
        return w;
      }
    }
    return best;
  }
  function famOnward(t) {
    var d = t.dest, w = SCENE.via(t, d, SV);
    if (!w) t.dest = null;
    return w || d;
  }
  var SCHOOL_OUT = false;
  function weekday(d) {
    return d.getDay() >= 1 && d.getDay() <= 5;
  }
  function schoolDay(name, d) {
    if (!weekday(d)) return false;
    var td = ymd(d);
    var tt = ttFor(name, d);
    if (tt && tt.status === "ok") return true;
    if (tt && (tt.status === "closed" || tt.status === "weekend")) return false;
    var ln = lunchFor(name, d);
    if (ln && ln.status === "served") return true;
    if (ln && ln.status === "closed") return false;
    var sc = ((DATA.extra || {}).schools || []).filter(function(s) {
      return s.who === name;
    })[0];
    if (!sc || !sc.terms) return null;
    if ((sc.days || []).some(function(x) {
      return x.date === td;
    })) return false;
    var prevEnd = null, nextStart = null, inTerm = false, open = false;
    sc.terms.forEach(function(t) {
      if (t.to && t.to >= td && (!t.from || t.from <= td)) inTerm = true;
      if (t.from && t.from <= td && !t.to) open = true;
      if (t.to && t.to < td && (!prevEnd || t.to > prevEnd)) prevEnd = t.to;
      if (t.from && t.from > td && (!nextStart || t.from < nextStart)) nextStart = t.from;
    });
    if (inTerm) return true;
    if (!open && prevEnd && nextStart) return false;
    return null;
  }
  var PLACE = [[/swim/i, "pond"], [/football|rugby|match|training/i, "pitch"], [/\bband\b|drama|music|choir|cubs|scouts|beavers|club|rehears/i, "band"]];
  function placeFor(what) {
    if (/book club/i.test(what)) return "away";
    for (var i = 0; i < PLACE.length; i++) if (PLACE[i][0].test(what)) return PLACE[i][1];
    return "away";
  }
  function dutyFor(t) {
    var name = t.person.name, d = now(), m = d.getHours() * 60 + d.getMinutes(), td = ymd(d);
    if (KIDS.indexOf(name) >= 0 && m >= 8 * 60 + 35 && m < 15 * 60 + 15 && schoolDay(name, d) === true) return { where: "school", what: "School" };
    for (var i = 0; i < DATA.events.length; i++) {
      var e = DATA.events[i];
      if (e.who !== name || e.day !== td || e.all_day || !e.start) continue;
      var s = new Date(e.start), em = s.getHours() * 60 + s.getMinutes();
      if (!isNaN(em) && m >= em - 20 && m < em + 60) return { where: placeFor(e.what), what: e.what };
    }
    return null;
  }
  function dutySpot(t, duty) {
    var L = LAY, slot = fam.filter(function(o2) {
      return o2.duty && o2.duty.where === duty.where;
    }).indexOf(t);
    if (slot < 0) slot = 0;
    switch (duty.where) {
      // A staggered line down the school front: 80 apart across and 50 down, which
      // is what it takes for three bodies and three name tags to never overlap at
      // 1280x800 (a row along the door stacked them). In the example household the
      // deer's tag rides highest (tg 2.75) and the shark's lowest (1.6), so that order opens the
      // gaps rather than closing them. Break shuffles it out into the yard a little.
      case "school":
        var s = L.school, k = Math.max(0, SCHOOL_LINE.indexOf(t.person.name)), o = SCHOOL_OUT ? 22 : 0;
        return { x: s.x - 36 + k * 80 + o, y: s.y + 14 + k * 50 + o * 0.4 };
      case "pond":
        return { x: W * 0.74 + slot * 60, y: H - 172 };
      // the bank; the swimmers dive from here
      case "pitch":
        return { x: L.pitch.x - 90 + slot * 60, y: L.pitch.y - 40 };
      // the touchline, behind the players
      case "band":
        return { x: L.band.x + 96 + slot * 40, y: L.band.y - 14 - slot * 26 };
    }
    return { x: t.x, y: t.y };
  }
  function offStage(t) {
    return EXIT && EXIT.off.x < 0 ? t.x < -20 : t.x > W + 20;
  }
  function eyeState(t) {
    if (nightness > 0.6) return "shut";
    if (t.startle > 0 || t.jump > 0.2) return "wide";
    if (t.happy > 0 || t.munch > 0 || t.wave > 0 || t.dancing) return "happy";
    if (t.blinkT > 0) return "shut";
    return "open";
  }
  function drawRig(t, time) {
    var R = t.rig, C = CREATURE[t.person.look], D = C.rig, rk = t.r * K, eye = eyeState(t);
    var g = t.gait, ph = t.phase, M = {
      g,
      ph,
      air: Math.abs(Math.sin(ph)) * g,
      idle: 1 - g,
      time,
      spike,
      wave: t.wave > 0 ? Math.min(1, t.wave / 0.3, (1.8 - t.wave) / 0.3 + 0.2) : 0,
      stepL: -Math.max(0, Math.sin(ph)) * 0.14 * g,
      stepR: -Math.max(0, -Math.sin(ph)) * 0.14 * g,
      stiff: t.pronk > 0 ? 1 : 0,
      sleep: nightness > 0.6 ? 1 : 0
    };
    for (var i = 0; i < D.order.length; i++) {
      var p = D.order[i];
      if (p === "paw" && !(t.wave > 0)) continue;
      if (p === "mouth" && (t.diving > 0.4 || t.startle > 0)) p = "mouthOpen";
      var part = p === D.eyesIn ? R.eyes[eye] : R.parts[p];
      if (!part) continue;
      var a = C.anim && C.anim(t, p, time, M) || STILL, pv = D.piv[p] || [0, 0], px = pv[0] * rk, py = pv[1] * rk;
      var ex = 0, ey = 0;
      if (p === D.eyesIn && D.eyesIn === "eyes" && t.person.look !== "shark") {
        ex = (t.glance || 0) * 0.05 * rk;
        ey = (t.graze > 0 || t.munch > 0 ? 0.05 : t.jump > 0 ? -0.04 : 0) * rk;
      }
      ctx.save();
      ctx.translate(px + a[1] * rk + ex, py + a[2] * rk + ey);
      if (a[0]) ctx.rotate(a[0]);
      ctx.drawImage(part.c, part.ox - R.ax - px, part.oy - R.ay - py);
      ctx.restore();
    }
  }
  var STILL = [0, 0, 0];
  function famLife(t, dt, asleep, nibs) {
    TIMERS.forEach(function(k2) {
      if (t[k2] > 0) t[k2] -= dt;
    });
    if (asleep) {
      t.wave = t.pronk = t.graze = t.startle = 0;
      return;
    }
    var C = CREATURE[t.person.look], still = t.idle && t !== openThing && t.dipT < 0;
    if (C && C.life) C.life(t, dt, still, LIFE);
    var near2 = null, nd = 170;
    for (var j = 0; j < fam.length; j++) {
      var o = fam[j];
      if (o === t) continue;
      var d = Math.abs(o.x - t.x) + Math.abs(o.y - t.y);
      if (d < nd) {
        nd = d;
        near2 = o;
      }
    }
    var want = near2 ? (near2.x > t.x ? 1 : -1) * t.face : 0;
    t.glance = (t.glance || 0) + (want - (t.glance || 0)) * Math.min(1, dt * 6);
    if (near2 && still && near2.moving && nd < 120 && !(t.gcool > 0) && !t.shiny) {
      t.face = near2.x > t.x ? 1 : -1;
      t.gcool = 4;
    }
    if (!(t.scool > 0)) for (j = 0; j < nibs.length; j++) {
      var n = nibs[j];
      if ((n.chase || n.scared > 0) && n.moving && Math.abs(n.x - t.x) + Math.abs(n.y - t.y) < 110) {
        t.jump = 0.6;
        t.startle = 1.2;
        t.scool = 6;
        say("!", t.x, t.y - t.r * 2.6);
        break;
      }
    }
  }
  function famWave(t) {
    if (t.wcool > 0 || nightness > 0.6) return false;
    t.wave = 1.8;
    t.wcool = 10;
    t.happy = 1.8;
    return true;
  }
  var LIFE = { rand, puff: function(k, x, y, n, c) {
    puff(k, x, y, n, c);
  }, water: null };
  function animalHabits(t, dt) {
    var C = CREATURE[t.person.look];
    t.peck = Math.max(0, (t.peck || 0) - dt);
    LIFE.water = POND;
    if (C && C.habits) C.habits(t, dt, LIFE);
  }
  function update2(dt) {
    var i, j, t, asleep = nightness > 0.6;
    for (i = 0; i < VILLAGE.length; i++) VILLAGE[i].update(dt, asleep);
    if (!VIL) {
      updateWeather(dt);
      airmail(dt);
    }
    if (SCENE.ambient) {
      SV.WX = WX;
      SV.DARK = DARK;
      SV.nightness = nightness;
      SV.music = MUSIC_T;
      SV.party = PARTY_T;
      SCENE.ambient.update(dt, SV);
    }
    updateParty(dt);
    updatePlane(dt);
    updateRobot(dt);
    if (GRAZE && Math.random() < dt * 1.1 && food.length < 34) addFood();
    for (i = 0; i < food.length; i++) food[i].grow = Math.min(1, food[i].grow + dt * 2.5);
    var puffs = things.filter(function(o2) {
      return o2.kind === "puff";
    });
    var nibs = things.filter(function(o2) {
      return o2.kind === "nib";
    });
    if (GRAZE && puffs.length < 6 && Math.random() < dt / 6) {
      var side = Math.random() < 0.5 ? -20 : W + 20, n = spawn("puff", { r: 20, spr: pick(PUFF_LOOKS), speed: 34 }, side, rand(LAY.R + 30, H - 60));
      go(n, side < 0 ? 120 : W - 120, n.y);
    }
    for (i = 0; i < things.length; i++) {
      t = things[i];
      t.age += dt;
      t.blink -= dt;
      if (t.blink < 0) {
        t.blinkT = 0.14;
        t.blink = rand(2, 6);
      }
      t.blinkT -= dt;
      t.happy -= dt;
      t.munch -= dt;
      t.jump = Math.max(0, t.jump - dt);
      t.gait += ((t.moving ? 1 : 0) - t.gait) * Math.min(1, dt * 10);
      if (t.kind === "fam") {
        if (t.wasMoving && !t.moving) t.sqv -= 1.5;
        t.wasMoving = t.moving;
        t.sqv += (-180 * t.sq - 9 * t.sqv) * dt;
        t.sq += t.sqv * dt;
        if (t.idle && !asleep && t !== openThing && t.dipT < 0 && !t.shiny && Math.random() < dt * 0.15) {
          t.face = -t.face;
          t.sqv -= 0.6;
        }
      }
      if (t.grow < 1) t.grow = Math.min(1, t.grow + dt / 40);
      if (asleep) {
        if (t.kind === "fam") famLife(t, dt, true, nibs);
        t.shiny = null;
        t.peck = 0;
        if (t.dipT >= 0) {
          t.dipT = -1;
          t.dy = 0;
          t.diving = 0;
        }
        t.moving = false;
        if (Math.random() < dt * 0.35) parts.push({ kind: "z", x: t.x + t.r * 0.6, y: t.y - t.r * 1.8, vx: 8, vy: -14, life: 2.2, max: 2.2 });
        continue;
      }
      if (t === openThing) {
        t.moving = false;
        continue;
      }
      var speed = t.speed * (t.grow < 1 ? 0.8 : 1);
      t.hunger = Math.min(1, t.hunger + dt * (t.kind === "nib" ? 0.013 : t.kind === "puff" ? 0.02 : 8e-3));
      if (t.kind === "puff") {
        t.cool -= dt;
        t.flee -= dt;
        var threat = nearest(nibs, t, 115 * t.alert, function(n2) {
          return (n2.chase === t || n2.full <= 0) && !(n2.scared > 0);
        });
        if (threat && !safe(t) && t.flee <= 0) {
          var a = Math.atan2(t.y - threat.y, t.x - threat.x);
          var fx = Math.max(30, Math.min(W - 30, t.x + Math.cos(a) * 140)), fy = Math.max(LAY.R + 20, Math.min(H - 24, t.y + Math.sin(a) * 140));
          if (inZone(fx, fy, 30)) {
            var sp = spot(false);
            fx = sp.x;
            fy = sp.y;
          }
          go(t, fx, fy);
          t.flee = 1.5;
          t.wait = 0;
        }
        if (t.flee > 0) speed = 64;
        else if (t.munch <= 0 && t.hunger > 0.45 && t.idle && t.wait <= 0) {
          var f = nearest(food, t, 400);
          if (f) {
            go(t, f.x, f.y);
            t.target = f;
          }
        }
        if (t.hunger < 0.25 && t.cool <= 0 && t.grow >= 1 && puffs.length < 16 && Math.random() < dt * 0.08) {
          var baby = spawn("puff", { r: 20, spr: t.spr, speed: 34, grow: 0.55, hunger: 0.3 }, t.x + rand(-20, 20), t.y + rand(6, 16));
          t.cool = rand(35, 60);
          puff("heart", t.x, t.y - t.r * 2, 2, "#FF7FA0");
          baby.happy = 1.5;
        }
      } else if (t.kind === "nib") {
        t.full -= dt;
        if (t.scared > 0) {
          t.scared -= dt;
          t.chase = null;
          speed = 95;
          go(t, t.fleeX, t.y);
          if (t.scared <= 0) {
            var back2 = spot(false);
            go(t, back2.x, back2.y);
            t.hunger = 0.2;
          }
        } else if (t.full > 0) speed = 16;
        else if (t.hunger > 0.55) {
          if (!t.chase || things.indexOf(t.chase) < 0 || safe(t.chase) || t.chaseT > 8) {
            if (t.chaseT > 8) {
              t.hunger = 0.3;
              t.chaseT = 0;
            }
            t.chase = t.chaseT === 0 ? nearest(puffs, t, 320, function(p2) {
              return !safe(p2);
            }) : null;
            t.chaseT = 0;
          }
          if (t.chase) {
            t.chaseT += dt;
            go(t, t.chase.x, t.chase.y);
            t.wait = 0;
            speed = 58;
            if (dist(t, t.chase) < (t.r + t.chase.r) * 0.75) eat(t, t.chase);
          }
        }
      } else if (t.kind === "fam") {
        if (t.munch <= 0 && t.hunger > 0.7 && t.idle && t.wait <= 0 && !t.target && !t.duty) {
          var ff = nearest(food, t, 300, function(f2) {
            if (!inBounds(f2.x, f2.y, true)) return false;
            for (var q = 0; q < fam.length; q++) if (fam[q] !== t && Math.hypot(fam[q].x - f2.x, (fam[q].y - f2.y) * 1.6) < 130) return false;
            return true;
          });
          if (ff) {
            go(t, ff.x, ff.y);
            t.target = ff;
          }
        }
        t.ycool -= dt;
        animalHabits(t, dt);
        famLife(t, dt, asleep, nibs);
        if (t.idle && t.wait > 0 && !t.yielding && !t.duty) {
          for (j = 0; j < fam.length; j++) if (fam[j] !== t && Math.hypot(fam[j].x - t.x, (fam[j].y - t.y) * 1.6) < 120) t.wait = 0;
        }
        if (!t.idle && !t.target && t.ycool <= 0 && !t.duty) for (j = 0; j < fam.length; j++) {
          var o = fam[j];
          if (o === t) continue;
          var ox = o.x - t.x, oy = o.y - t.y;
          if (Math.hypot(ox, oy * 1.6) < 95 && ox * (t.tx - t.x) + oy * (t.ty - t.y) > 0) {
            t.idle = true;
            t.wait = rand(0.4, 0.8);
            t.yielding = true;
            t.ycool = 3;
            break;
          }
        }
      }
      if (t.target && t.kind !== "nib") {
        if (food.indexOf(t.target) < 0) t.target = null;
        else if (dist(t, t.target) < t.r * 0.9) {
          food.splice(food.indexOf(t.target), 1);
          t.target = null;
          t.hunger = Math.max(0, t.hunger - 0.5);
          t.munch = 1.1;
          t.wait = 1.4;
          t.idle = true;
          puff("crumb", t.x + t.face * t.r * 0.5, t.y - t.r * 0.6, 4, "#6CC070");
        }
      }
      if (t.idle || t.munch > 0) {
        t.moving = false;
        t.wait -= dt;
        if (t.wait <= 0 && t.munch <= 0) {
          var s = t.kind !== "fam" ? wanderSpot(t) : t.dest && !dutyFor(t) ? famOnward(t) : (t.dest = null, famSpot(t));
          go(t, s.x, s.y);
          t.target = null;
          t.yielding = false;
          t.wait = t.dest ? 0.05 : rand(1, t.kind === "fam" ? 5 : 3.5) * (MUSIC_T > 0.5 ? 2.5 : 1);
        }
      } else {
        t.moving = true;
        if (steer(t, speed, dt)) {
          t.idle = true;
          t.moving = false;
        }
      }
      t.x = Math.max(-60, Math.min(W + 60, t.x));
    }
    for (i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind !== "text" && p.kind !== "z" && p.kind !== "smoke" && p.kind !== "note" && p.kind !== "leaf" && p.kind !== "hat") p.vy += 120 * dt;
      if (p.kind === "leaf" || p.kind === "hat") {
        p.ph += dt * 6;
        p.vy += Math.sin(p.ph) * 40 * dt;
      }
    }
    for (i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i];
      c.x += c.v * dt;
      if (c.x > W + 20) c.x = -c.c.width;
    }
    for (i = 0; i < flies.length; i++) {
      var fl = flies[i];
      fl.a += dt * fl.s;
      fl.x += Math.cos(fl.a * 0.7) * 14 * dt;
      fl.y += Math.sin(fl.a) * 9 * dt;
      if (fl.x < 0) fl.x = W;
      if (fl.x > W) fl.x = 0;
    }
  }
  function safe(p) {
    for (var i = 0; i < fam.length; i++) if (dist(p, fam[i]) < 80) return true;
    return false;
  }
  function eat(n, p) {
    things.splice(things.indexOf(p), 1);
    puff("poof", p.x, p.y - p.r, 7, "#FFFFFF");
    say("nom!", n.x, n.y - n.r * 2.4);
    n.chase = null;
    n.chaseT = 0;
    n.hunger = 0;
    n.full = rand(25, 40);
    n.happy = 2.5;
    n.munch = 1.2;
    n.wait = 2;
    n.idle = true;
  }
  var VILLAGE = [], WALKERS = [], QS = {}, DOORS = {}, ICON, BUBS, MFRONT, SHOP, VSPR = {}, clockT = 0, DANCE = null, POSTIE = { busy: false };
  var VCOLS = ["#F6C28B", "#F3DE7C", "#BCD98A", "#EDB3A8", "#D9C6A5", "#F29E8E", "#F7CFD8", "#E4B363", "#C9DDB0", "#E8C3A0"];
  var HATS = ["none", "none", "none", "beanie", "beanie2", "straw", "cap"];
  var UMBS = ["#E86A5B", "#3B5FA8", "#F3C24B", "#4E9A5A", "#E68AB0"];
  var WX = {
    rain: 0,
    bow: 0,
    st: "dry",
    t: /[?&]rain\b/.test(Q) ? 4 : rand(600, 1500),
    drops: [],
    flakes: [],
    cloud: 0.1,
    storm: 0,
    fog: 0,
    snow: 0,
    wind: 0.1,
    windT: 0.1,
    live: false,
    temp: null
  };
  var TRADE = { flour: 1, wood: 3, bread: 1 }, PUBN = 2, SHOO_COOL = 8;
  function blit(spr, x, y, face2, sx, sy, sc, rot) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale((face2 || 1) * (sx || 1) * (sc || 1) / spr.k, (sy || 1) * (sc || 1) / spr.k);
    ctx.drawImage(spr.c, -spr.ax, -spr.ay);
    ctx.restore();
  }
  function mkV(col, hat2, x, y, r) {
    r = r || 19;
    var key = col + hat2 + r;
    var spr = VSPR[key] || (VSPR[key] = makeSprites({ r, col, look: "villager", hat: hat2 === "none" ? null : hat2 }, classicSprite));
    return { spr, r, x, y, face: 1, phase: 0, moving: false, gait: 0, happy: 0, blink: rand(1, 5), blinkT: 0, _seed: rand(0, 6) };
  }
  function tickV(v, dt) {
    v.gait = (v.gait || 0) + ((v.moving ? 1 : 0) - (v.gait || 0)) * Math.min(1, dt * 10);
    v.moving = false;
    v.happy -= dt;
    v.blink -= dt;
    if (v.blink < 0) {
      v.blinkT = 0.14;
      v.blink = rand(2, 6);
    }
    v.blinkT -= dt;
  }
  function walkV(v, tx, ty, speed, dt) {
    var dx = tx - v.x, dy = ty - v.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < (v.going ? 2 : 6)) {
      if (v.going && d > 0.01) {
        v.x = tx;
        v.y = ty;
        v.moving = true;
      }
      v.going = false;
      return true;
    }
    var st = Math.min(d, speed * dt);
    v.x += dx / d * st;
    v.y += dy / d * st;
    v.moving = true;
    v.going = true;
    if (Math.abs(dx) > 1) v.face = dx > 0 ? 1 : -1;
    v.phase += st / (v.r * 0.9);
    return false;
  }
  function hopV(v) {
    return Math.abs(Math.sin(v.phase)) * v.r * 0.45 * depth(v.y) * (v.gait || 0);
  }
  function drawV(v, asleep, air, rot, hop) {
    var sc = depth(v.y), sw = v.r * 2.4 * sc, hv = hopV(v) + (hop || 0);
    if (!air) ctx.drawImage(SHADOW, v.x - sw / 2, v.y - sw * 0.14, sw, sw * 0.28);
    var spr = asleep ? v.spr.shut : v.happy > 0 ? v.spr.happy : v.blinkT > 0 ? v.spr.shut : v.spr.open;
    var g = v.gait || 0, sy = 1 - 0.1 * Math.pow(1 - Math.abs(Math.sin(v.phase)), 3) * g + 0.03 * Math.sin(clockT * 2.4 + v._seed) * (1 - g);
    blit(spr, v.x, v.y - hv, v.face, 1 / sy, sy, sc, rot);
    if (v.umb) {
      var top2 = v.y - hv - v.r * 2.35 * sc, ux = v.x + v.face * 3;
      ctx.strokeStyle = "#5A4A3A";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ux, top2);
      ctx.lineTo(ux, top2 + v.r * 1.2 * sc);
      ctx.stroke();
      ctx.fillStyle = v.umb;
      ctx.beginPath();
      ctx.arc(ux, top2 + 2, v.r * 1.05 * sc, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    }
  }
  function carry(ic, v) {
    blit(ic, v.x, v.y - hopV(v) - v.r * 2.05 * depth(v.y), 1, 1, 1, 1);
  }
  function icon(w, h, draw2) {
    var c = canvas(w * K, h * K), g = c.getContext("2d");
    g.scale(K, K);
    draw2(g);
    return { c, ax: w * K / 2, ay: h * K, k: K };
  }
  function makeIcons() {
    return {
      apple: icon(14, 15, function(g) {
        g.fillStyle = "#E0474C";
        g.beginPath();
        g.arc(7, 9, 5.5, 0, 7);
        g.fill();
        g.fillStyle = "#6CC070";
        g.beginPath();
        g.ellipse(9.5, 3, 3, 1.6, -0.4, 0, 7);
        g.fill();
        g.fillStyle = "rgba(255,255,255,.7)";
        g.beginPath();
        g.arc(5, 7, 1.5, 0, 7);
        g.fill();
      }),
      loaf: icon(22, 12, function(g) {
        rimmed(g, "#9E6630", "#D89A55", 1, function(e) {
          g.beginPath();
          g.ellipse(11, 7, 9.5 + e, 4.8 + e, 0, 0, 7);
          g.fill();
        });
        g.strokeStyle = "rgba(255,240,210,.85)";
        g.lineWidth = 1.4;
        g.lineCap = "round";
        [6, 11, 16].forEach(function(x) {
          g.beginPath();
          g.moveTo(x - 1.5, 5);
          g.lineTo(x + 1.5, 8);
          g.stroke();
        });
      }),
      log: icon(28, 12, function(g) {
        g.fillStyle = "#9C6B43";
        rr(g, 1, 1, 25, 10, 5);
        g.fill();
        g.fillStyle = "#E2C08E";
        g.beginPath();
        g.ellipse(23, 6, 4, 5, 0, 0, 7);
        g.fill();
      }),
      carrot: icon(12, 20, function(g) {
        g.strokeStyle = "#4E9A5A";
        g.lineWidth = 1.6;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(6, 6);
        g.lineTo(3, 1);
        g.moveTo(6, 6);
        g.lineTo(6, 0.5);
        g.moveTo(6, 6);
        g.lineTo(9, 1);
        g.stroke();
        g.fillStyle = "#F28C38";
        g.beginPath();
        g.moveTo(2.5, 6);
        g.lineTo(9.5, 6);
        g.lineTo(6, 19);
        g.closePath();
        g.fill();
      }),
      fish: icon(24, 12, function(g) {
        g.fillStyle = "#F59E5B";
        g.beginPath();
        g.ellipse(9, 6, 8, 4.5, 0, 0, 7);
        g.fill();
        g.beginPath();
        g.moveTo(15, 6);
        g.lineTo(23, 1);
        g.lineTo(23, 11);
        g.closePath();
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        g.arc(4.5, 5, 1.2, 0, 7);
        g.fill();
      }),
      boot: icon(18, 16, function(g) {
        g.fillStyle = "#6B5A4E";
        rr(g, 3, 0.5, 8, 11, 2);
        g.fill();
        rr(g, 3, 8.5, 14, 7, 3);
        g.fill();
        g.fillStyle = "#8C7A6C";
        g.fillRect(3, 2, 8, 2);
      }),
      sack: icon(16, 18, function(g) {
        rimmed(g, "#B8A27E", "#F2E8D8", 1, function(e) {
          g.beginPath();
          g.moveTo(3 - e, 5);
          g.quadraticCurveTo(-1 - e, 17 + e, 8, 17.5 + e);
          g.quadraticCurveTo(17 + e, 17 + e, 13 + e, 5);
          g.closePath();
          g.fill();
        });
        g.fillStyle = "#B8A27E";
        g.fillRect(5, 3, 6, 3);
        g.fillStyle = "#E0C98F";
        g.beginPath();
        g.arc(8, 12, 2.5, 0, 7);
        g.fill();
      }),
      letter: icon(16, 11, function(g) {
        g.fillStyle = "#FFFFFF";
        g.strokeStyle = "#B9B4AA";
        g.lineWidth = 1;
        g.fillRect(1, 1, 14, 9.5);
        g.strokeRect(1, 1, 14, 9.5);
        g.beginPath();
        g.moveTo(1, 1);
        g.lineTo(8, 6.5);
        g.lineTo(15, 1);
        g.stroke();
        g.fillStyle = "#E86A5B";
        g.fillRect(11, 2.5, 2.5, 2.5);
      }),
      gift: icon(16, 17, function(g) {
        g.fillStyle = "#E86A5B";
        g.fillRect(2, 7, 12, 10);
        g.fillStyle = "#C94F44";
        g.fillRect(1, 5, 14, 4);
        g.fillStyle = "#F3DE7C";
        g.fillRect(7, 5, 2.5, 12);
        g.beginPath();
        g.arc(5.5, 3.5, 2.2, 0, 7);
        g.arc(10.5, 3.5, 2.2, 0, 7);
        g.fill();
      }),
      bucket: icon(14, 14, function(g) {
        g.fillStyle = "#8FA6B8";
        g.beginPath();
        g.moveTo(1, 3);
        g.lineTo(13, 3);
        g.lineTo(11, 13);
        g.lineTo(3, 13);
        g.closePath();
        g.fill();
        g.fillStyle = "#6FB6E8";
        g.beginPath();
        g.ellipse(7, 3.5, 6, 1.8, 0, 0, 7);
        g.fill();
      }),
      cat: icon(26, 26, function(g) {
        rimmed(g, "#5F6270", "#8C8F9E", 1.2, function(e) {
          g.beginPath();
          g.ellipse(13, 18, 8 + e, 7.5 + e, 0, 0, 7);
          g.fill();
          g.beginPath();
          g.arc(13, 9, 6 + e, 0, 7);
          g.fill();
          [-1, 1].forEach(function(s) {
            g.beginPath();
            g.moveTo(13 + s * 2, 4.5);
            g.lineTo(13 + s * 6.5 + s * e, 0.5 - e);
            g.lineTo(13 + s * 6.5, 7);
            g.closePath();
            g.fill();
          });
        });
        g.fillStyle = "#F4B5C0";
        g.beginPath();
        g.arc(13, 11, 1, 0, 7);
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 1.1;
        g.lineCap = "round";
        [-1, 1].forEach(function(s) {
          g.beginPath();
          g.moveTo(13 + s * 1.3, 8.6);
          g.quadraticCurveTo(13 + s * 2.6, 7.4, 13 + s * 3.9, 8.6);
          g.stroke();
        });
        g.fillStyle = "#B8BBC8";
        g.beginPath();
        g.ellipse(13, 20, 4.5, 4, 0, 0, 7);
        g.fill();
      }),
      duck: icon(30, 22, function(g) {
        rimmed(g, "#B9B4AA", "#FFFDF5", 1.2, function(e) {
          g.beginPath();
          g.ellipse(13, 15, 11 + e, 6.5 + e, 0, 0, 7);
          g.fill();
          g.beginPath();
          g.arc(21, 7, 5 + e, 0, 7);
          g.fill();
        });
        g.fillStyle = "#F4A340";
        g.beginPath();
        g.ellipse(27, 8, 3.5, 1.8, 0, 0, 7);
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        g.arc(22.5, 6, 1.1, 0, 7);
        g.fill();
        g.strokeStyle = "#D8D2C6";
        g.lineWidth = 1.2;
        g.beginPath();
        g.arc(11, 13, 5, 0.2, 2.2);
        g.stroke();
      }),
      duckling: icon(16, 13, function(g) {
        g.fillStyle = "#FFD95C";
        g.beginPath();
        g.ellipse(7, 9, 6, 3.8, 0, 0, 7);
        g.fill();
        g.beginPath();
        g.arc(11, 4.5, 3, 0, 7);
        g.fill();
        g.fillStyle = "#F4A340";
        g.beginPath();
        g.ellipse(14.5, 5, 2, 1, 0, 0, 7);
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        g.arc(11.8, 3.8, 0.7, 0, 7);
        g.fill();
      }),
      wagon: icon(74, 46, function(g) {
        rimmed(g, "#2F6B69", "#5E9C9A", 2, function(e) {
          rr(g, 4 - e, 8 - e, 62 + 2 * e, 28 + 2 * e, 8);
          g.fill();
        });
        g.fillStyle = "#F2E8D8";
        rr(g, 2, 2, 66, 9, 4);
        g.fill();
        g.fillStyle = "#FFE9A6";
        [12, 30, 48].forEach(function(x) {
          rr(g, x, 14, 12, 10, 3);
          g.fill();
        });
        g.strokeStyle = "#8D6440";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(66, 30);
        g.lineTo(74, 30);
        g.stroke();
      }),
      bag: icon(22, 24, function(g) {
        rimmed(g, "#3F7A50", "#9EE0B4", 1.2, function(e) {
          rr(g, 3 - e, 6 - e, 16 + 2 * e, 17 + 2 * e, 5);
          g.fill();
        });
        g.strokeStyle = "#3F7A50";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(7, 6);
        g.quadraticCurveTo(11, -1, 15, 6);
        g.stroke();
        g.fillStyle = "#3F7A50";
        rr(g, 6, 13, 10, 7, 2);
        g.fill();
        g.fillStyle = "#FFFFFF";
        g.beginPath();
        g.arc(11, 10, 1.6, 0, 7);
        g.fill();
      })
    };
  }
  function makeShop() {
    function pole(g, x, y0, y1) {
      g.fillStyle = "#B08A5A";
      g.fillRect(x - 2, y0, 4, y1 - y0);
    }
    return {
      frame: icon(112, 84, function(g) {
        pole(g, 8, 6, 84);
        pole(g, 104, 6, 84);
        pole(g, 8, 6, 84);
        g.fillStyle = "#C9A06A";
        [24, 50, 74].forEach(function(y) {
          g.fillRect(4, y, 104, 4);
        });
        g.fillStyle = "#D9B27A";
        g.fillRect(70, 74, 34, 5);
        g.fillRect(72, 68, 30, 5);
        g.fillRect(74, 62, 26, 5);
        g.strokeStyle = "rgba(90,60,30,.35)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(8, 84);
        g.lineTo(104, 24);
        g.stroke();
      }),
      walls1: icon(90, 26, function(g) {
        rimmed(g, "#9C7B57", "#EAD8B6", 2, function(e) {
          g.fillRect(3 - e, 4 - e, 84 + 2 * e, 22 + 2 * e);
        });
        g.strokeStyle = "rgba(120,90,60,.35)";
        g.lineWidth = 1;
        for (var y = 10; y < 26; y += 6) {
          g.beginPath();
          g.moveTo(3, y);
          g.lineTo(87, y);
          g.stroke();
        }
      }),
      walls2: icon(90, 52, function(g) {
        rimmed(g, "#9C7B57", "#EAD8B6", 2, function(e) {
          g.fillRect(3 - e, 2 - e, 84 + 2 * e, 50 + 2 * e);
        });
        g.fillStyle = "#6D8FB5";
        rr(g, 14, 20, 24, 32, 6);
        g.fill();
        g.fillStyle = "#E8C66A";
        g.beginPath();
        g.arc(33, 37, 1.8, 0, 7);
        g.fill();
        g.fillStyle = "#FFE9A6";
        rr(g, 50, 14, 22, 16, 4);
        g.fill();
        g.strokeStyle = "rgba(90,60,40,.5)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(61, 14);
        g.lineTo(61, 30);
        g.stroke();
      }),
      roof: icon(110, 44, function(g) {
        g.fillStyle = "#8C6E62";
        g.fillRect(74, 4, 12, 26);
        rimmed(g, "#48648A", "#6D8FB5", 2, function(e) {
          g.beginPath();
          g.moveTo(2 - e, 44 + e);
          g.lineTo(55, 8 - e);
          g.lineTo(108 + e, 44 + e);
          g.closePath();
          g.fill();
        });
        g.strokeStyle = "rgba(255,255,255,.22)";
        g.lineWidth = 2;
        [30, 22, 14].forEach(function(yy, i) {
          var hw = 53 * (yy - 8) / 36;
          g.beginPath();
          g.moveTo(55 - hw, yy + 8);
          g.lineTo(55 + hw, yy + 8);
          g.stroke();
        });
      }),
      sign: icon(26, 30, function(g) {
        pole(g, 13, 8, 30);
        rimmed(g, "#7A5238", "#F2E8D8", 1.5, function(e) {
          rr(g, 1 - e, 1 - e, 24 + 2 * e, 16 + 2 * e, 3);
          g.fill();
        });
        g.fillStyle = "#E86A5B";
        g.beginPath();
        g.moveTo(9, 6);
        g.lineTo(13, 4);
        g.lineTo(17, 6);
        g.lineTo(13, 8);
        g.closePath();
        g.fill();
        g.fillStyle = "#C24E42";
        g.beginPath();
        g.moveTo(9, 6);
        g.lineTo(13, 8);
        g.lineTo(13, 14);
        g.lineTo(9, 12);
        g.closePath();
        g.fill();
        g.fillStyle = "#F4A340";
        g.beginPath();
        g.moveTo(17, 6);
        g.lineTo(13, 8);
        g.lineTo(13, 14);
        g.lineTo(17, 12);
        g.closePath();
        g.fill();
      }),
      rubble: icon(100, 30, function(g) {
        [[10, 22, 30, 6, -0.2], [42, 18, 34, 6, 0.15], [66, 24, 28, 6, -0.35], [26, 12, 26, 5, 0.4], [54, 8, 22, 5, -0.1]].forEach(function(p) {
          g.save();
          g.translate(p[0] + p[2] / 2, p[1]);
          g.rotate(p[4]);
          g.fillStyle = "#C9A06A";
          g.fillRect(-p[2] / 2, -p[3] / 2, p[2], p[3]);
          g.restore();
        });
        g.fillStyle = "#EAD8B6";
        [[14, 26], [36, 27], [80, 25], [58, 20]].forEach(function(p) {
          g.fillRect(p[0], p[1], 10, 4);
        });
      }),
      bunting: icon(120, 26, function(g) {
        var cols = ["#E86A5B", "#F3DE7C", "#6C8FD0", "#7BC47F", "#E68AB0", "#F4A340"];
        g.strokeStyle = "rgba(90,80,70,.8)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(2, 4);
        g.quadraticCurveTo(60, 20, 118, 4);
        g.stroke();
        for (var i = 0; i < 7; i++) {
          var u = (i + 0.5) / 7, x = 2 + 116 * u, y = 4 + 8 * 4 * u * (1 - u);
          g.fillStyle = cols[i % 6];
          g.beginPath();
          g.moveTo(x - 5, y);
          g.lineTo(x + 5, y);
          g.lineTo(x, y + 11);
          g.closePath();
          g.fill();
        }
      })
    };
  }
  function makeBubbles() {
    var out = {};
    ["heart", "note", "dots", "ha", "sun", "hi", "hic"].forEach(function(kind) {
      out[kind] = icon(44, 36, function(g) {
        g.fillStyle = "#FFFFFF";
        g.strokeStyle = "rgba(60,70,60,.25)";
        g.lineWidth = 1.5;
        rr(g, 2, 2, 40, 26, 12);
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(12, 27);
        g.lineTo(20, 27);
        g.lineTo(9, 35);
        g.closePath();
        g.fill();
        var x = 22, y = 15;
        if (kind === "heart") {
          g.fillStyle = "#FF7FA0";
          g.beginPath();
          g.moveTo(x, y + 5);
          g.bezierCurveTo(x - 9, y - 2, x - 4, y - 9, x, y - 4);
          g.bezierCurveTo(x + 4, y - 9, x + 9, y - 2, x, y + 5);
          g.fill();
        } else if (kind === "note") {
          g.fillStyle = g.strokeStyle = "#6C7FD0";
          g.lineWidth = 2;
          g.beginPath();
          g.ellipse(x - 3, y + 5, 4, 3, -0.3, 0, 7);
          g.fill();
          g.beginPath();
          g.moveTo(x + 1, y + 4);
          g.lineTo(x + 1, y - 7);
          g.lineTo(x + 7, y - 4);
          g.stroke();
        } else if (kind === "dots") {
          g.fillStyle = "#8A94A6";
          [-8, 0, 8].forEach(function(d) {
            g.beginPath();
            g.arc(x + d, y, 2.6, 0, 7);
            g.fill();
          });
        } else if (kind === "sun") {
          g.fillStyle = "#FFC83D";
          g.beginPath();
          g.arc(x, y, 5, 0, 7);
          g.fill();
          g.strokeStyle = "#FFC83D";
          g.lineWidth = 2;
          for (var i = 0; i < 8; i++) {
            var a = i / 8 * 6.283;
            g.beginPath();
            g.moveTo(x + Math.cos(a) * 7.5, y + Math.sin(a) * 7.5);
            g.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
            g.stroke();
          }
        } else {
          g.fillStyle = kind === "hic" ? "#9A6C3C" : "#C4553A";
          g.font = "600 15px Fredoka";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(kind === "ha" ? "ha!" : kind === "hi" ? "hi!" : "hic", x, y + 1);
        }
      });
    });
    return out;
  }
  function marketFront() {
    return icon(140, 66, function(g) {
      rimmed(g, "#8D6440", "#C99A67", 2, function(e) {
        g.fillRect(10 - e, 26 - e, 120 + 2 * e, 40 + 2 * e);
      });
      g.strokeStyle = "rgba(90,60,30,.3)";
      g.lineWidth = 2;
      [40, 70, 100].forEach(function(x) {
        g.beginPath();
        g.moveTo(x, 28);
        g.lineTo(x, 64);
        g.stroke();
      });
      [["#E0474C", 56], ["#C7D86A", 94]].forEach(function(pile) {
        [[0, 0], [9, 0], [18, 0], [4.5, -7], [13.5, -7]].forEach(function(o) {
          g.fillStyle = pile[0];
          g.beginPath();
          g.arc(pile[1] + o[0], 22 + o[1], 5.5, 0, 7);
          g.fill();
          g.fillStyle = "rgba(255,255,255,.55)";
          g.beginPath();
          g.arc(pile[1] + o[0] - 1.8, 20 + o[1], 1.5, 0, 7);
          g.fill();
        });
      });
    });
  }
  function sprout(x, y, gr) {
    if (gr < 0.06) {
      ctx.fillStyle = "#8B5E3C";
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 2.5, 0, 0, 7);
      ctx.fill();
      return;
    }
    var k = 0.4 + 0.6 * gr;
    if (gr >= 1) {
      ctx.fillStyle = "#F28C38";
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 5, 3.5, 0, 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = "#3F8A4A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 14 * k);
    ctx.stroke();
    ctx.fillStyle = "#72C878";
    ctx.beginPath();
    ctx.ellipse(x - 5 * k, y - 12 * k, 6 * k, 3 * k, -0.5, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5 * k, y - 15 * k, 6 * k, 3 * k, 0.5, 0, 7);
    ctx.fill();
  }
  function route(a, b) {
    return (a.lane || []).concat((b.lane || []).slice().reverse(), [{ x: b.x, y: b.y }]);
  }
  function fromHere(w, b) {
    return [{ x: w.v.x, y: LAY.R }].concat((b.lane || []).slice().reverse(), [{ x: b.x, y: b.y }]);
  }
  function exitDoor() {
    return DOORS[pick(["left", "right", "left", "right", "cottage", "mill", "post"])];
  }
  function walker(from, o) {
    o = o || {};
    var w = {
      v: mkV(o.col || pick(VCOLS), o.hat || pick(HATS), from.x, from.y, o.r),
      path: null,
      i: 0,
      speed: o.speed || 30,
      done: null,
      carry: null,
      wobble: o.wobble ? rand(0, 6) : -1,
      pause: 0,
      cool: rand(2, 6),
      bub: null,
      bubT: 0,
      q: null,
      umb: pick(UMBS)
    };
    WALKERS.push(w);
    return w;
  }
  function leg(w, path, done, carry2) {
    w.path = path;
    w.i = 0;
    w.done = done || null;
    w.carry = carry2 || null;
    return w;
  }
  function errand(from, to, o, done) {
    var w = walker(from, o);
    return leg(w, route(from, to), done, o && o.carry);
  }
  function greet(w) {
    return w.wobble >= 0 ? BUBS.hic : pick([BUBS.hi, BUBS.hi, BUBS.heart, BUBS.ha, BUBS.sun]);
  }
  function updateWalkers(dt) {
    var i, j, w;
    for (i = WALKERS.length - 1; i >= 0; i--) {
      w = WALKERS[i];
      tickV(w.v, dt);
      w.cool -= dt;
      w.bubT -= dt;
      w.v.umb = WX.rain > 0.3 ? w.umb : null;
      if (w.wobble >= 0) {
        w.wobble += dt;
        if (w.path && Math.random() < dt * 0.25) say("hic", w.v.x, w.v.y - 46);
      }
      if (w.q || !w.path) continue;
      if (w.pause > 0) {
        w.pause -= dt;
        w.v.moving = false;
        continue;
      }
      var p = w.path[w.i], sp = w.speed * (w.wobble >= 0 ? 0.65 : 1) * (WX.rain > 0.4 ? 1.35 : 1);
      if (walkV(w.v, p.x, p.y, sp, dt) && ++w.i >= w.path.length) {
        var d = w.done;
        w.path = null;
        w.done = null;
        w.carry = null;
        if (d) d(w);
        if (!w.path && !w.q) WALKERS.splice(WALKERS.indexOf(w), 1);
      }
    }
    for (i = 0; i < WALKERS.length; i++) for (j = i + 1; j < WALKERS.length; j++) {
      var a = WALKERS[i], b = WALKERS[j];
      if (!a.path || !b.path || a.pause > 0 || b.pause > 0 || a.cool > 0 || b.cool > 0) continue;
      if (Math.abs(a.v.x - b.v.x) < 30 && Math.abs(a.v.y - b.v.y) < 14) {
        a.pause = b.pause = 1.5;
        a.cool = b.cool = 14;
        a.v.moving = b.v.moving = false;
        a.v.face = b.v.x > a.v.x ? 1 : -1;
        b.v.face = -a.v.face;
        a.bub = greet(a);
        a.bubT = 1.5;
        b.v.happy = 1.5;
        if (Math.random() < 0.5) {
          b.bub = greet(b);
          b.bubT = 1.2;
        }
      }
    }
    for (i = 0; i < WALKERS.length; i++) {
      var w2 = WALKERS[i];
      if (!w2.path || w2.pause > 0 || w2.cool > 0 || w2.wobble >= 0) continue;
      for (j = 0; j < fam.length; j++) {
        var f = fam[j], dy2 = f.y - w2.v.y;
        if (Math.abs(f.x - w2.v.x) < 70 && dy2 > 20 && dy2 < 140 && Math.random() < 0.5 && famWave(f)) {
          w2.pause = 1.4;
          w2.cool = 14;
          w2.bub = BUBS.hi;
          w2.bubT = 1.5;
          w2.v.face = f.x > w2.v.x ? 1 : -1;
          w2.v.moving = false;
          break;
        }
      }
    }
  }
  function drawWalkers() {
    var list = WALKERS.slice().sort(function(a, b) {
      return a.v.y - b.v.y;
    });
    var rave = PARTY_T > 0.5 ? PARTY_T : MUSIC_T > 0.5 && nightness < 0.6 ? MUSIC_T * 0.7 : 0;
    var bw = PARTY_T > 0.5 ? RAVE_W : MUSIC_W;
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      var hop = rave ? Math.max(0, Math.sin(clockT * bw + w.v._seed * 3)) * 6 * rave : 0;
      drawV(w.v, false, false, w.wobble >= 0 && w.path ? Math.sin(w.wobble * 3) * 0.22 : rave ? Math.sin(clockT * bw * 0.5 + w.v._seed) * 0.06 : 0, hop);
      if (w.carry) carry(w.carry, w.v);
      if (w.bubT > 0 && w.bub) blit(w.bub, w.v.x + w.v.face * 14, w.v.y - w.v.r * 2.1 * depth(w.v.y) - (w.v.umb ? 16 : 0), 1, 1, 1, 1);
    }
  }
  function queue(slot, face2) {
    return { list: [], slot, face: face2 };
  }
  function joinQ(q, w) {
    w.q = q;
    q.list.push(w);
  }
  function leaveQ(q, to, carryIcon) {
    var w = q.list.shift();
    if (!w) return null;
    w.q = null;
    leg(w, fromHere(w, to), null, carryIcon);
    return w;
  }
  function updateQ(q, dt) {
    for (var i = 0; i < q.list.length; i++) {
      var w = q.list[i], s = q.slot(i);
      if (walkV(w.v, s.x, s.y, 26, dt)) w.v.face = q.face;
      if (i > 0 && w.bubT <= 0 && Math.random() < dt * 0.05) {
        w.bub = pick([BUBS.dots, BUBS.ha, BUBS.sun, BUBS.heart]);
        w.bubT = 1.4;
      }
    }
  }
  function qFront(q) {
    var w = q.list[0];
    if (!w) return null;
    var s = q.slot(0);
    return Math.abs(w.v.x - s.x) + Math.abs(w.v.y - s.y) < 3 ? w : null;
  }
  function lookForFox(g, dt) {
    if (SHOO_COOL > 0 || nightness > 0.35) return;
    for (var i = 0; i < things.length; i++) {
      var f = things[i];
      if (f.kind === "nib" && f.chase && !(f.scared > 0) && dist(f, g.v) < 320 && Math.random() < dt * 0.6) {
        g.mode = "shoo";
        g.fox = f;
        SHOO_COOL = 30;
        say("!", g.v.x, g.v.y - 46);
        return;
      }
    }
  }
  function shoo(g, dt) {
    var f = g.fox;
    if (!f || things.indexOf(f) < 0 || f.scared > 0) {
      g.mode = "home";
      return;
    }
    walkV(g.v, f.x, f.y, 82, dt);
    if (dist(g.v, f) < 42) {
      f.scared = 6;
      f.fleeX = f.x < W / 2 ? -70 : W + 70;
      f.chase = null;
      f.chaseT = 0;
      f.idle = false;
      say("shoo!", g.v.x, g.v.y - 50);
      g.v.happy = 2;
      g.mode = "home";
    }
  }
  function makeDrops() {
    WX.drops = [];
    for (var d = 0; d < 170; d++) WX.drops.push({ x: rand(0, W), y: rand(0, H), s: rand(0.7, 1.2) });
    WX.flakes = [];
    for (d = 0; d < 110; d++) WX.flakes.push({ x: rand(0, W), y: rand(0, H), s: rand(0, 1.5), ph: rand(0, 6) });
  }
  function makeVillage() {
    var S = [], L = LAY, B = L.B, R = L.R;
    WALKERS = [];
    TRADE = { flour: 1, wood: 3, bread: 1 };
    PUBN = 2;
    makeDrops();
    var warm = [];
    VCOLS.forEach(function(c) {
      HATS.forEach(function(h) {
        if (warm.indexOf(c + "|" + h) < 0) warm.push(c + "|" + h);
      });
    });
    S.push({
      layer: null,
      t: 3,
      update: function(dt, asleep) {
        if (warm.length) {
          var wh = warm.pop().split("|");
          mkV(wh[0], wh[1], 0, 0);
        }
        SHOO_COOL -= dt;
        updateWeather(dt);
        updateWalkers(dt);
        if (nightness > 0.35) {
          [QS.well, QS.market, QS.bus].forEach(function(q) {
            while (q.list.length) leaveQ(q, exitDoor());
          });
          return;
        }
        this.t -= dt;
        if (this.t > 0) return;
        this.t = rand(2, 5) * (WX.rain > 0.4 ? 2 : 1);
        if (WX.storm > 0.5) return;
        if (WALKERS.length >= 14) return;
        var from = pick([DOORS.left, DOORS.right, DOORS.left, DOORS.right, DOORS.cottage, DOORS.mill, DOORS.post]), r = Math.random();
        if (r < 0.18) errand(from, DOORS.pub, {}, function() {
          PUBN++;
        });
        else if (r < 0.36 && QS.well.list.length < 4) errand(from, DOORS.wellq, {}, function(w) {
          joinQ(QS.well, w);
        });
        else if (r < 0.54 && QS.bus.list.length < 4) errand(from, DOORS.busq, {}, function(w) {
          joinQ(QS.bus, w);
        });
        else if (r < 0.8 && QS.market.list.length < 3) errand(from, DOORS.marketq, {}, function(w) {
          joinQ(QS.market, w);
        });
        else errand(from, exitDoor(), {});
      }
    });
    (function() {
      var w0 = L.well, crank = 0, serve = 0;
      QS.well = queue(function(i) {
        return { x: w0.x + 34 + i * 23, y: B + 14 + (i ? 7 : 0) };
      }, -1);
      S.push({
        layer: "back",
        update: function(dt) {
          updateQ(QS.well, dt);
          var f = qFront(QS.well);
          if (f) {
            serve += dt;
            crank += dt * 5;
            if (serve > 2.6) {
              serve = 0;
              f.v.happy = 1.2;
              leaveQ(QS.well, exitDoor(), ICON.bucket);
            }
          } else serve = 0;
        },
        draw: function() {
          var up = clamp(serve / 2.6, 0, 1), by = B - 30 - up * 22;
          ctx.strokeStyle = "#6B5A4E";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(w0.x, B - 58);
          ctx.lineTo(w0.x, by - 6);
          ctx.stroke();
          ctx.strokeStyle = "#8D6440";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w0.x - 18, B - 58);
          ctx.lineTo(w0.x + 22, B - 58);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(w0.x + 22, B - 58);
          ctx.lineTo(w0.x + 22 + Math.cos(crank) * 7, B - 58 + Math.sin(crank) * 7);
          ctx.stroke();
          if (up > 0.05) blit(ICON.bucket, w0.x, by + 8, 1, 1, 1, 1);
        }
      });
    })();
    (function() {
      var p = L.pub, t = rand(6, 14), cat = { on: 0, from: 0, hop: 0, t: rand(20, 40) };
      var roofs = [{ x: p.x + 6, y: B - 98 }, { x: L.bakery.x - 8, y: B - 126 }];
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          cat.t -= dt;
          if (cat.hop > 0) cat.hop = Math.max(0, cat.hop - dt / 0.9);
          if (!asleep && cat.t < 0 && WX.rain < 0.3) {
            cat.from = cat.on;
            cat.on = 1 - cat.on;
            cat.hop = 1;
            cat.t = rand(25, 55);
          }
          if (nightness > 0.6) return;
          t -= dt;
          if (t < 0) {
            t = rand(10, 22);
            if (PUBN > 0) {
              PUBN--;
              errand(DOORS.pub, exitDoor(), { wobble: true, speed: 26 });
            }
          }
        },
        draw: function(time, asleep) {
          if (WX.rain > 0.3) return;
          var a = roofs[cat.from], b = roofs[cat.on], k = 1 - cat.hop;
          var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * (cat.hop > 0 ? 44 : 0), face2 = b.x > a.x ? 1 : -1;
          ctx.strokeStyle = "#5F6270";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          var sw = asleep ? 0 : Math.sin(time * 1.8) * 5;
          ctx.beginPath();
          ctx.moveTo(x - face2 * 6, y - 3);
          ctx.quadraticCurveTo(x - face2 * 16, y - 4, x - face2 * 14 + sw, y - 16);
          ctx.stroke();
          blit(ICON.cat, x, y + 2, face2, 1, 1, 1);
        },
        light: function(a) {
          ctx.fillStyle = "rgba(255,212,120," + (0.9 * a).toFixed(2) + ")";
          rr(ctx, p.x - 4, B - 56, 20, 16, 4);
          ctx.fill();
          rr(ctx, p.x + 30, B - 56, 20, 16, 4);
          ctx.fill();
        }
      });
    })();
    (function() {
      var b = L.bakery, smoke = 0, burn = 50, bake3 = rand(6, 14), busy = false;
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          smoke -= dt;
          if (smoke < 0 && !asleep) {
            smoke = TRADE.wood > 0 ? rand(0.3, 0.6) : rand(1.8, 2.8);
            parts.push({ kind: "smoke", x: b.x + 38 + rand(-2, 2), y: B - 138, vx: rand(4, 10), vy: -15, life: 3.6, max: 3.6 });
          }
          burn -= dt;
          if (burn < 0) {
            burn = 50;
            if (TRADE.wood > 0) TRADE.wood--;
          }
          if (asleep || nightness > 0.35 || busy) return;
          bake3 -= dt;
          if (bake3 < 0 && TRADE.flour > 0 && TRADE.bread < 3) {
            bake3 = rand(25, 45);
            TRADE.flour--;
            busy = true;
            errand(DOORS.bakery, DOORS.marketside, { col: "#F3DE7C", hat: "chef", carry: ICON.loaf, speed: 26 }, function(w) {
              TRADE.bread = Math.min(3, TRADE.bread + 1);
              w.v.happy = 1.5;
              puff("heart", w.v.x, w.v.y - 44, 1, "#FF7FA0");
              leg(w, route(DOORS.marketside, DOORS.bakery), function() {
                busy = false;
              });
            });
          } else if (bake3 < 0) bake3 = 8;
        },
        draw: function() {
          for (var i = 0; i < TRADE.wood; i++) {
            var x = b.x + 76 + i % 3 * 13 + (i >= 3 ? 6.5 : 0), y = B - 6 - (i >= 3 ? 11 : 0);
            ctx.fillStyle = "#8A5A36";
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 7);
            ctx.fill();
            ctx.fillStyle = "#E2C08E";
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 7);
            ctx.fill();
          }
          for (i = 0; i < TRADE.flour; i++) blit(ICON.sack, b.x - 62 + i * 9, B + 2, 1, 1, 1, 1);
        },
        light: function(a) {
          ctx.globalAlpha = a * 0.5;
          ctx.drawImage(GLOW, b.x - 6, B - 70, 56, 56);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(255,212,120," + (0.9 * a).toFixed(2) + ")";
          rr(ctx, b.x + 4, B - 56, 36, 28, 5);
          ctx.fill();
        }
      });
    })();
    (function() {
      var t = rand(6, 16), stops = ["school", "pub", "bakery", "cottage", "mill"];
      S.push({
        layer: null,
        update: function(dt, asleep) {
          if (asleep || nightness > 0.35 || POSTIE.busy) return;
          t -= dt;
          if (t > 0) return;
          t = rand(30, 55);
          if (LETTER.queue.length) return;
          POSTIE.busy = true;
          var list = stops.slice().sort(function() {
            return Math.random() - 0.5;
          }).slice(0, 3), at = DOORS.post;
          var w = walker(DOORS.post, { col: "#F6C28B", hat: "postcap", speed: 32 });
          (function next() {
            var to = list.length ? DOORS[list.shift()] : DOORS.post, from = at;
            at = to;
            if (to === DOORS.post) {
              leg(w, route(from, to), function() {
                POSTIE.busy = false;
              });
              return;
            }
            leg(w, route(from, to), function() {
              parts.push({ kind: "icon", icon: ICON.letter, x: w.v.x, y: w.v.y - 40, vx: -w.v.face * 12, vy: -40, life: 0.8, max: 0.8 });
              puff("heart", to.x, to.y - 50, 1, "#FF7FA0");
              w.pause = 0.9;
              w.v.happy = 1;
              next();
            }, ICON.letter);
          })();
        },
        draw: function() {
        }
      });
    })();
    (function() {
      var run = null, PB = { x: L.post.x + 57, y: B - 34 };
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          if (run) {
            var w = run.w, t = run.t;
            if (run.st === "road") return;
            if (run.st === "walk") {
              if (asleep || nightness > 0.6) {
                run.st = "back";
                w.q = null;
                leg(w, fromHere(w, DOORS.post), function() {
                  POSTIE.busy = false;
                  run = null;
                });
                LETTER.queue.unshift(run.letter);
                return;
              }
              var gx = t.x - t.face * t.r * 1.2, gy = t.y + 4;
              if (walkV(w.v, gx, gy, 36, dt) || Math.abs(w.v.x - t.x) + Math.abs(w.v.y - t.y) < t.r * 1.6) {
                t.letter = run.letter;
                t.happy = 2.2;
                t.jump = 0.6;
                say("!", t.x, t.y - t.r * 2.6);
                parts.push({ kind: "icon", icon: ICON.letter, x: w.v.x, y: w.v.y - 40, vx: (t.x - w.v.x) * 1.5, vy: -50, life: 0.7, max: 0.7 });
                w.v.happy = 1.5;
                w.v.face = t.x > w.v.x ? 1 : -1;
                w.carry = null;
                w.q = null;
                run.st = "back";
                leg(w, fromHere(w, DOORS.post), function() {
                  POSTIE.busy = false;
                  run = null;
                });
              }
            }
            return;
          }
          if (!LETTER.queue.length || asleep || nightness > 0.35 || POSTIE.busy) return;
          var L1 = LETTER.queue[0], to = fam.filter(function(f) {
            return f.person.name === L1.to;
          })[0];
          if (!to || offStage(to)) return;
          LETTER.queue.shift();
          POSTIE.busy = true;
          var w2 = walker(DOORS.post, { col: "#F6C28B", hat: "postcap", speed: 34 });
          run = { w: w2, t: to, letter: L1, st: "road" };
          leg(w2, route(DOORS.post, { x: to.x, y: R, lane: [] }), function() {
            run.st = "walk";
            w2.q = run;
            w2.carry = ICON.letter;
          }, ICON.letter);
        },
        draw: function(time) {
          if (LETTER.queue.length && !run) blit(ICON.letter, PB.x, PB.y + Math.sin(time * 2) * 1.5, 1, 1, 1, 1.4);
        }
      });
    })();
    (function() {
      var m = L.market, keeper = mkV("#F29E8E", "cap", m.x, B - 44), k = 0, serve = 0;
      QS.market = queue(function(i) {
        return { x: m.x + 10 + i * 25, y: B + 20 };
      }, -1);
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          tickV(keeper, dt);
          updateQ(QS.market, dt);
          if (asleep) return;
          k += dt;
          keeper.x = m.x + Math.sin(k * 0.7) * 16;
          keeper.face = Math.cos(k * 0.7) > 0 ? 1 : -1;
          var f = qFront(QS.market);
          if (f) {
            keeper.face = 1;
            serve += dt;
            if (serve > 2) {
              serve = 0;
              keeper.happy = 2;
              f.v.happy = 2;
              parts.push({ kind: "coin", x: f.v.x - 6, y: f.v.y - 40, vx: -30, vy: -70, life: 0.8, max: 0.8 });
              var gets = ICON.apple;
              if (TRADE.bread > 0) {
                TRADE.bread--;
                gets = ICON.loaf;
              }
              leaveQ(QS.market, exitDoor(), gets);
            }
          } else serve = 0;
        },
        draw: function(time, asleep) {
          drawV(keeper, asleep, true);
          blit(MFRONT, m.x, m.y, 1, 1, 1, 1);
          for (var i = 0; i < TRADE.bread; i++) blit(ICON.loaf, m.x - 50 + i % 2 * 18, m.y - 38 - (i > 1 ? 7 : 0), 1, 1, 1, 1);
        }
      });
    })();
    (function() {
      var b = L.bus, cart = { x: -200, st: "off", t: rand(12, 25), board: 0, wheel: 0 }, pony = mkV("#C69C6D", "none", -200, R + 8, 17);
      QS.bus = queue(function(i) {
        return { x: b.x - 30 - i * 23, y: R + 13 };
      }, 1);
      var stopX = b.x + 64;
      S.push({
        layer: "back",
        late: true,
        update: function(dt, asleep) {
          updateQ(QS.bus, dt);
          tickV(pony, dt);
          var v = 0;
          if (cart.st === "off") {
            cart.t -= dt;
            if (cart.t < 0 && nightness < 0.35) {
              cart.st = "in";
              cart.x = -120;
            }
          } else if (cart.st === "in") {
            v = Math.min(70, 16 + (stopX - cart.x) * 1.2);
            cart.x += v * dt;
            if (cart.x >= stopX - 0.5) {
              cart.x = stopX;
              cart.st = "stop";
              cart.t = 4;
              cart.board = 0.6;
            }
          } else if (cart.st === "stop") {
            cart.t -= dt;
            cart.board -= dt;
            if (cart.board < 0 && QS.bus.list.length) {
              var w = QS.bus.list.shift();
              WALKERS.splice(WALKERS.indexOf(w), 1);
              puff("heart", cart.x - 50, R - 30, 1, "#FF7FA0");
              cart.board = 0.6;
              cart.t = Math.max(cart.t, 1.2);
            }
            if (cart.t < 0) {
              for (var n = Math.random() * 3 | 0; n > 0; n--) {
                var off = { x: cart.x - 40 - n * 10, y: R + 10, lane: [] };
                errand(off, DOORS[pick(["cottage", "mill", "post", "pub", "bakery", "school"])], {});
              }
              cart.st = "out";
            }
          } else {
            v = Math.min(70, (cart.v || 0) + 40 * dt);
            cart.v = v;
            cart.x += v * dt;
            if (cart.x > W + 220) {
              cart.st = "off";
              cart.v = 0;
              cart.t = rand(40, 75);
            }
          }
          pony.x = cart.x;
          pony.y = R + 8;
          pony.moving = v > 1;
          if (v > 1) pony.phase += v * dt / (pony.r * 0.9);
          pony.face = 1;
          cart.wheel += v * dt / 9;
        },
        draw: function() {
          if (cart.st === "off") return;
          var wx = cart.x - 50;
          blit(ICON.wagon, wx, R + 4, 1, 1, 1, 1);
          [-22, 20].forEach(function(o) {
            var cx = wx + o, cy = R + 2;
            ctx.fillStyle = "#6B4A34";
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, 7);
            ctx.fill();
            ctx.strokeStyle = "#D9B27A";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (var s = 0; s < 3; s++) {
              var a = cart.wheel + s * 1.047;
              ctx.moveTo(cx - Math.cos(a) * 6, cy - Math.sin(a) * 6);
              ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6);
            }
            ctx.stroke();
          });
          drawV(pony, false);
        }
      });
    })();
    (function() {
      var m = L.mill, ang = rand(0, 6), t = rand(8, 20), busy = false;
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          ang += dt * (asleep ? 0.12 : 0.45 + WX.rain * 0.7) + dt * WX.wind * 1.4;
          if (asleep || nightness > 0.35 || busy) return;
          t -= dt;
          if (t > 0) return;
          if (TRADE.flour >= 3) {
            t = 10;
            return;
          }
          t = rand(35, 60);
          busy = true;
          errand(DOORS.mill, DOORS.bakery, { col: "#E8C3A0", hat: "cap", carry: ICON.sack, speed: 24 }, function(w) {
            TRADE.flour = Math.min(3, TRADE.flour + 1);
            w.v.happy = 1.4;
            leg(w, route(DOORS.bakery, DOORS.mill), function() {
              busy = false;
            });
          });
        },
        draw: function() {
          var hx = m.x, hy = B - 124;
          ctx.save();
          ctx.translate(hx, hy);
          for (var s = 0; s < 4; s++) {
            ctx.save();
            ctx.rotate(ang + s * Math.PI / 2);
            ctx.fillStyle = "#8D6440";
            ctx.fillRect(-2, 6, 4, 74);
            ctx.fillStyle = "rgba(247,241,230,.95)";
            ctx.fillRect(3, 16, 15, 62);
            ctx.strokeStyle = "#B3A48C";
            ctx.lineWidth = 1;
            ctx.strokeRect(3, 16, 15, 62);
            ctx.beginPath();
            for (var y = 28; y < 78; y += 12) {
              ctx.moveTo(3, y);
              ctx.lineTo(18, y);
            }
            ctx.stroke();
            ctx.restore();
          }
          ctx.fillStyle = "#7E4331";
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, 7);
          ctx.fill();
          ctx.restore();
        },
        light: function(a) {
          ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")";
          rr(ctx, m.x - 8, B - 84, 16, 18, 4);
          ctx.fill();
        }
      });
    })();
    S.push({
      layer: "back",
      update: function() {
      },
      // "back", or draw() never runs
      draw: function() {
        if (kitBag()) blit(ICON.bag, L.cottage.x + 6, B + 3, 1, 1, 1, 1);
      },
      light: function(a) {
        ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")";
        rr(ctx, L.cottage.x + 6, B - 44, 26, 20, 4);
        ctx.fill();
      }
    });
    (function() {
      var s = L.shop, v = mkV("#E8C3A0", "cap", s.x + 62, s.y + 4), sw = 0, st = "empty", stage = 0, bell = 0, idleT = 0, hold = 0, bub = 0, smoke = 0;
      function stageFor(p) {
        return p < 12 ? 0 : p < 40 ? 1 : p < 70 ? 2 : p < 95 ? 3 : 4;
      }
      function collapse() {
        for (var i = 0; i < 4; i++) puff("poof", s.x + rand(-40, 40), s.y - rand(10, 60), 4, "#FFFFFF");
        puff("chip", s.x, s.y - 30, 12, "#C9A06A");
        say("oops!", s.x, s.y - 80);
        v.face = -1;
      }
      S.push({
        layer: "back",
        v,
        update: function(dt, asleep) {
          tickV(v, dt);
          bell = Math.max(0, bell - dt);
          bub -= dt;
          smoke -= dt;
          hold += dt;
          var ps = printerState(), next;
          if (ps === "running" || ps === "pause") next = ps;
          else if (/^(prepare|slicing|init)$/.test(ps)) next = "prep";
          else if (ps === "finish") next = "done";
          else if (ps === "failed") next = "failed";
          else if (ps === "idle" && (st === "done" || st === "failed")) {
            idleT += dt;
            next = idleT > 30 * 60 ? "empty" : st;
          } else next = "empty";
          if (ps !== "idle") idleT = 0;
          if (next !== st) {
            var was = st;
            st = next;
            hold = 0;
            if (st === "failed") collapse();
            else if (st === "done") {
              bell = 3;
              stage = 4;
              say("ding!", s.x, s.y - 100);
              puff("heart", s.x, s.y - 70, 4, "#FF7FA0");
              v.happy = 3;
            } else if (st === "running" || st === "prep" || st === "pause") {
              if (was === "empty" || was === "done" || was === "failed") stage = st === "prep" ? 0 : stageFor(PR.progress);
            }
          }
          if (st === "running") {
            var want = stageFor(PR.progress);
            if (want > stage && hold > 1.5) {
              stage = want;
              hold = 0;
              puff("chip", s.x + rand(-30, 30), s.y - 20 - stage * 12, 6, "#D9B27A");
              v.happy = 1;
            }
            v.face = -1;
            sw += dt / 0.9;
            if (sw >= 1) {
              sw = 0;
              if (Math.random() < 0.5) puff("chip", s.x + 30, s.y - 14 - stage * 8, 2, "#D9B27A");
            }
          } else if (st === "pause" || st === "failed") {
            if (bub <= 0 && Math.random() < dt * 0.3) bub = 1.6;
          } else if (st === "prep") {
            v.face = -1;
            if (bub <= 0 && Math.random() < dt * 0.4) bub = 1.6;
          } else if (st === "done" && !asleep && smoke < 0) {
            smoke = rand(0.8, 1.6);
            parts.push({ kind: "smoke", x: s.x + 30 + rand(-2, 2), y: s.y - 88, vx: rand(4, 10), vy: -14, life: 3, max: 3 });
          }
        },
        draw: function(time, asleep) {
          if (st === "empty") return;
          var stg = st === "failed" ? -1 : st === "done" ? 4 : stage;
          if (stg < 0) blit(SHOP.rubble, s.x, s.y, 1, 1, 1, 1);
          else {
            if (stg < 4) blit(SHOP.frame, s.x, s.y, 1, 1, 1, 1);
            if (stg === 1) blit(SHOP.walls1, s.x, s.y, 1, 1, 1, 1);
            if (stg >= 2) blit(SHOP.walls2, s.x, s.y, 1, 1, 1, 1);
            if (stg >= 3) blit(SHOP.roof, s.x, s.y - 48, 1, 1, 1, 1);
            if (stg === 4) blit(SHOP.sign, s.x - 56, s.y, 1, 1, 1, 1);
          }
          if (st === "done") {
            blit(SHOP.bunting, s.x, s.y - 92, 1, 1, 1, 1);
            var ba = bell > 0 ? Math.sin(bell * 14) * 0.5 : 0;
            ctx.save();
            ctx.translate(s.x + 30, s.y - 100);
            ctx.rotate(ba);
            ctx.fillStyle = "#E8B33C";
            ctx.beginPath();
            ctx.moveTo(-5, 7);
            ctx.quadraticCurveTo(-5, -3, 0, -3);
            ctx.quadraticCurveTo(5, -3, 5, 7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          if (st === "pause") {
            var sc = depth(v.y);
            ctx.drawImage(SHADOW, v.x - v.r * 1.2 * sc, v.y - 4, v.r * 2.4 * sc, v.r * 0.7 * sc);
            blit(asleep ? v.spr.shut : v.spr.open, v.x, v.y - 6, -1, 1.12, 0.78, sc);
            if (bub > 0) blit(BUBS.dots, v.x + 12, v.y - 36, 1, 1, 1, 1);
            return;
          }
          drawV(v, asleep);
          if (st === "prep" && bub > 0) blit(BUBS.dots, v.x + 12, v.y - v.r * 2.1, 1, 1, 1, 1);
          if (st === "running" && !asleep) {
            var a = sw < 0.7 ? -0.3 - 2 * (sw / 0.7) : -2.3 + 2.1 * ((sw - 0.7) / 0.3);
            var hx = v.x - 8, hy = v.y - v.r * 0.9 * depth(v.y), ex = hx - Math.cos(a) * 22, ey = hy + Math.sin(a) * 22;
            ctx.strokeStyle = "#8D6440";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.save();
            ctx.translate(ex, ey);
            ctx.rotate(-a);
            ctx.fillStyle = "#6E7480";
            ctx.fillRect(-6, -4, 12, 8);
            ctx.restore();
          }
          if (st === "failed" && bub > 0) blit(BUBS.dots, v.x + 12, v.y - v.r * 2.1, 1, 1, 1, 1);
        },
        light: function(a) {
          if (st === "done" || st === "running") {
            ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")";
            rr(ctx, s.x + 12, s.y - 36, 20, 16, 4);
            ctx.fill();
          }
        }
      });
    })();
    (function() {
      var s = L.school, door = { x: s.x, y: s.y + 4 }, Y0 = s.y + 22, Y1 = s.y + 80, X0 = s.x - 62, X1 = s.x + 84;
      var sw = L.swing, piv = { x: sw.x, y: sw.y - 98 }, RL = 66, th = 0, amp = 0, k = 0;
      var kids = [0, 1, 2, 3].map(function(i) {
        var v = mkV(VCOLS[(i * 3 + 2) % VCOLS.length], ["none", "beanie", "none", "beanie2"][i], door.x, door.y, 13);
        v.inside = true;
        v.delay = 0;
        v.pause = 0;
        v.tx = door.x;
        v.ty = door.y;
        return v;
      });
      var st = "in", t = rand(8, 18), it = 0, bell = 0, SWINGER = 3;
      function ring() {
        bell = 2.2;
        say("ding!", s.x + 22, s.y - 140);
      }
      function yard() {
        return { x: rand(X0, X1), y: rand(Y0, Y1) };
      }
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          bell = Math.max(0, bell - dt);
          SCHOOL_OUT = st === "out";
          var swinger = kids[SWINGER], onSwing = st === "out" && swinger.onSwing;
          amp += ((onSwing ? 0.7 : 0) - amp) * dt * 0.5;
          k += dt;
          th = amp * Math.sin(k * 2.2);
          if (asleep) {
            st = "in";
            kids.forEach(function(v) {
              v.inside = true;
              v.onSwing = false;
            });
            return;
          }
          kids.forEach(function(v) {
            tickV(v, dt);
          });
          t -= dt;
          if (st === "in") {
            if (t < 0 && nightness < 0.3 && WX.rain < 0.2) {
              st = "out";
              t = rand(24, 34);
              ring();
              it = Math.random() * 3 | 0;
              kids.forEach(function(v, i) {
                v.inside = false;
                v.x = door.x;
                v.y = door.y;
                v.delay = i * 0.5;
                var p = yard();
                v.tx = p.x;
                v.ty = p.y;
                v.onSwing = false;
              });
            }
            return;
          }
          if (st === "out" && (t < 0 || WX.rain > 0.4)) {
            st = "home";
            ring();
          }
          kids.forEach(function(v, i) {
            if (v.inside) return;
            if (v.delay > 0) {
              v.delay -= dt;
              return;
            }
            if (st === "home") {
              v.onSwing = false;
              if (walkV(v, door.x, door.y, 52, dt)) v.inside = true;
              return;
            }
            if (i === SWINGER) {
              if (!v.onSwing && walkV(v, piv.x, piv.y + RL, 40, dt)) v.onSwing = true;
              if (v.onSwing) {
                v.x = piv.x + Math.sin(th) * RL;
                v.y = piv.y + Math.cos(th) * RL;
                v.face = Math.cos(k * 2.2) > 0 ? 1 : -1;
                v.moving = false;
                if (Math.abs(th) > 0.62 && Math.random() < dt * 0.4) {
                  v.happy = 0.6;
                  if (Math.random() < 0.3) say("wheee!", sw.x, sw.y - 124);
                }
              }
              return;
            }
            if (v.pause > 0) {
              v.pause -= dt;
              v.moving = false;
              return;
            }
            var chaser = kids[it];
            if (i === it) {
              var prey = null, bd = 1e9;
              kids.forEach(function(o, j) {
                if (j !== it && j !== SWINGER && !o.inside && o.delay <= 0) {
                  var dd = dist(o, v);
                  if (dd < bd) {
                    bd = dd;
                    prey = o;
                  }
                }
              });
              if (prey) {
                walkV(v, prey.x, prey.y, 50, dt);
                if (bd < 15) {
                  it = kids.indexOf(prey);
                  prey.pause = 0.9;
                  prey.happy = 0.9;
                  v.happy = 1;
                  say("tag!", prey.x, prey.y - 34);
                }
              }
            } else if (dist(v, chaser) < 70 && chaser.pause <= 0) {
              var ax = v.x - chaser.x, ay = v.y - chaser.y, al = Math.sqrt(ax * ax + ay * ay) || 1;
              walkV(v, clamp(v.x + ax / al * 40, X0, X1), clamp(v.y + ay / al * 40, Y0, Y1), 46, dt);
            } else if (walkV(v, v.tx, v.ty, 26, dt)) {
              var p = yard();
              v.tx = p.x;
              v.ty = p.y;
            }
          });
          if (st === "home" && kids.every(function(v) {
            return v.inside;
          })) {
            st = "in";
            t = rand(50, 90);
          }
        },
        draw: function(time, asleep) {
          var ba = bell > 0 ? Math.sin(bell * 14) * 0.5 : 0;
          ctx.save();
          ctx.translate(s.x, s.y - 122);
          ctx.rotate(ba);
          ctx.fillStyle = "#E8B33C";
          ctx.beginPath();
          ctx.moveTo(-6, 8);
          ctx.quadraticCurveTo(-6, -4, 0, -4);
          ctx.quadraticCurveTo(6, -4, 6, 8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          var sx = piv.x + Math.sin(th) * RL, sy = piv.y + Math.cos(th) * RL, c = Math.cos(th), sn = Math.sin(th);
          ctx.drawImage(SHADOW, sx - 18, sw.y - 6, 36, 10);
          ctx.strokeStyle = "#7A6A58";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(piv.x - 12, piv.y);
          ctx.lineTo(sx - 12 * c, sy + 12 * sn);
          ctx.moveTo(piv.x + 12, piv.y);
          ctx.lineTo(sx + 12 * c, sy - 12 * sn);
          ctx.stroke();
          var out = kids.filter(function(v) {
            return !v.inside && v.delay <= 0;
          }).sort(function(a, b) {
            return a.y - b.y;
          });
          out.forEach(function(v) {
            drawV(v, asleep, v.onSwing);
          });
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(-th);
          ctx.fillStyle = "#B98A5C";
          ctx.fillRect(-15, -2, 30, 5);
          ctx.restore();
        }
      });
    })();
    (function() {
      var w = L.wood, home = { x: DOORS.wood.x, y: DOORS.wood.y }, v = mkV("#BCD98A", "beanie", home.x, home.y), sw = rand(0, 1), chops = 0, pile = 3, away = false;
      var g = {
        layer: "back",
        v,
        mode: "work",
        update: function(dt, asleep) {
          if (asleep || away) return;
          tickV(v, dt);
          if (g.mode === "shoo") {
            shoo(g, dt);
            return;
          }
          if (g.mode === "home") {
            if (walkV(v, home.x, home.y, 44, dt)) g.mode = "work";
            return;
          }
          lookForFox(g, dt);
          v.face = 1;
          sw += dt / 1.1;
          if (sw >= 1) {
            sw = 0;
            chops++;
            puff("chip", w.x, w.y - 18, 3, "#D9B27A");
            if (chops >= 4) {
              chops = 0;
              pile = Math.min(6, pile + 1);
            }
          }
          if (pile >= 4 && TRADE.wood <= 3 && nightness < 0.35) {
            pile -= 3;
            away = true;
            errand(DOORS.wood, DOORS.bakeryside, { col: "#BCD98A", hat: "beanie", carry: ICON.log, speed: 26 }, function(wk) {
              TRADE.wood = Math.min(6, TRADE.wood + 3);
              wk.v.happy = 1.5;
              leg(wk, route(DOORS.bakeryside, DOORS.wood), function() {
                away = false;
                v.x = home.x;
                v.y = home.y;
              });
            });
          }
        },
        draw: function(time, asleep) {
          for (var i = 0; i < pile; i++) {
            var x = w.x + 36 + i % 3 * 13 + (i >= 3 ? 6.5 : 0), y = w.y - 6 - (i >= 3 ? 11 : 0);
            ctx.fillStyle = "#8A5A36";
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, 7);
            ctx.fill();
            ctx.fillStyle = "#E2C08E";
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 7);
            ctx.fill();
          }
          if (away) return;
          drawV(v, asleep);
          if (g.mode === "work" && !asleep) {
            var a = sw < 0.7 ? -0.3 - 2 * (sw / 0.7) : -2.3 + 2.1 * ((sw - 0.7) / 0.3);
            var hx = v.x + 8, hy = v.y - v.r * 0.9 * depth(v.y), ex = hx + Math.cos(a) * 26, ey = hy + Math.sin(a) * 26;
            ctx.strokeStyle = "#8D6440";
            ctx.lineWidth = 3.5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.save();
            ctx.translate(ex, ey);
            ctx.rotate(a);
            ctx.fillStyle = "#9AA3AD";
            ctx.fillRect(-4, -7, 8, 11);
            ctx.restore();
          }
        }
      };
      S.push(g);
    })();
    (function() {
      var s = L.wash, hung = 5, st = "idle", t = 0, washer = null;
      var CL = [["#E86A5B", "shirt"], ["#FFFFFF", "sock"], ["#6C8FD0", "dress"], ["#F3DE7C", "shirt"], ["#E68AB0", "sock"]];
      function want() {
        return WX.rain > 0.2 || nightness > 0.45 ? 0 : 5;
      }
      S.push({
        layer: "back",
        update: function(dt, asleep) {
          if (st === "idle") {
            if (want() !== hung && !asleep) {
              st = "go";
              errand(DOORS.cottage, DOORS.wash, { col: "#EDB3A8", hat: "none", speed: WX.rain > 0.2 ? 48 : 28 }, function(w) {
                st = "work";
                t = 0.4;
                washer = w;
              });
            }
          } else if (st === "work") {
            t -= dt;
            if (t < 0) {
              t = 0.5;
              washer.v.face = 1;
              washer.v.happy = 0.3;
              var n = want();
              if (hung > n) hung--;
              else if (hung < n) hung++;
              else {
                st = "back";
                leg(washer, route(DOORS.wash, DOORS.cottage), function() {
                  st = "idle";
                });
              }
            }
          }
        },
        draw: function(time) {
          var x0 = s.x - 63, x1 = s.x + 64, ly = s.y - 66, wind = 0.1 + WX.rain * 0.35 + WX.wind * 0.3, lean = -WX.wind * 0.55;
          ctx.strokeStyle = "rgba(90,80,70,.8)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x0, ly);
          ctx.quadraticCurveTo(s.x, ly + 12, x1, ly);
          ctx.stroke();
          for (var i = 0; i < hung; i++) {
            var cx = x0 + 16 + i * 24, cy = ly + 3 + 10 * (1 - Math.pow((cx - s.x) / 64, 2)) * 0.5, c = CL[i];
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(lean + Math.sin(time * (2 + 4 * WX.wind) + i) * wind);
            ctx.fillStyle = c[0];
            if (c[1] === "shirt") {
              ctx.fillRect(-9, 0, 18, 18);
              ctx.fillRect(-13, 0, 26, 7);
            } else if (c[1] === "dress") {
              ctx.beginPath();
              ctx.moveTo(-6, 0);
              ctx.lineTo(6, 0);
              ctx.lineTo(11, 22);
              ctx.lineTo(-11, 22);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillRect(-3, 0, 6, 14);
              ctx.fillRect(-3, 10, 10, 5);
            }
            ctx.fillStyle = "#C8A26A";
            ctx.fillRect(-1.5, -2, 3, 4);
            ctx.restore();
          }
        }
      });
    })();
    (function() {
      var gd = L.garden, v = mkV("#D9C6A5", "straw", gd.x - 76, gd.y + 20), plants = [rand(0, 0.9), rand(0, 0.6), 1, rand(0, 0.9)], i = 0, st = "walk", t = 0, carrots = 2;
      function px(n) {
        return gd.x - 60 + n * 40;
      }
      var g = {
        layer: "front",
        v,
        mode: "work",
        update: function(dt, asleep) {
          if (asleep) return;
          tickV(v, dt);
          if (g.mode === "shoo") {
            shoo(g, dt);
            return;
          }
          if (g.mode === "home") {
            if (walkV(v, px(i) - 16, gd.y + 20, 44, dt)) {
              g.mode = "work";
              st = "walk";
            }
            return;
          }
          lookForFox(g, dt);
          for (var n = 0; n < 4; n++) if (n !== i) plants[n] = Math.min(1, plants[n] + dt * 4e-3);
          if (st === "walk") {
            if (walkV(v, px(i) - 16, gd.y + 20, 20, dt)) {
              v.face = 1;
              if (plants[i] >= 1) {
                st = "pick";
                t = 1.2;
                v.happy = 1.5;
              } else {
                st = "water";
                t = rand(2, 3);
              }
            }
          } else if (st === "water") {
            t -= dt;
            plants[i] = Math.min(1, plants[i] + dt * 0.14);
            if (Math.random() < dt * 10) parts.push({ kind: "drop", x: v.x + 24, y: v.y - v.r * 1.1, vx: rand(10, 30), vy: rand(-20, 0), life: 0.5, max: 0.5 });
            if (t < 0) {
              i = (i + 1) % 4;
              st = "walk";
            }
          } else {
            t -= dt;
            if (t < 0) {
              plants[i] = 0;
              carrots = carrots % 5 + 1;
              puff("heart", v.x, v.y - v.r * 2.2, 1, "#FF9F43");
              i = (i + 1) % 4;
              st = "walk";
            }
          }
        },
        draw: function(time, asleep) {
          for (var n = 0; n < 4; n++) sprout(px(n), gd.y - 4, plants[n]);
          for (var c = 0; c < carrots; c++) blit(ICON.carrot, gd.x + 100 + c * 4, gd.y + 6, 1, 1, 1, 1);
          ctx.fillStyle = "#C8955A";
          ctx.beginPath();
          ctx.ellipse(gd.x + 108, gd.y - 4, 18, 14, 0, 0, Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#9A6C3C";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gd.x + 90, gd.y - 4);
          ctx.lineTo(gd.x + 126, gd.y - 4);
          ctx.stroke();
          drawV(v, asleep);
          if (st === "water" && g.mode === "work" && !asleep) {
            var cx = v.x + 12, cy = v.y - v.r * 1;
            ctx.fillStyle = "#7FA7C9";
            rr(ctx, cx - 2, cy - 6, 14, 11, 3);
            ctx.fill();
            ctx.strokeStyle = "#7FA7C9";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 4);
            ctx.lineTo(cx + 18, cy - 10);
            ctx.stroke();
          }
        }
      };
      S.push(g);
    })();
    (function() {
      var b = L.band, trio = [mkV("#C9DDB0", "cap", b.x - 38, b.y - 6), mkV("#F7CFD8", "none", b.x, b.y - 10), mkV("#E4B363", "beanie2", b.x + 38, b.y - 6)];
      trio[0].face = 1;
      trio[2].face = -1;
      var play = true, t = rand(40, 60), note = 0, k = 0, bub = null, bubT = 0, who = 0;
      S.push({
        layer: "front",
        update: function(dt, asleep) {
          trio.forEach(function(v2) {
            tickV(v2, dt);
          });
          DANCE = null;
          bubT -= dt;
          if (asleep) return;
          t -= dt;
          if (t < 0) {
            play = !play;
            t = play ? rand(40, 70) : rand(12, 20);
            if (!play) say("thank you!", b.x, b.y - 150);
          }
          if (PARTY_T > 0.5 || MUSIC.on) {
            play = true;
            t = Math.max(t, 5);
          }
          if (play && (WX.rain < 0.6 || MUSIC_T > 0.5)) {
            k += dt;
            DANCE = { x: b.x, y: b.y - 30, r: 230, k };
            note -= dt;
            if (note < 0) {
              note = MUSIC_T > 0.5 ? rand(0.1, 0.25) : rand(0.25, 0.6);
              var v = pick(trio);
              parts.push({ kind: "note", x: v.x + rand(-6, 6), y: v.y - 44, vx: rand(-12, 12), vy: -32, life: 1.6, max: 1.6, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A"]) });
            }
          } else if (bubT <= 0 && Math.random() < dt * 0.5) {
            who = (who + 1) % 3;
            bub = pick([BUBS.ha, BUBS.dots, BUBS.heart, BUBS.note]);
            bubT = 1.5;
            trio[who].happy = 1;
          }
        },
        draw: function(time, asleep) {
          var beat = DANCE ? Math.sin(DANCE.k * 7) : 0, m = asleep || !DANCE ? 0 : MUSIC_T * (1 - PARTY_T);
          trio.forEach(function(v, i) {
            var bt = DANCE ? Math.sin(DANCE.k * 7 + i) : 0, sy = 1 + (DANCE ? (0.05 + 0.07 * m) * bt : 0);
            var hop = m * Math.max(0, bt) * 8, rot = m * 0.13 * (DANCE ? Math.sin(DANCE.k * 3.5 + i * 1.7) : 0);
            var spr = asleep ? v.spr.shut : DANCE || v.happy > 0 ? v.spr.happy : v.blinkT > 0 ? v.spr.shut : v.spr.open, sc = depth(v.y);
            blit(spr, v.x, v.y - hop, v.face, 1 / sy, sy, sc, rot);
            var hy = v.y - v.r * 0.9 * sc - hop, sw = beat * (1 + 1.4 * m);
            if (i === 0) {
              ctx.fillStyle = "#9C5B2E";
              ctx.beginPath();
              ctx.ellipse(v.x + 12, hy + 2, 5, 8, 0.6, 0, 7);
              ctx.fill();
              ctx.strokeStyle = "#E2C08E";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(v.x + 4 + sw * 4, hy - 8);
              ctx.lineTo(v.x + 22 + sw * 4, hy + 8);
              ctx.stroke();
            } else if (i === 1) {
              ctx.fillStyle = "#D9534F";
              ctx.fillRect(v.x - 11, hy + 4, 22, 13);
              ctx.fillStyle = "#FFF4E8";
              ctx.beginPath();
              ctx.ellipse(v.x, hy + 4, 11, 3.5, 0, 0, 7);
              ctx.fill();
              ctx.strokeStyle = "#8D6440";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(v.x - 7, hy + 3);
              ctx.lineTo(v.x - 12, hy - 7 - Math.max(0, sw) * 5);
              ctx.moveTo(v.x + 7, hy + 3);
              ctx.lineTo(v.x + 12, hy - 7 - Math.max(0, -sw) * 5);
              ctx.stroke();
            } else {
              var hb = m * 8 * bt;
              ctx.fillStyle = "#E8B33C";
              ctx.beginPath();
              ctx.moveTo(v.x - 6, hy);
              ctx.lineTo(v.x - 22, hy - 7 - hb);
              ctx.lineTo(v.x - 22, hy + 7 - hb);
              ctx.closePath();
              ctx.fill();
            }
          });
          if (bubT > 0 && bub) blit(bub, trio[who].x + 12, trio[who].y - 42, 1, 1, 1, 1);
        }
      });
    })();
    (function() {
      var p = L.pitch, X0 = p.x - 96, X1 = p.x + 96, Y0 = p.y - 22, Y1 = p.y + 22;
      var pl = [["#F6C28B", "beanie", -60, -10], ["#F3DE7C", "beanie", -34, 14], ["#C9DDB0", "beanie2", 38, -12], ["#E8C3A0", "beanie2", 62, 12]].map(function(a, i) {
        var v = mkV(a[0], a[1], p.x + a[2], p.y + a[3], 13);
        v.team = i < 2 ? 0 : 1;
        v.home = { x: v.x, y: v.y };
        v.drift = null;
        return v;
      });
      var ball = { x: p.x, y: p.y, fx: p.x, fy: p.y, tx: p.x, ty: p.y, k: 1, dur: 1, h: 0, to: null, goal: false }, wait = 1.5, lastKick = null;
      function nearestTo(x, y) {
        var best = null, bd = 1e9;
        pl.forEach(function(v) {
          var d = Math.abs(v.x - x) + Math.abs(v.y - y);
          if (d < bd) {
            bd = d;
            best = v;
          }
        });
        return best;
      }
      function kick(from) {
        var goal = Math.random() < 0.22, mates = pl.filter(function(o) {
          return o !== from;
        }), to = pick(mates);
        ball.fx = ball.x;
        ball.fy = ball.y;
        ball.goal = goal;
        lastKick = from;
        if (goal) {
          ball.tx = from.team ? X0 - 10 : X1 + 10;
          ball.ty = p.y + rand(-9, 9);
          ball.to = null;
        } else {
          ball.tx = clamp(to.x + rand(-18, 18), X0 + 6, X1 - 6);
          ball.ty = clamp(to.y + rand(-8, 8), Y0, Y1);
          ball.to = to;
        }
        ball.k = 0;
        ball.h = rand(6, 20);
        ball.dur = Math.sqrt(Math.pow(ball.tx - ball.fx, 2) + Math.pow(ball.ty - ball.fy, 2)) / 120 + 0.25;
        from.happy = 0.4;
      }
      S.push({
        layer: "front",
        update: function(dt, asleep) {
          pl.forEach(function(v) {
            tickV(v, dt);
          });
          if (asleep || WX.storm > 0.5) return;
          if (ball.k < 1) {
            ball.k = Math.min(1, ball.k + dt / ball.dur);
            ball.x = ball.fx + (ball.tx - ball.fx) * ball.k;
            ball.y = ball.fy + (ball.ty - ball.fy) * ball.k;
            if (ball.k >= 1) {
              if (ball.goal) {
                say("goal!", ball.x, ball.y - 30);
                pl.forEach(function(v) {
                  if (v.team === lastKick.team) v.happy = 2.2;
                });
                wait = 2.4;
              } else wait = 0.3;
            }
          } else {
            wait -= dt;
            if (wait < 0) {
              if (ball.goal) {
                ball.x = p.x;
                ball.y = p.y;
                ball.goal = false;
                kick(nearestTo(p.x, p.y));
              } else {
                var k = nearestTo(ball.x, ball.y);
                if (Math.abs(k.x - ball.x) + Math.abs(k.y - ball.y) < 18) kick(k);
              }
            }
          }
          var chaser = ball.goal ? null : ball.k < 1 ? ball.to : nearestTo(ball.x, ball.y);
          pl.forEach(function(v) {
            if (v === chaser) walkV(v, ball.k < 1 ? ball.tx - (v.team ? -8 : 8) : ball.x - (v.team ? -8 : 8), ball.k < 1 ? ball.ty : ball.y, 56, dt);
            else {
              if (!v.drift || walkV(v, v.drift.x, v.drift.y, 20, dt)) v.drift = { x: clamp(v.home.x + rand(-30, 30), X0, X1), y: clamp(v.home.y + rand(-10, 10), Y0, Y1) };
              if (!v.moving) v.face = ball.x > v.x ? 1 : -1;
            }
          });
        },
        draw: function(time, asleep) {
          if (WX.storm > 0.5) return;
          pl.slice().sort(function(a, b) {
            return a.y - b.y;
          }).forEach(function(v) {
            drawV(v, asleep);
          });
          var hh = Math.sin(ball.k * Math.PI) * ball.h;
          ctx.fillStyle = "rgba(30,70,40,.25)";
          ctx.beginPath();
          ctx.ellipse(ball.x, ball.y + 2, 5, 2, 0, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(ball.x, ball.y - 3 - hh, 4.5, 0, 7);
          ctx.fill();
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(ball.x + 1, ball.y - 4 - hh, 1.6, 0, 7);
          ctx.fill();
        }
      });
    })();
    (function() {
      var f = L.fish, v = mkV("#E4B363", "bucket", f.x, f.y), st = "wait", t = rand(4, 10), fishes = 1, arc = 0, boot = false, k = 0, bx = f.x - 32, by = f.y + 6;
      var duck = { th: rand(0, 6), pause: 0 };
      function dpos(th) {
        return { x: POND.x + Math.cos(th) * POND.rx * 0.62, y: POND.y + Math.sin(th) * POND.ry * 0.42 };
      }
      S.push({
        layer: "front",
        update: function(dt, asleep) {
          tickV(v, dt);
          k += dt;
          if (!asleep) {
            if (duck.pause > 0) duck.pause -= dt;
            else {
              duck.th += dt * 0.11;
              if (Math.random() < dt * 0.04) duck.pause = rand(1.5, 3);
            }
          }
          if (asleep) {
            st = "wait";
            return;
          }
          t -= dt;
          if (st === "wait") {
            if (t < 0) {
              st = "bite";
              t = 1.3;
              say("!", v.x, v.y - v.r * 2.4);
            }
          } else if (st === "bite") {
            if (t < 0) {
              st = "reel";
              arc = 0;
              boot = Math.random() < 0.2;
            }
          } else {
            arc += dt / 0.9;
            if (arc >= 1) {
              st = "wait";
              t = rand(8, 18);
              if (boot) say("?", v.x, v.y - v.r * 2.4);
              else {
                fishes = fishes % 4 + 1;
                v.happy = 2.2;
                puff("heart", v.x, v.y - v.r * 2.2, 2, "#FF7FA0");
              }
            }
          }
        },
        draw: function(time, asleep) {
          var dp = dpos(duck.th), dir = -Math.sin(duck.th) >= 0 ? 1 : -1;
          for (var n = 3; n >= 1; n--) {
            var q = dpos(duck.th - n * 0.19 - Math.sin(time * 1.3 + n) * 0.02);
            blit(ICON.duckling, q.x, q.y + Math.sin(time * 3 + n) * 0.8, -Math.sin(duck.th - n * 0.19) >= 0 ? 1 : -1, 1, 1, 1);
          }
          ctx.strokeStyle = "rgba(255,255,255,.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(dp.x, dp.y, 16, 3, 0, 0, 7);
          ctx.stroke();
          blit(ICON.duck, dp.x, dp.y + Math.sin(time * 2) * 1, dir, 1, 1, 1, duck.pause > 0 && duck.pause < 1.2 && !asleep ? -dir * 0.7 : 0);
          var bob = { x: f.bx, y: f.by + (st === "bite" ? 4 + 2 * Math.sin(k * 25) : Math.sin(time * 2) * 1.5) };
          ctx.strokeStyle = "rgba(255,255,255,.5)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(f.bx, f.by + 3, st === "bite" ? 14 : 9 + Math.sin(time * 2) * 2, 3.5, 0, 0, 7);
          ctx.stroke();
          ctx.fillStyle = "#F59E5B";
          for (var i = 0; i < fishes; i++) {
            var tx = bx - 6 + i * 4;
            ctx.beginPath();
            ctx.moveTo(tx, by - 16);
            ctx.lineTo(tx - 3, by - 22);
            ctx.lineTo(tx + 3, by - 22);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = "#8FA6B8";
          ctx.beginPath();
          ctx.moveTo(bx - 10, by - 16);
          ctx.lineTo(bx + 10, by - 16);
          ctx.lineTo(bx + 8, by);
          ctx.lineTo(bx - 8, by);
          ctx.closePath();
          ctx.fill();
          drawV(v, asleep);
          var bend = st !== "wait", sc = depth(v.y), hx = v.x + 8, hy = v.y - v.r * 0.8 * sc;
          var tip = { x: hx + (bend ? 46 : 38), y: hy - (bend ? 26 : 44) };
          ctx.strokeStyle = "#7A5A3A";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.quadraticCurveTo(hx + 26, hy - (bend ? 36 : 30), tip.x, tip.y);
          ctx.stroke();
          var end = bob;
          if (st === "reel") end = { x: f.bx + (bx - f.bx) * arc, y: f.by + (by - 20 - f.by) * arc - Math.sin(arc * Math.PI) * 80 };
          ctx.strokeStyle = "rgba(255,255,255,.75)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          if (st === "reel") blit(boot ? ICON.boot : ICON.fish, end.x, end.y + 8, -1, 1, 1, 1);
          else {
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(bob.x, bob.y, 4, 0, 7);
            ctx.fill();
            ctx.fillStyle = "#E0474C";
            ctx.beginPath();
            ctx.arc(bob.x, bob.y, 4, Math.PI, 0);
            ctx.fill();
          }
        }
      });
    })();
    return S;
  }
  function drawRainbow() {
    if (WX.bow <= 0.01) return;
    var cx = W * 0.55, cy = HZ + 30, r0 = 230, cols = ["#E86A5B", "#F4A340", "#F3DE7C", "#7BC47F", "#6C8FD0", "#9A72C8"];
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, HZ - 22);
    ctx.clip();
    ctx.globalAlpha = 0.42 * WX.bow;
    ctx.lineWidth = 7;
    for (var i = 0; i < cols.length; i++) {
      ctx.strokeStyle = cols[i];
      ctx.beginPath();
      ctx.arc(cx, cy, r0 - i * 7, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  var RAIN = null;
  var DARK = 0, FOGSPR = null, SNOWMAN = null, BUNTING = null, CAKE = null, BALLOONS = [], FW = [], ROCKETS = [];
  var WMAP = {
    "sunny": "clear",
    "clear-night": "clear",
    "partlycloudy": "partly",
    "cloudy": "cloudy",
    "fog": "fog",
    "rainy": "rain",
    "snowy": "snow",
    "snowy-rainy": "snow",
    "pouring": "storm",
    "lightning": "storm",
    "lightning-rainy": "storm",
    "hail": "storm",
    "exceptional": "storm",
    "windy": "windy",
    "windy-variant": "windy"
  };
  var WTARGET = {
    clear: [0.1, 0, 0, 0, 0],
    partly: [0.45, 0, 0, 0, 0],
    cloudy: [0.9, 0, 0, 0, 0],
    rain: [0.9, 1, 0, 0, 0],
    storm: [1, 1, 1, 0, 0],
    fog: [0.6, 0, 0, 1, 0],
    snow: [0.8, 0, 0, 0, 1],
    windy: [0.45, 0, 0, 0, 0]
  };
  function weatherNow() {
    if (WFORCE) return { mode: WFORCE === "sunny" ? "clear" : WFORCE, wind: WFORCE === "windy" ? 1 : WFORCE === "storm" ? 0.7 : 0.1, temp: 12, test: true };
    var w = DATA.weather, ok = w && w.state && w.state !== "unavailable" && w.state !== "unknown";
    if (!ok && !RAIN) return null;
    var a = ok ? w.attributes || {} : {}, mode = ok ? WMAP[w.state] || "clear" : "cloudy", ws = +a.wind_speed || 0;
    if (a.wind_speed_unit === "m/s") ws *= 3.6;
    else if (a.wind_speed_unit === "mph") ws *= 1.61;
    var wind = clamp((ws - 15) / 35, 0, 1);
    if (mode === "windy") wind = Math.max(wind, 0.8);
    if (RAIN === "raining" && !/^(rain|storm|snow)$/.test(mode)) mode = "rain";
    return { mode, wind, temp: a.temperature, unit: a.temperature_unit || "°C" };
  }
  function darkness(d) {
    var s = DATA.sun, t = d.getTime();
    if (!s || !s.next_setting || !s.next_rising) return sleepCurve(d, 20.5);
    var set = new Date(s.next_setting).getTime(), rise = new Date(s.next_rising).getTime(), DAY = 864e5, M = 6e4;
    while (set - t > DAY * 0.8) set -= DAY;
    while (t - set > DAY * 0.8) set += DAY;
    while (rise - t > DAY * 0.5) rise -= DAY;
    while (t - rise > DAY * 0.5) rise += DAY;
    if (t >= set - 10 * M) return clamp((t - (set - 10 * M)) / (55 * M), 0, 1);
    if (t <= rise + 10 * M) return clamp((rise + 10 * M - t) / (55 * M), 0, 1);
    return 0;
  }
  function sleepCurve(d, bed) {
    var h = d.getHours() + d.getMinutes() / 60;
    if (h >= bed || h < 6.5) return 1;
    if (h >= bed - 1) return h - (bed - 1);
    if (h < 7.5) return 7.5 - h;
    return 0;
  }
  function updateWeather(dt) {
    var wm = weatherNow(), T;
    WX.live = !!wm;
    if (wm) {
      T = WTARGET[wm.mode] || WTARGET.clear;
      WX.windT = wm.wind;
      WX.temp = wm.temp;
      WX.unit = wm.unit;
      WX.mode = wm.mode;
      WX.test = wm.test;
    } else {
      WX.t -= dt;
      if (WX.st === "dry") {
        if (WX.t < 0) {
          WX.st = "rain";
          WX.t = rand(50, 80);
        }
      } else if (WX.t < 0) {
        WX.st = "dry";
        WX.t = rand(600, 1500);
      }
      T = WX.st === "rain" ? WTARGET.rain : WTARGET.partly;
      WX.windT = 0.1;
      WX.mode = WX.st === "rain" ? "rain" : "partly";
    }
    var k = Math.min(1, dt / 5);
    WX.cloud += (T[0] - WX.cloud) * k;
    WX.rain += (T[1] - WX.rain) * k;
    WX.storm += (T[2] - WX.storm) * k;
    WX.fog += (T[3] - WX.fog) * k;
    WX.snow += (T[4] - WX.snow) * k;
    WX.wind += (WX.windT - WX.wind) * k;
    if (WX.wasRain && T[1] === 0 && T[4] === 0 && DARK < 0.3) WX.bowT = 60;
    WX.wasRain = T[1] > 0;
    WX.bowT = (WX.bowT || 0) - dt;
    WX.bow = clamp(WX.bow + (WX.bowT > 5 ? dt / 3 : -dt / 5), 0, 1);
    if (WX.storm > 0.6) {
      WX.flashT = (WX.flashT || 3) - dt;
      if (WX.flashT < 0) {
        WX.flash = 1;
        WX.flashT = rand(5, 14);
        WX.bolt = bolt();
      }
    }
    WX.flash = Math.max(0, (WX.flash || 0) - dt * 3.2);
    var i, p, slant = 80 + 280 * WX.wind;
    if (WX.rain > 0.01) for (i = 0; i < WX.drops.length; i++) {
      p = WX.drops[i];
      p.y += 560 * p.s * dt;
      p.x -= slant * dt;
      if (p.y > H) {
        p.y -= H + 20;
        p.x = rand(0, W + 200);
      }
      if (p.x < -40) p.x += W + 80;
    }
    if (WX.snow > 0.01) for (i = 0; i < WX.flakes.length; i++) {
      p = WX.flakes[i];
      p.y += (30 + 30 * p.s) * dt;
      p.x += (Math.sin(clockT * 1.3 + p.ph) * 18 - 60 * WX.wind) * dt;
      if (p.y > H) {
        p.y = -5;
        p.x = rand(0, W);
      }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    }
    if (WX.wind > 0.35 && Math.random() < dt * WX.wind * 5)
      parts.push({ kind: "leaf", x: W + 10, y: rand(HZ, H - 40), vx: -rand(140, 260) * WX.wind, vy: rand(-20, 20), life: 7, max: 7, ph: rand(0, 6), col: pick(["#6FB673", "#9CCB6A", "#D9B04A"]) });
    if (WX.wind > 0.6 && Math.random() < dt * 0.05 && WALKERS.length) {
      var w = pick(WALKERS);
      say("!", w.v.x, w.v.y - 46);
      parts.push({ kind: "hat", x: w.v.x, y: w.v.y - w.v.r * 2, vx: -rand(120, 180), vy: -60, life: 4, max: 4, ph: 0, col: pick(["#D9534F", "#6C8FD0", "#EDCB74"]) });
    }
  }
  function bolt() {
    var x = rand(W * 0.3, W * 0.9), y = 0, pts = [[x, y]];
    while (y < HZ - 20) {
      y += rand(18, 32);
      x += rand(-22, 22);
      pts.push([x, y]);
    }
    return pts;
  }
  function makeWeatherSprites() {
    FOGSPR = canvas(W, 200);
    var g = FOGSPR.getContext("2d");
    for (var i = 0; i < 14; i++) {
      var x = rand(0, W), y = rand(60, 140), r = rand(90, 170), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(240,244,248,.55)");
      gr.addColorStop(1, "rgba(240,244,248,0)");
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    SNOWMAN = icon(54, 78, function(g2) {
      rimmed(g2, "#B8C4D0", "#FBFDFF", 1.5, function(e) {
        g2.beginPath();
        g2.arc(27, 56, 20 + e, 0, 7);
        g2.fill();
        g2.beginPath();
        g2.arc(27, 28, 14 + e, 0, 7);
        g2.fill();
      });
      g2.fillStyle = INK;
      [[22, 25], [32, 25], [27, 50], [27, 58], [27, 66]].forEach(function(p) {
        g2.beginPath();
        g2.arc(p[0], p[1], 1.8, 0, 7);
        g2.fill();
      });
      g2.fillStyle = "#F28C38";
      g2.beginPath();
      g2.moveTo(27, 29);
      g2.lineTo(38, 31);
      g2.lineTo(27, 32);
      g2.closePath();
      g2.fill();
      g2.fillStyle = "#D9534F";
      g2.fillRect(14, 38, 26, 5);
      g2.fillRect(34, 38, 5, 12);
      g2.fillStyle = "#2B2433";
      g2.fillRect(18, 12, 18, 4);
      g2.fillRect(21, 0, 12, 13);
      g2.strokeStyle = "#7A5238";
      g2.lineWidth = 2;
      g2.lineCap = "round";
      g2.beginPath();
      g2.moveTo(8, 50);
      g2.lineTo(0, 40);
      g2.moveTo(46, 50);
      g2.lineTo(54, 42);
      g2.stroke();
    });
    SV.sprites.snowman = SNOWMAN;
    SV.sprites.glow = GLOW;
    var cols = ["#E86A5B", "#F3DE7C", "#6C8FD0", "#7BC47F", "#E68AB0", "#F4A340"];
    if (VIL) {
      var L = LAY, B = L.B;
      BUNTING = canvas(W * K, 90 * K);
      g = BUNTING.getContext("2d");
      g.scale(K, K);
      [[L.pub.x + 66, L.bakery.x - 62], [L.bakery.x + 62, L.post.x - 50], [L.post.x + 50, L.market.x - 70], [L.market.x + 70, L.cottage.x - 46], [L.cottage.x + 46, L.mill.x - 30]].forEach(function(s) {
        var x0 = s[0], x1 = s[1], y0 = 34, sag = 22, n = Math.max(3, Math.floor((x1 - x0) / 18));
        g.strokeStyle = "rgba(90,80,70,.8)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x0, y0);
        g.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0);
        g.stroke();
        for (var i2 = 0; i2 < n; i2++) {
          var u = (i2 + 0.5) / n, x2 = x0 + (x1 - x0) * u, y2 = y0 + sag * 4 * u * (1 - u) * 1;
          g.fillStyle = cols[i2 % cols.length];
          g.beginPath();
          g.moveTo(x2 - 6, y2);
          g.lineTo(x2 + 6, y2);
          g.lineTo(x2, y2 + 13);
          g.closePath();
          g.fill();
        }
      });
      CAKE = icon(50, 56, function(g2) {
        g2.fillStyle = "#C69C6D";
        g2.fillRect(4, 50, 42, 5);
        rimmed(g2, "#C98AA0", "#FBE3EC", 1.2, function(e) {
          rr(g2, 6 - e, 30 - e, 38 + 2 * e, 20 + 2 * e, 5);
          g2.fill();
          rr(g2, 12 - e, 16 - e, 26 + 2 * e, 16 + 2 * e, 5);
          g2.fill();
        });
        g2.fillStyle = "#FFFFFF";
        [8, 14, 20, 26, 32, 38].forEach(function(x2) {
          g2.beginPath();
          g2.arc(x2, 30, 3, 0, Math.PI);
          g2.fill();
        });
        g2.fillStyle = "#E86A5B";
        [16, 25, 34].forEach(function(x2) {
          g2.beginPath();
          g2.arc(x2, 24, 2, 0, 7);
          g2.fill();
        });
        ["#6C8FD0", "#F3DE7C", "#7BC47F"].forEach(function(c, i2) {
          g2.fillStyle = c;
          g2.fillRect(17 + i2 * 7, 6, 3, 10);
        });
      });
      BALLOONS = [
        [L.band.x - 70, L.band.y - 92],
        [L.band.x - 26, L.band.y - 92],
        [L.band.x + 26, L.band.y - 92],
        [L.band.x + 70, L.band.y - 92],
        [L.market.x - 60, B - 86],
        [L.market.x + 60, B - 86],
        [L.bakery.x + 70, B - 80]
      ].map(function(a, i2) {
        return { x: a[0], y: a[1], ph: rand(0, 6), col: cols[i2 % cols.length], len: rand(26, 40) };
      });
    } else {
      BUNTING = null;
      BALLOONS = [];
    }
    makePartySprites(cols);
  }
  function drawWeatherGround() {
    if (SCENE.weather && SCENE.weather.ground) SCENE.weather.ground(ctx, SV, WX);
  }
  function drawWeatherSky(time) {
    if (WX.cloud > 0.3) {
      ctx.globalAlpha = clamp((WX.cloud - 0.3) * 1.4, 0, 1) * 0.9;
      for (var i = 0; i < CLOUDS.length; i++) {
        var c = CLOUDS[i], x = (c.x + W * 0.45) % (W + 260) - 130;
        ctx.drawImage(c.c, x, c.y + 30 - i * 8);
      }
      ctx.globalAlpha = 1;
    }
  }
  function drawWeatherFront(time) {
    var i;
    if (WX.cloud > 0.35) {
      ctx.fillStyle = "rgba(80,92,112," + (0.16 * (WX.cloud - 0.35) / 0.65).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (WX.fog > 0.02) {
      ctx.globalAlpha = 0.7 * WX.fog;
      [[H - 330, 12], [H - 230, 20], [H - 130, 30]].forEach(function(l, n2) {
        var off = time * l[1] % W;
        ctx.drawImage(FOGSPR, -off, l[0], W, 200);
        ctx.drawImage(FOGSPR, W - off, l[0], W, 200);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(236,240,244," + (0.16 * WX.fog).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (WX.rain > 0.01) {
      var heavy = WX.storm;
      ctx.fillStyle = "rgba(60,70,92," + (0.2 * WX.rain + 0.18 * heavy).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(225,235,255," + (0.55 * WX.rain).toFixed(3) + ")";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      var n = Math.round(WX.drops.length * WX.rain * (0.6 + 0.4 * heavy)), dx = 4 + 14 * WX.wind;
      for (i = 0; i < n; i++) {
        var p = WX.drops[i];
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + dx, p.y - 15);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * WX.rain).toFixed(3) + ")";
      ctx.beginPath();
      if (POND) for (i = 0; i < 5; i++) {
        var a = rand(0, 6.28), rr_ = rand(0.1, 0.8);
        ctx.moveTo(POND.x + Math.cos(a) * POND.rx * rr_ + 5, POND.y + Math.sin(a) * POND.ry * rr_ * 0.6);
        ctx.ellipse(POND.x + Math.cos(a) * POND.rx * rr_, POND.y + Math.sin(a) * POND.ry * rr_ * 0.6, 5, 1.6, 0, 0, 7);
      }
      ctx.stroke();
    }
    if (WX.snow > 0.01) {
      ctx.fillStyle = "rgba(255,255,255," + (0.9 * WX.snow).toFixed(3) + ")";
      ctx.beginPath();
      var nf = Math.round(WX.flakes.length * WX.snow);
      for (i = 0; i < nf; i++) {
        var f = WX.flakes[i];
        ctx.moveTo(f.x + 2 + f.s, f.y);
        ctx.arc(f.x, f.y, 2 + f.s, 0, 7);
      }
      ctx.fill();
    }
    if (WX.flash > 0) {
      ctx.fillStyle = "rgba(235,240,255," + (0.45 * WX.flash).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
      if (WX.bolt && WX.flash > 0.4) {
        ctx.strokeStyle = "rgba(255,255,230," + WX.flash.toFixed(2) + ")";
        ctx.lineWidth = 3;
        ctx.beginPath();
        WX.bolt.forEach(function(p2, j) {
          if (j) ctx.lineTo(p2[0], p2[1]);
          else ctx.moveTo(p2[0], p2[1]);
        });
        ctx.stroke();
      }
    }
  }
  var PARTY = null, PARTY_T = 0, HOUSE = null, HOUSE_T = 0, RAVE_W = 13.4;
  var MUSIC = { on: false, title: null, artist: null, at: null, err: null }, MUSIC_T = 0, MUSIC_W = 12.566, MUSIC_NOTE = 0;
  var SIGN = null, SIGN_KEY = "", SPECKS = [];
  var HP = { guest: 4, note: 0, card: null, key: "" }, HBAL = [], SPOTS = [], DISCO = null;
  function partyFor(title) {
    var t = String(title).trim(), all = PEOPLE.map(function(p2) {
      return p2.name;
    });
    if (/birthday|\bbday\b/i.test(t) && !/king/i.test(t)) {
      var p = PEOPLE.filter(function(q) {
        return q.name !== "House" && [q.name].concat(q.aliases || []).some(function(a) {
          return new RegExp("\\b" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t);
        });
      })[0];
      return p ? { who: [p.name], label: "Happy birthday " + p.name + "!" } : null;
    }
    if (/^anniversary!?$/i.test(t) || ANNIVERSARY.length && new RegExp("\\b(" + ANNIVERSARY.join("|") + ")\\b.*anniversary", "i").test(t))
      return { who: ANNIVERSARY.slice(), label: "Happy anniversary, " + ANNIVERSARY.join(" and ") + "!" };
    if (/halloween/i.test(t)) return { who: all, label: "Happy Halloween!" };
    if (/guy fawkes|bonfire/i.test(t)) return { who: all, label: "Bonfire night!" };
    if (/christmas/i.test(t)) return { who: all, label: "Merry Christmas!" };
    if (/new year'?s eve/i.test(t)) return { who: all, label: "Happy New Year!" };
    return null;
  }
  function friendParty(title) {
    var t = String(title).trim();
    if (!/birthday|\bbday\b/i.test(t) || /king/i.test(t) || partyFor(t)) return null;
    var n = t.replace(/birthday|\bbday\b/ig, " ").replace(/['’]s\b/g, "").replace(/\b\d+(st|nd|rd|th)?\b/g, " ").replace(/[^A-Za-zÀ-ɏ\s'-]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join(" ");
    if (n.length > 18) n = n.split(" ")[0].slice(0, 18);
    return { who: [], name: n, label: n ? n + "'s birthday" : "Birthday party" };
  }
  function forcedParty(kind) {
    var toks = decodeURIComponent(PFORCE).split(","), i, tk, P0;
    for (i = 0; i < toks.length; i++) {
      tk = toks[i].trim();
      if (/^(friend|house)(:|$)/i.test(tk)) {
        if (kind === "house") {
          P0 = friendParty((tk.split(":")[1] || "Pat") + "'s birthday");
          if (P0) {
            P0.start = 17;
            return P0;
          }
        }
        continue;
      }
      if (kind !== "rave") continue;
      var f = PEOPLE.filter(function(p) {
        return p.name.toLowerCase() === tk.toLowerCase();
      })[0];
      P0 = f ? partyFor(f.name + " birthday") : partyFor(tk.replace(/-/g, " "));
      if (P0) {
        P0.start = 17;
        return P0;
      }
    }
    return null;
  }
  function startOf(e) {
    return e.all_day ? 17 : Math.min(17, new Date(e.start).getHours() + new Date(e.start).getMinutes() / 60);
  }
  function findParty() {
    if (PFORCE) return forcedParty("rave");
    var td = ymd(now());
    for (var i = 0; i < DATA.events.length; i++) {
      var e = DATA.events[i];
      if (e.day !== td) continue;
      var P = partyFor(e.what);
      if (P) {
        P.start = startOf(e);
        return P;
      }
    }
    for (i = 0; i < CD.length; i++) if (CD[i].days === 0 && CD[i].rave) {
      P = partyFor(CD[i].rave);
      if (P) {
        P.start = 17;
        return P;
      }
    }
    return null;
  }
  function findHouseParty() {
    if (PFORCE) return forcedParty("house");
    for (var i = 0; i < CD.length; i++) if (CD[i].days === 0) return { who: [], label: CD[i].party, start: 17 };
    var td = ymd(now());
    for (i = 0; i < DATA.events.length; i++) {
      var e = DATA.events[i];
      if (e.day !== td) continue;
      var P = friendParty(e.what);
      if (P) {
        P.start = startOf(e);
        return P;
      }
    }
    return null;
  }
  var HOUSE_COL = "#E0A050", SCHOOL_COL = "#C9594A", CD = [];
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return y + "-" + pad2(Math.floor(n / 31)) + "-" + pad2(n % 31 + 1);
  }
  function nextDate(md, td) {
    var y = +td.slice(0, 4), s = y + "-" + md;
    return s >= td ? s : y + 1 + "-" + md;
  }
  function daysUntil(ds, t) {
    return Math.round((/* @__PURE__ */ new Date(ds + "T12:00:00") - /* @__PURE__ */ new Date(ymd(t) + "T12:00:00")) / 864e5);
  }
  function termEnd(td) {
    var best = null;
    ((DATA.extra || {}).schools || []).forEach(function(sc) {
      (sc.terms || []).forEach(function(t) {
        if (t.to && t.to >= td && (!t.from || t.from <= td) && (!best || t.to < best)) best = t.to;
      });
    });
    return best;
  }
  function countdowns() {
    var t = now(), td = ymd(t), out = [], y = +td.slice(0, 4);
    Object.keys(DATES.birthdays).forEach(function(n) {
      var p = PEOPLE.filter(function(q) {
        return q.name === n;
      })[0];
      out.push({
        key: "bday-" + n,
        label: n,
        icon: "cake",
        col: p ? p.col : HOUSE_COL,
        date: nextDate(DATES.birthdays[n], td),
        rave: n + " birthday",
        party: "Happy birthday " + n + "!"
      });
    });
    DATES.fixed.forEach(function(f) {
      out.push({ key: f.key, label: f.label, icon: f.icon, col: HOUSE_COL, date: nextDate(f.md, td), rave: f.rave, party: f.party });
    });
    var es = easter(y);
    if (es < td) es = easter(y + 1);
    out.push({ key: "easter", label: "Easter", icon: "egg", col: HOUSE_COL, date: es, party: "Happy Easter!" });
    (DATA.holidays || []).forEach(function(h) {
      if (h.date >= td)
        out.push({ key: "hol-" + h.date + h.label, label: h.label, icon: "suitcase", col: HOUSE_COL, date: h.date, party: "Holiday time!" });
    });
    var te = termEnd(td);
    if (te) out.push({ key: "term", label: "End of term", icon: "school", col: SCHOOL_COL, date: te, party: "School's out!" });
    out.forEach(function(c) {
      c.days = daysUntil(c.date, t);
    });
    return out.sort(function(a, b) {
      return a.days - b.days;
    });
  }
  var DICON = {
    cake: '<path d="M11 4h2v5h-2z" fill="#F3DE7C"/><circle cx="12" cy="3.4" r="1.7" fill="#E86A5B"/><rect x="3.5" y="9" width="17" height="11" rx="2.5" fill="#E68AB0"/><path d="M3.5 9h17v2q-2.1 2.4-4.25 0t-4.25 0t-4.25 0T3.5 11z" fill="#FFF4F8"/>',
    school: '<rect x="11" y="1.5" width="2" height="4" fill="#C9594A"/><rect x="5" y="10" width="14" height="11" fill="#F6E7B8"/><path d="M2 11l10-8 10 8z" fill="#C9594A"/><rect x="10" y="14" width="4" height="7" rx="1.5" fill="#3B5FA8"/>',
    tree: '<path d="M12 2l5 7h-3l5 6h-4l4 5H5l4-5H5l5-6H7z" fill="#4E9A5A"/><rect x="10.5" y="19" width="3" height="3.5" fill="#8A5A3C"/><circle cx="12" cy="2.6" r="1.8" fill="#F3DE7C"/>',
    egg: '<path d="M12 2C8 2 5 8 5 13a7 7 0 0014 0C19 8 16 2 12 2z" fill="#E68AB0"/><path d="M5.6 11q3.2-2.4 6.4 0t6.4 0" fill="none" stroke="#FFF4F8" stroke-width="1.8"/><circle cx="9" cy="15.5" r="1.3" fill="#F3DE7C"/><circle cx="15" cy="15.5" r="1.3" fill="#F3DE7C"/><circle cx="12" cy="18" r="1.3" fill="#7FC8D2"/>',
    pumpkin: '<rect x="11" y="2" width="2.4" height="5" rx="1" fill="#4E9A5A"/><ellipse cx="12" cy="13.5" rx="9.5" ry="7.5" fill="#E08A3A"/><path d="M8.5 6.6q-2 7 0 13.6M15.5 6.6q2 7 0 13.6" fill="none" stroke="#C4703A" stroke-width="1.3"/><path d="M7.5 11.5l2.5 2.3h-2.5zM16.5 11.5l-2.5 2.3h2.5z" fill="#26352C"/><path d="M8.5 16.5q3.5 2.6 7 0" fill="none" stroke="#26352C" stroke-width="1.4"/>',
    fire: '<path d="M12 2.5c.6 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 .9-3.3 1.8-4.2.1 1.7 1 2.6 1.6 2.9C9.5 8 12 6.5 12 2.5z" fill="#E86A5B"/><path d="M12 10.5c.4 2 2.4 3 2.4 5.2a2.4 2.4 0 01-4.8 0c0-1 .5-1.8.9-2.2.1.9.5 1.3.8 1.4-.3-1.6.7-2.5.7-4.4z" fill="#F3DE7C"/><rect x="4" y="19" width="16" height="2.4" rx="1.2" fill="#8A5A3C"/>',
    suitcase: '<rect x="9" y="3" width="6" height="4" rx="1.5" fill="none" stroke="#8A5A3C" stroke-width="1.8"/><rect x="3" y="7" width="18" height="13" rx="2.5" fill="#6C8FD0"/><rect x="7.5" y="7" width="2" height="13" fill="#F3DE7C"/><rect x="14.5" y="7" width="2" height="13" fill="#F3DE7C"/>',
    sparkle: '<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#F3DE7C"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z" fill="#6C8FD0"/>'
  };
  var CD_KEY = "";
  function chipHtml(c) {
    var today = c.days === 0;
    return '<span class="dchip' + (today ? " now" : "") + '" style="border-color:' + shade(c.col, 0.72) + '"><svg class="dic" viewBox="0 0 24 24">' + (DICON[c.icon] || "") + '</svg><span class="dl">' + esc(c.label) + '</span><span class="dn" style="background:' + shade(c.col, 0.6) + '">' + (today ? "today" : c.days) + "</span></span>";
  }
  function renderDates() {
    var key = CD.map(function(c) {
      return c.key + ":" + c.days;
    }).join("|");
    if (key === CD_KEY) return;
    CD_KEY = key;
    var el = $("dates");
    el.innerHTML = CD.slice(0, 5).map(chipHtml).join("");
    while (el.children.length > 1 && el.scrollWidth > el.clientWidth) el.removeChild(el.lastChild);
  }
  function partyOn() {
    if (!PARTY) return false;
    var d = now(), h = d.getHours() + d.getMinutes() / 60;
    return h >= PARTY.start && nightness < 0.6;
  }
  function houseOn() {
    if (!HOUSE) return false;
    var d = now(), h = d.getHours() + d.getMinutes() / 60;
    return h >= HOUSE.start && nightness < 0.6;
  }
  function wearsHat(t) {
    return PARTY && PARTY_T > 0.01 && PARTY.who.indexOf(t.person.name) >= 0;
  }
  function drawPartyHat(t) {
    var a = CREATURE[t.person.look] && CREATURE[t.person.look].hat;
    if (!a) return;
    var rk = t.r * K, x = a[0] * rk, y = a[1] * rk, h = 0.8 * rk, w = 0.5 * rk;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a[2]);
    ctx.globalAlpha = PARTY_T;
    ctx.fillStyle = "#6C8FD0";
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(0, -h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#F3DE7C";
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -h * 0.32);
    ctx.lineTo(w * 0.32, -h * 0.32);
    ctx.lineTo(w * 0.2, -h * 0.55);
    ctx.lineTo(-w * 0.2, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#E86A5B";
    ctx.beginPath();
    ctx.arc(0, -h, w * 0.22, 0, 7);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  function updateParty(dt) {
    if (!VIL) DANCE = null;
    PARTY_T = clamp(PARTY_T + (partyOn() ? dt : -dt) / 3, 0, 1);
    HOUSE_T = clamp(HOUSE_T + (houseOn() ? dt : -dt) / 3, 0, 1);
    if (PARTY_T > 0.5) {
      DANCE = { x: W / 2, y: H / 2, r: 1e6, k: clockT * RAVE_W / 7, amp: 9, sq: 0.1, wig: 0.07 };
      for (var wi = 0; wi < WALKERS.length; wi++) if (WALKERS[wi].v.happy < 0.3) WALKERS[wi].v.happy = 0.6;
    }
    MUSIC_T = clamp(MUSIC_T + (MUSIC.on ? dt : -dt) / 2, 0, 1);
    if (MUSIC_T > 0.5 && PARTY_T <= 0.5 && nightness < 0.6) {
      DANCE = { x: W / 2, y: H / 2, r: 1e6, k: clockT * MUSIC_W / 7, amp: 6, sq: 0.08, wig: 0.05 };
      if (VIL && HOUSE_T <= 0.5) {
        MUSIC_NOTE -= dt;
        if (MUSIC_NOTE < 0) {
          MUSIC_NOTE = rand(0.7, 1.4);
          parts.push({ kind: "note", x: LAY.cottage.x + 19 + rand(-6, 6), y: LAY.B - 48, vx: rand(-14, 14), vy: -30, life: 1.9, max: 1.9, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A", "#E68AB0"]) });
        }
      }
    }
    if (VIL && HOUSE_T > 0.5) {
      HP.note -= dt;
      if (HP.note < 0) {
        HP.note = rand(0.45, 1);
        parts.push({ kind: "note", x: LAY.cottage.x + 19 + rand(-6, 6), y: LAY.B - 48, vx: rand(-14, 14), vy: -30, life: 1.9, max: 1.9, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A", "#E68AB0"]) });
      }
      if (nightness < 0.35 && WX.storm < 0.5) {
        HP.guest -= dt;
        if (HP.guest < 0) {
          HP.guest = rand(4, 9);
          if (WALKERS.length < 14) {
            var side = DOORS[pick(["left", "right", "mill", "post", "pub"])];
            if (Math.random() < 0.7) errand(side, DOORS.cottage, { carry: ICON.gift });
            else errand(DOORS.cottage, DOORS[pick(["left", "right", "mill", "post"])], {}).v.happy = 3;
          }
        }
      }
    } else HP.guest = Math.min(HP.guest, 2);
    if (PARTY_T > 0.5 && DARK > 0.45) {
      PARTY.fwT = (PARTY.fwT || 0) - dt;
      if (PARTY.fwT < 0) {
        PARTY.fwT = rand(0.5, 1.3);
        ROCKETS.push({ x: rand(W * 0.36, W * 0.72), y: HZ + 10, ty: rand(80, 140), col: pick(["#FF6B6B", "#FFD35C", "#7BE07F", "#6CB8FF", "#FF8FD1"]) });
      }
    }
    for (var i = ROCKETS.length - 1; i >= 0; i--) {
      var r = ROCKETS[i];
      r.y -= 220 * dt;
      if (r.y <= r.ty) {
        ROCKETS.splice(i, 1);
        for (var n = 0; n < 26; n++) {
          var a = n / 26 * 6.283, s = rand(45, 75);
          FW.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.4, max: 1.4, col: r.col });
        }
      }
    }
    for (i = FW.length - 1; i >= 0; i--) {
      var p = FW[i];
      p.life -= dt;
      if (p.life <= 0) {
        FW.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 45 * dt;
      p.vx *= 0.99;
    }
  }
  function drawFireworks() {
    if (!ROCKETS.length && !FW.length) return;
    ctx.lineWidth = 2;
    ROCKETS.forEach(function(r) {
      ctx.strokeStyle = "rgba(255,240,200,.8)";
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + 14);
      ctx.stroke();
    });
    var byCol = {};
    FW.forEach(function(p) {
      (byCol[p.col] = byCol[p.col] || []).push(p);
    });
    Object.keys(byCol).forEach(function(c) {
      ctx.fillStyle = c;
      ctx.beginPath();
      byCol[c].forEach(function(p) {
        ctx.globalAlpha = 1;
        ctx.moveTo(p.x + 2.2, p.y);
        ctx.arc(p.x, p.y, 2.2 * (0.5 + p.life / p.max), 0, 7);
      });
      ctx.fill();
    });
  }
  function drawPartyBack(time) {
    if (!VIL) return;
    if (PARTY_T > 0.01) {
      ctx.globalAlpha = PARTY_T;
      ctx.drawImage(BUNTING, 0, LAY.B - 110, W, 90);
      ctx.globalAlpha = 1;
    }
    if (HOUSE_T > 0.01) drawHouseBack(time);
  }
  function drawHouseBack(time) {
    var x = LAY.cottage.x, B = LAY.B, i, b;
    ctx.globalAlpha = HOUSE_T;
    blit(SHOP.bunting, x - 2, B - 60, 1, 1, 1, 1);
    for (i = 0; i < HBAL.length; i++) {
      b = HBAL[i];
      var bx = b.x + Math.sin(time * 1.3 + b.ph) * 3, by = b.y - b.len + Math.sin(time * 1.8 + b.ph) * 2.5;
      ctx.strokeStyle = "rgba(90,80,70,.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + 3, (b.y + by) / 2, bx, by + 9);
      ctx.stroke();
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.ellipse(bx, by, 7, 9.5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.ellipse(bx - 2.3, by - 3, 2, 2.8, 0, 0, 7);
      ctx.fill();
    }
    if (HOUSE && HOUSE.label !== HP.key) {
      HP.key = HOUSE.label;
      HP.card = bakeCard(HOUSE.label);
    }
    if (HP.card) ctx.drawImage(HP.card.c, x - HP.card.w / 2, B - 116 - HP.card.h + Math.sin(time * 1.6) * 2, HP.card.w, HP.card.h);
    ctx.globalAlpha = 1;
  }
  function bakeCard(text) {
    var f = "600 " + 17 * K + "px Fredoka", g0 = canvas(10, 10).getContext("2d");
    g0.font = f;
    var w = g0.measureText(text).width + 24 * K, h = 28 * K, c = canvas(w + 4 * K, h + 10 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "rgba(255,255,255,.95)";
    g.strokeStyle = "#E86A5B";
    g.lineWidth = 2 * K;
    rr(g, x, y, w, h, h / 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(x + w / 2 - 6 * K, y + h - 1);
    g.lineTo(x + w / 2, y + h + 7 * K);
    g.lineTo(x + w / 2 + 6 * K, y + h - 1);
    g.fill();
    g.fillStyle = "#26352C";
    g.font = f;
    g.textBaseline = "middle";
    g.textAlign = "center";
    g.fillText(text, x + w / 2, y + h / 2 + K);
    return { c, w: c.width / K, h: c.height / K };
  }
  function drawHouseLights(time) {
    if (HOUSE_T <= 0.01 || !VIL) return;
    var x = LAY.cottage.x, B = LAY.B, cols = ["255,212,120", "255,150,190", "150,200,255", "190,255,170"], k = time * 1.6, i = Math.floor(k) & 3, u = k - Math.floor(k);
    ctx.fillStyle = "rgba(" + cols[i] + "," + (HOUSE_T * (0.55 + 0.35 * DARK)).toFixed(2) + ")";
    rr(ctx, x + 6, B - 44, 26, 20, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(" + cols[i + 1 & 3] + "," + (HOUSE_T * u * (0.55 + 0.35 * DARK)).toFixed(2) + ")";
    rr(ctx, x + 6, B - 44, 26, 20, 4);
    ctx.fill();
    if (DARK > 0.1) {
      ctx.fillStyle = "rgba(" + cols[i] + "," + (HOUSE_T * DARK * 0.18).toFixed(2) + ")";
      ctx.beginPath();
      ctx.ellipse(x + 19, B + 4, 60, 16, 0, 0, 7);
      ctx.fill();
    }
  }
  function makePartySprites(cols) {
    var i;
    if (VIL) {
      var x = LAY.cottage.x, B = LAY.B;
      HBAL = [[x - 36, B - 34], [x + 40, B - 30], [x + 47, B - 36]].map(function(a, i2) {
        return { x: a[0], y: a[1], ph: rand(0, 6), col: cols[(i2 * 2 + 1) % cols.length], len: rand(28, 42) };
      });
    } else HBAL = [];
    SPOTS = [];
    for (i = 0; i < 12; i++) SPOTS.push({ x: rand(W * 0.05, W * 0.95), y: rand(TOP + 70, H - 30), ph: rand(0, 6), hue: i * 47 % 360 });
    DISCO = icon(60, 60, function(g) {
      g.fillStyle = "#8A93A6";
      g.beginPath();
      g.arc(30, 30, 28, 0, 7);
      g.fill();
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        var fx = 3 + c * 6.8, fy = 3 + r * 6.8, dx = fx + 3 - 30, dy = fy + 3 - 30;
        if (dx * dx + dy * dy > 26 * 26) continue;
        g.fillStyle = (r + c) % 3 === 0 ? "#F4F7FF" : (r + c) % 3 === 1 ? "#C9D2E6" : "#A6B0C6";
        g.fillRect(fx, fy, 5.8, 5.8);
      }
      g.fillStyle = "rgba(255,255,255,.55)";
      g.beginPath();
      g.ellipse(21, 19, 9, 6, -0.7, 0, 7);
      g.fill();
    });
  }
  function drawRaveLights(time) {
    if (PARTY_T <= 0.01) return;
    var a = PARTY_T, beat = Math.sin(time * RAVE_W), pump = Math.max(0, beat), glow = 0.6 + 0.8 * DARK, i, hue = time * 36 % 360 | 0;
    ctx.fillStyle = "hsla(" + hue + ",90%,60%," + (a * (0.07 + 0.09 * pump) * glow).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, H);
    for (i = 0; i < SPOTS.length; i++) {
      var s = SPOTS[i], sx = s.x + Math.sin(time * 0.8 + s.ph) * 46, sy = s.y + Math.sin(time * 0.5 + s.ph * 1.7) * 12, r = 26 + 9 * pump;
      ctx.fillStyle = "hsla(" + (s.hue + hue) % 360 + ",95%,65%," + (a * 0.27 * glow).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, 7);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    var rigs = VIL ? [[LAY.band.x, LAY.band.y - 70, 1], [LAY.pitch.x, LAY.pitch.y - 40, -1]] : [];
    for (var g = 0; g < rigs.length; g++) {
      var rx = rigs[g][0], ry = rigs[g][1];
      for (i = 0; i < 4; i++) {
        var th = rigs[g][2] * (i - 1.5) * 0.28 + Math.sin(time * 1.5 + i * 1.3 + g * 2) * 0.55, len = ry + 30;
        ctx.strokeStyle = "hsla(" + (hue + 90 * i + g * 45) % 360 + ",100%,65%," + (a * (0.22 + 0.18 * pump) * glow).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.tan(th) * len, -30);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    var cx = W / 2, cy = 92, R = 26;
    ctx.globalAlpha = a;
    ctx.strokeStyle = "rgba(60,60,70,.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy - R);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 / K, 1 / K);
    ctx.drawImage(DISCO.c, -30 * K, -30 * K);
    ctx.restore();
    ctx.fillStyle = "#FFFFFF";
    for (i = 0; i < 7; i++) {
      var ga = time * 1.4 + i * 0.9, gx = Math.cos(ga) * R * 0.78, gy = Math.sin(i * 2.3) * R * 0.6, gl = Math.max(0, Math.cos(ga));
      if (gl < 0.15) continue;
      ctx.globalAlpha = a * gl;
      ctx.fillRect(cx + gx - 2, cy + gy - 2, 4, 4);
    }
    for (i = 0; i < 10; i++) {
      var pa = time * 0.7 + i * 0.628, pr = 70 + 45 * (i * 7 % 3), px = cx + Math.cos(pa) * pr * 1.8, py = cy + Math.sin(pa) * pr * 0.55;
      ctx.globalAlpha = a * (0.25 + 0.35 * pump) * glow;
      ctx.fillStyle = "hsla(" + (hue + i * 36) % 360 + ",100%,80%,1)";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function trunc(g, text, max) {
    if (g.measureText(text).width <= max) return text;
    var core = text.replace(/\s*[(\[].*$/, "").replace(/\s+-\s+.*$/, "").replace(/\s+(feat\.?|ft\.|featuring)\s.*$/i, "");
    if (core && core !== text && g.measureText(core).width <= max) return core;
    text = core || text;
    while (text.length > 1 && g.measureText(text + "…").width > max) text = text.slice(0, -1);
    var sp = text.lastIndexOf(" ");
    if (sp > text.length * 0.6) text = text.slice(0, sp);
    return text.replace(/[\s,.(\-&]+$/, "") + "…";
  }
  function bakeSign(title, artist) {
    var ft = "600 " + 18 * K + "px Fredoka", fa = "500 " + 14 * K + "px Fredoka", max = 260 * K;
    var g0 = canvas(10, 10).getContext("2d"), t, a = null;
    g0.font = ft;
    t = trunc(g0, title, max);
    var tw = g0.measureText(t).width;
    var aw = 0;
    if (artist) {
      g0.font = fa;
      a = trunc(g0, artist, max);
      aw = g0.measureText(a).width;
    }
    var pad = 14 * K, w = Math.max(tw, aw) + pad * 2 + 18 * K, h = (a ? 50 : 32) * K, c = canvas(w + 4 * K, h + 4 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "#FFF6E3";
    g.strokeStyle = "#8D6440";
    g.lineWidth = 2.5 * K;
    rr(g, x, y, w, h, 9 * K);
    g.fill();
    g.stroke();
    g.fillStyle = "#D9534F";
    var nx = x + pad + 4 * K, ny = y + h / 2;
    g.beginPath();
    g.ellipse(nx - 2 * K, ny + 5 * K, 4.5 * K, 3.4 * K, -0.3, 0, 7);
    g.fill();
    g.fillRect(nx + 1.6 * K, ny - 9 * K, 2 * K, 14 * K);
    g.fillRect(nx + 1.6 * K, ny - 9 * K, 7 * K, 2.4 * K);
    g.textAlign = "left";
    g.textBaseline = "middle";
    var tx = x + pad + 18 * K;
    g.fillStyle = "#3B2A1E";
    g.font = ft;
    g.fillText(t, tx, a ? y + 17 * K : y + h / 2 + K);
    if (a) {
      g.fillStyle = "#86654A";
      g.font = fa;
      g.fillText(a, tx, y + 36 * K);
    }
    return { c, w: c.width / K, h: c.height / K };
  }
  function drawBandShow(time) {
    if (MUSIC_T <= 0.01 || !VIL) return;
    var bx = LAY.band.x, by = LAY.band.y, i;
    var awake = 1 - clamp((nightness - 0.3) / 0.3, 0, 1);
    var a = MUSIC_T * (1 - PARTY_T), live = a * awake, glow = 0.55 + 0.45 * DARK;
    var beat = Math.sin(clockT * MUSIC_W), pump = Math.max(0, beat), hue = time * 30 % 360 | 0;
    if (a > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,170,90," + (a * (0.1 + 0.08 * pump * awake) * glow).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(bx, by - 8, 130, 38, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,130," + (a * 0.1 * glow).toFixed(3) + ")";
      ctx.fillRect(bx - 66, by - 88, 132, 84);
      if (live > 0.01) {
        for (i = 0; i < 6; i++) {
          var sa = time * 0.7 + i * 1.05, sx = bx + Math.cos(sa) * (110 + 40 * (i % 2)), sy = by - 30 + Math.sin(sa) * 30, r = 22 + 7 * pump;
          ctx.fillStyle = "hsla(" + (hue + i * 60) % 360 + ",95%,62%," + (live * 0.22 * glow).toFixed(3) + ")";
          ctx.beginPath();
          ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, 7);
          ctx.fill();
        }
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        for (var c = -1; c <= 1; c += 2) {
          var ox = bx + c * 70, oy = by - 90;
          for (i = 0; i < 2; i++) {
            var th = c * (0.25 + i * 0.35) + Math.sin(time * 1.3 + i * 1.9 + c) * 0.45, len = 330;
            ctx.strokeStyle = "hsla(" + (hue + 120 * i + (c > 0 ? 60 : 0)) % 360 + ",100%,62%," + (live * (0.2 + 0.2 * pump) * glow).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox + Math.sin(th) * len, oy - Math.cos(th) * len);
            ctx.stroke();
          }
        }
      }
      if (!SPECKS.length) for (i = 0; i < 32; i++) SPECKS.push({ lon: i * 2.4, rad: 40 + i * 37 % 170, sq: 0.22 + 0.1 * (i * 5 % 3), s: 2 + i % 3, tw: i * 1.7 });
      var rot = time * 0.55, cy = by - 40;
      for (i = 0; i < SPECKS.length; i++) {
        var p = SPECKS[i], ang = p.lon + rot, px = bx + Math.cos(ang) * p.rad * 1.4, py = cy + 30 + Math.sin(ang) * p.rad * p.sq;
        var tw = 0.55 + 0.45 * Math.sin(time * 3 + p.tw);
        ctx.fillStyle = "rgba(255,250,235," + (a * (0.25 + 0.5 * awake) * tw).toFixed(3) + ")";
        ctx.fillRect(px - p.s / 2, py - p.s / 2, p.s, p.s);
      }
      ctx.globalCompositeOperation = "source-over";
      for (i = 0; i < 9; i++) {
        var on2 = awake > 0.5 ? (i + Math.floor(clockT * MUSIC_W / Math.PI)) % 3 === 0 : true;
        ctx.fillStyle = on2 ? "hsla(" + (hue + i * 40) % 360 + ",100%,72%," + a.toFixed(3) + ")" : "rgba(255,240,210," + (a * 0.35).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(bx - 80 + i * 20, by - 87, on2 ? 3.2 : 2.4, 0, 7);
        ctx.fill();
      }
      var gx = bx, gy = by - 72, R = 10;
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(60,60,70,.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, by - 88);
      ctx.lineTo(gx, gy - R);
      ctx.stroke();
      ctx.fillStyle = "#8A93A6";
      ctx.beginPath();
      ctx.arc(gx, gy, R, 0, 7);
      ctx.fill();
      for (var la = -2; la <= 2; la++) {
        var lat = la * 0.5, cl = Math.cos(lat);
        for (var lo = 0; lo < 8; lo++) {
          var l = lo * 0.785 + rot * 2, z = Math.cos(l);
          if (z < 0.1) continue;
          var fx = gx + Math.sin(l) * R * 0.85 * cl, fy = gy + Math.sin(lat) * R * 0.85, b = 160 + 95 * z * cl | 0;
          ctx.fillStyle = "rgb(" + b + "," + b + "," + Math.min(255, b + 15) + ")";
          ctx.fillRect(fx - 1.4, fy - 1.4, 2.8, 2.8);
        }
      }
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillRect(gx - 4 + Math.sin(time * 2.2) * 2, gy - 5, 2.5, 2.5);
      ctx.globalAlpha = 1;
    }
    var key = (MUSIC.title || "") + "|" + (MUSIC.artist || "");
    if (key !== SIGN_KEY) {
      SIGN_KEY = key;
      SIGN = MUSIC.title ? bakeSign(MUSIC.title, MUSIC.artist) : SIGN;
    }
    if (SIGN) {
      var sx0 = bx - SIGN.w / 2, sy0 = by - 146 - SIGN.h + Math.sin(clockT * MUSIC_W * 0.5) * 1.5 * awake;
      ctx.globalAlpha = MUSIC_T;
      ctx.fillStyle = "#8D6440";
      ctx.fillRect(bx - 1.5, sy0 + SIGN.h - 4, 3, by - 134 - (sy0 + SIGN.h - 4));
      ctx.drawImage(SIGN.c, sx0, sy0, SIGN.w, SIGN.h);
      ctx.globalAlpha = 1;
    }
  }
  function drawPartyFront(time) {
    if (PARTY_T <= 0.01 || !VIL) return;
    ctx.globalAlpha = PARTY_T;
    var cx = LAY.band.x + 104, cy = LAY.band.y + 6;
    blit(CAKE, cx, cy, 1, 1, 1, 1);
    ctx.fillStyle = "#FFB43C";
    [-8, -1, 6].forEach(function(o, i) {
      var f = 1 + 0.25 * Math.sin(time * 18 + i * 2);
      ctx.beginPath();
      ctx.ellipse(cx + o * 1 + 1, cy - 52, 2.2, 4 * f, 0, 0, 7);
      ctx.fill();
    });
    BALLOONS.forEach(function(b) {
      var bx = b.x + Math.sin(time * 1.2 + b.ph) * 4, by = b.y - b.len + Math.sin(time * 1.7 + b.ph) * 3;
      ctx.strokeStyle = "rgba(90,80,70,.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + 4, (b.y + by) / 2, bx, by + 12);
      ctx.stroke();
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.ellipse(bx, by, 9, 12, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.ellipse(bx - 3, by - 4, 2.5, 3.5, 0, 0, 7);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  var TAGS = {};
  function bakeTag(p, count) {
    var g0 = canvas(10, 10).getContext("2d");
    g0.font = "600 " + 20 * K + "px Fredoka";
    var tw = g0.measureText(p.name).width, bw = count ? 26 * K : 0, w = tw + 30 * K + bw, h = 34 * K;
    var c = canvas(w + 4 * K, h + 12 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "rgba(255,255,255,.95)";
    g.strokeStyle = shade(p.col, 0.72);
    g.lineWidth = 2.5 * K;
    rr(g, x, y, w, h, h / 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(x + w / 2 - 7 * K, y + h - 1);
    g.lineTo(x + w / 2, y + h + 8 * K);
    g.lineTo(x + w / 2 + 7 * K, y + h - 1);
    g.fill();
    g.fillStyle = "#26352C";
    g.font = "600 " + 20 * K + "px Fredoka";
    g.textBaseline = "middle";
    g.fillText(p.name, x + 15 * K, y + h / 2 + K);
    if (count) {
      g.fillStyle = shade(p.col, 0.6);
      g.beginPath();
      g.arc(x + w - 19 * K, y + h / 2, 11 * K, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.font = "600 " + 15 * K + "px Fredoka";
      g.textAlign = "center";
      g.fillText(count > 9 ? "9+" : count, x + w - 19 * K, y + h / 2 + K);
    }
    return { c, w: c.width / K, h: c.height / K };
  }
  function heart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.4, y - s, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
    ctx.fill();
  }
  function hopOf(t) {
    var look = t.person && t.person.look;
    if (look === "snail" || look === "shark") return t.jump > 0 ? Math.sin((1 - t.jump / 0.6) * Math.PI) * t.r * 0.8 : 0;
    var h = look === "crow" ? Math.abs(Math.sin(t.phase * 1.5)) * t.r * 0.7 * t.gait : Math.abs(Math.sin(t.phase)) * t.r * 0.5 * t.gait;
    if (t.jump > 0) h += Math.sin((1 - t.jump / 0.6) * Math.PI) * t.r * 1.4;
    if (t.pronk > 0) h += Math.abs(Math.sin((1.6 - t.pronk) / 1.6 * Math.PI * 4)) * t.r * 0.75;
    return h;
  }
  function drawThing(t, time) {
    var sc = depth(t.y) * t.grow, hop = hopOf(t) * sc;
    var dance = DANCE && nightness < 0.6 && !t.moving && t !== openThing && Math.abs(t.x - DANCE.x) + Math.abs(t.y - DANCE.y) < DANCE.r;
    var spr = nightness > 0.6 ? t.spr.shut : t.happy > 0 || t.munch > 0 || dance ? t.spr.happy : t.blinkT > 0 ? t.spr.shut : t.spr.open;
    var sy = 1, sx = 1;
    if (dance) {
      var bt = Math.sin(DANCE.k * 7 + t.phase * 2);
      sy = 1 + (DANCE.sq || 0.06) * bt;
      sx = 1 / sy;
      hop += Math.max(0, bt) * (DANCE.amp || 3);
    } else if (t.gait > 0.05 && !(t.person && t.person.look === "snail")) {
      var land2 = (1 - Math.abs(Math.sin(t.phase))) * t.gait;
      sy = 1 - 0.14 * land2 * land2 * land2;
      sx = 1 + 0.1 * land2 * land2 * land2;
    } else if (t.munch > 0) {
      sy = 1 + 0.05 * Math.sin(time * 22);
      sx = 1 / sy;
    } else {
      sy = 1 + 0.025 * Math.sin(time * 2.2 + t.phase);
      sx = 1 / sy;
    }
    if (t.person && t.person.look === "snail" && t.moving) {
      sx = 1 + 0.04 * Math.sin(time * 4);
      sy = 1 / sx;
    }
    var look = t.person && t.person.look, lean = 0;
    if (t.kind === "fam") {
      var air = Math.abs(Math.sin(t.phase)) * t.gait;
      if (look !== "snail" && look !== "shark") {
        sy *= 1 + 0.09 * air;
        sx /= 1 + 0.05 * air;
      }
      sy *= 1 + t.sq;
      sx *= 1 - t.sq * 0.6;
      lean = t.face * 0.1 * t.gait + 0.03 * Math.sin(time * 0.9 + t.phase) * (1 - t.gait);
    }
    if (look === "shark") return drawShark(t, time, spr, sc, sx, sy, hop);
    if (look === "otter" && t.dipT >= 0) return drawOtterFloat(t, time, sc);
    if (look === "deer" && t.graze > 0) {
      var gz = Math.min(1, t.graze / 0.4, 1);
      lean += t.face * 0.22 * gz;
      sy *= 1 - 0.05 * gz;
    }
    if (t.shiny) drawShiny(t.shiny.x, t.shiny.y, time);
    if (dance && DANCE.wig) lean += DANCE.wig * Math.sin(DANCE.k * 3.5 + t.phase * 2);
    ctx.save();
    ctx.translate(t.x, t.y - hop);
    if (lean) ctx.rotate(lean);
    if (t.peck > 0) ctx.rotate(t.face * 0.4 * Math.sin((1 - t.peck / 0.5) * Math.PI));
    if (t.rig) {
      ctx.scale(t.face * sx * sc / K, sy * sc / K);
      t.dancing = dance;
      drawRig(t, time);
      if (wearsHat(t)) drawPartyHat(t);
    } else {
      ctx.scale(t.face * sx * sc / spr.k, sy * sc / spr.k);
      ctx.drawImage(spr.c, -spr.ax, -spr.ay);
    }
    ctx.restore();
    if (t.kind === "fam" && WX.rain > 0.3 && look !== "snail") {
      var ur = t.r * sc, uy = t.y - hop - ur * (t.person.tg - 0.35), ux = t.x + t.face * ur * 0.1;
      ctx.globalAlpha = clamp((WX.rain - 0.3) * 3, 0, 1);
      ctx.strokeStyle = "#5A4A3A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.lineTo(ux, uy + ur * 0.9);
      ctx.stroke();
      ctx.fillStyle = t.person.col;
      ctx.beginPath();
      ctx.arc(ux, uy + 2, ur * 1.05, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = shade(t.person.col, 0.7);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  function drawShiny(x, y, time) {
    ctx.save();
    ctx.translate(x, y - 3);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#F4D35E";
    ctx.fillRect(-3.5, -3.5, 7, 7);
    ctx.fillStyle = "#FFF6C8";
    ctx.fillRect(-3.5, -3.5, 3, 3);
    ctx.restore();
    var gl = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.strokeStyle = "rgba(255,255,255," + gl.toFixed(2) + ")";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 3);
    ctx.lineTo(x + 7, y - 3);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }
  function drawOtterFloat(t, time, sc) {
    var base = t.y + (t.dy || 0), k = t.diving || 0, r = t.r * sc, spr = t.spr.happy;
    var rx = r * 1.5, ry = r * 0.42, bob = Math.sin(time * 2.2) * 1.5 * k;
    ctx.save();
    ctx.beginPath();
    ctx.rect(t.x - 200, base - 400, 400, 400 + ry * 0.1);
    ctx.clip();
    ctx.translate(t.x, base + r * 0.24 * k + bob - r * 0.9);
    ctx.rotate(-t.face * 0.45 * k);
    ctx.translate(0, r * 0.9);
    ctx.scale(t.face * sc / spr.k, sc / spr.k);
    ctx.drawImage(spr.c, -spr.ax, -spr.ay);
    ctx.restore();
    if (k > 0.8) {
      var jug = Math.abs(Math.sin(time * 3.2)), px = t.x + t.face * r * 0.05, py = base - r * 0.04 + bob - jug * r * 0.55;
      ctx.fillStyle = "#9AA0A8";
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.2, r * 0.14, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.arc(px - r * 0.06, py - r * 0.05, r * 0.05, 0, 7);
      ctx.fill();
      var pawY = base - r * 0.02 + bob - Math.max(0, 0.25 - jug) * r * 0.3;
      ctx.fillStyle = "#5A3E2C";
      [-1, 1].forEach(function(s2) {
        ctx.beginPath();
        ctx.ellipse(px + s2 * r * 0.19, pawY, r * 0.08, r * 0.1, s2 * 0.4, 0, 7);
        ctx.fill();
      });
    }
    ctx.fillStyle = "rgba(111,187,211,.85)";
    ctx.beginPath();
    ctx.ellipse(t.x, base, rx, ry, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(t.x, base, rx * 0.95, ry * 0.75, 0, 0, 7);
    ctx.stroke();
  }
  function drawShark(t, time, spr, sc, sx, sy, hop) {
    var base = t.y + (t.dy || 0), rx = t.r * 1.8 * sc, ry = t.r * 0.42 * sc;
    var bob = Math.sin(time * 2.5 + t.phase) * 1.5 * (1 - (t.diving || 0)), sink = t.r * sc * (0.28 + 0.6 * (t.diving || 0));
    var dry = !(t.dipT >= 0) || (t.diving || 0) < 0.5;
    if (dry) {
      ctx.fillStyle = "rgba(111,187,211,.9)";
      ctx.beginPath();
      ctx.ellipse(t.x, base, rx, ry, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(t.x, base, rx, ry, 0, 0, 7);
      ctx.stroke();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(t.x - 200, base - 400, 400, 400 + ry * 0.2);
    ctx.clip();
    ctx.translate(t.x, base + sink + bob - hop);
    if (t.rig) {
      ctx.scale(t.face * sx * sc / K, sy * sc / K);
      drawRig(t, time);
      if (wearsHat(t)) drawPartyHat(t);
    } else {
      ctx.scale(t.face * sx * sc / spr.k, sy * sc / spr.k);
      ctx.drawImage(spr.c, -spr.ax, -spr.ay);
    }
    ctx.restore();
    ctx.fillStyle = dry ? "rgba(140,205,225,.8)" : "rgba(111,187,211,.85)";
    ctx.beginPath();
    ctx.ellipse(t.x, base, rx, ry, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(t.x, base, rx * 0.92, ry * 0.7, 0, 0.3, 2.8);
    ctx.stroke();
    if (t.moving) {
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      for (var i = 1; i <= 2; i++) {
        var wx = t.x - t.face * (rx + i * 9);
        ctx.moveTo(wx, base - 3 * i);
        ctx.lineTo(wx - t.face * 7, base);
      }
      ctx.stroke();
    }
  }
  function draw(time) {
    var i, t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(BG, 0, 0, W, H);
    var AMB = SCENE.ambient;
    if (AMB) {
      SV.time = time;
      SV.WX = WX;
      SV.DARK = DARK;
      SV.nightness = nightness;
      SV.music = MUSIC_T;
      SV.party = PARTY_T;
    }
    if (AMB && AMB.under) AMB.under(ctx, time, SV);
    drawWeatherGround();
    for (i = 0; i < CLOUDS.length; i++) ctx.drawImage(CLOUDS[i].c, CLOUDS[i].x, CLOUDS[i].y);
    drawWeatherSky(time);
    drawRainbow();
    drawPlane(time);
    if (AMB && AMB.back) AMB.back(ctx, time, SV);
    for (i = 0; i < food.length; i++) {
      var f = food[i], fs = f.grow * 0.8 / K * depth(f.y);
      ctx.drawImage(f.spr.c, f.x - f.spr.ax * fs, f.y - f.spr.ay * fs, f.spr.c.width * fs, f.spr.c.height * fs);
    }
    for (i = 0; i < things.length; i++) {
      t = things[i];
      if (t.person && t.person.look === "shark" || offStage(t)) continue;
      var s = depth(t.y) * t.grow, hs = 1 - Math.min(0.5, hopOf(t) / (t.r * 3)), sw = t.r * 2.6 * s * hs;
      ctx.drawImage(SHADOW, t.x - sw / 2, t.y - sw * 0.14, sw, sw * 0.28);
    }
    var asleep = nightness > 0.6;
    clockT = time;
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].layer === "back" && !VILLAGE[i].late) VILLAGE[i].draw(time, asleep);
    drawPartyBack(time);
    drawWalkers();
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].late) VILLAGE[i].draw(time, asleep);
    var order = things.slice().sort(function(a2, b) {
      return a2.y - b.y;
    }), robo = !ROBOT;
    for (i = 0; i < order.length; i++) {
      if (!robo && ROBOT.y < order[i].y) {
        drawRobot(time);
        robo = true;
      }
      if (!offStage(order[i])) drawThing(order[i], time);
    }
    if (!robo) drawRobot(time);
    if (AMB && AMB.front) AMB.front(ctx, time, SV);
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].layer === "front") VILLAGE[i].draw(time, asleep);
    drawPartyFront(time);
    var bh = BEE_HOST;
    if (bh && !offStage(bh)) {
      var bx = bh.x + Math.sin(time * 1.3) * 44, by = bh.y - bh.r * 1.4 - hopOf(bh) + Math.sin(time * 2.6) * 12;
      if (nightness > 0.6) {
        bx = bh.x - bh.face * bh.r * 0.3;
        by = bh.y - bh.r * 1.28;
      }
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.beginPath();
      ctx.ellipse(bx - 2, by - 6 - (nightness > 0.6 ? 0 : Math.abs(Math.sin(time * 40)) * 3), 5, 3.5, -0.4, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#FFCB3D";
      ctx.beginPath();
      ctx.ellipse(bx, by, 7, 5.5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillRect(bx - 2.5, by - 5, 2, 10);
      ctx.fillRect(bx + 1.5, by - 5, 2, 10);
      ctx.beginPath();
      ctx.arc(bx + 5, by - 1, 1.2, 0, 7);
      ctx.fill();
    }
    for (i = 0; i < parts.length; i++) {
      var p = parts[i], a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.kind === "heart") {
        ctx.fillStyle = p.col;
        heart(p.x, p.y, 9);
      } else if (p.kind === "poof") {
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 + (1 - a) * 8, 0, 7);
        ctx.fill();
      } else if (p.kind === "crumb" || p.kind === "chip") {
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, 7);
        ctx.fill();
      } else if (p.kind === "smoke") {
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = "#F4F4F0";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + (1 - a) * 12, 0, 7);
        ctx.fill();
      } else if (p.kind === "icon") blit(p.icon, p.x, p.y, 1, 1, 1, 1);
      else if (p.kind === "leaf") {
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ph);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2.5, 0, 0, 7);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "hat") {
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ph * 0.7);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(0, 2, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-10, 1, 20, 4);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, 7);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "note") {
        ctx.fillStyle = ctx.strokeStyle = p.col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x - 3, p.y + 5, 4, 3, -0.3, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(p.x + 1, p.y + 4);
        ctx.lineTo(p.x + 1, p.y - 8);
        ctx.lineTo(p.x + 7, p.y - 5);
        ctx.stroke();
      } else if (p.kind === "drop") {
        ctx.fillStyle = "#6FB6E8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, 7);
        ctx.fill();
      } else if (p.kind === "coin") {
        ctx.fillStyle = "#F4C542";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#FFF3B8";
        ctx.beginPath();
        ctx.arc(p.x - 1.3, p.y - 1.3, 1.5, 0, 7);
        ctx.fill();
      } else {
        ctx.font = p.kind === "z" ? "600 18px Fredoka" : "600 22px Fredoka";
        ctx.textAlign = "center";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.fillStyle = p.kind === "z" ? "#5C6FA8" : "#C4553A";
        ctx.strokeText(p.kind === "z" ? "z" : p.txt, p.x, p.y);
        ctx.fillText(p.kind === "z" ? "z" : p.txt, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
    drawWeatherFront(time);
    if (DARK > 0) {
      ctx.fillStyle = "rgba(24,32,78," + (0.52 * DARK).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
      for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].light) VILLAGE[i].light(DARK);
      if (AMB && AMB.light) AMB.light(ctx, time, SV);
      planeLight(DARK, time);
      drawFireworks();
      ctx.globalAlpha = DARK;
      for (i = 0; i < flies.length; i++) {
        var fl = flies[i], pulse = 0.5 + 0.5 * Math.sin(time * 2 + fl.a * 3);
        ctx.globalAlpha = DARK * (0.3 + 0.7 * pulse);
        ctx.drawImage(GLOW, fl.x - 12, fl.y - 12, 24, 24);
      }
      ctx.globalAlpha = 1;
    }
    drawRaveLights(time);
    drawHouseLights(time);
    drawBandShow(time);
    var stg = TAGS.School;
    if (stg && LAY.school) {
      var sx0 = LAY.school.x - stg.w / 2, sy0 = (LAY.school.tag != null ? LAY.school.tag : LAY.school.y - 144) - stg.h;
      ctx.drawImage(stg.c, sx0, sy0, stg.w, stg.h);
      SCHOOL_CARD.tagBox = [sx0, sy0, stg.w, stg.h];
    }
    var bd = VIL && shopBoard();
    if (bd) ctx.drawImage(bd.c, LAY.shop.x - 60 - bd.w / 2, LAY.shop.y - 30 - bd.h, bd.w, bd.h);
    for (i = 0; i < fam.length; i++) {
      t = fam[i];
      var tag = TAGS[t.person.name];
      if (!tag) continue;
      if (offStage(t)) {
        t.tagBox = null;
        continue;
      }
      var sc = depth(t.y), top2 = t.y + (t.dy || 0) - hopOf(t) * sc - t.r * sc * t.person.tg;
      ctx.drawImage(tag.c, t.x - tag.w / 2, top2 - tag.h, tag.w, tag.h);
      t.tagBox = [t.x - tag.w / 2, top2 - tag.h, tag.w, tag.h];
      if (t.letter) blit(ICON.letter, t.x, top2 - tag.h - 6 + Math.sin(time * 2.4 + t.phase) * 2.5, 1, 1, 1, 2, Math.sin(time * 1.8) * 0.12);
    }
    drawRobotBubble(time);
  }
  var DATA = { events: [], extra: null, weekAt: null, error: null, gotAt: null };
  var SRC = {};
  PEOPLE.forEach(function(p) {
    if (p.timetable || p.lunch || p.choice) SRC[p.name] = { timetable: p.timetable, lunch: p.lunch, choice: p.choice };
  });
  if (DEMO) {
    SRC = {};
    var DK = PEOPLE.filter(function(p) {
      return p.school;
    }).map(function(p) {
      return p.name;
    });
    var dsrc = function(id, a) {
      return { entity: id, attribute: a };
    };
    if (DK[0]) SRC[DK[0]] = { timetable: dsrc("sensor.demo_timetable_1", "timetable") };
    if (DK[1]) SRC[DK[1]] = { timetable: dsrc("sensor.demo_timetable_2", "timetable"), lunch: dsrc("sensor.demo_lunch_2", "menu"), choice: { days: { fri: "packed" } } };
    if (DK[2]) SRC[DK[2]] = { lunch: dsrc("sensor.demo_lunch_3", "menu"), choice: { value: "school" } };
  }
  function schoolEntities() {
    var ids = [];
    Object.keys(SRC).forEach(function(n) {
      var s = SRC[n];
      [s.timetable && s.timetable.entity, s.lunch && s.lunch.entity, s.choice && s.choice.entity].forEach(function(id) {
        if (id && ids.indexOf(id) < 0) ids.push(id);
      });
    });
    return ids;
  }
  function schoolParse(kind, name, d) {
    var src = SRC[name] && SRC[name][kind];
    if (!src) return null;
    if (!DATA.school) return { status: "loading", lessons: [], options: [] };
    var C = DATA.pc || (DATA.pc = {}), k = kind + "|" + name + "|" + ymd(d);
    if (!(k in C)) {
      var st = DATA.school.states ? DATA.school.states[src.entity] : null;
      C[k] = (kind === "timetable" ? parseTimetable : parseLunch)(st || null, d, now(), src.attribute);
    }
    return C[k];
  }
  function ttFor(name, d) {
    return schoolParse("timetable", name, d);
  }
  function lunchFor(name, d) {
    return schoolParse("lunch", name, d);
  }
  function choiceFor(name, d, fromData) {
    var c = SRC[name] && SRC[name].choice, S = DATA.school || {};
    return lunchChoice(c || null, d, c && c.entity && S.states ? S.states[c.entity] : null, fromData);
  }
  function hassToken() {
    var h = HA.hass();
    return h ? Promise.resolve(h) : Promise.reject(new Error("no connection to Home Assistant yet"));
  }
  function getState(id, h) {
    var s = h.states[id];
    return s ? Promise.resolve(s) : Promise.reject(new Error(id + " not found"));
  }
  function holidays(tok) {
    if (!SENSORS.trips) return Promise.resolve([]);
    var td = ymd(now()), end = +td.slice(0, 4) + 1 + td.slice(4);
    return tok.callApi("GET", "calendars/" + SENSORS.trips + "?start=" + td + "T00:00:00&end=" + end + "T00:00:00").then(function(evs) {
      return evs.filter(function(e) {
        return /\bholidays?\b/i.test(e.summary || "");
      }).map(function(e) {
        return { date: (e.start.date || e.start.dateTime).slice(0, 10), label: e.summary.replace(/\bholidays?\b/i, "").replace(/^[\s:,-]+|[\s:,-]+$/g, "") || "Holiday" };
      });
    }).catch(function(e) {
      console.warn("meadow: holidays", e);
      return null;
    });
  }
  function readWeek(tok) {
    if (!CONFIG.calendarMode) return getState(SENSORS.week, tok).catch(function() {
      throw new Error(SENSORS.week + " not found. Give people a calendar in the card editor, or set up that sensor");
    }).then(function(s) {
      var wk = s.attributes || {};
      if (!Array.isArray(wk.events)) throw new Error(SENSORS.week + " has no events list (state " + s.state + ")");
      return { events: wk.events, at: wk.checked_at ? new Date(wk.checked_at) : null, failed: [] };
    });
    var range = weekRange(now()), jobs = [];
    PEOPLE.forEach(function(p) {
      (p.calendars || []).forEach(function(id) {
        jobs.push(tok.callApi("GET", calendarPath(id, range)).then(function(evs) {
          return { ok: true, rows: parseCalendarEvents(evs, p.name, range) };
        }).catch(function(e) {
          console.warn("meadow: " + id, e);
          return { ok: false, who: p.name, id, err: e && (e.message || e.body && e.body.message) || String(e) };
        }));
      });
    });
    return Promise.all(jobs).then(function(rs) {
      var ok = rs.filter(function(r) {
        return r.ok;
      }), failed = rs.filter(function(r) {
        return !r.ok;
      });
      if (!ok.length) throw new Error("no calendar answered (" + failed.map(function(f) {
        return f.id;
      }).join(", ") + ")");
      return { events: [].concat.apply([], ok.map(function(r) {
        return r.rows;
      })), at: /* @__PURE__ */ new Date(), failed };
    });
  }
  function load() {
    if (DEMO) {
      DATA = demoData();
      DATA.events = byStart(DATA.events);
      refreshTags();
      return;
    }
    var schoolErr = null, extraErr = null;
    hassToken().then(function(tok) {
      function opt(id) {
        if (!id) return Promise.resolve(null);
        return getState(id, tok).catch(function(e) {
          console.warn("meadow: " + id, e);
          schoolErr = e.message || String(e);
          return null;
        });
      }
      var extra = !SENSORS.extra ? Promise.resolve(null) : getState(SENSORS.extra, tok).then(function(s) {
        if (/^(unavailable|unknown)$/.test(s.state) && !(s.attributes || {}).checked_at) throw new Error(SENSORS.extra + " is " + s.state);
        return s;
      }).catch(function(e) {
        console.warn("meadow: extra", e);
        extraErr = e.message || String(e);
        return null;
      });
      var ids = schoolEntities(), states = {};
      var school = Promise.all(ids.map(function(id) {
        return getState(id, tok).then(function(s) {
          states[id] = s;
        }).catch(function(e) {
          console.warn("meadow: " + id, e);
          states[id] = null;
        });
      })).then(function() {
        return states;
      });
      return Promise.all([
        readWeek(tok),
        extra,
        school,
        opt(SENSORS.kit),
        null,
        // null: the slot v1.1.0 used for sensors.lunch
        opt(SENSORS.sun),
        opt(SENSORS.weather),
        holidays(tok)
      ]);
    }).then(function(s) {
      var wk = s[0];
      DATA = {
        events: byStart(wk.events),
        weekAt: wk.at,
        calFailed: wk.failed,
        extra: s[1] ? s[1].attributes || null : null,
        extraErr,
        error: null,
        gotAt: /* @__PURE__ */ new Date(),
        school: { states: s[2], kit: s[3] && s[3].attributes, err: schoolErr },
        sun: s[5] && s[5].attributes,
        weather: s[6] ? { state: s[6].state, attributes: s[6].attributes } : null,
        holidays: s[7] || (DATA.holidays || [])
      };
      refreshTags();
    }).catch(function(e) {
      console.error("meadow: load failed", e);
      DATA.error = e.message || String(e);
    });
  }
  function demoData() {
    var d = function(n) {
      return ymd(new Date(now().getTime() + n * 864e5));
    };
    var at = function(n, hm) {
      return { day: d(n), start: d(n) + "T" + hm + ":00", at: hm, all_day: false };
    };
    var ad = function(n) {
      return { day: d(n), start: d(n), at: "", all_day: true };
    };
    function ev(who, what, w) {
      w.who = who;
      w.what = what;
      return w;
    }
    return {
      weekAt: now(),
      gotAt: now(),
      error: null,
      // Today's timed events exercise the day plan: ?hour=10 sends Parent 1 out to the
      // dentist while the kids are at school, 15.5 puts Kid 2 at the bandstand, 16.5
      // Kid 3 at the pond, 17 Kid 1 on the pitch, 19.5 Parent 2 out. Pat's birthday is a
      // friend's, so from 17 there is a house party at the cottage (see Parties).
      events: [
        ev("House", "Bin day", ad(0)),
        ev("Parent 2", "Pat's birthday", ad(0)),
        ev("Parent 1", "Dentist", at(0, "10:15")),
        ev("Parent 2", "Book club", at(0, "19:30")),
        ev("Kid 1", "Football training", at(0, "17:00")),
        ev("Kid 2", "Drama club", at(0, "15:30")),
        ev("Kid 3", "Swimming", at(0, "16:30")),
        ev("Parent 1", "Dentist", at(1, "09:40")),
        ev("Kid 2", "Sleepover at Ella's", ad(2)),
        ev("Kid 3", "Cubs", at(2, "18:30")),
        ev("Kid 1", "Mock exams start", ad(3)),
        ev("House", "Window cleaner", ad(4)),
        ev("Parent 2", "Late shift", at(4, "14:00"))
      ],
      school: { states: demoSchool(), kit: { kit_today: "PE kit", kit_tomorrow: "Swimming kit" } },
      extra: {
        checked_at: now().toISOString(),
        kit: [{ who: "Kid 3", what: "PE kit on Fridays" }],
        flags: ["Half term starts in three weeks"],
        schools: [
          { who: "Kid 2", school: "Demo High", terms: [{ label: "Term 1", from: d(-20), to: d(24) }, { label: "Term 2", from: d(34), to: d(80) }], days: [{ date: d(9), what: "INSET, closed" }] },
          { who: "Kid 1", school: "Demo College", terms: [{ label: "Term 1", from: null, to: d(22), note: "start not published" }, { label: "Term 2", from: d(32), to: null }], days: [] }
        ],
        sources: { ok: ["demo"], unavailable: ["parent-mail"] },
        items: [
          { who: "Kid 2", date: d(2), kind: "homework", what: "Maths homework due" },
          { who: "Kid 3", date: d(1), kind: "kit", what: "Swimming kit" },
          { who: "Kid 1", date: d(9), kind: "event", what: "Parents evening" },
          { who: "Parent 1", date: d(5), kind: "deadline", what: "School trip form back" }
        ]
      }
    };
  }
  function demoSchool() {
    var mon = mondayOf(now()), day = function(n) {
      return ymd(addDays(mon, n));
    };
    function L(list) {
      return list.map(function(x) {
        var s = x.split("|");
        return s[1] ? { subject: s[0], room: s[1] } : { subject: s[0] };
      }).map(function(l, i) {
        l.p = i + 1;
        return l;
      });
    }
    function week(rows) {
      var o = {};
      ["mon", "tue", "wed", "thu", "fri"].forEach(function(k, i) {
        o[k] = L(rows[i]);
      });
      return o;
    }
    var tt1 = {
      weeks: ["A", "B"],
      anchor: day(0),
      periods: [{ p: 1, start: "08:45", end: "09:45" }, { p: 2, start: "09:45", end: "10:45" }, { p: 3, start: "11:05", end: "12:05" }, { p: 4, start: "12:05", end: "13:05" }, { p: 5, start: "13:50", end: "14:50" }],
      days: {
        A: week([
          ["Maths|M1", "English|E2", "Science|S3", "History|H1", "Art|A1"],
          ["French|L2", "Maths|M1", "English|E2", "Music|MU", "Drama|D1"],
          ["Maths|M1", "English|E2", "PE|Gym", "Science|S3", "Art|A1"],
          ["History|H1", "Maths|M1", "French|L2", "Music|MU", "English|E2"],
          ["Science|S3", "Geography|G1", "Maths|M1", "PE|Field", "English|E2"]
        ]),
        B: week([
          ["English|E2", "Maths|M1", "Geography|G1", "PE|Gym", "Computing|IT1"],
          ["Science|S2", "Science|S2", "Maths|M1", "RE|R1", "French|L2"],
          ["Art|A1", "English|E2", "History|H1", "Maths|M1", "Music|MU"],
          ["PE|Field", "Computing|IT1", "English|E2", "Science|S3", "Drama|D1"],
          ["Maths|M1", "French|L2", "Geography|G1", "English|E2", "Art|A1"]
        ])
      },
      closed: []
    };
    var tt2 = {
      weeks: ["A"],
      periods: [{ p: 1, start: "09:00", end: "10:15" }, { p: 2, start: "10:30", end: "12:00" }, { p: 3, start: "13:00", end: "14:00" }, { p: 4, start: "14:10", end: "15:10" }],
      days: { A: week([
        ["Maths", "English", "Science", "PE"],
        ["Phonics", "Maths", "Art", "Music"],
        ["Maths", "English", "Computing", "Topic"],
        ["Spelling", "Maths", "PE", "French"],
        ["Maths", "English", "Forest school", "Golden time"]
      ]) },
      closed: [{ date: day(9), note: "INSET" }]
    };
    var DISH = [
      [[["Pasta bake", "main", "Gluten,Milk"], ["Veggie pasta bake", "veg", "Gluten,Milk"], ["Jacket potato", "jacket", "Milk"]], ["Apple crumble", "Gluten,Milk"]],
      [[["Fish fingers", "main", "Fish,Gluten"], ["Veggie fingers", "veg", "Gluten,Soya"]], ["Yoghurt", "Milk"]],
      [[["Roast chicken", "main", "Celery"], ["Lentil roast", "veg", "Celery,Mustard"]], ["Fruit jelly", ""]],
      [[["Beef chilli", "main", "Celery"], ["Bean chilli", "vegan", ""]], ["Flapjack", "Gluten"]],
      [[["Fish and chips", "main", "Fish,Gluten"], ["Cheese and tomato pizza", "veg", "Gluten,Milk"]], ["Shortbread", "Gluten,Milk"]]
    ];
    function menu(shift, closed, choices) {
      var m = {};
      for (var w = 0; w < 2; w++) for (var i = 0; i < 5; i++) {
        var n = w * 7 + i, dd = DISH[(i + shift + w * 2) % 5];
        if (closed[n]) {
          m[day(n)] = { status: "closed", note: closed[n] };
          continue;
        }
        m[day(n)] = {
          status: "served",
          options: dd[0].map(function(o) {
            return { name: o[0], kind: o[1], allergens: o[2] ? o[2].split(",") : [] };
          }),
          pudding: { name: dd[1][0], allergens: dd[1][1] ? dd[1][1].split(",") : [] }
        };
        if (choices[n]) m[day(n)].choice = choices[n];
      }
      return { menu: m, menu_ends: day(11) };
    }
    var l2 = menu(0, { 9: "INSET" }, { 1: "Veggie fingers" }), l3 = menu(1, {}, {});
    return {
      "sensor.demo_timetable_1": { state: "A", attributes: { timetable: tt1 } },
      "sensor.demo_timetable_2": { state: "A", attributes: { timetable: tt2 } },
      "sensor.demo_lunch_2": { state: "served", attributes: l2 },
      "sensor.demo_lunch_3": { state: "served", attributes: l3 }
    };
  }
  function byStart(ev) {
    return ev.slice().sort(function(a, b) {
      return new Date(a.start) - new Date(b.start);
    });
  }
  function todayFor(name) {
    var td = ymd(now());
    return DATA.events.filter(function(e) {
      return e.who === name && e.day === td;
    });
  }
  function refreshTags() {
    PEOPLE.forEach(function(p) {
      TAGS[p.name] = bakeTag(p, todayFor(p.name).length);
    });
    var td = ymd(now()), n = ((DATA.extra || {}).items || []).filter(function(i) {
      return i.date === td && KIDS.indexOf(i.who) >= 0;
    }).length;
    TAGS.School = bakeTag({ name: "School", col: "#C9594A" }, n);
  }
  var BOARD = { key: null, c: null, w: 0, h: 0 };
  function shopBoard() {
    var ps = printerState(), txt = ps === "running" || ps === "pause" ? Math.round(PR.progress) + "%" : ps === "finish" ? "done" : /^(prepare|slicing|init)$/.test(ps) ? "soon" : null;
    if (!txt) return null;
    if (txt !== BOARD.key) {
      var g0 = canvas(10, 10).getContext("2d");
      g0.font = "600 " + 15 * K + "px Fredoka";
      var w = g0.measureText(txt).width + 16 * K, h = 22 * K, c = canvas(w + 2 * K, h + 8 * K), g = c.getContext("2d");
      g.fillStyle = "#B08A5A";
      g.fillRect(w / 2 - K, h, 2 * K, 8 * K);
      g.fillStyle = "#F2E8D8";
      g.strokeStyle = "#7A5238";
      g.lineWidth = 1.5 * K;
      rr(g, K, K, w, h - K, 3 * K);
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.font = "600 " + 15 * K + "px Fredoka";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(txt, K + w / 2, h / 2 + K);
      BOARD = { key: txt, c, w: c.width / K, h: c.height / K };
    }
    return BOARD;
  }
  function kitBag() {
    var k = DATA.school && DATA.school.kit;
    if (!k) return null;
    var d = now(), h = d.getHours(), v = h < 9 && weekday(d) ? k.kit_today : h >= 17 ? k.kit_tomorrow : null;
    return v && v !== "none" && v !== "unknown" ? v : null;
  }
  var PR = { status: "missing", progress: 0, remain: null, name: "", layer: null, layers: null, at: null };
  var PR_ID = SENSORS.printer, PR_KEYS = ["print_status", "print_progress", "remaining_time", "task_name", "current_layer", "total_layer_count"];
  function num(s) {
    var v = s && parseFloat(s.state);
    return isFinite(v) ? v : null;
  }
  function setPrinter(s) {
    var st = s[0] && s[0].state, name = s[3] && s[3].state;
    PR = {
      status: !s[0] ? "missing" : st === "unavailable" ? "offline" : st || "unknown",
      progress: clamp(num(s[1]) || 0, 0, 100),
      remain: num(s[2]) == null ? null : Math.round(num(s[2]) * 60),
      name: name && !/^(unknown|unavailable)$/.test(name) ? name.replace(/\.gcode(\.3mf)?$|\.3mf$/i, "").replace(/_/g, " ") : "",
      layer: num(s[4]),
      layers: num(s[5]),
      at: /* @__PURE__ */ new Date(),
      err: null
    };
  }
  function printerState() {
    if (!PR.at || Date.now() - PR.at > 6 * 6e4) return "empty";
    return /^(running|pause|prepare|slicing|init|finish|failed|idle)$/.test(PR.status) ? PR.status : "empty";
  }
  function demoPrinter() {
    var m = (PRFORCE || "running:38").split(":"), st = m[0], p = m[1] != null ? +m[1] : st === "finish" ? 100 : st === "failed" ? 61 : /^(idle|offline|unknown|missing)$/.test(st) ? 0 : 38;
    return {
      status: st === "missing" ? "missing" : st,
      progress: p,
      remain: st === "running" || st === "pause" ? Math.round((100 - p) * 1.3) : 0,
      name: "Articulated Dragon",
      layer: Math.round(p * 1.25),
      layers: 125,
      at: st === "missing" ? null : /* @__PURE__ */ new Date(),
      err: null
    };
  }
  var LETTER = { seen: null, queue: [], clearErr: null };
  var AIRMAIL = { t: 2 };
  function airmail(dt) {
    if (!LETTER.queue.length || nightness > 0.35) return;
    AIRMAIL.t -= dt;
    if (AIRMAIL.t > 0) return;
    AIRMAIL.t = 2;
    var L1 = LETTER.queue[0], to = fam.filter(function(f) {
      return f.person.name === L1.to;
    })[0];
    if (!to || offStage(to)) return;
    LETTER.queue.shift();
    to.letter = L1;
    to.happy = 2.2;
    to.jump = 0.6;
    say("!", to.x, to.y - to.r * 2.6);
    parts.push({ kind: "icon", icon: ICON.letter, x: to.x, y: to.y - to.r * 3.4 - 40, vx: 0, vy: 20, life: 0.8, max: 0.8 });
  }
  function letterArrived(text, key) {
    if (key === LETTER.seen) return;
    LETTER.seen = key;
    var m = String(text).match(/^\s*([A-Za-z][A-Za-z0-9 ]*?)\s*[:,\-]\s*([\s\S]*)$/), who = null, body = text;
    if (m) {
      var nm = m[1].toLowerCase();
      who = PEOPLE.filter(function(p) {
        return [p.name].concat(p.aliases || []).some(function(a) {
          return a.toLowerCase() === nm;
        });
      })[0];
      if (who) body = m[2];
    }
    if (!who) who = PEOPLE[PEOPLE.length - 1];
    LETTER.queue.push({ to: who.name, text: String(body).trim() || String(text), at: /* @__PURE__ */ new Date(), key });
  }
  function clearLetter(l) {
    if (DEMO || l.key === "hook" || !SENSORS.letter) return;
    hassToken().then(function(h) {
      return h.callService("input_text", "set_value", { entity_id: SENSORS.letter, value: "" });
    }).then(function() {
      LETTER.clearErr = null;
    }).catch(function(e) {
      console.warn("meadow: could not clear the letter", e);
      LETTER.clearErr = e.message || String(e);
    });
  }
  var MUSIC_ID = SENSORS.music;
  function isMusic(s) {
    if (!s || s.state !== "playing") return false;
    var a = s.attributes || {}, id = String(a.media_content_id || "");
    if (a.media_content_type !== "music") return false;
    if (/podcast|audiobook/i.test(id)) return false;
    if (/^https?:\/\/.*\.(mp3|m4a|aac|ogg)(\?|$)/i.test(id)) return false;
    return true;
  }
  function loadMusic() {
    if (MFORCE) {
      var mt = (Q.match(/[?&]mtitle=([^&]+)/) || [])[1], ma = (Q.match(/[?&]martist=([^&]+)/) || [])[1];
      MUSIC.on = MFORCE === "on";
      MUSIC.title = MUSIC.on ? mt ? decodeURIComponent(mt.replace(/\+/g, " ")) : "Hit Me Like a Drum" : null;
      MUSIC.artist = MUSIC.on ? ma ? decodeURIComponent(ma.replace(/\+/g, " ")) : mt ? null : "Parov Stelar feat. Timothy Auld" : null;
      return;
    }
    if (DEMO || !MUSIC_ID) return;
    hassToken().then(function(tok) {
      return getState(MUSIC_ID, tok);
    }).then(function(s) {
      MUSIC.on = isMusic(s);
      MUSIC.title = MUSIC.on ? s.attributes.media_title || null : null;
      MUSIC.artist = MUSIC.on ? s.attributes.media_artist || null : null;
      MUSIC.at = /* @__PURE__ */ new Date();
      MUSIC.err = null;
    }).catch(function(e) {
      console.warn("meadow: music poll failed", e);
      MUSIC.on = false;
      MUSIC.err = e.message || String(e);
    });
  }
  function loadLive() {
    if (DEMO) {
      PR = demoPrinter();
      if (LFORCE) letterArrived(decodeURIComponent(LFORCE.replace(/\+/g, " ")), "hook");
      return;
    }
    hassToken().then(function(tok) {
      function opt(id) {
        if (!id) return Promise.resolve(null);
        return getState(id, tok).catch(function(e) {
          console.warn("meadow: " + id, e);
          return null;
        });
      }
      return Promise.all(PR_KEYS.map(function(k) {
        return opt(PR_ID && PR_ID + k);
      }).concat([opt(SENSORS.letter), opt(SENSORS.rain)]));
    }).then(function(s) {
      setPrinter(s);
      var l = s[6], txt = l && l.state, r = s[7] && s[7].state;
      if (txt && !/^(unknown|unavailable)$/.test(txt) && txt.trim()) letterArrived(txt, txt + "|" + l.last_changed);
      RAIN = RAIN_STATES.wet.indexOf(r) >= 0 ? "raining" : RAIN_STATES.dry.indexOf(r) >= 0 ? "none" : null;
      if (r && !RAIN && !/^(unknown|unavailable)$/.test(r)) console.warn("meadow: rain sensor said " + r + ", ignoring it");
    }).catch(function(e) {
      console.warn("meadow: live poll failed", e);
      PR.at = null;
      PR.err = e.message || String(e);
      RAIN = null;
    });
  }
  var NAVS = [];
  function goView(path) {
    if (!path) return false;
    NAVS.push({ path, at: Date.now() });
    try {
      return HA.navigate(path);
    } catch (e) {
      console.warn("meadow: could not open " + path, e);
      say("oops", W / 2, H / 2);
      return false;
    }
  }
  var OFFICE = { ok: null, line: null, err: null, at: null }, OSEEN = {}, ODONE = {};
  var ROBOT = null, ROBO_ON = null, ROBO_OFF = null, ROBO_BUB = null, ROBO_KEY = "";
  var HOLD_MS = 45e3, ROBO_SC = 1.2;
  function officeName(d) {
    var n = String(d.title || d.project || "agent").trim() || "agent";
    return n.length > 22 ? n.slice(0, 21) + "…" : n;
  }
  function officeLine(all, nowMs) {
    var tnow = nowMs || Date.now(), seen = {}, ask = null, best = null, src, d, i, st, key, nm, c;
    for (src in all) {
      d = all[src] && all[src].data;
      if (!d || !Array.isArray(d.stations)) continue;
      nm = officeName(d);
      for (i = 0; i < d.stations.length; i++) {
        st = d.stations[i] || {};
        key = src + "/" + st.id;
        if (st.attention === "ask" && !ask) ask = { name: nm, text: "needs you", kind: "ask", key, at: tnow };
        if (st.attention === "done") {
          seen["d" + key] = 1;
          c = ODONE[key] || (ODONE[key] = { name: nm, text: "all done", kind: "done", key, at: tnow });
          if (!best || c.at > best.at) best = c;
        }
        if (st.state === "working" && st.detail) {
          seen["w" + key] = 1;
          c = OSEEN[key];
          if (!c || c.text !== String(st.detail)) c = OSEEN[key] = { name: nm, text: String(st.detail), kind: "work", key, at: tnow };
          if (!best || c.at > best.at) best = c;
        }
      }
    }
    for (key in OSEEN) if (!seen["w" + key]) delete OSEEN[key];
    for (key in ODONE) if (!seen["d" + key]) delete ODONE[key];
    var cur = OFFICE.line;
    if (ask) OFFICE.line = ask;
    else if (best) {
      best.last = tnow;
      OFFICE.line = best;
    } else if (!cur || cur.kind === "ask" || tnow - cur.last > HOLD_MS) OFFICE.line = null;
    return OFFICE.line;
  }
  function loadOffice() {
    if (OFORCE) {
      var f = decodeURIComponent(OFORCE.replace(/\+/g, " ")), m = f.match(/^([^:]+):(.+)$/);
      OFFICE.ok = f !== "off";
      OFFICE.err = f === "off" ? "forced" : null;
      OFFICE.line = f === "off" || f === "quiet" || !m ? null : m[1] === "ask" ? { name: m[2], text: "needs you", kind: "ask", key: "hook", at: Date.now() } : { name: m[1], text: m[2], kind: "work", key: "hook", at: Date.now() };
      return;
    }
    if (DEMO || !OFFICE_URL) return;
    var ac = window.AbortController ? new AbortController() : null, tm = ac ? setTimeout(function() {
      ac.abort();
    }, 6e3) : 0;
    fetch(OFFICE_URL, { cache: "no-store", signal: ac ? ac.signal : void 0 }).then(function(r) {
      if (!r.ok) throw new Error("office returned " + r.status);
      return r.json();
    }).then(function(all) {
      OFFICE.ok = true;
      OFFICE.err = null;
      OFFICE.at = /* @__PURE__ */ new Date();
      var was = OFFICE.line, ln = officeLine(all);
      if (ln && (!was || ln.key !== was.key || ln.text !== was.text) && ROBOT) {
        ROBOT.hop = 0.5;
        ROBOT.flash = 1.2;
      }
    }).catch(function(e) {
      if (OFFICE.ok !== false) console.warn("meadow: office poll failed", e);
      OFFICE.ok = false;
      OFFICE.err = e.message || String(e);
      OFFICE.line = null;
    }).then(function() {
      clearTimeout(tm);
    });
  }
  function bakeRobot(lit) {
    var w = 60, h = 80, c = canvas(w * K, h * K), g = c.getContext("2d"), cx = w / 2, ft = h - 2;
    g.scale(K, K);
    g.lineJoin = "round";
    g.fillStyle = "#BDB6AA";
    rr(g, cx - 22, ft - 31, 7, 15, 3.5);
    g.fill();
    rr(g, cx + 15, ft - 31, 7, 15, 3.5);
    g.fill();
    g.fillStyle = "#EDE8DE";
    g.strokeStyle = "#8A8378";
    g.lineWidth = 2;
    rr(g, cx - 16, ft - 35, 32, 26, 8);
    g.fill();
    g.stroke();
    g.fillStyle = "#D97757";
    rr(g, cx - 7, ft - 29, 14, 9, 3);
    g.fill();
    g.fillStyle = "#8A8378";
    g.fillRect(cx - 4, ft - 40, 8, 6);
    g.fillStyle = "#EDE8DE";
    rr(g, cx - 19, ft - 66, 38, 28, 10);
    g.fill();
    g.stroke();
    g.fillStyle = lit ? "#2B2433" : "#5E5966";
    rr(g, cx - 14, ft - 61, 28, 18, 6);
    g.fill();
    if (lit) {
      g.fillStyle = "#7FE3D0";
      rr(g, cx - 9, ft - 57, 5, 7, 2.5);
      g.fill();
      rr(g, cx + 4, ft - 57, 5, 7, 2.5);
      g.fill();
      g.strokeStyle = "#7FE3D0";
      g.lineWidth = 1.8;
      g.beginPath();
      g.arc(cx, ft - 50, 4, 0.25 * Math.PI, 0.75 * Math.PI);
      g.stroke();
    } else {
      g.strokeStyle = "#9A96A0";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx - 9, ft - 53);
      g.lineTo(cx - 4, ft - 53);
      g.moveTo(cx + 4, ft - 53);
      g.lineTo(cx + 9, ft - 53);
      g.stroke();
    }
    g.strokeStyle = "#8A8378";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx, ft - 66);
    g.lineTo(cx, ft - 74);
    g.stroke();
    return { c, ax: cx * K, ay: ft * K, k: K };
  }
  function clipWords(g, text, max) {
    if (g.measureText(text).width <= max) return text;
    while (text.length > 1 && g.measureText(text + "…").width > max) text = text.slice(0, -1);
    var sp = text.lastIndexOf(" ");
    if (sp > text.length * 0.6) text = text.slice(0, sp);
    return text.replace(/[\s,.;:-]+$/, "") + "…";
  }
  function bakeRobotBubble(line, offline) {
    var fn = "600 " + 13 * K + "px Fredoka", ft = "500 " + 16 * K + "px Fredoka", max = 250 * K, pad = 12 * K;
    var g0 = canvas(10, 10).getContext("2d"), name = offline ? null : line.name, text = offline ? "office offline" : line.text, nw = 0;
    g0.font = ft;
    text = clipWords(g0, text, max);
    var tw = g0.measureText(text).width;
    if (name) {
      g0.font = fn;
      name = clipWords(g0, name, max);
      nw = g0.measureText(name).width;
    }
    var w = Math.max(tw, nw) + pad * 2, h = (name ? 46 : 28) * K, c = canvas(w + 4 * K, h + 4 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    var rim = offline ? "#A9A4AF" : line.kind === "ask" ? "#C4553A" : "#D97757";
    g.fillStyle = offline ? "rgba(240,238,244,.92)" : "rgba(255,255,255,.96)";
    g.strokeStyle = rim;
    g.lineWidth = 2.5 * K;
    rr(g, x, y, w, h, 12 * K);
    g.fill();
    g.stroke();
    g.textAlign = "left";
    g.textBaseline = "middle";
    if (name) {
      g.fillStyle = line.kind === "ask" ? "#C4553A" : "#B5583A";
      g.font = fn;
      g.fillText(name, x + pad, y + 14 * K);
    }
    g.fillStyle = offline ? "#6E6A75" : "#26352C";
    g.font = ft;
    g.fillText(text, x + pad, name ? y + 32 * K : y + h / 2 + K);
    return { c, w: c.width / K, h: c.height / K, rim, fill: offline ? "rgba(240,238,244,.92)" : "rgba(255,255,255,.96)" };
  }
  function updateRobot(dt) {
    if (!LAY.R || !(OFFICE_URL || OFORCE)) return;
    if (!ROBOT) {
      var p0 = spot(false);
      ROBOT = { x: p0.x, y: p0.y, tx: p0.x, ty: p0.y, wait: rand(1, 4), face: 1, phase: 0, gait: 0, hop: 0, flash: 0, bubBox: null };
    }
    var R = ROBOT, off = OFFICE.ok === false;
    R.hop = Math.max(0, R.hop - dt);
    R.flash = Math.max(0, R.flash - dt);
    if (off) {
      R.gait = Math.max(0, R.gait - dt * 3);
      return;
    }
    var dx = R.tx - R.x, dy = R.ty - R.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 3) {
      R.gait = Math.max(0, R.gait - dt * 3);
      R.wait -= dt;
      if (R.wait <= 0) {
        var p = spot(false);
        R.tx = p.x;
        R.ty = p.y;
        R.wait = rand(4, 10);
      }
      return;
    }
    var v = 30 * depth(R.y), stp = Math.min(d, v * dt);
    R.x += dx / d * stp;
    R.y += dy / d * stp;
    R.face = dx >= 0 ? 1 : -1;
    R.gait = Math.min(1, R.gait + dt * 3);
    R.phase += dt * 9;
  }
  function drawRobot(time) {
    var R = ROBOT;
    if (!R) return;
    if (!ROBO_ON) {
      ROBO_ON = bakeRobot(true);
      ROBO_OFF = bakeRobot(false);
    }
    var off = OFFICE.ok === false, sc = depth(R.y) * ROBO_SC;
    var hop = (R.hop > 0 ? Math.sin((1 - R.hop / 0.5) * Math.PI) * 14 : Math.abs(Math.sin(R.phase)) * 2.5 * R.gait) * sc;
    var bob = off ? 0 : Math.sin(time * 2.2) * 0.8;
    var sw = 40 * sc * (1 - Math.min(0.4, hop / 40));
    ctx.drawImage(SHADOW, R.x - sw / 2, R.y - sw * 0.14, sw, sw * 0.28);
    ctx.fillStyle = "#6E6860";
    var l1 = Math.max(0, Math.sin(R.phase)) * 4 * R.gait, l2 = Math.max(0, -Math.sin(R.phase)) * 4 * R.gait;
    ctx.fillRect(R.x - 9 * sc, R.y - hop - (10 + l1) * sc, 6 * sc, (10 - l1 * 0.3) * sc);
    ctx.fillRect(R.x + 3 * sc, R.y - hop - (10 + l2) * sc, 6 * sc, (10 - l2 * 0.3) * sc);
    blit(off ? ROBO_OFF : ROBO_ON, R.x, R.y - hop - 7 * sc + bob, R.face, 1, 1, sc, off ? 0 : 0.04 * R.face * R.gait);
    var ax = R.x, ay = R.y - hop - 7 * sc + bob - 76 * sc, on2 = !off && (R.flash > 0 ? Math.sin(time * 18) > 0 : Math.sin(time * 3) > -0.3);
    if (on2 && DARK > 0.05) {
      ctx.globalAlpha = Math.min(1, DARK + 0.3);
      ctx.drawImage(GLOW, ax - 9, ay - 9, 18, 18);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = off ? "#8C8794" : on2 ? OFFICE.line && OFFICE.line.kind === "ask" ? "#FF6B6B" : "#FFB35C" : "#B5583A";
    ctx.beginPath();
    ctx.arc(ax, ay, 3.6 * sc, 0, 7);
    ctx.fill();
  }
  function drawRobotBubble(time) {
    var R = ROBOT;
    if (!R) return;
    var off = OFFICE.ok === false, line = OFFICE.line;
    if (!off && !line) {
      R.bubBox = null;
      return;
    }
    var key = off ? "off" : line.kind + "|" + line.name + "|" + line.text;
    if (key !== ROBO_KEY) {
      ROBO_KEY = key;
      ROBO_BUB = bakeRobotBubble(line, off);
    }
    var b = ROBO_BUB, sc = depth(R.y) * ROBO_SC, head = R.y - 92 * sc + (off ? 0 : Math.sin(time * 1.6) * 1.5);
    var bx = clamp(R.x - b.w / 2, 8, W - b.w - 8), by = head - b.h - 6;
    var tx = clamp(R.x, bx + 16, bx + b.w - 16);
    ctx.fillStyle = b.fill;
    ctx.strokeStyle = b.rim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx - 7, by + b.h - 4);
    ctx.lineTo(tx, by + b.h + 6);
    ctx.lineTo(tx + 7, by + b.h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(b.c, bx, by, b.w, b.h);
    R.bubBox = [bx, by, b.w, b.h + 10];
  }
  function robotHit(x, y) {
    var R = ROBOT;
    if (!R) return false;
    var sc = depth(R.y) * ROBO_SC;
    if (x > R.x - 46 && x < R.x + 46 && y > R.y - 100 * sc && y < R.y + 16) return true;
    var b = R.bubBox;
    return !!(b && x >= b[0] - 10 && x <= b[0] + b[2] + 10 && y >= b[1] - 10 && y <= b[1] + b[3] + 10);
  }
  var $ = function(id) {
    return ROOT.getElementById(id);
  };
  function hud() {
    var d = now();
    CD = countdowns();
    PARTY = findParty();
    HOUSE = findHouseParty();
    renderDates();
    $("clock").innerHTML = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + (WX.live && WX.temp != null ? '<span class="temp">' + Math.round(WX.temp) + "°</span>" : "");
    $("date").textContent = DAYS_LONG[d.getDay()] + " " + d.getDate() + " " + MONTHS_LONG[d.getMonth()];
    var td = ymd(d), up = DATA.events.filter(function(e) {
      return e.day === td && !e.all_day && new Date(e.start) > d;
    });
    $("next").innerHTML = up.length ? "Next: <b>" + esc(up[0].at) + "</b> " + esc(up[0].who === "House" ? "" : up[0].who + ", ") + esc(up[0].what) : DATA.events.length ? "Nothing else on today" : "";
    var st = "";
    if (DATA.error) st = "Can't load the week (" + DATA.error + ")" + (DATA.gotAt ? ". Showing " + pad2(DATA.gotAt.getHours()) + ":" + pad2(DATA.gotAt.getMinutes()) : "");
    else if (DATA.weekAt && d - DATA.weekAt > 40 * 6e4) st = "Calendars last checked " + dayLabel(ymd(DATA.weekAt)).toLowerCase() + " " + pad2(DATA.weekAt.getHours()) + ":" + pad2(DATA.weekAt.getMinutes());
    else if (DATA.calFailed && DATA.calFailed.length) st = DATA.calFailed.length + (DATA.calFailed.length === 1 ? " calendar" : " calendars") + " unavailable: " + DATA.calFailed.map(function(f) {
      return f.who;
    }).join(", ");
    else if (!DATA.gotAt && !DEMO) st = "Loading the week";
    else if (!WX.live && !DEMO) st = "Weather unavailable, showing made-up showers";
    else if (LETTER.clearErr) st = "Couldn't clear the letter in Home Assistant";
    $("status").textContent = st;
    $("next").style.opacity = FLIGHT ? 0 : 1;
    WRAP.classList.toggle("night", DARK > 0.5);
  }
  var openThing = null, closeTimer = null;
  var KIND = { homework: "Homework", kit: "Kit", "term-date": "School", "inset-day": "No school", deadline: "Deadline", event: "School" };
  function row(when, what, chip, raw) {
    return '<div class="row"><div class="when">' + esc(when) + '</div><div class="what">' + (chip ? '<span class="chip">' + esc(chip) + "</span>" : "") + (raw ? what : esc(what)) + "</div></div>";
  }
  function extraState() {
    if (!SENSORS.extra || DATA.extra) return "";
    if (DATA.extraErr) return "School info unavailable (" + DATA.extraErr + ").";
    return DATA.gotAt ? "School info unavailable." : "";
  }
  function openCard(t) {
    var p = t.person, name = p.name, td = ymd(now()), html = "";
    var mine = DATA.events.filter(function(e) {
      return e.who === name;
    });
    var today = mine.filter(function(e) {
      return e.day === td;
    }), later = mine.filter(function(e) {
      return e.day > td;
    });
    if (t.letter) {
      var lt = t.letter;
      t.letter = null;
      clearLetter(lt);
      html += "<h2>A letter</h2>" + row(pad2(lt.at.getHours()) + ":" + pad2(lt.at.getMinutes()), lt.text, "Post");
    }
    html += "<h2>Today</h2>";
    html += today.length ? today.map(function(e) {
      return row(e.all_day ? "All day" : e.at, e.what);
    }).join("") : '<div class="empty">' + ((DATA.calFailed || []).some(function(f) {
      return f.who === name;
    }) ? "Calendar unavailable, so this card can't say what's on." : name === "House" ? "Nothing for the house today." : "Nothing on today. Plenty of time for snacks.") + "</div>";
    if (later.length) {
      html += "<h2>This week</h2>";
      later.forEach(function(e) {
        html += row(dayLabel(e.day) + (e.all_day ? "" : " " + e.at), e.what);
      });
    }
    var sch = schoolSections(name);
    html += sch.html;
    var ex = DATA.extra || {}, items = (ex.items || []).filter(function(i) {
      return i.who === name && i.date >= td;
    }).sort(function(a, b) {
      return a.date < b.date ? -1 : 1;
    });
    var kit = (ex.kit || []).filter(function(k) {
      return k.who === name;
    });
    var flags = name === "House" ? ex.flags || [] : [];
    if (items.length || kit.length || flags.length) {
      html += "<h2>Good to know</h2>";
      items.forEach(function(i) {
        html += row(dayLabel(i.date), i.what, KIND[i.kind] || i.kind);
      });
      kit.forEach(function(k) {
        html += row("Every week", k.what, "Kit");
      });
      flags.forEach(function(f) {
        html += row("", f, "Heads up");
      });
    }
    var foot2 = [];
    if (DATA.weekAt) foot2.push("Calendars checked " + dayLabel(ymd(DATA.weekAt)).toLowerCase() + " " + pad2(DATA.weekAt.getHours()) + ":" + pad2(DATA.weekAt.getMinutes()) + ".");
    if (ex.checked_at) {
      var xc = new Date(ex.checked_at);
      foot2.push("School info checked " + DAYS[xc.getDay()] + " " + xc.getDate() + " " + MONTHS[xc.getMonth()] + ".");
    }
    var missing = ((ex.sources || {}).unavailable || []).filter(function(s) {
      return name === "House" || SOURCE_OWNER.some(function(m) {
        return m[0].test(s) && m[1] === name;
      });
    });
    if (missing.length) foot2.push(`<span class="bad">Couldn't check: ` + missing.map(esc).join(", ") + ".</span>");
    var calBad = (DATA.calFailed || []).filter(function(f) {
      return f.who === name;
    });
    sch.foot.forEach(function(f) {
      foot2.push('<span class="bad">' + esc(f) + "</span>");
    });
    if (calBad.length) foot2.push('<span class="bad">Calendar unavailable: ' + calBad.map(function(f) {
      return esc(f.id);
    }).join(", ") + ". This week may be missing events.</span>");
    if (!DEMO) {
      var xs = extraState();
      if (xs) foot2.push('<span class="bad">' + esc(xs) + "</span>");
    }
    if (LETTER.clearErr) foot2.push(`<span class="bad">Couldn't clear the letter in Home Assistant (` + esc(LETTER.clearErr) + ").</span>");
    html += '<div class="foot">' + foot2.join(" ") + "</div>";
    $("lists").innerHTML = html;
    $("lists").scrollTop = 0;
    $("who").textContent = name;
    $("sum").textContent = today.length ? today.length + (today.length === 1 ? " thing today" : " things today") : calBad.length ? "Calendar unavailable" : "Free today";
    $("face").style.background = mix(p.col, "#ffffff", 0.35);
    var pc = $("portrait"), g = pc.getContext("2d");
    var bs = creatureSprite(Object.assign({}, p, { r: p.r * 3.2 }), "happy", 1);
    g.clearRect(0, 0, pc.width, pc.height);
    var fit = Math.min(pc.width / bs.c.width, pc.height / bs.c.height) * 0.98;
    g.drawImage(bs.c, (pc.width - bs.c.width * fit) / 2, pc.height - 20 - bs.ay * fit, bs.c.width * fit, bs.c.height * fit);
    openThing = t;
    t.happy = 99;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeCard, 6e4);
  }
  function closeCard() {
    $("scrim").classList.remove("open");
    if (openThing) {
      openThing.happy = 0;
      openThing.wait = 1;
    }
    openThing = null;
    clearTimeout(closeTimer);
  }
  var SCHOOL_CARD = { happy: 0, wait: 0 }, KIDS = PEOPLE.filter(function(p) {
    return p.school;
  }).map(function(p) {
    return p.name;
  });
  function soft(s) {
    return ' <span class="soft">' + esc(s) + "</span>";
  }
  function empty(t) {
    return '<div class="empty">' + esc(t) + "</div>";
  }
  function weekName(w) {
    return /^week\b/i.test(w) ? w : "Week " + w;
  }
  function shortDate(ds) {
    var x = /* @__PURE__ */ new Date(ds + "T12:00:00");
    return DAYS[x.getDay()] + " " + x.getDate() + " " + MONTHS[x.getMonth()];
  }
  function lessonRows(list) {
    return list.map(function(l) {
      return '<div class="row lesson"><div class="when">' + esc(l.start || "Period " + l.p) + '</div><div class="what">' + esc(l.subject) + (l.room ? soft(l.room) : "") + "</div></div>";
    }).join("");
  }
  function weekGrid(g, td, shown) {
    var h = '<table class="tt"><tr><th></th>';
    g.days.forEach(function(d) {
      var cls = d.date === td ? "now" : d.date === shown ? "next" : "";
      h += '<th class="' + cls + '">' + DAYS_LONG[(/* @__PURE__ */ new Date(d.date + "T12:00:00")).getDay()].slice(0, 3) + "<small>" + (d.closed ? esc(d.note || "No school") : (/* @__PURE__ */ new Date(d.date + "T12:00:00")).getDate()) + "</small></th>";
    });
    h += "</tr>";
    g.rows.forEach(function(r) {
      h += "<tr><th>" + esc(r.p) + (r.start ? "<small>" + esc(r.start) + "</small>" : "") + "</th>";
      r.cells.forEach(function(c, i) {
        var d = g.days[i];
        var cls = (d.date === td ? "now" : d.date === shown ? "next" : "") + (d.closed ? " off" : "");
        h += '<td class="' + cls + '">' + (c ? esc(c.subject) + (c.room ? "<small>" + esc(c.room) + "</small>" : "") : "") + "</td>";
      });
      h += "</tr>";
    });
    return h + "</table>";
  }
  function nextLessonDay(name, from) {
    for (var i = 1; i <= 14; i++) {
      var d = addDays(from, i), t = ttFor(name, d);
      if (t.status === "ok" || t.status === "unavailable" || t.status === "no_week") return { d, t, i };
    }
    return null;
  }
  function dishHtml(o, picked) {
    return '<div class="dish' + (picked ? " picked" : "") + '">' + (picked ? '<span class="chip pick">Chosen</span>' : "") + esc(o.name) + (o.kind ? soft(o.kind) : "") + o.allergens.map(function(a) {
      return ' <span class="alg">' + esc(a) + "</span>";
    }).join("") + "</div>";
  }
  function lunchHtml(name, d, l, today) {
    var ch = l.status === "served" || l.status === "no_menu" || l.status === "ended" ? choiceFor(name, d, l.choice) : null;
    var pick2 = ch && ch.text ? ch.text.toLowerCase() : "", named = l.options.some(function(o) {
      return o.name.toLowerCase() === pick2;
    });
    var head = ch && ch.text ? '<span class="chip choice">' + esc(named ? "School dinner" : ch.text) + "</span>" : "";
    if (l.status === "served") {
      var opts = l.options.map(function(o) {
        return dishHtml(o, o.name.toLowerCase() === pick2);
      }).join("");
      return head + (opts || esc("Served, options not listed")) + (l.pudding ? '<div class="dish"><span class="soft">Pudding</span> ' + esc(l.pudding.name) + l.pudding.allergens.map(function(a) {
        return ' <span class="alg">' + esc(a) + "</span>";
      }).join("") + "</div>" : "") + (l.note ? '<div class="dish soft">' + esc(l.note) + "</div>" : "");
    }
    if (l.status === "closed") return esc("No school lunch" + (today ? " today" : "") + (l.note ? " (" + l.note + ")" : ""));
    if (l.status === "weekend") return esc("No school, it's the weekend");
    if (l.status === "ended") return head + esc("Menu ran out after " + shortDate(l.menuEnds));
    if (l.status === "loading") return esc("Loading the menu");
    return head + esc("Menu not published for this week");
  }
  function schoolSections(name) {
    var out = { html: "", foot: [] }, src = SRC[name];
    if (!src) return out;
    var d = now(), td = ymd(d);
    if (src.timetable) {
      var t = ttFor(name, d), shown = null, sh = null, head;
      if (t.status === "unavailable") {
        out.html += "<h2>Lessons</h2>" + empty("Timetable unavailable (" + src.timetable.entity + ")");
        out.foot.push("Timetable " + src.timetable.entity + " " + (t.reason || "unavailable") + ".");
      } else if (t.status === "loading") out.html += "<h2>Lessons</h2>" + empty("Loading the timetable.");
      else if (t.status === "no_week") {
        out.html += "<h2>Lessons</h2>" + empty("Timetable can't tell which week this is");
        out.foot.push("Timetable " + src.timetable.entity + ": " + t.reason + ". Add anchor or week_of.");
      } else {
        if (t.status === "ok" && !lessonsOver(t, d)) {
          shown = td;
          sh = t;
          head = "Lessons today";
        } else {
          if (t.status !== "ok") out.html += "<h2>Lessons today</h2>" + empty("No school today" + (t.note && t.status === "closed" ? " (" + t.note + ")" : ""));
          var nx = nextLessonDay(name, d);
          if (nx && nx.t.status === "ok") {
            shown = ymd(nx.d);
            sh = nx.t;
            head = "Lessons " + (nx.i === 1 ? "tomorrow" : nx.i < 7 ? DAYS_LONG[nx.d.getDay()] : shortDate(shown));
          } else if (nx) out.foot.push("Timetable " + src.timetable.entity + " " + (nx.t.reason || "unavailable") + ".");
          else out.html += empty("No lessons on the timetable for the next two weeks.");
        }
        if (sh) out.html += "<h2>" + esc(head) + "</h2>" + (sh.lessons.length ? lessonRows(sh.lessons) : empty("Nothing on the timetable for " + DAYS_LONG[(/* @__PURE__ */ new Date(shown + "T12:00:00")).getDay()] + "."));
        var g = (sh || t).grid;
        if (g && g.week) out.html += '<details class="wk"><summary>' + esc(weekName(g.week)) + ", from " + esc(shortDate(g.monday)) + "</summary>" + weekGrid(g, td, shown) + "</details>";
      }
    }
    if (src.lunch) {
      var first = lunchFor(name, d);
      out.html += "<h2>Lunch</h2>";
      if (first.status === "unavailable") {
        out.html += empty("Lunch menu unavailable (" + src.lunch.entity + ")");
        out.foot.push("Lunch menu " + src.lunch.entity + " " + (first.reason || "unavailable") + ".");
      } else {
        var days = weekday(d) ? [d] : [];
        var nd = addDays(d, 1);
        while (!weekday(nd)) nd = addDays(nd, 1);
        days.push(nd);
        days.forEach(function(x) {
          out.html += row(dayLabel(ymd(x)), lunchHtml(name, x, lunchFor(name, x), ymd(x) === td), "", true);
        });
        var ce = choiceFor(name, d, first.choice);
        if (ce && ce.err) out.foot.push("Lunch choice unavailable (" + ce.err + ").");
      }
    }
    return out;
  }
  function schoolWeek(td) {
    var d = now(), kids = PEOPLE.filter(function(p) {
      return SRC[p.name] && SRC[p.name].timetable;
    });
    if (!kids.length) return "";
    var mon = weekday(d) ? mondayOf(d) : mondayOf(addDays(d, 7)), dates = [0, 1, 2, 3, 4].map(function(i) {
      return ymd(addDays(mon, i));
    });
    var h = "<h2>" + (weekday(d) ? "This week" : "Next week") + '</h2><table class="tt lanes"><tr><th></th>';
    dates.forEach(function(ds) {
      h += '<th class="' + (ds === td ? "now" : "") + '">' + esc(shortDate(ds).replace(/ \w+$/, "")) + "</th>";
    });
    h += "</tr>";
    kids.forEach(function(p) {
      var t = ttFor(p.name, mon), g = t.grid;
      h += '<tr><th class="who"><span class="dot" style="background:' + esc(p.col) + '"></span>' + esc(p.name) + (g && g.week ? "<small>" + esc(weekName(g.week)) + "</small>" : "") + "</th>";
      if (!g || !g.week) {
        h += '<td colspan="5" class="off">' + esc(t.status === "unavailable" ? "Timetable unavailable (" + SRC[p.name].timetable.entity + ")" : t.status === "loading" ? "Loading" : g && g.off ? "No timetable this week" : "Timetable can't tell which week this is") + "</td></tr>";
        return;
      }
      g.days.forEach(function(day) {
        h += '<td class="' + (day.date === td ? "now" : "") + (day.closed ? " off" : "") + '">' + (day.closed ? esc(day.note || "No school") : day.lessons.map(function(l) {
          return '<div class="ln"><b>' + esc(l.p) + "</b> " + esc(l.subject) + "</div>";
        }).join("")) + "</td>";
      });
      h += "</tr>";
    });
    return h + "</table>";
  }
  function termRows(sc, td) {
    var out = "", cur = null, next = null;
    sc.terms.forEach(function(t) {
      if (t.from && t.from <= td && (!t.to || t.to >= td)) cur = t;
      else if (!t.from && t.to && t.to >= td && !cur) cur = t;
      if (!next && t.from && t.from > td) next = t;
    });
    if (cur) out += row(cur.to ? dayLabel(cur.to) : "", esc(cur.label) + (cur.to ? " ends" : " is on") + (cur.note ? soft(cur.note) : ""), sc.who, true);
    if (next) out += row(dayLabel(next.from), esc(next.label) + " starts" + (next.note ? soft(next.note) : ""), sc.who, true);
    if (!cur && !next) sc.terms.filter(function(t) {
      return !t.from && !t.to;
    }).forEach(function(t) {
      out += row("", esc(t.label) + soft(t.note || "not published"), sc.who, true);
    });
    (sc.days || []).filter(function(d) {
      return d.date >= td;
    }).slice(0, 3).forEach(function(d) {
      out += row(dayLabel(d.date), esc(d.what), sc.who, true);
    });
    return out;
  }
  function openSchool() {
    var d = now(), td = ymd(d), ex = DATA.extra || {}, S = DATA.school || {}, html = "", sum = "";
    html += schoolWeek(td);
    var lunchKids = PEOPLE.filter(function(p) {
      return SRC[p.name] && SRC[p.name].lunch;
    });
    if (lunchKids.length && weekday(d)) {
      html += "<h2>Lunch today</h2>";
      lunchKids.forEach(function(p) {
        var l = lunchFor(p.name, d);
        html += row(p.name, l.status === "unavailable" ? esc("Lunch menu unavailable (" + SRC[p.name].lunch.entity + ")") : lunchHtml(p.name, d, l, true), "", true);
      });
    }
    if (S.kit) html += "<h2>Kit today</h2>" + row(SCHOOL_WHO.kit, S.kit.kit_today && S.kit.kit_today !== "none" ? S.kit.kit_today : "No kit needed");
    var days = KIDS.map(function(n) {
      return schoolDay(n, d);
    }), atSchool = days.filter(function(x) {
      return x === true;
    }).length;
    sum = !weekday(d) ? "Weekend" : atSchool ? atSchool + (atSchool === 1 ? " child" : " children") + " at school today" : days.length && days.every(function(x) {
      return x === false;
    }) ? "No school today" : "Can't tell who has school today";
    var items = (ex.items || []).filter(function(i) {
      return KIDS.indexOf(i.who) >= 0 && i.date >= td;
    }).sort(function(a, b) {
      return a.date < b.date ? -1 : 1;
    });
    html += "<h2>Coming up</h2>";
    html += items.length ? items.slice(0, 12).map(function(i) {
      return row(dayLabel(i.date), (KIND[i.kind] ? KIND[i.kind] + ": " : "") + i.what, i.who);
    }).join("") + (items.length > 12 ? '<div class="empty">+' + (items.length - 12) + " more on each child's card</div>" : "") : '<div class="empty">Nothing gathered for the coming weeks.</div>';
    (ex.kit || []).filter(function(k) {
      return KIDS.indexOf(k.who) >= 0;
    }).forEach(function(k) {
      html += row("Every week", k.what, k.who);
    });
    html += "<h2>Term dates</h2>";
    html += ex.schools && ex.schools.length ? ex.schools.map(function(sc) {
      return termRows(sc, td);
    }).join("") : '<div class="empty">Term dates not gathered yet.</div>';
    var foot2 = [];
    if (ex.checked_at) {
      var xc = new Date(ex.checked_at);
      foot2.push("School info checked " + DAYS[xc.getDay()] + " " + xc.getDate() + " " + MONTHS[xc.getMonth()] + ".");
    }
    var missing = (ex.sources || {}).unavailable || [];
    if (missing.length) foot2.push(`<span class="bad">Couldn't check: ` + missing.map(esc).join(", ") + ".</span>");
    if (!DEMO) {
      var xs2 = extraState();
      if (xs2) foot2.push('<span class="bad">' + esc(xs2) + "</span>");
    }
    PEOPLE.forEach(function(p) {
      schoolSections(p.name).foot.forEach(function(f) {
        foot2.push('<span class="bad">' + esc(p.name + ": " + f) + "</span>");
      });
    });
    (CONFIG.schoolOrphans || []).forEach(function(o) {
      foot2.push('<span class="bad">' + esc("sensors." + o.key + " (" + o.entity + ") belongs to schoolWho." + o.key + " = " + o.who + ", who is not in people. Set " + o.key + " on the child.") + "</span>");
    });
    html += '<div class="foot">' + foot2.join(" ") + "</div>";
    $("lists").innerHTML = html;
    $("lists").scrollTop = 0;
    $("who").textContent = "School";
    $("sum").textContent = sum;
    $("face").style.background = "#F6E7B8";
    var pc = $("portrait"), g = pc.getContext("2d"), s = LAY.school, cut = s.cut || [s.x - 105, s.y - 150, 210, 175], sw = cut[2], sh = cut[3];
    g.clearRect(0, 0, pc.width, pc.height);
    g.drawImage(BG, cut[0] * DPR, cut[1] * DPR, sw * DPR, sh * DPR, 0, (pc.height - pc.width * sh / sw) / 2, pc.width, pc.width * sh / sw);
    openThing = SCHOOL_CARD;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeCard, 6e4);
  }
  var SHOP_CARD = { happy: 0, wait: 0 };
  var PR_LABEL = {
    running: "Printing",
    pause: "Paused",
    finish: "Finished",
    failed: "Failed",
    idle: "Idle",
    prepare: "Getting ready",
    slicing: "Slicing",
    init: "Starting up",
    offline: "Offline",
    unknown: "Unknown",
    missing: "Not reachable"
  };
  function mins(m) {
    return m >= 60 ? Math.floor(m / 60) + "h " + pad2(m % 60) + "m" : m + " min";
  }
  function openShop() {
    var ps = printerState(), live = ps !== "empty", st = live ? PR.status : PR.err ? "missing" : PR.status, html = "", sum;
    var label = PR_LABEL[st] || st;
    html += "<h2>The printer</h2>" + row("Status", label);
    if (live && PR.name && st !== "idle") html += row("Job", PR.name);
    if (st === "running" || st === "pause") {
      html += row("Progress", Math.round(PR.progress) + "%");
      if (PR.layer != null && PR.layers != null) html += row("Layer", PR.layer + " of " + PR.layers);
      if (PR.remain != null) {
        var done = new Date(now().getTime() + PR.remain * 6e4);
        html += row("Time left", mins(PR.remain)) + row("Done at", pad2(done.getHours()) + ":" + pad2(done.getMinutes()) + (st === "pause" ? " once it resumes" : ""));
      }
      sum = label + ", " + Math.round(PR.progress) + "%";
    } else if (st === "finish") {
      html += row("Progress", "100%");
      sum = "Finished" + (PR.name ? ": " + PR.name : "");
    } else if (st === "failed") sum = "The print failed";
    else if (/^(prepare|slicing|init)$/.test(st)) sum = "A print is starting";
    else if (st === "idle") sum = "Nothing printing";
    else sum = live ? label : "Printer not reachable";
    var foot2 = [];
    if (PR.at) foot2.push("Printer checked " + pad2(PR.at.getHours()) + ":" + pad2(PR.at.getMinutes()) + ".");
    if (!live) foot2.push('<span class="bad">' + (PR.err ? "Can't reach the printer sensors (" + esc(PR.err) + ")." : "No fresh reading from the printer.") + "</span>");
    html += '<div class="foot">' + foot2.join(" ") + "</div>";
    $("lists").innerHTML = html;
    $("lists").scrollTop = 0;
    $("who").textContent = "Workshop";
    $("sum").textContent = sum;
    $("face").style.background = "#DCE6F0";
    var pc = $("portrait"), g = pc.getContext("2d"), k = pc.width / 130;
    g.clearRect(0, 0, pc.width, pc.height);
    g.save();
    g.scale(k, k);
    g.translate(65, 118);
    [[SHOP.walls2, 0, 0], [SHOP.roof, 0, -48], [SHOP.sign, -56, 0]].forEach(function(p) {
      var ic = p[0];
      g.drawImage(ic.c, p[1] - ic.ax / ic.k, p[2] - ic.ay / ic.k, ic.c.width / ic.k, ic.c.height / ic.k);
    });
    g.restore();
    openThing = SHOP_CARD;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeCard, 6e4);
  }
  var PLANE, BANNER = { key: null, c: null, w: 0, h: 0 }, FLIGHT = null, flightT = 6, flightDir = -1;
  var LANE = 166;
  function nextEvent() {
    var d = now(), td = ymd(d);
    for (var i = 0; i < DATA.events.length; i++) {
      var e = DATA.events[i];
      if (!e.all_day && new Date(e.start) > d || e.all_day && e.day > td) return e;
    }
    return null;
  }
  function bakeBanner(e) {
    if (typeof e === "string") e = { who: "House", what: e, day: ymd(now()), all_day: true };
    var p = PEOPLE.filter(function(q) {
      return q.name === e.who;
    })[0];
    var when = (e.day === ymd(now()) ? "" : dayLabel(e.day) + " ") + (e.all_day ? "" : e.at);
    var what = e.what.length > 38 ? e.what.slice(0, 36) + "..." : e.what;
    var g0 = canvas(10, 10).getContext("2d"), f1 = "600 " + 19 * K + "px Fredoka", f2 = "500 " + 19 * K + "px Fredoka";
    var parts2 = [[when, f1, INK], [e.who === "House" ? "" : e.who, f1, p ? shade(p.col, 0.55) : INK], [what, f2, INK]].filter(function(a) {
      return a[0];
    });
    var gap = 10 * K, tw = 0;
    parts2.forEach(function(a) {
      g0.font = a[1];
      a.push(g0.measureText(a[0]).width);
      tw += a[3] + gap;
    });
    var w = tw + 28 * K, h = 34 * K, c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = "#FFF8EE";
    g.strokeStyle = "#D9C6A5";
    g.lineWidth = 2 * K;
    g.beginPath();
    g.moveTo(K, K);
    g.lineTo(w - 10 * K, K);
    g.lineTo(w - K, h / 2);
    g.lineTo(w - 10 * K, h - K);
    g.lineTo(K, h - K);
    g.closePath();
    g.fill();
    g.stroke();
    g.textBaseline = "middle";
    var x = 14 * K;
    parts2.forEach(function(a) {
      g.font = a[1];
      g.fillStyle = a[2];
      g.fillText(a[0], x, h / 2 + K);
      x += a[3] + gap;
    });
    BANNER.c = c;
    BANNER.w = w / K;
    BANNER.h = h / K;
  }
  function planeSprite() {
    return icon(64, 34, function(g) {
      g.fillStyle = "#C24E42";
      g.beginPath();
      g.moveTo(6, 8);
      g.lineTo(14, 8);
      g.lineTo(20, 18);
      g.lineTo(6, 18);
      g.closePath();
      g.fill();
      rimmed(g, "#B9A58A", "#FFF4E8", 1.2, function(e) {
        g.beginPath();
        g.ellipse(32, 20, 26 + e, 8 + e, 0, 0, 7);
        g.fill();
      });
      g.fillStyle = "#E86A5B";
      g.beginPath();
      g.ellipse(34, 23, 14, 4, 0.1, 0, 7);
      g.fill();
      g.fillStyle = "#6FB6E8";
      rr(g, 38, 13, 10, 6, 3);
      g.fill();
      g.fillStyle = "#F6C28B";
      g.beginPath();
      g.arc(43, 13, 4, Math.PI, 0);
      g.fill();
      g.fillStyle = "#8D6440";
      g.fillRect(57, 17, 3, 6);
    });
  }
  function updatePlane(dt) {
    var party = PARTY_T > 0.5 && PARTY, e = party ? PARTY.label : nextEvent();
    var key = party ? "party|" + PARTY.label : e ? e.who + "|" + e.start + "|" + e.what : "";
    if (key !== BANNER.key) {
      BANNER.key = key;
      if (e) {
        bakeBanner(e);
        if (!FLIGHT) flightT = Math.min(flightT, 2);
      }
    }
    if (FLIGHT) {
      FLIGHT.x += FLIGHT.dir * 72 * dt;
      var span = 64 + 40 + BANNER.w;
      if (FLIGHT.dir > 0 && FLIGHT.x > W + span || FLIGHT.dir < 0 && FLIGHT.x < -span) FLIGHT = null;
      return;
    }
    flightT -= dt;
    if (flightT <= 0 && e && BANNER.c) {
      flightDir = -flightDir;
      FLIGHT = { dir: flightDir, x: flightDir > 0 ? -40 : W + 40 };
      flightT = party ? 60 : 180;
    }
  }
  function drawPlane(time) {
    if (!FLIGHT) return;
    var f = FLIGHT, py = LANE - 8 + Math.sin(time * 1.4) * 2.5;
    var tailX = f.x - f.dir * 30, bw = BANNER.w, bh = BANNER.h, lead = tailX - f.dir * 40;
    var bx = f.dir > 0 ? lead - bw : lead, by = LANE - bh / 2;
    ctx.strokeStyle = "rgba(90,80,70,.7)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tailX, py + 2);
    ctx.lineTo(lead, LANE);
    ctx.stroke();
    var n = 10, sw = bw / n, c = BANNER.c;
    for (var i = 0; i < n; i++) {
      var fromLead = f.dir > 0 ? (n - 1 - i) / (n - 1) : i / (n - 1);
      var dy = Math.sin(time * 4 - fromLead * 3) * 2.5 * fromLead;
      ctx.drawImage(c, i * sw * K, 0, sw * K + 1, c.height, bx + i * sw, by + dy, sw + 0.5, bh);
    }
    blit(PLANE, f.x, py + 17, f.dir, 1, 1, 1);
    var nose = f.x + f.dir * 30, spin = Math.abs(Math.sin(time * 30));
    ctx.strokeStyle = "rgba(60,60,60,.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nose, py + 3 - 9 * spin);
    ctx.lineTo(nose, py + 3 + 9 * spin);
    ctx.stroke();
  }
  function planeLight(a, time) {
    if (!FLIGHT) return;
    var on2 = Math.sin(time * 5) > 0, x = FLIGHT.x - FLIGHT.dir * 4, y = LANE + 6;
    ctx.globalAlpha = a * (on2 ? 1 : 0.35);
    ctx.drawImage(GLOW, x - 10, y - 10, 20, 20);
    ctx.fillStyle = FLIGHT.dir > 0 ? "#7BE07F" : "#FF6B6B";
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  $("done").addEventListener("click", closeCard);
  $("scrim").addEventListener("pointerdown", function(e) {
    if (e.target === $("scrim")) closeCard();
  });
  $("lists").addEventListener("scroll", function() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeCard, 6e4);
  });
  cv.addEventListener("pointerdown", function(e) {
    if (openThing) return;
    var bx0 = cv.getBoundingClientRect(), x = e.clientX - bx0.left, y = e.clientY - bx0.top, best = null, bd = 1e9, i, t;
    for (i = 0; i < fam.length; i++) {
      t = fam[i];
      var b = t.tagBox, sc = depth(t.y);
      var d = Math.sqrt(Math.pow(x - t.x, 2) + Math.pow(y - (t.y + (t.dy || 0) - t.r * sc * 0.9 - hopOf(t)), 2));
      if (b && x >= b[0] - 10 && x <= b[0] + b[2] + 10 && y >= b[1] - 10 && y <= b[1] + b[3] + 10) d = 0;
      if (d < t.r * sc * 1.8 && d < bd) {
        bd = d;
        best = t;
      }
    }
    if (best) {
      best.jump = 0.6;
      best.happy = 1;
      puff("heart", best.x, best.y - best.r * 2.2, 3, best.person.col);
      setTimeout(function() {
        openCard(best);
      }, 320);
      return;
    }
    if (robotHit(x, y)) {
      ROBOT.hop = 0.5;
      ROBOT.flash = 1;
      say("beep!", ROBOT.x, ROBOT.y - 90);
      setTimeout(function() {
        goView(VIEW.office);
      }, 380);
      return;
    }
    SV.sign = SIGN && MUSIC_T > 0.3 ? SIGN.h + 14 : 0;
    for (i = 0; i < HOTSPOT_IDS.length; i++) if (tapHotspot(HOTSPOT_IDS[i], x, y)) return;
    for (i = 0; i < things.length; i++) {
      t = things[i];
      if (t.kind !== "fam" && Math.abs(x - t.x) < t.r * 1.8 && Math.abs(y - (t.y - t.r)) < t.r * 1.8) {
        t.jump = 0.6;
        t.happy = 1.2;
        t.flee = 0;
        puff("heart", t.x, t.y - t.r * 2, 1, "#FF7FA0");
        return;
      }
    }
  });
  function tapHotspot(id, x, y) {
    var h = (SCENE.hotspots || {})[id];
    if (!h || h.robot || id !== "school" && !VIEW[id]) return false;
    var b = h.box(SV), tb = id === "school" && SCHOOL_CARD.tagBox;
    if (!(x > b[0] && x < b[2] && y > b[1] && y < b[3]) && !(tb && x >= tb[0] - 10 && x <= tb[0] + tb[2] + 10 && y >= tb[1] - 10 && y <= tb[1] + tb[3] + 10)) return false;
    h.tap(SV);
    if (id === "school") setTimeout(openSchool, 320);
    else setTimeout(function() {
      goView(VIEW[id]);
    }, 380);
    return true;
  }
  cv.addEventListener("pointerdown", function() {
    try {
      document.dispatchEvent(new Event("panel-activity"));
    } catch (err) {
      console.warn("meadow: activity event failed", err);
    }
  });
  function size() {
    W = WRAP.clientWidth || 1280;
    H = WRAP.clientHeight || 800;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * DPR;
    cv.height = H * DPR;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    HZ = Math.round(H * 0.27);
    TOP = HZ + 44;
    bakeBackground();
  }
  var last = 0, lastHud = 0, clock0 = performance.now(), FPSN = 0, FPSMS = 0, FPS0 = 0, FPST = "";
  function frame(ms) {
    requestAnimationFrame(frame);
    if (ms - last < 31) return;
    var dt = Math.max(0, Math.min(0.1, (ms - last) / 1e3));
    last = ms;
    nightness = sleepCurve(now(), PARTY ? 21.5 : 20.5);
    DARK = darkness(now());
    var t0 = FPS ? performance.now() : 0;
    update2(dt);
    draw((ms - clock0) / 1e3);
    if (FPS) {
      FPSN++;
      FPSMS += performance.now() - t0;
      if (ms - FPS0 >= 2e3) {
        FPST = (FPSN * 1e3 / (ms - FPS0)).toFixed(1) + " fps · " + (FPSMS / FPSN).toFixed(1) + " ms";
        FPSN = 0;
        FPSMS = 0;
        FPS0 = ms;
      }
      ctx.font = "600 16px Fredoka";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#000";
      ctx.fillRect(W - 170, H - 26, 170, 26);
      ctx.fillStyle = "#FFF";
      ctx.fillText(FPST, W - 8, H - 4);
    }
    if (ms - lastHud > 1e3) {
      lastHud = ms;
      hud();
    }
  }
  function start() {
    size();
    setup2();
    refreshTags();
    load();
    nightness = sleepCurve(now(), 20.5);
    DARK = darkness(now());
    hud();
    loadMusic();
    if (WARM) {
      nightness = sleepCurve(now(), PARTY ? 21.5 : 20.5);
      for (var wi = 0; wi < Math.min(WARM, 120) * 30; wi++) update2(1 / 30);
    }
    setInterval(load, 5 * 6e4);
    setTimeout(loadLive, DEMO ? 2500 : 1500);
    setInterval(loadLive, 45e3);
    setInterval(loadMusic, 1e4);
    setTimeout(loadOffice, DEMO ? 2e3 : 1200);
    setInterval(loadOffice, 1e4);
    requestAnimationFrame(frame);
    if (/[?&]dbg\b/.test(Q)) window.meadow = {
      fam,
      LETTER,
      pr: function() {
        return PR;
      },
      music: function() {
        return { m: MUSIC, t: MUSIC_T, dance: DANCE, sign: SIGN && { w: SIGN.w, h: SIGN.h } };
      },
      fps: function() {
        return FPST;
      },
      isMusic,
      state: printerState,
      open: openCard,
      shop: openShop,
      office: function() {
        return { o: OFFICE, robot: ROBOT && { x: ROBOT.x, y: ROBOT.y, bub: ROBOT.bubBox } };
      },
      officeLine,
      nav: function() {
        return NAVS;
      },
      go: goView,
      inZone
    };
    if (OPEN === "school") {
      if (SCENE.hotspots && SCENE.hotspots.school) setTimeout(openSchool, 900);
    } else if (OPEN === "workshop") setTimeout(openShop, 900);
    else if (OPEN) setTimeout(function() {
      var t = fam.filter(function(f) {
        return f.person.name.toLowerCase() === OPEN.toLowerCase();
      })[0];
      if (t) openCard(t);
    }, 900);
  }
  (document.fonts && document.fonts.load ? document.fonts.load("600 20px Fredoka").catch(function(e) {
    console.warn("font", e);
  }) : Promise.resolve()).then(function() {
    if (!STOPPED) {
      start();
      STARTED = true;
    }
  });
  return {
    // positions are fractions of the card, so a new size rebuilds the village
    resize: function() {
      if (STOPPED || !STARTED) return;
      if (WRAP.clientWidth === W && WRAP.clientHeight === H) return;
      size();
      if (VIL) VILLAGE = makeVillage();
      else makeDrops();
      makeWeatherSprites();
      if (SCENE.ambient) SCENE.ambient.setup(SV);
    },
    stop: function() {
      STOPPED = true;
      TIMERS2.forEach(function(id) {
        window.clearInterval(id);
      });
      window.cancelAnimationFrame(RAF);
    }
  };
}

// src/card.js
var BASE = new URL("./", import.meta.url).href;
var STYLE = `
:host { display: block; }
.fd {
  --ink: #26352C; --ink-soft: #56675C; --paper: #F4F9F2; --paper-2: #E7F1E4;
  --scrim: rgba(22, 40, 30, .42); --warn: #A8431F; --hud: #26352C; --hud-soft: #4C6152;
}
.fd.night {
  --ink: #E6EEF2; --ink-soft: #A9B8C4; --paper: #1D2A3A; --paper-2: #26364A;
  --scrim: rgba(6, 10, 22, .55); --warn: #FFB08A; --hud: #EAF1F6; --hud-soft: #B3C2CF;
}
.fd { position: relative; width: 100%; height: 100%; overflow: hidden; background: #A6D9A8;
  font-family: Fredoka, "Instrument Sans", Roboto, sans-serif; color: var(--ink);
  -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
canvas#world { display: block; position: absolute; left: 0; top: 0; touch-action: none; }

#hud { position: absolute; left: 40px; top: 22px; pointer-events: none; color: var(--hud); }
#clock { font-size: 88px; font-weight: 600; line-height: 1; letter-spacing: -.02em; }
#date { font-size: 26px; font-weight: 500; margin-top: 4px; }
#next { font-size: 22px; margin-top: 8px; color: var(--hud-soft); }
#clock .temp { font-size: 34px; font-weight: 500; margin-left: 16px; vertical-align: 40px; color: var(--hud-soft); }
#next b { font-weight: 600; color: var(--hud); }
#corner { position: absolute; right: 36px; top: 30px; text-align: right; pointer-events: none;
  font-size: 19px; color: var(--hud-soft); }
#status { color: var(--warn); font-weight: 500; margin-top: 6px; }

/* Countdowns: a row of tags in the sky between the clock and the corner hint, the
   same white pill with a coloured rim and a number badge as the name tags on the
   canvas, so "Kid 2 31" reads the same way "Parent 2 3" does. Fixed colours, not the
   HUD variables: the pills stay white at night like the tags do. */
#dates { position: absolute; left: 390px; right: 340px; top: 32px; height: 40px; display: flex;
  align-items: flex-start; overflow: hidden; pointer-events: none; }
.dchip { flex: none; display: flex; align-items: center; height: 36px; margin-right: 12px;
  padding: 0 5px 0 10px; border-radius: 999px; box-sizing: border-box;
  background: rgba(255, 255, 255, .95); border: 2.5px solid #999;
  font: 600 18px Fredoka, sans-serif; color: #26352C; white-space: nowrap; }
.dchip:last-child { margin-right: 0; }
.dchip .dic { width: 22px; height: 22px; margin-right: 7px; flex: none; }
.dchip .dn { margin-left: 8px; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px;
  color: #fff; font-size: 15px; line-height: 24px; text-align: center; box-sizing: border-box; }
.dchip.now { animation: dbob 1.4s ease-in-out infinite; }
@keyframes dbob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

#scrim { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: var(--scrim);
  display: flex; align-items: center; justify-content: center; opacity: 0;
  pointer-events: none; transition: opacity .22s ease-out; }
#scrim.open { opacity: 1; pointer-events: auto; }
#card { width: 1080px; max-width: calc(100% - 48px); height: 660px; max-height: calc(100% - 48px);
  background: var(--paper); border-radius: 32px; display: flex; overflow: hidden;
  box-shadow: 0 24px 60px rgba(20, 44, 30, .35);
  transform: translateY(24px) scale(.96); transition: transform .32s cubic-bezier(.2, 1.3, .4, 1); }
#scrim.open #card { transform: none; }
#face { width: 320px; flex: none; display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px 28px; box-sizing: border-box; }
#portrait { width: 240px; height: 240px; }
#who { font-size: 52px; font-weight: 600; margin: 10px 0 0; line-height: 1.05; color: #26352C; }
#sum { font-size: 22px; margin: 8px 0 0; color: #3E5146; text-align: center; }
#done { margin-top: auto; font: 600 24px Fredoka, sans-serif; color: #26352C;
  background: rgba(255, 255, 255, .78); border: 0; border-radius: 999px; padding: 16px 48px; }
#done:active { transform: scale(.97); }
#lists { flex: 1; overflow-y: auto; padding: 36px 44px 32px 40px; -webkit-overflow-scrolling: touch; }
#lists h2 { font-size: 20px; font-weight: 600; color: var(--ink-soft); margin: 26px 0 10px; }
#lists h2:first-child { margin-top: 0; }
.row { display: flex; align-items: baseline; padding: 7px 0; font-size: 24px; line-height: 1.25; }
.when { flex: none; width: 150px; color: var(--ink-soft); font-size: 20px; font-weight: 500; }
.what { flex: 1; }
.chip { display: inline-block; font-size: 15px; font-weight: 600; border-radius: 999px;
  padding: 3px 10px; margin-right: 10px; vertical-align: 3px; background: var(--paper-2); color: var(--ink-soft); }
.empty { font-size: 24px; color: var(--ink-soft); padding: 4px 0 2px; }
.foot { font-size: 16px; color: var(--ink-soft); margin-top: 30px; }
.soft { color: var(--ink-soft); font-size: .8em; margin-left: 6px; }
.lesson { font-size: 27px; font-weight: 500; }
.tt { width: 100%; border-collapse: separate; border-spacing: 4px; }
.tt th { font-size: 15px; font-weight: 600; color: var(--ink-soft); text-align: left; padding: 2px 6px; }
.tt td { font-size: 16px; line-height: 1.2; padding: 6px 8px; border-radius: 10px; background: var(--paper-2); vertical-align: top; }
.tt td small { display: block; font-size: 12px; color: var(--ink-soft); }
.tt td.now, .tt th.now { background: #F3E3A2; color: #26352C; }
.tt td.now small { color: #56675C; }
.tt th small { display: block; font-size: 12px; font-weight: 500; }
.tt td.next, .tt th.next { box-shadow: inset 0 0 0 2px #E2C25A; }
.tt td.off { background: transparent; color: var(--ink-soft); }
.tt .ln { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tt .ln b { font-weight: 600; color: var(--ink-soft); font-size: 12px; margin-right: 2px; }
.tt.lanes { table-layout: fixed; }
.tt.lanes td { font-size: 14px; }
.tt.lanes th.who { width: 112px; font-size: 16px; color: var(--ink); }
.tt.lanes .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
.wk { margin: 12px 0 2px; }
.wk > summary { font-size: 18px; font-weight: 600; color: var(--ink-soft); padding: 8px 0; cursor: pointer; outline: none; }
.dish { padding: 1px 0 3px; }
.dish > .soft:first-child { margin-left: 0; margin-right: 4px; }
.alg { display: inline-block; font-size: 13px; font-weight: 600; border-radius: 999px; padding: 1px 8px; margin-left: 4px;
  vertical-align: 2px; background: #F8DCCB; color: #7A3412; }
.chip.choice { background: #D7EBD3; color: #2D5737; }
.chip.pick { background: #F3E3A2; color: #26352C; }
#next { transition: opacity .6s; }
.foot .bad { color: var(--warn); }
@media (prefers-reduced-motion: reduce) { #card, #scrim { transition: none; } .dchip.now { animation: none; } }
`;
var MARKUP = `<div class="fd">
<canvas id="world"></canvas>
<div id="hud"><div id="clock">--:--</div><div id="date"></div><div id="next"></div></div>
<div id="dates"></div>
<div id="corner"><div>Tap someone to see their week</div><div id="status"></div></div>
<div id="scrim"><section id="card">
  <div id="face"><canvas id="portrait" width="480" height="480"></canvas>
    <h1 id="who"></h1><p id="sum"></p><button id="done">Done</button></div>
  <div id="lists"></div>
</section></div>
</div>`;
function addFont() {
  if (document.getElementById("family-dashboard-font")) return;
  const s = document.createElement("style");
  s.id = "family-dashboard-font";
  s.textContent = '@font-face { font-family: Fredoka; src: url("' + BASE + 'fonts/Fredoka.woff2") format("woff2"); font-weight: 400 600; font-display: block; }';
  document.head.appendChild(s);
}
var FamilyDashboardCard = class extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._m = null;
    this.attachShadow({ mode: "open" });
  }
  static getStubConfig(hass) {
    return stubConfig(hass);
  }
  static getConfigElement() {
    return loadFormParts().then(function() {
      return document.createElement("family-dashboard-card-editor");
    });
  }
  setConfig(config) {
    this._cfg = normalize(config);
    this._config = config;
    this._stop();
    this._run();
  }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._run();
  }
  get hass() {
    return this._hass;
  }
  getCardSize() {
    return 12;
  }
  getGridOptions() {
    return { columns: "full", rows: 12 };
  }
  connectedCallback() {
    this._run();
  }
  disconnectedCallback() {
    this._stop();
  }
  _stop() {
    if (this._m) {
      this._m.stop();
      this._m = null;
    }
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
  }
  // Starts once the card is on the page, has a config, has hass (or is a demo) and has a size.
  _run() {
    if (this._m || !this._config || !this.isConnected) return;
    const cfg = this._cfg;
    if (!cfg.demo && !this._hass) return;
    addFont();
    const sr = this.shadowRoot;
    sr.innerHTML = "<style>" + STYLE + "</style>" + MARKUP;
    const wrap = sr.querySelector(".fd");
    wrap.style.height = cfg.height || "calc(100vh - var(--header-height, 56px))";
    const self = this;
    const bridge = {
      hass: function() {
        return self._hass;
      },
      navigate: function(path) {
        if (!self._hass) {
          console.warn("meadow: no Home Assistant here, would open " + path);
          return false;
        }
        if (location.pathname === path) return true;
        history.pushState(null, "", path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
        return true;
      }
    };
    const go = function() {
      if (self._m || !self.isConnected) return;
      self._m = engine(sr, wrap, cfg, cfg.query || "", bridge);
    };
    this._ro = new ResizeObserver(function() {
      if (!wrap.clientWidth || !wrap.clientHeight) return;
      if (self._m) self._m.resize();
      else go();
    });
    this._ro.observe(wrap);
  }
};
if (!customElements.get("family-dashboard-card")) customElements.define("family-dashboard-card", FamilyDashboardCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(function(c) {
  return c.type === "family-dashboard-card";
}))
  window.customCards.push({
    type: "family-dashboard-card",
    name: "Family Dashboard",
    description: "An animated village where each person in the household is a creature. Tap one for their week.",
    preview: false,
    documentationURL: "https://github.com/dervish666/family-dashboard"
  });
console.info("family-dashboard-card " + VERSION);
export {
  CREATURES,
  HELPERS as CREATURE_HELPERS,
  HOTSPOT_IDS,
  LOOKS,
  SCENES,
  SCENE_LIST,
  bakeRig,
  calendarPath,
  lessonsEnd,
  lessonsOver,
  lunchChoice,
  normalize,
  parseCalendarEvents,
  parseLunch,
  parseTimetable,
  stubConfig,
  weekRange
};
