# Split Button for "New"

## Context & Goal

"New" and the dropdown next to it ("New page for a date") belong together, but
the header shows them as two separate buttons with the normal gap of the button
group. They should look like one control: a button and its dropdown, separated
only by a 1px gap.

## Non-Goals

- Other pairs in the header; "Archive" and the three-dot menu are not a split
  button, as the menu does not belong to "Archive".
- Changing what "New" or the dropdown do.

## Acceptance Criteria

- "New" and its dropdown are separated only by a real 1px gap, through which
  the background shows.
- The inner corners are square, only the outer corners are rounded.
- It is built as a reusable component `Button.Split` in
  `src/components/Button/`.

## Open Decisions

- **`Button.Split` is a plain wrapper around its children**, like
  `Button.Group`: it puts them in a row with a 1px gap and squares the inner
  corners of the first and the last child. The children stay the existing
  buttons, so any trigger (e.g. a popover trigger rendering `Button.Icon`)
  works. Rejected: a component with props for both buttons, which would have to
  know about the popover of the dropdown.
- **Styles in `Button.module.css`**, after `.button` in the same layer; the
  child selectors are more specific than `.button`, so they win without
  `!important`.
- **No `role="group"`:** both buttons already have clear names ("New", "New page
  for a date"); a group without its own name would add nothing for screen
  readers.

## Checklist

- [x] `Button.Split` component and styles
- [x] Use it for "New" and its dropdown in the header
- [x] Lint and check in the browser (gap, corners, focus ring, disabled "New")
