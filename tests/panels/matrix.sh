#!/bin/sh
# Validates every board x profile pair of the room panel packages with
# `esphome config`, using throwaway secrets. Nothing is flashed or uploaded.
#
#   sh tests/panels/matrix.sh                 config check, all nine pairs
#   ESPHOME=/path/to/esphome sh tests/panels/matrix.sh
#
# Writes one small device file per pair into a temp directory that points at
# the packages in this checkout, so it checks the files as they are on disk.
set -u
here=$(cd "$(dirname "$0")/../.." && pwd)
esphome=${ESPHOME:-esphome}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

sh "$here/tests/panels/fake-secrets.sh" "$work"

fail=0
printf '%-22s %-9s %s\n' board profile result
for board in "$here"/esphome/boards/*.yaml; do
  b=$(basename "$board" .yaml)
  for profile in "$here"/esphome/profiles/*.yaml; do
    p=$(basename "$profile" .yaml)
    dev="$work/$b-$p.yaml"
    node=$(printf '%s-%s' "$b" "$p" | tr '_' '-')
    cat > "$dev" <<EOF
substitutions:
  name: $node
  friendly_name: Matrix $b $p
  child: kid_a
  api_key: !secret panel_kid_a_api_key
packages:
  base: !include $here/esphome/packages/base.yaml
  board: !include $board
  profile: !include $profile
EOF
    if "$esphome" config "$dev" > "$work/$b-$p.log" 2>&1; then
      printf '%-22s %-9s %s\n' "$b" "$p" ok
    else
      printf '%-22s %-9s %s\n' "$b" "$p" FAIL
      sed -n '1,200p' "$work/$b-$p.log" | grep -v '^INFO' | tail -40
      fail=1
    fi
  done
done
exit $fail
