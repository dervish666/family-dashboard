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
// GET /api/calendars/<id> answers a list of {summary, start: {date} | {dateTime}, end}.
// Each becomes a row in the shape the family_week template wrote: who, what, day (the
// calendar's own date), all_day, start, at (HH:MM as the calendar wrote it). An all-day
// event that began before the range and is still running shows on the first day.
// Anything that is not a list throws, so a broken answer reads as unavailable, not empty.
export function parseCalendarEvents(evs, who, range) {
  if (!Array.isArray(evs)) throw new Error("calendar answer is not a list");
  const first = localYmd(range.start);
  return evs.map(function (e) {
    if (!e || !e.start) return null;
    const allDay = !!e.start.date && !e.start.dateTime, s = String(allDay ? e.start.date : e.start.dateTime || "");
    if (!/^\d{4}-\d\d-\d\d/.test(s)) return null;
    let day = s.slice(0, 10);
    if (day < first) day = first;
    return { who: who, what: String(e.summary || "Busy"), day: day, all_day: allDay, start: allDay ? day : s,
      at: allDay ? "" : s.slice(11, 16) };
  }).filter(function (r) { return r; });
}
