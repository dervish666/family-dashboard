// Per-person letters (v1.8.0): people[].letter, an input_text or text entity holding
// "from|text", the room panels' letter contract (homeassistant/panels.example.yaml,
// docs/07-room-panels.md). The rules match the panel's C++ and the package's Jinja, and
// tests/check.mjs runs the same fixtures as tests/panels/check.py (tests/panels/letters.json).
//
//   "Parent 1|Tea's at six"   a letter from Parent 1
//   "|Tea's at six", "Tea's at six"   a letter with no sender
//   "", "unknown", "Parent 1|"   no letter (unknown: a helper that has never held one)
//   "unavailable", or no entity   unavailable: the card says so, never "no letters"
//
// Split on the first "|" only, trim both halves of spaces, tabs and newlines only.
//
// The bridge: until v1.8 the package's script also copied each letter to the shared postie
// helper (sensors.letter) as "Kid A: From Parent 1: Tea's at six". A shared value that is
// exactly that copy of a per-person letter is the same letter: it is shown once, as the
// per-person one. If the copy was seen first, the per-person letter takes over its envelope.
// Opening the card then empties the person's helper, and the shared helper too if it still
// holds the copy.

const EDGE = /^[ \t\r\n]+|[ \t\r\n]+$/g;
function trim(s) { return String(s).replace(EDGE, ""); }
// Python's [:n] counts code points, not UTF-16 units
function cut(s, n) { const a = Array.from(s); return a.length > n ? a.slice(0, n).join("") : s; }

export function parseLetter(st) {
  if (st == null) return { kind: "unavailable", from: "", text: "", raw: "", reason: "not found" };
  const raw = st.state == null ? "" : String(st.state);
  let s = trim(raw);
  if (s === "unknown") s = "";
  if (s === "unavailable") return { kind: "unavailable", from: "", text: "", raw: raw, reason: "is unavailable" };
  const p = s.indexOf("|");
  const from = p < 0 ? "" : trim(s.slice(0, p)), text = p < 0 ? s : trim(s.slice(p + 1));
  return { kind: text ? "letter" : "none", from: from, text: text, raw: raw };
}

// What the package's script writes to the postie for this letter (postie_value).
export function letterMirror(name, from, text) {
  return cut(name + ": " + (from ? "From " + from + ": " : "") + text, 255);
}

// The card's memory of letters: live holds every letter not yet read (queued, on the road
// or worn), from either source; seen is each helper's last key; mirrors the copies seen.
export function newLetterBook() { return { live: [], seen: {}, mirrors: [] }; }

function drop(book, l) { l.gone = true; book.live = book.live.filter(function (x) { return x !== l; }); }

// One poll of the per-person helpers. owners: [{ name, entity }]; states: entity -> state
// object, or null when it could not be read (an entity left out was not polled). Returns the
// letters to queue, the letters to take back (read elsewhere: on a panel, by the expiry) and
// the helpers that could not be read. A changed letter replaces the one already out, in place.
export function letterStep(book, owners, states, nowMs) {
  const out = { add: [], drop: [], bad: [] };
  owners.forEach(function (o) {
    if (!Object.prototype.hasOwnProperty.call(states, o.entity)) return;
    const st = states[o.entity], p = parseLetter(st);
    const cur = book.live.filter(function (l) { return l.src === o.entity; })[0] || null;
    if (p.kind === "unavailable") { out.bad.push({ who: o.name, entity: o.entity, reason: p.reason }); return; }   // keep what is out: cannot tell
    if (p.kind === "none") { delete book.seen[o.entity]; if (cur) { drop(book, cur); out.drop.push(cur); } return; }
    const key = p.raw + "|" + (st.last_changed || "");
    if (book.seen[o.entity] === key) return;
    book.seen[o.entity] = key;
    const lc = Date.parse(st.last_changed || "");
    const f = { to: o.name, text: p.text, from: p.from, raw: p.raw, key: key, src: o.entity, mirror: letterMirror(o.name, p.from, p.text), at: new Date(isFinite(lc) ? lc : nowMs), gone: false };
    if (book.mirrors.indexOf(f.mirror) < 0) { book.mirrors.push(f.mirror); if (book.mirrors.length > 20) book.mirrors.shift(); }
    const twin = book.live.filter(function (l) { return !l.src && l.to === o.name && l.shared != null && trim(l.shared) === f.mirror; })[0] || null;
    if (cur && twin) { drop(book, twin); out.drop.push(twin); }
    const into = cur || twin;
    if (into) { delete into.shared; Object.assign(into, f); }
    else { const l = Object.assign({}, f); book.live.push(l); out.add.push(l); }
  });
  return out;
}

// Is this shared-helper value the bridge's copy of a per-person letter the card has seen?
export function bridgeCopy(book, text) {
  return book.mirrors.indexOf(trim(text)) >= 0;
}

// A shared-helper letter the engine has queued (so a per-person twin can take it over).
export function letterShared(book, l, text) { l.shared = String(text); book.live.push(l); }

// The person's card was opened on letter l. Returns what to empty, each with the exact value
// it must still hold at the moment of writing (a newer letter is left alone): the person's
// helper, and the shared helper if it still holds this letter's copy. A shared letter returns
// nothing: the engine clears it the v1.7.0 way.
export function letterRead(book, l, sharedId, sharedState) {
  book.live = book.live.filter(function (x) { return x !== l; });
  if (!l.src) return [];
  const w = [{ entity: l.src, expect: l.raw }];
  if (sharedId && sharedState && sharedState.state != null && trim(sharedState.state) === l.mirror) w.push({ entity: sharedId, expect: String(sharedState.state) });
  return w;
}

// The first queued letter the postie can take: not one for someone already wearing a letter
// when either is a per-person letter (one at a time; the next waits at the post office).
// With shared letters only this is always the head of the queue, as in v1.7.0.
export function nextLetter(queue, holder) {
  for (let i = 0; i < queue.length; i++) {
    const L = queue[i], h = holder(L.to);
    if (h && h !== L && (L.src || h.src)) continue;
    return L;
  }
  return null;
}
