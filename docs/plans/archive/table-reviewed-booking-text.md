# Table Reviewed Booking Text

## Context & Goal

The table shows and edits the booking text that counts: the reviewed booking
text (`bookingTextReviewed`) if there is one, otherwise the original
(`bookingText`). Editing in the table changes only the shown field, so the
original stays untouched once a text is reviewed. The detail page keeps editing
both fields separately, and the review keeps rewriting `bookingText` into
`bookingTextReviewed`.

Later, several entries are to be reviewed in the background from the table, and
the export uses the same rule. Entries that need no review, e.g. "Stand-Up",
keep an empty reviewed text and fall back to the original.

## Non-Goals

- No change to the schema and no data migration.
- No change to the detail page or the review; the review always starts from
  `bookingText`.
- No marker in the table that a text is reviewed (follow-up).
- No export (follow-up); it is only prepared by the shared helper.
- No background review of several entries (follow-up). Topics to solve there:
  - **Skipped entries:** an entry like "Stand-Up" keeps an empty reviewed text
    and would be picked up again on every run. Either the review stores the
    unchanged text, so that a filled field always means "processed", or a skip
    list leaves such entries out without calling the model.
  - **Outdated reviews:** if `bookingText` changes after a review, the reviewed
    text no longer matches. A field with the original at review time (e.g.
    `bookingTextReviewedFrom`) would show that a review is outdated.
  - **Collision with manual input:** the job must not overwrite a field that is
    being edited, and the shown text must not switch while typing; manual
    changes win.

## Acceptance Criteria

- [x] The booking text column shows `bookingTextReviewed` if it is filled,
      otherwise `bookingText`.
- [x] Editing in the table saves into the field that was shown on focus; the
      other field stays unchanged.
- [x] The edited field does not switch while editing, even if the text is
      cleared completely.
- [x] After clearing a reviewed text in the table and leaving the field, the
      table shows `bookingText` again.
- [x] Detail page and review stay unchanged: the review always starts from
      `bookingText` and only overwrites `bookingTextReviewed`.
- [x] After a review on the detail page, the table shows the reviewed text on the
      next load.
- [x] The rule "reviewed, otherwise original" is a single helper in
      `src/modules/Timesheet/entries.ts`, for the export to reuse later.
- [x] No schema change and no data migration.
- [x] The follow-ups (background review with its three topics, marker, export)
      are documented in this plan.
- [x] `ddev exec npm run lint` passes.
- [x] Checked in the browser: editing an entry without review changes
      `bookingText`; editing a reviewed entry changes `bookingTextReviewed` and
      keeps `bookingText`; clearing a reviewed text shows the original again.

## Open Decisions

**Fallback instead of writing both fields.** An empty `bookingTextReviewed`
means "not reviewed", and the original is shown. Rejected: writing table edits
into both fields — the original would be lost after editing a reviewed text,
existing entries would need a migration, the text would be stored twice, and a
background job could no longer tell reviewed entries apart. Rejected as well: a
nullable `bookingTextReviewed` to tell "not reviewed" from "empty" — it needs a
schema change and an intentionally empty reviewed text has no use here.

**Helper.** `getBookingTextField(entry)` in `entries.ts` returns the field that
counts (`"bookingTextReviewed"` or `"bookingText"`); the text is
`entry[getBookingTextField(entry)]`. Returning the field instead of the text lets
the table know where to save.

**Field locked on focus.** The row decides the edited field when the textarea
gets the focus and keeps it until blur, in local state of `TimesheetRow`.
Rejected: deciding it on every render — clearing a reviewed text would switch
the textarea to the original while typing.

**Empty means empty string.** Only `""` counts as not reviewed; whitespace is
treated as text, like everywhere else in the table.

## Checklist

- [x] Add `getBookingTextField` to `entries.ts`.
- [x] Show and edit the field from the helper in `TimesheetRow`, locked on focus.
- [x] Run lint and check the cases in the browser (confirmed manually).
- [x] Tick the acceptance criteria and move the plan to `docs/plans/archive/`.
