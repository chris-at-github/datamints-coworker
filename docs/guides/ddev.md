# DDEV

## Umgebung starten und Dev-Server aufrufen

**Problem:** Die Next.js-Anwendung soll im Container laufen und im Browser des
Hosts erreichbar sein.

**Vorgehen:**

```bash
ddev start                 # Container und Next.js-Dev-Server starten
ddev exec npm install      # Abhängigkeiten installieren (einmalig bzw. nach Änderungen)
```

Danach im Browser: <https://datamints-coworker.ddev.site:3000>

**Hinweise:**

- Der Dev-Server startet mit dem Projekt: `web_extra_daemons` in
  `.ddev/config.yaml` lässt `npm run dev` von supervisord im Web-Container
  ausführen. Stürzt er ab, startet supervisord ihn neu.
- `ddev stop` hält die Container und damit den Dev-Server an, `ddev poweroff`
  alle Projekte auf einmal.
- `ddev start` meldet die URL schon, bevor Next.js bereit ist. Antwortet die URL
  mit **502**, lauscht (noch) niemand auf Port 3000 im Container — ein paar
  Sekunden warten oder den Status prüfen (siehe unten).

## Dev-Server steuern und Logs lesen

**Problem:** Der Dev-Server läuft im Hintergrund. Wie sieht man seine Ausgabe,
und wie startet man nur ihn neu?

**Vorgehen:**

```bash
ddev logs -f                                            # Ausgabe live verfolgen (Strg+C beendet nur die Anzeige)
ddev exec supervisorctl status webextradaemons:nextjs   # läuft er?
ddev exec supervisorctl restart webextradaemons:nextjs  # nur den Dev-Server neu starten
ddev exec supervisorctl stop webextradaemons:nextjs     # anhalten, z. B. für npm run start
ddev exec supervisorctl start webextradaemons:nextjs    # wieder starten
```

**Hinweise:**

- Der Name setzt sich aus der Gruppe `webextradaemons` und dem `name` aus
  `.ddev/config.yaml` (`nextjs`) zusammen.
- Ein Neustart nur des Dev-Servers ist schneller als `ddev restart`, das alle
  Container neu startet.
- Ein Status `FATAL` heißt: Der Start ist mehrfach gescheitert, z. B. weil
  `node_modules/` fehlte. Nach der Ursache `restart` ausführen.

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
ddev exec npm run build                                 # Build erzeugen
ddev exec supervisorctl stop webextradaemons:nextjs     # Dev-Server anhalten (gleicher Port)
ddev exec npm run start                                 # Build unter derselben URL servieren
ddev exec supervisorctl start webextradaemons:nextjs    # danach Dev-Server wieder starten
```

**Hinweise:**

- `next build` prüft die Typen mit und bricht bei Typfehlern ab, auch wenn der
  Dev-Server sie nur im Overlay zeigt.
- Ergebnis liegt in `.next/` und ist von Git ausgenommen — der Ordner wird
  schnell einige zehn Megabyte groß.
- `next start` braucht einen vorhandenen Build und belegt denselben Port 3000.
  Der Dev-Server muss also vorher angehalten werden; `npm run start` läuft im
  Vordergrund und endet mit `Strg+C`.
- Ob wirklich der Build ausgeliefert wird, sieht man an der Seitengröße: Der
  Dev-Modus schickt zusätzlich Overlay- und Fast-Refresh-Code mit.
