// The popup cards' HTML: a person's card, the School card and the workshop's. Data in, HTML out: no DOM, no
// timers, no engine state, so tests/check.mjs builds them as they are. The engine writes what
// these return into the popup and keeps the rest (the portrait, focus, the letter's lifecycle,
// the minute before the card closes itself).
//
//   personCard(v)   { html, sum } for one person: their letter, today, this week, due times,
//                   lessons and lunch, good to know, and the foot that says what could not be read
//   schoolCard(v)   { html, sum } for the School: every child's week, lunch, kit, items, term dates
//   shopCard(v)     { html, sum } for the workshop's printer, from v.printer (PR), v.state
//                   (printerState(): "empty" once nothing is fresh) and v.now
//   postCleared(l)  the line a letter's block becomes once Got it is tapped
//
// v is what the cards are built from:
//   data     the engine's snapshot (DATA): events, extra, school, weekAt, gotAt, error, calFailed...
//   now      a Date, the engine's clock (test hooks and all)
//   config   the normalised config (people, sensors, calendarMode, sourceOwner, due, schoolWho...)
//   src      each child's school sources (data.js schoolSources)
//   demo     true on the demo, whose sensors.extra is made up and never missing
//   demoInHa true when that demo runs on a real Home Assistant: the foot says so and claims no checks
// and for personCard also:
//   person   the person whose card it is
//   letter   the letter to show at the top, or null
//   letters  the letter helpers' state (LETTER: clearErr, bad)
//   due      the due times read now (extras.js parseDue, people resolved), or null
// The school parse is cached on data.pc (data.js schoolParse), so a card built twice from one
// snapshot parses each child's day once.
import { esc, pad2, ymd } from "./engine/draw.js";
import { calendarHealth } from "./calendar.js";
import { lessonsOver, addDays, mondayOf } from "./school.js";
import { dayLabel, stamp, WEEK_STALE, schoolParse, choiceFor, schoolDay, weekday, DAYS, DAYS_LONG, MONTHS, DEMO_IN_HA } from "./data.js";

var KIND = { homework: "Homework", kit: "Kit", "term-date": "School", "inset-day": "No school", deadline: "Deadline", event: "School" };
function row(when, what, chip, raw) {
  return '<div class="row"><div class="when">' + esc(when) + '</div><div class="what">' + (chip ? '<span class="chip">' + esc(chip) + "</span>" : "") + (raw ? what : esc(what)) + "</div></div>";
}
// What to say about sensors.extra: nothing when it is off (null) or loaded, a plain
// "unavailable" when it is configured but did not answer, and "unreadable" with what was
// left out when part of it was in the wrong shape (readExtra in school.js).
function extraState(v) {
  var data = v.data;
  if (!v.config.sensors.extra) return "";
  if (data.extraBad && data.extraBad.length) return "School info unreadable (" + data.extraBad.join(", ") + ").";
  if (data.extra) return "";
  if (data.extraErr) return "School info unavailable (" + data.extraErr + ").";
  return data.othersAt ? "School info unavailable." : "";
}
function checkedAt(ex) { var xc = new Date(ex.checked_at); return "School info checked " + DAYS[xc.getDay()] + " " + xc.getDate() + " " + MONTHS[xc.getMonth()] + "."; }

// ── The letter ──────────────────────────────────────────────────────────────────
var POST_SVG = '<svg class="pe" viewBox="0 0 48 36" width="56" height="42" aria-hidden="true"><rect x="2" y="2" width="44" height="32" rx="4" fill="#fff" stroke="#B5583A" stroke-width="2.5"/>' +
  '<path d="M3 4l21 16L45 4" fill="none" stroke="#B5583A" stroke-width="2.5" stroke-linejoin="round"/><rect x="34" y="7" width="8" height="9" rx="1" fill="#D9433A"/></svg>';
function postBlock(l) {
  var long = String(l.text).length > 90 ? " long" : "";
  return '<div class="post"><div class="pin"><div class="ph">' + POST_SVG + '<div><div class="pk">You\'ve got post</div>' +
    '<div class="pf">' + (l.from ? "Letter from <b>" + esc(l.from) + "</b>" : "A letter") + ' <span class="pt">' + pad2(l.at.getHours()) + ":" + pad2(l.at.getMinutes()) + "</span></div></div></div>" +
    '<div class="px' + long + '">' + esc(l.text) + "</div>" +
    '<div class="pg"><button class="pgot" type="button">Got it</button><span>Got it clears the letter. So does closing this card.</span></div></div></div>';
}
export function postCleared(l) { return '<div class="post done">' + (l.from ? "Letter from " + esc(l.from) + " cleared." : "Letter cleared.") + "</div>"; }

