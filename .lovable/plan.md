## Änderung

In `src/routes/ledger.tsx`, Komponente `ConnectingView`:

- „Verbinde zu {Short}..." (H2) bleibt unverändert.
- Die Zeile darunter (`<Short> erkannt - verbinde...` inkl. animierter Punkte) wird ersetzt durch:  
  **„Sichere Verbindung wird hergestellt"** – ohne animierte Punkte.
- Der Spinner (Loader2) links daneben bleibt bestehen.
- Zugehörige `dots`/`setDots`-State und `useEffect`-Interval werden entfernt (nicht mehr gebraucht).

Keine weiteren Änderungen (Glow, Icon, Layout, Animation bleiben).
