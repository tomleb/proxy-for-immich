#!/usr/bin/env bash
OPENAPI_GENERATOR_VERSION=v7.8.0

# usage: ./bin/generate-open-api.sh

npx --yes oazapfts --optimistic --argumentStyle=object --useEnumType immich-openapi-specs.json typescript-sdk/src/fetch-client.ts
npm --prefix typescript-sdk ci && npm --prefix typescript-sdk run build
