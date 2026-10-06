#!/usr/bin/env bash
# Prüft, dass eine Staging-Instanz geschützt und nicht indexierbar ist.
# Nutzung: BASIC_AUTH_USER=… BASIC_AUTH_PASS=… [CURL_OPTS=-k] scripts/check-staging.sh https://staging.ecommerce-expert.de
set -uo pipefail

URL="${1:?Nutzung: $0 <https://staging-url>}"
URL="${URL%/}"
USER_="${BASIC_AUTH_USER:?BASIC_AUTH_USER setzen}"
PASS_="${BASIC_AUTH_PASS:?BASIC_AUTH_PASS setzen}"
# shellcheck disable=SC2206
OPTS=(-sS --max-time 20 ${CURL_OPTS:-})
fail=0

ok()  { printf '  ✓ %s\n' "$1"; }
bad() { printf '  ✗ %s\n' "$1"; fail=1; }
code() { curl "${OPTS[@]}" -o /dev/null -w '%{http_code}' "$@"; }

echo "Prüfe $URL"

[ "$(code "$URL/")" = "401" ]                         && ok "Startseite ohne Login → 401" || bad "Startseite ohne Login ist NICHT geschützt"
[ "$(code "$URL/wp-login.php")" = "401" ]             && ok "wp-login.php ohne Login → 401" || bad "wp-login.php ohne Login ist NICHT geschützt"
[ "$(code "$URL/wp-json/")" = "401" ]                 && ok "REST-API ohne Login → 401" || bad "REST-API ohne Login ist NICHT geschützt"
[ "$(code "$URL/wp-content/themes/ecommerce-expert/style.css")" = "401" ] && ok "Theme-Dateien ohne Login → 401" || bad "Theme-Dateien ohne Login erreichbar"
[ "$(code -u "$USER_:falsch" "$URL/")" = "401" ]      && ok "falsches Passwort → 401" || bad "falsches Passwort wird akzeptiert"
[ "$(code -u "$USER_:$PASS_" "$URL/")" = "200" ]      && ok "mit Login → 200" || bad "mit Login nicht erreichbar"

hdr="$(curl "${OPTS[@]}" -I -u "$USER_:$PASS_" "$URL/" | tr -d '\r')"
grep -qi '^x-robots-tag:.*noindex' <<<"$hdr" && ok "Header X-Robots-Tag: noindex" || bad "X-Robots-Tag noindex fehlt"
grep -qi '^strict-transport-security:' <<<"$hdr" && ok "HSTS gesetzt" || bad "HSTS fehlt"

robots="$(curl "${OPTS[@]}" "$URL/robots.txt")"
grep -q 'Disallow: /' <<<"$robots" && ok "robots.txt: Disallow: / (ohne Login lesbar)" || bad "robots.txt ohne 'Disallow: /'"

html="$(curl "${OPTS[@]}" -u "$USER_:$PASS_" "$URL/")"
grep -qi '<meta name=.robots. content=.*noindex' <<<"$html" && ok "HTML: <meta name=robots noindex>" || bad "HTML ohne meta robots noindex"
grep -qi 'hreflang\|rel=.canonical' <<<"$html" && echo "  ℹ canonical/hreflang vorhanden (unkritisch, da noindex)"

[ "$fail" = 0 ] && echo "Alles in Ordnung." || { echo "FEHLER: Staging ist nicht korrekt geschützt." >&2; exit 1; }
