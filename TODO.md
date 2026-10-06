# TODO – offene Punkte vor dem Live-Gang

Stand: Staging-Stack ist vorbereitet, **Live-Gang nur nach ausdrücklicher Freigabe**.
Diese Datei ist die Quelle der Wahrheit für alles, was noch fehlt. Beim Erledigen Haken setzen.

## 1. Platzhalter im Design (Texte kommen von Daniel)

| Platzhalter | Wo | Vorkommen |
|---|---|---|
| `[PREIS]` | [`patterns/pricing.php`](theme/ecommerce-expert/patterns/pricing.php) Zeile 32 (Paket „Website“) und 71 (Paket „Webshop“) | 2 |
| `[ANZAHL]` | [`patterns/pricing.php`](theme/ecommerce-expert/patterns/pricing.php) Zeile 42 („Bis zu [ANZAHL] Seiten“) und 89 („Produktimport bis [ANZAHL] Artikel“) | 2 |
| `[E-MAIL]` | [`patterns/contact.php`](theme/ecommerce-expert/patterns/contact.php) Zeile 34 (Link `mailto:[E-MAIL]` **und** sichtbarer Text) | 2 |
| `[ZEITRAUM]` | [`patterns/contact.php`](theme/ecommerce-expert/patterns/contact.php) Zeile 24 („Ich melde mich innerhalb von [ZEITRAUM] …“) | 1 |
| `[BUDGET-STUFE 1–3]` | [`scripts/wp/contact-form.txt`](scripts/wp/contact-form.txt) Zeile 8 (Auswahlfeld „Budgetrahmen“; im Formular als `&#91;…&#93;` kodiert, siehe unten) | 3 |

- [ ] Alle Platzhalter ersetzen. Die Tests prüfen aktuell, dass die Platzhalter **noch da sind**
      (`tests/e2e/sections.spec.ts` → „Platzhalter bleiben als Platzhalter stehen“, `tests/e2e/mail.spec.ts` nutzt `[BUDGET-STUFE 2]`).
      Beim Ersetzen diese Tests mit anpassen.
- [ ] Budget-Stufen: Im Formular stehen die Optionen als `&#91;BUDGET-STUFE 1&#93;` (eckige Klammern brechen CF7-Tags).
      Echte Werte wie „bis 5.000 €“ brauchen diese Kodierung **nicht**. Danach `make wp ARGS="eval-file /scripts/wp/create-contact-form.php"`
      (bzw. `scripts/setup.sh`) ausführen, und die Dekodierung in `mu-plugins/ecommerce-expert-mail.php`
      (`ecommerce_expert_cf7_decode_budget`) entfernen.
- [ ] Footer: „© 2026 Daniel Kunz · ecommerce-expert.de“ ist fest im Template (`parts/footer.html`); Jahr jährlich prüfen.

## 2. Rechtstexte (liefert Daniel)

Die drei Seiten existieren als **Entwürfe** mit Platzhaltertext (angelegt von `scripts/setup.sh`, Text dort ab Zeile 88).
Solange sie Entwürfe sind, liefern die Footer-Links 404.

- [ ] **Impressum** (`/impressum/`) einsetzen und veröffentlichen
- [ ] **Datenschutz** (`/datenschutz/`) einsetzen und veröffentlichen – muss zum Formular passen:
      Kontaktformular mit Einwilligung, Mailversand per SMTP (Anbieter nennen), Hosting in der EU, lokale Schriften, keine Cookies/Tracking
- [ ] **Barrierefreiheit** (`/barrierefreiheit/`) einsetzen und veröffentlichen (Erklärung nach BFSG)
- [ ] Die Seiten **inhaltlich vom Anwalt/Rechtstexte-Dienst** prüfen lassen (Hinweis im Design: keine Rechtsberatung)

## 3. Mailversand

- [ ] SMTP-Anbieter wählen und Zugangsdaten in `deploy/.env` auf dem Server eintragen
      (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`; `SMTP_PASS` nie ins Git)
- [ ] `SMTP_FROM` beim Anbieter als Absender freigeben (Postfach/Domain verifizieren)
- [ ] DNS für `ecommerce-expert.de`: **SPF**, **DKIM**, **DMARC** (Muster im README, Abschnitt „Mailversand“)
- [ ] Postfach `kontakt@ecommerce-expert.de` existiert und wird gelesen (`CONTACT_MAIL_TO`)
- [ ] Testmail vom Staging aus senden (Formular im Browser absenden) und Zustellung prüfen (Spam-Ordner, Header: SPF/DKIM/DMARC = pass)

## 4. Staging (vorbereitet, noch nicht aufgesetzt)

- [ ] VPS in der EU bereitstellen, Docker installieren, Ports 80/443 öffnen
- [ ] DNS: `staging.ecommerce-expert.de` (A/AAAA) auf den VPS
- [ ] `deploy/.env` anlegen (Basic-Auth-Hash erzeugen, Passwörter setzen) – Anleitung: README, Abschnitt „Deployment (Staging und Live)“
- [ ] Stack starten, `scripts/setup.sh` ausführen, `scripts/check-staging.sh` und `npm run test:smoke` gegen Staging laufen lassen
- [ ] Backups einrichten (DB-Export per Cron, Volume `wordpress` mit Uploads)

## 5. Live-Gang – NUR nach ausdrücklicher Freigabe von Daniel

- [ ] Freigabe liegt vor
- [ ] Punkte 1–4 abgeschlossen
- [ ] DNS für `ecommerce-expert.de` (und `www`) auf den VPS; `deploy/.env`: `SITE_DOMAIN`, `WP_URL`, `CADDYFILE=./Caddyfile.live`
- [ ] URL umstellen (`wp search-replace`), `blog_public` auf `1`, Basic Auth entfällt mit `Caddyfile.live`
- [ ] Suchmaschinen: Sitemap/Search Console nach Bedarf; `robots.txt` prüfen
- [ ] E2E-Tests gegen die Live-URL (ohne Mail-Test: `SKIP_MAIL_TESTS=1`)

## 6. Repository / Prozess

- [ ] PRs reviewen und in der Reihenfolge mergen (siehe Hinweis im ersten PR; die Branches bauen aufeinander auf)
- [ ] **release-please:** Die Option *Settings → Actions → General → „Allow GitHub Actions to create and approve pull requests“*
      aktivieren. Release-PRs, die mit dem Standard-`GITHUB_TOKEN` erstellt werden, lösen **keine** CI aus – dann ist
      der Pflicht-Check für `main` nie grün. Abhilfe: Fine-grained PAT als Secret `RELEASE_PLEASE_TOKEN` hinterlegen und im Workflow verwenden.
- [ ] Optional: Lokal funktioniert `mariadb:11` wegen eines beschädigten Docker-Image-Stores nicht
      (`DB_IMAGE_TAG=lts` in `.env`); nach „Clean/Purge data“ in Docker Desktop wieder auf `11` stellen.
