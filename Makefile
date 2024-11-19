DOCKER_IMAGE ?= tomleb/immich-proxy:latest

build-image:
	docker buildx build --output=type=image,name=$(DOCKER_IMAGE) .

build-proxy:
	docker buildx build --output=type=local,dest=build --target=proxy .

.PHONY: build-image build-proxy open-api
open-api:
	docker buildx build --output=type=local,dest=open-api/typescript-sdk/ --target=openapi-gen .

clean:
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +
