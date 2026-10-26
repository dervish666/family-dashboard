#!/bin/sh
# Proves tests/check.mjs can fail. Breaks the card in known ways on temp copies and expects
# the check to exit non-zero each time. Each break is made in src/ and rebuilt with esbuild
# (calendar parsing and calendar mode, creature and scene registries and their landmarks,
# the animals' walk, idle and sleep, a scene's exit and the duty walks round its obstacles,
# the school timetable and lunch parsers, the per-child school config, and v1.6.0's
# announcement, due-time and status-tile parsers and config). The breaks go in
# src/, not dist/, because dist/ is minified and its names change with every build. Exits 1
# if any broken copy passes. Needs npm ci first.
set -u
here=$(cd "$(dirname "$0")/.." && pwd)
esbuild="$here/node_modules/.bin/esbuild"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
node "$here/tests/check.mjs" "$here/dist/family-dashboard.js" "$here/src" >/dev/null || { echo "check fails on the real files"; exit 1; }
n=0

# file | sed expression | what it breaks. No "|" inside an expression: it splits the line. A file that does not exist yet is created from
# hedgehog.js, so the sabotage is a new module.
while IFS='|' read -r f expr what; do
  rm -rf "$tmp/src"; cp -R "$here/src" "$tmp/src"
  if [ -f "$tmp/src/$f" ]; then sed "$expr" "$tmp/src/$f" > "$tmp/x.js" || { echo "sed failed: $what"; exit 1; }; cmp -s "$tmp/x.js" "$tmp/src/$f" && { echo "sabotage did not apply: $what"; exit 1; }
  else sed "$expr" "$tmp/src/creatures/hedgehog.js" > "$tmp/x.js"; fi
  mv "$tmp/x.js" "$tmp/src/$f"
  "$esbuild" "$tmp/src/index.js" --bundle --format=esm --log-level=error --outfile="$tmp/fd.js" || { echo "sabotaged source did not build: $what"; exit 1; }
  if node "$here/tests/check.mjs" "$tmp/fd.js" "$tmp/src" >/dev/null 2>&1; then echo "broken copy passed: $what"; exit 1; fi
  n=$((n + 1))
