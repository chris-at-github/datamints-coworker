import { readJsonObject } from "@/lib/request";
import { setFavorite } from "@/lib/ticket-picker";

// Adds or removes a stored ticket as favorite; works without Odoo.
export async function PUT(request: Request, { params }: RouteContext<"/api/tickets/[id]/favorite">) {
  const body = await readJsonObject(request);

  if (typeof body?.favorite !== "boolean") {
    return Response.json({ error: "favorite must be a boolean" }, { status: 400 });
  }

  return (await setFavorite((await params).id, body.favorite))
    ? new Response(null, { status: 204 })
    : Response.json({ error: "Ticket not found" }, { status: 404 });
}
