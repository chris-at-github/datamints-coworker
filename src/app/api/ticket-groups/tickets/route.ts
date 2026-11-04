import { readGroup } from "@/lib/ticket-group-input";
import { answerFromOdoo } from "@/lib/odoo-route";
import { readJsonObject } from "@/lib/request";
import { openGroup } from "@/lib/ticket-picker";

// Opens a team or project: refreshes its name from Odoo, marks it as recently
// used and answers with the group and its open tickets, only those assigned to
// the user unless onlyMine is false.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const group = readGroup(body?.group);

  if (!group) {
    return Response.json({ error: "group must be complete" }, { status: 400 });
  }

  return answerFromOdoo(async () => Response.json(await openGroup(group.type, group.odooId, body?.onlyMine !== false)));
}
