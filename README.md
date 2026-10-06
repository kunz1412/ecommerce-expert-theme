# ecommerce-expert.de

Business-Website von Daniel Kunz (E-Commerce-Entwickler) als **WordPress-Block-Theme**
(Child-Theme von Twenty Twenty-Five). One Pager auf Deutsch, nur Core-Blöcke, keine Page-Builder,
keine Drittanbieter-Requests, keine Cookies.

- **Design-Referenz:** [`design/reference.html`](design/reference.html) (verbindlich), Porträt: `design/portrait.jpg`
- **Theme:** [`theme/ecommerce-expert/`](theme/ecommerce-expert) – das Einzige, was versioniert wird
  (kein WordPress-Core, keine Uploads)

## Voraussetzungen

| Werkzeug | Version | Wofür |
|---|---|---|
| Docker + Docker Compose | aktuell | lokales WordPress (MariaDB, Apache/PHP 8.3, WP-CLI) |
| Node.js | 22 | Playwright-Tests, commitlint, Husky |
| Composer + PHP | PHP ≥ 8.1 | PHPCS (nur Linting, kein Laufzeit-Code) |
| Git | aktuell | Workflow siehe unten |

## Start

```bash
cp .env.example .env        # Passwörter anpassen
npm install                 # installiert auch die Git-Hooks (Husky)
composer install            # PHPCS + WordPress Coding Standards
make setup                  # = docker compose up -d + scripts/setup.sh
```

Danach: <http://localhost:8080> · Backend: <http://localhost:8080/wp-admin> (Zugang aus `.env`).

`scripts/setup.sh` ist **idempotent** und kann beliebig oft laufen. Es installiert per WP-CLI WordPress,
aktiviert `de_DE`, setzt Permalinks auf `/%postname%/`, aktiviert das Theme, installiert **Contact Form 7**
und **Create Block Theme**, legt das Formular „Kontakt“ an und erstellt die Entwurfsseiten
„Impressum“, „Datenschutz“ und „Barrierefreiheit“ mit Platzhaltertext.

> Die Rechtstexte-Seiten bleiben **Entwürfe** (Besucher sehen 404, solange sie nicht veröffentlicht sind).
> Die Footer-Links zeigen bereits auf `/impressum/`, `/datenschutz/` und `/barrierefreiheit/`.

Nützliche Befehle:

```bash
make up | down              # Container starten/stoppen
make wp ARGS="plugin list"  # WP-CLI
make reset                  # ACHTUNG: löscht Datenbank und WordPress-Volume
make db-export              # → backups/db-<Zeitstempel>.sql
make db-import FILE=backups/db.sql
```

Hinweis: In `.env` kann das MariaDB-Image über `DB_IMAGE_TAG` gewählt werden (Standard: `11`, lokal z. B. `lts`).
Lokal läuft WordPress mit `WP_DEVELOPMENT_MODE=theme`, damit Pattern-Änderungen sofort sichtbar sind.

## Tests und Qualität

```bash
npx playwright test             # alle E2E-Tests (Desktop 1440 px + Mobil 390 px), WordPress muss laufen
npx playwright test --project=mobile
npm run lint                    # theme.json-Schema + PHPCS
npm run screenshots             # Screenshots (1440/390 px) nach screenshots/
```

| Test | Datei |
|---|---|
| Alle Sektionen rendern, Überschriften-Hierarchie, Platzhalter, Tabelle, FAQ | `tests/e2e/sections.spec.ts` |
| Anker-Links, sticky Header, Smooth Scroll | `tests/e2e/anchors.spec.ts` |
| Responsive: 390 px ohne horizontales Scrollen, Navigation, Breakpoints 960/600 | `tests/e2e/responsive.spec.ts` |
| Formular verlangt Einwilligung, Pflichtfelder, Meldungen | `tests/e2e/form.spec.ts` |
| **Honeypot** (`wpcf7_spam`): befülltes Feld → Spam | `tests/e2e/form.spec.ts` |
| **DSGVO:** keine Requests an externe Domains, lokale Fonts, keine Cookies | `tests/e2e/privacy.spec.ts` |
| **Barrierefreiheit:** axe (WCAG 2.1 A/AA, keine „serious/critical“-Verstöße) | `tests/e2e/a11y.spec.ts` |
| PHPCS (WordPress Coding Standards), theme.json gegen das offizielle Schema | `phpcs.xml.dist`, `scripts/validate-theme-json.mjs` |

