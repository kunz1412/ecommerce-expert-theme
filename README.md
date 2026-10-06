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

Danach: <http://localhost:8080> · Backend: <http://localhost:8080/wp-admin> (Zugang aus `.env`) ·
Mails des Formulars: <http://localhost:8025> (Mailpit, fängt lokal alles ab).

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
npm run test:smoke              # Teilmenge ohne Mail-Test (für Staging/Live, mit BASIC_AUTH_USER/PASS)
npm run screenshots             # Screenshots (1440/390 px) nach screenshots/
node scripts/compare-reference.mjs  # Sektionshöhen: design/reference.html vs. Theme
```

| Test | Datei |
|---|---|
| Alle Sektionen rendern, Überschriften-Hierarchie, Platzhalter, Tabelle, FAQ | `tests/e2e/sections.spec.ts` |
| Anker-Links, sticky Header, Smooth Scroll | `tests/e2e/anchors.spec.ts` |
| Responsive: 390 px ohne horizontales Scrollen, Navigation, Breakpoints 960/600 | `tests/e2e/responsive.spec.ts` |
| Formular verlangt Einwilligung, Pflichtfelder, Meldungen | `tests/e2e/form.spec.ts` |
| **Honeypot** (`wpcf7_spam`): befülltes Feld → Spam | `tests/e2e/form.spec.ts` |
| **Mailversand:** Formular absenden → Mail in Mailpit (Empfänger, From, Reply-To); Honeypot/ohne Einwilligung → keine Mail | `tests/e2e/mail.spec.ts` |
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

## Mailversand (SMTP)

Alle WordPress-Mails (Kontaktformular, Passwort-Reset …) gehen per **SMTP** raus. Das erledigt das Must-Use-Plugin
[`mu-plugins/ecommerce-expert-mail.php`](mu-plugins/ecommerce-expert-mail.php) über den Hook `phpmailer_init` –
ohne SMTP-Plugin. Es gibt **keinen Fallback auf `mail()`**: Ist `SMTP_HOST` leer, wird die Mail verworfen und im
PHP-Log vermerkt. Das Plugin liegt als Bind-Mount in `wp-content/mu-plugins/` (lokal und auf dem VPS).

| Variable | Bedeutung | Lokal (Standard) |
|---|---|---|
| `CONTACT_MAIL_TO` | Empfänger des Kontaktformulars (hat Vorrang vor dem Wert in der Datenbank) | `kontakt@ecommerce-expert.de` |
| `SMTP_HOST` | SMTP-Server | `mailpit` |
| `SMTP_PORT` | `465` = SMTPS (implizites TLS), `587` = STARTTLS, sonst unverschlüsselt (nur Mailpit) | `1025` |
| `SMTP_USER` / `SMTP_PASS` | Zugangsdaten; leer = ohne Authentifizierung | leer |
| `SMTP_FROM` | Absenderadresse auf **eigener Domain** (Envelope-Sender und From) | `kontakt@ecommerce-expert.de` |

- **From** ist immer `SMTP_FROM` (eigene Domain), **Reply-To** ist die E-Mail-Adresse aus dem Formular – so greifen
  SPF/DKIM/DMARC und „Antworten“ geht trotzdem an den Interessenten.
- Die Werte kommen aus `.env` (lokal) bzw. `deploy/.env` (Server), nie aus dem Code. `SMTP_PASS` gehört nicht ins Git.
- Lokal landet jede Mail in **Mailpit** (<http://localhost:8025>), es verlässt nichts den Rechner.

### SPF, DKIM, DMARC (DNS der Domain `ecommerce-expert.de`)

Damit Mails des Formulars im Postfach ankommen und nicht als Spam gelten, muss der SMTP-Anbieter für die Domain
autorisiert sein. Die genauen Werte liefert der Anbieter; Grundmuster:

| Eintrag | Typ / Name | Wert (Beispiel) |
|---|---|---|
| **SPF** | TXT `@` | `v=spf1 include:spf.<anbieter> ~all` – es darf nur **ein** SPF-Eintrag existieren; bestehende `include:` ergänzen |
| **DKIM** | TXT oder CNAME `<selector>._domainkey` | öffentlicher Schlüssel bzw. CNAME vom Anbieter |
| **DMARC** | TXT `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@ecommerce-expert.de; adkim=s; aspf=s` |

Empfohlenes Vorgehen: erst mit `p=none` starten und die Berichte (`rua`) beobachten, nach einigen Wochen auf
`p=quarantine`, später `p=reject` erhöhen. Prüfen mit `dig TXT ecommerce-expert.de`,
`dig TXT _dmarc.ecommerce-expert.de` und einer Testmail an einen Prüfdienst (z. B. mail-tester.com).
`SMTP_FROM` muss beim Anbieter als Absender freigegeben sein (Postfach oder verifizierte Domain).

## Deployment (Staging und Live)

Der Server-Stack liegt in [`deploy/`](deploy): Caddy (automatisches TLS) → WordPress (Apache, PHP 8.3) → MariaDB.
**Standard ist Staging** (`deploy/Caddyfile.staging`): komplett hinter **Basic Auth**, `X-Robots-Tag: noindex`, `robots.txt`
mit `Disallow: /` und WordPress-Einstellung „Suchmaschinen abhalten“. Die Live-Konfiguration (`Caddyfile.live`) ist vorbereitet,
wird aber nur nach ausdrücklicher Freigabe aktiviert (siehe [TODO.md](TODO.md)).

### Staging aufsetzen

Voraussetzungen: VPS in der EU mit Docker, DNS-A/AAAA für `staging.ecommerce-expert.de`, Ports 80/443 offen.

```bash
# 1. Code auf den Server
git clone <repo-url> /srv/ecommerce-expert && cd /srv/ecommerce-expert

