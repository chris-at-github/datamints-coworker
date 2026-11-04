import { findGroupLists } from "@/lib/ticket-picker";
import { isTicketType } from "@/modules/Timesheet/entries";

// Pinned and recently used teams or projects: GET /api/ticket-groups?type=helpdesk; works without Odoo.
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");

  if (!isTicketType(type)) {
    return Response.json({ error: "type must be helpdesk or project" }, { status: 400 });
  }

  return Response.json(await findGroupLists(type));
}
