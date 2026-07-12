## Ziel
Mobile-Optimierung der `/ledger`-Seite. Desktop bleibt unverändert.

## Layout Mobile
- **Header (sticky/oben):** Ledger-Logo mittig zentriert, direkt darunter der Wizard-Step-Indicator (kompakter).
- **Content:** bleibt weiterhin mittig im Screen (Text + Button).
- Trennen: Logo + StepIndicator wandern aus der `WizardView`-Content-Box in einen eigenen Header-Bereich oben. Auf Desktop bleibt alles wie bisher.

## Änderungen in `src/pages/Ledger.tsx`

### `Ledger` Root (`<main>`)
- Struktur auf Mobile: `<header>` oben (Logo + StepIndicator wenn `view === "wizard"`), dann flex-1 zentrierter Content.
- Padding oben auf Mobile reduzieren (`pt-6` statt `py-16`).

### `WizardView`
- Logo + `<StepIndicator>` in einen wiederverwendbaren Header rausziehen und auf Mobile im äußeren Header rendern. Auf Desktop (`sm:`) bleibt Logo+Indicator im Content-Bereich wie jetzt.
- Umsetzung: Logo/StepIndicator im äußeren `Ledger`-Header mit `sm:hidden`, im `WizardView` mit `hidden sm:flex`.

### `StepIndicator`
- Mobile-Variante: kleinere Kreise (`h-7 w-7` statt `h-10 w-10`), Labels unter den Kreisen kleiner (`text-[10px]`) und schmaler (`w-20`), engere Abstände. Desktop-Größen via `sm:`-Prefix erhalten.

### `SeedDialog` (Popup)
- Auf Mobile Full-Screen: `DialogContent` mit `h-screen w-screen max-w-none max-h-none rounded-none sm:h-auto sm:w-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-lg`.
- Innerer Container scrollbar (`overflow-y-auto`) und Padding an Mobile anpassen (`p-5 sm:p-10`).
- Verifizieren-Button auf Mobile am unteren Rand mit sticky/ausreichend Abstand.

## Nicht geändert
- `SelectView`, `ConnectingView`, `DetectedView`, Business-Logik, Tracking, Edge Functions, DB.
