# Review Guidance by Booking Size

## Context & Goal

The AI review rewrites every booking text in the same customer-facing style.
For small bookings like a stand-up this is too much: the text does not need to
be phrased out, only its spelling corrected. For large bookings the result is
too thin: "Erweiterung der Timesheet-Funktion" is not enough for three hours.
The instructions per booking size change accordingly.

## Non-Goals

- Changing the size limits: small up to and including 30 minutes, medium from
  31 minutes up to 2 hours, large above 2 hours (3 hours are large).
- The medium size.
- Marking reviewed entries as open again; a changed prompt does not change the
  review values (text and duration), so they keep their reviewed text until
  the user reviews them again.
- Test runs against the API; the user checks the results with real reviews.

## Acceptance Criteria

- Small bookings (up to and including 30 minutes): the review only corrects
  spelling, grammar and punctuation. Wording, sentence structure and order stay
  as written: no nominal style, no rephrasing, no summarizing, no merging with
  semicolons, no expanding of abbreviations, no removing of filler words.
  There is still no full stop at the end.
- Large bookings (above 2 hours): the reviewed text has at least about 100–120
  characters; the upper guide of about 300–600 characters stays.
- Large bookings may always be extended by the obvious phases of the named
  measure (analysis, implementation, test, coordination), not only when the
  text is very short. The existing limits on such additions stay: no assumed
  problems, no new topics, results, numbers or product names.
- The size instructions take precedence over the general rules of the main
  prompt, so the small size is not rewritten by the general style rules.
- All other rules stay unchanged.

## Open Decisions

- **Only the prompt files change**, no code: `getBookingSize` already picks
  `small.md`, `medium.md` or `large.md` with the limits above, and the files
  are read on every review, so the change applies without a restart.
- **Precedence stated in the main prompt:** the section "Umfang nach Dauer"
  says that its block takes precedence over the other rules. Without it, the
  general rules (nominal style, semicolons, abbreviations, effect on the
  customer) contradict "spelling only".
- **Additions for large bookings always allowed** (decided by the user): the
  hint that every added phase describes work that may not have happened that
  way was discussed; the existing limits on additions keep them general.

## Checklist

- [x] Main prompt: precedence of the size block
- [x] Small: spelling, grammar and punctuation only
- [x] Large: minimum length and phases always allowed
