# Start the Dev Server with DDEV

## Context & Goal

The Next.js dev server runs only after a separate `ddev exec npm run dev` in a
terminal that has to stay open. It should start together with the DDEV
project instead, so the app is available as soon as `ddev start` is done.

## Non-Goals

- Starting DDEV automatically when WSL or Windows starts.
- A production instance (`next build` / `next start`) for daily use.
- Changing CLAUDE.md (decided by the user); only the guides are updated.

## Acceptance Criteria

- `ddev start` starts the Next.js dev server automatically, `ddev stop` stops
  it.
- The app is then reachable at <https://datamints-coworker.ddev.site:3000>
  without any further command.
- The output of the server can be read with `ddev logs`.
- There is a documented command to restart only the dev server.

## Open Decisions

- **`web_extra_daemons` in `.ddev/config.yaml`:** DDEV runs the command under
  supervisord in the web container, starts it with the project and restarts it
  if it crashes. Rejected: a post-start hook with `ddev exec`, which DDEV does
  not supervise and which would block or have to be sent to the background by
  hand.
- **Same command as before (`npm run dev`)**, so host, port and Turbopack stay
  as they are.
- **`npm run start` needs the daemon stopped first**, as both use port 3000;
  the guide says how.

## Checklist

- [x] Stop the dev server started by hand
- [x] `web_extra_daemons` entry, restart DDEV, check start, stop, logs and restart command
- [x] Update the guides (`ddev.md`, `git.md`, `prisma.md`, `setup.md`, index)
