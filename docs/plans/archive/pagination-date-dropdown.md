# Date Dropdown in the Pagination

## Context & Goal

The arrows of the pagination only step one page at a time. To jump to any day,
the date of the current page between the arrows becomes a dropdown that lists
all pages; choosing one opens it.

## Non-Goals

- Changing the arrows: left stays the newer page, right the older one, and both
  keep skipping archived pages.
- Moving or changing "New page for a date" (`TimesheetNewForDate`).
- Archived pages in the dropdown; they have their own list at
  `/timesheet/archive`.
- Filtering or searching inside the dropdown.

## Acceptance Criteria

- Arrows as now: left = newer page, right = older page, jumping to the next
  existing non-archived page.
- In the middle between the arrows, the date of the current page (format as
  now, YYYY-MM-DD) is a dropdown.
- The dropdown lists all non-archived pages, sorted newest first, without a
  limit.
- Choosing a page opens it.

## Open Decisions

- **Reuses `Menu` from package 4 with link entries:** every page is a real link
  to `/timesheet/<id>`, so it can also be opened in a new tab. The current page
  is marked with `aria-current="page"`. Rejected: Base UI `Select`, which is
  meant for picking a form value, not for navigation, and would need another
  wrapper.
- **The list comes with the page:** `TimesheetPageResult` gets
  `pages: PageSummary[]` (id and date of every non-archived page), loaded
  together with the neighbours. It is only an id and a date per page, so the
  size stays small even without a limit. Rejected: loading the list when the
  dropdown opens, which needs another route and a loading state.
- **`ArchivedPage` becomes `PageSummary`**, as both lists carry the same
  fields.
- **An archived page opened by URL** shows its own date in the trigger; the
  list does not contain it, so no entry is marked as current.
- **Long lists scroll** inside the popup; its height is limited by the space
  Base UI reports (`--available-height`).
- **Height of the date:** the trigger has the same minimum height as the arrow
  buttons (41px), so the three line up (requested by the user after the first
  version).
- **The header** no longer renders the date itself; the pagination with the
  date between the arrows takes its place.

## Checklist

- [x] Rename `ArchivedPage` to `PageSummary` and add `pages` to the page result
- [x] Menu: scroll long lists, style for the current entry
- [x] Date dropdown between the arrows, header without its own date
- [x] Lint and check in the browser
