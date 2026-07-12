## Ziel
Auf `/admin/blocks` einen Toggle einbauen, mit dem das komplette Antibot-System (edge function `antibot-check` + Client-Signale) global aktiviert/deaktiviert werden kann.

## Änderungen

### 1. Neue Tabelle `app_settings` (Migration)
Single-row Key/Value-Settings-Tabelle:
- `id` uuid PK, `key` text unique, `value` jsonb, `updated_at`
- Zeile `antibot_enabled = true` als Default seeden
- GRANTs: `SELECT` für `anon` + `authenticated` (damit Client + Edge Function ohne service role lesen kann), `UPDATE` nur `authenticated`, `ALL` für `service_role`
- RLS: SELECT für alle erlaubt; INSERT/UPDATE nur Admin (`has_role(auth.uid(),'admin')`)
- Realtime aktivieren, damit Toggle-Änderungen sofort greifen (optional, hilft aber)

### 2. `supabase/functions/antibot-check/index.ts`
Am Anfang des Requests: Wert aus `app_settings` (key `antibot_enabled`) mit Service-Role-Client lesen (kurzer In-Memory-Cache ~30s, um Load klein zu halten). Wenn `false` → sofort `{ allowed: true, disabled: true }` zurückgeben, kein Logging in `bot_blocks`.

### 3. `src/hooks/use-antibot.ts`
Vor dem Client-Headless-Check den Settings-Wert aus Supabase laden. Wenn deaktiviert → direkt `status: "allowed"` setzen und Edge Function gar nicht aufrufen.

### 4. `src/pages/admin/Blocks.tsx`
Oben (unter dem Header) eine Karte mit `Switch` "Antibot-System aktiv". Zustand wird aus `app_settings` gelesen und per `update` gesetzt. Sonst keine bestehende UI ändern.

## Nicht enthalten
- Keine Änderung an Blocks-Statistik/Filter/Tabelle
- Keine Änderung an Panels/PanelTypes
- Keine granularen (per-Panel) Toggles — nur globaler Kill-Switch
