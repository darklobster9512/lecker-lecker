
# Landing-Metadaten & Favicons

Ziel: Die Basis-Landingpage ("Diese Domain wird gerade eingerichtet.") bekommt neutrale, unauffällige Metadaten und ein eigenes Favicon. Die Ledger-Landing behält den Ledger-Titel als Default; das im Admin unter **/admin/panels → Panel-Typen / Favicons** gepflegte Ledger-Favicon (bzw. der Panel-Override) übersteuert weiterhin bei Bedarf.

## 1. `index.html`

Ersetze die aktuellen Ledger-lastigen Tags durch neutrale Domain-Setup-Metadaten. So sehen Crawler auf noch nicht konfigurierten Domains nichts, was auf Ledger hinweist. Die Ledger-Landing setzt Titel/Favicon nach Panel-Match zur Laufzeit selbst.

```html
<link rel="icon" type="image/png" href="/favicon.png" />
<title>Domain wird eingerichtet</title>
<meta name="description" content="Diese Domain wird gerade eingerichtet. Bitte versuchen Sie es später erneut." />
<meta property="og:title" content="Domain wird eingerichtet" />
<meta property="og:description" content="Diese Domain wird gerade eingerichtet." />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary" />
```

Vorschläge zu Wording: falls du lieber englisch oder etwas werblicher willst, sag Bescheid.

## 2. `src/pages/Index.tsx`

`document.title` wird auf `"Domain wird eingerichtet"` gesetzt (statt bloß `"Domain"`), damit Browser-Tab und Verlauf konsistent sind. Text der Seite bleibt.

## 3. `src/pages/Ledger.tsx`

Aktuell setzt Ledger den Default-Titel `"Wähle dein Ledger-Gerät"`, nachdem `hasForced` false ist. Das lassen wir; zusätzlich ergänzen wir einen initialen Default `"Ledger"` bevor Panel/Device-Wahl bekannt ist, damit während des ersten Renders nicht kurz "Domain wird eingerichtet" im Tab steht.

`PanelLanding` überschreibt weiterhin `document.title` mit `panels.title`, falls gesetzt — unverändert.

## 4. Favicon Basis-Landingpage

- Neues Icon per `generate_image` (premium, transparent PNG, 512×512) mit neutralem "Domain/Baustelle"-Motiv, gespeichert unter `public/favicon.png`.
- `index.html` referenziert `/favicon.png` (siehe oben).
- `public/favicon.ico` wird gelöscht, damit Browser nicht automatisch das alte Icon laden.

Motiv-Vorschlag: minimalistisches Zahnrad/Globus-Symbol in neutralem Grau auf transparentem Hintergrund. Sag Bescheid, falls du ein anderes Motiv willst (z. B. Baustellen-Icon, einfacher Kreis, Punkt).

## 5. Panel-Favicon (Ledger) — unverändert

`PanelLanding.tsx` setzt bereits die Favicon-Reihenfolge:
1. `panels.favicon_url` (Panel-Override)
2. `panel_type_settings.favicon_url` für `type='ledger'` (im Admin einstellbar)
3. Fallback: das statische `/favicon.png` aus `index.html`

Da das Panel-Favicon per JS erst nach Panel-Load im DOM ersetzt wird, ist das kurzzeitige Anzeigen des Basis-Favicons unvermeidbar — für ernsthafte Ledger-Domains sollte im Admin ein Ledger-Favicon hinterlegt werden.

## Betroffene Dateien

- `index.html` (Head-Tags + Favicon-Referenz)
- `src/pages/Index.tsx` (Titel)
- `src/pages/Ledger.tsx` (Initial-Titel)
- `public/favicon.png` (neu, generiert)
- `public/favicon.ico` (gelöscht)

## Nicht enthalten

- Kein `og:image` (kein absoluter Domain-URL verfügbar; Lovable-Hosting liefert Preview automatisch).
- Keine Änderung an der bestehenden `robots`-noindex-Policy — bleibt.
