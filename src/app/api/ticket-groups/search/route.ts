import { answerFromOdoo } from "@/lib/odoo-route";
import { searchGroups } from "@/lib/ticket-picker";
import { isTicketType } from "@/modules/Timesheet/entries";

const MIN_QUERY_LENGTH = 2;
const LIMIT = 15;

// Teams or projects matching the query, from Odoo: GET /api/ticket-groups/search?type=project&query=shop
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const query = params.get("query")?.trim() ?? "";

  if (!isTicketType(type) || query.length < MIN_QUERY_LENGTH) {
    return Response.json({ error: "type must be helpdesk or project and query at least 2 characters" }, { status: 400 });
  }

  return answerFromOdoo(async () => Response.json(await searchGroups(type, query, LIMIT)));
}
