# Timesheet UI Extensions

## Context & Goal

Three additions to the timesheet table:

1. **Review selected.** Entries selected with the checkboxes are reviewed by
   Claude one after another, with progress, cancel and a summary. An entry is
   only reviewed if it was never reviewed or its text or duration changed since
   the last review.
2. **Totals.** Below the entries a row shows the earliest start, the latest end
   and the sum of all durations of the page.
3. **New page for a date.** Next to "New" a dropdown opens a date input to
   create the page of a chosen day (today or earlier).

The review also changes what it sends: the displayed booking text (the reviewed
text, or the original as long as there is none) instead of always the original,
so edits in the table are reviewed instead of being overwritten.

## Non-Goals

- No parallel reviews; one request at a time.
- No cancel of a running request; cancel stops before the next entry.
- No change to the review button on the detail page: it always reviews.
- No totals for the selection only; always all entries of the page.
- No date picker library and no own calendar; the browser's date input is used.
- No future dates.
- No change to the "New" button for today.

## Acceptance Criteria

- [x] Selected entries are reviewed one after another; unchanged and empty entries are skipped, progress is shown, the run can be cancelled and failed entries can be reviewed again.
- [x] The review sends the displayed booking text.
- [x] Below the entries the earliest start, the latest end and the total duration (e.g. "7:45") are shown.
- [x] A page can be created for a chosen date up to today; an existing page of that date is opened instead.

## Open Decisions

**Displayed text for the review.** The review sends `bookingTextReviewed`, or
`bookingText` while there is none (`getBookingTextField`, as in the table and
the transfer). Rejected: always the original (overwrites edits of the reviewed
text). Consequence: a reviewed text is reviewed again, the original no longer
counts after the first review.

**Change detection.** New field `reviewedValues` on the entry: JSON of the
displayed text and the duration right after a review (the duration picks the
size block of the prompt). An entry needs a review if the field is empty or
differs from the current values. Rejected: storing only a timestamp (changes
cannot be compared).

**Running the review in the browser.** "Review selected" calls the existing
route `POST /api/timesheet-entries/<id>/review` per entry, one after another.
This gives progress ("Reviewing 2 of 5") and a cancel between entries without a
new route or a job queue. Pending saves are awaited first. Skipped (unchanged,
no booking text) and reviewed entries are deselected; failed and cancelled ones
stay selected for another run. Summary e.g. "4 reviewed, 1 skipped (unchanged),
1 failed". Review and transfer cannot run at the same time.

**Totals row.** A `tfoot` row: earliest valid start, latest valid end, sum of
all durations formatted as "H:MM" without leading zero ("7:45", "10:15"). Empty
and invalid values are left out. The label "Total" is visually hidden in the
first cell.

**Date dropdown.** An icon button next to "New" opens a popover with a native
date input (`max` = today) and "Create". Rejected: a date picker library (new
dependency, own styling). An existing page of the chosen date is opened
instead; the server finds it by date (`GET /api/timesheet-pages?date=…`).
`createPage` takes the date as parameter.

## Checklist

### Review
- [x] Prisma: `reviewedValues` on the entry
- [x] Review sends the displayed text and stores `reviewedValues`
- [x] `getReviewValues` / `needsReview` in `entries.ts`
- [x] Table: "Review selected" with progress, cancel and summary
- [x] Lint and commit

### Totals
- [x] Totals helper in `entries.ts`
- [x] `tfoot` row in the table
- [x] Lint and commit

### New page for a date
- [x] Repository and route: find a page by date
- [x] `createPage(date)` and navigation to an existing page
- [x] Dropdown with date input next to "New"
- [x] Lint and commit

### Verification
- [x] Review selected: skip, progress, cancel, retry (user)
- [x] Totals on a page with gaps and empty rows
- [x] New page for a past date and for a date with an existing page
- [x] Archive the plan
