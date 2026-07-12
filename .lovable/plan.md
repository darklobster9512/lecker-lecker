## Hover-Effekt der Buttons vereinfachen

In `src/routes/ledger.tsx`:

### 1. `primaryButton` (weiße Buttons: "Weiter" in DetectedView, "Gerät verifizieren" in WizardView)
Aktuell:
```
hover:scale-105 hover:bg-white hover:shadow-[0_0_25px_rgba(167,139,250,0.6)]
```
Neu: Button färbt sich beim Hover lila (Hintergrund `#a78bfa`, Text weiß). Kein Scale, kein Glow-Shadow.

### 2. "Weiter"-Button in WizardView Step 2
Nutzt bereits `primaryButton` → automatisch mitgeändert.

### 3. "Verifizieren"-Button im SeedDialog
Aktuell (wenn `complete`):
```
hover:scale-105 hover:bg-[#9370f0] hover:shadow-[0_0_25px_rgba(167,139,250,0.6)]
```
Neu: Button ist bereits lila – Hover behält lila Farbe (evtl. leicht dunkler `#9370f0`), aber **kein Scale, kein Glow-Shadow**.

### Keine weiteren Änderungen
Geräte-Karten-Hover in `SelectView`, Layout, Logik, Farben im Ruhezustand bleiben unverändert.
