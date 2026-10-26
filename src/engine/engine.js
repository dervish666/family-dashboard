import { weekRange, calendarPath, parseCalendarEvents } from "../calendar.js";
import { rgb, css, mix, shade, rand, pick, dist, pad2, ymd, canvas, rr, esc, clamp, spike, K, INK, rimmed, hat } from "./draw.js";
import { CREATURE, TIMERS as HABIT_TIMERS, creatureSprite, bakeRig } from "../creatures/index.js";
import { classicSprite } from "../creatures/classic.js";
import { SCENE_BY_ID, SCENE_LIST, HOTSPOT_IDS } from "../scenes/index.js";
import { parseTimetable, parseLunch, lunchChoice, lessonsOver, addDays, mondayOf } from "../school.js";
import { parseAnnouncement, parseDue, dueForHud, tileState } from "../extras.js";

// The whole meadow, one instance per card. ROOT is the shadow root, WRAP the .fd div,
// HA a small bridge to the card (hass, navigate), HOOKS the test hooks as a query string.
export function engine(ROOT, WRAP, CONFIG, HOOKS, HA) {
  "use strict";
  var PEOPLE = CONFIG.people, ANNIVERSARY = CONFIG.anniversary, SENSORS = CONFIG.sensors,
    SCHOOL_WHO = CONFIG.schoolWho, SOURCE_OWNER = CONFIG.sourceOwner, SCHOOL_LINE = CONFIG.schoolLine,
    RAIN_STATES = CONFIG.rainStates, DATES = CONFIG.dates, VIEW = CONFIG.view, OFFICE_URL = CONFIG.officeUrl;

  var Q = HOOKS ? "?" + String(HOOKS).replace(/^\?/, "") : "";
  var DEMO = CONFIG.demo === true || /[?&]demo\b/.test(Q);
  // Timers and the frame loop belong to this card: stop() clears them when it leaves the page.
  var TIMERS = [], STOPPED = false, STARTED = false, RAF = 0;
  function setInterval(f, ms) { var id = window.setInterval(f, ms); TIMERS.push(id); return id; }
  function requestAnimationFrame(f) { if (!STOPPED) RAF = window.requestAnimationFrame(f); return RAF; }
  var HOUR = (Q.match(/[?&]hour=([\d.]+)/) || [])[1];          // test hook: fake the clock
  var DATE = (Q.match(/[?&]date=(\d{4}-\d\d-\d\d)/) || [])[1];  // test hook: fake the day (countdowns, parties, school days); pair with hour=
  var OPEN = (Q.match(/[?&]open=([^&]+)/) || [])[1];           // test hook: open a card (url-encode a name with a space: Kid%202)
  if (OPEN) OPEN = decodeURIComponent(OPEN.replace(/\+/g, " "));
  var WFORCE = (Q.match(/[?&]weather=(\w+)/) || [])[1];        // test hook: sunny|partly|cloudy|rain|storm|fog|snow|windy
  var PFORCE = (Q.match(/[?&]party=([^&]+)/) || [])[1];         // test hook: a name from PEOPLE (any case), or halloween|bonfire|christmas|anniversary for the rave, friend or friend:Pat for the house party, comma-joined for both
  var PRFORCE = (Q.match(/[?&]printer=([\w:.]+)/) || [])[1];    // test hook: running:45 | pause:45 | prepare | finish | failed | idle | offline
  var LFORCE = (Q.match(/[?&]letter=([^&]+)/) || [])[1];        // test hook: Kid%203:hello (url-encoded), delivered a few seconds after boot
  var FPS = /[?&]fps\b/.test(Q);                               // test hook: frame rate and per-frame JS time, bottom right
  var MFORCE = (Q.match(/[?&]music=(\w+)/) || [])[1];          // test hook: on | off, overrides the speaker
  var OFORCE = (Q.match(/[?&]office=([^&]+)/) || [])[1];         // test hook: off (unreachable) | quiet | ask:Name | Name:what it is doing (url-encoded), overrides the office poll
  var WARM = +(Q.match(/[?&]warm=([\d.]+)/) || [])[1] || 0;      // test hook: run this many seconds of the sim before the first frame (headless screenshots see fades finished, guests arrived)

  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function now() {
    var d = new Date();
    if (DATE) d.setFullYear(+DATE.slice(0, 4), +DATE.slice(5, 7) - 1, +DATE.slice(8, 10));
    if (HOUR) { var h = parseFloat(HOUR); d.setHours(h | 0, Math.round((h % 1) * 60), 0, 0); }
    return d;
  }
  function dayLabel(ds) {
    var t = now(), today = ymd(t), tm = new Date(t.getTime() + 864e5);
    if (ds === today) return "Today";
    if (ds === ymd(tm)) return "Tomorrow";
    var d = new Date(ds + "T12:00:00"), days = (d - t) / 864e5;
    return DAYS[d.getDay()] + " " + d.getDate() + (days > 6 ? " " + MONTHS[d.getMonth()] : "");
  }

  function foodSprite(berry) {
    var s = 18 * K, c = canvas(s * 2, s * 2), g = c.getContext("2d"), x = s, y = s * 1.3;
    g.strokeStyle = "#3F8A4A"; g.lineWidth = 1.6 * K; g.lineCap = "round";
    g.beginPath(); g.moveTo(x, y + s * 0.5); g.quadraticCurveTo(x + 2 * K, y, x, y - s * 0.2); g.stroke();
    if (berry) {
      rimmed(g, "#2E6B38", "#6CC070", K, function (e) { g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.2, s * 0.32 + e, s * 0.18 + e, -0.5, 0, 7); g.fill(); });
      [[-0.05, -0.45], [0.28, -0.28], [0.1, -0.1]].forEach(function (p) {
        rimmed(g, "#A3263E", "#F0506E", K, function (e) { g.beginPath(); g.arc(x + s * p[0], y + s * p[1], s * 0.19 + e, 0, 7); g.fill(); });
        g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(x + s * p[0] - s * 0.06, y + s * p[1] - s * 0.06, s * 0.05, 0, 7); g.fill(); });
    } else {
      [-2.2, -0.95, 0.3].forEach(function (a) { var lx = x, ly = y - s * 0.25;
        rimmed(g, "#2E6B38", "#72C878", K, function (e) { g.beginPath();
          g.arc(lx + Math.cos(a) * s * 0.3, ly + Math.sin(a) * s * 0.3, s * 0.28 + e, 0, 7); g.fill(); }); });
    }
    return { c: c, ax: x, ay: y + s * 0.5, k: K };
  }

  function shadowSprite() {
    var c = canvas(64, 64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32), sh = SCENE.shadow || "30,70,40";
    gr.addColorStop(0, "rgba(" + sh + ",.32)"); gr.addColorStop(1, "rgba(" + sh + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  }
  function glowSprite() {
    var c = canvas(32, 32), g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 1, 16, 16, 16);
    gr.addColorStop(0, "rgba(255,250,190,1)"); gr.addColorStop(0.25, "rgba(230,255,140,.7)"); gr.addColorStop(1, "rgba(200,255,120,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c;
  }
  function cloudSprite(w) {
    var c = canvas(w, w * 0.5), g = c.getContext("2d");
    g.fillStyle = "rgba(255,255,255,.92)";
    [[0.3, 0.62, 0.2], [0.5, 0.45, 0.26], [0.7, 0.6, 0.2], [0.5, 0.68, 0.2]].forEach(function (p) {
      g.beginPath(); g.arc(w * p[0], w * 0.5 * p[1], w * p[2] * 0.5 + w * 0.02, 0, 7); g.fill(); });
    return c;
  }

  // ── The meadow itself, baked once per size ──────────────────────────────────
  var cv = ROOT.getElementById("world"), ctx = cv.getContext("2d");
  var W, H, DPR, HZ, TOP, BG, POND;
  var LAY = {}, ZONES = [];          // the scene's anchors, and the ellipses nothing wanders into
  // The scene: CONFIG.scene, from the registry. VIL: it has the village (walkers, school,
  // workshop, bandstand, cottage, postie). GRAZE: the meadow's puffs, foxes, berries, fireflies.
  var SCENE = SCENE_BY_ID[CONFIG.scene] || SCENE_LIST[0], VIL = !!SCENE.village, GRAZE = !!SCENE.grazers;
  // INDOOR: a scene under a roof (the space station). The engine's sky and weather layers
  // (clouds, rainbow, falling rain and snow, mist, lightning, blown leaves) stay off, and the
  // scene draws what each weather looks like from inside, from SV.WX, in its ambient.
  var INDOOR = !!SCENE.indoor;
  // PATCH: the family's areas, ROAM: everyone else's; HOME: the fallback spot; EXIT: where
  // someone off out leaves the scene ({ x, y, off }).
  var PATCH = [], ROAM = [], HOME = null, EXIT = null;
  // What a scene gets to work with. Sizes are refreshed before every bake; place() takes
  // the scene's layout; the rest is read-only state and a few helpers.
  var SV = {
    place: function (L) { LAY = L.lay || {}; DOORS = L.doors || {}; ZONES = L.zones || []; POND = L.water || null;
      PATCH = L.patch; ROAM = L.roam; HOME = L.home; EXIT = L.exit; SV.lay = LAY; SV.layout = L; },
    inZone: function (x, y, pad) { return inZone(x, y, pad); },
    blit: function (spr, x, y, face, sx, sy, sc, rot) { blit(spr, x, y, face, sx, sy, sc, rot); },
    puff: function (kind, x, y, n, col) { puff(kind, x, y, n, col); },
    say: function (txt, x, y) { say(txt, x, y); },
    depth: function (y) { return depth(y); },
    now: function () { return now(); }, rand: rand,
    printer: function () { return { state: printerState(), progress: PR.progress }; },
    sprites: {}, fam: [], WX: null, DARK: 0, nightness: 0, time: 0
  };

  // The scene (scenes/*.js) paints the background once per size and says where things
  // are; see SV below for what it gets to work with.
  function bakeBackground() {
    var c = canvas(W * DPR, H * DPR), g = c.getContext("2d");
    g.scale(DPR, DPR);
    SV.W = W; SV.H = H; SV.HZ = HZ; SV.TOP = TOP; SV.DPR = DPR;
    SCENE.bake(g, SV);
    BG = c;
  }
  function inZone(x, y, pad) {
    for (var i = 0; i < ZONES.length; i++) { var z = ZONES[i], dx = (x - z.x) / (z.rx + pad), dy = (y - z.y) / (z.ry + pad);
      if (dx * dx + dy * dy < 1) return z; }
    return null;
  }
  // inner: the family's areas (PATCH), else everyone's (ROAM). An area is a rect
  // { x0, x1, y0, y1 } or a shape with has(x, y) and pick(); w weights the pick.
  function inArea(a, x, y) { return a.has ? a.has(x, y) : x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1; }
  function inBounds(x, y, inner) {
    var A = inner ? PATCH : ROAM;
    for (var i = 0; i < A.length; i++) if (inArea(A[i], x, y)) return true;
    return false;
  }
  function pickArea(A) {
    if (A.length === 1) return A[0];
    var tot = 0, i; for (i = 0; i < A.length; i++) tot += A[i].w || 1;
    var r = Math.random() * tot; for (i = 0; i < A.length; i++) { r -= A[i].w || 1; if (r < 0) return A[i]; }
    return A[A.length - 1];
  }
  function spot(inner) {
    var A = inner ? PATCH : ROAM;
    for (var i = 0; i < 40; i++) {
      var a = pickArea(A), p = a.pick ? a.pick() : null;
      var x = p ? p.x : rand(a.x0, a.x1), y = p ? p.y : rand(a.y0, a.y1);
      if (!inZone(x, y, 30)) return { x: x, y: y };
    }
    return { x: HOME.x, y: HOME.y };
  }

  // How big something stands at y: [near-horizon scale, how much it grows to the bottom edge].
  var DEPTH = SCENE.depth || [0.8, 0.2];
  function depth(y) { return DEPTH[0] + DEPTH[1] * Math.max(0, Math.min(1, (y - TOP) / (H - TOP))); }

  // ── Creatures ───────────────────────────────────────────────────────────────
  var SHADOW, GLOW, CLOUDS = [], FOOD_SPR, PUFF_LOOKS = [];
  var things = [], food = [], parts = [], flies = [];
  var fam = [], BEE_HOST = null;                              // BEE_HOST: the family member with bee: true

  function makeSprites(o, fn) {
    fn = fn || creatureSprite;
    return { open: fn(o, "open"), shut: fn(o, "shut"), happy: fn(o, "happy") };
  }
  function spawn(kind, opts, x, y) {
    var p = x == null ? spot(kind === "fam") : { x: x, y: y };
    var t = { kind: kind, x: p.x, y: p.y, tx: p.x, ty: p.y, wait: rand(0, 3), face: Math.random() < 0.5 ? -1 : 1,
      phase: rand(0, 6), hunger: rand(0.1, 0.6), blink: rand(1, 5), blinkT: 0, happy: 0, munch: 0,
      age: 0, grow: 1, alert: rand(0.35, 1), cool: rand(10, 30), chase: null, chaseT: 0, full: 0, flee: 0, jump: 0,
      idle: true, gait: 0, slide: 0, scared: 0, ycool: 0, yielding: false, sq: 0, sqv: 0, wasMoving: false, dipT: -1, dy: 0, diving: 0, peck: 0, shiny: null };
    for (var k in opts) t[k] = opts[k];
    things.push(t); return t;
  }
  function setup() {
    SHADOW = shadowSprite(); GLOW = glowSprite();
    FOOD_SPR = [foodSprite(false), foodSprite(true)];
    CLOUDS = [200, 150, 230].map(function (w, i) { return { c: cloudSprite(w), x: rand(0, W), y: [16, 46, 26][i], v: rand(4, 9) }; });   // bottoms stay above the horizon, clear of the village roofs
    things = []; food = []; parts = [];
    var i;
    if (GRAZE) {
      PUFF_LOOKS = ["#FFF6D6", "#FFFFFF", "#FFE0D2", "#E8F4FF"].map(function (col) { return makeSprites({ r: 20, col: col, look: "puff", fluff: true }, classicSprite); });
      var FOX = makeSprites({ r: 25, col: "#F4A259", look: "fox" }, classicSprite);   // the wild fox, not the family look
      for (i = 0; i < 12; i++) spawn("puff", { r: 20, spr: pick(PUFF_LOOKS), speed: 34 });
      for (i = 0; i < 2; i++) spawn("nib", { r: 25, spr: FOX, speed: 30 });
    }
    fam = PEOPLE.map(function (p, i) {                         // where the scene starts them, or anywhere in their areas
      var at = SCENE.start ? SCENE.start(i, SV) : { x: null, y: null };
      return spawn("fam", { r: p.r, spr: makeSprites(p), rig: bakeRig(p), person: p, speed: p.look === "snail" ? 11 : 26, hunger: rand(0, 0.4) }, at.x, at.y);
    });
    SV.fam = fam;
    BEE_HOST = fam.filter(function (t) { return t.person.bee; })[0] || null;
    if (GRAZE) for (i = 0; i < 26; i++) addFood();
    ICON = makeIcons(); BUBS = makeBubbles();
    if (VIL) { MFRONT = marketFront(); SHOP = makeShop(); VILLAGE = makeVillage(); }
    else { VILLAGE = []; makeDrops(); }
    PLANE = planeSprite(); makeWeatherSprites();
    flies = []; if (GRAZE) for (i = 0; i < 16; i++) flies.push({ x: rand(0, W), y: rand(HZ, H), a: rand(0, 6), s: rand(0.4, 1) });
    if (SCENE.ambient) SCENE.ambient.setup(SV);
  }
  function addFood() { var p = spot(); food.push({ x: p.x, y: p.y, spr: FOOD_SPR[Math.random() < 0.3 ? 1 : 0], grow: 0 }); }

  function nearest(list, from, max, ok) {
    var best = null, bd = max;
    for (var i = 0; i < list.length; i++) { var o = list[i]; if (ok && !ok(o)) continue;
      var d = dist(o, from); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function puff(kind, x, y, n, col) {
    for (var i = 0; i < n; i++) parts.push({ kind: kind, x: x, y: y, vx: rand(-40, 40), vy: rand(-70, -20), life: 1, max: rand(0.6, 1.1), col: col });
  }
  function say(txt, x, y) { parts.push({ kind: "text", txt: txt, x: x, y: y, vx: 0, vy: -26, life: 1.3, max: 1.3 }); }

  var nightness = 0;

  // Movement. Position changes in exactly one place, steer(), and only by walking.
  // v1 had three things writing to y each frame (a family-spacing push, a patch clamp
  // and a zone push-out that teleported to the edge), and they fought: an arrived
  // creature got nudged past the arrival radius, flipped back to "walking" for a frame,
  // and its hop snapped from mid-air to the ground and back. That was the jerking.
  function go(t, x, y) { t.tx = x; t.ty = y; t.idle = false; }

  // One step toward (tx, ty). A step that would enter a zone slides along its edge
  // instead, so nothing ever bounces off a scene. Returns true on arrival, or when
  // boxed in, which hands the creature to the idle branch to plan somewhere else.
  // t.pass (a duty: school, the pitch, the bus stop) walks straight through zones;
  // when the duty ends the "walk straight out" branch below brings them back.
  function steer(t, speed, dt) {
    var dx = t.tx - t.x, dy = t.ty - t.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2) return true;
    var st = Math.min(d, speed * dt), ux = dx / d, uy = dy / d, pad = t.r * 0.6, mind = !t.pass;
    if (mind && inZone(t.tx, t.ty, pad)) return true;     // unreachable goal: hand back to the planner
    var inside = mind ? inZone(t.x, t.y, pad * 0.5) : null, nx, ny, z;
    if (inside) {                                         // spawned or knocked inside: walk straight out
      var ox = t.x - inside.x, oy = t.y - inside.y, ol = Math.sqrt(ox * ox + oy * oy) || 1;
      nx = t.x + ox / ol * st; ny = t.y + oy / ol * st;
    } else {
      nx = t.x + ux * st; ny = t.y + uy * st; z = mind ? inZone(nx, ny, pad) : null;
      if (z) {
        var ax = z.rx + pad, ay = z.ry + pad, gx = (nx - z.x) / (ax * ax), gy = (ny - z.y) / (ay * ay), gl = Math.sqrt(gx * gx + gy * gy) || 1;
        var sx = -gy / gl, sy = gx / gl;
        // Pick a way round once and keep it. Re-picking each frame flips sign when the
        // goal sits straight behind the obstacle, and the creature shimmies in place.
        if (!t.slide) t.sdir = sx * ux + sy * uy < 0 ? -1 : 1;
        sx *= t.sdir; sy *= t.sdir;
        nx = t.x + sx * st; ny = t.y + sy * st;
        t.slide = (t.slide || 0) + dt;
        if (inZone(nx, ny, pad) || t.slide > 4) { t.slide = 0; return true; }
      } else t.slide = 0;
    }
    t.x = nx; t.y = ny;
    if (Math.abs(ux) > 0.15) t.face = ux > 0 ? 1 : -1;
    t.phase += st / (t.r * 0.9);
    return false;
  }
  function wanderSpot(t) {
    var x = t.x + rand(-360, 360), y = t.y + rand(-220, 220);
    return inBounds(x, y, false) && !inZone(x, y, 30) ? { x: x, y: y } : spot(false);
  }
  // Family spacing lives here, in where they choose to go, not in pushing bodies around.
  // Best of a batch: the candidate furthest from everyone else's position and goal.
  // (A pass/fail test with a random fallback put them on top of each other whenever
  // the patch was busy, which with six of them is most of the time.)
  function famSpot(t) {
    // A duty first: school, a club, or out through the bus stop. See dutyFor.
    var duty = t.duty = dutyFor(t);
    if (duty) {
      t.pass = true;
      if (VIL && duty.where !== "away") return dutySpot(t, duty);          // without the village every duty is out
      var bus = { x: EXIT.x, y: EXIT.y };
      if (t.gone) return { x: t.x, y: t.y };                                  // out, and staying out until it is over
      if (Math.abs(t.x - bus.x) < 30 && Math.abs(t.y - bus.y) < 20) { t.gone = true; return { x: EXIT.off.x, y: EXIT.off.y }; }
      return (SCENE.via && SCENE.via(t, bus, SV)) || bus;                     // first the road, then the stop
    }
    if (t.gone) { t.gone = false; t.pass = true; return { x: EXIT.x, y: EXIT.y }; }   // back off the bus
    t.pass = false;
    // The swimmers head for the pond bank now and then; more often if the other one is already in.
    var look = t.person.look;
    if ((look === "shark" || look === "otter") && SCENE.swimSpot) {
      var mate = fam.filter(function (o) { return o !== t && o.dipT >= 0; })[0];
      if (Math.random() < (mate ? 0.6 : 0.3)) {
        var ps = SCENE.swimSpot(SV), clear = !inZone(ps.x, ps.y, 30);
        for (var q = 0; clear && q < fam.length; q++) if (fam[q] !== t && fam[q].dipT < 0 && Math.hypot(fam[q].x - ps.x, fam[q].y - ps.y) < 110) clear = false;
        if (clear) return ps;
      }
    }
    var best = null, bs = -1;
    for (var n = 0; n < 24; n++) {
      var c = spot(true), score = 1e9;
      for (var j = 0; j < fam.length; j++) { var o = fam[j]; if (o === t) continue;
        score = Math.min(score, Math.hypot(o.x - c.x, (o.y - c.y) * 1.6), Math.hypot(o.tx - c.x, (o.ty - c.y) * 1.6)); }
      if (score > bs) { bs = score; best = c; }
    }
    // A scene with ways between its areas (the seaside's pier) routes through them:
    // via() answers the next waypoint, or nothing when the way is straight.
    if (SCENE.via) { var w = SCENE.via(t, best, SV); if (w) { t.dest = best; return w; } }
    return best;
  }
  // On the way somewhere through a waypoint: the next one, or the place itself.
  function famOnward(t) {
    var d = t.dest, w = SCENE.via(t, d, SV);
    if (!w) t.dest = null;
    return w || d;
  }

  // ── The day ─────────────────────────────────────────────────────────────────
  // Where someone should be right now, from the data and nothing else. A duty is
  // { where: school | pond | pitch | band | away, what }. School hours on a school
  // day send the three kids to the school; a timed calendar event sends its owner to
  // the matching scene, or out along the road to the bus stop when it is somewhere
  // else (work, the dentist, a shift). Twenty minutes to get there, an hour there,
  // since the calendar sensor carries no end time. All-day events move nobody: they
  // are mostly notes ("Bin day"). No data, or data that cannot say, is no duty: they
  // stay in the meadow rather than act out a guess.
  var SCHOOL_OUT = false;                       // the village school's break, set by its scene
  function weekday(d) { return d.getDay() >= 1 && d.getDay() <= 5; }
  // true = school day, false = no school, null = cannot tell.
  function schoolDay(name, d) {
    if (!weekday(d)) return false;
    var td = ymd(d);
    // The child's own timetable and lunch sensors answer first (people[].timetable, .lunch).
    var tt = ttFor(name, d);
    if (tt && tt.status === "ok") return true;
    if (tt && (tt.status === "closed" || tt.status === "weekend")) return false;
    var ln = lunchFor(name, d);
    if (ln && ln.status === "served") return true;
    if (ln && ln.status === "closed") return false;
    // Otherwise the term dates in SENSORS.extra.
    var sc = ((DATA.extra || {}).schools || []).filter(function (s) { return s.who === name; })[0];
    if (!sc || !sc.terms) return null;
    if ((sc.days || []).some(function (x) { return x.date === td; })) return false;
    // In term needs a known end still ahead; out of term needs a known gap either
    // side. Some schools publish half their dates, and an open-ended term is an
    // unknown, not a yes: Christmas must not show anyone at school.
    var prevEnd = null, nextStart = null, inTerm = false, open = false;
    sc.terms.forEach(function (t) {
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
    if (/book club/i.test(what)) return "away";                      // at someone's house, not the bandstand
    for (var i = 0; i < PLACE.length; i++) if (PLACE[i][0].test(what)) return PLACE[i][1];
    return "away";
  }
  function dutyFor(t) {
    var name = t.person.name, d = now(), m = d.getHours() * 60 + d.getMinutes(), td = ymd(d);
    if (KIDS.indexOf(name) >= 0 && m >= 8 * 60 + 35 && m < 15 * 60 + 15 && schoolDay(name, d) === true) return { where: "school", what: "School" };
    for (var i = 0; i < DATA.events.length; i++) { var e = DATA.events[i];
      if (e.who !== name || e.day !== td || e.all_day || !e.start) continue;
      var s = new Date(e.start), em = s.getHours() * 60 + s.getMinutes();
      if (!isNaN(em) && m >= em - 20 && m < em + 60) return { where: placeFor(e.what), what: e.what };
    }
    return null;
  }
  // A standing spot for a duty. slot spreads people sharing a scene apart: the
  // school's are fixed per kid (SCHOOL_LINE), the rest by who is there.
  function dutySpot(t, duty) {
    var L = LAY, slot = fam.filter(function (o) { return o.duty && o.duty.where === duty.where; }).indexOf(t);
    if (slot < 0) slot = 0;
    switch (duty.where) {
      // A staggered line down the school front: 80 apart across and 50 down, which
      // is what it takes for three bodies and three name tags to never overlap at
      // 1280x800 (a row along the door stacked them). In the example household the
      // deer's tag rides highest (tg 2.75) and the shark's lowest (1.6), so that order opens the
      // gaps rather than closing them. Break shuffles it out into the yard a little.
      case "school": var s = L.school, k = Math.max(0, SCHOOL_LINE.indexOf(t.person.name)), o = SCHOOL_OUT ? 22 : 0;
        return { x: s.x - 36 + k * 80 + o, y: s.y + 14 + k * 50 + o * 0.4 };
      case "pond": return { x: W * 0.74 + slot * 60, y: H - 172 };                            // the bank; the swimmers dive from here
      case "pitch": return { x: L.pitch.x - 90 + slot * 60, y: L.pitch.y - 40 };              // the touchline, behind the players
      case "band": return { x: L.band.x + 96 + slot * 40, y: L.band.y - 14 - slot * 26 };     // beside the bandstand, inside the dance radius
    }
    return { x: t.x, y: t.y };
  }
  // Off the edge the scene's exit leads to: the right for the meadow, the left for a scene
  // whose exit.off is left of the card.
  function offStage(t) { return EXIT && EXIT.off.x < 0 ? t.x < -20 : t.x > W + 20; }

  // Eyes: blink at random, wide on a jump or a fright, glance at whoever is near,
  // down while grazing or chewing, shut at night.
  function eyeState(t) {
    if (nightness > 0.6) return "shut";
    if (t.startle > 0 || t.jump > 0.2) return "wide";
    if (t.happy > 0 || t.munch > 0 || t.wave > 0 || t.dancing) return "happy";
    if (t.blinkT > 0) return "shut";
    return "open";
  }
  // How each piece moves this frame comes from the creature's anim(): [rotation, dx, dy]
  // (dx, dy in body radii). M is what every piece's motion is made of.
  function drawRig(t, time) {
    var R = t.rig, C = CREATURE[t.person.look], D = C.rig, rk = t.r * K, eye = eyeState(t);
    var g = t.gait, ph = t.phase, M = { g: g, ph: ph, air: Math.abs(Math.sin(ph)) * g, idle: 1 - g, time: time, spike: spike,
      wave: t.wave > 0 ? Math.min(1, t.wave / 0.3, (1.8 - t.wave) / 0.3 + 0.2) : 0,
      stepL: -Math.max(0, Math.sin(ph)) * 0.14 * g, stepR: -Math.max(0, -Math.sin(ph)) * 0.14 * g, stiff: t.pronk > 0 ? 1 : 0,
      sleep: nightness > 0.6 ? 1 : 0 };                   // asleep: the same line the eyes shut on
    for (var i = 0; i < D.order.length; i++) {
      var p = D.order[i];
      if (p === "paw" && !(t.wave > 0)) continue;
      if (p === "mouth" && (t.diving > 0.4 || t.startle > 0)) p = "mouthOpen";
      var part = p === D.eyesIn ? R.eyes[eye] : R.parts[p]; if (!part) continue;
      var a = (C.anim && C.anim(t, p, time, M)) || STILL, pv = D.piv[p] || [0, 0], px = pv[0] * rk, py = pv[1] * rk;
      var ex = 0, ey = 0;
      if (p === D.eyesIn && D.eyesIn === "eyes" && t.person.look !== "shark") {
        ex = (t.glance || 0) * 0.05 * rk; ey = ((t.graze > 0 || t.munch > 0) ? 0.05 : t.jump > 0 ? -0.04 : 0) * rk; }
      ctx.save();
      ctx.translate(px + a[1] * rk + ex, py + a[2] * rk + ey);
      if (a[0]) ctx.rotate(a[0]);
      ctx.drawImage(part.c, part.ox - R.ax - px, part.oy - R.ay - py);
      ctx.restore();
    }
  }
  var STILL = [0, 0, 0];

  // Habits and reactions: timers only. Nothing here moves a creature.
  function famLife(t, dt, asleep, nibs) {
    HABIT_TIMERS.forEach(function (k2) { if (t[k2] > 0) t[k2] -= dt; });
    if (asleep) { t.wave = t.pronk = t.graze = t.startle = 0; return; }
    var C = CREATURE[t.person.look], still = t.idle && t !== openThing && t.dipT < 0;
    if (C && C.life) C.life(t, dt, still, LIFE);
    // glance at the nearest family member, and turn to someone walking past
    var near = null, nd = 170;
    for (var j = 0; j < fam.length; j++) { var o = fam[j]; if (o === t) continue; var d = Math.abs(o.x - t.x) + Math.abs(o.y - t.y); if (d < nd) { nd = d; near = o; } }
    var want = near ? ((near.x > t.x ? 1 : -1) * t.face) : 0;
    t.glance = (t.glance || 0) + (want - (t.glance || 0)) * Math.min(1, dt * 6);
    if (near && still && near.moving && nd < 120 && !(t.gcool > 0) && !t.shiny) { t.face = near.x > t.x ? 1 : -1; t.gcool = 4; }
    // a fox running close: jump, wide eyes, "!"
    if (!(t.scool > 0)) for (j = 0; j < nibs.length; j++) { var n = nibs[j];
      if ((n.chase || n.scared > 0) && n.moving && Math.abs(n.x - t.x) + Math.abs(n.y - t.y) < 110) {
        t.jump = 0.6; t.startle = 1.2; t.scool = 6; say("!", t.x, t.y - t.r * 2.6); break; } }
  }
  // Called by the village when a passer-by greets a family member.
  function famWave(t) { if (t.wcool > 0 || nightness > 0.6) return false; t.wave = 1.8; t.wcool = 10; t.happy = 1.8; return true; }

  // Per-animal habits (the crow's shiny, the swimmers' dive), from the creature module.
  // Pure animation: position still only changes in steer().
  var LIFE = { rand: rand, puff: function (k, x, y, n, c) { puff(k, x, y, n, c); }, water: null };
  function animalHabits(t, dt) {
    var C = CREATURE[t.person.look];
    t.peck = Math.max(0, (t.peck || 0) - dt);
    LIFE.water = POND;
    if (C && C.habits) C.habits(t, dt, LIFE);
  }

  function update(dt) {
    var i, j, t, asleep = nightness > 0.6;
    for (i = 0; i < VILLAGE.length; i++) VILLAGE[i].update(dt, asleep);
    if (!VIL) { updateWeather(dt); airmail(dt); }                    // the village runs these itself
    if (SCENE.ambient) { SV.WX = WX; SV.DARK = DARK; SV.nightness = nightness; SV.music = MUSIC_T; SV.party = PARTY_T; SCENE.ambient.update(dt, SV); }
    updateParty(dt);
    updatePlane(dt);
    updateRobot(dt);
    if (GRAZE && Math.random() < dt * 1.1 && food.length < 34) addFood();
    for (i = 0; i < food.length; i++) food[i].grow = Math.min(1, food[i].grow + dt * 2.5);

    var puffs = things.filter(function (o) { return o.kind === "puff"; });
    var nibs = things.filter(function (o) { return o.kind === "nib"; });
    // Keep the meadow alive: a lull in grazers brings a newcomer in from the edge,
    // so two hungry foxes can never empty the screen.
    if (GRAZE && puffs.length < 6 && Math.random() < dt / 6) {
      var side = Math.random() < 0.5 ? -20 : W + 20, n = spawn("puff", { r: 20, spr: pick(PUFF_LOOKS), speed: 34 }, side, rand(LAY.R + 30, H - 60));
      go(n, side < 0 ? 120 : W - 120, n.y);
    }

    for (i = 0; i < things.length; i++) {
      t = things[i]; t.age += dt;
      t.blink -= dt; if (t.blink < 0) { t.blinkT = 0.14; t.blink = rand(2, 6); } t.blinkT -= dt;
      t.happy -= dt; t.munch -= dt; t.jump = Math.max(0, t.jump - dt);
      t.gait += ((t.moving ? 1 : 0) - t.gait) * Math.min(1, dt * 10);
      if (t.kind === "fam") {
        // Jelly: a damped spring on squash, kicked when they stop and when they look round.
        if (t.wasMoving && !t.moving) t.sqv -= 1.5;
        t.wasMoving = t.moving;
        t.sqv += (-180 * t.sq - 9 * t.sqv) * dt; t.sq += t.sqv * dt;
        if (t.idle && !asleep && t !== openThing && t.dipT < 0 && !t.shiny && Math.random() < dt * 0.15) { t.face = -t.face; t.sqv -= 0.6; }
      }
      if (t.grow < 1) t.grow = Math.min(1, t.grow + dt / 40);
      if (asleep) { if (t.kind === "fam") famLife(t, dt, true, nibs); t.shiny = null; t.peck = 0; if (t.dipT >= 0) { t.dipT = -1; t.dy = 0; t.diving = 0; }
        t.moving = false; if (Math.random() < dt * 0.35) parts.push({ kind: "z", x: t.x + t.r * 0.6, y: t.y - t.r * 1.8, vx: 8, vy: -14, life: 2.2, max: 2.2 }); continue; }
      if (t === openThing) { t.moving = false; continue; }
      var speed = t.speed * (t.grow < 1 ? 0.8 : 1);
      t.hunger = Math.min(1, t.hunger + dt * (t.kind === "nib" ? 0.013 : t.kind === "puff" ? 0.02 : 0.008));

      if (t.kind === "puff") {
        t.cool -= dt; t.flee -= dt;
        var threat = nearest(nibs, t, 115 * t.alert, function (n) { return (n.chase === t || n.full <= 0) && !(n.scared > 0); });
        if (threat && !safe(t) && t.flee <= 0) { var a = Math.atan2(t.y - threat.y, t.x - threat.x);
          var fx = Math.max(30, Math.min(W - 30, t.x + Math.cos(a) * 140)), fy = Math.max(LAY.R + 20, Math.min(H - 24, t.y + Math.sin(a) * 140));
          if (inZone(fx, fy, 30)) { var sp = spot(false); fx = sp.x; fy = sp.y; }
          go(t, fx, fy); t.flee = 1.5; t.wait = 0; }
        if (t.flee > 0) speed = 64;
        else if (t.munch <= 0 && t.hunger > 0.45 && t.idle && t.wait <= 0) { var f = nearest(food, t, 400); if (f) { go(t, f.x, f.y); t.target = f; } }
        if (t.hunger < 0.25 && t.cool <= 0 && t.grow >= 1 && puffs.length < 16 && Math.random() < dt * 0.08) {
          var baby = spawn("puff", { r: 20, spr: t.spr, speed: 34, grow: 0.55, hunger: 0.3 }, t.x + rand(-20, 20), t.y + rand(6, 16));
          t.cool = rand(35, 60); puff("heart", t.x, t.y - t.r * 2, 2, "#FF7FA0"); baby.happy = 1.5;
        }
      } else if (t.kind === "nib") {
        t.full -= dt;
        if (t.scared > 0) {                                 // shooed: bolt for the nearest edge
          t.scared -= dt; t.chase = null; speed = 95; go(t, t.fleeX, t.y);
          if (t.scared <= 0) { var back = spot(false); go(t, back.x, back.y); t.hunger = 0.2; }
        } else if (t.full > 0) speed = 16;
        else if (t.hunger > 0.55) {
          if (!t.chase || things.indexOf(t.chase) < 0 || safe(t.chase) || t.chaseT > 8) {
            if (t.chaseT > 8) { t.hunger = 0.3; t.chaseT = 0; }                      // gave up, sulks off
            t.chase = t.chaseT === 0 ? nearest(puffs, t, 320, function (p) { return !safe(p); }) : null; t.chaseT = 0;
          }
          if (t.chase) { t.chaseT += dt; go(t, t.chase.x, t.chase.y); t.wait = 0; speed = 58;
            if (dist(t, t.chase) < (t.r + t.chase.r) * 0.75) eat(t, t.chase); }
        }
      } else if (t.kind === "fam") {
        if (t.munch <= 0 && t.hunger > 0.7 && t.idle && t.wait <= 0 && !t.target && !t.duty) {
          var ff = nearest(food, t, 300, function (f) { if (!inBounds(f.x, f.y, true)) return false;
            for (var q = 0; q < fam.length; q++) if (fam[q] !== t && Math.hypot(fam[q].x - f.x, (fam[q].y - f.y) * 1.6) < 130) return false;
            return true; });
          if (ff) { go(t, ff.x, ff.y); t.target = ff; } }
        // someone wandered up close: finish waiting and go somewhere with more room
        t.ycool -= dt;
        animalHabits(t, dt);
        famLife(t, dt, asleep, nibs);
        // (Neither rule while on a duty: three kids lined up at the school door are
        // meant to be close, and would otherwise re-plan every frame.)
        if (t.idle && t.wait > 0 && !t.yielding && !t.duty) for (j = 0; j < fam.length; j++) if (fam[j] !== t && Math.hypot(fam[j].x - t.x, (fam[j].y - t.y) * 1.6) < 120) t.wait = 0;
        // Walking into someone: stop for a beat and re-plan. A state change, not a push,
        // and a cooldown after, or two of them yield to each other in a loop.
        if (!t.idle && !t.target && t.ycool <= 0 && !t.duty) for (j = 0; j < fam.length; j++) { var o = fam[j]; if (o === t) continue;
          var ox = o.x - t.x, oy = o.y - t.y;
          if (Math.hypot(ox, oy * 1.6) < 95 && ox * (t.tx - t.x) + oy * (t.ty - t.y) > 0) { t.idle = true; t.wait = rand(0.4, 0.8); t.yielding = true; t.ycool = 3; break; } }
      }

      // grazing
      if (t.target && t.kind !== "nib") {
        if (food.indexOf(t.target) < 0) t.target = null;
        else if (dist(t, t.target) < t.r * 0.9) { food.splice(food.indexOf(t.target), 1); t.target = null;
          t.hunger = Math.max(0, t.hunger - 0.5); t.munch = 1.1; t.wait = 1.4; t.idle = true;
          puff("crumb", t.x + t.face * t.r * 0.5, t.y - t.r * 0.6, 4, "#6CC070"); }
      }

      // walking: idle and walking are states, and only the timer or a new goal changes them
      if (t.idle || t.munch > 0) {
        t.moving = false; t.wait -= dt;
        if (t.wait <= 0 && t.munch <= 0) {
          var s = t.kind !== "fam" ? wanderSpot(t) : t.dest && !dutyFor(t) ? famOnward(t) : (t.dest = null, famSpot(t));
          go(t, s.x, s.y); t.target = null; t.yielding = false;
          t.wait = t.dest ? 0.05 : rand(1, t.kind === "fam" ? 5 : 3.5) * (MUSIC_T > 0.5 ? 2.5 : 1);   // with music on they stop to dance for longer
        }
      } else {
        t.moving = true;
        if (steer(t, speed, dt)) { t.idle = true; t.moving = false; }
      }
      t.x = Math.max(-60, Math.min(W + 60, t.x));
    }

    for (i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind !== "text" && p.kind !== "z" && p.kind !== "smoke" && p.kind !== "note" && p.kind !== "leaf" && p.kind !== "hat") p.vy += 120 * dt;
      if (p.kind === "leaf" || p.kind === "hat") { p.ph += dt * 6; p.vy += Math.sin(p.ph) * 40 * dt; } }
    for (i = 0; i < CLOUDS.length; i++) { var c = CLOUDS[i]; c.x += c.v * dt; if (c.x > W + 20) c.x = -c.c.width; }
    for (i = 0; i < flies.length; i++) { var fl = flies[i]; fl.a += dt * fl.s; fl.x += Math.cos(fl.a * 0.7) * 14 * dt; fl.y += Math.sin(fl.a) * 9 * dt;
      if (fl.x < 0) fl.x = W; if (fl.x > W) fl.x = 0; }
  }
  // A grazer next to one of the family is off the menu. Kids will test this.
  function safe(p) { for (var i = 0; i < fam.length; i++) if (dist(p, fam[i]) < 80) return true; return false; }
  function eat(n, p) {
    things.splice(things.indexOf(p), 1);
    puff("poof", p.x, p.y - p.r, 7, "#FFFFFF"); say("nom!", n.x, n.y - n.r * 2.4);
    n.chase = null; n.chaseT = 0; n.hunger = 0; n.full = rand(25, 40); n.happy = 2.5; n.munch = 1.2; n.wait = 2; n.idle = true;
  }

  // ── The village ─────────────────────────────────────────────────────────────
  // Villagers live in scenes and on the road between them. Things move between scenes:
  // the miller's flour goes to the bakery, the baker's loaves to the market, the
  // woodcutter's logs to the bakery oven, letters to every door. Passers-by greet each
  // other, queue at the well, the stall and the bus stop, and the pub lets them out
  // wobbly. Villagers are never tapped and never eaten. Each scene is
  // { layer: "back" | "front" | null, update(dt, asleep), draw(time, asleep), light?(a) }.
  var VILLAGE = [], WALKERS = [], QS = {}, DOORS = {}, ICON, BUBS, MFRONT, SHOP, VSPR = {}, clockT = 0, DANCE = null, POSTIE = { busy: false };
  var VCOLS = ["#F6C28B", "#F3DE7C", "#BCD98A", "#EDB3A8", "#D9C6A5", "#F29E8E", "#F7CFD8", "#E4B363", "#C9DDB0", "#E8C3A0"];
  var HATS = ["none", "none", "none", "beanie", "beanie2", "straw", "cap"];
  var UMBS = ["#E86A5B", "#3B5FA8", "#F3C24B", "#4E9A5A", "#E68AB0"];
  var WX = { rain: 0, bow: 0, st: "dry", t: /[?&]rain\b/.test(Q) ? 4 : rand(600, 1500), drops: [], flakes: [],
    cloud: 0.1, storm: 0, fog: 0, snow: 0, wind: 0.1, windT: 0.1, live: false, temp: null };
  var TRADE = { flour: 1, wood: 3, bread: 1 }, PUBN = 2, SHOO_COOL = 8;

  function blit(spr, x, y, face, sx, sy, sc, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.scale((face || 1) * (sx || 1) * (sc || 1) / spr.k, (sy || 1) * (sc || 1) / spr.k);
    ctx.drawImage(spr.c, -spr.ax, -spr.ay); ctx.restore();
  }
  function mkV(col, hat, x, y, r) {
    r = r || 19; var key = col + hat + r;
    var spr = VSPR[key] || (VSPR[key] = makeSprites({ r: r, col: col, look: "villager", hat: hat === "none" ? null : hat }, classicSprite));
    return { spr: spr, r: r, x: x, y: y, face: 1, phase: 0, moving: false, gait: 0, happy: 0, blink: rand(1, 5), blinkT: 0, _seed: rand(0, 6) };
  }
  // moving = "stepped this frame", reset here each frame; going = "on the way somewhere",
  // which persists. Call before any walkV in the same frame.
  function tickV(v, dt) { v.gait = (v.gait || 0) + ((v.moving ? 1 : 0) - (v.gait || 0)) * Math.min(1, dt * 10); v.moving = false; v.happy -= dt; v.blink -= dt; if (v.blink < 0) { v.blinkT = 0.14; v.blink = rand(2, 6); } v.blinkT -= dt; }
  function walkV(v, tx, ty, speed, dt) {
    // Stop inside 2px, but only set off again past 6px: with one threshold, a villager
    // chasing a moving ball or pinned at the yard fence flipped between walking and
    // stopped every frame. The arrival frame still counts as a step, so passing a
    // waypoint on the way to the next one is not a one-frame stop.
    var dx = tx - v.x, dy = ty - v.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < (v.going ? 2 : 6)) { if (v.going && d > 0.01) { v.x = tx; v.y = ty; v.moving = true; } v.going = false; return true; }
    var st = Math.min(d, speed * dt); v.x += dx / d * st; v.y += dy / d * st; v.moving = true; v.going = true;
    if (Math.abs(dx) > 1) v.face = dx > 0 ? 1 : -1;
    v.phase += st / (v.r * 0.9); return false;
  }
  function hopV(v) { return Math.abs(Math.sin(v.phase)) * v.r * 0.45 * depth(v.y) * (v.gait || 0); }
  function drawV(v, asleep, air, rot, hop) {                      // hop: extra lift, the rave's bounce
    var sc = depth(v.y), sw = v.r * 2.4 * sc, hv = hopV(v) + (hop || 0);
    if (!air) ctx.drawImage(SHADOW, v.x - sw / 2, v.y - sw * 0.14, sw, sw * 0.28);
    var spr = asleep ? v.spr.shut : v.happy > 0 ? v.spr.happy : v.blinkT > 0 ? v.spr.shut : v.spr.open;
    var g = v.gait || 0, sy = 1 - 0.1 * Math.pow(1 - Math.abs(Math.sin(v.phase)), 3) * g + 0.03 * Math.sin(clockT * 2.4 + v._seed) * (1 - g);
    blit(spr, v.x, v.y - hv, v.face, 1 / sy, sy, sc, rot);
    if (v.umb) { var top = v.y - hv - v.r * 2.35 * sc, ux = v.x + v.face * 3;
      ctx.strokeStyle = "#5A4A3A"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ux, top); ctx.lineTo(ux, top + v.r * 1.2 * sc); ctx.stroke();
      ctx.fillStyle = v.umb; ctx.beginPath(); ctx.arc(ux, top + 2, v.r * 1.05 * sc, Math.PI, 0); ctx.closePath(); ctx.fill(); }
  }
  function carry(ic, v) { blit(ic, v.x, v.y - hopV(v) - v.r * 2.05 * depth(v.y), 1, 1, 1, 1); }

  // ── Props, baked once. Anchor is the bottom centre. ──
  function icon(w, h, draw) { var c = canvas(w * K, h * K), g = c.getContext("2d"); g.scale(K, K); draw(g); return { c: c, ax: w * K / 2, ay: h * K, k: K }; }
  function makeIcons() {
    return {
      apple: icon(14, 15, function (g) { g.fillStyle = "#E0474C"; g.beginPath(); g.arc(7, 9, 5.5, 0, 7); g.fill();
        g.fillStyle = "#6CC070"; g.beginPath(); g.ellipse(9.5, 3, 3, 1.6, -0.4, 0, 7); g.fill();
        g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(5, 7, 1.5, 0, 7); g.fill(); }),
      loaf: icon(22, 12, function (g) { rimmed(g, "#9E6630", "#D89A55", 1, function (e) { g.beginPath(); g.ellipse(11, 7, 9.5 + e, 4.8 + e, 0, 0, 7); g.fill(); });
        g.strokeStyle = "rgba(255,240,210,.85)"; g.lineWidth = 1.4; g.lineCap = "round";
        [6, 11, 16].forEach(function (x) { g.beginPath(); g.moveTo(x - 1.5, 5); g.lineTo(x + 1.5, 8); g.stroke(); }); }),
      log: icon(28, 12, function (g) { g.fillStyle = "#9C6B43"; rr(g, 1, 1, 25, 10, 5); g.fill();
        g.fillStyle = "#E2C08E"; g.beginPath(); g.ellipse(23, 6, 4, 5, 0, 0, 7); g.fill(); }),
      carrot: icon(12, 20, function (g) { g.strokeStyle = "#4E9A5A"; g.lineWidth = 1.6; g.lineCap = "round";
        g.beginPath(); g.moveTo(6, 6); g.lineTo(3, 1); g.moveTo(6, 6); g.lineTo(6, 0.5); g.moveTo(6, 6); g.lineTo(9, 1); g.stroke();
        g.fillStyle = "#F28C38"; g.beginPath(); g.moveTo(2.5, 6); g.lineTo(9.5, 6); g.lineTo(6, 19); g.closePath(); g.fill(); }),
      fish: icon(24, 12, function (g) { g.fillStyle = "#F59E5B"; g.beginPath(); g.ellipse(9, 6, 8, 4.5, 0, 0, 7); g.fill();
        g.beginPath(); g.moveTo(15, 6); g.lineTo(23, 1); g.lineTo(23, 11); g.closePath(); g.fill();
        g.fillStyle = INK; g.beginPath(); g.arc(4.5, 5, 1.2, 0, 7); g.fill(); }),
      boot: icon(18, 16, function (g) { g.fillStyle = "#6B5A4E"; rr(g, 3, 0.5, 8, 11, 2); g.fill(); rr(g, 3, 8.5, 14, 7, 3); g.fill();
        g.fillStyle = "#8C7A6C"; g.fillRect(3, 2, 8, 2); }),
      sack: icon(16, 18, function (g) { rimmed(g, "#B8A27E", "#F2E8D8", 1, function (e) { g.beginPath(); g.moveTo(3 - e, 5); g.quadraticCurveTo(-1 - e, 17 + e, 8, 17.5 + e);
        g.quadraticCurveTo(17 + e, 17 + e, 13 + e, 5); g.closePath(); g.fill(); });
        g.fillStyle = "#B8A27E"; g.fillRect(5, 3, 6, 3); g.fillStyle = "#E0C98F"; g.beginPath(); g.arc(8, 12, 2.5, 0, 7); g.fill(); }),
      letter: icon(16, 11, function (g) { g.fillStyle = "#FFFFFF"; g.strokeStyle = "#B9B4AA"; g.lineWidth = 1; g.fillRect(1, 1, 14, 9.5); g.strokeRect(1, 1, 14, 9.5);
        g.beginPath(); g.moveTo(1, 1); g.lineTo(8, 6.5); g.lineTo(15, 1); g.stroke(); g.fillStyle = "#E86A5B"; g.fillRect(11, 2.5, 2.5, 2.5); }),
      gift: icon(16, 17, function (g) { g.fillStyle = "#E86A5B"; g.fillRect(2, 7, 12, 10); g.fillStyle = "#C94F44"; g.fillRect(1, 5, 14, 4);       // a present for the house party
        g.fillStyle = "#F3DE7C"; g.fillRect(7, 5, 2.5, 12); g.beginPath(); g.arc(5.5, 3.5, 2.2, 0, 7); g.arc(10.5, 3.5, 2.2, 0, 7); g.fill(); }),
      bucket: icon(14, 14, function (g) { g.fillStyle = "#8FA6B8"; g.beginPath(); g.moveTo(1, 3); g.lineTo(13, 3); g.lineTo(11, 13); g.lineTo(3, 13); g.closePath(); g.fill();
        g.fillStyle = "#6FB6E8"; g.beginPath(); g.ellipse(7, 3.5, 6, 1.8, 0, 0, 7); g.fill(); }),
      cat: icon(26, 26, function (g) { rimmed(g, "#5F6270", "#8C8F9E", 1.2, function (e) {
          g.beginPath(); g.ellipse(13, 18, 8 + e, 7.5 + e, 0, 0, 7); g.fill(); g.beginPath(); g.arc(13, 9, 6 + e, 0, 7); g.fill();
          [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(13 + s * 2, 4.5); g.lineTo(13 + s * 6.5 + s * e, 0.5 - e); g.lineTo(13 + s * 6.5, 7); g.closePath(); g.fill(); }); });
        g.fillStyle = "#F4B5C0"; g.beginPath(); g.arc(13, 11, 1, 0, 7); g.fill();
        g.strokeStyle = INK; g.lineWidth = 1.1; g.lineCap = "round";
        [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(13 + s * 1.3, 8.6); g.quadraticCurveTo(13 + s * 2.6, 7.4, 13 + s * 3.9, 8.6); g.stroke(); });
        g.fillStyle = "#B8BBC8"; g.beginPath(); g.ellipse(13, 20, 4.5, 4, 0, 0, 7); g.fill(); }),
      duck: icon(30, 22, function (g) { rimmed(g, "#B9B4AA", "#FFFDF5", 1.2, function (e) {
          g.beginPath(); g.ellipse(13, 15, 11 + e, 6.5 + e, 0, 0, 7); g.fill(); g.beginPath(); g.arc(21, 7, 5 + e, 0, 7); g.fill(); });
        g.fillStyle = "#F4A340"; g.beginPath(); g.ellipse(27, 8, 3.5, 1.8, 0, 0, 7); g.fill();
        g.fillStyle = INK; g.beginPath(); g.arc(22.5, 6, 1.1, 0, 7); g.fill();
        g.strokeStyle = "#D8D2C6"; g.lineWidth = 1.2; g.beginPath(); g.arc(11, 13, 5, 0.2, 2.2); g.stroke(); }),
      duckling: icon(16, 13, function (g) { g.fillStyle = "#FFD95C"; g.beginPath(); g.ellipse(7, 9, 6, 3.8, 0, 0, 7); g.fill(); g.beginPath(); g.arc(11, 4.5, 3, 0, 7); g.fill();
        g.fillStyle = "#F4A340"; g.beginPath(); g.ellipse(14.5, 5, 2, 1, 0, 0, 7); g.fill();
        g.fillStyle = INK; g.beginPath(); g.arc(11.8, 3.8, 0.7, 0, 7); g.fill(); }),
      wagon: icon(74, 46, function (g) { rimmed(g, "#2F6B69", "#5E9C9A", 2, function (e) { rr(g, 4 - e, 8 - e, 62 + 2 * e, 28 + 2 * e, 8); g.fill(); });
        g.fillStyle = "#F2E8D8"; rr(g, 2, 2, 66, 9, 4); g.fill();
        g.fillStyle = "#FFE9A6"; [12, 30, 48].forEach(function (x) { rr(g, x, 14, 12, 10, 3); g.fill(); });
        g.strokeStyle = "#8D6440"; g.lineWidth = 2; g.beginPath(); g.moveTo(66, 30); g.lineTo(74, 30); g.stroke(); }),
      bag: icon(22, 24, function (g) { rimmed(g, "#3F7A50", "#9EE0B4", 1.2, function (e) { rr(g, 3 - e, 6 - e, 16 + 2 * e, 17 + 2 * e, 5); g.fill(); });   // the kit bag, in the otter's green
        g.strokeStyle = "#3F7A50"; g.lineWidth = 2; g.beginPath(); g.moveTo(7, 6); g.quadraticCurveTo(11, -1, 15, 6); g.stroke();
        g.fillStyle = "#3F7A50"; rr(g, 6, 13, 10, 7, 2); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(11, 10, 1.6, 0, 7); g.fill(); })
    };
  }
  // The workshop's building, in the stages a print goes through. Anchors are the
  // bottom centre of the plot; the roof is blitted higher.
  function makeShop() {
    function pole(g, x, y0, y1) { g.fillStyle = "#B08A5A"; g.fillRect(x - 2, y0, 4, y1 - y0); }
    return {
      frame: icon(112, 84, function (g) {                                  // scaffold poles, cross planks, a pile of planks
        pole(g, 8, 6, 84); pole(g, 104, 6, 84); pole(g, 8, 6, 84);
        g.fillStyle = "#C9A06A"; [24, 50, 74].forEach(function (y) { g.fillRect(4, y, 104, 4); });
        g.fillStyle = "#D9B27A"; g.fillRect(70, 74, 34, 5); g.fillRect(72, 68, 30, 5); g.fillRect(74, 62, 26, 5);
        g.strokeStyle = "rgba(90,60,30,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(8, 84); g.lineTo(104, 24); g.stroke(); }),
      walls1: icon(90, 26, function (g) { rimmed(g, "#9C7B57", "#EAD8B6", 2, function (e) { g.fillRect(3 - e, 4 - e, 84 + 2 * e, 22 + 2 * e); });
        g.strokeStyle = "rgba(120,90,60,.35)"; g.lineWidth = 1; for (var y = 10; y < 26; y += 6) { g.beginPath(); g.moveTo(3, y); g.lineTo(87, y); g.stroke(); } }),
      walls2: icon(90, 52, function (g) { rimmed(g, "#9C7B57", "#EAD8B6", 2, function (e) { g.fillRect(3 - e, 2 - e, 84 + 2 * e, 50 + 2 * e); });
        g.fillStyle = "#6D8FB5"; rr(g, 14, 20, 24, 32, 6); g.fill(); g.fillStyle = "#E8C66A"; g.beginPath(); g.arc(33, 37, 1.8, 0, 7); g.fill();   // wide door
        g.fillStyle = "#FFE9A6"; rr(g, 50, 14, 22, 16, 4); g.fill();                                                                            // window
        g.strokeStyle = "rgba(90,60,40,.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(61, 14); g.lineTo(61, 30); g.stroke(); }),
      roof: icon(110, 44, function (g) { g.fillStyle = "#8C6E62"; g.fillRect(74, 4, 12, 26);                                                    // chimney behind
        rimmed(g, "#48648A", "#6D8FB5", 2, function (e) { g.beginPath(); g.moveTo(2 - e, 44 + e); g.lineTo(55, 8 - e); g.lineTo(108 + e, 44 + e); g.closePath(); g.fill(); });
        g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 2; [30, 22, 14].forEach(function (yy, i) { var hw = 53 * (yy - 8) / 36; g.beginPath(); g.moveTo(55 - hw, yy + 8); g.lineTo(55 + hw, yy + 8); g.stroke(); }); }),
      sign: icon(26, 30, function (g) { pole(g, 13, 8, 30); rimmed(g, "#7A5238", "#F2E8D8", 1.5, function (e) { rr(g, 1 - e, 1 - e, 24 + 2 * e, 16 + 2 * e, 3); g.fill(); });   // a little cube: what it makes
        g.fillStyle = "#E86A5B"; g.beginPath(); g.moveTo(9, 6); g.lineTo(13, 4); g.lineTo(17, 6); g.lineTo(13, 8); g.closePath(); g.fill();
        g.fillStyle = "#C24E42"; g.beginPath(); g.moveTo(9, 6); g.lineTo(13, 8); g.lineTo(13, 14); g.lineTo(9, 12); g.closePath(); g.fill();
        g.fillStyle = "#F4A340"; g.beginPath(); g.moveTo(17, 6); g.lineTo(13, 8); g.lineTo(13, 14); g.lineTo(17, 12); g.closePath(); g.fill(); }),
      rubble: icon(100, 30, function (g) { [[10, 22, 30, 6, -0.2], [42, 18, 34, 6, 0.15], [66, 24, 28, 6, -0.35], [26, 12, 26, 5, 0.4], [54, 8, 22, 5, -0.1]].forEach(function (p) {
          g.save(); g.translate(p[0] + p[2] / 2, p[1]); g.rotate(p[4]); g.fillStyle = "#C9A06A"; g.fillRect(-p[2] / 2, -p[3] / 2, p[2], p[3]); g.restore(); });
        g.fillStyle = "#EAD8B6"; [[14, 26], [36, 27], [80, 25], [58, 20]].forEach(function (p) { g.fillRect(p[0], p[1], 10, 4); }); }),
      bunting: icon(120, 26, function (g) { var cols = ["#E86A5B", "#F3DE7C", "#6C8FD0", "#7BC47F", "#E68AB0", "#F4A340"];
        g.strokeStyle = "rgba(90,80,70,.8)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, 4); g.quadraticCurveTo(60, 20, 118, 4); g.stroke();
        for (var i = 0; i < 7; i++) { var u = (i + 0.5) / 7, x = 2 + 116 * u, y = 4 + 8 * 4 * u * (1 - u);
          g.fillStyle = cols[i % 6]; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.lineTo(x, y + 11); g.closePath(); g.fill(); } })
    };
  }
  // Speech bubbles for greetings, queues and the band's breaks.
  function makeBubbles() {
    var out = {};
    ["heart", "note", "dots", "ha", "sun", "hi", "hic"].forEach(function (kind) {
      out[kind] = icon(44, 36, function (g) {
        g.fillStyle = "#FFFFFF"; g.strokeStyle = "rgba(60,70,60,.25)"; g.lineWidth = 1.5;
        rr(g, 2, 2, 40, 26, 12); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(12, 27); g.lineTo(20, 27); g.lineTo(9, 35); g.closePath(); g.fill();
        var x = 22, y = 15;
        if (kind === "heart") { g.fillStyle = "#FF7FA0"; g.beginPath(); g.moveTo(x, y + 5);
          g.bezierCurveTo(x - 9, y - 2, x - 4, y - 9, x, y - 4); g.bezierCurveTo(x + 4, y - 9, x + 9, y - 2, x, y + 5); g.fill(); }
        else if (kind === "note") { g.fillStyle = g.strokeStyle = "#6C7FD0"; g.lineWidth = 2;
          g.beginPath(); g.ellipse(x - 3, y + 5, 4, 3, -0.3, 0, 7); g.fill();
          g.beginPath(); g.moveTo(x + 1, y + 4); g.lineTo(x + 1, y - 7); g.lineTo(x + 7, y - 4); g.stroke(); }
        else if (kind === "dots") { g.fillStyle = "#8A94A6"; [-8, 0, 8].forEach(function (d) { g.beginPath(); g.arc(x + d, y, 2.6, 0, 7); g.fill(); }); }
        else if (kind === "sun") { g.fillStyle = "#FFC83D"; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.strokeStyle = "#FFC83D"; g.lineWidth = 2;
          for (var i = 0; i < 8; i++) { var a = i / 8 * 6.283; g.beginPath(); g.moveTo(x + Math.cos(a) * 7.5, y + Math.sin(a) * 7.5); g.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); g.stroke(); } }
        else { g.fillStyle = kind === "hic" ? "#9A6C3C" : "#C4553A"; g.font = "600 15px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle";
          g.fillText(kind === "ha" ? "ha!" : kind === "hi" ? "hi!" : "hic", x, y + 1); }
      });
    });
    return out;
  }
  // The stall counter, drawn over the stallholder so only a head shows. The left
  // third is left bare: that is where the baker's loaves go.
  function marketFront() {
    return icon(140, 66, function (g) {
      rimmed(g, "#8D6440", "#C99A67", 2, function (e) { g.fillRect(10 - e, 26 - e, 120 + 2 * e, 40 + 2 * e); });
      g.strokeStyle = "rgba(90,60,30,.3)"; g.lineWidth = 2;
      [40, 70, 100].forEach(function (x) { g.beginPath(); g.moveTo(x, 28); g.lineTo(x, 64); g.stroke(); });
      [["#E0474C", 56], ["#C7D86A", 94]].forEach(function (pile) {
        [[0, 0], [9, 0], [18, 0], [4.5, -7], [13.5, -7]].forEach(function (o) {
          g.fillStyle = pile[0]; g.beginPath(); g.arc(pile[1] + o[0], 22 + o[1], 5.5, 0, 7); g.fill();
          g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(pile[1] + o[0] - 1.8, 20 + o[1], 1.5, 0, 7); g.fill(); }); });
    });
  }
  function sprout(x, y, gr) {
    if (gr < 0.06) { ctx.fillStyle = "#8B5E3C"; ctx.beginPath(); ctx.ellipse(x, y, 6, 2.5, 0, 0, 7); ctx.fill(); return; }
    var k = 0.4 + 0.6 * gr;
    if (gr >= 1) { ctx.fillStyle = "#F28C38"; ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 3.5, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = "#3F8A4A"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14 * k); ctx.stroke();
    ctx.fillStyle = "#72C878";
    ctx.beginPath(); ctx.ellipse(x - 5 * k, y - 12 * k, 6 * k, 3 * k, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5 * k, y - 15 * k, 6 * k, 3 * k, 0.5, 0, 7); ctx.fill();
  }

  // ── Walkers: villagers on the move between doors ──
  function route(a, b) { return (a.lane || []).concat((b.lane || []).slice().reverse(), [{ x: b.x, y: b.y }]); }
  function fromHere(w, b) { return [{ x: w.v.x, y: LAY.R }].concat((b.lane || []).slice().reverse(), [{ x: b.x, y: b.y }]); }
  function exitDoor() { return DOORS[pick(["left", "right", "left", "right", "cottage", "mill", "post"])]; }
  function walker(from, o) {
    o = o || {};
    var w = { v: mkV(o.col || pick(VCOLS), o.hat || pick(HATS), from.x, from.y, o.r), path: null, i: 0, speed: o.speed || 30,
      done: null, carry: null, wobble: o.wobble ? rand(0, 6) : -1, pause: 0, cool: rand(2, 6), bub: null, bubT: 0, q: null, umb: pick(UMBS) };
    WALKERS.push(w); return w;
  }
  function leg(w, path, done, carry) { w.path = path; w.i = 0; w.done = done || null; w.carry = carry || null; return w; }
  function errand(from, to, o, done) { var w = walker(from, o); return leg(w, route(from, to), done, o && o.carry); }
  function greet(w) { return w.wobble >= 0 ? BUBS.hic : pick([BUBS.hi, BUBS.hi, BUBS.heart, BUBS.ha, BUBS.sun]); }
  function updateWalkers(dt) {
    var i, j, w;
    for (i = WALKERS.length - 1; i >= 0; i--) { w = WALKERS[i];
      tickV(w.v, dt); w.cool -= dt; w.bubT -= dt;
      w.v.umb = WX.rain > 0.3 ? w.umb : null;
      if (w.wobble >= 0) { w.wobble += dt; if (w.path && Math.random() < dt * 0.25) say("hic", w.v.x, w.v.y - 46); }
      if (w.q || !w.path) continue;
      if (w.pause > 0) { w.pause -= dt; w.v.moving = false; continue; }
      var p = w.path[w.i], sp = w.speed * (w.wobble >= 0 ? 0.65 : 1) * (WX.rain > 0.4 ? 1.35 : 1);
      if (walkV(w.v, p.x, p.y, sp, dt) && ++w.i >= w.path.length) {
        var d = w.done; w.path = null; w.done = null; w.carry = null;
        if (d) d(w);
        if (!w.path && !w.q) WALKERS.splice(WALKERS.indexOf(w), 1);
      }
    }
    // two walkers meeting on the road stop, turn to each other and say hello
    for (i = 0; i < WALKERS.length; i++) for (j = i + 1; j < WALKERS.length; j++) {
      var a = WALKERS[i], b = WALKERS[j];
      if (!a.path || !b.path || a.pause > 0 || b.pause > 0 || a.cool > 0 || b.cool > 0) continue;
      if (Math.abs(a.v.x - b.v.x) < 30 && Math.abs(a.v.y - b.v.y) < 14) {
        a.pause = b.pause = 1.5; a.cool = b.cool = 14; a.v.moving = b.v.moving = false;
        a.v.face = b.v.x > a.v.x ? 1 : -1; b.v.face = -a.v.face;
        a.bub = greet(a); a.bubT = 1.5; b.v.happy = 1.5;
        if (Math.random() < 0.5) { b.bub = greet(b); b.bubT = 1.2; }
      }
    }
    // a passer-by says hello to a family member just below the road, who waves back
    for (i = 0; i < WALKERS.length; i++) { var w2 = WALKERS[i];
      if (!w2.path || w2.pause > 0 || w2.cool > 0 || w2.wobble >= 0) continue;
      for (j = 0; j < fam.length; j++) { var f = fam[j], dy2 = f.y - w2.v.y;
        if (Math.abs(f.x - w2.v.x) < 70 && dy2 > 20 && dy2 < 140 && Math.random() < 0.5 && famWave(f)) {
          w2.pause = 1.4; w2.cool = 14; w2.bub = BUBS.hi; w2.bubT = 1.5; w2.v.face = f.x > w2.v.x ? 1 : -1; w2.v.moving = false; break; } } }
  }
  function drawWalkers() {
    var list = WALKERS.slice().sort(function (a, b) { return a.v.y - b.v.y; });
    var rave = PARTY_T > 0.5 ? PARTY_T : MUSIC_T > 0.5 && nightness < 0.6 ? MUSIC_T * 0.7 : 0;   // everyone on the road bounces to the rave, or to the music
    var bw = PARTY_T > 0.5 ? RAVE_W : MUSIC_W;
    for (var i = 0; i < list.length; i++) { var w = list[i];
      var hop = rave ? Math.max(0, Math.sin(clockT * bw + w.v._seed * 3)) * 6 * rave : 0;
      drawV(w.v, false, false, w.wobble >= 0 && w.path ? Math.sin(w.wobble * 3) * 0.22 : rave ? Math.sin(clockT * bw * 0.5 + w.v._seed) * 0.06 : 0, hop);
      if (w.carry) carry(w.carry, w.v);
      if (w.bubT > 0 && w.bub) blit(w.bub, w.v.x + w.v.face * 14, w.v.y - w.v.r * 2.1 * depth(w.v.y) - (w.v.umb ? 16 : 0), 1, 1, 1, 1);
    }
  }
  // ── Queues: the well, the stall, the bus stop ──
  function queue(slot, face) { return { list: [], slot: slot, face: face }; }
  function joinQ(q, w) { w.q = q; q.list.push(w); }
  function leaveQ(q, to, carryIcon) { var w = q.list.shift(); if (!w) return null; w.q = null; leg(w, fromHere(w, to), null, carryIcon); return w; }
  function updateQ(q, dt) {
    for (var i = 0; i < q.list.length; i++) { var w = q.list[i], s = q.slot(i);
      if (walkV(w.v, s.x, s.y, 26, dt)) w.v.face = q.face;
      if (i > 0 && w.bubT <= 0 && Math.random() < dt * 0.05) { w.bub = pick([BUBS.dots, BUBS.ha, BUBS.sun, BUBS.heart]); w.bubT = 1.4; } }
  }
  function qFront(q) { var w = q.list[0]; if (!w) return null; var s = q.slot(0); return Math.abs(w.v.x - s.x) + Math.abs(w.v.y - s.y) < 3 ? w : null; }

  // ── Guards: the woodcutter and the gardener see foxes off ──
  function lookForFox(g, dt) {
    if (SHOO_COOL > 0 || nightness > 0.35) return;
    for (var i = 0; i < things.length; i++) { var f = things[i];
      if (f.kind === "nib" && f.chase && !(f.scared > 0) && dist(f, g.v) < 320 && Math.random() < dt * 0.6) {
        g.mode = "shoo"; g.fox = f; SHOO_COOL = 30; say("!", g.v.x, g.v.y - 46); return; } }
  }
  function shoo(g, dt) {
    var f = g.fox;
    if (!f || things.indexOf(f) < 0 || f.scared > 0) { g.mode = "home"; return; }
    walkV(g.v, f.x, f.y, 82, dt);
    if (dist(g.v, f) < 42) { f.scared = 6; f.fleeX = f.x < W / 2 ? -70 : W + 70; f.chase = null; f.chaseT = 0; f.idle = false;
      say("shoo!", g.v.x, g.v.y - 50); g.v.happy = 2; g.mode = "home"; }
  }

  // Rain and snow, one set per size. The village makes them; a scene without it gets them in setup.
  function makeDrops() {
    WX.drops = []; for (var d = 0; d < 170; d++) WX.drops.push({ x: rand(0, W), y: rand(0, H), s: rand(0.7, 1.2) });
    WX.flakes = []; for (d = 0; d < 110; d++) WX.flakes.push({ x: rand(0, W), y: rand(0, H), s: rand(0, 1.5), ph: rand(0, 6) });
  }
  function makeVillage() {
    var S = [], L = LAY, B = L.B, R = L.R;
    WALKERS = []; TRADE = { flour: 1, wood: 3, bread: 1 }; PUBN = 2;
    makeDrops();

    // Weather, fox-shooing cooldown and the walker bookkeeping.
    // Every colour and hat a passer-by can wear, baked one per frame at boot. A sprite
    // baked on first use costs ~25ms on a throttled CPU, most of a 33ms frame.
    var warm = []; VCOLS.forEach(function (c) { HATS.forEach(function (h) { if (warm.indexOf(c + "|" + h) < 0) warm.push(c + "|" + h); }); });
    S.push({ layer: null, t: 3,
      update: function (dt, asleep) {
        if (warm.length) { var wh = warm.pop().split("|"); mkV(wh[0], wh[1], 0, 0); }
        SHOO_COOL -= dt;
        updateWeather(dt);

        updateWalkers(dt);
        // Evening: queues break up and people head home.
        if (nightness > 0.35) { [QS.well, QS.market, QS.bus].forEach(function (q) { while (q.list.length) leaveQ(q, exitDoor()); }); return; }
        this.t -= dt; if (this.t > 0) return;
        this.t = rand(2, 5) * (WX.rain > 0.4 ? 2 : 1);
        if (WX.storm > 0.5) return;                        // a thunderstorm keeps everyone in
        if (WALKERS.length >= 14) return;
        var from = pick([DOORS.left, DOORS.right, DOORS.left, DOORS.right, DOORS.cottage, DOORS.mill, DOORS.post]), r = Math.random();
        if (r < 0.18) errand(from, DOORS.pub, {}, function () { PUBN++; });
        else if (r < 0.36 && QS.well.list.length < 4) errand(from, DOORS.wellq, {}, function (w) { joinQ(QS.well, w); });
        else if (r < 0.54 && QS.bus.list.length < 4) errand(from, DOORS.busq, {}, function (w) { joinQ(QS.bus, w); });
        else if (r < 0.8 && QS.market.list.length < 3) errand(from, DOORS.marketq, {}, function (w) { joinQ(QS.market, w); });
        else errand(from, exitDoor(), {});
      } });

    // Well: a queue, a crank, a bucket each.
    (function () {
      var w0 = L.well, crank = 0, serve = 0;
      QS.well = queue(function (i) { return { x: w0.x + 34 + i * 23, y: B + 14 + (i ? 7 : 0) }; }, -1);
      S.push({ layer: "back",
        update: function (dt) { updateQ(QS.well, dt); var f = qFront(QS.well);
          if (f) { serve += dt; crank += dt * 5; if (serve > 2.6) { serve = 0; f.v.happy = 1.2; leaveQ(QS.well, exitDoor(), ICON.bucket); } } else serve = 0; },
        draw: function () {
          var up = clamp(serve / 2.6, 0, 1), by = B - 30 - up * 22;
          ctx.strokeStyle = "#6B5A4E"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(w0.x, B - 58); ctx.lineTo(w0.x, by - 6); ctx.stroke();
          ctx.strokeStyle = "#8D6440"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w0.x - 18, B - 58); ctx.lineTo(w0.x + 22, B - 58); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w0.x + 22, B - 58); ctx.lineTo(w0.x + 22 + Math.cos(crank) * 7, B - 58 + Math.sin(crank) * 7); ctx.stroke();
          if (up > 0.05) blit(ICON.bucket, w0.x, by + 8, 1, 1, 1, 1);
        } });
    })();

    // Pub: people go in; every so often one comes out wobbly. A cat hops between roofs.
    (function () {
      var p = L.pub, t = rand(6, 14), cat = { on: 0, from: 0, hop: 0, t: rand(20, 40) };
      var roofs = [{ x: p.x + 6, y: B - 98 }, { x: L.bakery.x - 8, y: B - 126 }];
      S.push({ layer: "back",
        update: function (dt, asleep) {
          cat.t -= dt; if (cat.hop > 0) cat.hop = Math.max(0, cat.hop - dt / 0.9);
          if (!asleep && cat.t < 0 && WX.rain < 0.3) { cat.from = cat.on; cat.on = 1 - cat.on; cat.hop = 1; cat.t = rand(25, 55); }
          if (nightness > 0.6) return;
          t -= dt;
          if (t < 0) { t = rand(10, 22); if (PUBN > 0) { PUBN--; errand(DOORS.pub, exitDoor(), { wobble: true, speed: 26 }); } }
        },
        draw: function (time, asleep) {
          if (WX.rain > 0.3) return;                                    // cats do not do rain
          var a = roofs[cat.from], b = roofs[cat.on], k = 1 - cat.hop;
          var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * (cat.hop > 0 ? 44 : 0), face = b.x > a.x ? 1 : -1;
          ctx.strokeStyle = "#5F6270"; ctx.lineWidth = 3; ctx.lineCap = "round";
          var sw = asleep ? 0 : Math.sin(time * 1.8) * 5;
          ctx.beginPath(); ctx.moveTo(x - face * 6, y - 3); ctx.quadraticCurveTo(x - face * 16, y - 4, x - face * 14 + sw, y - 16); ctx.stroke();
          blit(ICON.cat, x, y + 2, face, 1, 1, 1);
        },
        light: function (a) { ctx.fillStyle = "rgba(255,212,120," + (0.9 * a).toFixed(2) + ")";
          rr(ctx, p.x - 4, B - 56, 20, 16, 4); ctx.fill(); rr(ctx, p.x + 30, B - 56, 20, 16, 4); ctx.fill(); } });
    })();

    // Bakery: bakes with the miller's flour on the woodcutter's logs, sends loaves to the stall.
    (function () {
      var b = L.bakery, smoke = 0, burn = 50, bake = rand(6, 14), busy = false;
      S.push({ layer: "back",
        update: function (dt, asleep) {
          smoke -= dt;
          if (smoke < 0 && !asleep) { smoke = TRADE.wood > 0 ? rand(0.3, 0.6) : rand(1.8, 2.8);
            parts.push({ kind: "smoke", x: b.x + 38 + rand(-2, 2), y: B - 138, vx: rand(4, 10), vy: -15, life: 3.6, max: 3.6 }); }
          burn -= dt; if (burn < 0) { burn = 50; if (TRADE.wood > 0) TRADE.wood--; }
          if (asleep || nightness > 0.35 || busy) return;
          bake -= dt;
          if (bake < 0 && TRADE.flour > 0 && TRADE.bread < 3) {
            bake = rand(25, 45); TRADE.flour--; busy = true;
            errand(DOORS.bakery, DOORS.marketside, { col: "#F3DE7C", hat: "chef", carry: ICON.loaf, speed: 26 }, function (w) {
              TRADE.bread = Math.min(3, TRADE.bread + 1); w.v.happy = 1.5; puff("heart", w.v.x, w.v.y - 44, 1, "#FF7FA0");
              leg(w, route(DOORS.marketside, DOORS.bakery), function () { busy = false; });
            });
          } else if (bake < 0) bake = 8;
        },
        draw: function () {
          for (var i = 0; i < TRADE.wood; i++) { var x = b.x + 76 + (i % 3) * 13 + (i >= 3 ? 6.5 : 0), y = B - 6 - (i >= 3 ? 11 : 0);
            ctx.fillStyle = "#8A5A36"; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
            ctx.fillStyle = "#E2C08E"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
          for (i = 0; i < TRADE.flour; i++) blit(ICON.sack, b.x - 62 + i * 9, B + 2, 1, 1, 1, 1);
        },
        light: function (a) {
          ctx.globalAlpha = a * 0.5; ctx.drawImage(GLOW, b.x - 6, B - 70, 56, 56); ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(255,212,120," + (0.9 * a).toFixed(2) + ")"; rr(ctx, b.x + 4, B - 56, 36, 28, 5); ctx.fill();
        } });
    })();

    // Post office: the postie does a round of three doors. POSTIE.busy is shared with
    // the letter run below, so there is one postie on the road at a time.
    (function () {
      var t = rand(6, 16), stops = ["school", "pub", "bakery", "cottage", "mill"];
      S.push({ layer: null,
        update: function (dt, asleep) {
          if (asleep || nightness > 0.35 || POSTIE.busy) return;
          t -= dt; if (t > 0) return; t = rand(30, 55);
          if (LETTER.queue.length) return;                                      // a real letter goes first
          POSTIE.busy = true;
          var list = stops.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3), at = DOORS.post;
          var w = walker(DOORS.post, { col: "#F6C28B", hat: "postcap", speed: 32 });
          (function next() {
            var to = list.length ? DOORS[list.shift()] : DOORS.post, from = at; at = to;
            if (to === DOORS.post) { leg(w, route(from, to), function () { POSTIE.busy = false; }); return; }
            leg(w, route(from, to), function () {
              parts.push({ kind: "icon", icon: ICON.letter, x: w.v.x, y: w.v.y - 40, vx: -w.v.face * 12, vy: -40, life: 0.8, max: 0.8 });
              puff("heart", to.x, to.y - 50, 1, "#FF7FA0"); w.pause = 0.9; w.v.happy = 1; next();
            }, ICON.letter);
          })();
        }, draw: function () {} });
    })();

    // Letters from a phone (SENSORS.letter, see LETTER). The postie takes
    // the envelope off the road and across the meadow to whoever it names, following
    // them if they wander. Post office hours only: a letter sent after dark, or to
    // someone who is out, waits on the postbox until it can go.
    (function () {
      var run = null, PB = { x: L.post.x + 57, y: B - 34 };
      S.push({ layer: "back",
        update: function (dt, asleep) {
          if (run) {
            var w = run.w, t = run.t;
            if (run.st === "road") return;                                     // on a leg; its callback moves us on
            if (run.st === "walk") {
              if (asleep || nightness > 0.6) { run.st = "back"; w.q = null; leg(w, fromHere(w, DOORS.post), function () { POSTIE.busy = false; run = null; }); LETTER.queue.unshift(run.letter); return; }
              var gx = t.x - t.face * t.r * 1.2, gy = t.y + 4;
              if (walkV(w.v, gx, gy, 36, dt) || Math.abs(w.v.x - t.x) + Math.abs(w.v.y - t.y) < t.r * 1.6) {
                t.letter = run.letter; t.happy = 2.2; t.jump = 0.6; say("!", t.x, t.y - t.r * 2.6);
                parts.push({ kind: "icon", icon: ICON.letter, x: w.v.x, y: w.v.y - 40, vx: (t.x - w.v.x) * 1.5, vy: -50, life: 0.7, max: 0.7 });
                w.v.happy = 1.5; w.v.face = t.x > w.v.x ? 1 : -1; w.carry = null; w.q = null; run.st = "back";
                leg(w, fromHere(w, DOORS.post), function () { POSTIE.busy = false; run = null; });
              }
            }
            return;
          }
          if (!LETTER.queue.length || asleep || nightness > 0.35 || POSTIE.busy) return;
          var L1 = LETTER.queue[0], to = fam.filter(function (f) { return f.person.name === L1.to; })[0];
          if (!to || offStage(to)) return;                                     // out: it waits
          LETTER.queue.shift(); POSTIE.busy = true;
          var w2 = walker(DOORS.post, { col: "#F6C28B", hat: "postcap", speed: 34 });
          run = { w: w2, t: to, letter: L1, st: "road" };
          leg(w2, route(DOORS.post, { x: to.x, y: R, lane: [] }), function () { run.st = "walk"; w2.q = run; w2.carry = ICON.letter; }, ICON.letter);
        },
        draw: function (time) {
          // waiting mail sits on the postbox
          if (LETTER.queue.length && !run) blit(ICON.letter, PB.x, PB.y + Math.sin(time * 2) * 1.5, 1, 1, 1, 1.4);
        } });
    })();

    // Market: a stallholder, a queue, and bread when the baker has been.
    (function () {
      var m = L.market, keeper = mkV("#F29E8E", "cap", m.x, B - 44), k = 0, serve = 0;
      QS.market = queue(function (i) { return { x: m.x + 10 + i * 25, y: B + 20 }; }, -1);
      S.push({ layer: "back",
        update: function (dt, asleep) {
          tickV(keeper, dt); updateQ(QS.market, dt);
          if (asleep) return;
          k += dt; keeper.x = m.x + Math.sin(k * 0.7) * 16; keeper.face = Math.cos(k * 0.7) > 0 ? 1 : -1;
          var f = qFront(QS.market);
          if (f) { keeper.face = 1; serve += dt;
            if (serve > 2) { serve = 0; keeper.happy = 2; f.v.happy = 2;
              parts.push({ kind: "coin", x: f.v.x - 6, y: f.v.y - 40, vx: -30, vy: -70, life: 0.8, max: 0.8 });
              var gets = ICON.apple; if (TRADE.bread > 0) { TRADE.bread--; gets = ICON.loaf; }
              leaveQ(QS.market, exitDoor(), gets); } } else serve = 0;
        },
        draw: function (time, asleep) {
          drawV(keeper, asleep, true); blit(MFRONT, m.x, m.y, 1, 1, 1, 1);
          for (var i = 0; i < TRADE.bread; i++) blit(ICON.loaf, m.x - 50 + (i % 2) * 18, m.y - 38 - (i > 1 ? 7 : 0), 1, 1, 1, 1);
        } });
    })();

    // Bus: a pony cart crosses the high street, stops, takes the queue, drops people off.
    (function () {
      var b = L.bus, cart = { x: -200, st: "off", t: rand(12, 25), board: 0, wheel: 0 }, pony = mkV("#C69C6D", "none", -200, R + 8, 17);
      QS.bus = queue(function (i) { return { x: b.x - 30 - i * 23, y: R + 13 }; }, 1);
      var stopX = b.x + 64;
      S.push({ layer: "back", late: true,
        update: function (dt, asleep) {
          updateQ(QS.bus, dt); tickV(pony, dt);
          var v = 0;
          if (cart.st === "off") { cart.t -= dt; if (cart.t < 0 && nightness < 0.35) { cart.st = "in"; cart.x = -120; } }
          else if (cart.st === "in") { v = Math.min(70, 16 + (stopX - cart.x) * 1.2); cart.x += v * dt;
            if (cart.x >= stopX - 0.5) { cart.x = stopX; cart.st = "stop"; cart.t = 4; cart.board = 0.6; } }
          else if (cart.st === "stop") { cart.t -= dt; cart.board -= dt;
            if (cart.board < 0 && QS.bus.list.length) { var w = QS.bus.list.shift(); WALKERS.splice(WALKERS.indexOf(w), 1);
              puff("heart", cart.x - 50, R - 30, 1, "#FF7FA0"); cart.board = 0.6; cart.t = Math.max(cart.t, 1.2); }
            if (cart.t < 0) {
              for (var n = (Math.random() * 3) | 0; n > 0; n--) {
                var off = { x: cart.x - 40 - n * 10, y: R + 10, lane: [] };
                errand(off, DOORS[pick(["cottage", "mill", "post", "pub", "bakery", "school"])], {});
              }
              cart.st = "out"; }
          } else { v = Math.min(70, (cart.v || 0) + 40 * dt); cart.v = v; cart.x += v * dt; if (cart.x > W + 220) { cart.st = "off"; cart.v = 0; cart.t = rand(40, 75); } }
          pony.x = cart.x; pony.y = R + 8; pony.moving = v > 1; if (v > 1) pony.phase += v * dt / (pony.r * 0.9); pony.face = 1;
          cart.wheel += v * dt / 9;
        },
        draw: function () {
          if (cart.st === "off") return;
          var wx = cart.x - 50;
          blit(ICON.wagon, wx, R + 4, 1, 1, 1, 1);
          [-22, 20].forEach(function (o) { var cx = wx + o, cy = R + 2;
            ctx.fillStyle = "#6B4A34"; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 7); ctx.fill();
            ctx.strokeStyle = "#D9B27A"; ctx.lineWidth = 1.6; ctx.beginPath();
            for (var s = 0; s < 3; s++) { var a = cart.wheel + s * 1.047; ctx.moveTo(cx - Math.cos(a) * 6, cy - Math.sin(a) * 6); ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); }
            ctx.stroke(); });
          drawV(pony, false);
        } });
    })();

    // Windmill: sails always turning (faster in a shower); the miller takes flour to the bakery.
    (function () {
      var m = L.mill, ang = rand(0, 6), t = rand(8, 20), busy = false;
      S.push({ layer: "back",
        update: function (dt, asleep) {
          ang += dt * (asleep ? 0.12 : 0.45 + WX.rain * 0.7) + dt * WX.wind * 1.4;
          if (asleep || nightness > 0.35 || busy) return;
          t -= dt; if (t > 0) return;
          if (TRADE.flour >= 3) { t = 10; return; }
          t = rand(35, 60); busy = true;
          errand(DOORS.mill, DOORS.bakery, { col: "#E8C3A0", hat: "cap", carry: ICON.sack, speed: 24 }, function (w) {
            TRADE.flour = Math.min(3, TRADE.flour + 1); w.v.happy = 1.4;
            leg(w, route(DOORS.bakery, DOORS.mill), function () { busy = false; });
          });
        },
        draw: function () {
          var hx = m.x, hy = B - 124;
          ctx.save(); ctx.translate(hx, hy);
          for (var s = 0; s < 4; s++) { ctx.save(); ctx.rotate(ang + s * Math.PI / 2);
            ctx.fillStyle = "#8D6440"; ctx.fillRect(-2, 6, 4, 74);
            ctx.fillStyle = "rgba(247,241,230,.95)"; ctx.fillRect(3, 16, 15, 62);
            ctx.strokeStyle = "#B3A48C"; ctx.lineWidth = 1; ctx.strokeRect(3, 16, 15, 62);
            ctx.beginPath(); for (var y = 28; y < 78; y += 12) { ctx.moveTo(3, y); ctx.lineTo(18, y); } ctx.stroke();
            ctx.restore(); }
          ctx.fillStyle = "#7E4331"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
          ctx.restore();
        },
        light: function (a) { ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")"; rr(ctx, m.x - 8, B - 84, 16, 18, 4); ctx.fill(); } });
    })();

    // Cottage: the window at night, and the kit bag by the door when the kit sensor
    // says kit is needed (see kitBag).
    S.push({ layer: "back", update: function () {},                         // "back", or draw() never runs
      draw: function () { if (kitBag()) blit(ICON.bag, L.cottage.x + 6, B + 3, 1, 1, 1, 1); },
      light: function (a) { ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")"; rr(ctx, L.cottage.x + 6, B - 44, 26, 20, 4); ctx.fill(); } });

    // Workshop: the Bambu A1 Mini's job as a building. The plot is bare until a job
    // exists; then a scaffold, walls, a roof and a sign go up as the print's progress
    // rises, with a builder hammering. Pause sits him down, failed knocks it flat,
    // finish rings a bell and hangs bunting. The finished building stays until the
    // next job starts or the printer has been idle half an hour. Offline, unknown or
    // unreachable is the bare plot: a missing sensor never builds anything.
    (function () {
      var s = L.shop, v = mkV("#E8C3A0", "cap", s.x + 62, s.y + 4), sw = 0, st = "empty", stage = 0, bell = 0, idleT = 0, hold = 0, bub = 0, smoke = 0;
      function stageFor(p) { return p < 12 ? 0 : p < 40 ? 1 : p < 70 ? 2 : p < 95 ? 3 : 4; }
      function collapse() { for (var i = 0; i < 4; i++) puff("poof", s.x + rand(-40, 40), s.y - rand(10, 60), 4, "#FFFFFF");
        puff("chip", s.x, s.y - 30, 12, "#C9A06A"); say("oops!", s.x, s.y - 80); v.face = -1; }
      S.push({ layer: "back", v: v,
        update: function (dt, asleep) {
          tickV(v, dt); bell = Math.max(0, bell - dt); bub -= dt; smoke -= dt; hold += dt;
          var ps = printerState(), next;
          if (ps === "running" || ps === "pause") next = ps;
          else if (/^(prepare|slicing|init)$/.test(ps)) next = "prep";
          else if (ps === "finish") next = "done";
          else if (ps === "failed") next = "failed";
          else if (ps === "idle" && (st === "done" || st === "failed")) { idleT += dt; next = idleT > 30 * 60 ? "empty" : st; }
          else next = "empty";
          if (ps !== "idle") idleT = 0;
          if (next !== st) {
            var was = st; st = next; hold = 0;
            if (st === "failed") collapse();
            else if (st === "done") { bell = 3; stage = 4; say("ding!", s.x, s.y - 100); puff("heart", s.x, s.y - 70, 4, "#FF7FA0"); v.happy = 3; }
            else if (st === "running" || st === "prep" || st === "pause") { if (was === "empty" || was === "done" || was === "failed") stage = st === "prep" ? 0 : stageFor(PR.progress); }
          }
          if (st === "running") {
            var want = stageFor(PR.progress);
            if (want > stage && hold > 1.5) { stage = want; hold = 0; puff("chip", s.x + rand(-30, 30), s.y - 20 - stage * 12, 6, "#D9B27A"); v.happy = 1; }
            v.face = -1; sw += dt / 0.9; if (sw >= 1) { sw = 0; if (Math.random() < 0.5) puff("chip", s.x + 30, s.y - 14 - stage * 8, 2, "#D9B27A"); }
          } else if (st === "pause" || st === "failed") { if (bub <= 0 && Math.random() < dt * 0.3) bub = 1.6; }
          else if (st === "prep") { v.face = -1; if (bub <= 0 && Math.random() < dt * 0.4) bub = 1.6; }
          else if (st === "done" && !asleep && smoke < 0) { smoke = rand(0.8, 1.6);
            parts.push({ kind: "smoke", x: s.x + 30 + rand(-2, 2), y: s.y - 88, vx: rand(4, 10), vy: -14, life: 3, max: 3 }); }
        },
        draw: function (time, asleep) {
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
          if (st === "done") { blit(SHOP.bunting, s.x, s.y - 92, 1, 1, 1, 1);
            var ba = bell > 0 ? Math.sin(bell * 14) * 0.5 : 0;
            ctx.save(); ctx.translate(s.x + 30, s.y - 100); ctx.rotate(ba); ctx.fillStyle = "#E8B33C";
            ctx.beginPath(); ctx.moveTo(-5, 7); ctx.quadraticCurveTo(-5, -3, 0, -3); ctx.quadraticCurveTo(5, -3, 5, 7); ctx.closePath(); ctx.fill(); ctx.restore(); }
          // the builder
          if (st === "pause") { var sc = depth(v.y);                                  // sat on the plank pile, waiting
            ctx.drawImage(SHADOW, v.x - v.r * 1.2 * sc, v.y - 4, v.r * 2.4 * sc, v.r * 0.7 * sc);
            blit(asleep ? v.spr.shut : v.spr.open, v.x, v.y - 6, -1, 1.12, 0.78, sc);
            if (bub > 0) blit(BUBS.dots, v.x + 12, v.y - 36, 1, 1, 1, 1);
            return; }
          drawV(v, asleep);
          if (st === "prep" && bub > 0) blit(BUBS.dots, v.x + 12, v.y - v.r * 2.1, 1, 1, 1, 1);
          if (st === "running" && !asleep) {                                          // the hammer, same swing as the woodcutter's axe
            var a = sw < 0.7 ? -0.3 - 2.0 * (sw / 0.7) : -2.3 + 2.1 * ((sw - 0.7) / 0.3);
            var hx = v.x - 8, hy = v.y - v.r * 0.9 * depth(v.y), ex = hx - Math.cos(a) * 22, ey = hy + Math.sin(a) * 22;
            ctx.strokeStyle = "#8D6440"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.save(); ctx.translate(ex, ey); ctx.rotate(-a); ctx.fillStyle = "#6E7480"; ctx.fillRect(-6, -4, 12, 8); ctx.restore();
          }
          if (st === "failed" && bub > 0) blit(BUBS.dots, v.x + 12, v.y - v.r * 2.1, 1, 1, 1, 1);
        },
        light: function (a) { if (st === "done" || st === "running") { ctx.fillStyle = "rgba(255,212,120," + (0.85 * a).toFixed(2) + ")"; rr(ctx, s.x + 12, s.y - 36, 20, 16, 4); ctx.fill(); } } });
    })();

    // School: the bell rings, kids pile out, play tag, one takes the swing, bell, back in.
    (function () {
      var s = L.school, door = { x: s.x, y: s.y + 4 }, Y0 = s.y + 22, Y1 = s.y + 80, X0 = s.x - 62, X1 = s.x + 84;
      var sw = L.swing, piv = { x: sw.x, y: sw.y - 98 }, RL = 66, th = 0, amp = 0, k = 0;
      var kids = [0, 1, 2, 3].map(function (i) { var v = mkV(VCOLS[(i * 3 + 2) % VCOLS.length], ["none", "beanie", "none", "beanie2"][i], door.x, door.y, 13);
        v.inside = true; v.delay = 0; v.pause = 0; v.tx = door.x; v.ty = door.y; return v; });
      var st = "in", t = rand(8, 18), it = 0, bell = 0, SWINGER = 3;
      function ring() { bell = 2.2; say("ding!", s.x + 22, s.y - 140); }
      function yard() { return { x: rand(X0, X1), y: rand(Y0, Y1) }; }
      S.push({ layer: "back",
        update: function (dt, asleep) {
          bell = Math.max(0, bell - dt); SCHOOL_OUT = st === "out";
          var swinger = kids[SWINGER], onSwing = st === "out" && swinger.onSwing;
          amp += ((onSwing ? 0.7 : 0) - amp) * dt * 0.5; k += dt; th = amp * Math.sin(k * 2.2);
          if (asleep) { st = "in"; kids.forEach(function (v) { v.inside = true; v.onSwing = false; }); return; }
          kids.forEach(function (v) { tickV(v, dt); });
          t -= dt;
          if (st === "in") {
            if (t < 0 && nightness < 0.3 && WX.rain < 0.2) { st = "out"; t = rand(24, 34); ring(); it = (Math.random() * 3) | 0;
              kids.forEach(function (v, i) { v.inside = false; v.x = door.x; v.y = door.y; v.delay = i * 0.5; var p = yard(); v.tx = p.x; v.ty = p.y; v.onSwing = false; }); }
            return;
          }
          if (st === "out" && (t < 0 || WX.rain > 0.4)) { st = "home"; ring(); }
          kids.forEach(function (v, i) {
            if (v.inside) return;
            if (v.delay > 0) { v.delay -= dt; return; }
            if (st === "home") { v.onSwing = false; if (walkV(v, door.x, door.y, 52, dt)) v.inside = true; return; }
            if (i === SWINGER) {
              if (!v.onSwing && walkV(v, piv.x, piv.y + RL, 40, dt)) v.onSwing = true;
              if (v.onSwing) { v.x = piv.x + Math.sin(th) * RL; v.y = piv.y + Math.cos(th) * RL; v.face = Math.cos(k * 2.2) > 0 ? 1 : -1; v.moving = false;
                if (Math.abs(th) > 0.62 && Math.random() < dt * 0.4) { v.happy = 0.6; if (Math.random() < 0.3) say("wheee!", sw.x, sw.y - 124); } }
              return;
            }
            if (v.pause > 0) { v.pause -= dt; v.moving = false; return; }
            var chaser = kids[it];
            if (i === it) {
              var prey = null, bd = 1e9;
              kids.forEach(function (o, j) { if (j !== it && j !== SWINGER && !o.inside && o.delay <= 0) { var dd = dist(o, v); if (dd < bd) { bd = dd; prey = o; } } });
              if (prey) { walkV(v, prey.x, prey.y, 50, dt);
                if (bd < 15) { it = kids.indexOf(prey); prey.pause = 0.9; prey.happy = 0.9; v.happy = 1; say("tag!", prey.x, prey.y - 34); } }
            } else if (dist(v, chaser) < 70 && chaser.pause <= 0) {
              var ax = v.x - chaser.x, ay = v.y - chaser.y, al = Math.sqrt(ax * ax + ay * ay) || 1;
              walkV(v, clamp(v.x + ax / al * 40, X0, X1), clamp(v.y + ay / al * 40, Y0, Y1), 46, dt);
            } else if (walkV(v, v.tx, v.ty, 26, dt)) { var p = yard(); v.tx = p.x; v.ty = p.y; }
          });
          if (st === "home" && kids.every(function (v) { return v.inside; })) { st = "in"; t = rand(50, 90); }
        },
        draw: function (time, asleep) {
          var ba = bell > 0 ? Math.sin(bell * 14) * 0.5 : 0;
          ctx.save(); ctx.translate(s.x, s.y - 122); ctx.rotate(ba); ctx.fillStyle = "#E8B33C";
          ctx.beginPath(); ctx.moveTo(-6, 8); ctx.quadraticCurveTo(-6, -4, 0, -4); ctx.quadraticCurveTo(6, -4, 6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
          var sx = piv.x + Math.sin(th) * RL, sy = piv.y + Math.cos(th) * RL, c = Math.cos(th), sn = Math.sin(th);
          ctx.drawImage(SHADOW, sx - 18, sw.y - 6, 36, 10);
          ctx.strokeStyle = "#7A6A58"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(piv.x - 12, piv.y); ctx.lineTo(sx - 12 * c, sy + 12 * sn); ctx.moveTo(piv.x + 12, piv.y); ctx.lineTo(sx + 12 * c, sy - 12 * sn); ctx.stroke();
          var out = kids.filter(function (v) { return !v.inside && v.delay <= 0; }).sort(function (a, b) { return a.y - b.y; });
          out.forEach(function (v) { drawV(v, asleep, v.onSwing); });
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(-th); ctx.fillStyle = "#B98A5C"; ctx.fillRect(-15, -2, 30, 5); ctx.restore();
        } });
    })();

    // Woodcutter: chop, stack, carry logs to the bakery, see off foxes.
    (function () {
      var w = L.wood, home = { x: DOORS.wood.x, y: DOORS.wood.y }, v = mkV("#BCD98A", "beanie", home.x, home.y), sw = rand(0, 1), chops = 0, pile = 3, away = false;
      var g = { layer: "back", v: v, mode: "work",
        update: function (dt, asleep) {
          if (asleep || away) return;
          tickV(v, dt);
          if (g.mode === "shoo") { shoo(g, dt); return; }
          if (g.mode === "home") { if (walkV(v, home.x, home.y, 44, dt)) g.mode = "work"; return; }
          lookForFox(g, dt);
          v.face = 1; sw += dt / 1.1;
          if (sw >= 1) { sw = 0; chops++; puff("chip", w.x, w.y - 18, 3, "#D9B27A");
            if (chops >= 4) { chops = 0; pile = Math.min(6, pile + 1); } }
          if (pile >= 4 && TRADE.wood <= 3 && nightness < 0.35) { pile -= 3; away = true;
            errand(DOORS.wood, DOORS.bakeryside, { col: "#BCD98A", hat: "beanie", carry: ICON.log, speed: 26 }, function (wk) {
              TRADE.wood = Math.min(6, TRADE.wood + 3); wk.v.happy = 1.5;
              leg(wk, route(DOORS.bakeryside, DOORS.wood), function () { away = false; v.x = home.x; v.y = home.y; });
            }); }
        },
        draw: function (time, asleep) {
          for (var i = 0; i < pile; i++) { var x = w.x + 36 + (i % 3) * 13 + (i >= 3 ? 6.5 : 0), y = w.y - 6 - (i >= 3 ? 11 : 0);
            ctx.fillStyle = "#8A5A36"; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
            ctx.fillStyle = "#E2C08E"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
          if (away) return;
          drawV(v, asleep);
          if (g.mode === "work" && !asleep) {
            var a = sw < 0.7 ? -0.3 - 2.0 * (sw / 0.7) : -2.3 + 2.1 * ((sw - 0.7) / 0.3);
            var hx = v.x + 8, hy = v.y - v.r * 0.9 * depth(v.y), ex = hx + Math.cos(a) * 26, ey = hy + Math.sin(a) * 26;
            ctx.strokeStyle = "#8D6440"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = "#9AA3AD"; ctx.fillRect(-4, -7, 8, 11); ctx.restore();
          }
        } };
      S.push(g);
    })();

    // Washing line: taken in for rain and for the night, hung out again after.
    (function () {
      var s = L.wash, hung = 5, st = "idle", t = 0, washer = null;
      var CL = [["#E86A5B", "shirt"], ["#FFFFFF", "sock"], ["#6C8FD0", "dress"], ["#F3DE7C", "shirt"], ["#E68AB0", "sock"]];
      function want() { return WX.rain > 0.2 || nightness > 0.45 ? 0 : 5; }
      S.push({ layer: "back",
        update: function (dt, asleep) {
          if (st === "idle") { if (want() !== hung && !asleep) { st = "go";
              errand(DOORS.cottage, DOORS.wash, { col: "#EDB3A8", hat: "none", speed: WX.rain > 0.2 ? 48 : 28 }, function (w) { st = "work"; t = 0.4; washer = w; }); } }
          else if (st === "work") { t -= dt; if (t < 0) { t = 0.5; washer.v.face = 1; washer.v.happy = 0.3;
              var n = want(); if (hung > n) hung--; else if (hung < n) hung++;
              else { st = "back"; leg(washer, route(DOORS.wash, DOORS.cottage), function () { st = "idle"; }); } } }
        },
        draw: function (time) {
          var x0 = s.x - 63, x1 = s.x + 64, ly = s.y - 66, wind = 0.1 + WX.rain * 0.35 + WX.wind * 0.3, lean = -WX.wind * 0.55;
          ctx.strokeStyle = "rgba(90,80,70,.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, ly); ctx.quadraticCurveTo(s.x, ly + 12, x1, ly); ctx.stroke();
          for (var i = 0; i < hung; i++) { var cx = x0 + 16 + i * 24, cy = ly + 3 + 10 * (1 - Math.pow((cx - s.x) / 64, 2)) * 0.5, c = CL[i];
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(lean + Math.sin(time * (2 + 4 * WX.wind) + i) * wind); ctx.fillStyle = c[0];
            if (c[1] === "shirt") { ctx.fillRect(-9, 0, 18, 18); ctx.fillRect(-13, 0, 26, 7); }
            else if (c[1] === "dress") { ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(11, 22); ctx.lineTo(-11, 22); ctx.closePath(); ctx.fill(); }
            else { ctx.fillRect(-3, 0, 6, 14); ctx.fillRect(-3, 10, 10, 5); }
            ctx.fillStyle = "#C8A26A"; ctx.fillRect(-1.5, -2, 3, 4); ctx.restore(); }
        } });
    })();

    // Vegetable patch: water each plant in turn, pull the carrots that are ready, shoo foxes.
    (function () {
      var gd = L.garden, v = mkV("#D9C6A5", "straw", gd.x - 76, gd.y + 20), plants = [rand(0, 0.9), rand(0, 0.6), 1, rand(0, 0.9)], i = 0, st = "walk", t = 0, carrots = 2;
      function px(n) { return gd.x - 60 + n * 40; }
      var g = { layer: "front", v: v, mode: "work",
        update: function (dt, asleep) {
          if (asleep) return;
          tickV(v, dt);
          if (g.mode === "shoo") { shoo(g, dt); return; }
          if (g.mode === "home") { if (walkV(v, px(i) - 16, gd.y + 20, 44, dt)) { g.mode = "work"; st = "walk"; } return; }
          lookForFox(g, dt);
          for (var n = 0; n < 4; n++) if (n !== i) plants[n] = Math.min(1, plants[n] + dt * 0.004);
          if (st === "walk") { if (walkV(v, px(i) - 16, gd.y + 20, 20, dt)) { v.face = 1;
              if (plants[i] >= 1) { st = "pick"; t = 1.2; v.happy = 1.5; } else { st = "water"; t = rand(2, 3); } } }
          else if (st === "water") { t -= dt; plants[i] = Math.min(1, plants[i] + dt * 0.14);
            if (Math.random() < dt * 10) parts.push({ kind: "drop", x: v.x + 24, y: v.y - v.r * 1.1, vx: rand(10, 30), vy: rand(-20, 0), life: 0.5, max: 0.5 });
            if (t < 0) { i = (i + 1) % 4; st = "walk"; } }
          else { t -= dt; if (t < 0) { plants[i] = 0; carrots = carrots % 5 + 1; puff("heart", v.x, v.y - v.r * 2.2, 1, "#FF9F43"); i = (i + 1) % 4; st = "walk"; } }
        },
        draw: function (time, asleep) {
          for (var n = 0; n < 4; n++) sprout(px(n), gd.y - 4, plants[n]);
          for (var c = 0; c < carrots; c++) blit(ICON.carrot, gd.x + 100 + c * 4, gd.y + 6, 1, 1, 1, 1);
          ctx.fillStyle = "#C8955A"; ctx.beginPath(); ctx.ellipse(gd.x + 108, gd.y - 4, 18, 14, 0, 0, Math.PI); ctx.fill();
          ctx.strokeStyle = "#9A6C3C"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gd.x + 90, gd.y - 4); ctx.lineTo(gd.x + 126, gd.y - 4); ctx.stroke();
          drawV(v, asleep);
          if (st === "water" && g.mode === "work" && !asleep) { var cx = v.x + 12, cy = v.y - v.r * 1.0;
            ctx.fillStyle = "#7FA7C9"; rr(ctx, cx - 2, cy - 6, 14, 11, 3); ctx.fill();
            ctx.strokeStyle = "#7FA7C9"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 10, cy - 4); ctx.lineTo(cx + 18, cy - 10); ctx.stroke(); }
        } };
      S.push(g);
    })();

    // Bandstand: a trio plays sets; anything idle nearby dances.
    (function () {
      var b = L.band, trio = [mkV("#C9DDB0", "cap", b.x - 38, b.y - 6), mkV("#F7CFD8", "none", b.x, b.y - 10), mkV("#E4B363", "beanie2", b.x + 38, b.y - 6)];
      trio[0].face = 1; trio[2].face = -1;
      var play = true, t = rand(40, 60), note = 0, k = 0, bub = null, bubT = 0, who = 0;
      S.push({ layer: "front",
        update: function (dt, asleep) {
          trio.forEach(function (v) { tickV(v, dt); }); DANCE = null; bubT -= dt;
          if (asleep) return;
          t -= dt; if (t < 0) { play = !play; t = play ? rand(40, 70) : rand(12, 20); if (!play) say("thank you!", b.x, b.y - 150); }
          if (PARTY_T > 0.5 || MUSIC.on) { play = true; t = Math.max(t, 5); }            // no breaks while the speaker plays
          if (play && (WX.rain < 0.6 || MUSIC_T > 0.5)) { k += dt; DANCE = { x: b.x, y: b.y - 30, r: 230, k: k };   // under the canopy, the music carries on in the rain
            note -= dt; if (note < 0) { note = MUSIC_T > 0.5 ? rand(0.1, 0.25) : rand(0.25, 0.6); var v = pick(trio);
              parts.push({ kind: "note", x: v.x + rand(-6, 6), y: v.y - 44, vx: rand(-12, 12), vy: -32, life: 1.6, max: 1.6, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A"]) }); } }
          else if (bubT <= 0 && Math.random() < dt * 0.5) { who = (who + 1) % 3; bub = pick([BUBS.ha, BUBS.dots, BUBS.heart, BUBS.note]); bubT = 1.5; trio[who].happy = 1; }
        },
        draw: function (time, asleep) {
          var beat = DANCE ? Math.sin(DANCE.k * 7) : 0, m = asleep || !DANCE ? 0 : MUSIC_T * (1 - PARTY_T);   // m: the speaker's playing, so they go big
          trio.forEach(function (v, i) {
            var bt = DANCE ? Math.sin(DANCE.k * 7 + i) : 0, sy = 1 + (DANCE ? (0.05 + 0.07 * m) * bt : 0);
            var hop = m * Math.max(0, bt) * 8, rot = m * 0.13 * (DANCE ? Math.sin(DANCE.k * 3.5 + i * 1.7) : 0);
            var spr = asleep ? v.spr.shut : DANCE || v.happy > 0 ? v.spr.happy : v.blinkT > 0 ? v.spr.shut : v.spr.open, sc = depth(v.y);
            blit(spr, v.x, v.y - hop, v.face, 1 / sy, sy, sc, rot);
            var hy = v.y - v.r * 0.9 * sc - hop, sw = beat * (1 + 1.4 * m);
            if (i === 0) { ctx.fillStyle = "#9C5B2E"; ctx.beginPath(); ctx.ellipse(v.x + 12, hy + 2, 5, 8, 0.6, 0, 7); ctx.fill();
              ctx.strokeStyle = "#E2C08E"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(v.x + 4 + sw * 4, hy - 8); ctx.lineTo(v.x + 22 + sw * 4, hy + 8); ctx.stroke(); }
            else if (i === 1) { ctx.fillStyle = "#D9534F"; ctx.fillRect(v.x - 11, hy + 4, 22, 13); ctx.fillStyle = "#FFF4E8"; ctx.beginPath(); ctx.ellipse(v.x, hy + 4, 11, 3.5, 0, 0, 7); ctx.fill();
              ctx.strokeStyle = "#8D6440"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(v.x - 7, hy + 3); ctx.lineTo(v.x - 12, hy - 7 - Math.max(0, sw) * 5);
              ctx.moveTo(v.x + 7, hy + 3); ctx.lineTo(v.x + 12, hy - 7 - Math.max(0, -sw) * 5); ctx.stroke(); }
            else { var hb = m * 8 * bt; ctx.fillStyle = "#E8B33C"; ctx.beginPath(); ctx.moveTo(v.x - 6, hy); ctx.lineTo(v.x - 22, hy - 7 - hb); ctx.lineTo(v.x - 22, hy + 7 - hb); ctx.closePath(); ctx.fill(); }
          });
          if (bubT > 0 && bub) blit(bub, trio[who].x + 12, trio[who].y - 42, 1, 1, 1, 1);
        } });
    })();

    // Ball game: two against two, passes, the odd goal.
    (function () {
      var p = L.pitch, X0 = p.x - 96, X1 = p.x + 96, Y0 = p.y - 22, Y1 = p.y + 22;
      var pl = [["#F6C28B", "beanie", -60, -10], ["#F3DE7C", "beanie", -34, 14], ["#C9DDB0", "beanie2", 38, -12], ["#E8C3A0", "beanie2", 62, 12]].map(function (a, i) {
        var v = mkV(a[0], a[1], p.x + a[2], p.y + a[3], 13); v.team = i < 2 ? 0 : 1; v.home = { x: v.x, y: v.y }; v.drift = null; return v; });
      var ball = { x: p.x, y: p.y, fx: p.x, fy: p.y, tx: p.x, ty: p.y, k: 1, dur: 1, h: 0, to: null, goal: false }, wait = 1.5, lastKick = null;
      function nearestTo(x, y) { var best = null, bd = 1e9; pl.forEach(function (v) { var d = Math.abs(v.x - x) + Math.abs(v.y - y); if (d < bd) { bd = d; best = v; } }); return best; }
      function kick(from) {
        var goal = Math.random() < 0.22, mates = pl.filter(function (o) { return o !== from; }), to = pick(mates);
        ball.fx = ball.x; ball.fy = ball.y; ball.goal = goal; lastKick = from;
        if (goal) { ball.tx = from.team ? X0 - 10 : X1 + 10; ball.ty = p.y + rand(-9, 9); ball.to = null; }
        else { ball.tx = clamp(to.x + rand(-18, 18), X0 + 6, X1 - 6); ball.ty = clamp(to.y + rand(-8, 8), Y0, Y1); ball.to = to; }
        ball.k = 0; ball.h = rand(6, 20); ball.dur = Math.sqrt(Math.pow(ball.tx - ball.fx, 2) + Math.pow(ball.ty - ball.fy, 2)) / 120 + 0.25;
        from.happy = 0.4;
      }
      S.push({ layer: "front",
        update: function (dt, asleep) {
          pl.forEach(function (v) { tickV(v, dt); });
          if (asleep || WX.storm > 0.5) return;            // the game stops for thunder
          if (ball.k < 1) { ball.k = Math.min(1, ball.k + dt / ball.dur); ball.x = ball.fx + (ball.tx - ball.fx) * ball.k; ball.y = ball.fy + (ball.ty - ball.fy) * ball.k;
            if (ball.k >= 1) { if (ball.goal) { say("goal!", ball.x, ball.y - 30); pl.forEach(function (v) { if (v.team === lastKick.team) v.happy = 2.2; }); wait = 2.4; } else wait = 0.3; } }
          else { wait -= dt;
            if (wait < 0) { if (ball.goal) { ball.x = p.x; ball.y = p.y; ball.goal = false; kick(nearestTo(p.x, p.y)); }
              else { var k = nearestTo(ball.x, ball.y); if (Math.abs(k.x - ball.x) + Math.abs(k.y - ball.y) < 18) kick(k); } } }
          var chaser = ball.goal ? null : ball.k < 1 ? ball.to : nearestTo(ball.x, ball.y);
          pl.forEach(function (v) {
            if (v === chaser) walkV(v, ball.k < 1 ? ball.tx - (v.team ? -8 : 8) : ball.x - (v.team ? -8 : 8), ball.k < 1 ? ball.ty : ball.y, 56, dt);
            else { if (!v.drift || walkV(v, v.drift.x, v.drift.y, 20, dt)) v.drift = { x: clamp(v.home.x + rand(-30, 30), X0, X1), y: clamp(v.home.y + rand(-10, 10), Y0, Y1) };
              if (!v.moving) v.face = ball.x > v.x ? 1 : -1; }
          });
        },
        draw: function (time, asleep) {
          if (WX.storm > 0.5) return;                      // indoors in a thunderstorm
          pl.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (v) { drawV(v, asleep); });
          var hh = Math.sin(ball.k * Math.PI) * ball.h;
          ctx.fillStyle = "rgba(30,70,40,.25)"; ctx.beginPath(); ctx.ellipse(ball.x, ball.y + 2, 5, 2, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(ball.x, ball.y - 3 - hh, 4.5, 0, 7); ctx.fill();
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ball.x + 1, ball.y - 4 - hh, 1.6, 0, 7); ctx.fill();
        } });
    })();

    // Pond: a duck and her ducklings paddling in a line, and a fisher on the bank.
    (function () {
      var f = L.fish, v = mkV("#E4B363", "bucket", f.x, f.y), st = "wait", t = rand(4, 10), fishes = 1, arc = 0, boot = false, k = 0, bx = f.x - 32, by = f.y + 6;
      var duck = { th: rand(0, 6), pause: 0 };
      function dpos(th) { return { x: POND.x + Math.cos(th) * POND.rx * 0.62, y: POND.y + Math.sin(th) * POND.ry * 0.42 }; }
      S.push({ layer: "front",
        update: function (dt, asleep) {
          tickV(v, dt); k += dt;
          if (!asleep) { if (duck.pause > 0) duck.pause -= dt; else { duck.th += dt * 0.11; if (Math.random() < dt * 0.04) duck.pause = rand(1.5, 3); }
          }
          if (asleep) { st = "wait"; return; }
          t -= dt;
          if (st === "wait") { if (t < 0) { st = "bite"; t = 1.3; say("!", v.x, v.y - v.r * 2.4); } }
          else if (st === "bite") { if (t < 0) { st = "reel"; arc = 0; boot = Math.random() < 0.2; } }
          else { arc += dt / 0.9;
            if (arc >= 1) { st = "wait"; t = rand(8, 18);
              if (boot) say("?", v.x, v.y - v.r * 2.4);
              else { fishes = fishes % 4 + 1; v.happy = 2.2; puff("heart", v.x, v.y - v.r * 2.2, 2, "#FF7FA0"); } } }
        },
        draw: function (time, asleep) {
          // ducks: the ducklings paddle in a line behind her, each a little further back round the pond
          var dp = dpos(duck.th), dir = -Math.sin(duck.th) >= 0 ? 1 : -1;
          for (var n = 3; n >= 1; n--) { var q = dpos(duck.th - n * 0.19 - Math.sin(time * 1.3 + n) * 0.02);
            blit(ICON.duckling, q.x, q.y + Math.sin(time * 3 + n) * 0.8, -Math.sin(duck.th - n * 0.19) >= 0 ? 1 : -1, 1, 1, 1); }
          ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(dp.x, dp.y, 16, 3, 0, 0, 7); ctx.stroke();
          blit(ICON.duck, dp.x, dp.y + Math.sin(time * 2) * 1, dir, 1, 1, 1, duck.pause > 0 && duck.pause < 1.2 && !asleep ? -dir * 0.7 : 0);
          // fisher
          var bob = { x: f.bx, y: f.by + (st === "bite" ? 4 + 2 * Math.sin(k * 25) : Math.sin(time * 2) * 1.5) };
          ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(f.bx, f.by + 3, st === "bite" ? 14 : 9 + Math.sin(time * 2) * 2, 3.5, 0, 0, 7); ctx.stroke();
          ctx.fillStyle = "#F59E5B";
          for (var i = 0; i < fishes; i++) { var tx = bx - 6 + i * 4; ctx.beginPath(); ctx.moveTo(tx, by - 16); ctx.lineTo(tx - 3, by - 22); ctx.lineTo(tx + 3, by - 22); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = "#8FA6B8"; ctx.beginPath(); ctx.moveTo(bx - 10, by - 16); ctx.lineTo(bx + 10, by - 16); ctx.lineTo(bx + 8, by); ctx.lineTo(bx - 8, by); ctx.closePath(); ctx.fill();
          drawV(v, asleep);
          var bend = st !== "wait", sc = depth(v.y), hx = v.x + 8, hy = v.y - v.r * 0.8 * sc;
          var tip = { x: hx + (bend ? 46 : 38), y: hy - (bend ? 26 : 44) };
          ctx.strokeStyle = "#7A5A3A"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + 26, hy - (bend ? 36 : 30), tip.x, tip.y); ctx.stroke();
          var end = bob;
          if (st === "reel") end = { x: f.bx + (bx - f.bx) * arc, y: f.by + (by - 20 - f.by) * arc - Math.sin(arc * Math.PI) * 80 };
          ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(end.x, end.y); ctx.stroke();
          if (st === "reel") blit(boot ? ICON.boot : ICON.fish, end.x, end.y + 8, -1, 1, 1, 1);
          else { ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(bob.x, bob.y, 4, 0, 7); ctx.fill();
            ctx.fillStyle = "#E0474C"; ctx.beginPath(); ctx.arc(bob.x, bob.y, 4, Math.PI, 0); ctx.fill(); }
        } });
    })();

    return S;
  }

  // Weather layers: the rainbow sits in the sky only; rain and its tint go over everything.
  function drawRainbow() {
    if (WX.bow <= 0.01) return;
    var cx = W * 0.55, cy = HZ + 30, r0 = 230, cols = ["#E86A5B", "#F4A340", "#F3DE7C", "#7BC47F", "#6C8FD0", "#9A72C8"];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HZ - 22); ctx.clip();
    ctx.globalAlpha = 0.42 * WX.bow; ctx.lineWidth = 7;
    for (var i = 0; i < cols.length; i++) { ctx.strokeStyle = cols[i]; ctx.beginPath(); ctx.arc(cx, cy, r0 - i * 7, Math.PI, 0); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // ── Real weather ────────────────────────────────────────────────────────────
  // weather.forecast_home (met.no) sets the scene: its condition picks the mode, its
  // wind speed the wind, its temperature the readout by the clock. sun.sun sets how
  // dark it is. Without a weather entity the old random showers carry on, and the
  // corner says so.
  // The rain sensor (SENSORS.rain) adds rain met.no misses: on 2026-10-03 met.no said
  // cloudy through three hours of drizzle the sensor caught. It never takes rain
  // away, because the same day it missed showers you could see from the window. RAIN is "raining",
  // "none", or null when the sensor is unknown, unavailable or unread.
  var RAIN = null;
  var DARK = 0, FOGSPR = null, SNOWMAN = null, BUNTING = null, CAKE = null, BALLOONS = [], FW = [], ROCKETS = [];
  var WMAP = { "sunny": "clear", "clear-night": "clear", "partlycloudy": "partly", "cloudy": "cloudy", "fog": "fog",
    "rainy": "rain", "snowy": "snow", "snowy-rainy": "snow", "pouring": "storm", "lightning": "storm",
    "lightning-rainy": "storm", "hail": "storm", "exceptional": "storm", "windy": "windy", "windy-variant": "windy" };
  var WTARGET = { clear: [0.1, 0, 0, 0, 0], partly: [0.45, 0, 0, 0, 0], cloudy: [0.9, 0, 0, 0, 0], rain: [0.9, 1, 0, 0, 0],
    storm: [1, 1, 1, 0, 0], fog: [0.6, 0, 0, 1, 0], snow: [0.8, 0, 0, 0, 1], windy: [0.45, 0, 0, 0, 0] };   // cloud, rain, storm, fog, snow

  function weatherNow() {
    if (WFORCE) return { mode: WFORCE === "sunny" ? "clear" : WFORCE, wind: WFORCE === "windy" ? 1 : WFORCE === "storm" ? 0.7 : 0.1, temp: 12, test: true };
    var w = DATA.weather, ok = w && w.state && w.state !== "unavailable" && w.state !== "unknown";
    if (!ok && !RAIN) return null;
    var a = ok ? w.attributes || {} : {}, mode = ok ? WMAP[w.state] || "clear" : "cloudy", ws = +a.wind_speed || 0;
    if (a.wind_speed_unit === "m/s") ws *= 3.6; else if (a.wind_speed_unit === "mph") ws *= 1.61;
    var wind = clamp((ws - 15) / 35, 0, 1); if (mode === "windy") wind = Math.max(wind, 0.8);
    if (RAIN === "raining" && !/^(rain|storm|snow)$/.test(mode)) mode = "rain";   // keeps met.no's storm or snow
    return { mode: mode, wind: wind, temp: a.temperature, unit: a.temperature_unit || "°C" };
  }
  // How dark it is, from sun.sun: dusk starts ten minutes before sunset and is full
  // dark 45 minutes after; dawn mirrors it. Fixed hours only if sun.sun is missing.
  function darkness(d) {
    var s = DATA.sun, t = d.getTime();
    if (!s || !s.next_setting || !s.next_rising) return sleepCurve(d, 20.5);
    var set = new Date(s.next_setting).getTime(), rise = new Date(s.next_rising).getTime(), DAY = 864e5, M = 60000;
    while (set - t > DAY * 0.8) set -= DAY; while (t - set > DAY * 0.8) set += DAY;          // today's sunset
    while (rise - t > DAY * 0.5) rise -= DAY; while (t - rise > DAY * 0.5) rise += DAY;       // nearest sunrise
    if (t >= set - 10 * M) return clamp((t - (set - 10 * M)) / (55 * M), 0, 1);
    if (t <= rise + 10 * M) return clamp(((rise + 10 * M) - t) / (55 * M), 0, 1);
    return 0;
  }
  // Bedtime, by the clock: sleepy from an hour before, asleep until 06:30.
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
    if (wm) { T = WTARGET[wm.mode] || WTARGET.clear; WX.windT = wm.wind; WX.temp = wm.temp; WX.unit = wm.unit; WX.mode = wm.mode; WX.test = wm.test; }
    else {                                                // fallback: the old random showers
      WX.t -= dt;
      if (WX.st === "dry") { if (WX.t < 0) { WX.st = "rain"; WX.t = rand(50, 80); } }
      else if (WX.t < 0) { WX.st = "dry"; WX.t = rand(600, 1500); }
      T = WX.st === "rain" ? WTARGET.rain : WTARGET.partly; WX.windT = 0.1; WX.mode = WX.st === "rain" ? "rain" : "partly";
    }
    var k = Math.min(1, dt / 5);
    WX.cloud += (T[0] - WX.cloud) * k; WX.rain += (T[1] - WX.rain) * k; WX.storm += (T[2] - WX.storm) * k;
    WX.fog += (T[3] - WX.fog) * k; WX.snow += (T[4] - WX.snow) * k; WX.wind += (WX.windT - WX.wind) * k;
    // a rainbow when the rain stops in daylight
    if (WX.wasRain && T[1] === 0 && T[4] === 0 && DARK < 0.3) WX.bowT = 60;
    WX.wasRain = T[1] > 0; WX.bowT = (WX.bowT || 0) - dt;
    WX.bow = clamp(WX.bow + (WX.bowT > 5 ? dt / 3 : -dt / 5), 0, 1);
    // lightning
    if (WX.storm > 0.6) { WX.flashT = (WX.flashT || 3) - dt; if (WX.flashT < 0) { WX.flash = 1; WX.flashT = rand(5, 14); WX.bolt = bolt(); } }
    WX.flash = Math.max(0, (WX.flash || 0) - dt * 3.2);
    var i, p, slant = 80 + 280 * WX.wind;
    if (WX.rain > 0.01) for (i = 0; i < WX.drops.length; i++) { p = WX.drops[i]; p.y += 560 * p.s * dt; p.x -= slant * dt;
      if (p.y > H) { p.y -= H + 20; p.x = rand(0, W + 200); } if (p.x < -40) p.x += W + 80; }
    if (WX.snow > 0.01) for (i = 0; i < WX.flakes.length; i++) { p = WX.flakes[i]; p.y += (30 + 30 * p.s) * dt; p.x += (Math.sin(clockT * 1.3 + p.ph) * 18 - 60 * WX.wind) * dt;
      if (p.y > H) { p.y = -5; p.x = rand(0, W); } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; }
    // wind: leaves blowing through, and now and then someone's hat
    if (INDOOR) return;
    if (WX.wind > 0.35 && Math.random() < dt * WX.wind * 5)
      parts.push({ kind: "leaf", x: W + 10, y: rand(HZ, H - 40), vx: -rand(140, 260) * WX.wind, vy: rand(-20, 20), life: 7, max: 7, ph: rand(0, 6), col: pick(["#6FB673", "#9CCB6A", "#D9B04A"]) });
    if (WX.wind > 0.6 && Math.random() < dt * 0.05 && WALKERS.length) {
      var w = pick(WALKERS); say("!", w.v.x, w.v.y - 46);
      parts.push({ kind: "hat", x: w.v.x, y: w.v.y - w.v.r * 2, vx: -rand(120, 180), vy: -60, life: 4, max: 4, ph: 0, col: pick(["#D9534F", "#6C8FD0", "#EDCB74"]) });
    }
  }
  function bolt() { var x = rand(W * 0.3, W * 0.9), y = 0, pts = [[x, y]]; while (y < HZ - 20) { y += rand(18, 32); x += rand(-22, 22); pts.push([x, y]); } return pts; }

  function makeWeatherSprites() {
    // mist: soft white blobs baked into one wide strip, tiled and drifted
    FOGSPR = canvas(W, 200); var g = FOGSPR.getContext("2d");
    for (var i = 0; i < 14; i++) { var x = rand(0, W), y = rand(60, 140), r = rand(90, 170), gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(240,244,248,.55)"); gr.addColorStop(1, "rgba(240,244,248,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    SNOWMAN = icon(54, 78, function (g) {
      rimmed(g, "#B8C4D0", "#FBFDFF", 1.5, function (e) { g.beginPath(); g.arc(27, 56, 20 + e, 0, 7); g.fill(); g.beginPath(); g.arc(27, 28, 14 + e, 0, 7); g.fill(); });
      g.fillStyle = INK; [[22, 25], [32, 25], [27, 50], [27, 58], [27, 66]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 1.8, 0, 7); g.fill(); });
      g.fillStyle = "#F28C38"; g.beginPath(); g.moveTo(27, 29); g.lineTo(38, 31); g.lineTo(27, 32); g.closePath(); g.fill();
      g.fillStyle = "#D9534F"; g.fillRect(14, 38, 26, 5); g.fillRect(34, 38, 5, 12);
      g.fillStyle = "#2B2433"; g.fillRect(18, 12, 18, 4); g.fillRect(21, 0, 12, 13);
      g.strokeStyle = "#7A5238"; g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(8, 50); g.lineTo(0, 40); g.moveTo(46, 50); g.lineTo(54, 42); g.stroke(); });
    SV.sprites.snowman = SNOWMAN; SV.sprites.glow = GLOW;
    // party props: the bunting, cake and balloons hang on the village
    var cols = ["#E86A5B", "#F3DE7C", "#6C8FD0", "#7BC47F", "#E68AB0", "#F4A340"];
    if (VIL) {
      var L = LAY, B = L.B;
      BUNTING = canvas(W * K, 90 * K); g = BUNTING.getContext("2d"); g.scale(K, K);
      [[L.pub.x + 66, L.bakery.x - 62], [L.bakery.x + 62, L.post.x - 50], [L.post.x + 50, L.market.x - 70], [L.market.x + 70, L.cottage.x - 46], [L.cottage.x + 46, L.mill.x - 30]].forEach(function (s) {
        var x0 = s[0], x1 = s[1], y0 = 34, sag = 22, n = Math.max(3, Math.floor((x1 - x0) / 18));
        g.strokeStyle = "rgba(90,80,70,.8)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0); g.stroke();
        for (var i2 = 0; i2 < n; i2++) { var u = (i2 + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + sag * 4 * u * (1 - u) * 1;
          g.fillStyle = cols[i2 % cols.length]; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x, y + 13); g.closePath(); g.fill(); } });
      CAKE = icon(50, 56, function (g) {
        g.fillStyle = "#C69C6D"; g.fillRect(4, 50, 42, 5);
        rimmed(g, "#C98AA0", "#FBE3EC", 1.2, function (e) { rr(g, 6 - e, 30 - e, 38 + 2 * e, 20 + 2 * e, 5); g.fill(); rr(g, 12 - e, 16 - e, 26 + 2 * e, 16 + 2 * e, 5); g.fill(); });
        g.fillStyle = "#FFFFFF"; [8, 14, 20, 26, 32, 38].forEach(function (x) { g.beginPath(); g.arc(x, 30, 3, 0, Math.PI); g.fill(); });
        g.fillStyle = "#E86A5B"; [16, 25, 34].forEach(function (x) { g.beginPath(); g.arc(x, 24, 2, 0, 7); g.fill(); });
        ["#6C8FD0", "#F3DE7C", "#7BC47F"].forEach(function (c, i) { g.fillStyle = c; g.fillRect(17 + i * 7, 6, 3, 10); });
      });
      BALLOONS = [[L.band.x - 70, L.band.y - 92], [L.band.x - 26, L.band.y - 92], [L.band.x + 26, L.band.y - 92], [L.band.x + 70, L.band.y - 92],
        [L.market.x - 60, B - 86], [L.market.x + 60, B - 86], [L.bakery.x + 70, B - 80]].map(function (a, i) {
          return { x: a[0], y: a[1], ph: rand(0, 6), col: cols[i % cols.length], len: rand(26, 40) }; });

    } else { BUNTING = null; BALLOONS = []; }
    makePartySprites(cols);
  }
  // Lying snow and the like belong to the scene: it knows where its ground is.
  function drawWeatherGround() {
    if (SCENE.weather && SCENE.weather.ground) SCENE.weather.ground(ctx, SV, WX);
  }
  function drawWeatherSky(time) {
    if (WX.cloud > 0.3) { ctx.globalAlpha = clamp((WX.cloud - 0.3) * 1.4, 0, 1) * 0.9;                // extra, greyer clouds
      for (var i = 0; i < CLOUDS.length; i++) { var c = CLOUDS[i], x = (c.x + W * 0.45) % (W + 260) - 130; ctx.drawImage(c.c, x, c.y + 30 - i * 8); }
      ctx.globalAlpha = 1; }
  }
  function drawWeatherFront(time) {
    var i;
    if (INDOOR) return;
    if (WX.cloud > 0.35) { ctx.fillStyle = "rgba(80,92,112," + (0.16 * (WX.cloud - 0.35) / 0.65).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    if (WX.fog > 0.02) {                                   // low mist, three drifting layers
      ctx.globalAlpha = 0.7 * WX.fog;                     // thin enough that the family still reads through it
      [[H - 330, 12], [H - 230, 20], [H - 130, 30]].forEach(function (l, n) { var off = (time * l[1]) % W;
        ctx.drawImage(FOGSPR, -off, l[0], W, 200); ctx.drawImage(FOGSPR, W - off, l[0], W, 200); });
      ctx.globalAlpha = 1; ctx.fillStyle = "rgba(236,240,244," + (0.16 * WX.fog).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    if (WX.rain > 0.01) {
      var heavy = WX.storm;
      ctx.fillStyle = "rgba(60,70,92," + (0.2 * WX.rain + 0.18 * heavy).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(225,235,255," + (0.55 * WX.rain).toFixed(3) + ")"; ctx.lineWidth = 1.3; ctx.beginPath();
      var n = Math.round(WX.drops.length * WX.rain * (0.6 + 0.4 * heavy)), dx = 4 + 14 * WX.wind;
      for (i = 0; i < n; i++) { var p = WX.drops[i]; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dx, p.y - 15); }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * WX.rain).toFixed(3) + ")"; ctx.beginPath();
      if (POND) for (i = 0; i < 5; i++) { var a = rand(0, 6.28), rr_ = rand(0.1, 0.8); ctx.moveTo(POND.x + Math.cos(a) * POND.rx * rr_ + 5, POND.y + Math.sin(a) * POND.ry * rr_ * 0.6);
        ctx.ellipse(POND.x + Math.cos(a) * POND.rx * rr_, POND.y + Math.sin(a) * POND.ry * rr_ * 0.6, 5, 1.6, 0, 0, 7); }
      ctx.stroke();
    }
    if (WX.snow > 0.01) { ctx.fillStyle = "rgba(255,255,255," + (0.9 * WX.snow).toFixed(3) + ")"; ctx.beginPath();
      var nf = Math.round(WX.flakes.length * WX.snow);
      for (i = 0; i < nf; i++) { var f = WX.flakes[i]; ctx.moveTo(f.x + 2 + f.s, f.y); ctx.arc(f.x, f.y, 2 + f.s, 0, 7); }
      ctx.fill(); }
    if (WX.flash > 0) {
      ctx.fillStyle = "rgba(235,240,255," + (0.45 * WX.flash).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H);
      if (WX.bolt && WX.flash > 0.4) { ctx.strokeStyle = "rgba(255,255,230," + WX.flash.toFixed(2) + ")"; ctx.lineWidth = 3; ctx.beginPath();
        WX.bolt.forEach(function (p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); }
    }
  }

  // ── Parties ────────────────────────────────────────────────────────────────
  // Two sizes of party, and a day can have both.
  // The rave (PARTY): a family birthday, the ANNIVERSARY couple's anniversary, Halloween, bonfire
  //   night, Christmas and New Year's Eve. Bunting across the village, hats on whoever
  //   it is for, the cake at the bandstand, and then the lot: a glitter ball over the
  //   road, lasers off the bandstand and the pitch, colour washes and ground spots on a
  //   128 bpm beat, the family bouncing to it, the road bouncing with them, fireworks
  //   once it is dark. Bedtime moves to 21:30 (see frame).
  // The house party (HOUSE): any other birthday on today's calendars, a friend's like
  //   "Pat's birthday", is a do at the cottage and stays there. Bunting on the roof,
  //   balloons by the door, the window lit in party colours, guests walking in with
  //   presents and out again full of cake, notes drifting from the window, and a card
  //   over the roof with the name. It does not move bedtime.
  // "King's birthday" and its like are nobody's party. Both start at the event's time
  // (17:00 for an all-day entry, never later than 17:00) and fade when the meadow goes
  // to sleep. Titles are matched as the calendars actually write them.
  // The countdown days (see Countdowns below) also throw parties without needing a
  //   calendar entry: a family birthday, Christmas, Halloween, bonfire night and New
  //   Year's Eve get the rave AND a do at the blue cottage; Easter and the end of term
  //   get the cottage only. All from 17:00.
  // Test hooks: ?party=parent%201 (a name from PEOPLE, or halloween|bonfire|christmas|anniversary|
  // new-years-eve) forces the rave; ?party=friend or ?party=friend:Pat forces the house
  // party; ?party=parent%201,friend forces both. ?date=2026-12-25&hour=18 is the real path: the
  // countdown list finds the day and both parties follow. Forced parties start at 17:00, so pair with
  // ?hour=18 (daylight) or ?hour=20.5 (dusk: lights up, fireworks). The demo data has
  // Pat's birthday today, so ?demo&hour=18 alone shows the house party. Headless Chrome
  // only runs a few frames before its screenshot, so add &warm=20 to see the fades
  // finished and the first guests through the door.
  var PARTY = null, PARTY_T = 0, HOUSE = null, HOUSE_T = 0, RAVE_W = 13.4;    // RAVE_W: the beat, rad/s (128 bpm)
  // Music: when the living-room speaker plays music the meadow dances along. Same moves as the
  // rave, smaller, at a fixed 120 bpm (Music Assistant gives Home Assistant no tempo), and no
  // lights. Notes drift from the cottage window. The rave wins when both are on.
  var MUSIC = { on: false, title: null, artist: null, at: null, err: null }, MUSIC_T = 0, MUSIC_W = 12.566, MUSIC_NOTE = 0;
  var SIGN = null, SIGN_KEY = "", SPECKS = [];
  var HP = { guest: 4, note: 0, card: null, key: "" }, HBAL = [], SPOTS = [], DISCO = null;
  function partyFor(title) {
    var t = String(title).trim(), all = PEOPLE.map(function (p) { return p.name; });
    if (/birthday|\bbday\b/i.test(t) && !/king/i.test(t)) {
      var p = PEOPLE.filter(function (q) { return q.name !== "House" && [q.name].concat(q.aliases || []).some(function (a) {
        return new RegExp("\\b" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t); }); })[0];
      return p ? { who: [p.name], label: "Happy birthday " + p.name + "!" } : null;
    }
    if (/^anniversary!?$/i.test(t) || (ANNIVERSARY.length && new RegExp("\\b(" + ANNIVERSARY.join("|") + ")\\b.*anniversary", "i").test(t)))
      return { who: ANNIVERSARY.slice(), label: "Happy anniversary, " + ANNIVERSARY.join(" and ") + "!" };
    if (/halloween/i.test(t)) return { who: all, label: "Happy Halloween!" };
    if (/guy fawkes|bonfire/i.test(t)) return { who: all, label: "Bonfire night!" };
    if (/christmas/i.test(t)) return { who: all, label: "Merry Christmas!" };
    if (/new year'?s eve/i.test(t)) return { who: all, label: "Happy New Year!" };
    return null;
  }
  // A friend's birthday: any birthday partyFor() did not claim. The name is what is
  // left of the title once "birthday", the possessive, a "40th" and any emoji go.
  function friendParty(title) {
    var t = String(title).trim();
    if (!/birthday|\bbday\b/i.test(t) || /king/i.test(t) || partyFor(t)) return null;
    var n = t.replace(/birthday|\bbday\b/ig, " ").replace(/['’]s\b/g, "").replace(/\b\d+(st|nd|rd|th)?\b/g, " ")
      .replace(/[^A-Za-zÀ-ɏ\s'-]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join(" ");
    if (n.length > 18) n = n.split(" ")[0].slice(0, 18);
    return { who: [], name: n, label: n ? n + "'s birthday" : "Birthday party" };
  }
  // ?party= tokens, by kind: family names and the fixed days are the rave, friend[:Name] is the house party.
  function forcedParty(kind) {
    var toks = decodeURIComponent(PFORCE).split(","), i, tk, P0;
    for (i = 0; i < toks.length; i++) { tk = toks[i].trim();
      if (/^(friend|house)(:|$)/i.test(tk)) { if (kind === "house") { P0 = friendParty((tk.split(":")[1] || "Pat") + "'s birthday"); if (P0) { P0.start = 17; return P0; } } continue; }
      if (kind !== "rave") continue;
      var f = PEOPLE.filter(function (p) { return p.name.toLowerCase() === tk.toLowerCase(); })[0];
      P0 = f ? partyFor(f.name + " birthday") : partyFor(tk.replace(/-/g, " ")); if (P0) { P0.start = 17; return P0; }
    }
    return null;
  }
  function startOf(e) { return e.all_day ? 17 : Math.min(17, new Date(e.start).getHours() + new Date(e.start).getMinutes() / 60); }
  function findParty() {
    if (PFORCE) return forcedParty("rave");
    var td = ymd(now());
    for (var i = 0; i < DATA.events.length; i++) { var e = DATA.events[i]; if (e.day !== td) continue;
      var P = partyFor(e.what); if (P) { P.start = startOf(e); return P; } }
    // no calendar entry needed: the countdown list knows the family's own days
    for (i = 0; i < CD.length; i++) if (CD[i].days === 0 && CD[i].rave) { P = partyFor(CD[i].rave); if (P) { P.start = 17; return P; } }
    return null;
  }
  function findHouseParty() {
    if (PFORCE) return forcedParty("house");
    // every countdown day ends with a party in the blue cottage, from 17:00; a family
    // day outranks a friend's birthday for the card over the chimney
    for (var i = 0; i < CD.length; i++) if (CD[i].days === 0) return { who: [], label: CD[i].party, start: 17 };
    var td = ymd(now());
    for (i = 0; i < DATA.events.length; i++) { var e = DATA.events[i]; if (e.day !== td) continue;
      var P = friendParty(e.what); if (P) { P.start = startOf(e); return P; } }
    return null;
  }

  // ── Countdowns ──────────────────────────────────────────────────────────────
  // A row of tags in the sky: the next few of the family's days, with the days to
  // go in the badge, "today" on the day. Sources: the birthdays in DATES (CONFIG), the
  // end of term from SENSORS.extra's term dates (the soonest known end of a current
  // term across every school; nothing during the holidays, nothing until the data
  // has arrived), Easter by the Gregorian computus, the fixed days, and trips: any
  // event on SENSORS.trips with "holiday" in its title, counted to its first day and
  // labelled with the rest of the title ("Holiday Cornwall" shows as Cornwall). Shown
  // soonest first, as many as fit between the clock and the corner hint. Recomputed
  // every HUD tick, re-rendered only when the list or a number changes.
  var HOUSE_COL = "#E0A050", SCHOOL_COL = "#C9594A", CD = [];
  function easter(y) {                                                      // Easter Sunday, Gregorian (Meeus/Jones/Butcher)
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return y + "-" + pad2(Math.floor(n / 31)) + "-" + pad2(n % 31 + 1);
  }
  function nextDate(md, td) { var y = +td.slice(0, 4), s = y + "-" + md; return s >= td ? s : (y + 1) + "-" + md; }
  function daysUntil(ds, t) { return Math.round((new Date(ds + "T12:00:00") - new Date(ymd(t) + "T12:00:00")) / 864e5); }
  function termEnd(td) {
    var best = null;
    ((DATA.extra || {}).schools || []).forEach(function (sc) { (sc.terms || []).forEach(function (t) {
      if (t.to && t.to >= td && (!t.from || t.from <= td) && (!best || t.to < best)) best = t.to; }); });
    return best;
  }
  function countdowns() {
    var t = now(), td = ymd(t), out = [], y = +td.slice(0, 4);
    Object.keys(DATES.birthdays).forEach(function (n) { var p = PEOPLE.filter(function (q) { return q.name === n; })[0];
      out.push({ key: "bday-" + n, label: n, icon: "cake", col: p ? p.col : HOUSE_COL, date: nextDate(DATES.birthdays[n], td),
        rave: n + " birthday", party: "Happy birthday " + n + "!" }); });
    DATES.fixed.forEach(function (f) { out.push({ key: f.key, label: f.label, icon: f.icon, col: HOUSE_COL, date: nextDate(f.md, td), rave: f.rave, party: f.party }); });
    var es = easter(y); if (es < td) es = easter(y + 1);
    out.push({ key: "easter", label: "Easter", icon: "egg", col: HOUSE_COL, date: es, party: "Happy Easter!" });
    (DATA.holidays || []).forEach(function (h) { if (h.date >= td)          // before the term end, so a holiday wins the chimney card on a shared day
      out.push({ key: "hol-" + h.date + h.label, label: h.label, icon: "suitcase", col: HOUSE_COL, date: h.date, party: "Holiday time!" }); });
    var te = termEnd(td); if (te) out.push({ key: "term", label: "End of term", icon: "school", col: SCHOOL_COL, date: te, party: "School's out!" });
    out.forEach(function (c) { c.days = daysUntil(c.date, t); });
    return out.sort(function (a, b) { return a.days - b.days; });
  }
  // Tiny flat icons in the meadow's own colours: the school is the village school
  // (red roof, cream walls, blue door), the cake wears pink.
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
    return '<span class="dchip' + (today ? " now" : "") + '" style="border-color:' + shade(c.col, 0.72) + '">' +
      '<svg class="dic" viewBox="0 0 24 24">' + (DICON[c.icon] || "") + "</svg>" +
      '<span class="dl">' + esc(c.label) + "</span>" +
      '<span class="dn" style="background:' + shade(c.col, 0.6) + '">' + (today ? "today" : c.days) + "</span></span>";
  }
  function renderDates() {
    var key = CD.map(function (c) { return c.key + ":" + c.days; }).join("|");
    if (key === CD_KEY) return; CD_KEY = key;
    var el = $("dates"); el.innerHTML = CD.slice(0, 5).map(chipHtml).join("");
    while (el.children.length > 1 && el.scrollWidth > el.clientWidth) el.removeChild(el.lastChild);   // as many as fit, soonest kept
  }
  function partyOn() { if (!PARTY) return false; var d = now(), h = d.getHours() + d.getMinutes() / 60; return h >= PARTY.start && nightness < 0.6; }
  function houseOn() { if (!HOUSE) return false; var d = now(), h = d.getHours() + d.getMinutes() / 60; return h >= HOUSE.start && nightness < 0.6; }
  function wearsHat(t) { return PARTY && PARTY_T > 0.01 && PARTY.who.indexOf(t.person.name) >= 0; }
  // Where a party hat sits comes from the creature: sprite-local, in body radii, and its tilt.
  function drawPartyHat(t) {
    var a = CREATURE[t.person.look] && CREATURE[t.person.look].hat; if (!a) return;
    var rk = t.r * K, x = a[0] * rk, y = a[1] * rk, h = 0.8 * rk, w = 0.5 * rk;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a[2]); ctx.globalAlpha = PARTY_T;
    ctx.fillStyle = "#6C8FD0"; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(0, -h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#F3DE7C"; ctx.beginPath(); ctx.moveTo(-w * 0.32, -h * 0.32); ctx.lineTo(w * 0.32, -h * 0.32); ctx.lineTo(w * 0.2, -h * 0.55); ctx.lineTo(-w * 0.2, -h * 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#E86A5B"; ctx.beginPath(); ctx.arc(0, -h, w * 0.22, 0, 7); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function updateParty(dt) {
    if (!VIL) DANCE = null;                                   // the village's bandstand resets it every frame; elsewhere this does
    PARTY_T = clamp(PARTY_T + (partyOn() ? dt : -dt) / 3, 0, 1);
    HOUSE_T = clamp(HOUSE_T + (houseOn() ? dt : -dt) / 3, 0, 1);
    // the rave: everyone dances on the beat (k is scaled so the bandstand's sin(k * 7) lands on RAVE_W), the road grins
    if (PARTY_T > 0.5) { DANCE = { x: W / 2, y: H / 2, r: 1e6, k: clockT * RAVE_W / 7, amp: 9, sq: 0.1, wig: 0.07 };
      for (var wi = 0; wi < WALKERS.length; wi++) if (WALKERS[wi].v.happy < 0.3) WALKERS[wi].v.happy = 0.6; }
    // music on the speaker: the whole meadow grooves, a notch below the rave
    MUSIC_T = clamp(MUSIC_T + (MUSIC.on ? dt : -dt) / 2, 0, 1);
    if (MUSIC_T > 0.5 && PARTY_T <= 0.5 && nightness < 0.6) { DANCE = { x: W / 2, y: H / 2, r: 1e6, k: clockT * MUSIC_W / 7, amp: 6, sq: 0.08, wig: 0.05 };
      if (VIL && HOUSE_T <= 0.5) { MUSIC_NOTE -= dt;
        if (MUSIC_NOTE < 0) { MUSIC_NOTE = rand(0.7, 1.4);
          parts.push({ kind: "note", x: LAY.cottage.x + 19 + rand(-6, 6), y: LAY.B - 48, vx: rand(-14, 14), vy: -30, life: 1.9, max: 1.9, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A", "#E68AB0"]) }); } } }
    // the house party: guests in with presents, out with cake; notes from the window
    if (VIL && HOUSE_T > 0.5) { HP.note -= dt;
      if (HP.note < 0) { HP.note = rand(0.45, 1.0);
        parts.push({ kind: "note", x: LAY.cottage.x + 19 + rand(-6, 6), y: LAY.B - 48, vx: rand(-14, 14), vy: -30, life: 1.9, max: 1.9, col: pick(["#3B5FA8", "#E86A5B", "#4E9A5A", "#E68AB0"]) }); }
      if (nightness < 0.35 && WX.storm < 0.5) { HP.guest -= dt;
        if (HP.guest < 0) { HP.guest = rand(4, 9);
          if (WALKERS.length < 14) { var side = DOORS[pick(["left", "right", "mill", "post", "pub"])];
            if (Math.random() < 0.7) errand(side, DOORS.cottage, { carry: ICON.gift });
            else errand(DOORS.cottage, DOORS[pick(["left", "right", "mill", "post"])], {}).v.happy = 3; } } }
    } else HP.guest = Math.min(HP.guest, 2);
    // fireworks after dark
    if (PARTY_T > 0.5 && DARK > 0.45) { PARTY.fwT = (PARTY.fwT || 0) - dt;
      if (PARTY.fwT < 0) { PARTY.fwT = rand(0.5, 1.3); ROCKETS.push({ x: rand(W * 0.36, W * 0.72), y: HZ + 10, ty: rand(80, 140), col: pick(["#FF6B6B", "#FFD35C", "#7BE07F", "#6CB8FF", "#FF8FD1"]) }); } }
    for (var i = ROCKETS.length - 1; i >= 0; i--) { var r = ROCKETS[i]; r.y -= 220 * dt;
      if (r.y <= r.ty) { ROCKETS.splice(i, 1); for (var n = 0; n < 26; n++) { var a = n / 26 * 6.283, s = rand(45, 75);   // bursts stay clear of the clock and the corner
        FW.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.4, max: 1.4, col: r.col }); } } }
    for (i = FW.length - 1; i >= 0; i--) { var p = FW[i]; p.life -= dt; if (p.life <= 0) { FW.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 45 * dt; p.vx *= 0.99; }
  }
  function drawFireworks() {
    if (!ROCKETS.length && !FW.length) return;
    ctx.lineWidth = 2;
    ROCKETS.forEach(function (r) { ctx.strokeStyle = "rgba(255,240,200,.8)"; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + 14); ctx.stroke(); });
    var byCol = {};
    FW.forEach(function (p) { (byCol[p.col] = byCol[p.col] || []).push(p); });
    Object.keys(byCol).forEach(function (c) { ctx.fillStyle = c; ctx.beginPath();
      byCol[c].forEach(function (p) { ctx.globalAlpha = 1; ctx.moveTo(p.x + 2.2, p.y); ctx.arc(p.x, p.y, 2.2 * (0.5 + p.life / p.max), 0, 7); }); ctx.fill(); });
  }
  function drawPartyBack(time) {
    if (!VIL) return;                                         // the dressing hangs on the village
    if (PARTY_T > 0.01) { ctx.globalAlpha = PARTY_T; ctx.drawImage(BUNTING, 0, LAY.B - 110, W, 90); ctx.globalAlpha = 1; }
    if (HOUSE_T > 0.01) drawHouseBack(time);
  }
  // The house party's dressing on the cottage: bunting on the roof, balloons at the
  // door, and the name on a card over the chimney. Drawn before the walkers, so a
  // guest at the door stands in front of it.
  function drawHouseBack(time) {
    var x = LAY.cottage.x, B = LAY.B, i, b;
    ctx.globalAlpha = HOUSE_T;
    blit(SHOP.bunting, x - 2, B - 60, 1, 1, 1, 1);
    for (i = 0; i < HBAL.length; i++) { b = HBAL[i]; var bx = b.x + Math.sin(time * 1.3 + b.ph) * 3, by = b.y - b.len + Math.sin(time * 1.8 + b.ph) * 2.5;
      ctx.strokeStyle = "rgba(90,80,70,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + 3, (b.y + by) / 2, bx, by + 9); ctx.stroke();
      ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(bx, by, 7, 9.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(bx - 2.3, by - 3, 2, 2.8, 0, 0, 7); ctx.fill(); }
    if (HOUSE && HOUSE.label !== HP.key) { HP.key = HOUSE.label; HP.card = bakeCard(HOUSE.label); }
    if (HP.card) ctx.drawImage(HP.card.c, x - HP.card.w / 2, B - 116 - HP.card.h + Math.sin(time * 1.6) * 2, HP.card.w, HP.card.h);
    ctx.globalAlpha = 1;
  }
  function bakeCard(text) {
    var f = "600 " + 17 * K + "px Fredoka", g0 = canvas(10, 10).getContext("2d"); g0.font = f;
    var w = g0.measureText(text).width + 24 * K, h = 28 * K, c = canvas(w + 4 * K, h + 10 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "rgba(255,255,255,.95)"; g.strokeStyle = "#E86A5B"; g.lineWidth = 2 * K; rr(g, x, y, w, h, h / 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + w / 2 - 6 * K, y + h - 1); g.lineTo(x + w / 2, y + h + 7 * K); g.lineTo(x + w / 2 + 6 * K, y + h - 1); g.fill();
    g.fillStyle = "#26352C"; g.font = f; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(text, x + w / 2, y + h / 2 + K);
    return { c: c, w: c.width / K, h: c.height / K };
  }
  // The cottage window in party colours, on top of the dusk so it reads as lit.
  function drawHouseLights(time) {
    if (HOUSE_T <= 0.01 || !VIL) return;
    var x = LAY.cottage.x, B = LAY.B, cols = ["255,212,120", "255,150,190", "150,200,255", "190,255,170"], k = time * 1.6, i = Math.floor(k) & 3, u = k - Math.floor(k);
    ctx.fillStyle = "rgba(" + cols[i] + "," + (HOUSE_T * (0.55 + 0.35 * DARK)).toFixed(2) + ")"; rr(ctx, x + 6, B - 44, 26, 20, 4); ctx.fill();
    ctx.fillStyle = "rgba(" + cols[(i + 1) & 3] + "," + (HOUSE_T * u * (0.55 + 0.35 * DARK)).toFixed(2) + ")"; rr(ctx, x + 6, B - 44, 26, 20, 4); ctx.fill();
    if (DARK > 0.1) { ctx.fillStyle = "rgba(" + cols[i] + "," + (HOUSE_T * DARK * 0.18).toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(x + 19, B + 4, 60, 16, 0, 0, 7); ctx.fill(); }   // spill on the road
  }
  // The rave's lights, over the dusk and under the tags. Flat fills, lines and one
  // baked ball: nothing per-frame that Chrome 87 on the panel would sulk at.
  function makePartySprites(cols) {
    var i;
    if (VIL) { var x = LAY.cottage.x, B = LAY.B;
      HBAL = [[x - 36, B - 34], [x + 40, B - 30], [x + 47, B - 36]].map(function (a, i) { return { x: a[0], y: a[1], ph: rand(0, 6), col: cols[(i * 2 + 1) % cols.length], len: rand(28, 42) }; }); }
    else HBAL = [];
    SPOTS = []; for (i = 0; i < 12; i++) SPOTS.push({ x: rand(W * 0.05, W * 0.95), y: rand(TOP + 70, H - 30), ph: rand(0, 6), hue: (i * 47) % 360 });
    DISCO = icon(60, 60, function (g) { g.fillStyle = "#8A93A6"; g.beginPath(); g.arc(30, 30, 28, 0, 7); g.fill();
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var fx = 3 + c * 6.8, fy = 3 + r * 6.8, dx = fx + 3 - 30, dy = fy + 3 - 30; if (dx * dx + dy * dy > 26 * 26) continue;
        g.fillStyle = ((r + c) % 3 === 0) ? "#F4F7FF" : ((r + c) % 3 === 1) ? "#C9D2E6" : "#A6B0C6"; g.fillRect(fx, fy, 5.8, 5.8); }
      g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(21, 19, 9, 6, -0.7, 0, 7); g.fill(); });
  }
  function drawRaveLights(time) {
    if (PARTY_T <= 0.01) return;
    var a = PARTY_T, beat = Math.sin(time * RAVE_W), pump = Math.max(0, beat), glow = 0.6 + 0.8 * DARK, i, hue = (time * 36) % 360 | 0;
    // colour wash, on the beat
    ctx.fillStyle = "hsla(" + hue + ",90%,60%," + (a * (0.07 + 0.09 * pump) * glow).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H);
    // ground spots, drifting, each its own colour
    for (i = 0; i < SPOTS.length; i++) { var s = SPOTS[i], sx = s.x + Math.sin(time * 0.8 + s.ph) * 46, sy = s.y + Math.sin(time * 0.5 + s.ph * 1.7) * 12, r = 26 + 9 * pump;
      ctx.fillStyle = "hsla(" + ((s.hue + hue) % 360) + ",95%,65%," + (a * 0.27 * glow).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, 7); ctx.fill(); }
    // lasers, fanned up from the bandstand and the pitch
    ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 3; ctx.lineCap = "round";
    var rigs = VIL ? [[LAY.band.x, LAY.band.y - 70, 1], [LAY.pitch.x, LAY.pitch.y - 40, -1]] : [];
    for (var g = 0; g < rigs.length; g++) { var rx = rigs[g][0], ry = rigs[g][1];
      for (i = 0; i < 4; i++) { var th = rigs[g][2] * (i - 1.5) * 0.28 + Math.sin(time * 1.5 + i * 1.3 + g * 2) * 0.55, len = ry + 30;
        ctx.strokeStyle = "hsla(" + ((hue + 90 * i + g * 45) % 360) + ",100%,65%," + (a * (0.22 + 0.18 * pump) * glow).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.tan(th) * len, -30); ctx.stroke(); } }
    ctx.globalCompositeOperation = "source-over";
    // the glitter ball, hung over the road above the plane's lane, with its glints on the sky
    // (a scene with a roof hangs it where it says: SCENE.disco(SV) -> { x, y, top })
    var dz = SCENE.disco ? SCENE.disco(SV) : null, cx = dz ? dz.x : W / 2, cy = dz ? dz.y : 92, R = 26;
    ctx.globalAlpha = a; ctx.strokeStyle = "rgba(60,60,70,.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, dz ? dz.top : 0); ctx.lineTo(cx, cy - R); ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1 / K, 1 / K); ctx.drawImage(DISCO.c, -30 * K, -30 * K); ctx.restore();
    ctx.fillStyle = "#FFFFFF";
    for (i = 0; i < 7; i++) { var ga = time * 1.4 + i * 0.9, gx = Math.cos(ga) * R * 0.78, gy = Math.sin(i * 2.3) * R * 0.6, gl = Math.max(0, Math.cos(ga));
      if (gl < 0.15) continue; ctx.globalAlpha = a * gl; ctx.fillRect(cx + gx - 2, cy + gy - 2, 4, 4); }
    for (i = 0; i < 10; i++) { var pa = time * 0.7 + i * 0.628, pr = 70 + 45 * ((i * 7) % 3), px = cx + Math.cos(pa) * pr * 1.8, py = cy + Math.sin(pa) * pr * 0.55;
      ctx.globalAlpha = a * (0.25 + 0.35 * pump) * glow; ctx.fillStyle = "hsla(" + ((hue + i * 36) % 360) + ",100%,80%,1)"; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // ── The bandstand show, while the speaker plays music ──────────────────────────
  // The stage becomes the centre of the party: a warm pool of light, the canopy's
  // bulbs chasing on the beat, coloured spots on the grass round it, two pairs of
  // lasers sweeping up off the canopy, a glitter ball under the roof throwing specks
  // across the stage and the grass, and a lit sign on the roof finial with what's
  // playing. Lines, fills and one baked sign: no blur, no filters. The rave owns the
  // lights when both are on (the show fades by 1 - PARTY_T); the sign stays.
  // Bedtime calms it: once the family is asleep the lasers, spots and bulb chase go
  // out and the ball turns on for a nightlight, specks dimmed, sign still lit.
  // Too long: drop a "(... remix)", " - Live" or " feat. ..." tail first, then cut at a word with an ellipsis.
  function trunc(g, text, max) {
    if (g.measureText(text).width <= max) return text;
    var core = text.replace(/\s*[(\[].*$/, "").replace(/\s+-\s+.*$/, "").replace(/\s+(feat\.?|ft\.|featuring)\s.*$/i, "");
    if (core && core !== text && g.measureText(core).width <= max) return core;
    text = core || text;
    while (text.length > 1 && g.measureText(text + "…").width > max) text = text.slice(0, -1);
    var sp = text.lastIndexOf(" "); if (sp > text.length * 0.6) text = text.slice(0, sp);
    return text.replace(/[\s,.(\-&]+$/, "") + "…";
  }
  function bakeSign(title, artist) {
    var ft = "600 " + 18 * K + "px Fredoka", fa = "500 " + 14 * K + "px Fredoka", max = 260 * K;
    var g0 = canvas(10, 10).getContext("2d"), t, a = null;
    g0.font = ft; t = trunc(g0, title, max); var tw = g0.measureText(t).width;
    var aw = 0; if (artist) { g0.font = fa; a = trunc(g0, artist, max); aw = g0.measureText(a).width; }
    var pad = 14 * K, w = Math.max(tw, aw) + pad * 2 + 18 * K, h = (a ? 50 : 32) * K, c = canvas(w + 4 * K, h + 4 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "#FFF6E3"; g.strokeStyle = "#8D6440"; g.lineWidth = 2.5 * K; rr(g, x, y, w, h, 9 * K); g.fill(); g.stroke();
    g.fillStyle = "#D9534F"; var nx = x + pad + 4 * K, ny = y + h / 2;                    // a little red note, the bandstand's colour
    g.beginPath(); g.ellipse(nx - 2 * K, ny + 5 * K, 4.5 * K, 3.4 * K, -0.3, 0, 7); g.fill();
    g.fillRect(nx + 1.6 * K, ny - 9 * K, 2 * K, 14 * K); g.fillRect(nx + 1.6 * K, ny - 9 * K, 7 * K, 2.4 * K);
    g.textAlign = "left"; g.textBaseline = "middle"; var tx = x + pad + 18 * K;
    g.fillStyle = "#3B2A1E"; g.font = ft; g.fillText(t, tx, a ? y + 17 * K : y + h / 2 + K);
    if (a) { g.fillStyle = "#86654A"; g.font = fa; g.fillText(a, tx, y + 36 * K); }
    return { c: c, w: c.width / K, h: c.height / K };
  }
  function drawBandShow(time) {
    if (MUSIC_T <= 0.01 || !VIL) return;
    var bx = LAY.band.x, by = LAY.band.y, i;
    var awake = 1 - clamp((nightness - 0.3) / 0.3, 0, 1);       // 0 once the family is asleep
    var a = MUSIC_T * (1 - PARTY_T), live = a * awake, glow = 0.55 + 0.45 * DARK;
    var beat = Math.sin(clockT * MUSIC_W), pump = Math.max(0, beat), hue = (time * 30) % 360 | 0;
    if (a > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      // warm pool on the stage and the grass in front, breathing with the beat
      ctx.fillStyle = "rgba(255,170,90," + (a * (0.10 + 0.08 * pump * awake) * glow).toFixed(3) + ")";
      ctx.beginPath(); ctx.ellipse(bx, by - 8, 130, 38, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,200,130," + (a * 0.10 * glow).toFixed(3) + ")"; ctx.fillRect(bx - 66, by - 88, 132, 84);
      if (live > 0.01) {
        // coloured spots on the grass round the stage
        for (i = 0; i < 6; i++) { var sa = time * 0.7 + i * 1.05, sx = bx + Math.cos(sa) * (110 + 40 * (i % 2)), sy = by - 30 + Math.sin(sa) * 30, r = 22 + 7 * pump;
          ctx.fillStyle = "hsla(" + ((hue + i * 60) % 360) + ",95%,62%," + (live * 0.22 * glow).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.42, 0, 0, 7); ctx.fill(); }
        // lasers off the canopy's corners, sweeping, ending over the meadow (clear of the clock)
        ctx.lineWidth = 2.5; ctx.lineCap = "round";
        for (var c = -1; c <= 1; c += 2) { var ox = bx + c * 70, oy = by - 90;
          for (i = 0; i < 2; i++) { var th = c * (0.25 + i * 0.35) + Math.sin(time * 1.3 + i * 1.9 + c) * 0.45, len = 330;
            ctx.strokeStyle = "hsla(" + ((hue + 120 * i + (c > 0 ? 60 : 0)) % 360) + ",100%,62%," + (live * (0.2 + 0.2 * pump) * glow).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.sin(th) * len, oy - Math.cos(th) * len); ctx.stroke(); } }
      }
      // the glitter ball's specks: a fixed set, carried round by the ball's turn
      if (!SPECKS.length) for (i = 0; i < 32; i++) SPECKS.push({ lon: i * 2.4, rad: 40 + (i * 37) % 170, sq: 0.22 + 0.1 * ((i * 5) % 3), s: 2 + (i % 3), tw: i * 1.7 });
      var rot = time * 0.55, cy = by - 40;
      for (i = 0; i < SPECKS.length; i++) { var p = SPECKS[i], ang = p.lon + rot, px = bx + Math.cos(ang) * p.rad * 1.4, py = cy + 30 + Math.sin(ang) * p.rad * p.sq;
        var tw = 0.55 + 0.45 * Math.sin(time * 3 + p.tw);
        ctx.fillStyle = "rgba(255,250,235," + (a * (0.25 + 0.5 * awake) * tw).toFixed(3) + ")"; ctx.fillRect(px - p.s / 2, py - p.s / 2, p.s, p.s); }
      ctx.globalCompositeOperation = "source-over";
      // canopy bulbs, chasing on the beat (steady at night)
      for (i = 0; i < 9; i++) { var on = awake > 0.5 ? ((i + Math.floor(clockT * MUSIC_W / Math.PI)) % 3 === 0) : true;
        ctx.fillStyle = on ? "hsla(" + ((hue + i * 40) % 360) + ",100%,72%," + a.toFixed(3) + ")" : "rgba(255,240,210," + (a * 0.35).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(bx - 80 + i * 20, by - 87, on ? 3.2 : 2.4, 0, 7); ctx.fill(); }
      // the glitter ball itself, hung under the canopy's peak; facets roll round as it turns
      var gx = bx, gy = by - 72, R = 10;
      ctx.globalAlpha = a; ctx.strokeStyle = "rgba(60,60,70,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, by - 88); ctx.lineTo(gx, gy - R); ctx.stroke();
      ctx.fillStyle = "#8A93A6"; ctx.beginPath(); ctx.arc(gx, gy, R, 0, 7); ctx.fill();
      for (var la = -2; la <= 2; la++) { var lat = la * 0.5, cl = Math.cos(lat);
        for (var lo = 0; lo < 8; lo++) { var l = lo * 0.785 + rot * 2, z = Math.cos(l); if (z < 0.1) continue;
          var fx = gx + Math.sin(l) * R * 0.85 * cl, fy = gy + Math.sin(lat) * R * 0.85, b = 160 + 95 * z * cl | 0;
          ctx.fillStyle = "rgb(" + b + "," + b + "," + Math.min(255, b + 15) + ")"; ctx.fillRect(fx - 1.4, fy - 1.4, 2.8, 2.8); } }
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(gx - 4 + Math.sin(time * 2.2) * 2, gy - 5, 2.5, 2.5);
      ctx.globalAlpha = 1;
    }
    // what's playing, on a lit sign up on the roof finial
    var key = (MUSIC.title || "") + "|" + (MUSIC.artist || "");
    if (key !== SIGN_KEY) { SIGN_KEY = key; SIGN = MUSIC.title ? bakeSign(MUSIC.title, MUSIC.artist) : SIGN; }   // keeps the last one while it fades
    if (SIGN) { var sx0 = bx - SIGN.w / 2, sy0 = by - 146 - SIGN.h + Math.sin(clockT * MUSIC_W * 0.5) * 1.5 * awake;
      ctx.globalAlpha = MUSIC_T; ctx.fillStyle = "#8D6440"; ctx.fillRect(bx - 1.5, sy0 + SIGN.h - 4, 3, by - 134 - (sy0 + SIGN.h - 4));
      ctx.drawImage(SIGN.c, sx0, sy0, SIGN.w, SIGN.h); ctx.globalAlpha = 1; }
  }
  function drawPartyFront(time) {
    if (PARTY_T <= 0.01 || !VIL) return;
    ctx.globalAlpha = PARTY_T;
    var cx = LAY.band.x + 104, cy = LAY.band.y + 6;
    blit(CAKE, cx, cy, 1, 1, 1, 1);
    ctx.fillStyle = "#FFB43C"; [-8, -1, 6].forEach(function (o, i) { var f = 1 + 0.25 * Math.sin(time * 18 + i * 2);
      ctx.beginPath(); ctx.ellipse(cx + o * 1.0 + 1, cy - 52, 2.2, 4 * f, 0, 0, 7); ctx.fill(); });
    BALLOONS.forEach(function (b) { var bx = b.x + Math.sin(time * 1.2 + b.ph) * 4, by = b.y - b.len + Math.sin(time * 1.7 + b.ph) * 3;
      ctx.strokeStyle = "rgba(90,80,70,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + 4, (b.y + by) / 2, bx, by + 12); ctx.stroke();
      ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(bx, by, 9, 12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(bx - 3, by - 4, 2.5, 3.5, 0, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  var TAGS = {};
  function bakeTag(p, count) {
    var g0 = canvas(10, 10).getContext("2d"); g0.font = "600 " + 20 * K + "px Fredoka";
    var tw = g0.measureText(p.name).width, bw = count ? 26 * K : 0, w = tw + 30 * K + bw, h = 34 * K;
    var c = canvas(w + 4 * K, h + 12 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    g.fillStyle = "rgba(255,255,255,.95)"; g.strokeStyle = shade(p.col, 0.72); g.lineWidth = 2.5 * K;
    rr(g, x, y, w, h, h / 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + w / 2 - 7 * K, y + h - 1); g.lineTo(x + w / 2, y + h + 8 * K); g.lineTo(x + w / 2 + 7 * K, y + h - 1); g.fill();
    g.fillStyle = "#26352C"; g.font = "600 " + 20 * K + "px Fredoka"; g.textBaseline = "middle";
    g.fillText(p.name, x + 15 * K, y + h / 2 + K);
    if (count) { g.fillStyle = shade(p.col, 0.6); g.beginPath(); g.arc(x + w - 19 * K, y + h / 2, 11 * K, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.font = "600 " + 15 * K + "px Fredoka"; g.textAlign = "center"; g.fillText(count > 9 ? "9+" : count, x + w - 19 * K, y + h / 2 + K); }
    return { c: c, w: c.width / K, h: c.height / K };
  }
  function heart(x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.4, y - s, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.fill();
  }
  function hopOf(t) {
    var look = t.person && t.person.look;
    if (look === "snail" || look === "shark") return t.jump > 0 ? Math.sin((1 - t.jump / 0.6) * Math.PI) * t.r * 0.8 : 0;
    // the crow hops: quicker and higher than the others' bounce
    var h = look === "crow" ? Math.abs(Math.sin(t.phase * 1.5)) * t.r * 0.7 * t.gait : Math.abs(Math.sin(t.phase)) * t.r * 0.5 * t.gait;
    if (t.jump > 0) h += Math.sin((1 - t.jump / 0.6) * Math.PI) * t.r * 1.4;
    if (t.pronk > 0) h += Math.abs(Math.sin((1.6 - t.pronk) / 1.6 * Math.PI * 4)) * t.r * 0.75;   // the deer's pronk
    return h;
  }
  function drawThing(t, time) {
    var sc = depth(t.y) * t.grow, hop = hopOf(t) * sc;
    var dance = DANCE && nightness < 0.6 && !t.moving && t !== openThing && Math.abs(t.x - DANCE.x) + Math.abs(t.y - DANCE.y) < DANCE.r;
    var spr = nightness > 0.6 ? t.spr.shut : (t.happy > 0 || t.munch > 0 || dance) ? t.spr.happy : t.blinkT > 0 ? t.spr.shut : t.spr.open;
    var sy = 1, sx = 1;
    if (dance) { var bt = Math.sin(DANCE.k * 7 + t.phase * 2); sy = 1 + (DANCE.sq || 0.06) * bt; sx = 1 / sy; hop += Math.max(0, bt) * (DANCE.amp || 3); }
    else if (t.gait > 0.05 && !(t.person && t.person.look === "snail")) { var land = (1 - Math.abs(Math.sin(t.phase))) * t.gait; sy = 1 - 0.14 * land * land * land; sx = 1 + 0.1 * land * land * land; }
    else if (t.munch > 0) { sy = 1 + 0.05 * Math.sin(time * 22); sx = 1 / sy; }
    else { sy = 1 + 0.025 * Math.sin(time * 2.2 + t.phase); sx = 1 / sy; }
    if (t.person && t.person.look === "snail" && t.moving) { sx = 1 + 0.04 * Math.sin(time * 4); sy = 1 / sx; }
    var look = t.person && t.person.look, lean = 0;
    if (t.kind === "fam") {
      var air = Math.abs(Math.sin(t.phase)) * t.gait;
      if (look !== "snail" && look !== "shark") { sy *= 1 + 0.09 * air; sx /= 1 + 0.05 * air; }     // stretch at the top of a hop
      sy *= 1 + t.sq; sx *= 1 - t.sq * 0.6;                                                         // jelly settle
      lean = t.face * 0.1 * t.gait + 0.03 * Math.sin(time * 0.9 + t.phase) * (1 - t.gait);         // lean into the walk, sway at rest
    }
    if (look === "shark") return drawShark(t, time, spr, sc, sx, sy, hop);
    if (look === "otter" && t.dipT >= 0) return drawOtterFloat(t, time, sc);
    if (look === "deer" && t.graze > 0) {                  // head down to graze
      var gz = Math.min(1, t.graze / 0.4, 1); lean += t.face * 0.22 * gz; sy *= 1 - 0.05 * gz; }
    if (t.shiny) drawShiny(t.shiny.x, t.shiny.y, time);
    if (dance && DANCE.wig) lean += DANCE.wig * Math.sin(DANCE.k * 3.5 + t.phase * 2);   // the rave's side-to-side
    ctx.save(); ctx.translate(t.x, t.y - hop);
    if (lean) ctx.rotate(lean);
    if (t.peck > 0) ctx.rotate(t.face * 0.4 * Math.sin((1 - t.peck / 0.5) * Math.PI));      // the crow stoops for it
    if (t.rig) { ctx.scale(t.face * sx * sc / K, sy * sc / K); t.dancing = dance; drawRig(t, time); if (wearsHat(t)) drawPartyHat(t); }
    else { ctx.scale(t.face * sx * sc / spr.k, sy * sc / spr.k); ctx.drawImage(spr.c, -spr.ax, -spr.ay); }
    ctx.restore();
    if (t.kind === "fam" && !INDOOR && WX.rain > 0.3 && look !== "snail") {   // umbrellas out; the snail has a roof
      var ur = t.r * sc, uy = t.y - hop - ur * (t.person.tg - 0.35), ux = t.x + t.face * ur * 0.1;
      ctx.globalAlpha = clamp((WX.rain - 0.3) * 3, 0, 1);
      ctx.strokeStyle = "#5A4A3A"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux, uy + ur * 0.9); ctx.stroke();
      ctx.fillStyle = t.person.col; ctx.beginPath(); ctx.arc(ux, uy + 2, ur * 1.05, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(t.person.col, 0.7); ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  function drawShiny(x, y, time) {
    ctx.save(); ctx.translate(x, y - 3); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#F4D35E"; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.fillStyle = "#FFF6C8"; ctx.fillRect(-3.5, -3.5, 3, 3); ctx.restore();
    var gl = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.strokeStyle = "rgba(255,255,255," + gl.toFixed(2) + ")"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x + 7, y - 3); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 4); ctx.stroke();
  }
  // The otter in the pond: leans back and floats, juggling a pebble on its tummy.
  function drawOtterFloat(t, time, sc) {
    var base = t.y + (t.dy || 0), k = t.diving || 0, r = t.r * sc, spr = t.spr.happy;
    var rx = r * 1.5, ry = r * 0.42, bob = Math.sin(time * 2.2) * 1.5 * k;
    ctx.save(); ctx.beginPath(); ctx.rect(t.x - 200, base - 400, 400, 400 + ry * 0.1); ctx.clip();
    ctx.translate(t.x, base + r * 0.24 * k + bob - r * 0.9); ctx.rotate(-t.face * 0.45 * k); ctx.translate(0, r * 0.9);
    ctx.scale(t.face * sc / spr.k, sc / spr.k); ctx.drawImage(spr.c, -spr.ax, -spr.ay); ctx.restore();
    if (k > 0.8) { var jug = Math.abs(Math.sin(time * 3.2)), px = t.x + t.face * r * 0.05, py = base - r * 0.04 + bob - jug * r * 0.55;   // juggling it
      ctx.fillStyle = "#9AA0A8"; ctx.beginPath(); ctx.ellipse(px, py, r * 0.2, r * 0.14, 0, 0, 7); ctx.fill();          // the pebble
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(px - r * 0.06, py - r * 0.05, r * 0.05, 0, 7); ctx.fill();
      var pawY = base - r * 0.02 + bob - Math.max(0, 0.25 - jug) * r * 0.3;                    // paws stay low and catch
      ctx.fillStyle = "#5A3E2C"; [-1, 1].forEach(function (s2) { ctx.beginPath(); ctx.ellipse(px + s2 * r * 0.19, pawY, r * 0.08, r * 0.1, s2 * 0.4, 0, 7); ctx.fill(); }); }
    ctx.fillStyle = "rgba(111,187,211,.85)"; ctx.beginPath(); ctx.ellipse(t.x, base, rx, ry, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(t.x, base, rx * 0.95, ry * 0.75, 0, 0, 7); ctx.stroke();
  }
  // The shark swims across dry land in its own puddle: the body is cut at the waterline,
  // with the front rim of the water drawn over it. dy and sink come from its dive.
  function drawShark(t, time, spr, sc, sx, sy, hop) {
    var base = t.y + (t.dy || 0), rx = t.r * 1.8 * sc, ry = t.r * 0.42 * sc;
    var bob = Math.sin(time * 2.5 + t.phase) * 1.5 * (1 - (t.diving || 0)), sink = t.r * sc * (0.28 + 0.6 * (t.diving || 0));
    var dry = !(t.dipT >= 0) || (t.diving || 0) < 0.5;
    if (dry) { ctx.fillStyle = "rgba(111,187,211,.9)"; ctx.beginPath(); ctx.ellipse(t.x, base, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(t.x, base, rx, ry, 0, 0, 7); ctx.stroke(); }
    ctx.save(); ctx.beginPath(); ctx.rect(t.x - 200, base - 400, 400, 400 + ry * 0.2); ctx.clip();
    ctx.translate(t.x, base + sink + bob - hop);
    if (t.rig) { ctx.scale(t.face * sx * sc / K, sy * sc / K); drawRig(t, time); if (wearsHat(t)) drawPartyHat(t); }
    else { ctx.scale(t.face * sx * sc / spr.k, sy * sc / spr.k); ctx.drawImage(spr.c, -spr.ax, -spr.ay); }
    ctx.restore();
    ctx.fillStyle = dry ? "rgba(140,205,225,.8)" : "rgba(111,187,211,.85)";
    ctx.beginPath(); ctx.ellipse(t.x, base, rx, ry, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(t.x, base, rx * 0.92, ry * 0.7, 0, 0.3, 2.8); ctx.stroke();
    if (t.moving) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.beginPath();                    // wake
      for (var i = 1; i <= 2; i++) { var wx = t.x - t.face * (rx + i * 9); ctx.moveTo(wx, base - 3 * i); ctx.lineTo(wx - t.face * 7, base); } ctx.stroke(); }
  }
  function draw(time) {
    var i, t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(BG, 0, 0, W, H);
    var AMB = SCENE.ambient; if (AMB) { SV.time = time; SV.WX = WX; SV.DARK = DARK; SV.nightness = nightness; SV.music = MUSIC_T; SV.party = PARTY_T; }
    if (AMB && AMB.under) AMB.under(ctx, time, SV);              // the scene's moving ground: water, waves
    drawWeatherGround();
    if (!INDOOR) { for (i = 0; i < CLOUDS.length; i++) ctx.drawImage(CLOUDS[i].c, CLOUDS[i].x, CLOUDS[i].y);
      drawWeatherSky(time);
      drawRainbow(); }
    drawPlane(time);
    if (AMB && AMB.back) AMB.back(ctx, time, SV);                // the scene's critters, behind the family
    for (i = 0; i < food.length; i++) { var f = food[i], fs = f.grow * 0.8 / K * depth(f.y);
      ctx.drawImage(f.spr.c, f.x - f.spr.ax * fs, f.y - f.spr.ay * fs, f.spr.c.width * fs, f.spr.c.height * fs); }
    for (i = 0; i < things.length; i++) { t = things[i]; if ((t.person && t.person.look === "shark") || offStage(t)) continue;
      var s = depth(t.y) * t.grow, hs = 1 - Math.min(0.5, hopOf(t) / (t.r * 3)), sw = t.r * 2.6 * s * hs;
      ctx.drawImage(SHADOW, t.x - sw / 2, t.y - sw * 0.14, sw, sw * 0.28); }
    var asleep = nightness > 0.6; clockT = time;
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].layer === "back" && !VILLAGE[i].late) VILLAGE[i].draw(time, asleep);
    drawPartyBack(time);
    drawWalkers();
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].late) VILLAGE[i].draw(time, asleep);
    var order = things.slice().sort(function (a, b) { return a.y - b.y; }), robo = !ROBOT;
    for (i = 0; i < order.length; i++) { if (!robo && ROBOT.y < order[i].y) { drawRobot(time); robo = true; }
      if (!offStage(order[i])) drawThing(order[i], time); }
    if (!robo) drawRobot(time);
    if (AMB && AMB.front) AMB.front(ctx, time, SV);              // in front of the family
    for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].layer === "front") VILLAGE[i].draw(time, asleep);
    drawPartyFront(time);
    // The bee, in a lazy figure of eight around whoever has bee: true
    var bh = BEE_HOST; if (bh && !offStage(bh)) { var bx = bh.x + Math.sin(time * 1.3) * 44, by = bh.y - bh.r * 1.4 - hopOf(bh) + Math.sin(time * 2.6) * 12;
      if (nightness > 0.6) { bx = bh.x - bh.face * bh.r * 0.3; by = bh.y - bh.r * 1.28; }   // asleep on the sleeper's back
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.ellipse(bx - 2, by - 6 - (nightness > 0.6 ? 0 : Math.abs(Math.sin(time * 40)) * 3), 5, 3.5, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = "#FFCB3D"; ctx.beginPath(); ctx.ellipse(bx, by, 7, 5.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.fillRect(bx - 2.5, by - 5, 2, 10); ctx.fillRect(bx + 1.5, by - 5, 2, 10);
      ctx.beginPath(); ctx.arc(bx + 5, by - 1, 1.2, 0, 7); ctx.fill(); }
    for (i = 0; i < parts.length; i++) { var p = parts[i], a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.kind === "heart") { ctx.fillStyle = p.col; heart(p.x, p.y, 9); }
      else if (p.kind === "poof") { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(p.x, p.y, 6 + (1 - a) * 8, 0, 7); ctx.fill(); }
      else if (p.kind === "crumb" || p.kind === "chip") { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill(); }
      else if (p.kind === "smoke") { ctx.globalAlpha = a * 0.7; ctx.fillStyle = "#F4F4F0"; ctx.beginPath(); ctx.arc(p.x, p.y, 5 + (1 - a) * 12, 0, 7); ctx.fill(); }
      else if (p.kind === "icon") blit(p.icon, p.x, p.y, 1, 1, 1, 1);
      else if (p.kind === "leaf") { ctx.globalAlpha = 1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
      else if (p.kind === "hat") { ctx.globalAlpha = 1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph * 0.7); ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(0, 2, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(-10, 1, 20, 4); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(0, -8, 3, 0, 7); ctx.fill(); ctx.restore(); }
      else if (p.kind === "note") { ctx.fillStyle = ctx.strokeStyle = p.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(p.x - 3, p.y + 5, 4, 3, -0.3, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x + 1, p.y + 4); ctx.lineTo(p.x + 1, p.y - 8); ctx.lineTo(p.x + 7, p.y - 5); ctx.stroke(); }
      else if (p.kind === "drop") { ctx.fillStyle = "#6FB6E8"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill(); }
      else if (p.kind === "coin") { ctx.fillStyle = "#F4C542"; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 7); ctx.fill();
        ctx.fillStyle = "#FFF3B8"; ctx.beginPath(); ctx.arc(p.x - 1.3, p.y - 1.3, 1.5, 0, 7); ctx.fill(); }
      else { ctx.font = p.kind === "z" ? "600 18px Fredoka" : "600 22px Fredoka"; ctx.textAlign = "center";
        ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.fillStyle = p.kind === "z" ? "#5C6FA8" : "#C4553A";
        ctx.strokeText(p.kind === "z" ? "z" : p.txt, p.x, p.y); ctx.fillText(p.kind === "z" ? "z" : p.txt, p.x, p.y); }
    }
    ctx.globalAlpha = 1;
    drawWeatherFront(time);
    if (DARK > 0) {
      ctx.fillStyle = "rgba(24,32,78," + (0.52 * DARK).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H);
      for (i = 0; i < VILLAGE.length; i++) if (VILLAGE[i].light) VILLAGE[i].light(DARK);
      if (AMB && AMB.light) AMB.light(ctx, time, SV);            // the scene's lamps, over the dusk
      planeLight(DARK, time);
      drawFireworks();
      ctx.globalAlpha = DARK;
      for (i = 0; i < flies.length; i++) { var fl = flies[i], pulse = 0.5 + 0.5 * Math.sin(time * 2 + fl.a * 3);
        ctx.globalAlpha = DARK * (0.3 + 0.7 * pulse); ctx.drawImage(GLOW, fl.x - 12, fl.y - 12, 24, 24); }
      ctx.globalAlpha = 1;
    }
    drawRaveLights(time); drawHouseLights(time); drawBandShow(time);  // over the dusk, under the tags
    // the school's tag: it is a tap target like the family
    var stg = TAGS.School; if (stg && LAY.school) { var sx0 = LAY.school.x - stg.w / 2, sy0 = (LAY.school.tag != null ? LAY.school.tag : LAY.school.y - 144) - stg.h;
      ctx.drawImage(stg.c, sx0, sy0, stg.w, stg.h); SCHOOL_CARD.tagBox = [sx0, sy0, stg.w, stg.h]; }
    // the workshop's board: the percent on the fence while a job is on (a tag above
    // would sit on the road, the plot is that close under it)
    var bd = VIL && shopBoard(); if (bd) ctx.drawImage(bd.c, LAY.shop.x - 60 - bd.w / 2, LAY.shop.y - 30 - bd.h, bd.w, bd.h);
    // name tags last, so night never hides who is who; a letter rides above the tag
    for (i = 0; i < fam.length; i++) { t = fam[i]; var tag = TAGS[t.person.name]; if (!tag) continue;
      if (offStage(t)) { t.tagBox = null; continue; }
      var sc = depth(t.y), top = t.y + (t.dy || 0) - hopOf(t) * sc - t.r * sc * t.person.tg;
      ctx.drawImage(tag.c, t.x - tag.w / 2, top - tag.h, tag.w, tag.h); t.tagBox = [t.x - tag.w / 2, top - tag.h, tag.w, tag.h];
      if (t.letter) blit(ICON.letter, t.x, top - tag.h - 6 + Math.sin(time * 2.4 + t.phase) * 2.5, 1, 1, 1, 2, Math.sin(time * 1.8) * 0.12); }
    drawRobotBubble(time);                                   // the office robot's line, above the night like the tags
  }

  // ── Time of day ─────────────────────────────────────────────────────────────
  // Fixed hours, not sun.sun: good enough for "it's bedtime in the meadow", and
  // one fewer thing to fetch. Sleep from 20:30 to 06:30 with an hour's fade.

  // ── Data ────────────────────────────────────────────────────────────────────
  // SENSORS.week: every event on every calendar for the next seven days, already
  //   tagged who/what/day/at/all_day by the template in configuration.yaml.
  // SENSORS.extra: what the daily gather found outside the calendars (school items,
  //   kit, flags, term dates, which sources it could and could not check).
  var DATA = { events: [], extra: null, weekAt: null, error: null, gotAt: null };

  // Each child's school sources from people[].timetable, .lunch and .choice (v1.1.0's
  // sensors.timetable and .lunch arrive here too, copied onto their owner by normalize()).
  // The demo hands its made-up sensors to the first three school kids instead.
  var SRC = {};
  PEOPLE.forEach(function (p) { if (p.timetable || p.lunch || p.choice) SRC[p.name] = { timetable: p.timetable, lunch: p.lunch, choice: p.choice }; });
  if (DEMO) {
    SRC = {};
    var DK = PEOPLE.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
    var dsrc = function (id, a) { return { entity: id, attribute: a }; };
    if (DK[0]) SRC[DK[0]] = { timetable: dsrc("sensor.demo_timetable_1", "timetable") };
    if (DK[1]) SRC[DK[1]] = { timetable: dsrc("sensor.demo_timetable_2", "timetable"), lunch: dsrc("sensor.demo_lunch_2", "menu"), choice: { days: { fri: "packed" } } };
    if (DK[2]) SRC[DK[2]] = { lunch: dsrc("sensor.demo_lunch_3", "menu"), choice: { value: "school" } };
  }
  function schoolEntities() {
    var ids = [];
    Object.keys(SRC).forEach(function (n) { var s = SRC[n];
      [s.timetable && s.timetable.entity, s.lunch && s.lunch.entity, s.choice && s.choice.entity].forEach(function (id) { if (id && ids.indexOf(id) < 0) ids.push(id); }); });
    return ids;
  }
  // Parsed once per child and day until the next load: schoolDay() asks every frame.
  // { status: "loading" } until the first load has read the sensors.
  function schoolParse(kind, name, d) {
    var src = SRC[name] && SRC[name][kind];
    if (!src) return null;
    if (!DATA.school) return { status: "loading", lessons: [], options: [] };
    var C = DATA.pc || (DATA.pc = {}), k = kind + "|" + name + "|" + ymd(d);
    if (!(k in C)) { var st = DATA.school.states ? DATA.school.states[src.entity] : null;
      C[k] = (kind === "timetable" ? parseTimetable : parseLunch)(st || null, d, now(), src.attribute); }
    return C[k];
  }
  function ttFor(name, d) { return schoolParse("timetable", name, d); }
  function lunchFor(name, d) { return schoolParse("lunch", name, d); }
  function choiceFor(name, d, fromData) {
    var c = SRC[name] && SRC[name].choice, S = DATA.school || {};
    return lunchChoice(c || null, d, c && c.entity && S.states ? S.states[c.entity] : null, fromData);
  }

  // Home Assistant hands the card its hass object, so there is no token to find:
  // hassToken() just waits for the first hass and resolves with it.
  function hassToken() {
    var h = HA.hass();
    return h ? Promise.resolve(h) : Promise.reject(new Error("no connection to Home Assistant yet"));
  }
  function getState(id, h) {
    var s = h.states[id];
    return s ? Promise.resolve(s) : Promise.reject(new Error(id + " not found"));
  }
  // Trips from the family calendar, a year ahead. The REST calendar endpoint gives
  // all-day events as {date} and timed ones as {dateTime}; either way the day is the
  // first ten characters. A failure leaves the trips out and says so in the console.
  function holidays(tok) {
    if (!SENSORS.trips) return Promise.resolve([]);
    var td = ymd(now()), end = (+td.slice(0, 4) + 1) + td.slice(4);
    return tok.callApi("GET", "calendars/" + SENSORS.trips + "?start=" + td + "T00:00:00&end=" + end + "T00:00:00")
      .then(function (evs) { return evs.filter(function (e) { return /\bholidays?\b/i.test(e.summary || ""); }).map(function (e) {
        return { date: (e.start.date || e.start.dateTime).slice(0, 10), label: e.summary.replace(/\bholidays?\b/i, "").replace(/^[\s:,-]+|[\s:,-]+$/g, "") || "Holiday" }; }); })
      .catch(function (e) { console.warn("meadow: holidays", e); return null; });
  }
  // The week, two ways. Calendar mode (a calendar on any person): ask Home Assistant's
  // calendar API for each one, so no template sensor is needed. v1.0.0 mode: read the
  // family_week template sensor. A calendar that fails is named on its owner's card
  // and its events are left out; the rest of the week still draws.
  function readWeek(tok) {
    if (!CONFIG.calendarMode) return getState(SENSORS.week, tok).catch(function () {
      throw new Error(SENSORS.week + " not found. Give people a calendar in the card editor, or set up that sensor");
    }).then(function (s) {
      var wk = s.attributes || {};
      if (!Array.isArray(wk.events)) throw new Error(SENSORS.week + " has no events list (state " + s.state + ")");
      return { events: wk.events, at: wk.checked_at ? new Date(wk.checked_at) : null, failed: [] };
    });
    var range = weekRange(now()), jobs = [];
    PEOPLE.forEach(function (p) { (p.calendars || []).forEach(function (id) {
      jobs.push(tok.callApi("GET", calendarPath(id, range)).then(function (evs) { return { ok: true, rows: parseCalendarEvents(evs, p.name, range) }; })
        .catch(function (e) { console.warn("meadow: " + id, e); return { ok: false, who: p.name, id: id, err: (e && (e.message || e.body && e.body.message)) || String(e) }; }));
    }); });
    return Promise.all(jobs).then(function (rs) {
      var ok = rs.filter(function (r) { return r.ok; }), failed = rs.filter(function (r) { return !r.ok; });
      if (!ok.length) throw new Error("no calendar answered (" + failed.map(function (f) { return f.id; }).join(", ") + ")");
      return { events: [].concat.apply([], ok.map(function (r) { return r.rows; })), at: new Date(), failed: failed };
    });
  }
  function load() {
    if (DEMO) { DATA = demoData(); DATA.events = byStart(DATA.events); refreshTags(); return; }
    var schoolErr = null, extraErr = null;
    hassToken().then(function (tok) {
      // the school sensors are optional: a missing one blanks its part of the School card, nothing else
      function opt(id) { if (!id) return Promise.resolve(null);
        return getState(id, tok).catch(function (e) { console.warn("meadow: " + id, e); schoolErr = e.message || String(e); return null; }); }
      // sensors.extra is optional too, but a configured one that is missing says so on every card
      var extra = !SENSORS.extra ? Promise.resolve(null) : getState(SENSORS.extra, tok)
        .then(function (s) { if (/^(unavailable|unknown)$/.test(s.state) && !(s.attributes || {}).checked_at) throw new Error(SENSORS.extra + " is " + s.state); return s; })
        .catch(function (e) { console.warn("meadow: extra", e); extraErr = e.message || String(e); return null; });
      // each child's timetable, lunch and choice entities: a missing one is null, and its card says so
      var ids = schoolEntities(), states = {};
      var school = Promise.all(ids.map(function (id) { return getState(id, tok).then(function (s) { states[id] = s; })
        .catch(function (e) { console.warn("meadow: " + id, e); states[id] = null; }); })).then(function () { return states; });
      return Promise.all([readWeek(tok), extra,
        school, opt(SENSORS.kit), null,                  // null: the slot v1.1.0 used for sensors.lunch
        opt(SENSORS.sun), opt(SENSORS.weather), holidays(tok)]); })
      .then(function (s) {
        var wk = s[0];
        DATA = { events: byStart(wk.events), weekAt: wk.at, calFailed: wk.failed, extra: s[1] ? s[1].attributes || null : null, extraErr: extraErr, error: null, gotAt: new Date(),
          school: { states: s[2], kit: s[3] && s[3].attributes, err: schoolErr },
          sun: s[5] && s[5].attributes, weather: s[6] ? { state: s[6].state, attributes: s[6].attributes } : null,
          holidays: s[7] || (DATA.holidays || []) };                                // a failed fetch keeps the last good list
        refreshTags();
      })
      .catch(function (e) { console.error("meadow: load failed", e); DATA.error = e.message || String(e); });
  }
  function demoData() {
    var d = function (n) { return ymd(new Date(now().getTime() + n * 864e5)); };
    var at = function (n, hm) { return { day: d(n), start: d(n) + "T" + hm + ":00", at: hm, all_day: false }; };
    var ad = function (n) { return { day: d(n), start: d(n), at: "", all_day: true }; };
    function ev(who, what, w) { w.who = who; w.what = what; return w; }
    return {
      weekAt: now(), gotAt: now(), error: null,
      // Today's timed events exercise the day plan: ?hour=10 sends Parent 1 out to the
      // dentist while the kids are at school, 15.5 puts Kid 2 at the bandstand, 16.5
      // Kid 3 at the pond, 17 Kid 1 on the pitch, 19.5 Parent 2 out. Pat's birthday is a
      // friend's, so from 17 there is a house party at the cottage (see Parties).
      events: [
        ev("House", "Bin day", ad(0)), ev("Parent 2", "Pat's birthday", ad(0)), ev("Parent 1", "Dentist", at(0, "10:15")), ev("Parent 2", "Book club", at(0, "19:30")), ev("Kid 1", "Football training", at(0, "17:00")),
        ev("Kid 2", "Drama club", at(0, "15:30")), ev("Kid 3", "Swimming", at(0, "16:30")), ev("Parent 1", "Dentist", at(1, "09:40")),
        ev("Kid 2", "Sleepover at Ella's", ad(2)), ev("Kid 3", "Cubs", at(2, "18:30")), ev("Kid 1", "Mock exams start", ad(3)),
        ev("House", "Window cleaner", ad(4)), ev("Parent 2", "Late shift", at(4, "14:00"))
      ],
      school: { states: demoSchool(), kit: { kit_today: "PE kit", kit_tomorrow: "Swimming kit" } },
      extra: { checked_at: now().toISOString(), kit: [{ who: "Kid 3", what: "PE kit on Fridays" }], flags: ["Half term starts in three weeks"],
        schools: [{ who: "Kid 2", school: "Demo High", terms: [{ label: "Term 1", from: d(-20), to: d(24) }, { label: "Term 2", from: d(34), to: d(80) }], days: [{ date: d(9), what: "INSET, closed" }] },
          { who: "Kid 1", school: "Demo College", terms: [{ label: "Term 1", from: null, to: d(22), note: "start not published" }, { label: "Term 2", from: d(32), to: null }], days: [] }],
        sources: { ok: ["demo"], unavailable: ["parent-mail"] },
        items: [{ who: "Kid 2", date: d(2), kind: "homework", what: "Maths homework due" }, { who: "Kid 3", date: d(1), kind: "kit", what: "Swimming kit" },
          { who: "Kid 1", date: d(9), kind: "event", what: "Parents evening" }, { who: "Parent 1", date: d(5), kind: "deadline", what: "School trip form back" }] }
    };
  }
  // The demo's school sensors, in the v1.2.0 shapes (README, "School data per child"): the
  // first school kid on a two-week timetable, the second on a one-week timetable with lunch
  // and a choice, the third on lunch only. Dates count from this Monday, so they never go stale.
  function demoSchool() {
    var mon = mondayOf(now()), day = function (n) { return ymd(addDays(mon, n)); };
    function L(list) { return list.map(function (x) { var s = x.split("|"); return s[1] ? { subject: s[0], room: s[1] } : { subject: s[0] }; })
      .map(function (l, i) { l.p = i + 1; return l; }); }
    function week(rows) { var o = {}; ["mon", "tue", "wed", "thu", "fri"].forEach(function (k, i) { o[k] = L(rows[i]); }); return o; }
    var tt1 = { weeks: ["A", "B"], anchor: day(0),
      periods: [{ p: 1, start: "08:45", end: "09:45" }, { p: 2, start: "09:45", end: "10:45" }, { p: 3, start: "11:05", end: "12:05" }, { p: 4, start: "12:05", end: "13:05" }, { p: 5, start: "13:50", end: "14:50" }],
      days: { A: week([["Maths|M1", "English|E2", "Science|S3", "History|H1", "Art|A1"], ["French|L2", "Maths|M1", "English|E2", "Music|MU", "Drama|D1"],
          ["Maths|M1", "English|E2", "PE|Gym", "Science|S3", "Art|A1"], ["History|H1", "Maths|M1", "French|L2", "Music|MU", "English|E2"], ["Science|S3", "Geography|G1", "Maths|M1", "PE|Field", "English|E2"]]),
        B: week([["English|E2", "Maths|M1", "Geography|G1", "PE|Gym", "Computing|IT1"], ["Science|S2", "Science|S2", "Maths|M1", "RE|R1", "French|L2"],
          ["Art|A1", "English|E2", "History|H1", "Maths|M1", "Music|MU"], ["PE|Field", "Computing|IT1", "English|E2", "Science|S3", "Drama|D1"], ["Maths|M1", "French|L2", "Geography|G1", "English|E2", "Art|A1"]]) },
      closed: [] };
    var tt2 = { weeks: ["A"],
      periods: [{ p: 1, start: "09:00", end: "10:15" }, { p: 2, start: "10:30", end: "12:00" }, { p: 3, start: "13:00", end: "14:00" }, { p: 4, start: "14:10", end: "15:10" }],
      days: { A: week([["Maths", "English", "Science", "PE"], ["Phonics", "Maths", "Art", "Music"], ["Maths", "English", "Computing", "Topic"],
        ["Spelling", "Maths", "PE", "French"], ["Maths", "English", "Forest school", "Golden time"]]) },
      closed: [{ date: day(9), note: "INSET" }] };
    var DISH = [
      [[["Pasta bake", "main", "Gluten,Milk"], ["Veggie pasta bake", "veg", "Gluten,Milk"], ["Jacket potato", "jacket", "Milk"]], ["Apple crumble", "Gluten,Milk"]],
      [[["Fish fingers", "main", "Fish,Gluten"], ["Veggie fingers", "veg", "Gluten,Soya"]], ["Yoghurt", "Milk"]],
      [[["Roast chicken", "main", "Celery"], ["Lentil roast", "veg", "Celery,Mustard"]], ["Fruit jelly", ""]],
      [[["Beef chilli", "main", "Celery"], ["Bean chilli", "vegan", ""]], ["Flapjack", "Gluten"]],
      [[["Fish and chips", "main", "Fish,Gluten"], ["Cheese and tomato pizza", "veg", "Gluten,Milk"]], ["Shortbread", "Gluten,Milk"]]];
    function menu(shift, closed, choices) {
      var m = {};
      for (var w = 0; w < 2; w++) for (var i = 0; i < 5; i++) {
        var n = w * 7 + i, dd = DISH[(i + shift + w * 2) % 5];
        if (closed[n]) { m[day(n)] = { status: "closed", note: closed[n] }; continue; }
        m[day(n)] = { status: "served", options: dd[0].map(function (o) { return { name: o[0], kind: o[1], allergens: o[2] ? o[2].split(",") : [] }; }),
          pudding: { name: dd[1][0], allergens: dd[1][1] ? dd[1][1].split(",") : [] } };
        if (choices[n]) m[day(n)].choice = choices[n];
      }
      return { menu: m, menu_ends: day(11) };
    }
    var l2 = menu(0, { 9: "INSET" }, { 1: "Veggie fingers" }), l3 = menu(1, {}, {});
    return { "sensor.demo_timetable_1": { state: "A", attributes: { timetable: tt1 } }, "sensor.demo_timetable_2": { state: "A", attributes: { timetable: tt2 } },
      "sensor.demo_lunch_2": { state: "served", attributes: l2 }, "sensor.demo_lunch_3": { state: "served", attributes: l3 } };
  }
  function byStart(ev) { return ev.slice().sort(function (a, b) { return new Date(a.start) - new Date(b.start); }); }
  function todayFor(name) { var td = ymd(now()); return DATA.events.filter(function (e) { return e.who === name && e.day === td; }); }
  function refreshTags() {
    PEOPLE.forEach(function (p) { TAGS[p.name] = bakeTag(p, todayFor(p.name).length); });
    var td = ymd(now()), n = ((DATA.extra || {}).items || []).filter(function (i) { return i.date === td && KIDS.indexOf(i.who) >= 0; }).length;
    TAGS.School = bakeTag({ name: "School", col: "#C9594A" }, n);
  }
  // The workshop's fence board: "45%" while printing or paused, a tick when done,
  // baked again only when the words change. Nothing while the plot is empty.
  var BOARD = { key: null, c: null, w: 0, h: 0 };
  function shopBoard() {
    var ps = printerState(), txt = ps === "running" || ps === "pause" ? Math.round(PR.progress) + "%" : ps === "finish" ? "done" : /^(prepare|slicing|init)$/.test(ps) ? "soon" : null;
    if (!txt) return null;
    if (txt !== BOARD.key) {
      var g0 = canvas(10, 10).getContext("2d"); g0.font = "600 " + 15 * K + "px Fredoka";
      var w = g0.measureText(txt).width + 16 * K, h = 22 * K, c = canvas(w + 2 * K, h + 8 * K), g = c.getContext("2d");
      g.fillStyle = "#B08A5A"; g.fillRect(w / 2 - K, h, 2 * K, 8 * K);
      g.fillStyle = "#F2E8D8"; g.strokeStyle = "#7A5238"; g.lineWidth = 1.5 * K; rr(g, K, K, w, h - K, 3 * K); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = "600 " + 15 * K + "px Fredoka"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, K + w / 2, h / 2 + K);
      BOARD = { key: txt, c: c, w: c.width / K, h: c.height / K };
    }
    return BOARD;
  }
  // The kit bag by the cottage door (SCHOOL_WHO.kit's kit): mornings before school when the kit sensor
  // names kit for today, evenings when it names kit for tomorrow. The live sensor
  // only has kit_today so far; kit_tomorrow is read in case it grows one. No sensor,
  // no bag.
  function kitBag() {
    var k = DATA.school && DATA.school.kit; if (!k) return null;
    var d = now(), h = d.getHours(), v = h < 9 && weekday(d) ? k.kit_today : h >= 17 ? k.kit_tomorrow : null;
    return v && v !== "none" && v !== "unknown" ? v : null;
  }

  // ── The printer ─────────────────────────────────────────────────────────────
  // The Bambu A1 Mini's sensors, polled on their own timer: the five minute week
  // poll is too slow to watch a build. remaining_time is hours as a float. Anything
  // older than six minutes, or a poll that failed, is "missing" and the plot empties:
  // a stale 45% must not keep a builder hammering.
  var PR = { status: "missing", progress: 0, remain: null, name: "", layer: null, layers: null, at: null };
  var PR_ID = SENSORS.printer, PR_KEYS = ["print_status", "print_progress", "remaining_time", "task_name", "current_layer", "total_layer_count"];
  function num(s) { var v = s && parseFloat(s.state); return isFinite(v) ? v : null; }
  function setPrinter(s) {
    var st = s[0] && s[0].state, name = s[3] && s[3].state;
    PR = { status: !s[0] ? "missing" : st === "unavailable" ? "offline" : st || "unknown",
      progress: clamp(num(s[1]) || 0, 0, 100), remain: num(s[2]) == null ? null : Math.round(num(s[2]) * 60),
      name: name && !/^(unknown|unavailable)$/.test(name) ? name.replace(/\.gcode(\.3mf)?$|\.3mf$/i, "").replace(/_/g, " ") : "",
      layer: num(s[4]), layers: num(s[5]), at: new Date(), err: null };
  }
  // What the scene should show: a real status while the reading is fresh, else "empty".
  function printerState() {
    if (!PR.at || Date.now() - PR.at > 6 * 60000) return "empty";
    return /^(running|pause|prepare|slicing|init|finish|failed|idle)$/.test(PR.status) ? PR.status : "empty";
  }
  function demoPrinter() {
    var m = (PRFORCE || "running:38").split(":"), st = m[0], p = m[1] != null ? +m[1] : st === "finish" ? 100 : st === "failed" ? 61 : /^(idle|offline|unknown|missing)$/.test(st) ? 0 : 38;
    return { status: st === "missing" ? "missing" : st, progress: p, remain: st === "running" || st === "pause" ? Math.round((100 - p) * 1.3) : 0,
      name: "Articulated Dragon", layer: Math.round(p * 1.25), layers: 125, at: st === "missing" ? null : new Date(), err: null };
  }

  // ── Letters ─────────────────────────────────────────────────────────────────
  // SENSORS.letter (an input_text helper), typed on a phone as "Kid 3: tea's at six". The name
  // picks who gets it (no name, or one the meadow does not know, and it goes to the
  // House); the postie carries it over; they wear it above their tag until their
  // card is opened, which shows it and clears the helper so the next note is new.
  // The key is text plus last_changed, so the same words sent twice count twice.
  // If the clear fails the letter is still remembered here, the corner says so, and
  // the poll keeps ignoring that key until the text changes.
  var LETTER = { seen: null, queue: [], clearErr: null };
  // Without the village there is no postie: a letter drops out of the sky onto its
  // person's tag instead, in the same hours the postie keeps, while they are here.
  var AIRMAIL = { t: 2 };
  function airmail(dt) {
    if (!LETTER.queue.length || nightness > 0.35) return;
    AIRMAIL.t -= dt; if (AIRMAIL.t > 0) return; AIRMAIL.t = 2;
    var L1 = LETTER.queue[0], to = fam.filter(function (f) { return f.person.name === L1.to; })[0];
    if (!to || offStage(to)) return;                                       // out: it waits
    LETTER.queue.shift();
    to.letter = L1; to.happy = 2.2; to.jump = 0.6; say("!", to.x, to.y - to.r * 2.6);
    parts.push({ kind: "icon", icon: ICON.letter, x: to.x, y: to.y - to.r * 3.4 - 40, vx: 0, vy: 20, life: 0.8, max: 0.8 });
  }
  function letterArrived(text, key) {
    if (key === LETTER.seen) return;
    LETTER.seen = key;
    var m = String(text).match(/^\s*([A-Za-z][A-Za-z0-9 ]*?)\s*[:,\-]\s*([\s\S]*)$/), who = null, body = text;
    if (m) { var nm = m[1].toLowerCase();
      who = PEOPLE.filter(function (p) { return [p.name].concat(p.aliases || []).some(function (a) { return a.toLowerCase() === nm; }); })[0]; if (who) body = m[2]; }
    if (!who) who = PEOPLE[PEOPLE.length - 1];
    LETTER.queue.push({ to: who.name, text: String(body).trim() || String(text), at: new Date(), key: key });
  }
  function clearLetter(l) {
    if (DEMO || l.key === "hook" || !SENSORS.letter) return;
    hassToken().then(function (h) {
      return h.callService("input_text", "set_value", { entity_id: SENSORS.letter, value: "" });
    }).then(function () { LETTER.clearErr = null; })
      .catch(function (e) { console.warn("meadow: could not clear the letter", e); LETTER.clearErr = e.message || String(e); });
  }
  // The music poll, every 10s: one player, so a pause stops the dancing within seconds.
  // SENSORS.music is the panel's universal player (follows input_select.music_target).
  // Music means playing, content type music, and not a podcast, audiobook or a bare .mp3
  // URL (the Six O'Clock News tile plays the BBC enclosure that way). Radio counts.
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
    if (MFORCE) { var mt = (Q.match(/[?&]mtitle=([^&]+)/) || [])[1], ma = (Q.match(/[?&]martist=([^&]+)/) || [])[1];   // ?mtitle= / ?martist= with ?music=on
      MUSIC.on = MFORCE === "on"; MUSIC.title = MUSIC.on ? (mt ? decodeURIComponent(mt.replace(/\+/g, " ")) : "Hit Me Like a Drum") : null;
      MUSIC.artist = MUSIC.on ? (ma ? decodeURIComponent(ma.replace(/\+/g, " ")) : mt ? null : "Parov Stelar feat. Timothy Auld") : null; return; }
    if (DEMO || !MUSIC_ID) return;
    hassToken().then(function (tok) { return getState(MUSIC_ID, tok); }).then(function (s) {
      MUSIC.on = isMusic(s); MUSIC.title = MUSIC.on ? s.attributes.media_title || null : null; MUSIC.artist = MUSIC.on ? s.attributes.media_artist || null : null;
      MUSIC.at = new Date(); MUSIC.err = null;
    }).catch(function (e) { console.warn("meadow: music poll failed", e); MUSIC.on = false; MUSIC.err = e.message || String(e); });
  }
  // The quick poll: the printer's six sensors, the letter helper and the rain sensor, every 45s.
  function loadLive() {
    if (DEMO) { PR = demoPrinter();
      if (LFORCE) letterArrived(decodeURIComponent(LFORCE.replace(/\+/g, " ")), "hook"); return; }
    hassToken().then(function (tok) {
      function opt(id) { if (!id) return Promise.resolve(null); return getState(id, tok).catch(function (e) { console.warn("meadow: " + id, e); return null; }); }
      return Promise.all(PR_KEYS.map(function (k) { return opt(PR_ID && PR_ID + k); }).concat([opt(SENSORS.letter), opt(SENSORS.rain)]));
    }).then(function (s) {
      setPrinter(s);
      var l = s[6], txt = l && l.state, r = s[7] && s[7].state;
      if (txt && !/^(unknown|unavailable)$/.test(txt) && txt.trim()) letterArrived(txt, txt + "|" + l.last_changed);
      RAIN = RAIN_STATES.wet.indexOf(r) >= 0 ? "raining" : RAIN_STATES.dry.indexOf(r) >= 0 ? "none" : null;
      if (r && !RAIN && !/^(unknown|unavailable)$/.test(r)) console.warn("meadow: rain sensor said " + r + ", ignoring it");
    }).catch(function (e) { console.warn("meadow: live poll failed", e); PR.at = null; PR.err = e.message || String(e); RAIN = null; });
  }

  // ── Tap shortcuts ───────────────────────────────────────────────────────────
  // A building opens its own dashboard view (VIEW, in CONFIG), so the kids skip the up/down
  // keys: workshop -> printer, bandstand -> music, cottage -> home, robot -> office.
  // pushState on the dashboard page and a
  // popstate, which Home Assistant's router follows without reloading anything. It
  // works because this page is same-origin with the dashboard (the keys already go
  // up the same way). A null path leaves the building as scenery.
  var NAVS = [];                                     // what a tap asked for, for ?dbg checks
  function goView(path) {
    if (!path) return false;
    NAVS.push({ path: path, at: Date.now() });
    try { return HA.navigate(path); }
    catch (e) { console.warn("meadow: could not open " + path, e); say("oops", W / 2, H / 2); return false; }
  }

  // ── The office robot ────────────────────────────────────────────────────────
  // Optional, off unless OFFICE_URL is set. A little robot wanders the meadow saying
  // an agent office's latest line. OFFICE_URL must answer GET with JSON shaped
  // { <source>: { data: { title|project, stations: [{ id, state, detail, attention }] } } }
  // and allow this page's origin (CORS). Ours is a small status server fed by a
  // Claude Code mod; docs/06-views.md has the outline.
  //   someone waiting on you (attention "ask")      -> "<session> / needs you", red rim
  //   otherwise the newest still-true line:          -> "<session> / <detail>" (a working station's current
  //     call) or "<session> / all done" (a turn that just ended), newest first
  //   nobody working for 45 s                       -> no bubble, eyes on
  //   server unreachable (its computer asleep)      -> robot stands still, screen dark, grey "office offline"
  // Never a made-up line: no bubble unless the server said it in the last 45 s.
  var OFFICE = { ok: null, line: null, err: null, at: null }, OSEEN = {}, ODONE = {};   // OSEEN/ODONE: station -> the line it said and when it first said it
  var ROBOT = null, ROBO_ON = null, ROBO_OFF = null, ROBO_BUB = null, ROBO_KEY = "";
  var HOLD_MS = 45000, ROBO_SC = 1.2;                // about the family's height
  function officeName(d) { var n = String(d.title || d.project || "agent").trim() || "agent"; return n.length > 22 ? n.slice(0, 21) + "…" : n; }
  function officeLine(all, nowMs) {
    var tnow = nowMs || Date.now(), seen = {}, ask = null, best = null, src, d, i, st, key, nm, c;
    for (src in all) { d = all[src] && all[src].data; if (!d || !Array.isArray(d.stations)) continue; nm = officeName(d);
      for (i = 0; i < d.stations.length; i++) { st = d.stations[i] || {}; key = src + "/" + st.id;
        if (st.attention === "ask" && !ask) ask = { name: nm, text: "needs you", kind: "ask", key: key, at: tnow };
        if (st.attention === "done") { seen["d" + key] = 1; c = ODONE[key] || (ODONE[key] = { name: nm, text: "all done", kind: "done", key: key, at: tnow }); if (!best || c.at > best.at) best = c; }
        if (st.state === "working" && st.detail) { seen["w" + key] = 1;
          c = OSEEN[key]; if (!c || c.text !== String(st.detail)) c = OSEEN[key] = { name: nm, text: String(st.detail), kind: "work", key: key, at: tnow };
          if (!best || c.at > best.at) best = c; } } }
    for (key in OSEEN) if (!seen["w" + key]) delete OSEEN[key];
    for (key in ODONE) if (!seen["d" + key]) delete ODONE[key];
    var cur = OFFICE.line;
    if (ask) OFFICE.line = ask;
    else if (best) { best.last = tnow; OFFICE.line = best; }       // the newest thing anyone said that is still true
    else if (!cur || cur.kind === "ask" || tnow - cur.last > HOLD_MS) OFFICE.line = null;
    return OFFICE.line;
  }
  function loadOffice() {
    if (OFORCE) { var f = decodeURIComponent(OFORCE.replace(/\+/g, " ")), m = f.match(/^([^:]+):(.+)$/);
      OFFICE.ok = f !== "off"; OFFICE.err = f === "off" ? "forced" : null;
      OFFICE.line = f === "off" || f === "quiet" || !m ? null : m[1] === "ask" ? { name: m[2], text: "needs you", kind: "ask", key: "hook", at: Date.now() } : { name: m[1], text: m[2], kind: "work", key: "hook", at: Date.now() };
      return; }
    if (DEMO || !OFFICE_URL) return;
    var ac = window.AbortController ? new AbortController() : null, tm = ac ? setTimeout(function () { ac.abort(); }, 6000) : 0;
    fetch(OFFICE_URL, { cache: "no-store", signal: ac ? ac.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("office returned " + r.status); return r.json(); })
      .then(function (all) { OFFICE.ok = true; OFFICE.err = null; OFFICE.at = new Date(); var was = OFFICE.line, ln = officeLine(all);
        if (ln && (!was || ln.key !== was.key || ln.text !== was.text) && ROBOT) { ROBOT.hop = 0.5; ROBOT.flash = 1.2; } })
      .catch(function (e) { if (OFFICE.ok !== false) console.warn("meadow: office poll failed", e); OFFICE.ok = false; OFFICE.err = e.message || String(e); OFFICE.line = null; })
      .then(function () { clearTimeout(tm); });
  }
  // Body and head baked once (screen lit and dark); legs and the antenna light live.
  function bakeRobot(lit) {
    var w = 60, h = 80, c = canvas(w * K, h * K), g = c.getContext("2d"), cx = w / 2, ft = h - 2;
    g.scale(K, K); g.lineJoin = "round";
    g.fillStyle = "#BDB6AA"; rr(g, cx - 22, ft - 31, 7, 15, 3.5); g.fill(); rr(g, cx + 15, ft - 31, 7, 15, 3.5); g.fill();   // arms
    g.fillStyle = "#EDE8DE"; g.strokeStyle = "#8A8378"; g.lineWidth = 2;
    rr(g, cx - 16, ft - 35, 32, 26, 8); g.fill(); g.stroke();                                                            // body
    g.fillStyle = "#D97757"; rr(g, cx - 7, ft - 29, 14, 9, 3); g.fill();                                                 // Claude-orange chest plate
    g.fillStyle = "#8A8378"; g.fillRect(cx - 4, ft - 40, 8, 6);                                                          // neck
    g.fillStyle = "#EDE8DE"; rr(g, cx - 19, ft - 66, 38, 28, 10); g.fill(); g.stroke();                                  // head
    g.fillStyle = lit ? "#2B2433" : "#5E5966"; rr(g, cx - 14, ft - 61, 28, 18, 6); g.fill();                             // screen
    if (lit) { g.fillStyle = "#7FE3D0"; rr(g, cx - 9, ft - 57, 5, 7, 2.5); g.fill(); rr(g, cx + 4, ft - 57, 5, 7, 2.5); g.fill();
      g.strokeStyle = "#7FE3D0"; g.lineWidth = 1.8; g.beginPath(); g.arc(cx, ft - 50, 4, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke(); }
    else { g.strokeStyle = "#9A96A0"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 9, ft - 53); g.lineTo(cx - 4, ft - 53); g.moveTo(cx + 4, ft - 53); g.lineTo(cx + 9, ft - 53); g.stroke(); }
    g.strokeStyle = "#8A8378"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, ft - 66); g.lineTo(cx, ft - 74); g.stroke();  // antenna stalk
    return { c: c, ax: cx * K, ay: ft * K, k: K };
  }
  function clipWords(g, text, max) {
    if (g.measureText(text).width <= max) return text;
    while (text.length > 1 && g.measureText(text + "…").width > max) text = text.slice(0, -1);
    var sp = text.lastIndexOf(" "); if (sp > text.length * 0.6) text = text.slice(0, sp);
    return text.replace(/[\s,.;:-]+$/, "") + "…";
  }
  function bakeRobotBubble(line, offline) {
    var fn = "600 " + 13 * K + "px Fredoka", ft = "500 " + 16 * K + "px Fredoka", max = 250 * K, pad = 12 * K;
    var g0 = canvas(10, 10).getContext("2d"), name = offline ? null : line.name, text = offline ? "office offline" : line.text, nw = 0;
    g0.font = ft; text = clipWords(g0, text, max); var tw = g0.measureText(text).width;
    if (name) { g0.font = fn; name = clipWords(g0, name, max); nw = g0.measureText(name).width; }
    var w = Math.max(tw, nw) + pad * 2, h = (name ? 46 : 28) * K, c = canvas(w + 4 * K, h + 4 * K), g = c.getContext("2d"), x = 2 * K, y = 2 * K;
    var rim = offline ? "#A9A4AF" : line.kind === "ask" ? "#C4553A" : "#D97757";
    g.fillStyle = offline ? "rgba(240,238,244,.92)" : "rgba(255,255,255,.96)"; g.strokeStyle = rim; g.lineWidth = 2.5 * K;
    rr(g, x, y, w, h, 12 * K); g.fill(); g.stroke();
    g.textAlign = "left"; g.textBaseline = "middle";
    if (name) { g.fillStyle = line.kind === "ask" ? "#C4553A" : "#B5583A"; g.font = fn; g.fillText(name, x + pad, y + 14 * K); }
    g.fillStyle = offline ? "#6E6A75" : "#26352C"; g.font = ft; g.fillText(text, x + pad, name ? y + 32 * K : y + h / 2 + K);
    return { c: c, w: c.width / K, h: c.height / K, rim: rim, fill: offline ? "rgba(240,238,244,.92)" : "rgba(255,255,255,.96)" };
  }
  function updateRobot(dt) {
    if (!LAY.R || !(OFFICE_URL || OFORCE)) return;              // no office configured: no robot at all
    if (!ROBOT) { var p0 = spot(false); ROBOT = { x: p0.x, y: p0.y, tx: p0.x, ty: p0.y, wait: rand(1, 4), face: 1, phase: 0, gait: 0, hop: 0, flash: 0, bubBox: null }; }
    var R = ROBOT, off = OFFICE.ok === false;
    R.hop = Math.max(0, R.hop - dt); R.flash = Math.max(0, R.flash - dt);
    if (off) { R.gait = Math.max(0, R.gait - dt * 3); return; }      // powered down where it stood
    var dx = R.tx - R.x, dy = R.ty - R.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 3) { R.gait = Math.max(0, R.gait - dt * 3); R.wait -= dt;
      if (R.wait <= 0) { var p = spot(false); R.tx = p.x; R.ty = p.y; R.wait = rand(4, 10); } return; }
    var v = 30 * depth(R.y), stp = Math.min(d, v * dt);
    R.x += dx / d * stp; R.y += dy / d * stp; R.face = dx >= 0 ? 1 : -1;
    R.gait = Math.min(1, R.gait + dt * 3); R.phase += dt * 9;
  }
  function drawRobot(time) {
    var R = ROBOT; if (!R) return;
    if (!ROBO_ON) { ROBO_ON = bakeRobot(true); ROBO_OFF = bakeRobot(false); }
    var off = OFFICE.ok === false, sc = depth(R.y) * ROBO_SC;
    var hop = (R.hop > 0 ? Math.sin((1 - R.hop / 0.5) * Math.PI) * 14 : Math.abs(Math.sin(R.phase)) * 2.5 * R.gait) * sc;
    var bob = off ? 0 : Math.sin(time * 2.2) * 0.8;
    var sw = 40 * sc * (1 - Math.min(0.4, hop / 40));
    ctx.drawImage(SHADOW, R.x - sw / 2, R.y - sw * 0.14, sw, sw * 0.28);
    ctx.fillStyle = "#6E6860";                                         // legs, stepping while it walks
    var l1 = Math.max(0, Math.sin(R.phase)) * 4 * R.gait, l2 = Math.max(0, -Math.sin(R.phase)) * 4 * R.gait;
    ctx.fillRect(R.x - 9 * sc, R.y - hop - (10 + l1) * sc, 6 * sc, (10 - l1 * 0.3) * sc);
    ctx.fillRect(R.x + 3 * sc, R.y - hop - (10 + l2) * sc, 6 * sc, (10 - l2 * 0.3) * sc);
    blit(off ? ROBO_OFF : ROBO_ON, R.x, R.y - hop - 7 * sc + bob, R.face, 1, 1, sc, off ? 0 : 0.04 * R.face * R.gait);
    var ax = R.x, ay = R.y - hop - 7 * sc + bob - 76 * sc, on = !off && (R.flash > 0 ? Math.sin(time * 18) > 0 : Math.sin(time * 3) > -0.3);
    if (on && DARK > 0.05) { ctx.globalAlpha = Math.min(1, DARK + 0.3); ctx.drawImage(GLOW, ax - 9, ay - 9, 18, 18); ctx.globalAlpha = 1; }
    ctx.fillStyle = off ? "#8C8794" : on ? (OFFICE.line && OFFICE.line.kind === "ask" ? "#FF6B6B" : "#FFB35C") : "#B5583A";
    ctx.beginPath(); ctx.arc(ax, ay, 3.6 * sc, 0, 7); ctx.fill();
  }
  function drawRobotBubble(time) {
    var R = ROBOT; if (!R) return;
    var off = OFFICE.ok === false, line = OFFICE.line;
    if (!off && !line) { R.bubBox = null; return; }
    var key = off ? "off" : line.kind + "|" + line.name + "|" + line.text;
    if (key !== ROBO_KEY) { ROBO_KEY = key; ROBO_BUB = bakeRobotBubble(line, off); }
    var b = ROBO_BUB, sc = depth(R.y) * ROBO_SC, head = R.y - 92 * sc + (off ? 0 : Math.sin(time * 1.6) * 1.5);
    var bx = clamp(R.x - b.w / 2, 8, W - b.w - 8), by = head - b.h - 6;
    var tx = clamp(R.x, bx + 16, bx + b.w - 16);                      // the tail stays on the robot when the bubble hits an edge
    ctx.fillStyle = b.fill; ctx.strokeStyle = b.rim; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(tx - 7, by + b.h - 4); ctx.lineTo(tx, by + b.h + 6); ctx.lineTo(tx + 7, by + b.h - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.drawImage(b.c, bx, by, b.w, b.h);
    R.bubBox = [bx, by, b.w, b.h + 10];
  }
  function robotHit(x, y) {
    var R = ROBOT; if (!R) return false;
    var sc = depth(R.y) * ROBO_SC;                                                       // generous: a wall panel, small fingers
    if (x > R.x - 46 && x < R.x + 46 && y > R.y - 100 * sc && y < R.y + 16) return true;
    var b = R.bubBox;
    return !!(b && x >= b[0] - 10 && x <= b[0] + b[2] + 10 && y >= b[1] - 10 && y <= b[1] + b[3] + 10);
  }

  // ── Announcements, due times, status tiles ──────────────────────────────────
  // v1.6.0. Each is off unless the config names its entity, and each lives in the HUD layer
  // (HTML over the canvas), so neither the scene's pixels nor the sim change for them:
  //   CONFIG.announcement  a banner under the countdowns while the entity holds text; a tap hides it here
  //   CONFIG.due           due-time chips under the countdowns, and each person's items on their card
  //   CONFIG.status_tiles  up to four icon tiles under the corner hint; a tap opens Home Assistant's more-info
  // Read from hass.states with the clock, once a second, and redrawn only when the words change.
  // A configured entity that is missing or unavailable says so in grey rather than vanishing.
  // The demo makes up a state for each configured entity (demoExtra).
  var ANN_CONF = CONFIG.announcement || null, DUE_CONF = CONFIG.due || null, TILE_CONF = CONFIG.status_tiles || [];
  var XS = { ann: null, annKey: null, hidden: null, due: null, dueKey: null, tiles: [], tileKey: null, taps: [] };
  var XNAMES = [], XCANON = {};
  PEOPLE.forEach(function (p) { [p.name].concat(p.aliases || []).forEach(function (a) { XNAMES.push(String(a)); XCANON[String(a).toLowerCase()] = p.name; }); });
  var XICON = {
    clock: '<circle cx="12" cy="12.5" r="9.5" fill="#FFF4E8" stroke="#8A5A3C" stroke-width="1.8"/><path d="M12 7v5.8l3.6 2.2" fill="none" stroke="#26352C" stroke-width="2" stroke-linecap="round"/>',
    bell: '<path d="M12 3.2c3.6 0 6 2.8 6 6.6v4.4l2 3.2H4l2-3.2V9.8c0-3.8 2.4-6.6 6-6.6z" fill="#E8A93C"/><path d="M8.6 7.4q1.4-2 3.4-2" fill="none" stroke="#FFF4C8" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="19.6" r="2.3" fill="#8A5A3C"/><rect x="11" y="1" width="2" height="2.8" rx="1" fill="#8A5A3C"/>'
  };
  function xIcon(k) { return '<svg class="dic" viewBox="0 0 24 24">' + XICON[k] + "</svg>"; }
  // A tile's icon, 32x40: the liquid, mercury or light takes the reading's colour and level.
  function tileSvg(kind, col, level, na, uid) {
    var ink = na ? "#8A8A94" : "#26352C", glass = "#F4F7FA", y = function (top, bot) { return (bot - (bot - top) * level).toFixed(1); }, s = "";
    if (kind === "flask") {
      var body = "M13 6h6v5c0 1.2 1 2.1 2.8 3.3C25 16.4 27 19.4 27 24c0 6.4-4.9 11.5-11 11.5S5 30.4 5 24c0-4.6 2-7.6 5.2-9.7C12 13.1 13 12.2 13 11z";
      s = '<defs><clipPath id="' + uid + '"><path d="' + body + '"/></clipPath></defs><path d="' + body + '" fill="' + glass + '"/>' +
        (level > 0 ? '<rect x="4" y="' + y(13, 35.5) + '" width="24" height="30" fill="' + col + '" clip-path="url(#' + uid + ')"/>' : "") +
        '<path d="' + body + '" fill="none" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/><rect x="12" y="2.5" width="8" height="4.5" rx="1.6" fill="#B08A5A"/>' +
        '<path d="M9.5 21q-1.2 2.6-.6 5.6" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.8" stroke-linecap="round"/>';
    } else if (kind === "thermometer") {
      s = '<rect x="12.5" y="3" width="7" height="25" rx="3.5" fill="' + glass + '" stroke="' + ink + '" stroke-width="1.8"/><circle cx="16" cy="31" r="6" fill="' + (na ? glass : col) + '" stroke="' + ink + '" stroke-width="1.8"/>' +
        (level > 0 ? '<rect x="14.5" y="' + y(6, 28) + '" width="3" height="' + (28 - +y(6, 28) + 1).toFixed(1) + '" rx="1.5" fill="' + col + '"/>' : "") +
        '<path d="M21 9h3M21 14h3M21 19h3" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round"/>';
    } else if (kind === "bulb") {
      var lit = level > 0.5;
      s = (lit ? '<circle cx="16" cy="15" r="14" fill="' + col + '" fill-opacity=".25"/>' : "") +
        '<path d="M16 4a10 10 0 00-6 18c1.4 1.1 2 2.4 2 4h8c0-1.6.6-2.9 2-4a10 10 0 00-6-18z" fill="' + (lit ? col : glass) + '" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<rect x="12" y="27" width="8" height="6" rx="1.5" fill="#9AA0A8" stroke="' + ink + '" stroke-width="1.4"/><path d="M13.5 37h5" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M12.5 12q1.4-3 4.4-3.4" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.8" stroke-linecap="round"/>';
    } else if (kind === "door") {
      var open = level > 0.5;
      s = '<rect x="6" y="3" width="20" height="34" rx="2" fill="' + (open ? "#3B4A40" : glass) + '" stroke="' + ink + '" stroke-width="1.8"/>' +
        (open ? '<path d="M6 3l11 4v34l-11-4z" fill="' + col + '" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/><circle cx="14.5" cy="22" r="1.4" fill="#F3DE7C"/>'
          : '<rect x="9" y="6" width="14" height="28" rx="1.5" fill="' + col + '"/><circle cx="20" cy="21" r="1.5" fill="#F3DE7C"/>');
    } else {
      var on = level > 0.5;
      s = '<path d="M16 30v4q0 3 4 3h6" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/><path d="M11 10h3V4M18 10h3V4" fill="none" stroke="#9AA0A8" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M8 10h16v9a8 8 0 01-16 0z" fill="' + (on ? col : glass) + '" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        (on ? '<path d="M17 14l-3.5 5h3l-1.5 4.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' : "");
    }
    return '<svg viewBox="0 0 32 40" width="32" height="40">' + s + "</svg>";
  }
  // The demo's made-up states, one per configured entity, worded from the demo clock.
  function demoExtra(id) {
    var d = now(), at = function (mins) { var x = new Date(d.getTime() + mins * 60000); return ymd(x) + "T" + pad2(x.getHours()) + ":" + pad2(x.getMinutes()) + ":00"; };
    var lc = new Date(d.getTime() - 3 * 60000).toISOString(), kids = PEOPLE.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
    if (ANN_CONF && id === ANN_CONF.entity) return { state: "45|" + (PEOPLE[1] || PEOPLE[0]).name + "|Dinner's at six tonight, wash your paws!", last_changed: lc, attributes: {} };
    if (DUE_CONF && id === DUE_CONF.entity) { var a = {};
      a[DUE_CONF.attribute] = [{ label: "Library books back", due: at(25), person: kids[0] || PEOPLE[0].name }, { label: "Bins out", due: at(7 * 60) },
        { label: "Maths homework", due: at(21 * 60), person: kids[1] || PEOPLE[0].name }, { label: "Trip form", due: ymd(new Date(d.getTime() + 3 * 864e5)), person: kids[2] || PEOPLE[0].name }];
      return { state: "4", attributes: a, last_changed: lc }; }
    for (var i = 0; i < TILE_CONF.length; i++) if (TILE_CONF[i].entity === id) {
      var ic = TILE_CONF[i].icon;
      return ic === "flask" ? { state: "12.4", attributes: { unit_of_measurement: "°C" } } : ic === "thermometer" ? { state: "19.5", attributes: { unit_of_measurement: "°C" } }
        : ic === "door" ? { state: "off", attributes: { device_class: "door" } } : { state: "on", attributes: {} }; }
    return null;
  }
  // The state of a configured entity, null when Home Assistant does not have it, undefined before hass arrives.
  function xState(id) {
    if (DEMO) return demoExtra(id);
    var h = HA.hass(); return h && h.states ? h.states[id] || null : undefined;
  }
  function xPerson(n) { return n ? XCANON[String(n).toLowerCase()] || n : ""; }
  function extrasSetup() {
    if (!ANN_CONF && !DUE_CONF && !TILE_CONF.length) return;
    var before = $("scrim");
    function el(id, parent) { var e = document.createElement("div"); e.id = id; if (parent) parent.appendChild(e); else WRAP.insertBefore(e, before); return e; }
    if (DUE_CONF) el("due");
    if (ANN_CONF) { var an = el("announce"); if (DUE_CONF) an.style.top = "124px";
      an.addEventListener("pointerdown", function () { activity(); var a = XS.ann; if (a && a.status === "show") { XS.hidden = a.key; XS.annKey = null; extrasHud(now()); } }); }
    if (TILE_CONF.length) { var tl = el("tiles", $("corner"));
      tl.addEventListener("pointerdown", function (e) { activity();
        var t = e.target && e.target.closest ? e.target.closest(".tile") : null, k = t ? +t.getAttribute("data-i") : -1;
        if (k >= 0 && TILE_CONF[k]) { XS.taps.push(TILE_CONF[k].entity); t.classList.add("tap"); setTimeout(function () { t.classList.remove("tap"); }, 260);
          if (!DEMO) HA.moreInfo(TILE_CONF[k].entity); } }); }
  }
  function extrasHud(d) {
    if (ANN_CONF) renderAnn(d);
    if (DUE_CONF) renderDue(d);
    if (TILE_CONF.length) renderTiles();
  }
  function renderAnn(d) {
    var st = xState(ANN_CONF.entity); if (st === undefined) return;
    var a = parseAnnouncement(st, d, XNAMES), key = a.status === "unavailable" ? "u|" + a.reason : a.status === "show" && XS.hidden !== a.key ? "s|" + a.key : "-";
    if (a.from) a.from = xPerson(a.from);
    XS.ann = a;
    if (key === XS.annKey) return; XS.annKey = key;
    var el = $("announce"), head = (ANN_CONF.title || "") + (a.from ? (ANN_CONF.title ? ", from " : "From ") + a.from : "");
    if (a.status === "unavailable") el.innerHTML = '<div class="ann na">' + xIcon("bell") + '<div class="ax">' + esc((ANN_CONF.title || "Announcements") + " unavailable") + "</div></div>";
    else if (key !== "-") el.innerHTML = '<div class="ann">' + xIcon("bell") + '<div class="ab">' + (head ? '<div class="at">' + esc(head) + "</div>" : "") + '<div class="ax">' + esc(a.text) + "</div></div></div>";
    else el.innerHTML = "";
  }
  function dueCol(it) { var p = PEOPLE.filter(function (q) { return q.name === it.person; })[0] || PEOPLE[PEOPLE.length - 1]; return p.col; }
  function readDue(d) {
    var st = xState(DUE_CONF.entity); if (st === undefined) return null;
    var due = parseDue(st, DUE_CONF.attribute, d, XNAMES);
    due.items.forEach(function (it) { it.person = xPerson(it.person); });
    return due;
  }
  function renderDue(d) {
    var due = readDue(d); if (!due) return;
    XS.due = due;
    var row = dueForHud(due, d, 3), house = PEOPLE[PEOPLE.length - 1].name;
    var key = due.status !== "ok" ? "u|" + due.reason : row.map(function (it) { return it.kind + "|" + it.short + "|" + it.person + "|" + it.label; }).join(";");
    if (key === XS.dueKey) return; XS.dueKey = key;
    var el = $("due");
    if (due.status !== "ok") { el.innerHTML = '<span class="dchip na">' + xIcon("clock") + '<span class="dl">Due times unavailable</span></span>'; return; }
    el.innerHTML = row.map(function (it) {
      var col = dueCol(it), badge = it.kind === "overdue" ? "#C4553A" : it.kind === "now" || it.kind === "soon" ? "#D98A1F" : shade(col, 0.6);
      return '<span class="dchip' + (it.kind === "now" || it.kind === "soon" || it.kind === "overdue" ? " now" : "") + '" style="border-color:' + shade(col, 0.72) + '">' + xIcon("clock") +
        '<span class="dl">' + esc(it.person && it.person !== house ? it.person + " · " + it.label : it.label) + '</span><span class="dn" style="background:' + badge + '">' + esc(it.short) + "</span></span>";
    }).join("");
    while (el.children.length > 1 && el.scrollWidth > el.clientWidth) el.removeChild(el.lastChild);   // as many as fit, soonest kept
  }
  function renderTiles() {
    var key = "", out = TILE_CONF.map(function (t) {
      var st = xState(t.entity), s = st === undefined ? null : tileState(t, st);
      if (s) key += t.entity + "=" + s.text + "|" + s.color + "|" + s.level.toFixed(2) + ";"; else key += "?;";
      return s; });
    XS.tiles = out;
    if (key === XS.tileKey) return; XS.tileKey = key;
    $("tiles").innerHTML = TILE_CONF.map(function (t, i) {
      var s = out[i]; if (!s) return "";
      var st = xState(t.entity), na = s.status !== "ok", label = t.label || (st && st.attributes && st.attributes.friendly_name) || t.entity.split(".")[1].replace(/_/g, " ");
      return '<div class="tile' + (na ? " na" : "") + '" data-i="' + i + '" style="border-color:' + (na ? "#8A8A94" : shade(s.color, 0.85)) + '">' +
        tileSvg(t.icon, na ? "#C9C9D0" : s.color, na ? 0 : s.level, na, "fdt" + i) + '<div class="tv">' + esc(s.text) + '</div><div class="tl">' + esc(label) + "</div></div>";
    }).join("");
  }
  // This person's due items on their card (no person: the household's), and the unavailable foot.
  function dueSection(name) {
    if (!DUE_CONF) return { html: "", foot: "" };
    var due = readDue(now()); if (!due) return { html: "", foot: "" };
    if (due.status !== "ok") return { html: "", foot: "Due times unavailable (" + DUE_CONF.entity + " " + due.reason + ")." };
    var house = PEOPLE[PEOPLE.length - 1].name, mine = due.items.filter(function (it) { return (it.person || house) === name; });
    var html = mine.length ? "<h2>Due</h2>" + mine.map(function (it) {
      return row(it.when, esc(it.label) + ' <span class="soft' + (it.kind === "overdue" ? " late" : "") + '">' + esc(it.rel) + "</span>", "", true); }).join("") : "";
    return { html: html, foot: due.bad ? due.bad + (due.bad === 1 ? " due item" : " due items") + " in " + DUE_CONF.entity + " could not be read." : "" };
  }
  function activity() { try { document.dispatchEvent(new Event("panel-activity")); } catch (err) { console.warn("meadow: activity event failed", err); } }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  var $ = function (id) { return ROOT.getElementById(id); };
  function hud() {
    var d = now();
    CD = countdowns(); PARTY = findParty(); HOUSE = findHouseParty(); renderDates();
    $("clock").innerHTML = pad2(d.getHours()) + ":" + pad2(d.getMinutes()) +
      (WX.live && WX.temp != null ? '<span class="temp">' + Math.round(WX.temp) + "\u00b0</span>" : "");
    $("date").textContent = DAYS_LONG[d.getDay()] + " " + d.getDate() + " " + MONTHS_LONG[d.getMonth()];
    var td = ymd(d), up = DATA.events.filter(function (e) { return e.day === td && !e.all_day && new Date(e.start) > d; });
    $("next").innerHTML = up.length ? "Next: <b>" + esc(up[0].at) + "</b> " + esc(up[0].who === "House" ? "" : up[0].who + ", ") + esc(up[0].what)
      : DATA.events.length ? "Nothing else on today" : "";
    // Say out loud when the picture is old. A stale week must not read as a quiet one.
    var st = "";
    if (DATA.error) st = "Can't load the week (" + DATA.error + ")" + (DATA.gotAt ? ". Showing " + pad2(DATA.gotAt.getHours()) + ":" + pad2(DATA.gotAt.getMinutes()) : "");
    else if (DATA.weekAt && d - DATA.weekAt > 40 * 60000) st = "Calendars last checked " + dayLabel(ymd(DATA.weekAt)).toLowerCase() + " " + pad2(DATA.weekAt.getHours()) + ":" + pad2(DATA.weekAt.getMinutes());
    else if (DATA.calFailed && DATA.calFailed.length) st = DATA.calFailed.length + (DATA.calFailed.length === 1 ? " calendar" : " calendars") + " unavailable: " + DATA.calFailed.map(function (f) { return f.who; }).join(", ");
    else if (!DATA.gotAt && !DEMO) st = "Loading the week";
    else if (!WX.live && !DEMO) st = "Weather unavailable, showing made-up showers";
    else if (LETTER.clearErr) st = "Couldn't clear the letter in Home Assistant";
    $("status").textContent = st;
    $("next").style.opacity = FLIGHT ? 0 : 1;
    extrasHud(d);
    WRAP.classList.toggle("night", DARK > 0.5);
    if (SCENE.darkSky) WRAP.classList.add("darksky");         // light HUD text over a sky that is always dark
  }

  // ── The card ────────────────────────────────────────────────────────────────
  var openThing = null, closeTimer = null;
  var KIND = { homework: "Homework", kit: "Kit", "term-date": "School", "inset-day": "No school", deadline: "Deadline", event: "School" };
  function row(when, what, chip, raw) {
    return '<div class="row"><div class="when">' + esc(when) + '</div><div class="what">' + (chip ? '<span class="chip">' + esc(chip) + "</span>" : "") + (raw ? what : esc(what)) + "</div></div>";
  }
  // What to say about sensors.extra: nothing when it is off (null) or loaded, and a
  // plain "unavailable" when it is configured but did not answer.
  function extraState() {
    if (!SENSORS.extra || DATA.extra) return "";
    if (DATA.extraErr) return "School info unavailable (" + DATA.extraErr + ").";
    return DATA.gotAt ? "School info unavailable." : "";
  }
  function openCard(t) {
    var p = t.person, name = p.name, td = ymd(now()), html = "";
    var mine = DATA.events.filter(function (e) { return e.who === name; });
    var today = mine.filter(function (e) { return e.day === td; }), later = mine.filter(function (e) { return e.day > td; });
    if (t.letter) {                                                          // the postie's letter, read once
      var lt = t.letter; t.letter = null; clearLetter(lt);
      html += "<h2>A letter</h2>" + row(pad2(lt.at.getHours()) + ":" + pad2(lt.at.getMinutes()), lt.text, "Post");
    }
    html += "<h2>Today</h2>";
    html += today.length ? today.map(function (e) { return row(e.all_day ? "All day" : e.at, e.what); }).join("")
      : '<div class="empty">' + ((DATA.calFailed || []).some(function (f) { return f.who === name; }) ? "Calendar unavailable, so this card can't say what's on."
        : name === "House" ? "Nothing for the house today." : "Nothing on today. Plenty of time for snacks.") + "</div>";
    if (later.length) {
      html += "<h2>This week</h2>";
      later.forEach(function (e) { html += row(dayLabel(e.day) + (e.all_day ? "" : " " + e.at), e.what); });
    }
    // This child's lessons and lunch (people[].timetable, .lunch), with what went wrong for the foot.
    var dueS = dueSection(name);
    html += dueS.html;
    var sch = schoolSections(name);
    html += sch.html;
    var ex = DATA.extra || {}, items = (ex.items || []).filter(function (i) { return i.who === name && i.date >= td; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var kit = (ex.kit || []).filter(function (k) { return k.who === name; });
    var flags = name === "House" ? (ex.flags || []) : [];
    if (items.length || kit.length || flags.length) {
      html += "<h2>Good to know</h2>";
      items.forEach(function (i) { html += row(dayLabel(i.date), i.what, KIND[i.kind] || i.kind); });
      kit.forEach(function (k) { html += row("Every week", k.what, "Kit"); });
      flags.forEach(function (f) { html += row("", f, "Heads up"); });
    }
    var foot = [];
    if (DATA.weekAt) foot.push("Calendars checked " + dayLabel(ymd(DATA.weekAt)).toLowerCase() + " " + pad2(DATA.weekAt.getHours()) + ":" + pad2(DATA.weekAt.getMinutes()) + ".");
    if (ex.checked_at) { var xc = new Date(ex.checked_at); foot.push("School info checked " + DAYS[xc.getDay()] + " " + xc.getDate() + " " + MONTHS[xc.getMonth()] + "."); }
    var missing = ((ex.sources || {}).unavailable || []).filter(function (s) {
      return name === "House" || SOURCE_OWNER.some(function (m) { return m[0].test(s) && m[1] === name; }); });
    if (missing.length) foot.push('<span class="bad">Couldn\'t check: ' + missing.map(esc).join(", ") + ".</span>");
    var calBad = (DATA.calFailed || []).filter(function (f) { return f.who === name; });
    sch.foot.forEach(function (f) { foot.push('<span class="bad">' + esc(f) + "</span>"); });
    if (calBad.length) foot.push('<span class="bad">Calendar unavailable: ' + calBad.map(function (f) { return esc(f.id); }).join(", ") + ". This week may be missing events.</span>");
    if (!DEMO) { var xs = extraState(); if (xs) foot.push('<span class="bad">' + esc(xs) + "</span>"); }
    if (dueS.foot) foot.push('<span class="bad">' + esc(dueS.foot) + "</span>");
    if (LETTER.clearErr) foot.push('<span class="bad">Couldn\'t clear the letter in Home Assistant (' + esc(LETTER.clearErr) + ').</span>');
    html += '<div class="foot">' + foot.join(" ") + "</div>";

    $("lists").innerHTML = html; $("lists").scrollTop = 0;
    $("who").textContent = name;
    $("sum").textContent = today.length ? today.length + (today.length === 1 ? " thing today" : " things today") : calBad.length ? "Calendar unavailable" : "Free today";
    $("face").style.background = mix(p.col, "#ffffff", 0.35);
    var pc = $("portrait"), g = pc.getContext("2d");
    // portrait: the same creature, redrawn large rather than scaled up blurry
    var bs = creatureSprite(Object.assign({}, p, { r: p.r * 3.2 }), "happy", 1);
    g.clearRect(0, 0, pc.width, pc.height);
    var fit = Math.min(pc.width / bs.c.width, pc.height / bs.c.height) * 0.98;
    g.drawImage(bs.c, (pc.width - bs.c.width * fit) / 2, pc.height - 20 - bs.ay * fit, bs.c.width * fit, bs.c.height * fit);
    openThing = t; t.happy = 99;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer); closeTimer = setTimeout(closeCard, 60000);      // a wall panel forgets
  }
  function closeCard() {
    $("scrim").classList.remove("open");
    if (openThing) { openThing.happy = 0; openThing.wait = 1; }
    openThing = null; clearTimeout(closeTimer);
  }
  // ── The school card ─────────────────────────────────────────────────────────
  // Tapping the school opens everything school-shaped in one place. Sources, all
  // through Home Assistant: each child's lessons and lunch from people[].timetable and .lunch,
  // kit from SENSORS.kit, and term dates plus school items from SENSORS.extra.
  // KIDS are the PEOPLE with school: true; only their items count here.
  var SCHOOL_CARD = { happy: 0, wait: 0 }, KIDS = PEOPLE.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
  function soft(s) { return ' <span class="soft">' + esc(s) + "</span>"; }
  // ── School data per child ────────────────────────────────────────────────────
  // Lessons and lunch from people[].timetable and .lunch, parsed by school.js. Every empty
  // state says which one it is: a sensor that is set but missing says unavailable and names
  // itself, never a blank that reads as a day off.
  // A card shows the next school day once today's last lesson has ended (lessonsOver in
  // school.js), or after half past three when the timetable gives no end times.
  function empty(t) { return '<div class="empty">' + esc(t) + "</div>"; }
  function weekName(w) { return /^week\b/i.test(w) ? w : "Week " + w; }      // "A" reads "Week A", "Week 1" stays
  function shortDate(ds) { var x = new Date(ds + "T12:00:00"); return DAYS[x.getDay()] + " " + x.getDate() + " " + MONTHS[x.getMonth()]; }
  function lessonRows(list) {
    return list.map(function (l) {
      return '<div class="row lesson"><div class="when">' + esc(l.start || "Period " + l.p) + '</div><div class="what">' + esc(l.subject) + (l.room ? soft(l.room) : "") + "</div></div>"; }).join("");
  }
  // Mon to Fri of one child's week: periods down the side, today's column lit, and the day the
  // card is showing outlined when that is not today. Closed days say so in their header.
  function weekGrid(g, td, shown) {
    var h = '<table class="tt"><tr><th></th>';
    g.days.forEach(function (d) {
      var cls = d.date === td ? "now" : d.date === shown ? "next" : "";
      h += '<th class="' + cls + '">' + DAYS_LONG[new Date(d.date + "T12:00:00").getDay()].slice(0, 3) + "<small>" + (d.closed ? esc(d.note || "No school") : new Date(d.date + "T12:00:00").getDate()) + "</small></th>"; });
    h += "</tr>";
    g.rows.forEach(function (r) {
      h += "<tr><th>" + esc(r.p) + (r.start ? "<small>" + esc(r.start) + "</small>" : "") + "</th>";
      r.cells.forEach(function (c, i) { var d = g.days[i];
        var cls = (d.date === td ? "now" : d.date === shown ? "next" : "") + (d.closed ? " off" : "");
        h += '<td class="' + cls + '">' + (c ? esc(c.subject) + (c.room ? "<small>" + esc(c.room) + "</small>" : "") : "") + "</td>"; });
      h += "</tr>";
    });
    return h + "</table>";
  }
  // The next day the timetable has lessons, up to a fortnight ahead.
  function nextLessonDay(name, from) {
    for (var i = 1; i <= 14; i++) { var d = addDays(from, i), t = ttFor(name, d);
      if (t.status === "ok" || t.status === "unavailable" || t.status === "no_week") return { d: d, t: t, i: i }; }
    return null;
  }
  function dishHtml(o, picked) {
    return '<div class="dish' + (picked ? " picked" : "") + '">' + (picked ? '<span class="chip pick">Chosen</span>' : "") + esc(o.name) + (o.kind ? soft(o.kind) : "") +
      o.allergens.map(function (a) { return ' <span class="alg">' + esc(a) + "</span>"; }).join("") + "</div>";
  }
  // One day's lunch as a row's content: the choice, the options with allergens, the pudding.
  // A school day without a menu says which kind of without it is.
  function lunchHtml(name, d, l, today) {
    var ch = l.status === "served" || l.status === "no_menu" || l.status === "ended" ? choiceFor(name, d, l.choice) : null;
    // A choice that names one of the options marks that option, and the chip says school dinner.
    var pick = ch && ch.text ? ch.text.toLowerCase() : "", named = l.options.some(function (o) { return o.name.toLowerCase() === pick; });
    var head = ch && ch.text ? '<span class="chip choice">' + esc(named ? "School dinner" : ch.text) + "</span>" : "";
    if (l.status === "served") {
      var opts = l.options.map(function (o) { return dishHtml(o, o.name.toLowerCase() === pick); }).join("");
      return head + (opts || esc("Served, options not listed")) + (l.pudding ? '<div class="dish"><span class="soft">Pudding</span> ' + esc(l.pudding.name) +
        l.pudding.allergens.map(function (a) { return ' <span class="alg">' + esc(a) + "</span>"; }).join("") + "</div>" : "") + (l.note ? '<div class="dish soft">' + esc(l.note) + "</div>" : "");
    }
    if (l.status === "closed") return esc("No school lunch" + (today ? " today" : "") + (l.note ? " (" + l.note + ")" : ""));
    if (l.status === "weekend") return esc("No school, it's the weekend");
    if (l.status === "ended") return head + esc("Menu ran out after " + shortDate(l.menuEnds));
    if (l.status === "loading") return esc("Loading the menu");
    return head + esc("Menu not published for this week");
  }
  // The child's card: lessons today (or the next school day), the week grid folded away, then
  // lunch today and on the next school day. html for the card, foot for what could not be read.
  function schoolSections(name) {
    var out = { html: "", foot: [] }, src = SRC[name];
    if (!src) return out;
    var d = now(), td = ymd(d);
    if (src.timetable) {
      var t = ttFor(name, d), shown = null, sh = null, head;
      if (t.status === "unavailable") { out.html += "<h2>Lessons</h2>" + empty("Timetable unavailable (" + src.timetable.entity + ")");
        out.foot.push("Timetable " + src.timetable.entity + " " + (t.reason || "unavailable") + "."); }
      else if (t.status === "loading") out.html += "<h2>Lessons</h2>" + empty("Loading the timetable.");
      else if (t.status === "no_week") { out.html += "<h2>Lessons</h2>" + empty("Timetable can't tell which week this is");
        out.foot.push("Timetable " + src.timetable.entity + ": " + t.reason + ". Add anchor or week_of."); }
      else {
        if (t.status === "ok" && !lessonsOver(t, d)) { shown = td; sh = t; head = "Lessons today"; }
        else {
          if (t.status !== "ok") out.html += "<h2>Lessons today</h2>" + empty("No school today" + (t.note && t.status === "closed" ? " (" + t.note + ")" : ""));
          var nx = nextLessonDay(name, d);
          if (nx && nx.t.status === "ok") { shown = ymd(nx.d); sh = nx.t; head = "Lessons " + (nx.i === 1 ? "tomorrow" : nx.i < 7 ? DAYS_LONG[nx.d.getDay()] : shortDate(shown)); }
          else if (nx) out.foot.push("Timetable " + src.timetable.entity + " " + (nx.t.reason || "unavailable") + ".");
          else out.html += empty("No lessons on the timetable for the next two weeks.");
        }
        if (sh) out.html += "<h2>" + esc(head) + "</h2>" + (sh.lessons.length ? lessonRows(sh.lessons) : empty("Nothing on the timetable for " + DAYS_LONG[new Date(shown + "T12:00:00").getDay()] + "."));
        var g = (sh || t).grid;
        if (g && g.week) out.html += '<details class="wk"><summary>' + esc(weekName(g.week)) + ", from " + esc(shortDate(g.monday)) + "</summary>" + weekGrid(g, td, shown) + "</details>";
      }
    }
    if (src.lunch) {
      var first = lunchFor(name, d);
      out.html += "<h2>Lunch</h2>";
      if (first.status === "unavailable") { out.html += empty("Lunch menu unavailable (" + src.lunch.entity + ")");
        out.foot.push("Lunch menu " + src.lunch.entity + " " + (first.reason || "unavailable") + "."); }
      else {
        var days = weekday(d) ? [d] : [];
        var nd = addDays(d, 1); while (!weekday(nd)) nd = addDays(nd, 1);
        days.push(nd);
        days.forEach(function (x) { out.html += row(dayLabel(ymd(x)), lunchHtml(name, x, lunchFor(name, x), ymd(x) === td), "", true); });
        var ce = choiceFor(name, d, first.choice);
        if (ce && ce.err) out.foot.push("Lunch choice unavailable (" + ce.err + ").");
      }
    }
    return out;
  }
  // The School card's week: one lane per child with a timetable, Mon to Fri, today lit. On a
  // weekend it is next week.
  function schoolWeek(td) {
    var d = now(), kids = PEOPLE.filter(function (p) { return SRC[p.name] && SRC[p.name].timetable; });
    if (!kids.length) return "";
    var mon = weekday(d) ? mondayOf(d) : mondayOf(addDays(d, 7)), dates = [0, 1, 2, 3, 4].map(function (i) { return ymd(addDays(mon, i)); });
    var h = "<h2>" + (weekday(d) ? "This week" : "Next week") + '</h2><table class="tt lanes"><tr><th></th>';
    dates.forEach(function (ds) { h += '<th class="' + (ds === td ? "now" : "") + '">' + esc(shortDate(ds).replace(/ \w+$/, "")) + "</th>"; });
    h += "</tr>";
    kids.forEach(function (p) {
      var t = ttFor(p.name, mon), g = t.grid;
      h += '<tr><th class="who"><span class="dot" style="background:' + esc(p.col) + '"></span>' + esc(p.name) + (g && g.week ? "<small>" + esc(weekName(g.week)) + "</small>" : "") + "</th>";
      if (!g || !g.week) { h += '<td colspan="5" class="off">' + esc(t.status === "unavailable" ? "Timetable unavailable (" + SRC[p.name].timetable.entity + ")" : t.status === "loading" ? "Loading"
        : g && g.off ? "No timetable this week" : "Timetable can't tell which week this is") + "</td></tr>"; return; }
      g.days.forEach(function (day) {
        h += '<td class="' + (day.date === td ? "now" : "") + (day.closed ? " off" : "") + '">' + (day.closed ? esc(day.note || "No school")
          : day.lessons.map(function (l) { return '<div class="ln"><b>' + esc(l.p) + "</b> " + esc(l.subject) + "</div>"; }).join("")) + "</td>"; });
      h += "</tr>";
    });
    return h + "</table>";
  }
  // "Term 1 ends Fri 16 Oct", or when the next one starts, with the gathered note.
  function termRows(sc, td) {
    var out = "", cur = null, next = null;
    sc.terms.forEach(function (t) {
      if (t.from && t.from <= td && (!t.to || t.to >= td)) cur = t;
      else if (!t.from && t.to && t.to >= td && !cur) cur = t;
      if (!next && t.from && t.from > td) next = t;
    });
    if (cur) out += row(cur.to ? dayLabel(cur.to) : "", esc(cur.label) + (cur.to ? " ends" : " is on") + (cur.note ? soft(cur.note) : ""), sc.who, true);
    if (next) out += row(dayLabel(next.from), esc(next.label) + " starts" + (next.note ? soft(next.note) : ""), sc.who, true);
    if (!cur && !next) sc.terms.filter(function (t) { return !t.from && !t.to; }).forEach(function (t) { out += row("", esc(t.label) + soft(t.note || "not published"), sc.who, true); });
    (sc.days || []).filter(function (d) { return d.date >= td; }).slice(0, 3).forEach(function (d) { out += row(dayLabel(d.date), esc(d.what), sc.who, true); });
    return out;
  }
  function openSchool() {
    var d = now(), td = ymd(d), ex = DATA.extra || {}, S = DATA.school || {}, html = "", sum = "";
    // Each child with a timetable in one grid, then today's lunch for each child with a menu
    html += schoolWeek(td);
    var lunchKids = PEOPLE.filter(function (p) { return SRC[p.name] && SRC[p.name].lunch; });
    if (lunchKids.length && weekday(d)) {
      html += "<h2>Lunch today</h2>";
      lunchKids.forEach(function (p) { var l = lunchFor(p.name, d);
        html += row(p.name, l.status === "unavailable" ? esc("Lunch menu unavailable (" + SRC[p.name].lunch.entity + ")") : lunchHtml(p.name, d, l, true), "", true); });
    }
    if (S.kit) html += "<h2>Kit today</h2>" + row(SCHOOL_WHO.kit, S.kit.kit_today && S.kit.kit_today !== "none" ? S.kit.kit_today : "No kit needed");
    // Kids the data cannot place (no timetable, lunch or term dates) are not counted as home.
    var days = KIDS.map(function (n) { return schoolDay(n, d); }), atSchool = days.filter(function (x) { return x === true; }).length;
    sum = !weekday(d) ? "Weekend" : atSchool ? atSchool + (atSchool === 1 ? " child" : " children") + " at school today"
      : days.length && days.every(function (x) { return x === false; }) ? "No school today" : "Can't tell who has school today";
    // School items for every kid, soonest first
    var items = (ex.items || []).filter(function (i) { return KIDS.indexOf(i.who) >= 0 && i.date >= td; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    html += "<h2>Coming up</h2>";
    html += items.length ? items.slice(0, 12).map(function (i) { return row(dayLabel(i.date), (KIND[i.kind] ? KIND[i.kind] + ": " : "") + i.what, i.who); }).join("")
        + (items.length > 12 ? '<div class="empty">+' + (items.length - 12) + " more on each child's card</div>" : "")
      : '<div class="empty">Nothing gathered for the coming weeks.</div>';
    (ex.kit || []).filter(function (k) { return KIDS.indexOf(k.who) >= 0; }).forEach(function (k) { html += row("Every week", k.what, k.who); });
    // Term dates
    html += "<h2>Term dates</h2>";
    html += ex.schools && ex.schools.length ? ex.schools.map(function (sc) { return termRows(sc, td); }).join("")
      : '<div class="empty">Term dates not gathered yet.</div>';
    var foot = [];
    if (ex.checked_at) { var xc = new Date(ex.checked_at); foot.push("School info checked " + DAYS[xc.getDay()] + " " + xc.getDate() + " " + MONTHS[xc.getMonth()] + "."); }
    var missing = (ex.sources || {}).unavailable || [];
    if (missing.length) foot.push('<span class="bad">Couldn\'t check: ' + missing.map(esc).join(", ") + ".</span>");
    if (!DEMO) { var xs2 = extraState(); if (xs2) foot.push('<span class="bad">' + esc(xs2) + "</span>"); }
    PEOPLE.forEach(function (p) { schoolSections(p.name).foot.forEach(function (f) { foot.push('<span class="bad">' + esc(p.name + ": " + f) + "</span>"); }); });
    (CONFIG.schoolOrphans || []).forEach(function (o) { foot.push('<span class="bad">' + esc("sensors." + o.key + " (" + o.entity + ") belongs to schoolWho." + o.key + " = " + o.who +
      ", who is not in people. Set " + o.key + " on the child.") + "</span>"); });
    html += '<div class="foot">' + foot.join(" ") + "</div>";

    $("lists").innerHTML = html; $("lists").scrollTop = 0;
    $("who").textContent = "School"; $("sum").textContent = sum;
    $("face").style.background = "#F6E7B8";
    // portrait: the school itself, cut from the painted meadow
    var pc = $("portrait"), g = pc.getContext("2d"), s = LAY.school, cut = s.cut || [s.x - 105, s.y - 150, 210, 175], sw = cut[2], sh = cut[3];
    g.clearRect(0, 0, pc.width, pc.height);
    g.drawImage(BG, cut[0] * DPR, cut[1] * DPR, sw * DPR, sh * DPR, 0, (pc.height - pc.width * sh / sw) / 2, pc.width, pc.width * sh / sw);
    openThing = SCHOOL_CARD;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer); closeTimer = setTimeout(closeCard, 60000);
  }
  // ── The workshop card ───────────────────────────────────────────────────────
  // The print job as the printer reports it: name, percent, time left and when
  // that lands on the clock. Nothing fresh, and the card says so instead of
  // showing the last thing it saw.
  var SHOP_CARD = { happy: 0, wait: 0 };
  var PR_LABEL = { running: "Printing", pause: "Paused", finish: "Finished", failed: "Failed", idle: "Idle", prepare: "Getting ready",
    slicing: "Slicing", init: "Starting up", offline: "Offline", unknown: "Unknown", missing: "Not reachable" };
  function mins(m) { return m >= 60 ? Math.floor(m / 60) + "h " + pad2(m % 60) + "m" : m + " min"; }
  function openShop() {
    var ps = printerState(), live = ps !== "empty", st = live ? PR.status : (PR.err ? "missing" : PR.status), html = "", sum;
    var label = PR_LABEL[st] || st;
    html += "<h2>The printer</h2>" + row("Status", label);
    if (live && PR.name && st !== "idle") html += row("Job", PR.name);
    if (st === "running" || st === "pause") {
      html += row("Progress", Math.round(PR.progress) + "%");
      if (PR.layer != null && PR.layers != null) html += row("Layer", PR.layer + " of " + PR.layers);
      if (PR.remain != null) { var done = new Date(now().getTime() + PR.remain * 60000);
        html += row("Time left", mins(PR.remain)) + row("Done at", pad2(done.getHours()) + ":" + pad2(done.getMinutes()) + (st === "pause" ? " once it resumes" : "")); }
      sum = label + ", " + Math.round(PR.progress) + "%";
    } else if (st === "finish") { html += row("Progress", "100%"); sum = "Finished" + (PR.name ? ": " + PR.name : ""); }
    else if (st === "failed") sum = "The print failed";
    else if (/^(prepare|slicing|init)$/.test(st)) sum = "A print is starting";
    else if (st === "idle") sum = "Nothing printing";
    else sum = live ? label : "Printer not reachable";
    var foot = [];
    if (PR.at) foot.push("Printer checked " + pad2(PR.at.getHours()) + ":" + pad2(PR.at.getMinutes()) + ".");
    if (!live) foot.push('<span class="bad">' + (PR.err ? "Can't reach the printer sensors (" + esc(PR.err) + ")." : "No fresh reading from the printer.") + "</span>");
    html += '<div class="foot">' + foot.join(" ") + "</div>";
    $("lists").innerHTML = html; $("lists").scrollTop = 0;
    $("who").textContent = "Workshop"; $("sum").textContent = sum;
    $("face").style.background = "#DCE6F0";
    // portrait: the finished workshop, from its baked pieces
    var pc = $("portrait"), g = pc.getContext("2d"), k = pc.width / 130;
    g.clearRect(0, 0, pc.width, pc.height); g.save(); g.scale(k, k); g.translate(65, 118);
    [[SHOP.walls2, 0, 0], [SHOP.roof, 0, -48], [SHOP.sign, -56, 0]].forEach(function (p) { var ic = p[0]; g.drawImage(ic.c, p[1] - ic.ax / ic.k, p[2] - ic.ay / ic.k, ic.c.width / ic.k, ic.c.height / ic.k); });
    g.restore();
    openThing = SHOP_CARD;
    $("scrim").classList.add("open");
    clearTimeout(closeTimer); closeTimer = setTimeout(closeCard, 60000);
  }

  // ── The banner plane ────────────────────────────────────────────────────────
  // Every few minutes, and whenever the next event changes, a little plane tows the
  // next thing on the calendar across the sky. It flies below the date and above
  // every roof tag, and while it is up the "Next:" line steps aside.
  var PLANE, BANNER = { key: null, c: null, w: 0, h: 0 }, FLIGHT = null, flightT = 6, flightDir = -1;
  var LANE = 166;
  function nextEvent() {
    var d = now(), td = ymd(d);
    for (var i = 0; i < DATA.events.length; i++) { var e = DATA.events[i];
      if ((!e.all_day && new Date(e.start) > d) || (e.all_day && e.day > td)) return e; }
    return null;
  }
  function bakeBanner(e) {
    if (typeof e === "string") e = { who: "House", what: e, day: ymd(now()), all_day: true };
    var p = PEOPLE.filter(function (q) { return q.name === e.who; })[0];
    var when = (e.day === ymd(now()) ? "" : dayLabel(e.day) + " ") + (e.all_day ? "" : e.at);
    var what = e.what.length > 38 ? e.what.slice(0, 36) + "..." : e.what;
    var g0 = canvas(10, 10).getContext("2d"), f1 = "600 " + 19 * K + "px Fredoka", f2 = "500 " + 19 * K + "px Fredoka";
    var parts2 = [[when, f1, INK], [e.who === "House" ? "" : e.who, f1, p ? shade(p.col, 0.55) : INK], [what, f2, INK]].filter(function (a) { return a[0]; });
    var gap = 10 * K, tw = 0;
    parts2.forEach(function (a) { g0.font = a[1]; a.push(g0.measureText(a[0]).width); tw += a[3] + gap; });
    var w = tw + 28 * K, h = 34 * K, c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = "#FFF8EE"; g.strokeStyle = "#D9C6A5"; g.lineWidth = 2 * K;
    g.beginPath(); g.moveTo(K, K); g.lineTo(w - 10 * K, K); g.lineTo(w - K, h / 2); g.lineTo(w - 10 * K, h - K); g.lineTo(K, h - K); g.closePath(); g.fill(); g.stroke();
    g.textBaseline = "middle"; var x = 14 * K;
    parts2.forEach(function (a) { g.font = a[1]; g.fillStyle = a[2]; g.fillText(a[0], x, h / 2 + K); x += a[3] + gap; });
    BANNER.c = c; BANNER.w = w / K; BANNER.h = h / K;
  }
  function planeSprite() {
    return icon(64, 34, function (g) {
      g.fillStyle = "#C24E42"; g.beginPath(); g.moveTo(6, 8); g.lineTo(14, 8); g.lineTo(20, 18); g.lineTo(6, 18); g.closePath(); g.fill();     // tail fin
      rimmed(g, "#B9A58A", "#FFF4E8", 1.2, function (e) { g.beginPath(); g.ellipse(32, 20, 26 + e, 8 + e, 0, 0, 7); g.fill(); });              // body
      g.fillStyle = "#E86A5B"; g.beginPath(); g.ellipse(34, 23, 14, 4, 0.1, 0, 7); g.fill();                                                   // wing
      g.fillStyle = "#6FB6E8"; rr(g, 38, 13, 10, 6, 3); g.fill();                                                                             // window
      g.fillStyle = "#F6C28B"; g.beginPath(); g.arc(43, 13, 4, Math.PI, 0); g.fill();                                                        // pilot
      g.fillStyle = "#8D6440"; g.fillRect(57, 17, 3, 6);                                                                                      // nose
    });
  }
  function updatePlane(dt) {
    var party = PARTY_T > 0.5 && PARTY, e = party ? PARTY.label : nextEvent();
    var key = party ? "party|" + PARTY.label : e ? e.who + "|" + e.start + "|" + e.what : "";
    if (key !== BANNER.key) { BANNER.key = key; if (e) { bakeBanner(e); if (!FLIGHT) flightT = Math.min(flightT, 2); } }
    if (FLIGHT) {
      FLIGHT.x += FLIGHT.dir * 72 * dt;
      var span = 64 + 40 + BANNER.w;
      if ((FLIGHT.dir > 0 && FLIGHT.x > W + span) || (FLIGHT.dir < 0 && FLIGHT.x < -span)) FLIGHT = null;
      return;
    }
    flightT -= dt;
    if (flightT <= 0 && e && BANNER.c) { flightDir = -flightDir; FLIGHT = { dir: flightDir, x: flightDir > 0 ? -40 : W + 40 }; flightT = party ? 60 : 180; }
  }
  function drawPlane(time) {
    if (!FLIGHT) return;
    var f = FLIGHT, py = LANE - 8 + Math.sin(time * 1.4) * 2.5;
    var tailX = f.x - f.dir * 30, bw = BANNER.w, bh = BANNER.h, lead = tailX - f.dir * 40;   // the banner's towed edge
    var bx = f.dir > 0 ? lead - bw : lead, by = LANE - bh / 2;
    ctx.strokeStyle = "rgba(90,80,70,.7)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tailX, py + 2); ctx.lineTo(lead, LANE); ctx.stroke();
    // the banner, in strips, rippling more towards the free end
    var n = 10, sw = bw / n, c = BANNER.c;
    for (var i = 0; i < n; i++) {
      var fromLead = f.dir > 0 ? (n - 1 - i) / (n - 1) : i / (n - 1);
      var dy = Math.sin(time * 4 - fromLead * 3) * 2.5 * fromLead;
      ctx.drawImage(c, i * sw * K, 0, sw * K + 1, c.height, bx + i * sw, by + dy, sw + 0.5, bh);
    }
    if (SCENE.flyer) { SCENE.flyer(ctx, f.x, py + 17, f.dir, time, SV); return; }   // the scene's own tug, lights and all
    blit(PLANE, f.x, py + 17, f.dir, 1, 1, 1);
    var nose = f.x + f.dir * 30, spin = Math.abs(Math.sin(time * 30));
    ctx.strokeStyle = "rgba(60,60,60,.7)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nose, py + 3 - 9 * spin); ctx.lineTo(nose, py + 3 + 9 * spin); ctx.stroke();
  }
  function planeLight(a, time) {
    if (!FLIGHT || SCENE.flyer) return;
    var on = Math.sin(time * 5) > 0, x = FLIGHT.x - FLIGHT.dir * 4, y = LANE + 6;
    ctx.globalAlpha = a * (on ? 1 : 0.35); ctx.drawImage(GLOW, x - 10, y - 10, 20, 20);
    ctx.fillStyle = FLIGHT.dir > 0 ? "#7BE07F" : "#FF6B6B"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }

  $("done").addEventListener("click", closeCard);
  $("scrim").addEventListener("pointerdown", function (e) { if (e.target === $("scrim")) closeCard(); });
  $("lists").addEventListener("scroll", function () { clearTimeout(closeTimer); closeTimer = setTimeout(closeCard, 60000); });

  cv.addEventListener("pointerdown", function (e) {
    if (openThing) return;
    var bx0 = cv.getBoundingClientRect(), x = e.clientX - bx0.left, y = e.clientY - bx0.top, best = null, bd = 1e9, i, t;
    for (i = 0; i < fam.length; i++) { t = fam[i]; var b = t.tagBox, sc = depth(t.y);
      var d = Math.sqrt(Math.pow(x - t.x, 2) + Math.pow(y - (t.y + (t.dy || 0) - t.r * sc * 0.9 - hopOf(t)), 2));
      if (b && x >= b[0] - 10 && x <= b[0] + b[2] + 10 && y >= b[1] - 10 && y <= b[1] + b[3] + 10) d = 0;
      if (d < t.r * sc * 1.8 && d < bd) { bd = d; best = t; } }
    if (best) { best.jump = 0.6; best.happy = 1; puff("heart", best.x, best.y - best.r * 2.2, 3, best.person.col);
      setTimeout(function () { openCard(best); }, 320); return; }
    // The office robot, or its speech bubble: the agent office view
    if (robotHit(x, y)) { ROBOT.hop = 0.5; ROBOT.flash = 1; say("beep!", ROBOT.x, ROBOT.y - 90);
      setTimeout(function () { goView(VIEW.office); }, 380); return; }
    // The scene's landmarks (scene.hotspots): the school opens the School card, the others
    // their view in VIEW, and a landmark whose view is null is scenery.
    SV.sign = SIGN && MUSIC_T > 0.3 ? SIGN.h + 14 : 0;                  // the now-playing sign over the meadow's bandstand
    for (i = 0; i < HOTSPOT_IDS.length; i++) if (tapHotspot(HOTSPOT_IDS[i], x, y)) return;
    // Everyone else just enjoys the attention.
    for (i = 0; i < things.length; i++) { t = things[i];
      if (t.kind !== "fam" && Math.abs(x - t.x) < t.r * 1.8 && Math.abs(y - (t.y - t.r)) < t.r * 1.8) {
        t.jump = 0.6; t.happy = 1.2; t.flee = 0; puff("heart", t.x, t.y - t.r * 2, 1, "#FF7FA0"); return; } }
  });

  function tapHotspot(id, x, y) {
    var h = (SCENE.hotspots || {})[id];
    if (!h || h.robot || (id !== "school" && !VIEW[id])) return false;
    var b = h.box(SV), tb = id === "school" && SCHOOL_CARD.tagBox;
    if (!(x > b[0] && x < b[2] && y > b[1] && y < b[3]) && !(tb && x >= tb[0] - 10 && x <= tb[0] + tb[2] + 10 && y >= tb[1] - 10 && y <= tb[1] + tb[3] + 10)) return false;
    h.tap(SV);
    if (id === "school") setTimeout(openSchool, 320);
    else setTimeout(function () { goView(VIEW[id]); }, 380);
    return true;
  }

  // Tell any idle or backlight timer on the page that the panel is in use.
  cv.addEventListener("pointerdown", function () {
    try { document.dispatchEvent(new Event("panel-activity")); }
    catch (err) { console.warn("meadow: activity event failed", err); }
  });

  // ── Boot ────────────────────────────────────────────────────────────────────
  function size() {
    W = WRAP.clientWidth || 1280; H = WRAP.clientHeight || 800; DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px";
    HZ = Math.round(H * 0.27); TOP = HZ + 44;
    bakeBackground();
  }
  var last = 0, lastHud = 0, clock0 = performance.now(), FPSN = 0, FPSMS = 0, FPS0 = 0, FPST = "";
  function frame(ms) {
    requestAnimationFrame(frame);
    if (ms - last < 31) return;                           // 30 fps is plenty for a wall, and kinder to it
    var dt = Math.max(0, Math.min(0.1, (ms - last) / 1000)); last = ms;
    nightness = sleepCurve(now(), PARTY ? 21.5 : 20.5); DARK = darkness(now());
    var t0 = FPS ? performance.now() : 0;
    update(dt); draw((ms - clock0) / 1000);
    if (FPS) { FPSN++; FPSMS += performance.now() - t0; if (ms - FPS0 >= 2000) { FPST = (FPSN * 1000 / (ms - FPS0)).toFixed(1) + " fps \u00b7 " + (FPSMS / FPSN).toFixed(1) + " ms"; FPSN = 0; FPSMS = 0; FPS0 = ms; }
      ctx.font = "600 16px Fredoka"; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#000"; ctx.fillRect(W - 170, H - 26, 170, 26); ctx.fillStyle = "#FFF"; ctx.fillText(FPST, W - 8, H - 4); }
    if (ms - lastHud > 1000) { lastHud = ms; hud(); }
  }
  function start() {
    // Tags go up before any data: if Home Assistant is down at boot, everyone still has a name.
    size(); setup(); refreshTags(); load(); extrasSetup(); nightness = sleepCurve(now(), 20.5); DARK = darkness(now()); hud();
    loadMusic();                                                                   // before the warm-up, so ?music=on is seen by it
    if (WARM) { nightness = sleepCurve(now(), PARTY ? 21.5 : 20.5); for (var wi = 0; wi < Math.min(WARM, 120) * 30; wi++) update(1 / 30); }
    setInterval(load, 5 * 60000);
    setTimeout(loadLive, DEMO ? 2500 : 1500); setInterval(loadLive, 45000);      // the printer and the letters
    setInterval(loadMusic, 10000);                                                 // the speaker, for the dancing
    setTimeout(loadOffice, DEMO ? 2000 : 1200); setInterval(loadOffice, 10000);    // the agent office, for the robot
    requestAnimationFrame(frame);
    // ?dbg exposes the sim for a headless check (positions, duties, the printer, the letters).
    if (/[?&]dbg\b/.test(Q)) window.meadow = { fam: fam, LETTER: LETTER, pr: function () { return PR; }, music: function () { return { m: MUSIC, t: MUSIC_T, dance: DANCE, sign: SIGN && { w: SIGN.w, h: SIGN.h } }; }, fps: function () { return FPST; }, isMusic: isMusic, state: printerState, open: openCard, shop: openShop,
      office: function () { return { o: OFFICE, robot: ROBOT && { x: ROBOT.x, y: ROBOT.y, bub: ROBOT.bubBox } }; }, officeLine: officeLine, nav: function () { return NAVS; }, go: goView, inZone: inZone,
      extras: function () { return { ann: XS.ann, due: XS.due, tiles: XS.tiles, taps: XS.taps, hidden: XS.hidden }; } };
    if (OPEN === "school") { if (SCENE.hotspots && SCENE.hotspots.school) setTimeout(openSchool, 900); }
    else if (OPEN === "workshop") setTimeout(openShop, 900);
    else if (OPEN) setTimeout(function () { var t = fam.filter(function (f) { return f.person.name.toLowerCase() === OPEN.toLowerCase(); })[0]; if (t) openCard(t); }, 900);
  }
  (document.fonts && document.fonts.load ? document.fonts.load("600 20px Fredoka").catch(function (e) { console.warn("font", e); }) : Promise.resolve())
    .then(function () { if (!STOPPED) { start(); STARTED = true; } });
  return {
    // positions are fractions of the card, so a new size rebuilds the village
    resize: function () { if (STOPPED || !STARTED) return; if (WRAP.clientWidth === W && WRAP.clientHeight === H) return;
      size(); if (VIL) VILLAGE = makeVillage(); else makeDrops(); makeWeatherSprites();
      if (SCENE.ambient) SCENE.ambient.setup(SV); },
    stop: function () { STOPPED = true; TIMERS.forEach(function (id) { window.clearInterval(id); }); window.cancelAnimationFrame(RAF); }
  };
}
