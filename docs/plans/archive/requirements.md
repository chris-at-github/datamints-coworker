# Manage Requirements

## Context & Goal

Work package 2 of Ticket Forge (see `docs/plans/archive/ticket-forge.md`). A
requirement is created from a raw text (meeting notes, email), listed, edited
as Markdown and archived manually. AI preparation (package 3), Odoo transfer
(package 4) and MCP (package 5) build on it.

## Non-Goals

- AI preparation and the generated title (package 3).
- Team, project and ticket link (package 4).
- The source of a requirement, manual or Claude Code (package 5).
- The statuses "prepared" and "transferred"; the status column only shows
  "Draft" for now.
- A Markdown preview; the real preview is the ticket in Odoo.
- Deleting requirements; archiving is enough.

## Acceptance Criteria

1. `/ticket-forge` lists title, status and last change, latest change first;
   a row opens the requirement.
2. Above the list: "New" and a link to the archive; an empty list shows a hint
   with the same button.
3. `/ticket-forge/new`: raw text (required), title (optional); saving opens the
   edit page. Without a title the requirement is called "Untitled requirement".
4. The edit page edits title, description and internal description; both
   descriptions are multiline Markdown fields.
5. Saving happens when a field is left, as in the timesheet; a failed save
   shows a visible message.
6. "Show original" shows and hides the raw text read-only; it cannot be changed.
7. Archive from the more menu of the edit page and as a row action in the list;
   the requirement then leaves the list.
8. `/ticket-forge/archive` lists all archived requirements; "Restore" brings
   one back to the list.
9. An unknown id shows a not-found page like the timesheet.
10. Data survives a restart (Prisma migration); lint passes without findings.

## Open Decisions

- **Description prefilled with the raw text** on creation, so it can be worked
  on before the AI exists; the raw text itself stays unchanged.
- **Empty title:** stored as an empty string, the UI shows "Untitled
  requirement". Package 3 generates a title from the requirement when it is
  empty. Rejected: storing the placeholder text, which package 3 could not tell
  from a real title.
- **Archived requirements stay editable**; the edit page shows that it is
  archived and offers "Restore" instead of "Archive".
- **Ids from the server:** `crypto.randomUUID()` on POST; unlike timesheet rows,
  a requirement does not exist in the browser before it is saved.
- **Status as text** (`"draft"` for now), like `Ticket.type`; SQLite has no enums
  and the later values come with their packages.
- **`updatedAt`** with Prisma's `@updatedAt`; the list sorts by it, archiving
  changes it as well (it is a change).
- **Repository `src/lib/requirement-repository.ts`** holds all database access;
  the internal API routes and later the MCP tools call it.
- **Internal API:** `POST /api/requirements` (create), `PATCH /api/requirements/[id]`
  (title, description, internalDescription, archived). Pages read on the server
  through the repository, so the list and the edit page need no GET route.
- **Save on blur:** each field saves itself with only its own value (PATCH with
  one key), so two fields never overwrite each other.
- **Raw text shown in a `<pre>`-like block** with preserved line breaks, behind
  a toggle button with `aria-expanded`.

## Checklist

- [x] Prisma model `Requirement` and migration
- [x] Repository with create, find, list (active/archived), update, archive
- [x] API routes `POST /api/requirements` and `PATCH /api/requirements/[id]`
- [x] Client API functions for the module
- [x] List page with status, last change, row action "Archive", "New", link to the archive, empty state
- [x] Form `/ticket-forge/new`
- [x] Edit page with title, description, internal description, save on blur and error message
- [x] "Show original" toggle
- [x] More menu with "Archive" / "Restore" on the edit page
- [x] Archive page with "Restore"
- [x] Not-found page
- [x] Lint and check all routes
