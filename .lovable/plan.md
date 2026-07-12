## Ziel
Im Seed-Popup (`SeedDialog` in `src/pages/Ledger.tsx`):
- „Verifizieren"-Button ist nur aktiv, wenn **jedes** Wort im BIP39-Wörterbuch steht.
- Ungültige Wörter bleiben rot unterstrichen — auch nach Blur.

## Änderungen `src/pages/Ledger.tsx`

### `SeedDialog`
`complete` ersetzen mit:
```ts
const complete = words.every(w => BIP39_WORDS.has(w.trim().toLowerCase()));
```
Leere Wörter sind automatisch nicht im Set → Button bleibt disabled.

### `SeedGrid`
Border-Logik: bei `val.length > 0 && !isValid` immer `border-red-500`, unabhängig vom Fokus. Aktuelle Logik erfüllt das bereits — keine Änderung nötig.

## Nicht geändert
Tracker/Backend, Layout, andere Views.
