.PHONY: up down setup reset wp test lint e2e db-export db-import

up: ## Container starten
	docker compose up -d

down: ## Container stoppen (Daten bleiben)
	docker compose down

setup: up ## WordPress per WP-CLI einrichten (idempotent)
	./scripts/setup.sh

reset: ## ACHTUNG: löscht Datenbank und WordPress-Volume
	docker compose down -v

wp: ## WP-CLI: make wp ARGS="plugin list"
	docker compose run --rm -T wpcli wp $(ARGS)

lint: ## theme.json-Schema + PHPCS
	npm run lint

e2e test: ## Playwright-Tests gegen die lokale Instanz
	npx playwright test

db-export: ## Datenbank nach backups/ exportieren
	./scripts/db-export.sh

db-import: ## Datenbank importieren: make db-import FILE=backups/x.sql
	./scripts/db-import.sh $(FILE)
