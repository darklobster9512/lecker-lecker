Aufbau:

1. **Runden Glow-Wrapper entfernen**
   - In `src/routes/ledger.tsx` wird der aktuelle `<div className="... rounded-full ... shadow-[...]">` um jedes Icon entfernt.
   - Das SVG wird direkt in der Card gerendert.

2. **CSS Drop-Shadow direkt auf die SVGs anwenden**
   - Jedes SVG bekommt eine Tailwind-Klasse für einen lila Drop-Shadow, z. B. `drop-shadow-[0_0_10px_#a78bfa]` oder ähnlich.
   - Alternativ eine Utility-Klasse in `src/styles.css` mit `filter: drop-shadow(...)`.
   - Der Schatten soll direkt hinter der Form des SVGs liegen, nicht als separater Kreis/Rahmen wirken.

3. **Verifikation**
   - Build ausführen.
   - Screenshot prüfen: Die SVGs werfen direkt hinter sich einen lila Schatten, ohne sichtbaren freien Raum oder runden Rahmen.