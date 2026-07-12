In `vite.config.ts` das Dev-Server-Setting so anpassen, dass Anfragen von beliebigen Hosts akzeptiert werden:

- `server.host: true` (bindet an alle Interfaces, falls noch nicht gesetzt)
- `server.allowedHosts: true` — erlaubt jede Host-Header-Domain

Gleiche Einstellung auch für `preview` setzen, damit `vite preview` ebenfalls von jeder Domain erreichbar ist.

Keine weiteren Änderungen (keine App-, Style- oder Backend-Änderungen).