// This person's due items on their card (no person: the household's), and the unavailable foot.
function dueSection(v, name) {
  var conf = v.config.due, due = v.due, people = v.config.people;
  if (!conf || !due) return { html: "", foot: "" };
  if (due.status !== "ok") return { html: "", foot: "Due times unavailable (" + conf.entity + " " + due.reason + ")." };
  var house = people[people.length - 1].name, mine = due.items.filter(function (it) { return (it.person || house) === name; });
  var html = mine.length ? "<h2>Due</h2>" + mine.map(function (it) {
    return row(it.when, esc(it.label) + ' <span class="soft' + (it.kind === "overdue" ? " late" : "") + '">' + esc(it.rel) + "</span>", "", true); }).join("") : "";
  return { html: html, foot: due.bad ? due.bad + (due.bad === 1 ? " due item" : " due items") + " in " + conf.entity + " could not be read." : "" };
}

// ── A person's card ─────────────────────────────────────────────────────────────
// A failed or unfinished load, no calendar at all, or a week too old to trust (a v1.0.0
// template sensor that stopped updating) never reads as a free day: Today and the summary say
// which it is, and the foot names what failed.
export function personCard(v) {
  var p = v.person, name = p.name, data = v.data, td = ymd(v.now), html = "";
  var mine = data.events.filter(function (e) { return e.who === name; });
  var today = mine.filter(function (e) { return e.day === td; }), later = mine.filter(function (e) { return e.day > td; });
  var calHealth = calendarHealth(data, name);
  if (v.config.calendarMode && !(p.calendars || []).length && calHealth === "ok") calHealth = "none";   // nothing to read is not a free day
  if (calHealth === "ok" && data.weekAt && v.now - data.weekAt > WEEK_STALE) calHealth = "stale";
  if (v.letter) html += postBlock(v.letter);
  html += "<h2>Today</h2>";
  html += today.length ? today.map(function (e) { return row(e.all_day ? "All day" : e.at, e.what); }).join("")
    : '<div class="empty">' + (calHealth === "none" ? "No calendar picked for " + esc(name) + " yet. Add one in the card editor."
      : calHealth === "loading" ? "Still loading the week, so this card can't say what's on yet."
      : calHealth === "stale" ? "Calendars last checked " + stamp(data.weekAt, v.now) + ", so this card can't say what's on."
      : calHealth !== "ok" ? "Calendar unavailable, so this card can't say what's on."
      : name === "House" ? "Nothing for the house today." : "Nothing on today. Plenty of time for snacks.") + "</div>";
  if (later.length) {
    html += "<h2>This week</h2>";
    later.forEach(function (e) { html += row(dayLabel(e.day, v.now) + (e.all_day ? "" : " " + e.at), e.what); });
  }
  // This child's lessons and lunch (people[].timetable, .lunch), with what went wrong for the foot.
  var dueS = dueSection(v, name);
  html += dueS.html;
  var sch = schoolSections(v, name);
  html += sch.html;
  var ex = data.extra || {}, items = (ex.items || []).filter(function (i) { return i.who === name && i.date >= td; })
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var kit = (ex.kit || []).filter(function (k) { return k.who === name; });
  var flags = name === "House" ? (ex.flags || []) : [];
  if (items.length || kit.length || flags.length) {
    html += "<h2>Good to know</h2>";
    items.forEach(function (i) { html += row(dayLabel(i.date, v.now), i.what, KIND[i.kind] || i.kind); });
    kit.forEach(function (k) { html += row("Every week", k.what, "Kit"); });
    flags.forEach(function (f) { html += row("", f, "Heads up"); });
  }
  var foot = [];
  if (v.demoInHa) foot.push('<span class="bad">' + DEMO_IN_HA + ".</span>");
  else {
    if (data.weekAt) foot.push("Calendars checked " + stamp(data.weekAt, v.now) + ".");
    if (ex.checked_at) foot.push(checkedAt(ex));
  }
  var missing = ((ex.sources || {}).unavailable || []).filter(function (s) {
    return name === "House" || v.config.sourceOwner.some(function (m) { return m[0].test(s) && m[1] === name; }); });
  if (missing.length) foot.push('<span class="bad">Couldn\'t check: ' + missing.map(esc).join(", ") + ".</span>");
  var calBad = (data.calFailed || []).filter(function (f) { return f.who === name; });
  sch.foot.forEach(function (f) { foot.push('<span class="bad">' + esc(f) + "</span>"); });
  if (data.error) foot.push('<span class="bad">Can\'t load the week (' + esc(data.error) + ")" + (data.weekAt ? ", so this is the last week that loaded." : ".") + "</span>");
  if (calBad.length) foot.push('<span class="bad">Calendar unavailable: ' + calBad.map(function (f) { return esc(f.id); }).join(", ") + ". This week may be missing events.</span>");
  if (!v.demo) { var xs = extraState(v); if (xs) foot.push('<span class="bad">' + esc(xs) + "</span>"); }
  if (dueS.foot) foot.push('<span class="bad">' + esc(dueS.foot) + "</span>");
  if (v.letters.clearErr) foot.push('<span class="bad">Couldn\'t clear the letter in Home Assistant (' + esc(v.letters.clearErr) + ').</span>');
  v.letters.bad.filter(function (b) { return b.who === name; }).forEach(function (b) { foot.push('<span class="bad">Letters unavailable (' + esc(b.entity) + " " + esc(b.reason) + "), so this card can't say if one is waiting.</span>"); });
  html += '<div class="foot">' + foot.join(" ") + "</div>";
  var sum = today.length ? today.length + (today.length === 1 ? " thing today" : " things today")
    : calHealth === "none" ? "No calendar" : calHealth === "loading" ? "Loading the week" : calHealth === "stale" ? "Last checked " + stamp(data.weekAt, v.now)
    : calHealth !== "ok" ? "Calendar unavailable" : "Free today";
  return { html: html, sum: sum };
}

