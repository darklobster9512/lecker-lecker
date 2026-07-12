## Popup wirklich vertikal zentrieren

Ursache: Der Popup-Inhalt (Logo, Titel, Tabs, 24 Seed-Felder, Counter, Button, Padding) ist höher als der Viewport. Da der Dialog per `top-[50%] translate-y-[-50%]` zentriert wird, rutscht bei zu großem Inhalt der obere Rand aus dem Bildschirm — der sichtbare Teil erscheint „unten". `overflow-hidden` verhinderte zusätzlich, dass man nach oben scrollen kann.

### Fix in `src/routes/ledger.tsx` → `SeedDialog` `DialogContent`
- `overflow-hidden` entfernen, stattdessen `max-h-[90vh] overflow-y-auto` setzen, damit das Popup nie höher als der Viewport wird und intern scrollbar bleibt
- Padding bleibt (`p-8 sm:p-10`), `relative` bleibt (für Overlay)
- Loading-Overlay (`absolute inset-0`) bleibt – deckt weiterhin den sichtbaren Bereich ab

Damit sitzt das Popup vertikal und horizontal exakt in der Bildschirmmitte.