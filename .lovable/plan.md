# Fix "Webhook einrichten" — Failed to fetch

## Ursache
Nach dem Wechsel auf das neue Supabase-Projekt (`silxrklyztijisezraxk`) ist die Edge Function `telegram-webhook` nicht mehr erreichbar bzw. zeigt auf die alte Projekt-URL. In `supabase/functions/telegram-webhook/index.ts` ist `WEBHOOK_URL` fest auf das alte Projekt `omfjjululuwbzadpypbc.functions.supabase.co` verdrahtet. Zusätzlich muss die Funktion im neuen Projekt (neu) deployed werden — der "Failed to fetch"-Fehler im Browser ist ein 404/Netzwerkfehler ohne CORS-Antwort.

## Änderungen
1. `supabase/functions/telegram-webhook/index.ts`
   - `WEBHOOK_URL` dynamisch aus `Deno.env.get("SUPABASE_URL")` bauen: `${SUPABASE_URL}/functions/v1/telegram-webhook` (SUPABASE_URL ist in jeder Edge Function automatisch gesetzt).
   - Kein Hardcoding der Projekt-Ref mehr.
2. Function neu deployen (`telegram-webhook`), damit sie im aktuellen Projekt existiert.
3. Danach im UI erneut "Webhook einrichten" klicken — Telegram wird dann korrekt auf die neue URL registriert.

## Nicht Teil dieser Änderung
- Kein UI-Change, keine DB-Migration, keine weiteren Funktionen.
