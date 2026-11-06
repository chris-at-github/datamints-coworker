# Tooltip for Team and Project Names

## Context & Goal

In the ticket picker, the names of helpdesk teams and projects are cut off with
an ellipsis when they are long. A tooltip shows the full text.

## Non-Goals

- A styled tooltip component or keyboard access to the tooltip.
- Tooltips only for names that are actually cut off.
- The ticket rows, which already have a tooltip.

## Acceptance Criteria

- Every team and project in the group list of the ticket picker shows its full
  name as a native tooltip (`title`), whether it is cut off or not.
- For projects the tooltip reads "Name – Customer", for helpdesk teams without
  a customer only the name.
- The name in the breadcrumb above the tickets of a chosen team or project has
  the same tooltip.

## Open Decisions

- **Native `title`** (chosen by the user), like the ticket rows of the picker:
  no extra code and no second focusable element inside the clickable row.
  Rejected: the Base UI tooltip, which needs its own focusable trigger.
- **Always shown** (chosen by the user): measuring whether a name is cut off
  would need a check per row and on every resize.
- **One helper `getGroupTitle`** in `tickets.ts` builds the text for the list
  and the breadcrumb, with the same dash as the ticket rows.

## Checklist

- [x] `getGroupTitle` and the tooltip in the group list
- [x] Tooltip in the breadcrumb
- [x] Lint and check in the browser
