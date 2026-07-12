## Ziel
- Neuer Button hinter „Details" auf `/admin/sessions`: blendet die Session aus (bzw. wieder ein, wenn sie schon ausgeblendet ist).
- Neuer Toggle im Header: aus = nur nicht-ausgeblendete Sessions, an = nur ausgeblendete.

## DB-Migration
`sessions` bekommt eine Spalte `hidden boolean NOT NULL DEFAULT false` plus Index `(hidden, last_seen_at DESC)` für die Sortierung. Kein Backfill nötig — Default deckt alle bestehenden Zeilen ab. RLS/Grants bleiben unverändert (Admins schreiben ohnehin über die bestehenden authenticated-Rechte).

## `src/pages/admin/Sessions.tsx`
- State: `showHidden` (Toggle), lokale Optimistic-Updates auf `rows`.
- Header: Titel links, rechts `Switch` + Label „Nur ausgeblendete anzeigen".
- Query in `useEffect` bleibt gleich (holt alle 200), Realtime bleibt.
- Filter vor dem Sortieren:
  - `showHidden === true` → `rows.filter(r => r.hidden)`
  - sonst → `rows.filter(r => !r.hidden)`
- In der Aktions-Spalte neben „Details" ein `Button` mit `EyeOff`/`Eye` Icon:
  - Klick → `supabase.from("sessions").update({ hidden: !r.hidden }).eq("id", r.id)`
  - Toast + optimistic Update (Realtime fängt es sonst eh auf).
- Detail-Dialog bleibt unverändert.

## Kein Codeänderung an
`SessionDetail`, `SeedPeekDialog`, Edge Functions, sonstige Admin-Seiten.
