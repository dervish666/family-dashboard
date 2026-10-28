#!/bin/sh
# Renders the panel pages on this machine and writes PNGs: the real LVGL
# pages, drawn by ESPHome's host platform into a headless SDL surface, fed
# with made-up Home Assistant states. Nothing is flashed.
#
#   sh tests/panels/host/render.sh [out dir] [kitchen|kid|all]
#   ESPHOME=/path/to/esphome sh tests/panels/host/render.sh /tmp/shots
#
# Needs SDL2 on the machine (brew install sdl2, or sdl2-compat) and a C++
# compiler; ESPHome builds the host binary with PlatformIO's native platform.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out=${1:-"$here/shots"}
which=${2:-all}
esphome=${ESPHOME:-esphome}
mkdir -p "$out"
sh "$here/../fake-secrets.sh" "$here"
for target in kitchen kid; do
  [ "$which" = all ] || [ "$which" = "$target" ] || continue
  echo "== $target"
  ESPHOME_SNAPSHOT_DIR="$out" "$esphome" run --no-logs "$here/$target.yaml" 2>&1 | grep -v '^INFO\|^Processing\|^Compiling\|^Linking\|^Building\|^Checking' | tail -20 || true
done
# BMP to PNG, sips on macOS and ImageMagick elsewhere.
for f in "$out"/*.bmp; do
  [ -f "$f" ] || continue
  png="${f%.bmp}.png"
  if command -v sips > /dev/null; then sips -s format png "$f" --out "$png" > /dev/null
  elif command -v magick > /dev/null; then magick "$f" "$png"
  elif command -v convert > /dev/null; then convert "$f" "$png"
  else continue; fi
  rm "$f"
done
ls "$out"
