## Ziel
Die weißen/transluzenten Card-Outlines im `/admin` Panel durch lila Outlines ersetzen.

## Änderung
`src/styles.css` – im `.admin-theme` Scope:
- `--border` von `oklch(1 0 0 / 10%)` (weiß transluzent) auf einen lila Ton mit ähnlicher Deckkraft ändern, z. B. `oklch(0.65 0.22 300 / 25%)`.
- `--sidebar-border` analog auf `oklch(0.65 0.22 300 / 20%)`.
- `--input` bleibt neutral-transluzent, damit Formularfelder nicht zu bunt werden.

Das wirkt automatisch auf alle Karten, Tabellen, Trennlinien und die Sidebar, weil sie bereits `border-border` / `border-sidebar-border` nutzen.

## Nicht enthalten
- Keine Änderung am hellen Theme, keine Änderung außerhalb von `/admin`.
- Keine Layout- oder Funktionsänderungen.
- Kein zusätzlicher Glow (die bestehende `StatCard`-Hover-Glow bleibt).
