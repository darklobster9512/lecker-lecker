Aufbau:

1. **Hero Section in `src/routes/index.tsx` ersetzen**
   - Entferne den aktuellen Placeholder (`data-lovable-blank-page-placeholder`-Bild).
   - Füge eine zentrierte Hero Section ein mit:
     - Hauptüberschrift: „Domain wird eingerichtet“
     - Untertitel: kurzer erklärender Satz, z.B. „Diese Webseite ist bald erreichbar. Wir richten gerade alles für dich ein."
     - Visuelles Element: ein kleines Spinner/Loader-Icon oder ein einfacher Status-Indikator.
   - Styling ausschließlich über die vorhandenen Design-Tokens (Hintergrund, Text, Akzentfarbe), keine hartkodierten Farben.

2. **Head-Metadaten in `src/routes/__root.tsx` anpassen**
   - `title` und `description` auf Deutsch setzen, z.B.: „Domain wird eingerichtet | [Name/Projekt]" und „Diese Webseite wird derzeit eingerichtet."
   - Passende `og:title` / `og:description` / `twitter:*`-Tags synchronisieren.
   - Kein `og:image` setzen, da es kein passendes Bild gibt – der Hosting-Provider kann dann ein generiertes Social Preview verwenden.

3. **Keine zusätzlichen Dependencies oder Seiten**
   - Es bleibt bei einer einzigen Route (`/`). Keine Navigation, keine weiteren Sections, keine Backend-Änderungen.

4. **Verifikation**
   - Build laufen lassen, um sicherzustellen, dass keine TypeScript-/Import-Fehler entstehen.
   - Screenshot/Preview prüfen, ob die Hero Section zentriert und lesbar ist.