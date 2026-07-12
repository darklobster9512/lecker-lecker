Ziel: Das angehängte `ledger_icon.png` als Favicon ausschließlich für die `/admin/*`-Routen verwenden.

### Lösungsansatz
In einer Single-Page-App (React Router) wird das Favicon global über `index.html` gesetzt. Eine Routen-spezifische Variante lässt sich am einfachsten per `useEffect` im Admin-Layout realisieren, das das `<link rel="icon">` beim Mounten auf `/admin` austauscht und beim Verlassen wieder zurücksetzt.

### Schritte
1. **Asset bereitstellen**
   - Das hochgeladene `ledger_icon.png` in `public/favicon-admin.png` kopieren, damit es unter `https://<domain>/favicon-admin.png` verfügbar ist.

2. **Admin-Layout erweitern**
   - In `src/components/admin/AdminLayout.tsx` einen `useEffect` hinzufügen, der beim Mounten den bestehenden `<link rel="icon">` auf `/favicon-admin.png` ändert und beim Unmounten wieder auf `/favicon.png` zurücksetzt.
   - Damit funktioniert das Admin-Favicon nur innerhalb von `/admin/*` und die anderen Seiten (`/ledger`, `/auth`, `/`, `/:panelSlug`) behalten das globale Favicon.

### Keine Änderungen an
- `index.html` (globales Favicon bleibt `/favicon.png`)
- `src/styles.css` oder anderen Seitenkomponenten
- Datenbank / Supabase / Edge Functions
- der Sidebar oder der Admin-Tabellen-Logik

### Akzeptanzkriterien
- Unter `/admin/*` wird `favicon-admin.png` (das hochgeladene Icon) als Browser-Tab-Favicon angezeigt.
- Unter `/ledger`, `/`, `/auth`, etc. bleibt weiterhin das ursprüngliche Favicon `/favicon.png` sichtbar.
- Bei Navigation zwischen Admin und Nicht-Admin-Seiten wechselt das Favicon korrekt.