// ── School data per child ────────────────────────────────────────────────────────
// Lessons and lunch from people[].timetable and .lunch, parsed by school.js. Every empty
// state says which one it is: a sensor that is set but missing says unavailable and names
// itself, never a blank that reads as a day off.
// A card shows the next school day once today's last lesson has ended (lessonsOver in
// school.js), or after half past three when the timetable gives no end times.
function ttFor(v, name, d) { return schoolParse(v.data, v.src, "timetable", name, d, v.now); }
function lunchFor(v, name, d) { return schoolParse(v.data, v.src, "lunch", name, d, v.now); }
function soft(s) { return ' <span class="soft">' + esc(s) + "</span>"; }
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
function nextLessonDay(v, name, from) {
  for (var i = 1; i <= 14; i++) { var d = addDays(from, i), t = ttFor(v, name, d);
    if (t.status === "ok" || t.status === "unavailable" || t.status === "no_week") return { d: d, t: t, i: i }; }
  return null;
}
function dishHtml(o, picked) {
  return '<div class="dish' + (picked ? " picked" : "") + '">' + (picked ? '<span class="chip pick">Chosen</span>' : "") + esc(o.name) + (o.kind ? soft(o.kind) : "") +
    o.allergens.map(function (a) { return ' <span class="alg">' + esc(a) + "</span>"; }).join("") + "</div>";
}
// One day's lunch as a row's content: the choice, the options with allergens, the pudding.
// A school day without a menu says which kind of without it is.
function lunchHtml(v, name, d, l, today) {
  var ch = l.status === "served" || l.status === "no_menu" || l.status === "ended" ? choiceFor(v.data, v.src, name, d, l.choice) : null;
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
function schoolSections(v, name) {
  var out = { html: "", foot: [] }, src = v.src[name];
  if (!src) return out;
  var d = v.now, td = ymd(d);
  if (src.timetable) {
    var t = ttFor(v, name, d), shown = null, sh = null, head;
    if (t.status === "unavailable") { out.html += "<h2>Lessons</h2>" + empty("Timetable unavailable (" + src.timetable.entity + ")");
      out.foot.push("Timetable " + src.timetable.entity + " " + (t.reason || "unavailable") + "."); }
    else if (t.status === "loading") out.html += "<h2>Lessons</h2>" + empty("Loading the timetable.");
    else if (t.status === "no_week") { out.html += "<h2>Lessons</h2>" + empty("Timetable can't tell which week this is");
      out.foot.push("Timetable " + src.timetable.entity + ": " + t.reason + ". Add anchor or week_of."); }
    else {
      if (t.status === "ok" && !lessonsOver(t, d)) { shown = td; sh = t; head = "Lessons today"; }
      else {
        if (t.status !== "ok") out.html += "<h2>Lessons today</h2>" + empty("No school today" + (t.note && t.status === "closed" ? " (" + t.note + ")" : ""));
        var nx = nextLessonDay(v, name, d);
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
    var first = lunchFor(v, name, d);
    out.html += "<h2>Lunch</h2>";
    if (first.status === "unavailable") { out.html += empty("Lunch menu unavailable (" + src.lunch.entity + ")");
      out.foot.push("Lunch menu " + src.lunch.entity + " " + (first.reason || "unavailable") + "."); }
    else {
      var days = weekday(d) ? [d] : [];
      var nd = addDays(d, 1); while (!weekday(nd)) nd = addDays(nd, 1);
      days.push(nd);
      days.forEach(function (x) { out.html += row(dayLabel(ymd(x), v.now), lunchHtml(v, name, x, lunchFor(v, name, x), ymd(x) === td), "", true); });
      var ce = choiceFor(v.data, v.src, name, d, first.choice);
      if (ce && ce.err) out.foot.push("Lunch choice unavailable (" + ce.err + ").");
    }
  }
  return out;
}

// ── The School card ──────────────────────────────────────────────────────────────
// Tapping the school opens everything school-shaped in one place. Sources, all
// through Home Assistant: each child's lessons and lunch from people[].timetable and .lunch,
// kit from sensors.kit, and term dates plus school items from sensors.extra.
// The kids are the people with school: true; only their items count here.
// The School card's week: one lane per child with a timetable, Mon to Fri, today lit. On a
// weekend it is next week.
function schoolWeek(v, td) {
  var d = v.now, kids = v.config.people.filter(function (p) { return v.src[p.name] && v.src[p.name].timetable; });
  if (!kids.length) return "";
  var mon = weekday(d) ? mondayOf(d) : mondayOf(addDays(d, 7)), dates = [0, 1, 2, 3, 4].map(function (i) { return ymd(addDays(mon, i)); });
  var h = "<h2>" + (weekday(d) ? "This week" : "Next week") + '</h2><table class="tt lanes"><tr><th></th>';
  dates.forEach(function (ds) { h += '<th class="' + (ds === td ? "now" : "") + '">' + esc(shortDate(ds).replace(/ \w+$/, "")) + "</th>"; });
  h += "</tr>";
  kids.forEach(function (p) {
    var t = ttFor(v, p.name, mon), g = t.grid;
    h += '<tr><th class="who"><span class="dot" style="background:' + esc(p.col) + '"></span>' + esc(p.name) + (g && g.week ? "<small>" + esc(weekName(g.week)) + "</small>" : "") + "</th>";
    if (!g || !g.week) { h += '<td colspan="5" class="off">' + esc(t.status === "unavailable" ? "Timetable unavailable (" + v.src[p.name].timetable.entity + ")" : t.status === "loading" ? "Loading"
      : g && g.off ? "No timetable this week" : "Timetable can't tell which week this is") + "</td></tr>"; return; }
    g.days.forEach(function (day) {
      h += '<td class="' + (day.date === td ? "now" : "") + (day.closed ? " off" : "") + '">' + (day.closed ? esc(day.note || "No school")
        : day.lessons.map(function (l) { return '<div class="ln"><b>' + esc(l.p) + "</b> " + esc(l.subject) + "</div>"; }).join("")) + "</td>"; });
    h += "</tr>";
  });
  return h + "</table>";
}
// "Term 1 ends Fri 16 Oct", or when the next one starts, with the gathered note.
function termRows(v, sc, td) {
  var out = "", cur = null, next = null;
  sc.terms.forEach(function (t) {
    if (t.from && t.from <= td && (!t.to || t.to >= td)) cur = t;
    else if (!t.from && t.to && t.to >= td && !cur) cur = t;
    if (!next && t.from && t.from > td) next = t;
  });
  if (cur) out += row(cur.to ? dayLabel(cur.to, v.now) : "", esc(cur.label) + (cur.to ? " ends" : " is on") + (cur.note ? soft(cur.note) : ""), sc.who, true);
  if (next) out += row(dayLabel(next.from, v.now), esc(next.label) + " starts" + (next.note ? soft(next.note) : ""), sc.who, true);
  if (!cur && !next) sc.terms.filter(function (t) { return !t.from && !t.to; }).forEach(function (t) { out += row("", esc(t.label) + soft(t.note || "not published"), sc.who, true); });
  (sc.days || []).filter(function (d) { return d.date >= td; }).slice(0, 3).forEach(function (d) { out += row(dayLabel(d.date, v.now), esc(d.what), sc.who, true); });
  return out;
}
export function schoolCard(v) {
  var d = v.now, td = ymd(d), ex = v.data.extra || {}, S = v.data.school || {}, html = "", sum = "", people = v.config.people;
  var kids = people.filter(function (p) { return p.school; }).map(function (p) { return p.name; });
  // Each child with a timetable in one grid, then today's lunch for each child with a menu
  html += schoolWeek(v, td);
  var lunchKids = people.filter(function (p) { return v.src[p.name] && v.src[p.name].lunch; });
  if (lunchKids.length && weekday(d)) {
    html += "<h2>Lunch today</h2>";
    lunchKids.forEach(function (p) { var l = lunchFor(v, p.name, d);
      html += row(p.name, l.status === "unavailable" ? esc("Lunch menu unavailable (" + v.src[p.name].lunch.entity + ")") : lunchHtml(v, p.name, d, l, true), "", true); });
  }
  if (S.kit) html += "<h2>Kit today</h2>" + row(v.config.schoolWho.kit, S.kit.kit_today && S.kit.kit_today !== "none" ? S.kit.kit_today : "No kit needed");
  // Kids the data cannot place (no timetable, lunch or term dates) are not counted as home.
  var days = kids.map(function (n) { return schoolDay(v.data, v.src, n, d); }), atSchool = days.filter(function (x) { return x === true; }).length;
  sum = !weekday(d) ? "Weekend" : atSchool ? atSchool + (atSchool === 1 ? " child" : " children") + " at school today"
    : days.length && days.every(function (x) { return x === false; }) ? "No school today" : "Can't tell who has school today";
  // School items for every kid, soonest first
  var items = (ex.items || []).filter(function (i) { return kids.indexOf(i.who) >= 0 && i.date >= td; })
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  html += "<h2>Coming up</h2>";
  html += items.length ? items.slice(0, 12).map(function (i) { return row(dayLabel(i.date, v.now), (KIND[i.kind] ? KIND[i.kind] + ": " : "") + i.what, i.who); }).join("")
      + (items.length > 12 ? '<div class="empty">+' + (items.length - 12) + " more on each child's card</div>" : "")
    : '<div class="empty">Nothing gathered for the coming weeks.</div>';
  (ex.kit || []).filter(function (k) { return kids.indexOf(k.who) >= 0; }).forEach(function (k) { html += row("Every week", k.what, k.who); });
  // Term dates
  html += "<h2>Term dates</h2>";
  html += ex.schools && ex.schools.length ? ex.schools.map(function (sc) { return termRows(v, sc, td); }).join("")
    : '<div class="empty">Term dates not gathered yet.</div>';
  var foot = [];
  if (v.demoInHa) foot.push('<span class="bad">' + DEMO_IN_HA + ".</span>");
  else if (ex.checked_at) foot.push(checkedAt(ex));
  var missing = (ex.sources || {}).unavailable || [];
  if (missing.length) foot.push('<span class="bad">Couldn\'t check: ' + missing.map(esc).join(", ") + ".</span>");
  if (!v.demo) { var xs2 = extraState(v); if (xs2) foot.push('<span class="bad">' + esc(xs2) + "</span>"); }
  people.forEach(function (p) { schoolSections(v, p.name).foot.forEach(function (f) { foot.push('<span class="bad">' + esc(p.name + ": " + f) + "</span>"); }); });
  (v.config.schoolOrphans || []).forEach(function (o) { foot.push('<span class="bad">' + esc("sensors." + o.key + " (" + o.entity + ") belongs to schoolWho." + o.key + " = " + o.who +
    ", who is not in people. Set " + o.key + " on the child.") + "</span>"); });
  html += '<div class="foot">' + foot.join(" ") + "</div>";
  return { html: html, sum: sum };
}

// ── The workshop card ────────────────────────────────────────────────────────────
// The print job as the printer reports it: name, percent, time left and when
// that lands on the clock. Nothing fresh, and the card says so instead of
// showing the last thing it saw.
var PR_LABEL = { running: "Printing", pause: "Paused", finish: "Finished", failed: "Failed", idle: "Idle", prepare: "Getting ready",
  slicing: "Slicing", init: "Starting up", offline: "Offline", unknown: "Unknown", missing: "Not reachable" };
function mins(m) { return m >= 60 ? Math.floor(m / 60) + "h " + pad2(m % 60) + "m" : m + " min"; }
export function shopCard(v) {
  var PR = v.printer, live = v.state !== "empty", st = live ? PR.status : (PR.err ? "missing" : PR.status), html = "", sum;
  var label = PR_LABEL[st] || st;
  html += "<h2>The printer</h2>" + row("Status", label);
  if (live && PR.name && st !== "idle") html += row("Job", PR.name);
  if (st === "running" || st === "pause") {
    html += row("Progress", Math.round(PR.progress) + "%");
    if (PR.layer != null && PR.layers != null) html += row("Layer", PR.layer + " of " + PR.layers);
    if (PR.remain != null) { var done = new Date(v.now.getTime() + PR.remain * 60000);
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
  return { html: html, sum: sum };
}
