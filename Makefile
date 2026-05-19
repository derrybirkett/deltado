# Makefile installed by Delta — targets run from repo root
.PHONY: run-product run-developer run-cycle docker-build docker-cycle

DELTA_SCRIPTS := delta/scripts

run-product:
	@bash $(DELTA_SCRIPTS)/run-product.sh

run-developer:
	@bash $(DELTA_SCRIPTS)/run-developer.sh

run-cycle:
	@bash $(DELTA_SCRIPTS)/run-cycle.sh

docker-build:
	@docker compose -f delta/docker/compose.yml build

docker-cycle:
	@docker compose -f delta/docker/compose.yml run --rm delta
