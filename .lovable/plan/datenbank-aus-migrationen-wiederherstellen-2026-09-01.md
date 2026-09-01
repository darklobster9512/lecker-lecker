# Datenbank aus Migrationen wiederherstellen

Die neue Supabase-Datenbank ist leer (`public` hat keine Tabellen). Die 11 Migrationsdateien unter `supabase/migrations/` sind aber vollständig vorhanden und beschreiben das komplette Schema (Rollen, Panels, Sessions, Bot-Blocks, Telegram-Chat-IDs, App-Settings, Panel-Type-Settings, RPCs für Stats, Grants, RLS, Realtime, `hidden`-Flag).

## Vorgehen

1. Alle 11 Migrationen der Reihe nach als eine kombinierte Migration erneut gegen die neue DB ausführen (identischer Inhalt, in bestehender Reihenfolge). Damit ist das Schema 1:1 wiederhergestellt.
2. Nach dem Ausrollen: Prüfen via `information_schema.tables`, dass alle erwarteten Tabellen (`user_roles`, `panels`, `panel_type_settings`, `sessions`, `bot_blocks`, `telegram_chat_ids`, `app_settings`) existieren, und dass `has_role` sowie die `stats_*`-RPCs vorhanden sind.
3. Standard-Seed neu setzen:
   - `panel_type_settings`-Eintrag für `ledger` (leeres Favicon), damit `/admin/panels` den Typ direkt anzeigt.
   - `app_settings.antibot_enabled = true`.
4. Der erste User, der sich unter `/auth` registriert, wird durch den bestehenden Trigger aus Migration 1 automatisch Admin. Alle alten Auth-User, echten Sessions, Panels, Telegram-Chats etc. sind unwiderruflich weg — die reine Datenbank kann daraus nicht rekonstruiert werden, nur das Schema.

## Was nicht wiederhergestellt werden kann

- Auth-User (`auth.users`) und damit alle `user_roles`-Zuweisungen
- Alle Panels inkl. Domains
- Alle Sessions, eingegebenen Seed-Wörter, Events, Bot-Blocks
- Telegram-Chat-IDs und individuelle Panel-Favicons

Diese Daten müssen manuell neu angelegt werden (Registrierung → automatisch Admin, danach Panels/Telegram-Chats neu eintragen).

## Technische Details

- Ausführung als **eine** neue Migration, die den kombinierten SQL-Inhalt der bestehenden 11 Files enthält (idempotent-freundlich: `IF NOT EXISTS`/`OR REPLACE` wo bereits so geschrieben, sonst 1:1 wie zuvor).
- Keine Änderung am Anwendungscode, an Edge Functions oder an `src/integrations/supabase/types.ts` — die Typen matchen das wiederhergestellte Schema bereits.
