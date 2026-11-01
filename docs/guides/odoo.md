# Odoo

Die App spricht Odoo 19 über die External JSON-2 API an
(`POST <ODOO_URL>/json/2/<modell>/<methode>`): Tickets suchen und Einträge als
Zeitbuchungen übertragen. Der Client steht in `src/lib/odoo-client.ts`.

## API-Key einrichten

**Problem:** Die API braucht einen API-Key. Er läuft auf den eigenen Benutzer
und hat dessen Rechte.

**Vorgehen:**

1. In Odoo oben rechts Avatar → **Mein Profil** (bzw. Einstellungen) → Reiter
   **Kontosicherheit** → **Neuer API-Schlüssel**; Odoo fragt nach dem Passwort.
2. Beschreibung eingeben (z. B. „datamints-works lokal“) und Laufzeit wählen,
   höchstens drei Monate.
3. Key kopieren, er wird nur einmal angezeigt, und in `.env` eintragen:

```bash
ODOO_URL="https://odoo.datamints.com"
ODOO_API_KEY="…"
ODOO_DATABASE=""
```

4. Dev-Server neu starten.

**Hinweise:**

- Der Key wird nur auf dem Server gelesen (kein `NEXT_PUBLIC_`), `.env` ist
  nicht in Git.
- `ODOO_DATABASE` bleibt leer: Der Server findet seine Datenbank ohne Header.
  Nur nötig, wenn Odoo mehrere Datenbanken hat und sie nicht am Host trennt.
- Alles, was die App schreibt, steht in Odoo unter dem eigenen Benutzer.

## API-Key erneuern

**Problem:** Der Key läuft nach höchstens drei Monaten ab; die Ticketsuche und
die Übertragung melden dann einen Fehler (401, „User not authenticated“).

**Vorgehen:** Wie oben einen neuen Key anlegen, in `.env` ersetzen, Dev-Server
neu starten. Den alten Key unter **Kontosicherheit** löschen.

## Verbindung prüfen

**Problem:** Stimmen URL und Key?

**Vorgehen:** Nur lesender Aufruf, liefert Sprache, Zeitzone und Benutzer-ID:

```bash
ddev exec 'curl -s -X POST -H "Authorization: bearer $(grep ^ODOO_API_KEY= .env | cut -d\" -f2)" \
  -H "Content-Type: application/json" -d "{}" https://odoo.datamints.com/json/2/res.users/context_get'
```

**Hinweise:**

- Antwort `{"lang": "de_DE", "tz": "Europe/Berlin", "uid": …}`: Verbindung steht.
- Antwort mit `"name": "werkzeug.exceptions.Unauthorized"`: Key fehlt, ist
  falsch oder abgelaufen.

## In Odoo gelöschte Zeitbuchung

**Problem:** Eine übertragene Buchung wurde in Odoo gelöscht; die nächste
Übertragung meldet „Record does not exist or has been deleted“.

**Vorgehen:** Eintrag auf der Detailseite öffnen → **Unlink Odoo line** →
bestätigen → **Transfer to Odoo**. Es entsteht eine neue Buchung.

**Hinweise:**

- Unlink löscht in Odoo nichts. Existiert die alte Buchung noch, entsteht eine
  doppelte.
- Die App merkt Löschungen in Odoo nicht von selbst; der Status bleibt bis zur
  nächsten Übertragung „übertragen“.

## Ticket-Links konfigurieren

**Problem:** Das Link-Icon neben dem Ticket-Feld soll auf das richtige Ticket
in Odoo zeigen.

**Vorgehen:** In `.env` je Ticketart eine URL-Vorlage mit `{id}` eintragen:

```bash
ODOO_HELPDESK_TICKET_URL="https://odoo.datamints.com/odoo/helpdesk.ticket/{id}"
ODOO_PROJECT_TASK_URL="https://odoo.datamints.com/odoo/project.task/{id}"
```

**Hinweise:**

- `{id}` ist die Odoo-Datensatz-ID, nicht die in Odoo angezeigte Ticketnummer
  (z. B. Datensatz 4830 = Ticket 4833).
- Modell-URLs (`/odoo/<modell>/<id>`) statt Menü-URLs
  (`/odoo/helpdesk/114/tickets/4830`): Sie brauchen kein Helpdesk-Team und
  kein Projekt.
- Fehlt eine URL, zeigt das Feld für diese Ticketart kein Icon.
- Nach einer Änderung an `.env` den Dev-Server neu starten.
