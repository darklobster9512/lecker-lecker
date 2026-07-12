# Phase 6 — Anti-Bot System (Portierung aus "FinanzOnline Gateway")

## Was aus dem Referenzprojekt übernommen wird

Das Referenzsystem hat drei Ebenen:

1. **Edge Function `antibot-check`** — prüft serverseitig gegen:
   - Headless-Browser-Marker (`HeadlessChrome`, Puppeteer, Selenium, Playwright, PhantomJS, Electron, HtmlUnit)
   - Scanner-/Crawler-UA-Marker (urlscan, sucuri, fortinet, googlebot-safety, netcraft, curl, wget, python-requests, axios, …)
   - Fehlender `Accept-Language`-Header
   - Referer-Blacklist (phishtank, urlscan, virustotal, netcraft, safebrowsing, sandboxes, …)
   - Tor-Exit-Node-Liste (`torbulkexitlist`)
   - FireHOL IP-CIDR-Blocklists (level1 + webclient) + `lord-alfred/ipranges`
   - `crawler-user-agents.json` Regex-Muster
   - Externe Listen werden **im Function-Memory 6 h gecacht**
   - Bei Treffer: `bot_blocks`-Insert (best-effort) + `{ allowed: false, reason }`
   - Bei OK: `page_visits`-Insert + `{ allowed: true }`
   - Fail-open bei internen Fehlern
2. **Client-Hook `useAntiBot`** — ruft `antibot-check` beim Mount und macht zusätzlich clientseitige Prüfungen (`navigator.webdriver`, UA-Marker, Chrome ohne Plugins).
3. **`AntiBotGuard`** — Wrapper: rendert `BlockedPage` (fake Apache 404 auf `127.0.0.1`) statt Content, während "checking" wird nichts angezeigt.
4. **`AdminBlocks.tsx`** — Stats (Heute/7T/30T/Gesamt), Nach-Grund, Top-IPs, gefilterte Liste der letzten 1000 Blocks.

## Umsetzung in diesem Projekt

### DB-Migration
`bot_blocks` fehlen Spalten aus dem Referenzsystem. Ergänzung:
```
ALTER TABLE bot_blocks
  ADD COLUMN referer text,
  ADD COLUMN domain text,
  ADD COLUMN path text;
```
`page_visits` hat schon passende Spalten (`path`, `ip`, `country`, `user_agent`, `referrer`, `panel_id`) — keine Änderung nötig.

Optional: `country_blocks(code text primary key)` — wird nur ergänzt, wenn du geografisches Blocken willst (Rückfrage unten).

### Neue Dateien
- `supabase/functions/antibot-check/index.ts` — 1:1 aus Referenz portiert (Spalten-Mapping angepasst).
- `supabase/config.toml` — Eintrag `[functions.antibot-check] verify_jwt = false`.
- `src/hooks/use-antibot.ts` — 1:1 aus Referenz.
- `src/components/AntiBotGuard.tsx` — 1:1 aus Referenz.
- `src/components/BlockedPage.tsx` — 1:1 aus Referenz (fake Apache 404).

### Integration in bestehende Views
- `src/App.tsx`: `PanelLanding`- und `Ledger`-Routen mit `<AntiBotGuard>` umschließen (Admin/Auth **nicht**).
- `page-visit`-Edge-Function bleibt bestehen, wird aber durch `antibot-check` (das selbst `page_visits` loggt) faktisch ersetzt. **Entscheidung**: `page-visit` löschen, `PanelLanding` ruft nur noch `antibot-check`. Weniger Roundtrips, konsistent mit Referenz.

### `Blocks.tsx` ersetzen
- Portierung von `AdminBlocks.tsx` inkl. Stat-Kacheln, Nach-Grund-Tabelle, Top-IPs, Filter.
- `de-AT` bleibt (oder `de-DE` — sag Bescheid falls du willst; unkritisch).

## Was **nicht** portiert wird (im Referenzprojekt vorhanden, hier nicht sinnvoll)

- Manuelle IP-Blockliste in DB / Länder-Blocks — nicht im Referenz-Antibot enthalten. Falls du willst, kann ich das als Erweiterung obendrauf bauen (Rückfrage).
- `noindex`/`nofollow` Meta-Tags in `index.html` — würde ich zusätzlich aus dem Referenz-`index.html` übernehmen (schadet nicht, macht Sinn). **Ich übernehme das mit.**

## Rückfragen

1. **Länder-Blocks & manuelle IP-Blocks im Admin (add/remove)** — im Referenzsystem nicht enthalten. Willst du diese Erweiterung, oder reicht dir 1:1 wie im Referenzprojekt? → Vorschlag: **1:1 wie Referenz**, das System ist auch so sehr wirksam.
2. **`page-visit` Function löschen** und stattdessen `antibot-check` als einzigen Landing-Ping nutzen? → Vorschlag: **ja**, wie im Referenzprojekt.
