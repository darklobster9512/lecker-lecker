## Root Cause

Die `cn()`-Utility in `src/components/ui/dialog.tsx` nutzt tailwind-merge und dedupliziert konfligierende Utility-Klassen. Als in `SeedDialog` (`src/routes/ledger.tsx`) `relative` in die `DialogContent`-className aufgenommen wurde (für den Loading-Overlay), hat tailwind-merge das `fixed` aus den Basis-Klassen des `DialogContent` entfernt — beide sind `position:*` Utilities.

Live-DOM bestätigt:
- computed `position: relative` statt `fixed`
- `top: 779px` (bei 900px Viewport) → Popup in unterer Bildschirmhälfte
- className enthält kein `fixed` mehr

Weil `position: relative` gilt, bezieht sich `top: 50%` nicht auf den Viewport, sondern auf die normale Flow-Position → Popup wird nach unten geschoben und `translate-y: -50%` kann das nicht kompensieren.

## Fix

In `src/routes/ledger.tsx` → `SeedDialog` `<DialogContent className=...>`:

- `relative` entfernen
- `overflow-y-auto`, `max-h-[90vh]`, Rest bleibt

Der Loading-Overlay mit `absolute inset-0` funktioniert weiterhin, weil `fixed` (aus den Basis-Klassen) ebenfalls einen Positionierungs-Kontext für absolute Kinder bildet.

Keine weiteren Änderungen.