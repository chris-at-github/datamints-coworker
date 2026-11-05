# Project Guidelines

## Projektziel
- Ziel dieses Projektes ist es, Wissen als Full-Stack-Entwickler in verschiedenen Bereichen aufzubauen.
- Das Projekt soll in kleine, verständliche Arbeitspakete aufgeteilt werden.
- Führe keine weiteren Schritte aus, die nicht meinen Anforderungen entsprechen.
- Weise mich auf Fehler in meinen Anforderungen hin.
- Weise mich auf Verbesserungen hin.
- Erkläre bei neuen Konzepten, Bibliotheken oder Patterns kurz das Warum und die Alternative, die du verworfen hast.

## Guides
- Halte wiederkehrende Befehle und Erkenntnisse als Kurzanleitung in `docs/guides/` fest.
- Frage mich vorab ob du Punkte in Guides aufnehmen sollst
- Die Sprache für Guides soll auf Deutsch sein

## Stack
- Sprache/Runtime: TypeScript auf Node.js 24 — ausschließlich im DDEV-Container, kein Host-Node.
- Framework: Next.js 16 (App Router) mit React 19, gebündelt mit Turbopack.
- Umgebung: DDEV (`type: generic`, `webserver_type: generic`, ohne PHP und ohne DB-Container).
- Styling: globale Styles mit Cascade Layers plus CSS Modules für Komponenten und Module, kein Tailwind.
- Testing: TBD (wird erst im späteren Projektverlauf ergänzt)
- Datenbank: SQLite über Prisma 7 (Driver Adapter `better-sqlite3`), Schema in `prisma/schema.prisma`, Client-Instanz in `src/lib/prisma.ts`.
- Linting: ESLint 9 mit `eslint-config-next` (JS/TS) und Stylelint mit `stylelint-config-standard` (CSS) — Details in `docs/guides/lint.md`.
- Formatting: kein Formatter; der Code-Stil steht in `.editorconfig` (inkl. `ij_*`-Angaben für PhpStorm). Neue und geänderte Dateien müssen `.editorconfig` entsprechen.
- Code-Sprache (Bezeichner, Kommentare): Englisch.

## CSS
- CSS-Klassennamen: überall kebab-case, auch in CSS-Modulen (`styles["primary-button"]`); BEM-Schreibweise erlaubt (`page__main`, `button--wide`).
- Design-Tokens: Verwende die Custom Properties aus `src/styles/variables.css`, wenn ihr Name zum Einsatzzweck passt — nicht nur, weil der Wert passt. Gibt es keinen passenden Token, darf der Wert direkt im CSS stehen.

## Komponenten
- Neue Frontend-Komponenten: Prüfe zuerst, ob es in `src/components/` schon eine passende Komponente gibt. Gibt es keine, schlage passende Base-UI-Komponenten vor.
- Base-UI-Komponenten nie direkt in Modulen oder Seiten verwenden, sondern immer über eine eigene Wrapper-Komponente in `src/components/` — Muster in `docs/guides/base-ui.md`.

## Befehle
Alle Befehle laufen im Container. Die Anwendung liegt im Projekt-Root, daher sind
`ddev exec` und `ddev npm` hier gleichwertig — Details in `docs/guides/ddev.md`.

- Umgebung starten: `ddev start`
- Install: `ddev exec npm install`
- Dev-Server: `ddev exec npm run dev` → <https://datamints-coworker.ddev.site:3000>
- Build: `ddev exec npm run build` (Ausgabe in `.next/`)
- Build servieren: `ddev exec npm run start` (belegt denselben Port 3000)
- Lint: `ddev exec npm run lint` (ESLint + Stylelint; einzeln `lint:js`, `lint:css`)
- Lint-Fix: `ddev exec npm run lint:fix` (einzeln `lint:js:fix`, `lint:css:fix`)
- Migration: `ddev exec npm run db:migrate` (Schema-Änderungen, legt `prisma/dev.db` an) — Details in `docs/guides/prisma.md`
- Prisma-Client erzeugen: `ddev exec npm run db:generate` (läuft auch per `postinstall`)
- Test: TBD

