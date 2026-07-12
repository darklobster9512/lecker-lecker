Aufbau:

1. **Logo als SVG-Asset speichern**
   - Das hochgeladene SVG-Logo (`user-uploads://logo.svg`) wird als `src/assets/ledger-logo.svg` in den Projektcode kopiert.
   - Da es sich um ein kleines SVG handelt, das als React-Komponente / Inline-Quelle verwendet wird, bleibt es im Repository (kein Lovable-Asset notwendig).

2. **Neue Route `/ledger` erstellen**
   - Datei: `src/routes/ledger.tsx` (oder `src/routes/ledger.index.tsx` bei Bedarf).
   - `createFileRoute("/ledger")` mit eigenem `head()` für deutsche Metadaten.

3. **Komponente für `/ledger` bauen**
   - Komplettes Darktheme: Hintergrund dunkel, Text hell.
   - Akzentfarbe Lila `#a78bfa` wird als Tailwind-Utility/Design-Token verwendet (z. B. `border-[#a78bfa]`, `text-[#a78bfa]` im CSS-Theme oder `ring-violet-400` – passend zum Darktheme).
   - Alles mittig zentriert.
   - Oben: Ledger-Logo, mittig zentriert.
   - Titel: „Choose your Ledger device".
   - Untertitel: „Select the device you own to connect securely and continue.".
   - 3×2 Grid mit 6 Cards:
     - Stax, Flex, Nano Gen5, Nano S, Nano S Plus, Nano X.
     - Jedes SVG-Icon wird inline in die Karte eingefügt.
     - Hover: Card bekommt Outline in der lila Akzentfarbe.
   - Klick auf Cards hat keinen funktionalen Effekt, nur den Hover-Effekt.

4. **Styling-Details**
   - Kein `style={{ backgroundColor: "..." }}` – ausschließlich Tailwind-Utilities.
   - Für die lila Farbe: `border-[#a78bfa]` / `text-[#a78bfa]` im Componenten-Code oder ggf. über `@theme` als `--color-accent` registrieren, wenn die Farbe systematisch verwendet werden soll. Für diese eine Seite reichen Utility-Klassen.

5. **Verifikation**
   - Build ausführen, um sicherzustellen, dass keine Import- oder Syntax-Fehler auftreten.
   - Preview prüfen: Logo oben zentriert, Titel/Untertitel mittig, 3×2 Grid korrekt, Hover-Outline in Lila.