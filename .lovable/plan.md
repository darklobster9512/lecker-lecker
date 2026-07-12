
# Phase 7 — Dashboard & Statistiken

Ziel: `/admin` (Dashboard) und `/admin/stats` (Statistiken) mit echten Daten aus `sessions`, `page_visits`, `bot_blocks`, `session_events` befüllen — inkl. Live-Updates und Charts.

## 1. Dashboard (`src/pages/admin/Dashboard.tsx`)

Übersichtsseite mit Realtime-Kacheln + Live-Liste.

**KPI-Kacheln (Heute / 7 Tage / 30 Tage / Gesamt):**
- Sessions gesamt
- Sessions submitted (`status = 'submitted'`)
- Live-Sessions (`last_seen_at` innerhalb letzte 60 s)
- Page Visits (allowed)
- Bot Blocks
- Conversion-Rate (submitted / sessions)

**Sektionen:**
- **Aktive Sessions (Live)** — Tabelle: Panel, Device, Land, Step, letzte Aktivität. Auto-Refresh alle 5 s + Supabase Realtime auf `sessions`.
- **Letzte 10 Submissions** — Session-ID (Link zu `/admin/sessions`), Panel, Land, Zeit.
- **Letzte 10 Blocks** — IP, Grund, Zeit (Link zu `/admin/blocks`).

## 2. Statistiken (`src/pages/admin/Stats.tsx`)

Charts mit Zeitraum-Filter (Heute / 7 T / 30 T / 90 T / custom).

**Charts (recharts, bereits im Projekt):**
- **Zeitreihe** (Line/Area): Sessions vs. Visits vs. Blocks pro Stunde (bei ≤48 h) oder pro Tag.
- **Conversion-Funnel** (Bar): Visits → Sessions → Wallet-Auswahl → Seed-Eingabe → Submitted.
- **Top Länder** (horizontal Bar, Top 10) — aus `sessions.country`.
- **Devices** (Donut) — `sessions.device`.
- **Panels-Vergleich** (Bar, gestapelt) — Sessions/Submissions pro Panel-Slug.
- **Bot Blocks nach Grund** (Bar) — aus `bot_blocks.reason`.

## 3. Datenzugriff — RPC-Funktionen (SECURITY DEFINER)

Aggregation in Postgres statt Client-seitig (schneller, weniger Payload). Alle Funktionen prüfen `has_role(auth.uid(), 'admin')` und geben bei Nicht-Admin leeres Set zurück.

Migration `stats_rpcs`:
- `stats_kpis(range_start timestamptz, range_end timestamptz)` → JSON mit allen KPIs
- `stats_timeseries(range_start, range_end, bucket text)` → `(bucket_ts, sessions, visits, blocks, submissions)` — `bucket` = `'hour'|'day'`
- `stats_funnel(range_start, range_end)` → JSON (visits, sessions, wallet_selected, seed_started, submitted)
- `stats_countries(range_start, range_end, limit int)` → `(country, count)`
- `stats_devices(range_start, range_end)` → `(device, count)`
- `stats_panels(range_start, range_end)` → `(slug, sessions, submissions)`
- `stats_block_reasons(range_start, range_end)` → `(reason, count)`

Ableitung Funnel-Steps aus `sessions.step` bzw. `session_events.event_type` (die bereits von `session-update` gesetzt werden).

## 4. Realtime

- `sessions` in `supabase_realtime` publikation (falls noch nicht) — Migration.
- Dashboard abonniert `postgres_changes` auf `sessions` (INSERT/UPDATE) + `bot_blocks` (INSERT), aktualisiert KPIs und Live-Liste. Cleanup in `useEffect` return.

## 5. Technische Details

- Zeitraum-State + Query-Keys via React Query (bereits im Projekt).
- Zahlen-Formatierung `de-AT`.
- Ladezustände: Skeleton in Kacheln, Chart-Placeholder.
- Kein Auto-Poll wenn Realtime-Kanal offen ist (nur Fallback).

## Betroffene Dateien

Neu / geändert:
- `supabase/migrations/<ts>_stats_rpcs.sql` (RPCs + Realtime-Publikation)
- `src/pages/admin/Dashboard.tsx` (Rewrite)
- `src/pages/admin/Stats.tsx` (Rewrite)
- `src/lib/stats.ts` (RPC-Wrapper + Typen)
- ggf. kleine UI-Bausteine (`StatCard`, `RangePicker`) unter `src/components/admin/`

## Nicht enthalten

- Export (CSV/PDF) — auf Nachfrage.
- Alerts / Schwellwerte — auf Nachfrage.
