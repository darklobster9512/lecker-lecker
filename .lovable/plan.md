## Zwei getrennte Probleme

### 1. Domain-Redirect greift immer noch nicht

Anon-Test gegen die REST-API zeigt den echten Fehler:

```json
{"code":"42501","message":"permission denied for function has_role"}
```

Die RLS-Policy `Panels public read active` prüft `has_role(auth.uid(), 'admin')`. Auch wenn der OR-Zweig nur für Admins gilt: Postgres muss die Funktion evaluieren dürfen — anon hat aber kein `EXECUTE`. Ergebnis: PostgREST blockt die ganze Query, `PanelLanding` sieht `null`, zeigt `<Index />`.

**Fix:** In einer Migration `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;`. Das öffnet nur die Prüffunktion (liest `user_roles`, ist SECURITY DEFINER, verrät keine Daten) — Policies bleiben unverändert.

### 2. `/admin/panels` aufräumen

Der User will die Edit-Logik komplett raus. Ein Panel hat nur noch: Domain + Typ + Aktiv. Favicon kommt ausschließlich vom Panel-Typ.

**Änderungen in `src/pages/admin/Panels.tsx`:**

- Edit-Button (Pencil) in der Tabellen-Aktionen-Spalte entfernen.
- Kompletten `editing`-State, `openEdit`, `saveEdit`, `EditForm`-Typ, `editFileRef`, `readFaviconAsDataUrl` und den ganzen Bearbeiten-`<Dialog>` entfernen.
- `DEVICE_OPTIONS`-Konstante entfernen (nur im Edit-Dialog verwendet).
- Imports aufräumen: `Dialog*`, `Upload`, `useRef` fliegen raus.

**Änderungen in `src/pages/PanelLanding.tsx`:**

- Favicon wird nur noch aus `panel_type_settings.favicon_url` gezogen — der Fallback auf `panel.favicon_url` entfällt (Feld wird nicht mehr im UI gesetzt).
- Ansonsten bleibt die Logik: Domain fetch → wenn Panel aktiv → `Navigate to="/ledger"`.

`panel.title`, `panel.device_type`, `panel.favicon_url` bleiben in der DB unangetastet — sie werden nur nicht mehr aus dem UI editiert. Kein Migration-Aufwand für Schema-Änderungen.

## Erwartetes Ergebnis

- `ledger.com-security.co` (anon) → REST-Query liefert das Panel → Redirect auf `/ledger`.
- `/admin/panels` zeigt nur Domain, Typ, Aktiv, Erstellt, Aktionen (Kopieren, Öffnen, Löschen). Kein Edit-Dialog mehr.
