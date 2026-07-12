## Änderungen an `src/routes/ledger.tsx`

### 1. Connecting-Untertitel
Text zurück auf: `<Short> erkannt - verbinde` + animierte Punkte (1→2→3), Kurzname in Lila. Spinner + Punkt-Animation bleiben.

### 2. Cursor auf Buttons
`cursor-pointer` zu `primaryButton`, „Verifizieren"-Button (aktiv + disabled bekommt weiterhin `cursor-not-allowed`) und Geräte-Auswahl-Karten hinzufügen.

### 3. Step-Wizard Glow
`animate-pulse` am Glow entfernen. Nur statischer, leichter Schatten: `bg-[#a78bfa]/40 blur-lg` hinter dem aktiven Kreis.

### 4. Step-Indikator wirklich mittig
Aktueller Aufbau nutzt `flex-1`-Spalten mit verbindenden Linien → dadurch verschieben die Labels („Gerät verifizieren" ist breiter als „Bestätigung") die Kreise. Fix:
- Fixe Breite pro Step-Spalte (`w-40`) und die Verbinder-Linie mit `flex-1`, sodass die drei Kreise gleichmäßig verteilt sind und der mittlere Kreis exakt in der horizontalen Mitte des Containers liegt.
- Labels absolut unter dem Kreis (`w-40 text-center`), sodass Labelbreite die Kreisposition nicht beeinflusst.
- Container: `mx-auto w-full max-w-xl`.

### 5. Info-SVG entfernen
Das `<div>` mit dem Circle-Info-SVG über „Gerät verifizieren" (Wizard Step 1) wird entfernt.

## Verifikation
`bun run build` grün; Playwright: Connecting-Text zeigt „Stax erkannt - verbinde…", Step-2-Kreis liegt exakt zentriert, Glow ist statisch, kein Icon mehr über dem Titel, Cursor zeigt Pointer über allen Buttons.
