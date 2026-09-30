.DEFAULT_GOAL := help

.PHONY: help install build build-chrome build-all clean clean-all

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies using npm ci in src/
	npm --prefix src ci

build: install ## Build the Firefox / default WebExtension (MV2)
	npm --prefix src run build

build-chrome: install ## Build the Chrome Manifest V3 extension (zip and unpacked)
	npm --prefix src run build:chrome

build-all: build build-chrome ## Build all extensions (default/Firefox and Chrome MV3)

clean: ## Remove build artifact directories
	rm -rf src/web-ext-artifacts web-ext-artifacts

clean-all: clean ## Remove build artifacts and node_modules
	rm -rf src/node_modules
