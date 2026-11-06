# App Shell

## Context & Goal

The Co-Worker gets a second area, Ticket Forge (see `docs/plans/ticket-forge.md`).
To switch between the areas every page gets a fixed sidebar on the left with
"Timesheet" and "Ticket Forge". The start page `/` links to both areas with
two boxes. `/ticket-forge` gets a logo header like the timesheet with its own
icon and an empty content area for the following packages.

## Non-Goals

- Collapsing the sidebar.
- Grouping the sidebar entries.
- Any Ticket Forge function (list, form, AI, Odoo).
- Changes to the timesheet besides moving it into the new frame.

## Acceptance Criteria

- Every page shows a fixed sidebar on the left with "Timesheet" and
  "Ticket Forge"; the active area is highlighted.
- `/` shows two boxes with logo, name and short description that link to the
  two areas.
- `/ticket-forge` shows a header like the timesheet with its own icon
  (`Hammer`) and an empty content area.
- The timesheet works unchanged.
- Lint passes without findings.

## Open Decisions

- **Sidebar in the root layout:** `src/app/layout.tsx` renders the sidebar
  next to the page content, so every route gets it without repeating it.
  The prototype routes get it too; they are internal anyway.
- **Active entry by path:** the sidebar is a small client component that reads
  `usePathname()` and marks the entry whose path the current path starts with
  (`aria-current="page"`). The rest of the layout stays a server component.
- **Navigation data as groups:** the entries are kept as a list of groups with
  one unnamed group, like `NAVIGATION` in the ticket picker, so grouping later
  only adds data. The visual style follows the navigation of the ticket picker.
- **Area definition in one place:** name, path, icon and short description of
  each area live in one list (`src/lib/areas.ts`), used by the sidebar, the
  start page and the headers, so a new area is one entry.
- **Start page boxes:** `src/components/Card` hard-codes an icon and has no
  link; check whether it can take an icon and serve as a link box, otherwise
  a new `LinkCard` component in `src/components/`.
- **Layout:** `.page` already is a flex row; the sidebar gets a fixed width
  and stays visible while the content scrolls (`position: sticky`, full
  height). `.page__main` keeps its max width inside the remaining space.
- **Ticket Forge header:** same structure as `src/app/timesheet/layout.tsx`
  (`page__main`, `page__header`, `Logo`), with the title "Ticket Forge" in the
  metadata.

## Checklist

- [x] Area list with name, path, icon and description (`src/lib/areas.ts`)
- [x] Sidebar module with active entry, styled like the ticket picker navigation
- [x] Render the sidebar in the root layout and adjust the page layout
- [x] Timesheet layout uses the area list for its logo
- [x] Route `/ticket-forge` with logo header and empty content area
- [x] Link box component for the start page (extend `Card` or new component)
- [x] Start page with two boxes
- [x] Lint and check all routes in the browser (`/`, `/timesheet`, entry detail, archive, `/ticket-forge`)
