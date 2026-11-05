# Archive Pages

## Context & Goal

Over time the pagination fills with pages that are done. The user can archive
a page: it disappears from the pagination and from the start page, stays
reachable and editable by URL, and can be restored from a list of archived
pages.

## Non-Goals

- Deleting pages.
- A read-only mode or a hint on archived pages (besides the "Restore" button).
- Archiving several pages at once or archiving automatically.
- The date dropdown of the pagination (package 3); it must leave out archived
  pages once it exists.

## Acceptance Criteria

- A button "Archive" next to "New" in the header button group, with a
  confirmation dialog.
- The button is always visible, but disabled on today's page.
- After archiving, the newest non-archived page opens.
- Archived pages are hidden from the pagination and from
  `/api/timesheet-pages/latest`.
- ~~Next to the Archive button a dropdown with a separate list of the archived
  pages~~ — changed by the user after the first version: the list of archived
  pages has its own URL, `/timesheet/archive`.
- The list is compact: one line per page with the date and the actions Show and
  Restore, sorted by date. It only shows pages whose date lies at most 90 days
  back; older archived pages stay reachable by URL.
- Next to the Archive button a button with three dots opens a menu; for now its
  only entry is "Archived pages", which leads to `/timesheet/archive`.
- Archived pages stay reachable by URL and editable. There, the Archive button
  becomes "Restore"; no other hint is shown.

## Open Decisions

- **Stored as `archivedAt DateTime?` on `TimesheetPage`:** null means not
  archived; the time costs nothing and tells when it happened. Rejected: a
  boolean, which carries less information for the same effort.
- **One `PATCH /api/timesheet-pages/[id]` with `{ archived: boolean }`** for
  archive and restore; the page in the API gets `archived: boolean`. The server
  also refuses to archive today's page (400); the container runs in the same
  time zone as the browser (CET).
- **List of archived pages as a server-rendered page:** `/timesheet/archive`
  reads the list straight from the repository, like `/timesheet/[pageId]`
  checks the page; only the Restore button needs the client and uses the PATCH
  route. Newest first, like the pagination. A static segment wins over the
  dynamic `[pageId]` in Next.js, so the URL does not clash with page ids. The
  first version's route `GET /api/timesheet-pages/archived` and the dropdown are
  removed again.
- **90 days by the date of the page:** the cutoff is today minus 90 days,
  inclusive, compared as "YYYY-MM-DD" strings.
- **Three-dot menu with Base UI `Menu`** (chosen by the user): a new wrapper
  `src/components/Menu` with arrow-key navigation and `role="menu"`; the entry
  is a `Menu.LinkItem` rendered as `next/link`, so it stays a real link.
  Rejected: the existing popover with a link, which is a dialog, not a menu.
- **After Restore in the list** the user stays on the list and the line
  disappears.
- **Title template in the timesheet layout:** a Next.js title template only
  reaches the next level, so `/timesheet/archive` showed "Archived pages"
  without the app name. The timesheet layout now has its own template.
- **After archiving:** the latest non-archived page is loaded and opened by its
  id. If there is none left, a page for today is created, like on the very
  first start. Rejected: navigating to `/timesheet`, which does not reload when
  that URL is already open.
- **Restore without confirmation:** it changes nothing that cannot be undone.
  On the page itself, the page stays open and is reloaded, so its button and
  its neighbours are up to date.
- **"New for a date" with the date of an archived page** opens the archived
  page, as an existing page of that date is opened instead of creating a
  second one.
- **"New" stays based on the latest non-archived page:** today's page cannot
  be archived, so this still tells whether today's page exists.

## Checklist

- [x] Schema: `archivedAt` on `TimesheetPage`, migration
- [x] Repository: leave archived pages out of latest page and neighbours, `archived` in the page data, list of archived pages, archive/restore
- [x] API: `PATCH /api/timesheet-pages/[id]`, `GET /api/timesheet-pages/archived`
- [x] Client API: `setPageArchived`, `fetchArchivedPages`
- [x] Archive/Restore button with confirmation dialog, disabled on today's page
- [x] Dropdown with the archived pages and the actions Show and Restore
- [x] Navigation after archiving and reload after restoring
- [x] Remove the dropdown and the API route of the archived pages
- [x] Repository: archived pages of the last 90 days
- [x] Wrapper `src/components/Menu` around Base UI Menu
- [x] Three-dot menu with the entry "Archived pages" in the header
- [x] Page `/timesheet/archive` with the compact list, Show and Restore
- [x] Lint and check in the browser
