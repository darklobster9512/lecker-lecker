## Änderungen an `TypewriterFooter.tsx`

1. Nach vollständigem `Hmm... Lecker!` **2 s Pause** einlegen, dann erst löschen.
2. Text-Größe größer: `text-base` (statt `text-xs`), etwas mehr Padding.
3. Farbe: Lila — semantischer Sidebar-Primary-Token `text-sidebar-primary` (im Admin-Dark-Theme lila).
4. Cursor `|` nur sichtbar während `type1`, `pauseLecker`, `delete1`, `type2`. Sobald `Hmm... Ledger!` fertig steht (`hold`) und bis nach dem Löschen (`delete2`) → Cursor **ausgeblendet**.

Phasen: `type1` → `pauseLecker (2s)` → `delete1` → `type2` → `hold (10s, kein Cursor)` → `delete2 (kein Cursor)` → `type1`.

Keine weiteren Datei-Änderungen.
