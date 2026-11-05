# Prisma

Prisma 7 greift über den Driver Adapter `@prisma/adapter-better-sqlite3` auf eine
SQLite-Datei zu. Die Datenbank-URL steht in `.env` und wird in
`prisma.config.ts` gelesen, das Schema liegt in `prisma/schema.prisma`.

## Nach dem Klonen einrichten

Gesamtablauf mit `.env`, Client und Datenbank: siehe [setup.md](setup.md).

**Hinweise:**

- `.env`, `prisma/dev.db` und `src/generated/` stehen in `.gitignore`.
- Prisma 7 lädt `.env` nicht mehr selbst, deshalb importiert `prisma.config.ts`
  `dotenv/config`. Next.js liest `.env` zur Laufzeit eigenständig.
- Eine geänderte `.env` übernimmt der Dev-Server erst nach einem Neustart
  zuverlässig.

## Schema ändern und Migration anlegen

**Problem:** Ein Modell kommt hinzu oder ändert sich.

**Vorgehen:** `prisma/schema.prisma` anpassen, dann:

```bash
ddev exec npm run db:migrate -- --name add-timesheet-entry
```

**Hinweise:**

- Legt unter `prisma/migrations/` eine SQL-Datei an und wendet sie auf
  `prisma/dev.db` an.
- Den Client erzeugt seit Prisma 7 nicht mehr `migrate dev` selbst, sondern der
  npm-Hook `postdb:migrate` direkt danach. Nicht als `&&` ins Skript schreiben:
  npm hängt `-- --name …` sonst an den letzten Befehl.
- Danach den Dev-Server neu starten, siehe unten.
- Migrationen werden committet, sie sind die Historie des Schemas.
- Ohne `--name` fragt Prisma interaktiv nach einem Namen.

## Migration mit Datenverlust

**Problem:** `db:migrate` bricht ab mit „environment is non-interactive“, weil
die Änderung Daten löscht (z. B. Spalte umbenannt) und Prisma eine Bestätigung
verlangt, die ohne Terminal nicht möglich ist.

**Vorgehen:** SQL erzeugen, als Migration ablegen und einspielen:

```bash
ddev exec npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
# Ausgabe nach prisma/migrations/<JJJJMMTThhmmss>_<name>/migration.sql speichern
ddev exec npx prisma migrate deploy
ddev exec npm run db:generate
```

**Hinweise:**

- Das SQL vorher lesen: Gelöschte Spalten fehlen im `INSERT … SELECT`.
- Danach den Dev-Server neu starten.

## Dev-Server nach Schemaänderungen neu starten

**Problem:** Nach `db:migrate` oder `db:generate` antworten API-Routen mit 500,
im Log steht z. B. `Cannot read properties of undefined (reading 'findFirst')`.

**Vorgehen:** Den Dev-Server neu starten, siehe
[ddev.md](ddev.md#dev-server-steuern-und-logs-lesen):

```bash
ddev exec supervisorctl restart webextradaemons:nextjs
```

**Hinweise:**

- `src/lib/prisma.ts` legt die Client-Instanz in der Entwicklung auf
  `globalThis`. Sie überlebt dadurch jedes Neuladen, auch das alte Schema ohne
  neue Modelle. Erst ein neuer Prozess lädt den neuen Client.
- Serverfehler des Dev-Servers stehen in `.next/dev/logs/next-development.log`.

## Client neu erzeugen

**Problem:** Der Client unter `src/generated/prisma/` passt nicht zum Schema,
z. B. nach einem `git pull`.

**Vorgehen:**

```bash
ddev exec npm run db:generate
```

**Hinweise:**

- `db:migrate` (über `postdb:migrate`) und `npm install` (über `postinstall`)
  erzeugen den Client bereits mit, ein separater Aufruf ist selten nötig.
- Danach den Dev-Server neu starten.

## Testdaten einspielen

**Problem:** Die Datenbank soll Beispieldaten enthalten.

**Vorgehen:**

```bash
ddev exec npm run db:seed
```

**Hinweise:**

- Führt `prisma/seed.ts` mit `tsx` aus (eingetragen in `prisma.config.ts`).
  Node selbst kann den erzeugten Client nicht laden, weil dessen Imports keine
  Dateiendungen haben.
- Der Seed leert vorher die Timesheet-Tabellen und kann beliebig oft laufen.
- Seit Prisma 7 seedet `prisma migrate reset` nicht mehr automatisch, danach
  `db:seed` selbst ausführen.

## Prisma im Code verwenden

**Problem:** Daten in Server-Komponenten, Route Handlern oder Server Actions
lesen und schreiben.

**Vorgehen:** Immer die gemeinsame Instanz aus `src/lib/prisma.ts` importieren:

```ts
import { prisma } from "@/lib/prisma";

const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
```

**Hinweise:**

- Nur auf dem Server verwenden, nie in Dateien mit `"use client"`.
- Kein eigenes `new PrismaClient()`: Die Instanz liegt in der Entwicklung auf
  `globalThis`, damit Hot Reload nicht bei jeder Änderung eine neue Verbindung
  öffnet.
- SQLite liefert Ganzzahlen aus `$queryRaw` als `BigInt`. `Response.json` kann
  sie nicht serialisieren, vorher mit `Number()` umwandeln.

## Datenbank zurücksetzen

**Problem:** Die lokale Datenbank soll leer neu aufgebaut werden.

**Vorgehen:**

```bash
ddev exec npx prisma migrate reset
```

**Hinweise:**

- Löscht alle Daten und spielt alle Migrationen neu ein, vorher kommt eine
  Rückfrage.
- Testdaten danach mit `ddev exec npm run db:seed` einspielen.

## Datenbank ansehen

**Problem:** Tabellen und Daten ohne Prisma Studio ansehen.

**Vorgehen:** Mit der SQLite-Kommandozeile im Container:

```bash
ddev exec sqlite3 prisma/dev.db ".tables"                         # Tabellen auflisten
ddev exec sqlite3 prisma/dev.db ".schema"                         # Tabellendefinitionen
ddev exec sqlite3 -box prisma/dev.db "SELECT * FROM _prisma_migrations;"
ddev ssh                                                          # interaktiv: sqlite3 prisma/dev.db, beenden mit .quit
```

**Hinweise:**

- Daten nur lesen. Geändert werden sie über die App oder Migrationen.
- PhpStorm unter Windows scheitert hier: Der SQLite-Treiber kann seine native
  Windows-Bibliothek nicht laden („No native library found“), ein SSH-Tunnel
  hilft nicht (SQLite hat keinen Port), und für die Umgebung „Dev Container“
  fehlt ein JDK. Deshalb die Kommandozeile.

## Versionen

**Problem:** Prisma meldet ein Update auf eine Vorabversion.

**Vorgehen:** Die Meldung `Update available 7.10.0 -> 8.0.0-rc.…` ignorieren.
`prisma`, `@prisma/client` und `@prisma/adapter-better-sqlite3` sind exakt auf
dieselbe stabile Version gepinnt und werden nur gemeinsam aktualisiert:

```bash
ddev exec npm install --save-exact prisma@<version> --save-dev
ddev exec npm install --save-exact @prisma/client@<version> @prisma/adapter-better-sqlite3@<version>
```

**Hinweise:**

- Der npm-Tag `latest` zeigt bei Prisma zeitweise auf einen Release Candidate.
  Deshalb immer eine Version angeben, nie `prisma@latest`.