## Struktur
- `src/app/` — App Router: Routen, Layouts und Seiten.
- `src/styles/` — globale Styles (Layer, Normalize, Variablen, Basis, Layout, Utilities), Einstieg `application.css` — Details in `docs/guides/css.md`.
- `src/components/` — kleine UI-Bausteine, je Ordner mit `.tsx` und `.module.css`.
- `src/modules/` — eigene Inhaltsbereiche aus Komponenten, gleiches Ordner-Muster.
- `src/lib/` — gemeinsame Hilfsfunktionen und die Prisma-Client-Instanz.
- `src/generated/` — von Prisma erzeugter Client, nicht in Git.
- `prisma/` — Schema, Migrationen und die lokale SQLite-Datei (`dev.db`, nicht in Git).
- `public/` — statische Dateien, die unverändert ausgeliefert werden.
- `docs/guides/` — Kurzanleitungen auf Deutsch, Index in `docs/guides/README.md`.
- `docs/plans/` — Spezifikationsdokumente auf Englisch, abgeschlossene unter `docs/plans/archive/`.
- `.ddev/` — Container-Konfiguration der Entwicklungsumgebung.

## Anforderungsanalyse

1. **Detailfragen erzwingen (Phase 1)**
    - Starte bei neuen Anforderungen NIEMALS direkt mit der Code-Implementierung.
    - Stelle zuerst gezielte Fragen zu Details, Edge Cases, Schnittstellen und Akzeptanzkriterien.
    - Stelle alle Fragen gebündelt in einer Runde. Die Anzahl richtet sich nach der Anforderung — keine feste Obergrenze, aber auch keine Fragen, die die Anforderung schon beantwortet.
    - Die Akzeptanzkriterien (Definition of Done) gebe ich in dieser Phase vor.
    - Ausnahme: Bei trivialen Änderungen (Tippfehler, Rename, Formatierung, offensichtliche Ein-Zeilen-Korrekturen) darf ohne Fragerunde und ohne Plandokument direkt umgesetzt werden.
    - Die Fragen werden auf Deutsch gestellt.
    - Beantworte ich die Fragen nur teilweise (z. B. weil ich zwischendurch mit Enter abschicke), frage zu den noch offenen Fragen nach. Gehe nicht von deinen vorgeschlagenen Empfehlungen aus.

2. **Planerstellung in `docs/plans/` (Phase 2)**
    - Erstelle nach Klärung aller Fragen ein Spezifikationsdokument unter `docs/plans/<feature-name>.md`.
    - Das Dokument wird **vollständig auf Englisch** geschrieben (inklusive Überschriften und Fließtext).
    - Die Datei muss wie folgt aufgebaut sein:
        - **Context & Goal**: Kurze Beschreibung der Anforderung.
        - **Non-Goals**: Was ausdrücklich nicht Teil der Anforderung ist.
        - **Acceptance Criteria**: Überprüfbare Kriterien, die ich in Phase 1 vorgegeben habe.
        - **Open Decisions**: Offene Punkte und getroffene Entscheidungen mit Begründung.
        - **Checklist**: Feingranulare Arbeitsschritte (`- [ ] Task`).

3. **Inkrementeller Abbau (Phase 3)**
    - Arbeite die Checkliste Schritt für Schritt ab.
    - Aktualisiere nach jedem Teilschritt die Datei in `docs/plans/` (Status auf `- [x]` setzen).
    - Verschiebe das Dokument nach Abschluss des Features nach `docs/plans/archive/`.

## GIT
- Füge Dateien eigenständig hinzu, die für das Projekt sinnvoll sind.
- Füge keine temporären Dateien hinzu.
- Niemals committen: `.idea/`, `node_modules/`, `.env*`, Build-Artefakte und andere generierte Dateien. Diese gehören in die `.gitignore`.
- Erstelle für jedes Feature einen eigenen Branch nach dem Schema `feature/<feature-name>`.
- Commite eigenständig einzelne Abschnitte aus Plänen.
- Führe vor jedem Commit `ddev exec npm run lint` aus und behebe Befunde (erst `lint:fix`, dann manuell). Frage mich, bevor ein Befund per Disable-Kommentar oder Konfiguration ausgenommen wird.
- Commit-Messages auf **Englisch** im Conventional-Commits-Format (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Führe **kein** Push durch.
- Schreibe die Branch-History nicht um (kein Rebase, kein Squash auf dem Feature-Branch) — die Einzelcommits sind der Arbeitsnachweis.
- Merge **nicht** automatisch nach `main` — führe den Merge nur auf Anfrage, per Squash (`git merge --squash`) durch, sodass pro Feature ein Commit auf `main` landet.
- Lösche den Feature-Branch direkt nach dem Squash-Merge (`git branch -D`), nachdem geprüft ist, dass er inhaltlich `main` entspricht (`git diff --quiet main <branch>`).
- Schlage die Commit-Message am für den Commit in `main` vor und frage mich dazu
- Halte die Commit-Message knapp => erkläre nur den Sinn hinter dem Commit. Füge in der Beschreibung keine Zeilenumbrüche hinzu.