done <<'EOF'
calendar.js|s/at: allDay ? "" : s.slice(11, 16)/at: allDay ? "" : s.slice(11, 15)/|calendar times lose their last digit
config.js|s/  if (calendarMode) {/  if (false) {/|calendar mode never switches on
creatures/fox.js|s/^  anim: function (t, p, time, M) {/  move: function (t, p, time, M) {/|the fox loses anim()
creatures/badger.js|s/id: "hedgehog", label: "Hedgehog"/id: "badger", label: "Badger"/|a badger module nobody registered
creatures/index.js|s/owl, rabbit, frog, cat,/owl, frog, cat,/|the bunny dropped from the registry
creatures/index.js|s/classic("bunny", "Bunny (classic)", true)/Object.assign({}, rabbit, { id: "bunny" })/|look: bunny becomes the rig, changing v1.3.0 configs
creatures/owl.js|s/var sl = M.sleep .. 0, aw = 1 - sl;/var sl = 0, aw = 1 - sl;/|the owl has no sleeping pose
creatures/cat.js|s/editor: true, sleeps: true,/editor: true,/|the cat does not say it sleeps
creatures/cat.js|s/sl \* (0.04 + 0.012 \* Math.sin(time \* 1.5))/sl * 0.04/|the sleeping cat stops breathing
creatures/frog.js|s/^  anim: function (t, p, time, M) {/  anim: function (t, p, time, M) { return;/|the frog stands stock still, walking or not
creatures/frog.js|s/var breathe = aw \* 0.01 \* Math.sin(time \* 3.2) \* M.idle;/var breathe = 0;/|the idle frog never stirs
scenes/index.js|s/export const SCENE_LIST = \[meadow, seaside, winter, forest, station\];/export const SCENE_LIST = [meadow, winter, forest, station];/|the seaside dropped from the registry
scenes/index.js|s/export const SCENE_LIST = \[meadow, seaside, winter, forest, station\];/export const SCENE_LIST = [meadow, seaside, winter, station];/|the forest camp dropped from the registry
scenes/winter.js|s/    office:  { box: function () { var p = G.post;/    offis:   { box: function () { var p = G.post;/|the winter village's post office loses its tap
scenes/winter.js|s/var h = G.home; return \[h.x - 86, h.y - 150, h.x + 86, h.y + 30\];/var h = G.post; return [h.x - 56, h.y - 110, h.x + 70, h.y + 14];/|home's tap box sits on the post office
scenes/forest.js|s/return \[f.x - 80, f.y - 78, f.x + 80, f.y + 20\];/return [f.x - 10, f.y - 78, f.x + 10, f.y + 20];/|the campfire is too thin to tap
scenes/forest.js|s/off: { x: -60, y: G.post.y - 10 }/off: { x: 60, y: G.post.y - 10 }/|the trail to school ends on the card
engine/route.js|s/^  if (!best) return null;/  return null;/|duty walks go straight through the campfire and the pond
scenes/seaside.js|s/    ground: function (ctx, S, WX) {/    floor: function (ctx, S, WX) {/|the seaside loses weather.ground()
scenes/seaside.js|s/    music:   { box: function () { var p = G.pav;/    musik:   { box: function () { var p = G.pav;/|the seaside's band on the pier loses its tap
scenes/meadow.js|s/    office:  { robot: true }/    office:  null/|the meadow's office robot is no longer mapped
scenes/seaside.js|s/return \[l.x - 40, l.y - 92, l.x + 40, l.y + 12\];/return [l.x - 10, l.y - 92, l.x + 10, l.y + 12];/|the lighthouse is too thin to tap
school.js|s/(ref.i + weeksBetween(ref.at, mon))/(ref.i + weeksBetween(ref.at, mon) + 1)/|the timetable counts from the wrong week
school.js|s/if (Object.prototype.hasOwnProperty.call(T.weekOf, key)) {/if (false) {/|the timetable ignores week_of
school.js|s/const ref = before\[0\]/const ref = null/|the count does not restart at a week_of entry
school.js|s/if (dow === 0 \(.*\)"weekend"; return out; }/if (dow === 7 \1"weekend"; return out; }/|the timetable has lessons at weekends
school.js|s/if (Object.prototype.hasOwnProperty.call(T.closed, out.date)) {/if (false) {/|the timetable ignores closed days
school.js|s/out.lessons = g.days\[dow - 1\].lessons;/out.lessons = g.days[dow % 5].lessons;/|lessons come from the wrong day
school.js|s/if (!isObj(raw) \&\& state \&\& isLegacyTimetable/if (false \&\& isLegacyTimetable/|v1.1.0 timetables stop parsing
school.js|s/out.reason = isObj(raw) ? "no days in the " + attr + " attribute" : unavailable(state, attr); return out;/out.status = "ok"; return out;/|a missing timetable reads as a day off
school.js|s/else if (out.menuEnds \&\& out.date > out.menuEnds) out.status = "ended";//|the lunch menu never runs out
school.js|s/? st : out.options.length/? "served" : out.options.length/|a closed lunch day reads as served
school.js|s/menu\[ymdOf(d)\] = { status: st/menu.x = { status: st/|v1.1.0 lunch sensors stop parsing
school.js|s/if (t) return { text: t, from: conf.entity, err: "" };//|the live choice entity is ignored
school.js|s/: fallback) : end;/: fallback) : LESSONS_FALLBACK;/|the card ignores the last lesson's end and waits for 15:30
school.js|s/v > end) end = v;/v < 0) end = v;/|the day ends at its first lesson's end, not its last
school.js|s/getMinutes() >= cut;/getMinutes() > cut;/|the minute the last lesson ends still counts as lessons on
scenes/index.js|s/export const SCENE_LIST = \[meadow, seaside, winter, forest, station\];/export const SCENE_LIST = [meadow, seaside, winter, forest];/|the space station dropped from the registry
scenes/station.js|s/    school:  { box: function () { var l = G.lock;/    skool:   { box: function () { var l = G.lock;/|the station's airlock loses its tap
scenes/station.js|s/return \[p.x - 104, p.y - 172, p.x + 104, p.y + 10\];/return [p.x - 14, p.y - 172, p.x + 14, p.y + 10];/|the hab pod is too thin to tap
scenes/station.js|s/off: { x: -60, y: B + 12 }/off: { x: 60, y: B + 12 }/|the airlock leads nowhere: the school run ends on the card
scenes/station.js|s/return around(t, dest, G.big, 30,/return null; void around(t, dest, G.big, 30,/|duty walks go straight through the holo table
scenes/station.js|s/  indoor: true, darkSky: true,/  darkSky: true,/|the station gets the sky's clouds and rain
scenes/station.js|s/  id: "station", label: "Space station",/  id: "station", label: "Space station", experimental: true,/|a draft scene passes for finished
scenes/station.js|s/  disco: function () { return { x: Math.round(G.W \* 0.475), y: G.WT + 52, top: G.WT + 3 }; },/  disco: function () { return { x: G.W \/ 2, y: 92, top: 0 }; },/|the glitter ball floats outside the window again
scenes/station.js|s/"alien_bloom", "alien_dome"\],/"alien_bloom", "alien_bloom"],/|two demo characters share a species
creatures/index.js|s/alienRock, alienBloom, alienDome,/alienRock, alienBloom,/|Domo dropped from the registry
creatures/alien_bloom.js|s/var sl = M.sleep .. 0, aw = 1 - sl;/var sl = 0, aw = 1 - sl;/|Bloom has no sleeping pose
creatures/alien_dome.js|s/^  anim: function (t, p, time, M) {/  anim: function (t, p, time, M) { return;/|Domo stands stock still, scuttling or not
creatures/alien_tetra.js|s/BOW = ownCol(o, "#F4C95D")/BOW = ownCol({}, "#F4C95D"), BAD = o.col.x/|an alien breaks without an owner colour
scenes/station.js|s/  demoCast: \[/  castDemo: [/|the station's demo cast stay animals
config.js|s/const cast = !raw.people \&\& /const cast = /|a cast someone chose is recast as aliens
creatures/index.js|s/  alienGloop, alienTetra, alienZib, alienRock,/  alienGloop, alienTetra, alienRock,/|Zib dropped from the registry
creatures/alien_rock.js|s/tg: 2.55, editor: true, sleeps: true,/tg: 2.55, editor: true,/|Boulder does not say it sleeps
creatures/alien_gloop.js|s/var sl = M.sleep .. 0, aw = 1 - sl;/var sl = 0, aw = 1 - sl;/|Gloop has no sleeping pose
creatures/alien_zib.js|s/^  anim: function (t, p, time, M) {/  anim: function (t, p, time, M) { return;/|Zib floats stock still, moving or not
creatures/alien_tetra.js|s/var breathe = sl \* (0.05 + 0.014 \* Math.sin(time \* 1.3))/var breathe = sl * 0.05/|Tetra stops breathing in its sleep
creatures/cat.js|s/id: "cat", label: "Cat"/id: "alien_cat", label: "Cat"/|an animal takes the alien_ prefix
config.js|s#!/^sensor#!/^[a-z_]*#|a timetable from any domain is accepted
config.js|s/if (owner) { if (!owner\[k\]) owner\[k\]/if (owner) { if (false) owner[k]/|v1.1.0 school sensors are not copied onto their owner
config.js|s/      warnOnce("sensors." + k/      void ("sensors." + k/|a missing schoolWho owner does not warn
extras.js|s/if (until != null \&\& t >= until)/if (false)/|an announcement never expires
extras.js|s/list.indexOf(n\[1\].trim().toLowerCase()) >= 0)/list.indexOf(n[1].trim().toLowerCase()) >= -1)/|any word before a colon reads as who it is from
extras.js|s/raw === "unknown"/raw === "nope"/|an unknown announcement shows the word unknown
extras.js|s/return { status: "unavailable", reason: why, items: \[\], bad: 0 };/return { status: "ok", reason: why, items: [], bad: 0 };/|a missing due sensor reads as nothing due
extras.js|s/\(if (!label .. !at) {\) bad++; return; }/\1 return; }/|due items that do not parse vanish silently
extras.js|s/return a.sort - b.sort/return b.sort - a.sort/|due items sort latest first
extras.js|s/it.kind === "today" .. it.sort <= cap/true/|the row in the sky shows items days away
extras.js|s/if (it.at <= t) {/if (it.at < t - 1e12) {/|an overdue item reads as due later
extras.js|s/if (v >= th.from) color = th.color;/if (v > th.from) color = th.color;/|a value on a threshold does not take its colour
extras.js|s/door ? (on ? "open" : "closed")/door ? (on ? "on" : "off")/|a door reads on and off
extras.js|s/ .. s === "unknown"//|an unknown tile shows the word unknown
extras.js|s/if (v.length > MAX_TILES)/if (v.length > 9)/|five tiles are accepted
extras.js|s/domain === "binary_sensor" ? "door"/domain === "binary_sensor" ? "flask"/|a binary sensor tile gets the wrong default icon
extras.js|s/Math.max(0, Math.min(1, (v - tile.min)/Math.max(0, Math.min(9, (v - tile.min)/|a tile's level runs past full
extras.js|s/return s.from + " " + /return s.from + ":" + /|the editor's threshold text changes shape
config.js|s/out.due = normDue(raw);/out.due = normDue(raw) ? normDue(raw) : { entity: "sensor.due", attribute: "items" };/|a v1.5.1 config grows a due row
EOF
echo "ok: all $n sabotaged copies failed the check"
