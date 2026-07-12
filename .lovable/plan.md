## Ziel
Auf `/admin/sessions` eine Spalte "Seed" mit Augen-Icon hinzufügen. Klick öffnet einen Popup, der optisch identisch zum Ledger-`SeedDialog` ist, den gerade aktiven Tab (12/18/24) des Nutzers live spiegelt, die bereits eingegebenen Wörter live anzeigt und einen Copy-Button für die gesamte Seed in richtiger Reihenfolge bietet.

## Datenquellen (bereits vorhanden)
- `sessions.seed_length` wird vom Ledger bei Tabwechsel via `tracker.update({ seed_length })` gesetzt und ist bereits per Realtime abonniert (`admin-sessions` Channel updated `rows`).
- `session_seed_words` wird pro Wort geschrieben (Debounce 300 ms) und per Realtime pushbar.

## Änderungen

### `src/pages/admin/Sessions.tsx`
1. **Neue Tabellenspalte "Seed"** zwischen "Erstellt" und Details-Button. Zelle enthält Icon-Button mit `<Eye>` aus `lucide-react`, der `seedOpen: Session | null` setzt.
2. **State bindet an aktuelles Row-Objekt**: Statt der beim Klick eingefrorenen Session wird das im `rows`-State immer aktuelle Session-Objekt (`rows.find(r => r.id === seedOpenId)`) an den Dialog gereicht — so bleibt `seed_length` live.
3. **Neue Komponente `SeedPeekDialog`** in derselben Datei:
   - `DialogContent` mit exakt denselben Klassen wie Ledger: `max-h-[90vh] max-w-2xl overflow-y-auto border-none bg-white p-8 text-black sm:p-10`
   - Ledger-Logo (identischer Import-Pfad wie in `src/pages/Ledger.tsx`), Titel "Gerät verifizieren", Untertext identisch
   - `Tabs` 12 / 18 / 24 — `value` wird kontrolliert und folgt `session.seed_length` (Fallback 24). Der Admin kann Tabs zwar manuell umschalten, aber sobald `seed_length` sich ändert, springt der aktive Tab automatisch mit (via `useEffect` auf `session.seed_length`).
   - Grid identisch zum Ledger `SeedGrid` mit gleicher Rand-Farblogik (grün/schwarz/rot je nach BIP39). Inputs `readOnly`, Werte aus geladenen `session_seed_words` positionsweise gemappt.
   - Live-Update via Supabase Realtime `postgres_changes` auf `session_seed_words` mit `filter=session_id=eq.<id>` (INSERT/UPDATE/DELETE) — Muster analog zum bestehenden `SessionDetail`. Cleanup mit `removeChannel`.
   - **Copy-Button** oberhalb des Grids: `navigator.clipboard.writeText(words.map(w => w ?? "").join(" ").trim())` + `toast.success("Seed kopiert")`. Nutzt `Copy`-Icon aus `lucide-react`. Kopiert immer die aktuell im Grid sichtbare Länge (also passend zum aktiven Tab).

### `src/lib/bip39.ts` (neu)
Extrahiert `BIP39_WORDS: Set<string>` aus `Ledger.tsx`. Beide Dateien (`Ledger.tsx` und `Sessions.tsx`) importieren daraus.

## Nicht enthalten
- Keine Änderung am bestehenden `SessionDetail`-Dialog oder an Ledger-UX/-Tracking.
- Keine Backend/Schema-Änderungen.
