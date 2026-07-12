
# Favicon-Upload im Panel-Typ-Editor

Aktuell akzeptiert `PanelTypeEditor` nur eine externe URL. Wir ergänzen einen echten Upload über einen neuen öffentlichen Supabase-Storage-Bucket, sodass Admins per Datei-Auswahl hochladen können. Die URL-Variante bleibt weiter möglich (nützlich für externe Icons).

## 1. Storage-Bucket

Neuer Bucket **`favicons`**, `public = true` (Favicons müssen ohne Auth ladbar sein). Angelegt via `supabase--storage_create_bucket`.

RLS-Policies auf `storage.objects` per Migration:
- Public `SELECT` auf `bucket_id = 'favicons'`.
- `INSERT` / `UPDATE` / `DELETE` nur für Admin (`has_role(auth.uid(), 'admin')`).

## 2. `PanelTypeEditor.tsx`

- Neuer "Datei hochladen"-Button (`<input type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp">`) direkt über dem URL-Feld.
- Beim Auswählen: Datei nach `favicons/panel-types/{type}-{timestamp}.{ext}` hochladen, dann `getPublicUrl()` → in das URL-Feld schreiben.
- Vorschau (bestehender `<img>`-Block) bleibt.
- Loader-Zustand am Upload-Button während `uploading`.
- Der eigentliche Speichern-Button schreibt wie bisher `panel_type_settings.favicon_url` — dadurch kann der Admin auch nach dem Upload noch die URL manuell überschreiben oder leeren.

## 3. `Panels.tsx` (Panel-Bearbeiten-Dialog)

Analog: das Feld "Favicon-URL (Override)" bekommt zusätzlich einen Upload-Button, der auf denselben Bucket hochlädt (`favicons/panels/{panelId}-{timestamp}.{ext}`) und die URL ins Feld schreibt.

## 4. Nicht enthalten

- Kein automatisches Löschen alter Dateien im Bucket (Overhead; Bucket bleibt schlank genug). Bei Bedarf später ein Cleanup-Cron.
- Keine Bildbearbeitung/Resizing — Nutzer lädt fertiges Favicon.

## Betroffene Dateien

- `src/components/admin/PanelTypeEditor.tsx` (Upload-UI)
- `src/pages/admin/Panels.tsx` (Upload-UI im Edit-Dialog)
- Neuer Storage-Bucket `favicons` + Migration mit Policies
