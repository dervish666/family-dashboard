#!/bin/sh
# Validates every board x profile pair of the room panel packages with
# `esphome config`, using throwaway secrets. Nothing is flashed or uploaded.
#
#   sh tests/panels/matrix.sh                 config check, every pair
#   ESPHOME=/path/to/esphome sh tests/panels/matrix.sh
#
# Writes one small device file per pair into a temp directory that points at
# the packages in this checkout, so it checks the files as they are on disk.
# Besides the three profiles alone, it checks the kitchen with its add-ons:
# light tiles on every board, and the timers on the one board with a speaker
# (timers.yaml needs its rtttl player).
set -u
here=$(cd "$(dirname "$0")/../.." && pwd)
esphome=${ESPHOME:-esphome}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

sh "$here/tests/panels/fake-secrets.sh" "$work"

fail=0
# check <board file> <label> <profile file> [extra package files...]
check() {
  board=$1; label=$2; profile=$3; shift 3
  b=$(basename "$board" .yaml)
  dev="$work/$b-$label.yaml"
  node=$(printf '%s-%s' "$b" "$label" | tr '_+' '--')
  {
    printf 'substitutions:\n  name: %s\n  friendly_name: Matrix %s %s\n' "$node" "$b" "$label"
    printf '  child: kid_a\n  api_key: !secret panel_kid_a_api_key\n  garden_art: %s\n' "$here/esphome/art"
    printf 'packages:\n  base: !include %s\n  board: !include %s\n  profile: !include %s\n' \
      "$here/esphome/packages/base.yaml" "$board" "$profile"
    n=0
    for extra in "$@"; do
      n=$((n + 1))
      printf '  extra%d: !include %s\n' "$n" "$extra"
    done
  } > "$dev"
  if "$esphome" config "$dev" > "$work/$b-$label.log" 2>&1; then
    printf '%-22s %-22s %s\n' "$b" "$label" ok
  else
    printf '%-22s %-22s %s\n' "$b" "$label" FAIL
    sed -n '1,200p' "$work/$b-$label.log" | grep -v '^INFO' | tail -40
    fail=1
  fi
}

printf '%-22s %-22s %s\n' board profile result
for board in "$here"/esphome/boards/*.yaml; do
  for profile in "$here"/esphome/profiles/*.yaml; do
    check "$board" "$(basename "$profile" .yaml)" "$profile"
  done
  check "$board" kit-lights "$here/esphome/profiles/kitchen.yaml" "$here/esphome/packages/light_tiles.yaml"
  check "$board" kid-lamps "$here/esphome/profiles/kid.yaml" "$here/esphome/packages/lamp_pills.yaml"
done
check "$here/esphome/boards/esp32_2432s028.yaml" kid-all \
  "$here/esphome/profiles/kid.yaml" "$here/esphome/packages/lamp_pills.yaml" "$here/esphome/packages/garden.yaml"
check "$here/esphome/boards/jc2432w328.yaml" kid-garden "$here/esphome/profiles/kid.yaml" "$here/esphome/packages/garden.yaml"
check "$here/esphome/boards/guition_jc3248w535.yaml" kit-all \
  "$here/esphome/profiles/kitchen.yaml" "$here/esphome/packages/timers.yaml" "$here/esphome/packages/light_tiles.yaml"
exit $fail
