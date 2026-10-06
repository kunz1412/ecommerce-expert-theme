#!/usr/bin/env bash
# Importiert einen SQL-Dump aus backups/ und ersetzt optional die URL (z. B. beim Umzug auf den VPS).
# Nutzung: scripts/db-import.sh backups/db.sql [alte-url neue-url]
#   scripts/db-import.sh backups/db.sql http://localhost:8080 https://ecommerce-expert.de
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -ge 1 ] || { echo "Nutzung: $0 <datei.sql> [alte-url neue-url]" >&2; exit 1; }
file="/backups/$(basename "$1")"
[ -f "backups/$(basename "$1")" ] || { echo "Datei backups/$(basename "$1") nicht gefunden." >&2; exit 1; }
docker compose run --rm -T wpcli wp db import "$file"
if [ $# -ge 3 ]; then
  docker compose run --rm -T wpcli wp search-replace "$2" "$3" --all-tables --skip-columns=guid
fi
docker compose run --rm -T wpcli wp cache flush >/dev/null 2>&1 || true
echo "Import abgeschlossen."
