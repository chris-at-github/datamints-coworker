import { answerFromOdoo } from "@/lib/odoo-route";
import { readJsonObject } from "@/lib/request";
import { storeTicket } from "@/lib/ticket-picker";
import { isTicketType } from "@/modules/Timesheet/entries";

// Stores a ticket read from Odoo, optionally as favorite, and answers with the
// stored ticket that an entry can reference.
export async function POST(request: Request) {
  const body = await readJsonObject(request);

  if (!isTicketType(body?.type) || !Number.isInteger(body.odooId)) {
    return Response.json({ error: "type must be helpdesk or project and odooId an integer" }, { status: 400 });
  }

  const { type, odooId, favorite } = body;

  return answerFromOdoo(async () => {
    const ticket = await storeTicket(type, odooId as number, favorite === true);

    return ticket ? Response.json({ ticket }) : Response.json({ error: "Ticket not found" }, { status: 404 });
  });
}
