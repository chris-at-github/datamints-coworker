# Rename the Project to Datamints Co-Worker

## Context & Goal

The project grows beyond a learning playground into a set of everyday tools,
starting with the timesheet. It is renamed from “datamints-works” to
“Datamints Co-Worker”, technically `datamints-coworker`. The metadata of the
app gets a real title and description, and the default Next.js favicon is
replaced by an own icon.

## Non-Goals

- Renaming the repository on GitHub and the project folder; the user does both
  after the merge, following the instructions from this package.
- Changing archived plans in `docs/plans/archive/`; they document the past.
- The logo in the header of the timesheet (own package).

## Acceptance Criteria

- The name “Datamints Co-Worker” or `datamints-coworker` is used in
  `package.json`, DDEV, README, CLAUDE.md, the guides and the metadata.
- The app runs at <https://datamints-coworker.ddev.site:3000>.
- The app has its own favicon.
- There are instructions in which order to rename the GitHub repository and the
  project folder.

## Open Decisions

- **Title template:** the root layout sets `title.template` to
  `%s | Datamints Co-Worker` with the plain name as default; pages only set
  their own part (e.g. “Timesheet”). Rejected: the full title in every page.
- **Favicon as SVG via `src/app/icon.svg`:** Next.js links the file
  automatically; it shows the lucide clock in a light gray square, the same
  motif as the planned logo. Rejected: a generated `.ico` with several sizes,
  which needs an extra tool; all current browsers support SVG favicons.
- **DDEV rename:** the old project is stopped and unlisted
  (`ddev stop --unlist datamints-works`) before starting under the new name, so
  DDEV does not keep a dead entry. This stops the running dev server.
- **Odoo user agent:** `src/lib/odoo-client.ts` sends the new name.
- **Example names in guides** (API key names) use the new name; keys that
  already exist keep their old name, which does not matter.

## Checklist

- [x] Rename in `package.json` and `package-lock.json`
- [x] Rename in `next.config.ts` (`allowedDevOrigins`) and the Odoo user agent
- [x] Rename in README, CLAUDE.md and the guides
- [x] Metadata: title template and description in the root layout, title of the timesheet and the start page heading
- [x] Favicon: add `src/app/icon.svg`, remove `src/app/favicon.ico`
- [x] Rename DDEV project, restart and check the new URL
- [x] Write instructions for the GitHub repository and the project folder
