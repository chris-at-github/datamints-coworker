# Odoo API

## Context & Goal

The timesheet talks to Odoo 19 (`odoo.datamints.com`, enterprise) through the
External JSON-2 API with the user's own API key. A general Odoo client on the
server is the base for more endpoints later. This first step uses it for two
things:

1. **Ticket lookup.** In the ticket dialog the user picks the type (helpdesk or
   project) and enters the ticket number; "Search" verifies it in Odoo and
   shows title and number. The ticket is stored locally with id, number, title
   and link data, so later "recent tickets" and "favorites" can be built on it.
2. **Transfer of bookings.** Entries are transferred to Odoo as timesheet lines
   (`account.analytic.line`) on the helpdesk ticket or project task, one by one
   from the detail page or as a multiple selection from the table. A transferred
   entry remembers its Odoo line, so a second transfer updates it. The table
   shows the transfer status per entry.

A guide explains how to create and rotate the API key.

## Non-Goals

- No ticket finder yet (recent tickets, favorites, my open tickets, search).
- No writing of tickets, no reading of tasks on tickets, no ticket status.
- No deleting of timesheet lines in Odoo; deleting an entry keeps its line.
- No choice of employee; Odoo uses the employee of the API key's user.
- No dedicated bot user; the key runs with the user's own rights.
- No automated tests (testing is TBD in the project).
- No migration of the current ticket values; they are test data and are dropped.

## Acceptance Criteria

- [x] Ticket information (title, number, link) of a helpdesk ticket is found correctly.
- [x] Ticket information (title, number, link) of a project task is found correctly.
- [x] A booking on a helpdesk ticket is transferred to Odoo correctly.
- [x] A booking on a project task is transferred to Odoo correctly.
- [x] A guide explains how to set up the API key.
- [x] Extensions: unlink and transfer again, internal note in Odoo, link in the ticket search.

## Open Decisions

**JSON-2 API.** `POST <ODOO_URL>/json/2/<model>/<method>` with
`Authorization: bearer <key>`, named parameters in a JSON body (`ids`,
`context`, method arguments), errors as 4xx/5xx with `name` and `message`.
Rejected: XML-RPC and JSON-RPC (deprecated, removed in Odoo 22). Checked: the
server answers JSON-2 requests and finds its database without the
`X-Odoo-Database` header, so `ODOO_DATABASE` is optional. Each call is its own
transaction.

**Configuration.** `ODOO_URL`, `ODOO_API_KEY`, optional `ODOO_DATABASE` in
`.env`, read on the server only. The link templates
(`ODOO_HELPDESK_TICKET_URL`, `ODOO_PROJECT_TASK_URL`) stay as they are.

**Client in `src/lib/odoo-client.ts`.** One function `callOdoo(model, method, params)`
built on `fetch`, typed per call, throwing an `OdooError` with Odoo's message.
Rejected: an npm Odoo client (most target XML-RPC/JSON-RPC, and JSON-2 is plain
JSON over HTTP).

**Ticket table.** New model `Ticket`: id (generated), `type`
(`helpdesk`/`project`), `odooId`, `number`, `title`, `projectOdooId` (needed
for bookings), `lastUsedAt`; unique on `type` + `odooId`. Entries reference it
by `ticketId` (nullable), replacing `ticketId` / `ticketType` of the last
feature. A lookup upserts the ticket, so the stored title stays current.
Rejected: number and title on the entry (favorites would need a rebuild).

**Ticket numbers.** Helpdesk: field `ticket_ref` (record 4830 is ticket 4833).
Project: the task id is the number. Checked with read-only calls: helpdesk
`name`, `ticket_ref`, `project_id`, `use_helpdesk_timesheet`; task `name`,
`project_id`, `allow_timesheets`; timesheet line `date`, `name`, `unit_amount`,
`project_id`, `task_id`, `helpdesk_ticket_id`. Test tickets: helpdesk record
5041 is number 5044 (project 325), task 7052 is in project 442; both allow
timesheets.

**Ticket dialog.** Type toggle, number input (digits only), "Search" button;
the result (number and title) or an error is shown in the dialog. "Save" is
only possible with a found ticket; an empty number removes the ticket. The
table shows e.g. "HD 4833" with the title as tooltip, the detail page shows
number and title.

