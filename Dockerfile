# syntax=docker/dockerfile:1

# Builds the proxy in Go
FROM golang:1.22 AS proxy-build
ENV CGO_ENABLED=0
ENV GOCACHE=/cache/go
ENV GOMODCACHE=/cache/gomod
WORKDIR /app
COPY proxy/go.mod proxy/go.sum ./
RUN --mount=type=cache,target=/cache go mod download
COPY proxy/* ./
RUN --mount=type=cache,target=/cache go build -o /usr/bin/immich-proxy .

FROM scratch AS proxy
COPY --from=proxy-build /usr/bin/immich-proxy /immich-proxy

# Generates the OpenAPI SDK from the specification
FROM node:22.10.0-alpine3.20@sha256:fc95a044b87e95507c60c1f8c829e5d98ddf46401034932499db370c494ef0ff AS openapi-gen-build
WORKDIR /usr/src/open-api
COPY open-api/typescript-sdk/package*.json open-api/typescript-sdk/tsconfig*.json ./typescript-sdk/
RUN npm --prefix typescript-sdk ci
COPY open-api/ ./
RUN npx --yes oazapfts --optimistic --argumentStyle=object --useEnumType immich-openapi-specs.json ./typescript-sdk/src/fetch-client.ts
RUN npm --prefix typescript-sdk run build
FROM scratch AS openapi-gen
COPY --from=openapi-gen-build /usr/src/open-api/typescript-sdk/ /

# Builds immich's web UI
FROM node:22.10.0-alpine3.20@sha256:fc95a044b87e95507c60c1f8c829e5d98ddf46401034932499db370c494ef0ff AS web
WORKDIR /usr/src/app
COPY web/package*.json web/svelte.config.js ./
RUN npm ci
COPY --link --from=openapi-gen-build /usr/src/open-api/typescript-sdk /usr/src/open-api/typescript-sdk
COPY web ./
COPY i18n ../i18n
RUN npm run build

# Integrates everything into the final image
FROM alpine:latest
COPY --link --from=proxy-build /app/entrypoint.sh /usr/bin/entrypoint.sh
COPY --link --from=proxy-build /usr/bin/immich-proxy /usr/bin/immich-proxy
COPY --link --from=web /usr/src/app/build /srv
COPY --link open-api/immich-openapi-specs.json /openapi/immich-openapi-specs.json
ENTRYPOINT ["/usr/bin/entrypoint.sh"]
