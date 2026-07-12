
# Phase 8 — LuxuryHost Domain-Verwaltung

Portierung des Domain-Management aus dem Referenzprojekt, **ohne** VPS-Agent / SSL-Provisioning. Kein "Domain verbinden"-Button, keine `VPS_AGENT_*`-Secrets, keine `domain_connections`-Tabelle.

Fokus: Guthaben anzeigen, Domains suchen (bulk über `.com/.net/.cc/.co`), kaufen, listen, DNS A-Record setzen. Punkt.

## 1. Secrets

Nur ein neues Secret (wird nach Plan-Freigabe angefordert):
- `LUXURYHOST_API_KEY` — Bearer-Token für `api.luxuryhost.cc`.

## 2. Edge Function `luxuryhost-proxy`

`supabase/functions/luxuryhost-proxy/index.ts` — Reduziertes Portat aus Referenz mit nur den LuxuryHost-Actions:

- `getBalance` → `GET /public/api/users/me`
- `bulkSearch` → `POST /public/api/domains/search/bulk`
- `purchase` → `POST /public/api/domains/purchase`
- `list` → `GET /public/api/domains/list?limit=100&sort_by=createdAt&sort_direction=desc`
- `getDomain` → `GET /public/api/domains/{id}`
- `addRecord` / `deleteRecord` → DNS-Records verwalten
- `updateNameservers` (optional)

**Keine** `checkDns`, `connectDomain`, `retrySSL` Actions.

CORS aus `npm:@supabase/supabase-js@2/cors`, Config: `verify_jwt = false` in `supabase/config.toml`.

## 3. Admin-UI `src/pages/admin/Domains.tsx` (Rewrite)

Ersetzt den aktuellen Platzhalter durch:

- **Guthaben-Kachel** mit Refresh-Button (formatiert USD).
- **Domain-Suche**: Basis-Name → Bulk-Suche über 4 TLDs (`.com/.net/.cc/.co`). Ergebnisse als Karten mit Preis + Verfügbarkeit + "Kaufen"-Dialog.
- **Domain-Liste** (paginiert, 10 pro Seite): Domain, Status-Badge, erstellt am, Aktionen (DNS setzen).
- **DNS-Dialog**: Eingabe der Ziel-IP → setzt A-Record `@` → IP über `addRecord`.

Kein Connect-Dialog, kein SSL-Retry, kein DNS-Check.

## 4. Nicht enthalten (bewusst)

- VPS-Agent-Integration (`connectDomain`, `retrySSL`) → nicht Teil dieses Panels.
- `domain_connections` Tabelle → wird nicht benötigt ohne Connect-Flow.
- `domain-status-check` Cron-Function (Telegram-Statusmeldungen) → separat, wenn gewünscht.
- Host-Header-basiertes Panel-Routing → separater Auftrag.
- XMR-Aufladen-Karte → auf Wunsch nachrüstbar.

## 5. Betroffene Dateien

Neu:
- `supabase/functions/luxuryhost-proxy/index.ts`

Geändert:
- `src/pages/admin/Domains.tsx` (Rewrite)
- `supabase/config.toml` (Function-Eintrag)
- `.lovable/plan.md`

Keine DB-Migration nötig.
