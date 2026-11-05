# Kurzanleitungen

Gesammelte Rezepte und Befehle, die im Projekt wiederholt gebraucht werden —
bewusst kurz gehalten und zum Nachschlagen gedacht, nicht zum Durchlesen.

## Übersicht

| Thema | Datei | Inhalt |
| --- | --- | --- |
| Einrichtung | [setup.md](setup.md) | Projekt auf einem neuen Rechner einrichten, Status 500 durch leere Datenbank |
| Git | [git.md](git.md) | Squash-Merge, Dev-Server nach dem Merge neu starten, Commit-Typen |
| DDEV | [ddev.md](ddev.md) | Umgebung starten, Dev-Server steuern und Logs, Befehle im Container, Dev-Server hinter dem Router, Build |
| CSS | [css.md](css.md) | Globale Styles, Cascade Layers, CSS-Module, Komponenten und Module, Base-UI-Vorbereitung, mitwachsende Textfelder |
| Base UI | [base-ui.md](base-ui.md) | Eigene Komponenten um Base UI, Server-/Client-Komponenten, Zustände stylen |
| Prisma | [prisma.md](prisma.md) | Migrationen (auch mit Datenverlust), Dev-Server-Neustart, Client erzeugen, Testdaten, Datenbank zurücksetzen und ansehen |
| Linting | [lint.md](lint.md) | ESLint und Stylelint ausführen, Befunde beheben, `.editorconfig`, PhpStorm-Einrichtung |
| Claude API | [claude-api.md](claude-api.md) | API-Key erstellen, Konfiguration in `.env`, Template und Platzhalter, Prüfung per `curl` |
| Odoo | [odoo.md](odoo.md) | API-Key einrichten und erneuern, Verbindung prüfen, Sprache der Abfragen, Daten des Ticket-Pickers, gelöschte Zeitbuchung, URL-Vorlagen für Ticket-Links |

## Aufbau

- Eine Datei pro Themengebiet (`git.md`, `wsl.md`, `node.md`, …).
- Ein Rezept ist ein `##`-Abschnitt mit sprechendem Titel.
- Jeder Abschnitt folgt dem Muster **Problem → Vorgehen → Hinweise**.
- Befehle immer als Code-Block, damit sie kopierbar sind.

## Neue Anleitung ergänzen

1. Passende Themendatei wählen oder neu anlegen.
2. Rezept als `##`-Abschnitt einfügen.
3. Bei einer neuen Datei: Zeile in der Übersichtstabelle oben ergänzen.
