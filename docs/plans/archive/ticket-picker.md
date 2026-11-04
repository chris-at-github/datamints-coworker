# Ticket Picker

## Context & Goal

The ticket dialog becomes a ticket picker as specified in the user's working
instruction and prototype (`ticket-picker-anweisung.md`,
`ticket-picker-prototyp.html`; behaviour only, the design follows the app).
A click on the ticket field opens a two-column modal: a fixed navigation on the
left, the content of the chosen entry on the right.

| Group | Entry | Content |
|---|---|---|
| Personal | Favorites | stored favorites, count in the navigation |
| Personal | Recently booked | tickets of the latest entries, deduplicated, with date and duration |
| Personal | Recently worked | open tickets assigned to me, latest change first |
| Search | Helpdesk | pick a team, then its tickets |
| Search | Projects | pick a project, then its tasks |
| Direct | Enter number | type (project first and preselected) and number with live preview |

The table and the detail page keep their current display of the field.

## Non-Goals

- No mock adapter phase; the picker uses Odoo from the start.
- No cache for team, project or ticket lists; groups are searched in Odoo.
- No filter by project phase yet (prepared, see Open Decisions).
- No "My teams" / "My projects" lists; pinned and recently used groups are enough.
- No creating or editing of tickets in Odoo.
- No change to the display of the ticket field in the table and on the detail page.

## Acceptance Criteria

- [x] A click on the ticket field opens the modal, the focus is in the matching input.
- [x] The navigation has exactly the six entries in three groups.
- [x] Every ticket row shows the type as badge.
- [x] Helpdesk/Projects: without input only Pinned and Recently used; search from 2 characters, results limited.
- [x] The breadcrumb leads from the tickets back to the group choice.
- [x] "Assigned to me" is the default, "All open" loads more.
- [x] Enter number: preview, error message, hint to the other type, taking over only on a hit.
- [x] Saving and removing favorites works and survives a restart.
- [x] The picker can be used by keyboard only (arrows, Enter, Esc, `#`).
- [x] The entry stores the ticket by type and Odoo id with number and title, not by number alone.

## Open Decisions

**Differences to the instruction.** Types stay `"helpdesk" | "project"`, the
badge shows "HD"/"PR". No mock phase (the Odoo API exists). The entry keeps
referencing the local `Ticket` table (type + Odoo id unique, number and title
stored, readable without Odoo) instead of a snapshot on the entry. In "Enter
number" Enter takes over the ticket and the preview runs while typing; this
replaces the "Search" button. The type there is always preselected as
"Project" and listed first, as decided before.

**Checked in Odoo 19 (read-only).** `helpdesk.team`: `name`, `member_ids`,
`project_id`, `use_helpdesk_timesheet`, no customer field, 130 teams.
`project.project`: `name`, `partner_id`, `active`, `stage_id` (phase),
`allow_timesheets`, 279 active. Open helpdesk tickets: `stage_id.fold = false`.
Open tasks: `state not in ('1_done', '1_canceled')`. Assigned: helpdesk
`user_id = uid`, task `user_ids in [uid]`. `formatted_read_group` works.

**No "My teams" / "My projects".** Dropped by the user; pinned and recently
used groups are enough. (The user is member of no helpdesk team, so
`member_ids` would have given nothing anyway.)

**Group search in Odoo.** From 2 characters, debounced (250 ms), outdated
answers dropped, 15 results with a hint to refine the search when there are
more. Teams by name, projects by name or customer name (`partner_id.name`),
only active projects. The project domain is built in one place, so a filter by
phase (`stage_id`) can be added later.

**Storage.** SQLite: a new table `TicketGroup` (type, Odoo id, name, customer,
`pinnedAt`, `lastUsedAt`) for teams and projects. `Ticket` references its group
by `groupId` (team of a helpdesk ticket, project of a task) instead of copying
the name, and gets `favoritedAt`. `projectOdooId` stays on the ticket, the
timesheet line needs it. Storing a ticket upserts its group. localStorage: the
last used navigation entry (a UI setting only).

**Recently booked.** From the app's own entries: the tickets of the latest
entries, newest page first, deduplicated, 20 at most, with date and duration of
the latest booking; no Odoo request.

**Odoo language.** Found while testing: project names are translated in Odoo,
the API answered in English without a language. Every call now runs in the
context of the API key's user (language, time zone). Opening a group refreshes
its stored name and customer from Odoo.

**Data flow.** The browser only talks to own routes; all Odoo calls stay on the
server. List rows from Odoo carry type, Odoo id, number, title, context and
status. Taking over a row stores the ticket (`POST /api/tickets`) and answers
the stored ticket, which is then saved on the entry. Tickets already stored
(favorites, recently booked) are taken over without Odoo. If Odoo is not
reachable, favorites and recently booked still work, the other panels show a
message.

**Components.** New module `src/modules/TicketPicker/` (picker, panels, ticket
list). The ticket field in `src/modules/Timesheet/TicketField.tsx` keeps trigger
and link icon and renders the picker in its dialog. New wrapper `Tabs` (Base UI,
vertical) for the navigation: arrow keys and roles for free. The ticket lists
are an own listbox: the focus stays in the filter input, ↑/↓ move the marker
(`aria-activedescendant`), Enter takes over. Rejected: Base UI Combobox (built
for a popup list, not a fixed one). The dialog gets a wider popup for the two
columns. The link icon to Odoo stays in the preview and in the rows; a button
"Remove ticket" clears the ticket of the entry.

**Keyboard.** Focus in the first input of the active panel; `#` as first key
after opening switches to "Enter number"; Esc closes the modal from every
step; arrows and Enter in lists.

## Checklist

### Data
- [x] Prisma: model `TicketGroup`, `Ticket.groupId`, `Ticket.favoritedAt`
- [x] Odoo queries in `src/lib/ticket-picker.ts`: recently worked, group search, open tickets of a group, find by number or id
- [x] Local queries: favorites, recently booked, pinned and recent groups
- [x] Lint and commit

### Routes
- [x] Ticket routes: favorites, recently booked, recently worked, store ticket, favorite on/off, lookup with hint to the other type
- [x] Group routes: groups (pinned and recent, or search), pin on/off, open group with tickets
- [x] Client functions (`TicketSource`)
- [x] Lint and commit

### UI
- [x] `Tabs` wrapper
- [x] Ticket list (filter, listbox, keyboard) and ticket row with badge
- [x] Panels: favorites, recently booked, recently worked
- [x] Panels: helpdesk and projects (group choice, breadcrumb, assigned/all)
- [x] Panel: enter number (preview, other type hint, favorite checkbox, Enter)
- [x] Picker: navigation, last entry, `#`, remove ticket; wired into the ticket field
- [x] Lint and commit

### Verification
- [x] Routes with read-only requests
- [x] User checks the picker against the acceptance criteria
- [x] Archive the plan
