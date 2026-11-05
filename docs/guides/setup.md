# Einrichtung auf einem neuen Rechner

Gesamtablauf, um das Projekt nach dem Klonen lauffähig zu machen. Details stehen
in den verlinkten Fach-Anleitungen.

## Projekt einrichten

**Problem:** Nach dem Klonen fehlen alle Dateien, die nicht in Git stehen:
`.env`, `node_modules/`, der erzeugte Prisma-Client und die Datenbank.

**Vorgehen:**

```bash
ddev start                        # Container starten
cp .env.example .env              # danach Keys und URLs eintragen
ddev exec npm install             # postinstall erzeugt den Prisma-Client
ddev exec npm run db:migrate      # legt prisma/dev.db an und spielt Migrationen ein
ddev exec npm run db:seed         # optional: Beispieldaten
ddev exec supervisorctl restart webextradaemons:nextjs   # Dev-Server neu starten
```

Danach im Browser: <https://datamints-coworker.ddev.site:3000>

**Hinweise:**

- `.env` mit den Werten aus den Fach-Anleitungen füllen:
  - Claude API: [claude-api.md](claude-api.md#api-key-erstellen)
  - Odoo-API und Ticket-Links: [odoo.md](odoo.md#api-key-einrichten)
- Der Seed leert vorher die Timesheet-Tabellen, siehe
  [prisma.md](prisma.md#testdaten-einspielen).
- Vorhandene Daten ziehen nicht mit um. Wer sie braucht, kopiert
  `prisma/dev.db` vom alten Rechner, bevor der Dev-Server startet.
- Der Dev-Server startet mit `ddev start`. Beim ersten Mal fehlen dabei noch
  `node_modules/` und Prisma-Client, deshalb am Ende der Neustart, siehe
  [ddev.md](ddev.md#dev-server-steuern-und-logs-lesen).
- Linter in PhpStorm einrichten: [lint.md](lint.md#eslint-und-stylelint-in-phpstorm-einrichten).

## API antwortet mit Status 500 nach Neuinstallation

**Problem:** Die Seite meldet z. B.
`GET /api/timesheet-pages/latest failed with status 500`.

**Vorgehen:** Prüfen, ob die Migrationen angewendet sind:

```bash
ls -la prisma/dev.db              # 0 Byte = leere Datenbank ohne Tabellen
ddev exec npx prisma migrate status
ddev exec npm run db:migrate
```

**Hinweise:**

- Läuft der Dev-Server vor `db:migrate`, legt `better-sqlite3` beim ersten
  Zugriff eine leere `prisma/dev.db` an. Die Datei existiert dann, enthält aber
  keine Tabellen.
- Ein Neustart des Dev-Servers ist danach nicht nötig, der Client bleibt gleich.
