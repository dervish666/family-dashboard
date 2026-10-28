// The post office's hours and the letter badge (v1.9.0).
//
// The postie (and the airmail, in scenes with no village) only goes out while the family is
// up: nightness, the same sleepCurve the creatures fall asleep on, at or under POST_GATE.
// Before 07:30 nightness is 7.5 - hour, so the post goes at 07:09; from an hour before bed it
// climbs again, so the last post is at 19:50 (20:50 on a party night, bed at 21:30).
// postHint() reads the hours off that same curve, minute by minute, so moving bedtime or the
// gate moves the hint with it. Nothing here is hard-coded to 07:09.

export const POST_GATE = 0.35;

// How asleep the family is, 0 to 1, from the clock (minutes, not seconds) and bedtime in hours.
export function sleepCurve(d, bed) {
  var h = d.getHours() + d.getMinutes() / 60;
  if (h >= bed || h < 6.5) return 1;
  if (h >= bed - 1) return h - (bed - 1);
  if (h < 7.5) return 7.5 - h;
  return 0;
}

function clockAt(m) { return { getHours: function () { return Math.floor(m / 60); }, getMinutes: function () { return m % 60; } }; }
function open(m, bed) { return !(sleepCurve(clockAt(m), bed) > POST_GATE); }   // the engine's gate, word for word

// The post office's day in minutes after midnight: opens is the first minute the post can go,
// closes the first minute after it that it cannot (the evening cut-off).
export function postHours(bed) {
  var m = 0, opens, closes;
  while (m < 1440 && !open(m, bed)) m++;
  opens = m;
  while (m < 1440 && open(m, bed)) m++;
  closes = m;
  return { opens: opens, closes: closes };
}

function hhmm(m) { var h = Math.floor(m / 60) % 24, n = m % 60; return (h < 10 ? "0" : "") + h + ":" + (n < 10 ? "0" : "") + n; }

// The hint by the postbox while letters wait for the post: "" when nothing waits or the post
// is going (the postie takes it from here), else when it goes, today or tomorrow.
export function postHint(d, bed, waiting) {
  if (!waiting) return "";
  var m = d.getHours() * 60 + d.getMinutes(), hrs = postHours(bed);
  if (open(m, bed) || hrs.opens >= 1440) return "";
  return "Post goes at " + hhmm(hrs.opens) + (m >= hrs.closes ? " tomorrow" : "");
}

// Does this person's name tag wear the envelope badge? Only for a letter they are holding,
// one a tap opens: not one still queued at the post office, not one taken back.
export function postBadge(letter) { return !!letter && !letter.gone; }

// Where the badge's centre sits on a name tag sprite drawn at (x, y) (a pill 34 high from
// y + 2, the pointer below it): a disc docked on the pill's left end, clear of the name,
// which starts 17 in.
export function badgeSpot(x, y) { return { x: x + 1, y: y + 19, r: 13 }; }
