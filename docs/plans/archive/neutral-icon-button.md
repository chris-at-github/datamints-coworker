# Neutral Icon Button for the Row Actions

## Context & Goal

The row actions (internal note, delete, edit) are gray squares, which makes
the table heavy as soon as they show. A new button variant "neutral" shows the
icon on a transparent background and turns gray only on hover or focus. The
row actions use it.

## Non-Goals

- The link icon to Odoo in the ticket cell and every icon button outside the
  row actions.
- Changing when the row actions appear (package "row actions on hover"): on
  hover or focus of the row, a filled note always.

## Acceptance Criteria

- There is a new icon button variant `neutral`: transparent background, gray
  (`--color-neutral-20`) only on hover or focus.
- A disabled neutral button stays transparent with a lighter icon and gets no
  hover gray.
- The three row actions (internal note, delete, edit) use it.

## Open Decisions

- **A `variant` prop on `Button.Icon` and `Button.IconLink`**
  (`"default" | "neutral"`, default `"default"`), so the edit link gets the
  same look as the buttons. It adds the class `button--neutral`. Rejected: a
  separate component per variant, which would double both components.
- **Placed after `.button` in `Button.module.css`** with selectors of the same
  specificity as the hover and disabled rules of `.button`, so the later rules
  win without `!important`.
- **Lighter icon when disabled:** `--color-neutral-40`, lighter than the
  disabled text of `.button` (`--color-neutral-50`), as there is no background
  that marks the state.
- **An open popup** (note popover, delete confirmation) does not keep its
  trigger gray; as required, gray is only for hover and focus.

## Checklist

- [x] `variant` prop with `neutral` on `Button.Icon` and `Button.IconLink`, styles
- [x] Use it for the three row actions
- [x] Lint and check in the browser (idle, hover, keyboard focus, disabled)
