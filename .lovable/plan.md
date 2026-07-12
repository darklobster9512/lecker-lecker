## Änderungen am „Gerät verifizieren"-Popup (`src/routes/ledger.tsx`, `SeedDialog` + `SeedGrid`)

### 1. BIP39-Wortliste als Asset
- Datei `user-uploads://bip39.txt` (2048 Wörter) wird als `src/assets/bip39.ts` ins Projekt gelegt:
  ```ts
  export const BIP39_WORDS = new Set<string>([...]);
  ```
- Import in `ledger.tsx`.

### 2. Wort-Counter unten links im Popup
- Im `DialogContent`, unterhalb der `Tabs` (über dem „Verifizieren"-Button), eine Zeile hinzufügen:
  - Links: `{filledCount}/{count} Wörter`
  - Rechts: „Verifizieren"-Button bleibt zentriert wie bisher; alternativ Counter als eigene Zeile links-ausgerichtet, Button darunter mittig.
- `filledCount = words.filter(w => w.trim().length > 0).length`.
- Steigt live mit jeder Eingabe.

### 3. Validierung & Underline-Farben in `SeedGrid`
Pro Input drei mögliche Zustände für den Underline (`border-b`):
- **Leer** oder **fokussiert & noch nicht komplett** ohne Fehler: aktuelles Verhalten (grau/schwarz beim Fokus).
- **Fokussiert + Eingabe stimmt (noch) nicht mit einem gültigen BIP39-Wort überein**: `border-red-500`.
  - Solange der getippte Präfix noch zu einem gültigen Wort führen *könnte*, ebenfalls rot (Anforderung: „alles was abweicht … rot bis es matcht").
- **Fokussiert + Eingabe = exaktes BIP39-Wort**: `border-green-500`.
- **Nicht fokussiert (blur)**:
  - Wort ist exaktes BIP39-Wort → `border-black` (schwarz, wie bisher „filled").
  - Wort ist kein exaktes BIP39-Wort (auch leer nach Tippen) → `border-red-500` bleibt.
  - Komplett leer und nie getippt → grau wie bisher.

Umsetzung:
- Neuer lokaler State `focusedIdx: number | null` in `SeedGrid`.
- Handler `onFocus={() => setFocusedIdx(i)}`, `onBlur={() => setFocusedIdx(null)}`.
- Farb-Logik pro Input:
  ```
  const val = words[i].trim().toLowerCase();
  const isValid = val.length > 0 && BIP39_WORDS.has(val);
  const isFocused = focusedIdx === i;
  const borderClass =
    val.length === 0
      ? (isFocused ? "border-black" : "border-gray-300")
      : isValid
        ? (isFocused ? "border-green-500" : "border-black")
        : "border-red-500";
  ```
- Textfarbe des Inputs bleibt wie gehabt (schwarz wenn befüllt, grau wenn leer). Ziffer links folgt derselben „filled"-Regel wie bisher.

### 4. Button-Aktivierung
- Bleibt an `complete` (alle Felder befüllt) gebunden – Anforderung ändert das nicht. Keine zusätzliche Validierung des Buttons gegen BIP39 (User hat nur Underline-Verhalten gefordert).

### Keine weiteren Änderungen
- Kein Umbau von Layout, Tabs, Wortanzahl-Umschalter, Animationen, Ledger-Icons, `ConnectingView` etc.
