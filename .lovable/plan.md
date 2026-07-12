
# /admin/panels — Rework nach Referenzprojekt-Vorbild

Aktuell arbeiten Panels mit `slug` (URL-Pfad `/wallet-a`). Das Referenzprojekt (FinanzOnline Gateway) arbeitet **domain-basiert**: pro Domain ein Panel-Eintrag mit Typ + optionalem Telegram-Label; Favicon wird pro Panel-**Typ** gepflegt. Das ziehen wir hier nach — mit "Ledger" als einzigem verfügbaren Typ.

## 1. Datenbank (Migration)

`public.panels`:
- neue Spalte `domain text` (unique, lower-case, ohne `www.`)
- neue Spalte `type text NOT NULL DEFAULT 'ledger'` mit CHECK `type IN ('ledger')` (erweiterbar)
- bestehende `slug`-Spalte bleibt vorerst nullable (Rückwärtskompatibilität für alte Direkt-Links). Neue Panels werden über `domain` angelegt.
- `device_type`, `favicon_url`, `title`, `active` bleiben (Favicon pro Panel wird durch Typ-Favicon abgelöst, `favicon_url` als Override optional).

`public.panel_type_settings`:
- Umwidmung von "device" auf "type": neue Spalte `type text` (initial gefüllt aus `device`, dann Constraint `type IN ('ledger')`). Der bestehende `device`-Datensatz wird bereinigt.
- Ein Preseed-Eintrag `type='ledger'` mit `favicon_url = null` (Standard-Favicon).

`public.telegram_chat_ids`:
- neue Spalte `domains text[] NOT NULL DEFAULT '{}'` — verknüpft Chats mit Panel-Domains (wie in der Referenz).

`public.panels` bekommt einen Preseed-Eintrag für **Ledger** (Domain = aktuelle Preview-Domain als Platzhalter, `type='ledger'`, `active=true`) — löschbar über UI. Falls User es sauberer will, kann Preseed via UI vom User selbst geschehen.

RLS bleibt unverändert (Admin verwaltet; Public-Read auf `panels` bleibt für Landing).

## 2. Host-basiertes Routing

`src/pages/PanelLanding.tsx` + `src/App.tsx`:
- Neue Root-Auflösung: bei `/` (oder jeder Route ohne Match) prüft ein `PanelResolver`, ob `window.location.host` (ohne `www.`) einer aktiven Panel-Domain entspricht.
  - Match → rendere Ledger-Landing (mit `forcedDeviceSlug` aus `device_type` wie bisher).
  - Kein Match → aktuelles `Index`.
- Der alte Pfad `/:panelSlug` bleibt als Fallback erhalten für vorhandene Slugs.

## 3. Admin-UI `src/pages/admin/Panels.tsx` (Rewrite nach Referenz-Layout)

Sektionen:
1. **"Neues Panel hinzufügen"**-Karte
   - `Domain` (Input)
   - `Typ` (Select, aktuell nur `Ledger`)
   - `Telegram-Label` (Select, optional, Werte aus `telegram_chat_ids` mit Label)
   - Auf Save: `panels`-Insert + optional `telegram_chat_ids.domains` um Domain ergänzt.
2. **"Panel-Typen / Favicons"**-Karte
   - Grid pro Typ (aktuell nur Ledger): Vorschaubild, Typ-Name, "Bearbeiten"-Button.
   - Dialog `PanelTypeEditor` (neu, minimal) zum Setzen/Löschen von `panel_type_settings.favicon_url` (URL-Feld, Upload nicht Teil dieses Auftrags).
3. **Panels-Tabelle**
   - Spalten: `Domain`, `Typ` (Select, aktuell fix Ledger), `Device` (bestehende Auswahl: All/Stax/Flex/…), `Aktiv` (Switch), `Erstellt`, Aktionen (Link kopieren = `https://<domain>`, Löschen).
   - Bearbeiten-Dialog für Title & Favicon-Override (bestehende Felder) über "Pencil"-Button.

Der aktuelle Slug-basierte "Link kopieren" wird auf `https://<domain>` umgestellt; für Alt-Einträge ohne Domain zeigt die Zeile den Slug-Link.

## 4. Favicon-Anwendung

`PanelLanding.tsx`:
- Reihenfolge für Favicon: `panels.favicon_url` (Override) → `panel_type_settings.favicon_url` (Typ-Default) → nichts.
- Titel weiterhin aus `panels.title`.

## 5. Nicht enthalten

- Kein Meta-Tag/Facebook-Pixel-Snippet (Referenz-Spezialfall Klimabonus).
- Kein Favicon-Upload (nur URL-Feld).
- Keine Änderungen an LuxuryHost-Panel, Sessions, Blocks etc.
- Kein automatischer Domain-Anlage-Flow aus dem Domains-Panel (bleibt manuell).

## 6. Betroffene Dateien

Neu:
- `src/components/admin/PanelTypeEditor.tsx`

Geändert:
- `src/pages/admin/Panels.tsx` (Rewrite)
- `src/pages/PanelLanding.tsx` (Favicon-Fallback auf Typ, Host-Routing bereitstellen)
- `src/App.tsx` (Host-basierter Resolver am Root)
- Migration: `panels.domain/type`, `panel_type_settings.type` + Preseed `ledger`, `telegram_chat_ids.domains[]`

## 7. Offene Frage

Preseed-Ledger-Eintrag: soll die Migration bereits eine Ledger-Panel-Zeile mit der aktuellen Preview-Domain anlegen, oder legst du sie selbst im UI an? (Default im Plan: nur Typ-Settings preseeden, kein Domain-Preseed — sauberer.)
