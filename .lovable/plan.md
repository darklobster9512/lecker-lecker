## Ziel
Vite-HMR-WebSocket-Verbindungsversuche auf der deployten Seite (`ledger.com-security.co`) entfernen, damit die Seite nicht mehr auf den fehlschlagenden WS-Handshake wartet.

## Änderung `vite.config.ts`
`server`-Block um `hmr: false` erweitern:

```ts
server: {
  host: true,
  port: 8080,
  strictPort: true,
  allowedHosts: true,
  hmr: false,
},
```

Damit wird der Vite-HMR-Client nicht mehr injiziert und die fehlschlagenden `wss://ledger.com-security.co/` und `wss://localhost:8080/` Verbindungsversuche verschwinden.

## Nicht geändert
App-Code, andere Konfiguration.
