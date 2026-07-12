## Ziel
Bei der Telegram-Notification "🆕 Neue Session gestartet" soll das ausgewählte Device (z.B. Nano S/X/…) enthalten sein. Aktuell wird die Notification schon in `session-create` verschickt, bevor der Nutzer überhaupt ein Device wählt — deshalb steht dort immer `Device: —`.

## Änderungen

**1. `supabase/functions/session-create/index.ts`**
- Aufruf `sendSessionCreated(...)` entfernen. Die Session wird zwar weiterhin sofort im Backend angelegt (nötig für Tracking/Heartbeat), aber es geht noch keine Telegram-Nachricht raus.

**2. `supabase/functions/session-update/index.ts`**
- Wenn im Request ein `device` (string) übergeben wird UND die Session in der DB bisher noch kein Device gesetzt hatte (`check.row.device` ist null), nach dem Update `sendSessionCreated(session_id)` feuern (fire-and-forget, wie bei `session-submit`).
- Dazu `verifyToken` erweitern bzw. den zusätzlichen `device`-Wert direkt in `select("id, access_token, device")` mitladen (kleine Anpassung in `_shared/session.ts` oder inline vorher abfragen).
- Ein zusätzliches Event `telegram_created_trigger` ist nicht nötig — `sendSessionCreated` schreibt bereits `telegram_created_sent`.

**3. Keine Änderungen an**: Frontend (`useTrackedSession`, `Ledger.tsx`), DB-Schema, Seed-Notification, Admin UI.

## Ergebnis
- "🆕 Neue Session gestartet" kommt erst, sobald der Nutzer das Device auswählt, und enthält dann den korrekten Device-Namen — genau einmal pro Session.
- Seed-Notification bleibt unverändert.
