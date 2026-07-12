Aufbau:

1. **Schatten/Glow schwächer machen in `src/routes/ledger.tsx`**
   - Drop-Shadow auf allen sechs SVGs reduzieren, z. B. auf `drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]` oder noch dezenter.

2. **Titel lila einfärben**
   - Die `<h1>`-Überschrift erhält die Akzentfarbe, z. B. `text-[#a78bfa]`.

3. **Untertitel verkleinern**
   - Schriftgröße der `<p>` von `text-lg` auf `text-base` oder `text-sm` reduzieren, sodass der Satz bei Desktop-Breite in einer Zeile bleibt.

4. **Verifikation**
   - Build ausführen.
   - Screenshot prüfen: Schatten dezent, Titel lila, Untertitel in einer Zeile.