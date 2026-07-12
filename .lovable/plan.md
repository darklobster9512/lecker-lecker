## Ziel
Alle weißen Card-Outlines im gesamten `/admin` Panel werden eindeutig und vollständig lila.

## Änderung
`src/styles.css` im `.admin-theme` Scope:
- `--border` wird nicht mehr transparent/weißlich, sondern voll lila gesetzt: `oklch(0.65 0.22 300)`.
- `--sidebar-border` wird ebenfalls voll lila gesetzt.
- `--input` optional ebenfalls lila, falls Input-Ränder aktuell weiß wirken.

Zusätzlich, falls einzelne Cards eigene schwache Border-Klassen haben:
- `src/components/admin/StatCard.tsx`: `border-border/70` entfernen und auf normale Token-Border lassen, damit die volle lila Border greift.

## Nicht enthalten
- Keine Funktionsänderungen.
- Keine Layoutänderungen.
- Keine Änderung außerhalb von `/admin`.