CI (`.github/workflows/ci.yml`): Lint-Job (commitlint auf PR-Commits, theme.json, PHPCS) und E2E-Job
(WordPress per Docker Compose + `scripts/setup.sh`, dann Playwright; Report als Artefakt).

## Git-Workflow und Releases

- `main` ist nur die Basis; gearbeitet wird auf Feature-Branches (`feat/…`, `fix/…`, `docs/…`).
- **Conventional Commits** werden per commitlint + Husky erzwungen (`feat: …`, `fix: …`, `chore: …`).
- Der `pre-commit`-Hook prüft `theme.json` und PHPCS.
- **release-please** (`.github/workflows/release-please.yml`) erzeugt aus den Commits einen Release-PR mit
  Changelog und hebt die Version in `package.json` **und im `style.css`-Header** an
  (Marker `x-release-please-start-version … end`, nicht entfernen).

## Theme-Workflow

```
theme/ecommerce-expert/
├── style.css            Theme-Header (Template: twentytwentyfive) + Komponenten-CSS
├── theme.json           version 3: Palette, Schriften (lokal), Größen, Abstände, Element-Styles
├── functions.php        Pattern-Kategorie, Button-Varianten, DSGVO-Bereinigung, CF7-Honeypot, A11y-Helfer
├── assets/fonts/        Schibsted Grotesk + JetBrains Mono (woff2, aus Fontsource)
├── assets/images/       portrait.jpg
├── parts/               header.html, footer.html
├── templates/           front-page.html (setzt die Patterns zusammen), page, index, 404
└── patterns/            ein Pattern je Sektion (Kategorie „ecommerce-expert“)
```

**Änderungen im Site Editor zurück ins Theme holen:**
1. Im Backend unter *Design → Editor* Vorlagen, Template-Teile oder Stile anpassen.
2. Im Editor oben rechts *Create Block Theme* öffnen → **„Änderungen im Theme speichern“**.
   Das Plugin schreibt die Änderungen in das gebundene Theme-Verzeichnis `theme/ecommerce-expert/`
   (der Ordner ist als Bind-Mount eingehängt).
3. `git diff` prüfen, mit Conventional Commit committen.

> Unter Linux muss der Webserver-Benutzer (UID 33) in `theme/ecommerce-expert/` schreiben dürfen
> (`chmod -R a+w theme/ecommerce-expert` lokal). Unter Docker Desktop (macOS) ist das nicht nötig.

Neue Schriften: Pakete in `package.json` ergänzen, `scripts/copy-fonts.mjs` anpassen, `npm run fonts`, die woff2 committen
und in `theme.json` unter `fontFace` eintragen.

### Entscheidungen

- **Contact Form 7** statt Fluent Forms: reines Formular-Plugin ohne Drittanbieter-Requests, Markup frei definierbar
  (idempotent per WP-CLI), Einwilligung via `[acceptance]`. Das Plugin-CSS ist abgeschaltet, Styling liegt im Theme.
  reCAPTCHA ist nicht eingerichtet; Spam-Schutz: Honeypot-Feld `website` (`wpcf7_spam` in `functions.php`).
- **Inline-SVG-Icons** liegen als Custom-HTML-Block (`aria-hidden="true"`, `focusable="false"`, `stroke="currentColor"`).
  Das ist die einzige Verwendung des Blocks; Layout besteht aus Group/Columns-ähnlichen Core-Blöcken.
