## Popup vertikal zentrieren

Der `DialogContent` nutzt aktuell die Enter-Animation `data-[state=open]:slide-in-from-bottom-4`, die per `translate-y` das Element von unten einblendet. In Kombination mit der Basis-Zentrierung (`translate-y-[-50%]`) bleibt das Popup dadurch nach unten verschoben.

### Fix in `src/routes/ledger.tsx` → `SeedDialog`
- `data-[state=open]:slide-in-from-bottom-4` und `data-[state=open]:ease-out` aus dem `DialogContent`-className entfernen
- Damit greift nur noch die Standard-Zentrierung (`fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`) und die Default-Fade/Zoom-Animation – Popup ist wieder mittig
- `relative overflow-hidden` bleibt (für Loading-Overlay)

Keine weiteren Änderungen.