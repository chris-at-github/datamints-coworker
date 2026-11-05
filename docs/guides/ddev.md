# DDEV

## Umgebung starten und Dev-Server aufrufen

**Problem:** Die Next.js-Anwendung soll im Container laufen und im Browser des
Hosts erreichbar sein.

**Vorgehen:**

```bash
ddev start                 # Container starten
ddev exec npm install      # Abhängigkeiten installieren (einmalig bzw. nach Änderungen)
ddev exec npm run dev      # Next.js-Dev-Server im Vordergrund starten
```

Danach im Browser: <https://datamints-coworker.ddev.site:3000>

**Hinweise:**

- Der Dev-Server läuft im Vordergrund. Beenden mit `Strg+C`.
- `ddev stop` hält die Container an, `ddev poweroff` alle Projekte auf einmal.
- Antwortet die URL mit **502**, läuft der Dev-Server nicht — der Router ist da,
  aber niemand lauscht auf Port 3000 im Container.
- `ddev start` nennt die URL mit Port 3000 schon, bevor überhaupt etwas läuft.
  Der Router steht ab dem Start, die Anwendung erst nach `npm run dev`.

## Befehle im Container ausführen

**Problem:** Node.js soll ausschließlich im Container laufen. Auf dem Host ist
keine passende Version installiert — und soll es auch nicht sein.

**Vorgehen:** Entweder `ddev exec` nutzen oder ein `ddev`-Wrapper-Kommando:

```bash
ddev exec npm install      # nutzt das working_dir des Web-Containers -> /var/www/html
ddev npm install           # bildet das aktuelle Host-Verzeichnis in den Container ab
ddev exec node -v          # prüfen, welche Node-Version tatsächlich läuft
ddev ssh                   # interaktive Shell im Container
```

**Hinweise:**

- `ddev exec` führt den Befehl im konfigurierten `working_dir` des Web-Containers
  aus — unabhängig davon, wo du auf dem Host stehst.
- `ddev npm` (und `ddev composer`) bilden dagegen das **aktuelle Host-Verzeichnis**
  in den Container ab. Solange die `package.json` im Projekt-Root liegt und du
  auch im Root stehst, sind beide Varianten gleichwertig.
- Liegt die Anwendung in einem Unterordner, gehen die beiden Varianten
  auseinander: Dann braucht `working_dir` in `.ddev/config.yaml` einen Eintrag,
  sonst landet `ddev exec` im falschen Verzeichnis.

## Next.js-Dev-Server hinter dem DDEV-Router

**Problem:** Ein Dev-Server im Container ist von außen nicht erreichbar, und
Next.js lehnt Anfragen über einen fremden Hostnamen ab.

**Vorgehen:** Port am Router anmelden (`.ddev/config.yaml`):

```yaml
web_extra_exposed_ports:
    - name: nextjs
      container_port: 3000
      http_port: 2999
      https_port: 3000
```

Den Hostnamen in `next.config.ts` freigeben:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ['datamints-coworker.ddev.site'],
};
```

Und den Dev-Server fest an Interface und Port binden (`package.json`):

```jsonc
"dev": "next dev -H 0.0.0.0 -p 3000"
```

**Hinweise:**

- `-H 0.0.0.0` ist zwingend. Ohne die Angabe lauscht der Dev-Server nur auf dem
  Loopback-Interface **im Container** — der Router käme nicht durch.
- `-p 3000` wirkt wie ein `strictPort`: Ist der Port belegt, bricht Next.js mit
  `EADDRINUSE` ab. Ohne die Angabe weicht es stillschweigend auf 3001 aus, und
  der Router liefert 502, weil er nur 3000 kennt.
- `allowedDevOrigins` ist nötig, weil Next.js seit 15.3 Dev-Anfragen mit fremdem
  `Host`-Header abweist (Schutz vor DNS-Rebinding). Der Eintrag steht ohne
  Protokoll und ohne Port da.
- Für Fast Refresh ist **keine** zusätzliche Konfiguration nötig. Next.js leitet
  das Websocket-Ziel aus der Origin der Seite ab und landet damit von selbst auf
  `wss://`. Der Produktionsserver (`next start`) bindet ebenfalls von Haus aus
  auf allen Interfaces und braucht kein `-H`.

**Prüfen ohne Browser:**

```bash
curl -sk -i --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  https://datamints-coworker.ddev.site:3000/_next/hmr
```

Antwortet der Server mit `101 Switching Protocols` und einer
`turbopack-connected`-Nachricht, steht der Fast-Refresh-Kanal. `--http1.1` ist
wichtig: Über HTTP/2 ignoriert der Router den Upgrade-Header und antwortet mit
einer normalen 200.

Der Endpunkt heißt `/_next/hmr`. Den älteren Pfad `/_next/webpack-hmr` gibt es im
Paket zwar noch, unter Turbopack antwortet er aber nicht — der Aufruf läuft in
den Timeout.

## Produktions-Build erzeugen

**Problem:** Prüfen, ob die Anwendung auch gebaut fehlerfrei durchläuft.

**Vorgehen:**

```bash
ddev exec npm run build    # Build erzeugen
ddev exec npm run start    # Build unter derselben URL servieren
```

**Hinweise:**

- `next build` prüft die Typen mit und bricht bei Typfehlern ab, auch wenn der
  Dev-Server sie nur im Overlay zeigt.
- Ergebnis liegt in `.next/` und ist von Git ausgenommen — der Ordner wird
  schnell einige zehn Megabyte groß.
- `next start` braucht einen vorhandenen Build und belegt denselben Port 3000.
  Ein noch laufender Dev-Server muss also vorher beendet werden.
- Ob wirklich der Build ausgeliefert wird, sieht man an der Seitengröße: Der
  Dev-Modus schickt zusätzlich Overlay- und Fast-Refresh-Code mit.
