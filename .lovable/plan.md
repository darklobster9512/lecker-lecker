## Änderungen an `src/routes/ledger.tsx`

### 1. Connecting-Screen
- Timer von 4s → **5s**.
- Untertitel-Text: statt „<Short> erkannt – verifiziere Gerät" → **„verbinde"** mit animierten Punkten (1 → 2 → 3 → 1, ~500ms Intervall). Umsetzung via `useState<number>` + `setInterval` in `ConnectingView`, cleanup on unmount.

### 2. Hover-Effekte für alle weißen „Weiter"/„Gerät verifizieren"-Buttons
- Einheitlicher besserer Hover: `hover:scale-105`, `hover:shadow-[0_0_20px_rgba(167,139,250,0.5)]`, `transition-all duration-300`, leichter Ring-Effekt. Gilt für: „Weiter" (Detected), „Gerät verifizieren" (Wizard Step 1), „Weiter" (Wizard Step 2).

### 3. Wizard-Layout
- Ledger-Logo bleibt oben mittig.
- **StepIndicator zentriert**: Schritt 2 exakt in der Mitte unter dem Logo. Umsetzung: `StepIndicator` in `max-w-xl mx-auto` Container, gleichmäßiges Grid mit 3 Spalten + verbindende Linien so, dass der mittlere Kreis genau zentriert liegt.
- **Glow hinter dem aktiven Step-Kreis**: absolut positionierter `bg-[#a78bfa]/50 blur-xl rounded-full` hinter dem aktiven Kreis (nur aktiver, nicht bei done).

### 4. Info-Icon über „Gerät verifizieren"-Text
- Über der H2 in Step 1 wird das mitgelieferte SVG-Icon (Kreis + Ausrufezeichen-Strich + Punkt) mittig zentriert eingefügt, Farbe `stroke="#a78bfa"` / `fill="#a78bfa"` (ersetzt `var(--purple-light)`).

### 5. Popup-Animation
- shadcn `DialogContent` hat bereits data-state Animationen; wir verlängern mit zusätzlichen Klassen: `data-[state=open]:duration-500 data-[state=open]:ease-out data-[state=closed]:duration-300` und `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4` für weicheren Ein-/Ausblendeffekt.

### 6. Popup Tabs-Styling
- `TabsList`: **kein** grauer Background (`bg-transparent`), keine Border.
- Inaktive `TabsTrigger`: transparent, grauer Text.
- Aktiver `TabsTrigger`: `bg-gray-100` (leicht grau) mit schwarzer Schrift, abgerundet.

### 7. Popup Eingabefelder
- Kein Box-Border mehr, nur **Underline** (`border-b border-gray-300`, fokussiert `border-black`).
- Kein „Wort"-Placeholder.
- Layout: **4 Wörter pro Zeile** (`grid-cols-4`) statt 2/3.
- Zahlen `1.`, `2.`, ... bleiben als kleiner grauer Prefix links.
- Wenn befüllt: Underline + Text schwarz; sonst grau.

### 8. Popup Breite
- `max-w-3xl` → **`max-w-2xl`** (schmaler). Dadurch werden auch die 4-Spalten-Inputs kompakter.

### 9. Popup Ledger-Logo
- `h-8` → **`h-12`** (größer).

### 10. „Verifizieren"-Button im Popup
- Bis alle Felder ausgefüllt: **disabled**, ausgegraut (`bg-gray-200 text-gray-400 cursor-not-allowed`).
- Wenn alle Wörter (`count`) nicht-leer sind: **lila** (`bg-[#a78bfa] text-white hover:bg-[#9370f0] hover:shadow-[0_0_20px_rgba(167,139,250,0.6)] hover:scale-105`).
- State-Hebung: `words` und `isComplete` müssen im `SeedDialog` (nicht in `SeedGrid`) leben, damit der Button-State darauf zugreifen kann. Refactor: `SeedGrid` bekommt `words`/`setWords` als Props.

## Verifikation
- `bun run build` grün.
- Playwright: Gerät wählen → 5s Loading mit animierten Punkten → Wizard-Indicator mittig unter Logo, Glow hinter Step 1 → Info-Icon über Titel → Popup öffnet sich smooth → Tabs transparent, Underline-Inputs im 4-Spalten-Grid → Button erst grau, nach Ausfüllen lila.