**Transfer values.** `date` = page date, `unit_amount` = duration in hours
(minutes / 60), `name` = reviewed booking text, or the original as long as there
is none, `project_id` from the ticket, plus `helpdesk_ticket_id` or `task_id`.
An entry is transferable with a ticket, a duration above zero and a booking
text. A ticket that does not allow timesheets (`use_helpdesk_timesheet` /
`allow_timesheets` false) or has no project is an error.

**Create or update.** The entry stores `odooTimesheetId`; without it the line is
created, with it the line is updated. Deleting an entry leaves the line in Odoo.

**Status.** Stored on the entry: `odooTimesheetId`, `transferredValues` (a
JSON copy of the transferred values (date, duration, ticket, text)) and `transferError`. Derived
states: not transferred, transferred, changed since transfer (snapshot differs
from the current values), error (message as tooltip). Shown as icon in the
table and as text on the detail page.

**Transfer trigger.** `POST /api/timesheet-entries/transfer` with a list of ids
answers per entry (transferred, skipped with reason, error). Detail page: button
"Transfer to Odoo", disabled while the entry is not transferable. Table:
checkbox column and "Transfer selected" below the table; entries that are not
transferable are skipped, the result is shown as e.g. "3 transferred,
1 skipped". Pending saves are awaited first, as for the review.

**Extension: unlink.** The detail page has "Unlink Odoo line" whenever the
entry is linked; a confirmation warns that a line still existing in Odoo is
duplicated by the next transfer. Unlinking clears `odooTimesheetId`,
`transferredValues` and `transferError`, so the next transfer creates a new
line. A deleted line is not detected on its own; Odoo's error message is shown
as before.

**Extension: internal note.** The internal booking text goes to the Odoo field
`internal_comment` (text, found with a read-only `fields_get`); an empty note
clears it. It is part of `transferredValues`, so changing it marks the entry as
changed. Entries transferred before this change show "changed" once.

**Extension: link in the ticket search.** The found ticket in the dialog gets
the same link icon as the field, before it is saved.

**New wrappers.** `Checkbox` (row selection) and `Tooltip` (status message)
around Base UI.

**Safety while testing.** Read calls run without asking. Writing calls run only
on the test tickets (project task id 7052, helpdesk ticket id 5041) and only
after the user confirms. Test lines are not deleted.

## Checklist

### Odoo client
- [x] `.env.example`: `ODOO_URL`, `ODOO_API_KEY`, `ODOO_DATABASE`
- [x] `callOdoo` and `OdooError` in `src/lib/odoo-client.ts`
- [x] Read-only check: connection and field names of `helpdesk.ticket`, `project.task`, `account.analytic.line`
- [x] Lint and commit

### Ticket lookup
- [x] Prisma: model `Ticket`, entry references it; migration drops the old ticket values
- [x] Repository and entry API: load and save the ticket reference
- [x] `lookupTicket(type, number)`: Odoo search, upsert `Ticket`
- [x] `POST /api/tickets/lookup`
- [x] Ticket dialog: number input, "Search", result and error, save
- [x] Table and detail page show number and title
- [x] Lint and commit
- [x] Verify: helpdesk and project lookup with the test tickets (read-only)

### Transfer
- [x] Prisma: `odooTimesheetId`, transfer snapshot, transfer error on the entry
- [x] `transferEntries(ids)`: checks, create or update, store status
- [x] `POST /api/timesheet-entries/transfer`
- [x] Status derivation shared by table and detail page
- [x] Lint and commit

### UI
- [x] `Checkbox` and `Tooltip` wrappers
- [x] Table: selection column, status icon, "Transfer selected", result message
- [x] Detail page: status and "Transfer to Odoo" button
- [x] Lint and commit

### Verification
- [x] Transfer to project task 7052 (after confirmation)
- [x] Transfer to helpdesk ticket 5041 (after confirmation)
- [x] Second transfer updates the line instead of creating a new one
- [x] User checks both lines in Odoo

### Extensions
- [x] Unlink: repository, route, detail page with confirmation
- [x] Internal note: `internal_comment` in the transfer and in `transferredValues`
- [x] Link icon next to the found ticket in the dialog
- [x] Lint and commit
- [x] User checks the extensions

### Guide
- [x] `docs/guides/odoo.md`: create, store and rotate the API key
- [x] Archive the plan
