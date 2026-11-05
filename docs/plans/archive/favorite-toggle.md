# Favorite Toggle in All Ticket Lists

## Context & Goal

Favorites can only be added under “Enter number” so far, via the checkbox
“Save as favorite”, which also takes the ticket over. Every ticket list of the
ticket picker gets a star button that adds or removes the ticket as favorite
without taking it over. A click on the row itself still takes the ticket over.

Lists with the star: Favorites, Recently booked, Recently worked, the tickets of
a helpdesk team or project, and the result under “Enter number”.

## Non-Goals

- No keyboard shortcut for the star; it stays a mouse action (the row buttons
  keep `tabIndex={-1}`, the lists are driven from their input).
- No change to pinning teams and projects.
- No change to the order of the favorites (still the order they were added).
- No new API routes; the existing `POST /api/tickets` and
  `PUT /api/tickets/[id]/favorite` are enough.

## Acceptance Criteria

- Favorites can be added in all ticket lists.

## Open Decisions

- **Toggle with action icon:** a ticket that is no favorite shows `StarIcon`
  (click adds), a favorite shows `StarOffIcon` (click removes), in every list.
  The favorite state is also shown by a filled star in the text color; a
  separate color was tried and rejected as too prominent.
- **Always visible:** the star is shown in every row, not only on hover.
- **Accessible name instead of `aria-pressed`:** the label changes between
  “Add #… to favorites” and “Remove #… from favorites”; a changing label
  combined with `aria-pressed` would be announced contradictorily.
- **Favorite state of rows from Odoo:** rows from Odoo have no stored ticket,
  so the picker compares them with the loaded favorites by `type` and `odooId`
  (`getRowKey`). Rejected: an extra field from the server, which would need
  changes to all list routes.
- **Rows from Odoo:** adding stores the ticket first (`POST /api/tickets` with
  `favorite: true`); removing uses the stored ticket of the favorite.
- **Favorites panel keeps removed rows:** a removed favorite stays in the list
  with the empty star until the dialog is opened again, so a mistake can be
  undone with a second click. Favorites added in other lists are appended. The
  picker therefore keeps the changes of the session locally instead of
  reloading the favorites after each click. The count in the navigation shows
  the current number of favorites.
- **Info of appended rows:** a favorite added in another list keeps the info of
  that list (e.g. stage or date) until the dialog is opened again.
- **Errors:** if storing or toggling fails, the status line of the picker shows
  the message (server message or “The favorite could not be saved.”) and the
  star stays unchanged. While a request runs, the star of that row is disabled.
- **“Enter number”:** the found ticket becomes a row like in the other lists:
  a click takes it over, next to it the star and the link to Odoo. Enter in the
  number input still takes it over. The button “Take over” and the checkbox
  “Save as favorite” are removed.
- **Texts:** hint and empty text of the favorites point to the star in the
  ticket lists instead of “Enter number”.

## Checklist

- [x] Add a `FavoriteButton` in `src/modules/TicketPicker/` (action icon, filled state, label, disabled while pending)
- [x] Keep favorite changes of the session in `TicketPicker` (state per row key, toggle via `store` or `setFavorite`, error in the status line)
- [x] Favorites panel: show loaded plus changed rows, star instead of the remove button, count of current favorites, new hint and empty text
- [x] Show the star in Recently booked and Recently worked
- [x] Show the star in the tickets of a helpdesk team or project (`GroupPanel`)
- [x] “Enter number”: found ticket as clickable row with star and link, remove button and checkbox, Enter still takes over
- [x] Remove the now unused `favorite` parameter from `pick` and `NumberPanel`
- [x] Lint and check in the browser
