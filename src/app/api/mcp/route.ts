import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createTicketForgeMcpServer } from "@/lib/ticket-forge-mcp";

// Compares in constant time, so the token cannot be guessed from response times.
function isAuthorized(request: Request, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// MCP over Streamable HTTP for Claude Code, stateless: every request gets its
// own server and transport, answers are JSON instead of an event stream.
async function handle(request: Request): Promise<Response> {
  const token = process.env.TICKET_FORGE_MCP_TOKEN;

  // Without a token the endpoint stays closed instead of open by accident.
  if (!token) {
    return Response.json({ error: "TICKET_FORGE_MCP_TOKEN is not set, see docs/guides/claude-code-mcp.md" }, { status: 503 });
  }

  if (!isAuthorized(request, token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = createTicketForgeMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return transport.handleRequest(request);
}

export { handle as DELETE, handle as GET, handle as POST };
