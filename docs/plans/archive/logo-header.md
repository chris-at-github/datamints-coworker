# Logo Header

## Context & Goal

The timesheet starts with a plain heading "Timesheet". It becomes a header row
above everything else: a clock icon in a light gray square next to the text
"Timesheet", the same motif as the favicon.

## Non-Goals

- A link on the logo.
- Navigation between tools or a global app header outside the timesheet.
- Changing the favicon.

## Acceptance Criteria

- The header sits above everything, above the row with pagination and actions.
- It shows the lucide clock icon in a light gray container with a 1:1 ratio,
  and next to it the text "Timesheet".
- It is not a link.

## Open Decisions

- **Replaces the `<h1>` in `src/app/timesheet/layout.tsx`:** the text stays the
  `<h1>` of the page, so the heading structure does not change; the header
  therefore shows on every timesheet route (pages, entry detail, archive).
- **Generic `Logo` component in `src/components/`** with an icon and a text,
  so further tools of the Co-Worker can use it with their own icon. Rejected: a
  timesheet-only module, which would be copied for the next tool.
- **Icon decorative:** the text names the tool, so the icon is hidden from
  screen readers (as `Icon` does by default).
- **Size:** the square has the height of the buttons (41px), the icon is 24px,
  matching the controls below. The gray is
  `--color-neutral-20`, as in the favicon (#dbdbdb).
- **Colors and type (adjusted by the user):** the text of the logo uses
  `--color-neutral-70` and the display style `display--layout-1`, the icon in
  the square `--color-neutral-60`. Grays come from the neutral scale, not from
  `--font-color-*`, which stands for text styles.
- **Spacing below:** the `<h1>` loses its margins inside the logo, so the
  header gets a global layout class `page__header` with `--spacing-60` below.

## Checklist

- [x] `Logo` component with icon in a gray square and text
- [x] Use it as header in the timesheet layout instead of the plain `<h1>`
- [x] Lint and check in the browser
