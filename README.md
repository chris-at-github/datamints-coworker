# Datamints Co-Worker

Lernprojekt zum Aufbau von Full-Stack-Wissen. Die Arbeit ist bewusst in kleine,
nachvollziehbare Arbeitspakete geschnitten — der Weg ist hier genauso Ergebnis
wie der Code.

## Stack

Next.js 16 mit App Router und React 19, in TypeScript, gebündelt mit Turbopack.
Die gesamte Toolchain läuft in einem DDEV-Container; auf dem Host wird kein
Node.js gebraucht.

## Schnellstart

```bash
ddev start                 # Container starten
ddev exec npm install      # Abhängigkeiten installieren
ddev exec npm run dev      # Dev-Server starten
```

Danach im Browser: <https://datamints-coworker.ddev.site:3000>

Mehr dazu — inklusive Produktions-Build und Fehlersuche — in
[`docs/guides/ddev.md`](docs/guides/ddev.md).

## Struktur

| Pfad | Inhalt |
| --- | --- |
| `src/app/` | App Router: Routen, Layouts und Seiten |
| `public/` | statische Dateien |
| `.ddev/` | Konfiguration der Entwicklungsumgebung |
| [`docs/guides/`](docs/guides/README.md) | Kurzanleitungen zum Nachschlagen (deutsch) |
| `docs/plans/` | Spezifikationsdokumente je Feature (englisch) |
| `docs/plans/archive/` | Abgeschlossene Spezifikationen |
| [`CLAUDE.md`](CLAUDE.md) | Arbeitsregeln für die Entwicklung mit Claude Code |

## Kurzanleitungen

Wiederkehrende Befehle und Erkenntnisse werden in
[`docs/guides/README.md`](docs/guides/README.md) gesammelt — aktuell der Umgang
mit DDEV sowie der Squash-Merge-Ablauf und die verwendeten Commit-Typen.

## Arbeitsweise

1. **Klären** — offene Fragen zur Anforderung werden vorab beantwortet.
2. **Planen** — Spezifikation mit Checkliste unter `docs/plans/<feature>.md`.
3. **Umsetzen** — Checkliste Schritt für Schritt auf einem `feature/`-Branch,
   Merge nach `main` per Squash.

Details dazu in [`CLAUDE.md`](CLAUDE.md).
