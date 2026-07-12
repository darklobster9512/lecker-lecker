## Ziel
Telegram-Bot-Befehle `/on` und `/off`, die alle Panels in `public.panels` gleichzeitig aktivieren bzw. deaktivieren, mit Bestätigungsantwort an den Telegram-Chat.

## Umsetzung

### 1. Neue Edge Function `supabase/functions/telegram-webhook/index.ts` (public, keine JWT)
- Nimmt Telegram-Webhook-Updates entgegen (POST).
- Sicherheit: erwartet Header `X-Telegram-Bot-Api-Secret-Token` = Wert des neuen Secrets `TELEGRAM_WEBHOOK_SECRET`. Bei Mismatch → 200 mit `{ ok: true }` (ignoriert), damit Telegram nicht retryt.
- Parst `message.text` und `message.chat.id`.
- Optional whitelist: nur Chats, deren `chat_id` in `telegram_chat_ids` mit `active = true` existiert; sonst kurze Antwort „nicht autorisiert" per `sendMessage`.
- Befehle (case-insensitive, akzeptiert `/on`, `/off`, `/on@BotName`, `/off@BotName`):
  - `/off`: `update panels set active = false` → Antwort: `🔴 Alle Panels sind jetzt OFFLINE (n Panels deaktiviert).`
  - `/on`: `update panels set active = true` → Antwort: `🟢 Alle Panels sind jetzt ONLINE (n Panels aktiviert).`
  - Unbekannt → keine Antwort (oder Kurzhinweis).
- Antwort per Telegram Bot API `sendMessage` an den gleichen `chat_id`, `parse_mode: HTML`.
- Wird auch in `supabase/config.toml` als `verify_jwt = false` eingetragen.

### 2. Secret + Webhook-Registrierung
- Neues Secret `TELEGRAM_WEBHOOK_SECRET` (zufälliger String) via `secrets`-Tool.
- Nach Deployment einmalig registrieren mit:
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<project>.functions.supabase.co/telegram-webhook&secret_token=<SECRET>&allowed_updates=["message"]`
  Der Registrierungs-Call wird dem User als Copy-Anleitung im Chat mitgeteilt (kein automatischer Curl, damit der Bot-Token nicht geloggt wird).

### 3. Datenbank
- Kein Schema-Change nötig. `panels.active` existiert bereits, Service-Role-Update ist erlaubt.

## Technische Details
- Massenupdate via `supabase.from("panels").update({ active: <bool> }).neq("id", "00000000-0000-0000-0000-000000000000").select("id")` → Anzahl aus `data.length`.
- Immer HTTP 200 zurückgeben, damit Telegram nicht retryt.
- Keine Änderungen am Admin-UI; Panels-Seite spiegelt den neuen Zustand beim nächsten Reload.
