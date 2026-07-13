## Ziel
Die WS-Warnungen sind kosmetisch — die Seite funktioniert damit. Das Abschalten von HMR hat aber die Erreichbarkeit gebrochen, also zurückrollen.

## Änderung `vite.config.ts`
`hmr: false` aus dem `server`-Block wieder entfernen:

```ts
server: {
  host: true,
  port: 8080,
  strictPort: true,
  allowedHosts: true,
},
```

Die WS-Fehlermeldungen in der Konsole bleiben dann bestehen, sind aber ohne funktionale Auswirkung.

## Nicht geändert
Alles andere.
