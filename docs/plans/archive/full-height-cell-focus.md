# Full-Height Focus and Click Area in the Table

## Context & Goal

A row grows with a long booking text, but the fields of start, end and ticket
keep the height of one line. Their focus ring and their click area only cover
that line, which looks broken and makes the lower part of the cell dead. The
focus ring and the click area of start, end, booking text and ticket should
always span the whole cell, while the text stays at the top.

## Non-Goals

- The duration cell (plain text), the checkbox, the status and the actions.
- The detail page of an entry.
- Changing how the booking text grows.

## Acceptance Criteria

- Start, end, booking text and ticket: the focus outline spans the full height
  of the cell, also when the row is taller because of a long booking text.
- A click anywhere in such a cell focuses (or, for the ticket, opens) the field.
- The text stays aligned to the top of the cell.

## Open Decisions

- **Cells get `height: 1px`:** a percentage height of a child only resolves in
  a table cell with a set height; the 1px is a minimum, the cell still grows
  with the row. This lets the fields use `height: 100%`.
- **Start and end: a `<label>` around the input fills the cell** and draws the
  ring with `:focus-within`; a click on the label focuses its input natively,
  without JavaScript. Rejected: stretching the input itself, as an input always
  centers its text vertically, so the text would move to the middle.
- **Booking text:** the textarea gets `min-height: 100%`; a textarea keeps its
  text at the top anyway and still grows with its content.
- **Ticket:** the field fills the cell; the trigger becomes a flex container
  with the text in a span, so the text sits at the top (a button centers its
  content otherwise) and still ends with an ellipsis. The link icon to Odoo
  stays at the top as well.

## Checklist

- [x] Cells with `height: 1px`, label frame for start and end
- [x] Booking text with `min-height: 100%`
- [x] Ticket field filling the cell with the text at the top
- [x] Lint and check in the browser (tall row, click below the text, focus ring, keyboard)
