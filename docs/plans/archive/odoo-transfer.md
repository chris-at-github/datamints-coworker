# Transfer Requirements to Odoo

## Context & Goal

Work package 4 of Ticket Forge (see `docs/plans/archive/ticket-forge.md`). A
requirement is transferred to Odoo: as a new helpdesk ticket in a team, as a
new task in a project, or into an existing ticket or task. Markdown becomes
Odoo HTML with editable checklists, the original text is appended, and changes
made in Odoo since the last transfer are detected and asked about per field.

## Non-Goals

- Transfer through MCP (package 5 does not get a transfer tool).
- Reading changes back from Odoo into the requirement.
- Deleting or archiving anything in Odoo, also on unlink.
- Tags, priority or assignees beyond Odoo's defaults.
- Changing the title of an existing ticket.
- Archiving a requirement automatically after the transfer.

## Acceptance Criteria

1. The target can be a helpdesk team, a project or an existing ticket.
2. A new ticket gets title, description and internal description; customer and
   sale order line are set as when creating it in Odoo, where Odoo knows them for
   the team or project.
3. Checklists show as checkable checklists in Odoo and can be edited there;
   headings, lists, bold text and links are kept.
4. The original text is in the description under "Anforderung durch Kunden".
5. For an existing ticket with content, or a field changed in Odoo since the last
   transfer, the app asks per field: replace, append or skip; without changes it
   transfers without asking.
6. After the transfer the requirement shows the status "Transferred" and a link
   to the Odoo ticket; later changes are marked as not transferred.
7. Errors from Odoo (missing rights, expired key) show as a message; the
   requirement stays unchanged.
8. "Unlink Odoo ticket" removes the link without deleting anything in Odoo.
9. Lint passes; a test each with a new helpdesk ticket, a new project task and
   an existing ticket succeeds.
10. (Answer 1a) A checkbox "Include original", checked by default, sits in the
    Odoo section.
11. (Answer 2) The title of an existing ticket stays as it is in Odoo.
12. (Answer 3) New helpdesk tickets are created in the stage "Neu ohne Mail", so
    the customer gets no automatic mail.
13. (Answer 3) In the original, runs of empty lines collapse, so emails do not
    produce large gaps.

## Open Decisions

- **Test targets** (answer 3): helpdesk team 100 "Ausbildungskompass" and
  project 444 "Praktikumskompass (Ausbildungskompass)"; the user deletes the test
  tickets. Project 444 is visible in the customer portal; its customer follower
  only follows discussions, so creating a task sends no mail.
- **Helpdesk stage:** the stage is looked up by name among the team's stages
  (`ODOO_HELPDESK_STAGE`, default "Neu ohne Mail" in `.env.example`). If the
  team has no such stage, or it has a mail template, the transfer stops with a
  message. Rejected: falling back to Odoo's default stage, which sends the
  "Ticket eingegangen" mail.
- **Defaults of a new ticket:** values of `default_get` with the team/project in
  the context, then `onchange` for the team/project, as Odoo's form does; then
  the stage above. After creating, the sale order line is checked; if Odoo left
  it empty and the project has one, it is set from the project.
- **Target selection:** "New ticket in a team or project" with the group choice
  of the ticket picker, or "Existing ticket" with the ticket field of the
  timesheet. The target is fixed after the first transfer; "Unlink Odoo ticket"
  next to the transfer button frees it after a confirmation, as "Unlink Odoo
  line" in the timesheet entry. Rejected: the more menu, where a menu item
  opening a confirmation dialog needs extra state.
- **The created ticket is stored as `Ticket`** (via `storeTicket`), so the
  requirement links to it like to an existing one and the ticket URL templates
  give the link.
- **Markdown to Odoo HTML** with `marked` and an own renderer: GitHub task list
  items become `<ul class="o_checklist">` items, checked ones get
  `class="o_checked"`; the exact markup of nested checklists is verified on a
  test ticket. Rejected: an own parser, which would need many special cases
  (nesting, links, inline code). Odoo sanitizes the HTML on its side.
- **Original:** appended as "## Anforderung durch Kunden" heading plus the raw
  text, HTML-escaped, not read as Markdown (an email can contain `*` or `#`).
  Lines are trimmed; runs of empty lines become one paragraph break; single line
  breaks become `<br>`.
- **Change detection:** after each write `description` and
  `internal_description` are read back from Odoo and a SHA-256 hash of each
  stored value is kept (Odoo rewrites the HTML, so the sent HTML would never
  match). Before a transfer the app compares the current Odoo values: empty or
  same hash means write without asking, otherwise the dialog asks per field.
  Rejected: `write_date`, which changes on any field.
- **Append** puts the new content below the existing one, separated by `<hr>`.
- **Layout (after the user's review):** tabs "New ticket" (team or project in
  a field like the ticket field) and "Existing ticket"; "Include original" sits
  in the Odoo section. "Transfer" checks Odoo and transfers right away; a dialog
  only opens for fields with content in Odoo that would be overwritten.
- **Two-step transfer:** `POST …/transfer/check` returns per field whether it is
  empty, unchanged or changed in Odoo; `POST …/transfer` gets the decisions and
  "include original". The check runs again on the server before writing; a field
  that changed in between is skipped and reported, not overwritten.
- **"Changed since transfer":** the transferred title, description, internal
  description and the include-original choice are stored as JSON and compared
  with the current values, as in the timesheet.
- **Ticket links on the requirement page** reuse `TicketLinksProvider` in the
  Ticket Forge layout.
- **A requirement needs a title** for a new ticket; without one the transfer
  button explains why it is disabled.

## Checklist

- [x] Migration: target group, ticket, hashes, transferred values, error; status `transferred`
- [x] Markdown to Odoo HTML converter with checklists and the original section
- [x] Odoo access: defaults, stage "Neu ohne Mail", create, read back, write
- [x] Transfer service with check and decisions; routes `transfer/check`, `transfer`, target and unlink
- [x] Export the group choice of the ticket picker for reuse
- [x] Edit page: Odoo section with target selection, transfer dialog, status, link, changed marker, errors
- [x] "Unlink Odoo ticket" with confirmation next to the transfer button
- [x] `.env.example` with `ODOO_HELPDESK_STAGE`; guide section in `docs/guides/odoo.md`
- [x] Test: new helpdesk ticket (team 100), new task (project 444), existing ticket
- [x] Lint and check all routes
