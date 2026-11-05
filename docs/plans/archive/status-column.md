# Status Column Instead of "Odoo"

## Context & Goal

The table has a column "Odoo" that only shows the transfer status. It becomes a
column "Status" that also shows whether an entry was reviewed by the AI, so
the user sees at a glance which rows still need work.

## Non-Goals

- Storing failed AI reviews; "Error" means a failed transfer only.
- The detail page of an entry; it keeps its transfer status next to the
  transfer button.
- New actions or filters based on the status.

## Acceptance Criteria

- The column heading is "Status".
- The status is shown as an icon with a tooltip (like `TransferStatusIcon`),
  with the English labels Open, AI reviewed, Error, Transferred, Changed.
- Error = transfer errors only.
- Changed = changed since the transfer. An entry that was reviewed and then
  changed (not transferred) is "Open" again.
- Precedence: Error > Changed > Transferred > AI reviewed > Open.
- Completely empty rows show no status icon.

## Open Decisions

- **Status derived on top of the transfer status:** `getEntryStatus` uses
  `getTransferStatus` for the first three states and `needsReview` for
  "AI reviewed", so nothing new is stored. "Reviewed and then changed" is open
  again because `needsReview` compares the reviewed values with the current
  ones.
- **One generic `StatusIcon` for both icons:** the focusable icon with tooltip
  is extracted from `TransferStatusIcon`, which the detail page keeps using;
  the new `EntryStatusIcon` for the table only maps the status to icon, label
  and color. Rejected: copying the tooltip markup into a second component.
- **Tooltip of an error** reads "Error: <message of the transfer>", so the
  reason stays visible as before.
- **Icons (lucide):** Open `CircleDashed`, AI reviewed `Sparkles`, Transferred
  `CircleCheck`, Changed `RefreshCw`, Error `CircleAlert`.
- **Colors:** only "Error" is red, every other state is gray (decided by the
  user after the first version with blue, green and orange). As the icon is
  shared, this applies to the transfer status on the detail page as well.

## Checklist

- [x] Add `EntryStatus` and `getEntryStatus` in `entries.ts`
- [x] Extract `StatusIcon` from `TransferStatusIcon`
- [x] Add `EntryStatusIcon` and use it in the table row, without icon for empty rows
- [x] Rename the column heading to "Status"
- [x] Lint and check in the browser (all states that exist in the data, empty rows, tooltip)
