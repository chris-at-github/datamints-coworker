# AI Preparation of Requirements

## Context & Goal

Work package 3 of Ticket Forge (see `docs/plans/archive/ticket-forge.md`). Claude
prepares a requirement from its raw text into title, description and internal
description following the rules of a prompt file, and refines it with an extra
instruction. Claude also gives the user feedback on what is missing or unclear.
A one-step undo restores the version before the last AI change.

## Non-Goals

- Refusal fallbacks to another model.
- Several undo steps or a version history.
- Splitting a raw text into several requirements.
- MCP access (package 5); the server function is prepared for it.
- Converting Markdown to Odoo HTML (package 4).

## Acceptance Criteria

1. "Prepare with AI" fills the title (only if empty), description and internal
   description in the given structure; the status becomes "Prepared".
2. "Refine" with an instruction revises the three fields based on their
   current state; without an instruction the button is disabled.
3. The description contains a Markdown checklist (`- [ ]`) and no internal
   information.
4. While Claude works, both buttons are disabled and a progress message shows;
   errors show as a visible message.
5. Before the call the page waits for running saves of the fields.
6. The prompt file is read on every call; model and effort come from
   `TICKET_FORGE_MODEL` / `TICKET_FORGE_EFFORT`, documented in `.env.example`.
7. Lint passes; a real test run with a sample meeting note gives a usable ticket.
8. (Answer 1b) "Undo AI change" restores title, description, internal
   description and status from before the last AI run.
9. (Answer 2) The create form has a checkbox "Prepare with AI", checked by
   default; when checked, the edit page starts the preparation right after
   creation.
10. (Answer 5) Claude's feedback to the user (missing information,
    contradictions, assumptions) shows on the edit page; it is not part of the
    ticket.

## Open Decisions

- **Answer schema** (structured outputs): `{ title, description,
  internalDescription, feedback }`. `feedback` is for the author of the
  requirement, empty if nothing is missing; "Open questions" in the description
  are questions to the customer and go to Odoo.
- **Feedback is stored** (`Requirement.aiFeedback`), so it survives a reload and
  MCP can return it later; each AI run replaces it.
- **Undo:** before an AI run the fields and the status are stored as JSON in
  `Requirement.previousValues`. Undo restores them and clears the column, so
  there is exactly one step back. It stays available until the next AI run, so
  small manual edits after the AI do not remove it; undo then also discards
  those edits, which the button label makes clear ("Undo AI change").
- **Title:** an empty title is generated; a set title is passed to Claude and
  kept unless the instruction asks to change it.
- **Prepare and refine share one call:** the template always gets the raw text
  and the current fields; `{{instruction}}` is empty for the first preparation.
  One prompt file keeps the rules in one place.
- **Automatic preparation after creation:** the create form navigates to
  `/ticket-forge/[id]?prepare=1`; the edit page starts the run and removes the
  parameter right away, so a reload does not start it again. Rejected: preparing
  inside the create request, which would leave the user on the form for the
  whole run without seeing the requirement.
- **Shared Claude helpers** `src/lib/claude.ts`: template filling and reading
  model/effort from the environment, used by the booking text review and Ticket
  Forge instead of a second copy.
- **Model:** `claude-sonnet-5-5` with effort `medium` as default in
  `.env.example`; `claude-opus-5-5` can be set without code changes.
- **No refusal fallback** (answer 3); a refusal shows as an error message.
- **Guide:** a Ticket Forge section in `docs/guides/claude-api.md` (answer 4).

## Checklist

- [x] Migration: `aiFeedback`, `previousValues`; status `prepared` in the types
- [x] Shared Claude helpers in `src/lib/claude.ts`, used by the booking text review
- [x] Prompt file `prompts/ticket-forge.md`
- [x] Server function `prepareRequirement(id, instruction)` and undo in the repository
- [x] Routes `POST /api/requirements/[id]/prepare` and `POST /api/requirements/[id]/undo`
- [x] Edit page: "Prepare with AI", instruction with "Refine", progress, errors, feedback, undo
- [x] Create form: checkbox "Prepare with AI" and automatic start on the edit page
- [x] `.env.example` with `TICKET_FORGE_MODEL` / `TICKET_FORGE_EFFORT`
- [x] Guide section in `docs/guides/claude-api.md`
- [x] Lint and a real test run with a sample meeting note
