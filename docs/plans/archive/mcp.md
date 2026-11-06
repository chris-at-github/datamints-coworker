# MCP for Claude Code

## Context & Goal

Work package 5 of Ticket Forge (see `docs/plans/archive/ticket-forge.md`). Claude Code
creates, reads, updates and refines requirements through an MCP server of the
app, so a requirement can come straight out of a Claude Code session. The
transfer to Odoo stays a click in the app.

## Non-Goals

- A transfer tool; undo and archive tools (answer 3).
- Claude Desktop.
- A public REST API besides MCP.
- Sessions, resumable streams or OAuth.
- A `.mcp.json` in this repository (answer 4: user scope).

## Acceptance Criteria

1. Claude Code connects with `claude mcp add --transport http …`; `/mcp` shows
   "ticket-forge" as connected with its tools.
2. Without or with a wrong token the route answers 401.
3. A requirement can be created from a Claude Code session; it shows in the
   app's list and, with `prepare`, is prepared.
4. Claude Code can read, update and refine a requirement; the changes show in
   the app.
5. There is no tool that transfers to Odoo; the answers contain the link to the
   requirement in the app.
6. Errors come back as understandable tool errors (e.g. "Requirement not found",
   missing AI configuration).
7. A guide describes the setup in Claude Code and the token.
8. Lint passes; a real test from Claude Code succeeds.
9. (Answer 1) A requirement stores whether it was created manually or through
   Claude Code; list and edit page show it.
10. (Answer 2) `create_requirement` prepares with the app's AI by default.

## Open Decisions

- **Official SDK** `@modelcontextprotocol/sdk` with
  `WebStandardStreamableHTTPServerTransport` in a Next.js route
  (`/api/mcp`), stateless: a new server and transport per request, JSON
  responses instead of SSE. Rejected: `mcp-handler`, an extra layer whose
  features (resumable streams, Redis) are not needed locally.
- **Token** `TICKET_FORGE_MCP_TOKEN` as bearer token, compared in constant
  time; without a configured token the route answers 503, so it is never open
  by accident.
- **Tools:** `create_requirement`, `get_requirement`, `list_requirements`,
  `update_requirement`, `refine_requirement`, `get_ticket_guidelines`. They call
  the repository and `prepareRequirement`, like the UI.
- **`get_ticket_guidelines`** returns the rules of `prompts/ticket-forge.md`
  without the placeholder sections, so Claude Code can write content in the same
  structure when it passes a finished description (`prepare: false`).
- **Source:** `Requirement.source`, `"manual"` or `"claude-code"`; the MCP tools
  create with `"claude-code"`. Shown as a small label in the list and in the
  meta line of the edit page.
- **Links:** answers contain the URL of the requirement page, built from
  `TICKET_FORGE_APP_URL` (default `https://datamints-coworker.ddev.site:3000`).
- **Certificate:** Node does not trust DDEV's mkcert certificate by default;
  if Claude Code cannot connect, `NODE_EXTRA_CA_CERTS` with mkcert's root CA is
  the documented way (answer 5), checked in the real test.
- **Scope user** (answer 4): `claude mcp add --scope user`, so every project of
  the user can use it; the token stays in the user's Claude Code configuration.

## Checklist

- [x] Migration: `Requirement.source`; label in list and edit page
- [x] MCP server with the six tools
- [x] Route `/api/mcp` with bearer token
- [x] `.env.example` with `TICKET_FORGE_MCP_TOKEN` and `TICKET_FORGE_APP_URL`
- [x] Tests with curl: 401, tools/list, each tool
- [x] Setup in Claude Code (user scope) and a real test
- [x] Guide `docs/guides/claude-code-mcp.md`
- [x] Lint and check all routes
