## 3 kleine Anpassungen auf `/ledger`

### 1. SeedDialog: Loading-Overlay nach „Verifizieren"
- Neuer State `verifying: boolean` im `SeedDialog`
- Klick auf „Verifizieren" → `verifying = true` (Popup bleibt offen, Inhalt sichtbar)
- Über dem Popup-Content ein absolutes Overlay (z-Ebene) mit halbtransparentem weißen Hintergrund + zentriertem Spinner (`Loader2`, lila) + Text „Überprüfen..."
- Nach 3s → `onVerified()` (schließt Popup, geht zu Step 2)
- Cleanup via `useEffect` mit `setTimeout`; reset bei Schließen

### 2. Footer auf der gesamten `/ledger`-Seite
- Im `<main>` unten (unter allen Views) ein `<footer>` mittig zentriert
- Text: „Copyright © Ledger SAS. All rights reserved."
- Style: klein (`text-xs`), dezent ausgegraut (`text-gray-600`), zentriert, etwas Abstand nach oben
- `main` bekommt `justify-between` bzw. Footer wird `mt-auto` positioniert, damit er unten sitzt

### 3. Step 3: Wort „authentisch" ersetzen
- Aktuell: „Dein Ledger-Gerät ist authentisch und sicher."
- Neu: „Dein Ledger-Gerät ist verifiziert und sicher."

Keine weiteren Änderungen.