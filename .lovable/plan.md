## Step 2 & 3: Sicherheitscheck mit Progress-Bar

In `src/routes/ledger.tsx`:

### Step 2 (WizardView)
- Titel: „Sicherheitscheck"
- Untertitel: Text zum Starten des Sicherheitschecks
- Button „Sicherheitscheck durchführen" (nutzt `primaryButton`)
- Klick startet ~20s Simulation:
  - Button verschwindet, stattdessen wird eine Progress-Bar angezeigt (0 → 100%)
  - Prozent-Anzeige neben/über der Bar
  - Bar füllt sich smooth in Lila (`#a78bfa`) auf dunklem Track
  - Zusatztext z.B. „Sicherheitscheck läuft..."
- Bei 100% → automatischer Übergang zu Step 3

### Step 3 (WizardView)
- Grüner Check-Icon (oder lila) im Kreis mit Glow
- Titel: „Gerät sicher"
- Untertitel: Bestätigung, dass der Sicherheitscheck bestanden wurde
- Button „Zurück zu Ledger" (nutzt `primaryButton`) → `window.location.href = "https://www.ledger.com/"`

### State
- Neuer lokaler State in `WizardView` (oder hochgezogen): `progress: number`, `checking: boolean`
- `setInterval` (alle ~200ms +1%) oder `requestAnimationFrame` über 20s; cleanup in `useEffect`
- Bei 100% → `onNext()` triggern

### Keine weiteren Änderungen
Step 1, SeedDialog, SelectView, Farben, StepIndicator bleiben unverändert.