# 2. Konfiguration
cp deploy/.env.example deploy/.env
docker run --rm caddy:2 caddy hash-password --plaintext 'GEHEIMES-PASSWORT'   # Ausgabe als BASIC_AUTH_HASH in einfache Anführungszeichen
nano deploy/.env        # Domain, Basic Auth, DB-/Admin-Passwörter, SMTP-Zugang (siehe „Mailversand“)

# 3. Für diese Shell auf den Server-Stack umschalten (Compose-Datei, Env, Setup-Skript)
export COMPOSE_FILE=deploy/docker-compose.yml COMPOSE_ENV_FILES=deploy/.env ENV_FILE=deploy/.env

# 4. Starten und per WP-CLI einrichten (idempotent: Sprache, Permalinks, Theme, Contact Form 7, Formular, Entwurfsseiten)
docker compose up -d
./scripts/setup.sh

# 5. Schutz prüfen (401 ohne Login, noindex, robots.txt, …)
BASIC_AUTH_USER=staging BASIC_AUTH_PASS='GEHEIMES-PASSWORT' scripts/check-staging.sh https://staging.ecommerce-expert.de

# 6. Smoke-Tests gegen Staging (ohne Mail-Test, der braucht Mailpit)
WP_URL=https://staging.ecommerce-expert.de BASIC_AUTH_USER=staging BASIC_AUTH_PASS='GEHEIMES-PASSWORT' SKIP_MAIL_TESTS=1 npm run test:smoke
```

- `scripts/setup.sh` lässt auf dem Server **Create Block Theme** weg (`SETUP_DEV_PLUGINS=0`) – das Theme ist read-only
  eingehängt, Änderungen laufen immer über Git.
- Updates: `git pull && docker compose up -d`. Theme, `mu-plugins/` und `scripts/wp/` kommen direkt aus dem Checkout.
- Das Kontaktformular sendet auf Staging **echte Mails** an `CONTACT_MAIL_TO`. Zum Testen dort ggf. vorübergehend die eigene Adresse eintragen.
- DB-Umzug: `./scripts/db-export.sh` (lokal) → per `scp` auf den Server → `./scripts/db-import.sh backups/db-….sql http://localhost:8080 https://staging.ecommerce-expert.de`
  (mit den exportierten `COMPOSE_FILE`/`COMPOSE_ENV_FILES` aus Schritt 3). Uploads liegen im Volume `wordpress` und werden separat kopiert.
- Backups: `docker compose run --rm -T wpcli wp db export /backups/db-$(date +%F).sql` per Cron plus das Volume `wordpress`.

### Live-Gang (nur nach ausdrücklicher Freigabe)

Nicht automatisiert und **nicht ohne Freigabe von Daniel**. Die Checkliste steht in [TODO.md](TODO.md), Abschnitt 5.
Kurzfassung: Platzhalter und Rechtstexte ersetzt, SPF/DKIM/DMARC aktiv und Zustellung getestet, DNS auf den VPS,
`CADDYFILE=./Caddyfile.live` und `SITE_DOMAIN` setzen, URL per `wp search-replace` umstellen, `wp option update blog_public 1`.

## Offene Platzhalter und To-dos

Alle offenen Platzhalter (`[PREIS]`, `[ANZAHL]`, `[E-MAIL]`, `[ZEITRAUM]`, `[BUDGET-STUFE 1–3]`, Rechtstexte) mit Fundstellen sowie die
Go-live-Checkliste stehen in **[TODO.md](TODO.md)**.
