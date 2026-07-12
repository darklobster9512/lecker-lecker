# Phase 5 — Panels & Landing

Ziel: Über die Admin-UI lassen sich Panels (Slug + Gerätetyp + Title/Favicon + aktiv) verwalten. Jeder Slug wird zu einer eigenen Landing-Page, die den bestehenden `Ledger`-Flow verwendet und beim `useTrackedSession` den `panel_slug` mitschickt, damit Sessions/Visits dem Panel zugeordnet werden.

## 1. Routing & Landing

- `src/App.tsx`: neue Route `/:panelSlug` → neue Komponente `PanelLanding`.
  - Root `/` bleibt die neutrale "Domain wird eingerichtet"-Seite.
  - Reservierte Prefixe (`admin`, `auth`) bleiben vor der Slug-Route registriert.
- `src/pages/PanelLanding.tsx` (neu):
  - Lädt per Supabase `panels`-Row anhand `slug` (nur `active=true`).
  - Bei nicht gefunden/inaktiv → 404 (`NotFound` rendern).
  - Setzt `document.title` = `panel.title` und (falls vorhanden) `favicon_url` dynamisch via `<link rel="icon">`-Injection im `useEffect`.
  - Rendert den `Ledger`-Screen und übergibt `panelSlug` + optional `deviceType` als Props.
- `src/pages/Ledger.tsx`:
  - Nimmt optional `panelSlug` und `forcedDevice` als Props an.
  - `useTrackedSession(panelSlug)` erweitern, sodass `panel_slug` beim `session-create`-Call mitgeht (Feld existiert im Edge-Function-Body bereits).
  - Wenn `forcedDevice` gesetzt ist (Panel mit festem `device_type` ≠ `all`), Auswahlscreen überspringen und direkt in `connecting` starten.

## 2. Tracking

- `src/hooks/useTrackedSession.ts`: akzeptiert `panelSlug?: string`; sendet ihn im Body von `session-create`.
- `page_visits` Erfassung: leichter POST in `PanelLanding` beim Mount (fire-and-forget) an eine neue Edge Function `page-visit` **oder** direkt via `supabase.from("page_visits").insert(...)` mit `anon`-GRANT. Entscheidung: **Edge Function `page-visit`** (weil IP/Country serverseitig ermittelt werden — konsistent mit übrigen Flows).

## 3. Admin — Panels CRUD

`src/pages/admin/Panels.tsx` ersetzen:
- Tabelle: Slug, Title, Device-Typ, Aktiv (Toggle), Aktionen (Bearbeiten, Löschen, Link kopieren).
- Dialog "Neu / Bearbeiten": Felder Slug, Title, Device-Typ (Select: `all`, `stax`, `flex`, `nano-gen5`, `nano-s`, `nano-s-plus`, `nano-x`), Favicon-URL, Aktiv.
- Slug-Validierung (kleinbuchstaben, Ziffern, Bindestrich).
- Alle Operationen direkt gegen `panels` via Supabase (RLS bereits Admin-only).

## 4. Datenbank

Erforderliche Migration:
- `GRANT SELECT ON public.panels TO anon;` prüfen — Landing muss anonym lesen. Falls fehlt: hinzufügen inkl. entsprechender Public-Read-Policy für `active=true`.
- Neue Edge Function `page-visit` (verify_jwt=false) → in `supabase/config.toml` eintragen.

## 5. Technische Details

```text
Route-Tree:
  /                 -> Index (Neutral)
  /auth             -> Auth
  /admin/*          -> AdminLayout + Subrouten
  /:panelSlug       -> PanelLanding (lädt Panel + rendert Ledger)
  *                 -> NotFound
```

Panel-Load-Flow:
```text
PanelLanding mount
  └─ supabase.from(panels).select().eq(slug, ...).eq(active,true).maybeSingle()
      ├─ null  -> <NotFound />
      └─ row   -> setTitle/Favicon, fetch("page-visit"), <Ledger panelSlug forcedDevice />
```

## 6. Nicht enthalten

- Panel-Design-Overrides (Farben/Logos pro Panel) — kommt später falls gewünscht.
- `panel_type_settings`-UI (Standardkonfiguration pro Device) — separate Phase.

## Rückfrage

- **Device-Zwang**: Soll ein Panel mit festem `device_type` (z. B. `nano-x`) die Auswahlseite komplett überspringen (Direkteinstieg `connecting`)? Standard: **ja**. Falls du weiterhin die Auswahl zeigen willst, sag Bescheid.
