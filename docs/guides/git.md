# Git

## Feature-Branch per Squash nach `main` mergen

**Problem:** Auf dem Feature-Branch liegen viele kleine Commits (ein Commit je
Checklisten-Schritt). Auf `main` soll pro Feature nur ein Commit landen.

**Vorgehen:**

```bash
git checkout main
git merge --squash feature/<name>   # übernimmt alle Änderungen, erzeugt keinen Commit
git commit                          # eine Message für das gesamte Feature
```

`git merge --squash` legt die gesammelten Änderungen im Index ab und stoppt
dort. Der Commit wird bewusst separat erstellt, damit die Message von Hand
geschrieben werden kann.

**Hinweise:**

- Der Squash passiert erst beim Merge. Die Historie des Feature-Branches wird
  vorher **nicht** umgeschrieben — die Einzelcommits bleiben bis zuletzt als
  Arbeitsnachweis erhalten.
- Git erkennt den Branch danach nicht als gemerged: `git branch --merged` listet
  ihn nicht und `git branch -d` verweigert das Löschen. Nötig ist:

  ```bash
  git branch -D feature/<name>
  ```

- Mit dem Löschen des Branches verschwinden die Einzelcommits. Die
  Schritt-für-Schritt-Dokumentation steckt dann nur noch im archivierten
  Plandokument unter `docs/plans/archive/`.
- Nach dem Merge den Dev-Server neu starten
  (`ddev exec supervisorctl restart webextradaemons:nextjs`, siehe
  [ddev.md](ddev.md#dev-server-steuern-und-logs-lesen)). `git checkout main`
  löscht die neuen Ordner des Features kurz, der Merge legt sie wieder an. Der laufende Dev-Server bemerkt
  das Neuanlegen nicht und antwortet auf die betroffenen Routen mit 404.

## Commit-Typen (Conventional Commits)

**Problem:** Welches Präfix gehört vor die Commit-Message?

**Vorgehen:**

| Typ | Wofür | Beispiel |
| --- | --- | --- |
| `feat:` | Neue Funktionalität | `feat: add login form` |
| `fix:` | Bugfix | `fix: prevent empty cart checkout` |
| `docs:` | Dokumentation für Menschen (README, `docs/`, Kommentare) | `docs: document merge workflow` |
| `refactor:` | Umbau von Produktionscode ohne Verhaltensänderung | `refactor: extract price calculation` |
| `chore:` | Wartung: Config, Tooling, Dependencies, Aufräumen | `chore: bump next to 16.4.0` |

**Hinweise:**

- Abgrenzung der drei „unsichtbaren" Typen: `docs:` ist Dokumentation,
  `refactor:` ist Produktionscode, `chore:` ist alles, was weder das eine noch
  das andere ist (`.gitignore`, CI-Konfiguration, Abhängigkeiten).
- Der Sinn der Präfixe liegt in der Automatisierung: Tools wie
  `semantic-release` leiten daraus Versionsnummer und Changelog ab —
  `feat:` erhöht die Minor-, `fix:` die Patch-Version, `chore:` erzeugt weder
  Versionssprung noch Changelog-Eintrag. Solange das nicht eingerichtet ist,
  dienen die Präfixe der Lesbarkeit der Historie.
