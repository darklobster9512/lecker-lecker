## Ziel
Das `/admin` Panel bekommt einen einheitlichen Dark-Look mit Lila-Akzentfarbe – passend zur Ledger-Landing. Nur Optik, keine Funktions- oder Layout-Änderungen.

## Ansatz
Statt das globale Theme umzustellen (das würde die öffentliche Ledger-Seite kaputt machen), scopen wir das Dark-Theme auf `/admin` über eine Wrapper-Klasse in `AdminLayout`. Alle Admin-Seiten nutzen bereits Tailwind-Tokens (`bg-background`, `bg-card`, `text-muted-foreground`, `bg-sidebar`, …), daher reicht ein neuer Token-Satz.

### 1. `src/styles.css`
- Neuen Scope `.admin-theme` ergänzen (analog zu `.dark`), der alle Farb-Tokens auf Dark + Lila überschreibt:
  - `--background`: sehr dunkles Neutral (fast schwarz, minimaler Lila-Stich)
  - `--card`, `--popover`: leicht helleres dunkles Panel
  - `--sidebar`: eigener, noch dunklerer Ton mit lila `--sidebar-primary` und `--sidebar-accent`
  - `--primary`, `--ring`, `--sidebar-primary`: Ledger-Lila (ca. `oklch(0.62 0.22 300)`)
  - `--accent`: gedämpftes Lila für Hover-Zustände
  - `--muted`, `--secondary`: dunkelgraue Panels
  - `--border`, `--input`: transluzentes Weiß mit leichter Lila-Tönung
  - Chart-Farben auf lila/violett/pink-Palette (für Stats-Charts)
- Keine Änderung an `:root` oder `.dark`.

### 2. `src/components/admin/AdminLayout.tsx`
- Wurzel-`div` bekommt zusätzlich Klasse `admin-theme dark` (`dark` aktiviert automatisch alle bestehenden `dark:`-Utility-Klassen in shadcn-Komponenten, `admin-theme` liefert unsere Lila-Werte).
- Sidebar-Header: dezenter Lila-Glow (Border-Bottom + kleines Ledger-Wordmark).
- Aktiver Nav-Link: lila Hintergrund/Text statt Standard-Accent.
- Icons in aktivem Nav-Link leicht heller.

### 3. Feinschliff auf einzelnen Seiten (nur Klassen-Anpassungen, keine Logik)
- `src/pages/admin/Dashboard.tsx`, `Stats.tsx`, `Sessions.tsx`, `Blocks.tsx`, `Telegram.tsx`, `Panels.tsx`, `Domains.tsx`:
  - Ersetze verbliebene hartcodierte Farben (`bg-muted/30`, `bg-muted/50`, `text-black`, o. ä.) durch Tokens, falls sie im Dark-Theme schlecht aussehen.
  - `StatCard`-Komponente: dezenter lila Rand/Glow auf Hover.
  - Tabellen-Header (`bg-muted/50`) und Zeilen-Hover einheitlich abstimmen.
- `src/pages/Auth.tsx` bleibt unverändert (nicht Teil von `/admin`).

### 4. Optional-Detail
- Sanfter Radial-Gradient (`bg-[radial-gradient(...)]`) hinter der Hauptbühne im `AdminLayout`, sehr dezent, um das Ledger-Feeling zu treffen.

## Nicht enthalten
- Keine Änderung an der öffentlichen `/` bzw. `/panel/*`-Route.
- Keine neuen Komponenten, keine Layout-Umbauten, keine Nav-Änderungen.
- Kein Umbau von Charts (nur Farb-Tokens werden angepasst).
- Kein Refactor oder Umbenennungen.
