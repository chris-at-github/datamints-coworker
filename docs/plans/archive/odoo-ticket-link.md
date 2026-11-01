# Odoo Ticket Link

## Context & Goal

The ticket of an entry is linked to Odoo. There are two kinds of tickets with
their own number ranges: helpdesk tickets (`helpdesk.ticket`) and project tasks
(`project.task`). An entry stores the Odoo record id and the ticket type. The
ticket field in the table and on the detail page shows type and id and opens a
small modal to enter both; a small icon next to the field opens the ticket in
Odoo. The URL templates for both types are configured in `.env`.

This prepares the later ticket finder: the field keeps opening the modal, and
the finder fills the modal with more ways to pick a ticket.

## Non-Goals

- No ticket finder yet (favorites, recent tickets, my open tickets, search in
  projects and customer teams).
- No Odoo API: no lookup of ticket number or title, the id is entered by hand.
- No automatic detection of the type from the entered number.
- No ticket in the review prompt (the template does not use it).
- No migration of existing ticket values; they are test data and are dropped.

## Acceptance Criteria

- [x] A ticket id can be entered by hand and the type helpdesk or project can be chosen.
- [x] The link of a helpdesk ticket opens the right ticket in Odoo.
- [x] The link of a project task opens the right task in Odoo.

## Open Decisions

**Odoo record id, not ticket number.** Odoo URLs need the record id, which can
differ from the ticket number shown in Odoo (helpdesk record 4830 is ticket
4833). The id is entered by hand for now; later the API resolves it.

**Model URLs.** `/odoo/helpdesk.ticket/{id}` and `/odoo/project.task/{id}` open
a record without helpdesk team or project id; checked by the user in the
browser. Rejected: the menu URLs (`/odoo/helpdesk/114/tickets/4830`), they
need the team or project per ticket.

**Fields.** `ticket` becomes `ticketId` (digits only, as text like the other
fields) and `ticketType` is added (`"helpdesk"`, `"project"` or `""`). Without
id or type an entry has no ticket. Ticket number and title come later with the
API.

**Environment.** `ODOO_HELPDESK_TICKET_URL` and `ODOO_PROJECT_TASK_URL` hold
templates with `{id}`. They are read on the server in the timesheet layout and
handed to the client through a React context, so they are read at request time
and need no rebuild. Rejected: `NEXT_PUBLIC_` variables (baked into the bundle
at build time) and passing them as props through every component down to the
row. A missing template means no icon for that type.

**Modal for input.** A click on the ticket field opens a dialog with an id input
(digits only) and a toggle group helpdesk / project. Saving needs both id and
type; an empty id saves "no ticket" and resets the type. Table and detail page
only show the value, e.g. "HD 4830" / "PR 6901". New wrappers: `Dialog` and
`ToggleGroup` around Base UI. Rejected: inputs directly on the detail page (the
input would be rebuilt for the finder).

**Link icon.** `Button.IconLink` with an external-link icon, opens a new tab
(`target="_blank"`, `rel="noopener noreferrer"`). Shown only with id, type and
a configured template.

## Checklist

### Data
- [x] Prisma: rename `ticket` to `ticketId`, add `ticketType`, migration drops the old values
- [x] Update `entries.ts`, API route and repository for both fields
- [x] Review: pass `ticketId` and `ticketType` as placeholders instead of `ticket`
- [x] Lint and commit

### Configuration
- [x] `.env.example` and `.env`: both URL templates
- [x] Server helper reads the templates; shared helper builds the URL from type and id
- [x] Context provider in the timesheet layout
- [x] Lint and commit

### Components
- [x] `Dialog` wrapper around Base UI
- [x] `ToggleGroup` wrapper around Base UI
- [x] Lint and commit

### Ticket field
- [x] `TicketField` in the timesheet module: value display, modal, link icon
- [x] Use it in the table row
- [x] Use it on the detail page
- [x] Lint and commit

### Verification
- [x] Manual input with type works in table and detail page
- [x] Helpdesk link opens the ticket (user checks with Odoo login)
- [x] Project link opens the task (user checks with Odoo login)
- [x] Guide: ask whether Odoo URLs / environment go into `docs/guides/`
- [x] Archive the plan
