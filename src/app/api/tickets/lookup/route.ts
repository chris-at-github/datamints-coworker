import { readJsonObject } from "@/lib/request";
import { lookupTicket } from "@/lib/ticket-picker";
import { isTicketType } from "@/modules/Timesheet/entries";

// Preview of "Enter number": the ticket of the type, or else the ticket with the
// same number of the other type; nothing is stored. Odoo errors answer 502.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const number = typeof body?.number === "string" ? body.number.trim() : "";

  if (!isTicketType(body?.type) || !/^\d+$/.test(number)) {
    return Response.json({ error: "type must be helpdesk or project and number digits only" }, { status: 400 });
  }

  try {
    return Response.json(await lookupTicket(body.type, number));
  } catch (error) {
    console.error(error);

    return Response.json({ error: error instanceof Error ? error.message : "Lookup failed" }, { status: 502 });
  }
}
