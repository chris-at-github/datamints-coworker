# Odoo

Das Ticket-Feld verlinkt Einträge auf Tickets in Odoo.

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
