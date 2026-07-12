## Ziel
Auf `/admin/panels` die Spalte "Device" aus der Panels-Übersichtstabelle entfernen.

## Änderung
`src/pages/admin/Panels.tsx`:
- `<th>Device</th>` (Zeile 327) entfernen
- Die dazugehörige `<td>`-Zelle mit `DEVICE_OPTIONS.find(...)` (Zeilen ca. 354–357) entfernen
- `colSpan` einer eventuellen "keine Einträge"-Zeile entsprechend um 1 reduzieren (falls vorhanden)

## Nicht enthalten
- Das Feld `device_type` bleibt im Edit-Dialog und im Datenmodell erhalten — nur die Tabellenspalte verschwindet.
- Keine DB-Änderungen.
