# Skip Empty Rows in Review and Transfer

## Context & Goal

New pages start with several empty rows. When the user selects all rows and
starts the AI review or the transfer to Odoo, the empty ones show up in the
result message, e.g. "2 skipped (without booking text)" or "1 skipped (No
ticket)". Completely empty rows should be skipped silently instead.

## Non-Goals

- Skipping rows that are only partly filled; they keep their current messages.
- The detail page of an entry; its transfer button is already disabled for an
  entry that cannot be transferred.
- Changing the counts on the buttons ("Review selected (n)"), which keep
  counting the selected rows.

## Acceptance Criteria

- "Empty" means all fields are empty, as in `isEntryEmpty` (a duration of
  "00:00" counts as empty).
- The review and the transfer of the selected rows skip completely empty rows
  without mentioning them in the result message.

## Open Decisions

- **Filtered in the page before the run, not in the API:** the empty rows are
  never sent, so neither the review run nor the transfer route needs to know
  about them. `isEntryEmpty` already exists on the client. Rejected: filtering
  in the transfer route, which would need a new outcome only to hide it again.
- **Only empty rows selected:** no request is sent (the transfer route rejects
  an empty list); the message is "0 transferred" or "0 reviewed", so the click
  still gets visible feedback.
- **Selection afterwards:** empty rows are deselected after a run, like
  transferred or reviewed rows; only rows that need another try stay selected.
  Retrying an empty row would never change anything.

## Checklist

- [x] Leave empty rows out of the review run
- [x] Leave empty rows out of the transfer, without a request when nothing is left
- [x] Lint and check in the browser (only empty, mixed selection, messages, selection afterwards)
