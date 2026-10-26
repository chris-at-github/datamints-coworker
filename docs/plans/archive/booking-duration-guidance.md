# Booking Duration Guidance

## Context & Goal

The review prompt gets the duration of an entry in a format the model cannot
misread, and a block of instructions that matches the size of the booking. The
application picks one of three blocks by duration before the request is sent:
small (up to 30 minutes), medium (more than 30 minutes up to 2 hours) and large
(more than 2 hours). The blocks tell the model how to treat the booking text
for a booking of that size.

## Non-Goals

- No changes to `prompts/booking-text-review.md`; the user maintains the
  template and adds the `{{durationGuidance}}` placeholder there.
- No other format for start and end time; `HH:MM` is unambiguous as a time.
- No change to how the duration is stored or shown in the UI.
- No configurable thresholds; they are constants in the code.

## Acceptance Criteria

- [x] The prompt sent to Claude is fully built and contains no placeholders.
- [x] A real review request gets a successful answer from Claude.
- [x] Template and blocks are read on every request, so edits apply without restart.

## Open Decisions

**Duration in minutes.** `{{duration}}` is sent as whole minutes, e.g.
`150 min`. Rejected: `2.5 h` / `2,5 h` (decimal point vs. comma in a German
prompt, and durations like 1:20 give `1,333… h`) and both formats at once.

**Thresholds.** Up to and including 30 minutes is small, up to and including
120 minutes is medium, everything above is large. An empty, `00:00` or
unparsable duration counts as 0 minutes and therefore as small.

**Blocks as Markdown files.** `prompts/booking-text-review/small.md`,
`medium.md` and `large.md`, in German like the template. They are read on every
review like the template. Rejected: constants in the code (content and code
would be mixed, edits would need a code change).

**Placeholder `{{durationGuidance}}`.** The chosen block is inserted there. The
block may use the same placeholders as the template; they are filled before the
block is inserted, so the finished prompt has none left.

**Drafts.** The block texts are drafts by Claude for the user to refine.

## Checklist

- [x] Write draft blocks `small.md`, `medium.md`, `large.md`
- [x] Pick the block by duration and send the duration in minutes
- [x] Fill placeholders inside the block before inserting it
- [x] Lint and commit
- [x] Verify: built prompt has no placeholders (temporary log, not committed)
- [x] Verify: real review request answers successfully
- [x] Archive the plan
