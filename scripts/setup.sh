#!/usr/bin/env bash
# Richtet die lokale WordPress-Instanz per WP-CLI ein. Idempotent: beliebig oft ausführbar.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Keine .env gefunden – bitte 'cp .env.example .env' ausführen." >&2; exit 1; }
set -a; . ./.env; set +a

WP_URL="${WP_URL:-http://localhost:8080}"
THEME="ecommerce-expert"

wp() { docker compose run --rm -T wpcli wp "$@"; }
log() { printf '\n==> %s\n' "$*"; }

log "Container starten"
docker compose up -d --wait db wordpress 2>/dev/null || docker compose up -d db wordpress

log "Warten auf wp-config.php und Datenbank"
for i in $(seq 1 60); do
  if docker compose exec -T wordpress test -f /var/www/html/wp-config.php 2>/dev/null \
     && wp db check >/dev/null 2>&1; then break; fi
  [ "$i" = 60 ] && { echo "WordPress/DB nicht erreichbar." >&2; exit 1; }
  sleep 2
done

if ! wp core is-installed >/dev/null 2>&1; then
  log "WordPress installieren"
  wp core install --url="$WP_URL" --title="${WP_TITLE:-ecommerce-expert.de}" \
    --admin_user="${WP_ADMIN_USER:-admin}" --admin_password="${WP_ADMIN_PASSWORD:?WP_ADMIN_PASSWORD fehlt}" \
    --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" --skip-email
else
  log "WordPress ist bereits installiert"
fi

log "Sprache de_DE, Zeitzone, Titel"
wp language core install de_DE --activate
wp option update timezone_string "Europe/Berlin"
wp option update date_format "d.m.Y"
wp option update time_format "H:i"
wp option update blogdescription "${WP_TAGLINE:-}"
wp option update blog_public 0   # lokal: nicht indexieren (auf dem VPS per Einstellungen > Lesen ändern)

log "Permalinks /%postname%/"
wp rewrite structure '/%postname%/' --hard
wp rewrite flush --hard

log "Theme"
wp theme is-installed twentytwentyfive || wp theme install twentytwentyfive
wp theme activate "$THEME"
wp language theme install twentytwentyfive de_DE >/dev/null 2>&1 || true

log "Beispielinhalte entfernen"
for id in $(wp post list --post_type=post,page --name=hello-world --format=ids 2>/dev/null) \
          $(wp post list --post_type=page --name=sample-page --format=ids 2>/dev/null) \
          $(wp post list --post_type=page --name=beispiel-seite --format=ids 2>/dev/null) \
          $(wp post list --post_type=post --name=hallo-welt --format=ids 2>/dev/null); do
  wp post delete "$id" --force
done
wp comment delete $(wp comment list --format=ids) --force 2>/dev/null || true
wp plugin delete hello akismet 2>/dev/null || true

log "Plugins (Contact Form 7, Create Block Theme)"
for p in contact-form-7 create-block-theme; do
  wp plugin is-installed "$p" || wp plugin install "$p"
  wp plugin activate "$p"
done
wp language plugin install contact-form-7 de_DE >/dev/null 2>&1 || true
wp language plugin install create-block-theme de_DE >/dev/null 2>&1 || true

log "Kontaktformular"
wp eval-file /scripts/wp/create-contact-form.php

log "Rechtliche Seiten (Entwürfe)"
create_draft() { # slug, titel, text
  if [ -z "$(wp post list --post_type=page --post_status=any --name="$1" --format=ids)" ]; then
    wp post create --post_type=page --post_status=draft --post_name="$1" --post_title="$2" \
      --post_content="<!-- wp:paragraph --><p>$3</p><!-- /wp:paragraph -->"
  else
    echo "Seite '$2' existiert bereits."
  fi
}
create_draft impressum "Impressum" "[PLATZHALTER] Impressum nach § 5 DDG – bitte von einem Anwalt oder Rechtstexte-Dienst bereitstellen lassen."
create_draft datenschutz "Datenschutz" "[PLATZHALTER] Datenschutzerklärung – bitte von einem Anwalt oder Rechtstexte-Dienst bereitstellen lassen."
create_draft barrierefreiheit "Barrierefreiheit" "[PLATZHALTER] Erklärung zur Barrierefreiheit – bitte ergänzen."

log "Fertig"
echo "Website:  $WP_URL"
echo "Backend:  $WP_URL/wp-admin  (Benutzer: ${WP_ADMIN_USER:-admin})"
