#!/bin/sh

upstream=$IMMICH_SERVER_URL
host=$IMMICH_HOST

exec /usr/bin/immich-proxy \
  -listen-addr 0.0.0.0:8080 \
  -web-dir /srv \
  -openapi-spec-file /openapi/immich-openapi-specs.json \
  -upstream "$upstream" \
  -host "$host" \
  $@
