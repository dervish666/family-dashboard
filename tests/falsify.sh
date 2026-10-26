#!/bin/sh
# Proves tests/check.mjs can fail. Breaks the card in known ways on temp copies and expects
# the check to exit non-zero each time: two breaks in the built file (calendar parsing,
# calendar mode), then the source ones below, each rebuilt with esbuild (creature and scene
# registries, the school timetable and lunch parsers). Exits 1
# if any broken copy passes. Needs npm ci first.
set -u
here=$(cd "$(dirname "$0")/.." && pwd)
esbuild="$here/node_modules/.bin/esbuild"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
node "$here/tests/check.mjs" "$here/dist/family-dashboard.js" "$here/src" >/dev/null || { echo "check fails on the real files"; exit 1; }
n=0

for break in 's/at: allDay ? "" : s.slice(11, 16)/at: allDay ? "" : s.slice(11, 15)/' \
             's/if (calendarMode) {/if (false) {/'; do
  sed "$break" "$here/dist/family-dashboard.js" > "$tmp/fd.js"
  cmp -s "$tmp/fd.js" "$here/dist/family-dashboard.js" && { echo "sabotage did not apply: $break"; exit 1; }
  if node "$here/tests/check.mjs" "$tmp/fd.js" "$here/src" >/dev/null 2>&1; then echo "broken copy passed: $break"; exit 1; fi
  n=$((n + 1))
done

# file | sed expression | what it breaks. A file that does not exist yet is created from
# hedgehog.js, so the sabotage is a new module.
while IFS='|' read -r f expr what; do
  rm -rf "$tmp/src"; cp -R "$here/src" "$tmp/src"
  if [ -f "$tmp/src/$f" ]; then sed "$expr" "$tmp/src/$f" > "$tmp/x.js"; cmp -s "$tmp/x.js" "$tmp/src/$f" && { echo "sabotage did not apply: $what"; exit 1; }
  else sed "$expr" "$tmp/src/creatures/hedgehog.js" > "$tmp/x.js"; fi
  mv "$tmp/x.js" "$tmp/src/$f"
  "$esbuild" "$tmp/src/index.js" --bundle --format=esm --log-level=error --outfile="$tmp/fd.js" || { echo "sabotaged source did not build: $what"; exit 1; }
  if node "$here/tests/check.mjs" "$tmp/fd.js" "$tmp/src" >/dev/null 2>&1; then echo "broken copy passed: $what"; exit 1; fi
  n=$((n + 1))
done <<'EOF'
creatures/fox.js|s/^  anim: function (t, p, time, M) {/  move: function (t, p, time, M) {/|the fox loses anim()
creatures/owl.js|s/id: "hedgehog", label: "Hedgehog"/id: "owl", label: "Owl"/|an owl module nobody registered
scenes/index.js|s/export const SCENE_LIST = \[meadow, seaside\];/export const SCENE_LIST = [meadow];/|the seaside dropped from the registry
scenes/seaside.js|s/    ground: function (ctx, S, WX) {/    floor: function (ctx, S, WX) {/|the seaside loses weather.ground()
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
EOF
echo "ok: all $n sabotaged copies failed the check"
