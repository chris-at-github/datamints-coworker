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
2. Beschreibung eingeben (z. B. „datamints-coworker lokal“) und Laufzeit wählen,
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

## Sprache der Abfragen

**Problem:** Ein Projekt heißt in Odoo „S01751 Relaunch Stadt
Unterschleissheim (USH)“, eine eigene Abfrage liefert aber nur „S01751“, und
die Suche nach „Unterschleissheim“ findet nichts.

**Vorgehen:** Übersetzbare Felder (z. B. Projektnamen) liefert Odoo ohne
Sprache auf Englisch. Bei eigenen Abfragen den Kontext mitgeben:

```json
{ "domain": [["name", "ilike", "Unterschleissheim"]], "fields": ["name"], "context": { "lang": "de_DE" } }
```

**Hinweise:**

- `callOdoo` in `src/lib/odoo-client.ts` schickt den Kontext des Benutzers
  (Sprache, Zeitzone aus `res.users/context_get`) bei jedem Aufruf mit; er wird
  einmal pro Serverprozess geholt.
- Ändert sich die Sprache des Benutzers in Odoo, den Dev-Server neu starten.

## Daten des Ticket-Pickers

**Problem:** Wo liegen Favoriten, angepinnte Teams/Projekte und der zuletzt
genutzte Tab?

**Vorgehen:**

| Was | Wo |
| --- | --- |
| Favoriten | SQLite, `Ticket.favoritedAt` |
| Angepinnte und zuletzt verwendete Teams/Projekte | SQLite, Tabelle `TicketGroup` (`pinnedAt`, `lastUsedAt`) |
| Zuletzt gebucht | SQLite, aus den Einträgen (`TimesheetEntry.ticketId`) |
| Zuletzt genutzter Tab | localStorage des Browsers, Schlüssel `ticket-picker:view` |

**Hinweise:**

- Favoriten, „Zuletzt gebucht“ und angepinnte Gruppen funktionieren ohne Odoo.
- Namen von Teams und Projekten werden beim Öffnen im Picker aus Odoo
  aufgefrischt, Ticket-Titel beim Übernehmen eines Tickets.

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
# Team bzw. Projekt, das in Ticket Forge als Ziel gewählt ist
ODOO_HELPDESK_TEAM_URL="https://odoo.datamints.com/odoo/helpdesk/{id}/tickets"
ODOO_PROJECT_URL="https://odoo.datamints.com/odoo/action-393/{id}"
```

**Hinweise:**

- `action-393` ist die Aktion „Aufgaben eines Projekts“ dieser Odoo-Instanz;
  auf einer anderen Instanz kann die Nummer abweichen.
- `{id}` ist die Odoo-Datensatz-ID, nicht die in Odoo angezeigte Ticketnummer
  (z. B. Datensatz 4830 = Ticket 4833).
- Modell-URLs (`/odoo/<modell>/<id>`) statt Menü-URLs
  (`/odoo/helpdesk/114/tickets/4830`): Sie brauchen kein Helpdesk-Team und
  kein Projekt.
- Fehlt eine URL, zeigt das Feld für diese Ticketart kein Icon.
- Nach einer Änderung an `.env` den Dev-Server neu starten.

## Ticket Forge: Anforderungen übertragen

**Problem:** Eine Anforderung soll als neues Ticket, als neue Aufgabe oder in ein
bestehendes Ticket nach Odoo.

**Vorgehen:** Auf der Seite der Anforderung im Bereich **Odoo** ein Team oder
Projekt (neues Ticket) oder ein bestehendes Ticket wählen, dann **Transfer to
Odoo**. Für neue Helpdesk-Tickets in `.env`:

```bash
ODOO_HELPDESK_STAGE="Neu ohne Mail"
```

**Hinweise:**

- Neue Helpdesk-Tickets entstehen in der Phase aus `ODOO_HELPDESK_STAGE`. Die
  Standardphase „🆕 Neu / Warte auf Support“ verschickt die Mail „Ticket
  eingegangen“ an den Kunden. Hat das Team die Phase nicht oder hängt an ihr
  eine Mailvorlage, bricht die Übertragung ab, ohne ein Ticket anzulegen.
- Kunde, Projekt und Auftragsposition setzt Odoo wie beim Anlegen im Formular
  (`default_get` und `onchange`). Bleibt die Auftragsposition leer, kommt sie aus
  dem Projekt.
- Neue Aufgaben übernehmen die Follower des Projekts, auch Kontakte des
  Kunden. Die Meldung „Aufgabe erstellt“ geht nur an Follower, die diesen
  Subtyp abonniert haben.
- Markdown wird zu Odoo-HTML: `- [ ]` und `- [x]` werden zu abhakbaren
  Checklisten (`<ul class="o_checklist">`), in Odoo weiter bearbeitbar.
- „Include original“ hängt den Rohtext unter „Anforderung durch Kunden“ an die
  Beschreibung. Sie ist im Kundenportal sichtbar: bei Protokollen mit internen
  Bemerkungen den Haken entfernen.
- Der Titel eines bestehenden Tickets bleibt unverändert.
- Nach jeder Übertragung merkt sich die App je Feld einen Hash des Inhalts, wie
  Odoo ihn gespeichert hat. Wurde ein Feld seither in Odoo geändert (oder hat ein
  bestehendes Ticket schon Inhalt), fragt der Dialog: ersetzen, anhängen oder
  überspringen. Übersprungene Felder fragen beim nächsten Mal wieder.
- **Unlink Odoo ticket** löst nur die Verknüpfung; in Odoo wird nichts gelöscht.
- Ohne Oberfläche (z. B. zum Testen):

```bash
B=https://datamints-coworker.ddev.site:3000/api/requirements/<id>
curl -k -X PUT -d '{"group":{"type":"helpdesk","odooId":100,"name":"Ausbildungskompass"}}' $B/target
curl -k -X POST $B/transfer/check
curl -k -X POST -d '{"includeOriginal":true,"decisions":{"description":"append"}}' $B/transfer
```
