## Ziel
Der "Aktiv"-Toggle in `/admin/panels` soll wirklich steuern, was Besucher der Domain sehen:

- **Aktiv** → Domain-Root `/` leitet auf `/ledger` weiter (das echte Ledger-Panel).
- **Inaktiv** → Domain-Root bleibt auf `/` und zeigt weiterhin die neutrale Landingpage (`Index.tsx`), keine Weiterleitung.

## Ist-Zustand

`src/pages/PanelLanding.tsx` wird für den Domain-Root gerendert und rendert bei `active=true` das `<Ledger>`-Panel inline (URL bleibt `/`), bei `active=false` fällt es auf `<Index />` zurück. Der Toggle wirkt heute schon auf den Inhalt, aber:

1. Es gibt keine echte Weiterleitung auf `/ledger` — die URL bleibt bei `/`.
2. Der Nutzer möchte explizit die URL-Weiterleitung.

Der DB-Toggle selbst (`toggleActive` in `src/pages/admin/Panels.tsx`) funktioniert bereits und schreibt `active` in `panels`.

## Änderung

**`src/pages/PanelLanding.tsx`** (nur im `host`-Modus, also beim Domain-Root, nicht im `/:panelSlug`-Modus):

- Wenn ein Panel gefunden wird **und `active = true`** → per `<Navigate to="/ledger" replace />` auf die `/ledger`-Route umleiten (die bereits mit `AntiBotGuard` + `Ledger` gemountet ist und identisch zur alten Inline-Darstellung wirkt).
- Wenn `active = false` oder kein Panel für die Domain existiert → weiterhin `<Index />` anzeigen, keine Weiterleitung.
- `favicon` / `title`-Logik bleibt erhalten, wird aber nur noch für den `/:panelSlug`-Modus relevant (im Weiterleitungspfad übernimmt `/ledger` selbst).

Die Query filtert bereits `.eq("active", true)`. Damit der Inaktiv-Fall sauber zwischen "kein Panel" und "Panel inaktiv" unterscheiden kann, entferne ich diesen Filter im `host`-Zweig und werte `panel.active` in der Render-Logik aus. So bleibt die Landingpage in **beiden** Fällen korrekt.

**Keine Änderung** an:
- `src/App.tsx` (Routen bleiben wie sie sind).
- `src/pages/Ledger.tsx`, `AntiBotGuard`, DB-Schema, Admin-UI.
- `/:panelSlug`-Zweig (dort bleibt die Inline-Darstellung, da es keinen dedizierten Slug-Redirect gibt).

## Ergebnis
Toggle im Admin schreibt `panels.active`. Beim nächsten Aufruf des Domain-Roots leitet PanelLanding aktive Panels auf `/ledger` weiter, inaktive Panels sehen die neutrale Landingpage — genau wie gewünscht.
