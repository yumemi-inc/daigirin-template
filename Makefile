# Environment variable

MAKEFILE_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
MAKEFILE_PATH := $(MAKEFILE_DIR)/Makefile
DOCKER_COMPOSE_PATH := $(MAKEFILE_DIR)/docker-compose.yml
BOOK_DIR := $(MAKEFILE_DIR)/book
OUTPUT_DIR := $(BOOK_DIR)/output
BOOK_PATH := $(OUTPUT_DIR)/ebook.pdf

export TEXT_LINT_IMAGE_NAME=textlint
export TEXT_LINT_IMAGE_TAG=latest

## https://github.com/vivliostyle/vivliostyle-cli/pkgs/container/cli
VIVLIOSTYLE_CLI_IMAGE_NAME := ghcr.io/vivliostyle/cli
VIVLIOSTYLE_CLI_IMAGE_TAG := 8.9.1

ALL_DOCKER_IMAGES := $(TEXT_LINT_IMAGE_NAME) $(VIVLIOSTYLE_CLI_IMAGE_NAME)

DOCKER = \
	@$(MAKE) prepare_docker; \
	$(shell command -v docker)

DOCKER_COMPOSE = \
	@$(MAKE) prepare_docker; \
	$(shell command -v docker-compose -f $(DOCKER_COMPOSE_PATH))

VIVLIOSTYLE_CLI = $(DOCKER) run \
	--rm \
	-v $(BOOK_DIR):/local \
	-w /local \
	$(VIVLIOSTYLE_CLI_IMAGE_NAME):$(VIVLIOSTYLE_CLI_IMAGE_TAG) \

# Commands

default: help

.PHONY: help
help:
	@## コマンド名とその直前のコメント行が出力されます。
	@## @see https://stackoverflow.com/a/35730928
	@awk '/^#/{c=substr($$0,3);next}c&&/^[[:alpha:]][[:alnum:]_-]+:/{print substr($$1,1,index($$1,":")),c}1{c=0}' $(MAKEFILE_LIST) | column -s: -t

.PHONY: run
## pdfを生成して開く
run: \
	pdf \
	open

.PHONY: lint
## textlintを実行
lint:
	$(DOCKER_COMPOSE) run --rm lint

.PHONY: pdf
## pdfを生成
pdf:
	$(VIVLIOSTYLE_CLI) build \
		--no-sandbox

.PHONY: pdf_press
## プレス版のpdfを生成
pdf_press:
	$(VIVLIOSTYLE_CLI) build \
		--no-sandbox \
		--press-ready \
		--preflight-option gray-scale \
		--style ./theme/theme-press.css \
		--output ./output/press.pdf

.PHONY: open
## pdfを開く
open:
	open $(BOOK_PATH)

.PHONY: clean
## 生成ファイルをすべて削除
clean: \
	clean_pdf \
	clean_docker

.PHONY: clean_pdf
## pdf関係の生成物を削除
clean_pdf:
	rm -rf $(OUTPUT_DIR)

.PHONY: clean_docker
## Docker関係の生成物を削除
clean_docker:
	rm -rf node_modules
	@for IMAGE in $(ALL_DOCKER_IMAGES) ; do \
		IMAGE_IDS=$$(docker images -q $$IMAGE); \
		if [ ! -z "$$IMAGE_IDS" ]; then \
			echo "Removing Docker image $$IMAGE"; \
			docker rmi $$IMAGE_IDS; \
		else \
			echo "Docker image $$IMAGE does not exist"; \
		fi; \
	done

# Internal Commands

.PHONY: install_brew
install_brew:
	@if ! command -v brew >/dev/null 2>&1; then \
		/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; \
	fi

.PHONY: install_docker
install_docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		brew install docker; \
	fi

.PHONY: install_docker-compose
install_docker-compose:
	@if ! command -v docker-compose >/dev/null 2>&1; then \
		brew install docker-compose; \
	fi

.PHONY: install_colima
install_colima:
	@if ! command -v colima >/dev/null 2>&1; then \
		brew install colima; \
	fi

.PHONY: start_colima
start_colima:
	@if [ $$(colima status 2>&1 | grep -c "not running") -eq 1 ]; then \
		colima start; \
	fi

.PHONY: prepare_docker
prepare_docker: \
	install_brew \
	install_docker \
	install_docker-compose \
	install_colima \
	start_colima
