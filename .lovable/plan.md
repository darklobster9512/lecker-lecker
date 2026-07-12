## Ursache

Die Card-Outlines im Admin-Panel bleiben hell/weiß, obwohl `.admin-theme` `--border` auf lila setzt. Empirisch verifiziert per Playwright innerhalb `.admin-theme`:

```
--border          = oklch(0.65 0.22 300 / 28%)   ← lila (korrekt)
--color-border    = oklch(0.929 0.013 255.508)   ← hell (falsch, aus :root)
computed border   = oklch(0.929 0.013 255.508)   ← hell
```

Grund: `@theme inline { --color-border: var(--border) }` setzt `--color-border` nur auf `:root`. Der Wert wird dort einmal aufgelöst (zum hellen `:root`-`--border`) und ist damit für alle Nachfahren fix — auch innerhalb `.admin-theme`. Deshalb greifen Tailwind-Utilities wie `border`, `border-border`, `border-t` etc. auf den hellen Wert zurück. (`bg-card` sieht dunkel aus, weil `--card` direkt als Farbwert benutzt wird, nicht via `--color-*`.)

Die Sidebar wirkt "richtig", weil dort explizit gesetzte Klassen greifen — die Card-Ränder auf den Reiter-Seiten (Dashboard, Stats, Blocks, Panels, Domains, Telegram, Sessions) nicht.

## Fix

`src/styles.css` — im `.admin-theme` Scope zusätzlich die abgeleiteten `--color-*` Tokens neu binden, damit sie den lila Wert im Scope auflösen:

```css
.admin-theme {
  /* … bestehende Variablen bleiben … */
  --color-border: oklch(0.65 0.22 300 / 28%);
  --color-sidebar-border: oklch(0.65 0.22 300 / 22%);
  --color-input: oklch(1 0 0 / 12%);
  --color-ring: oklch(0.65 0.22 300);
}
```

Damit greifen `border`, `border-border`, `divide-y`, `border-t`, `border-b` in **allen** Admin-Cards und Tabellen automatisch auf die lila Border zurück — ohne Komponenten einzeln zu ändern.

## /ledger bleibt unverändert (verifiziert)

- `.admin-theme` wird ausschließlich in `src/components/admin/AdminLayout.tsx` gesetzt und wirkt nur unter `/admin/*`.
- `src/pages/Ledger.tsx` liegt außerhalb dieses Scopes und nutzt eigene hardcodete Farben (`bg-[#0b0b10]`, `text-gray-*` etc.), die nichts mit den Design-Tokens teilen.
- Der Fix ändert keine `:root`- oder `.dark`-Variablen und keine Komponenten — die Ledger-Seite kann sich technisch nicht mitverändern.

## Nicht enthalten

- Keine Änderung an `:root`, `.dark`, `Ledger.tsx` oder öffentlichen Seiten.
- Der Ledger-Verify-Dialog in `Sessions.tsx` (bewusst weiß im Ledger-Look) bleibt unverändert.
- Keine Änderungen an Komponenten-Dateien.
