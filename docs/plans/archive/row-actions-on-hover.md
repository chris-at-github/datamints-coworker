# Row Actions Only on Hover

## Context & Goal

Every row of the timesheet shows its actions (internal note, delete, edit) all
the time, which makes the table busy. The actions should only appear while the
row is hovered or while a control inside the row has focus.

## Non-Goals

- Changing the actions themselves, their order or their behaviour.
- A different behaviour for touch devices; tapping into a row focuses a field
  and thereby shows the actions.

## Acceptance Criteria

- The row actions are visible only while the row is hovered, and also while an
  element inside the row has focus (`:focus-within`, for keyboard users).
- The space of the actions stays reserved, so the table does not shift.
- The internal-note button stays visible when a note exists.

## Open Decisions

- **Hidden with `opacity: 0` instead of `visibility: hidden` or
  `display: none`:** `display: none` frees the space and lets the table shift;
  `visibility: hidden` keeps the space, but hidden buttons cannot receive
  focus, so keyboard users could never tab to them and `:focus-within` would
  never apply. `opacity: 0` keeps both space and focusability.
- **Pure CSS on the row instead of React state:** `:hover` and `:focus-within`
  on the `<tr>` need no event handlers and no re-render.
- **Actions stay visible while their popup is open:** the internal-note popover
  and the delete confirmation move the focus into a portal outside the row, so
  without this the trigger would fade out while its popup is anchored to it.
  Base UI marks open triggers with `data-popup-open`, which the CSS checks via
  `:has()`.
- **Filled note marked with a data attribute:** the note trigger gets
  `data-filled` when a note exists; the CSS keeps such buttons visible.
- **Short fade** with `--transition-duration-default`, which is switched off
  for users who prefer reduced motion.

## Checklist

- [x] Mark the note trigger with `data-filled` when a note exists
- [x] Add a row class and the CSS that hides the actions outside hover and focus
- [x] Lint and check in the browser (hover, keyboard focus, filled note, open popups, no shift)
