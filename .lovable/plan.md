## Ziel
In der Admin-Sidebar (`src/components/admin/AdminLayout.tsx`) den freien Raum zwischen der Navigation (`<nav>`) und dem Abmelden-Button mit einer Typewriter-Animation füllen.

## Animation
Endlosschleife:
1. Tippt `Hmm... Lecker!` (Zeichen für Zeichen, ~80 ms/Char)
2. Sobald `Lecker!` vollständig steht: **sofort** mit „Backspace" löschen bis nur `Hmm... ` übrig ist (keine Pause)
3. Tippt `Ledger!` an
4. Bleibt **10 s** stehen
5. Löscht alles und beginnt wieder bei Schritt 1

Zusätzlich: blinkender Cursor (`|`) am Ende, dezent gestylt (kleine Schrift, `text-sidebar-foreground/70`, monospace), zentriert im freien Sidebar-Bereich.

## Umsetzung
- Neue Komponente `src/components/admin/TypewriterFooter.tsx` mit eigenem `useEffect`, das eine State-Maschine via `setTimeout` steuert (Phasen: `typing1` → `deleting` → `typing2` → `hold` → `clearing`). Aufräumen mit `clearTimeout` im Cleanup.
- Cursor-Blink über Tailwind `animate-pulse`.
- In `AdminLayout.tsx` das `<nav>` behält `flex-1`; direkt darunter, vor dem Abmelden-Border-Block, wird `<TypewriterFooter />` eingefügt.

## Nicht enthalten
Keine Änderungen an DB, Edge Functions, Routen oder anderen Seiten.
