Aufbau:

1. **Texte auf Deutsch ändern in `src/routes/ledger.tsx`**
   - Titel: „Wähle dein Ledger-Gerät"
   - Untertitel: „Wähle das Gerät, das du besitzt, um dich sicher zu verbinden und fortzufahren."
   - Head-Metadaten (title, description, og:title, og:description) ebenfalls auf Deutsch synchronisieren.

2. **Lila Glow hinter jedem SVG-Icon im Device-Grid**
   - Um jedes Icon wird ein Wrapper mit einem dezenten, lila-farbenen Schatten/Glow hinzugefügt.
   - Farbe: `#a78bfa` mit niedriger Opazität (z. B. via `box-shadow` oder Tailwind-`shadow`-Utility mit passender Farbe).
   - Der Glow soll dezent sein und nicht ablenken.
   - Keine hartkodierten Inline-Styles; stattdessen Tailwind-Utilities oder eine kleine CSS-Klasse in `src/styles.css`.

3. **Verifikation**
   - Build ausführen, um sicherzustellen, dass keine Fehler auftreten.
   - Screenshot/Preview prüfen: Deutsche Texte korrekt, Glow hinter Icons sichtbar.