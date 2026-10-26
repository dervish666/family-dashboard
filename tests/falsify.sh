#!/bin/sh
# Proves tests/check.mjs can fail: break the card in two known ways on a temp copy and
# expect the check to exit non-zero each time. Exits 1 if a broken copy passes.
set -u
here=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
node "$here/tests/check.mjs" "$here/dist/family-dashboard.js" >/dev/null || { echo "check fails on the real file"; exit 1; }
for break in 's/at: allDay ? "" : s.slice(11, 16)/at: allDay ? "" : s.slice(11, 15)/' \
             's/if (calendarMode) {/if (false) {/'; do
  sed "$break" "$here/dist/family-dashboard.js" > "$tmp/fd.js"
  cmp -s "$tmp/fd.js" "$here/dist/family-dashboard.js" && { echo "sabotage did not apply: $break"; exit 1; }
  if node "$here/tests/check.mjs" "$tmp/fd.js" >/dev/null 2>&1; then echo "broken copy passed: $break"; exit 1; fi
done
echo "ok: both sabotaged copies failed the check"