- **Anker-Links** sind als `/#abschnitt` gesetzt, damit sie auch von Unterseiten (Impressum …) funktionieren.
- **Formularmeldungen:** Die Standardmeldung von Contact Form 7 erscheint unter dem Formular (Erfolg: Haken-Icon und
  durchgezogener Rahmen, Fehler: Warn-Icon, gestrichelter Rahmen und Text – nicht nur Farbe).

## Deployment auf einen VPS (Docker Compose + Caddy)

Voraussetzungen: VPS in der EU mit Docker, DNS-A/AAAA-Eintrag für `ecommerce-expert.de` (und `www`), Ports 80/443 offen.

```bash
# 1. Code auf den Server
git clone <repo-url> /srv/ecommerce-expert && cd /srv/ecommerce-expert

# 2. Konfiguration
cp deploy/.env.example deploy/.env      # Domain, ACME-E-Mail, Passwörter eintragen

# 3. Starten (Caddy holt automatisch Let's-Encrypt-Zertifikate)
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d

# 4a. Neue Installation per WP-CLI (Alias für den Prod-Stack) …
export COMPOSE_FILE=deploy/docker-compose.yml COMPOSE_ENV_FILES=deploy/.env
alias wpc='docker compose run --rm -T wpcli wp'
wpc core install --url=https://ecommerce-expert.de --title="ecommerce-expert.de" \
    --admin_user=<name> --admin_password=<passwort> --admin_email=<mail> --skip-email
wpc language core install de_DE --activate
wpc rewrite structure '/%postname%/'
wpc theme activate ecommerce-expert
wpc plugin install contact-form-7 --activate
wpc language plugin install contact-form-7 de_DE
docker compose run --rm -T -e CONTACT_MAIL_TO=<empfaenger> wpcli wp eval-file /scripts/wp/create-contact-form.php
wpc option update blog_public 1         # Suchmaschinen erlauben, sobald Rechtstexte stehen

# 4b. … oder Umzug der lokalen Instanz
make db-export                                   # lokal: → backups/db-….sql, per scp auf den Server kopieren
# auf dem Server (COMPOSE_FILE/COMPOSE_ENV_FILES wie oben gesetzt):
./scripts/db-import.sh backups/db-….sql http://localhost:8080 https://ecommerce-expert.de
```

Die Skripte `scripts/db-export.sh` und `scripts/db-import.sh` nutzen `docker compose` und funktionieren dadurch
mit beiden Stacks – gesteuert über `COMPOSE_FILE` und `COMPOSE_ENV_FILES`. Der zweite und dritte Parameter von
`db-import.sh` ersetzt die URL (`wp search-replace`). Uploads (`wp-content/uploads`) liegen im Volume `wordpress`
und müssen beim Umzug separat kopiert werden.

Updates: `git pull && docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d`.
Das Theme ist read-only eingehängt – Änderungen laufen immer über Git, nicht über den Server.
Backups: `wpc db export /backups/db-$(date +%F).sql` per Cron, dazu das Volume `wordpress` (Uploads) sichern.

**Vor dem Go-live prüfen:** Mailversand (SMTP-Plugin oder Relay, sonst landet das Formular nicht im Postfach),
Rechtstexte (Impressum, Datenschutz, Barrierefreiheit) veröffentlichen, alle Platzhalter ersetzen
(siehe unten), Tests gegen die Live-URL: `WP_URL=https://ecommerce-expert.de npx playwright test`.

## Offene Platzhalter

`[PREIS]` (Pakete Website und Webshop), `[ANZAHL]` (Seiten, Artikel), `[E-MAIL]` (Kontakt-Link),
`[ZEITRAUM]` (Antwortzeit im Kontaktabschnitt), `[BUDGET-STUFE 1–3]` (Formular-Auswahl) sowie die
Platzhaltertexte der drei Rechtstexte-Seiten. Sie stehen in `theme/ecommerce-expert/patterns/*.php`
bzw. `scripts/wp/contact-form.txt` und lassen sich auch im Site Editor ändern.
