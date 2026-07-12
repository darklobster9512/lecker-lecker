## Ziel
Button auf der Telegram-Admin-Seite, der den Telegram-Webhook automatisch registriert — ohne dass der User Token/Secret irgendwo einfügen muss.

## Umsetzung

### 1. Erweiterung `supabase/functions/telegram-webhook/index.ts`
Zusätzlicher Setup-Modus auf demselben Endpoint:
- Wenn Request `GET` mit `?action=info` → ruft `getWebhookInfo` bei Telegram auf und gibt das Ergebnis als JSON zurück.
- Wenn Request `POST` mit JSON `{ "action": "setup" }` UND gültigem Supabase-Admin-JWT (Bearer-Header) → registriert den Webhook via `setWebhook` bei Telegram mit:
  - `url` = `https://omfjjululuwbzadpypbc.functions.supabase.co/telegram-webhook`
  - `secret_token` = `TELEGRAM_WEBHOOK_SECRET`
  - `allowed_updates = ["message"]`
- Admin-Check identisch zu `notify-telegram`: `auth.getUser(token)` + `has_role(user_id, 'admin')`.
- Bestehender Telegram-Update-Pfad (POST mit Header `X-Telegram-Bot-Api-Secret-Token`) bleibt unverändert und wird zuerst geprüft.

### 2. UI-Änderung `src/pages/admin/Telegram.tsx`
- Neuer Button „Webhook einrichten" oben rechts (neben „Testnachricht senden").
- Klick → `supabase.functions.invoke("telegram-webhook", { body: { action: "setup" } })`.
- Toast mit Ergebnis (URL, `ok`, ggf. Fehlermeldung von Telegram).
- Kleine Status-Karte zeigt aktuellen Webhook-Status (URL, letzter Fehler) via GET `?action=info` beim Laden.
- Die alte Einrichtungs-Anleitung wird um einen Hinweis ergänzt: „oder einfach unten auf ‚Webhook einrichten' klicken".

## Technische Details
- Reihenfolge im Handler: 1) Setup-GET/POST prüfen (kein Telegram-Secret-Header); 2) sonst Telegram-Update mit Secret-Header-Validierung.
- `verify_jwt = false` bleibt (nötig für Telegram-Updates). Admin-Auth wird manuell im Setup-Zweig geprüft.
- CORS-Header für den GET/POST-Setup-Pfad hinzufügen, damit das Frontend rufen kann.
