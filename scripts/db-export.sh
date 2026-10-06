#!/usr/bin/env bash
# Exportiert die Datenbank nach backups/ (Standard: backups/db-<Zeitstempel>.sql).
# Nutzung: scripts/db-export.sh [dateiname.sql]
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-db-$(date +%Y%m%d-%H%M%S).sql}"
docker compose run --rm -T wpcli wp db export "/backups/$(basename "$name")" --add-drop-table
echo "Export: backups/$(basename "$name")"
