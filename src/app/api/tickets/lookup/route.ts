import { readJsonObject } from "@/lib/request";
import { lookupTicket } from "@/lib/tickets";
import { isTicketType } from "@/modules/Timesheet/entries";

// Finds a ticket by type and number in Odoo and answers with the stored ticket.
// Odoo errors answer 502 with Odoo's message; they are logged on the server.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const number = typeof body?.number === "string" ? body.number.trim() : "";

  if (!isTicketType(body?.type) || !/^\d+$/.test(number)) {
    return Response.json({ error: "type must be helpdesk or project and number digits only" }, { status: 400 });
  }

  try {
    const ticket = await lookupTicket(body.type, number);

    return ticket ? Response.json({ ticket }) : Response.json({ error: "Ticket not found" }, { status: 404 });
  } catch (error) {
    console.error(error);

    return Response.json({ error: error instanceof Error ? error.message : "Lookup failed" }, { status: 502 });
  }
}
