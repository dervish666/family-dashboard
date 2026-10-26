#!/bin/sh
# Writes throwaway secrets.yaml into the directory given, for config checks
# and CI builds. Every key is random and used once; none is a real secret.
set -eu
dir="$1"
key() { openssl rand -base64 32; }
cat > "$dir/secrets.yaml" <<EOF
wifi_ssid: "ci-test-ssid"
wifi_password: "ci-test-password"
panel_kid_a_api_key: "$(key)"
panel_kid_b_api_key: "$(key)"
panel_kitchen_api_key: "$(key)"
EOF
