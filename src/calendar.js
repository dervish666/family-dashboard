// ── Calendars ─────────────────────────────────────────────────────────────────
// The seven days the card shows, as the [start, end) the calendar API is asked for:
// local midnight today to local midnight seven days on.
export function weekRange(d) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { start: a, end: new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7) };
}
export function calendarPath(id, range) {
  return "calendars/" + id + "?start=" + encodeURIComponent(range.start.toISOString()) + "&end=" + encodeURIComponent(range.end.toISOString());
}
function localYmd(d) { return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate(); }
// A "YYYY-MM-DD" moved by n days on the calendar (UTC arithmetic, so no clock change gets in).
function shiftYmd(s, n) { return new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n)).toISOString().slice(0, 10); }
const YMD = /^\d{4}-\d\d-\d\d/, MIDNIGHT = /^.{10}T00:00(:00(\.0+)?)?([Z+-]|$)/;
// GET /api/calendars/<id> answers a list of {summary, start: {date} | {dateTime}, end}.
// Each becomes a row per day it covers inside the range, in the shape the family_week template
// wrote: who, what, day (the calendar's own date), all_day, start, at (HH:MM as the calendar
// wrote it), plus end as the calendar wrote it. An all-day end is the day after the last one;
// a timed event ending at 00:00 does not reach into that day. A row on a day after the event's
// first (or on the range's first day, for one that began before it) has cont: an all-day event
// stays all day, a timed one says "until 06:00" on its last day and reads as all day between
// (and on its last day too when it ends at 00:00 the day after).
// Anything that is not a list throws, so a broken answer reads as unavailable, not empty, and
// so does a list with entries none of which has a readable start.
export function parseCalendarEvents(evs, who, range) {
  if (!Array.isArray(evs)) throw new Error("calendar answer is not a list");
  const first = localYmd(range.start), last = localYmd(new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate() - 1));
  const rows = [];
  let read = 0;
  evs.forEach(function (e) {
    if (!e || !e.start) return;
    const allDay = !!e.start.date && !e.start.dateTime, s = String(allDay ? e.start.date : e.start.dateTime || "");
    if (!YMD.test(s)) return;
    read++;
    const what = String(e.summary || "Busy"), sd = s.slice(0, 10), end = String(e.end && (allDay ? e.end.date : e.end.dateTime) || "");
    let ed = YMD.test(end) ? end.slice(0, 10) : sd;
    const atMidnight = ed > sd && (allDay || MIDNIGHT.test(end));   // ends as its last day ends: that day is all day
    if (atMidnight) ed = shiftYmd(ed, -1);
    if (ed < sd) ed = sd;
    const until = !atMidnight && /^\d\d:\d\d$/.test(end.slice(11, 16));
    for (let day = sd < first ? first : sd; day <= ed && day <= last; day = shiftYmd(day, 1)) {
      if (day === sd) rows.push({ who: who, what: what, day: day, all_day: allDay, start: allDay ? day : s, at: allDay ? "" : s.slice(11, 16), end: end });
      else if (!allDay && day === ed && until) rows.push({ who: who, what: what, day: day, all_day: false, start: s, at: "until " + end.slice(11, 16), end: end, cont: true });
      else rows.push({ who: who, what: what, day: day, all_day: true, start: day, at: "", end: end, cont: true });
    }
  });
  if (evs.length && !read) throw new Error("calendar answer unreadable (" + evs.length + (evs.length === 1 ? " entry" : " entries") + ", none with a start)");
  return rows;
}

// Whether a person's card can trust its week: "error" when the whole load failed (on a
// first load the week is empty, which is not a free day), "loading" before the first load
// has answered (an empty week then is not a free day either), "failed" when one of their own
// calendars did not answer, otherwise "ok".
export function calendarHealth(data, name) {
  if (data && data.error) return "error";
  if (!data || !data.gotAt) return "loading";
  return ((data && data.calFailed) || []).some(function (f) { return f.who === name; }) ? "failed" : "ok";
}
