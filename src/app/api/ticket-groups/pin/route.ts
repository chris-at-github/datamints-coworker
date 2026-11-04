import { readGroup } from "@/lib/ticket-group-input";
import { readJsonObject } from "@/lib/request";
import { setGroupPinned } from "@/lib/ticket-picker";

// Pins or unpins a team or project; works without Odoo.
export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  const group = readGroup(body?.group);

  if (!group || typeof body?.pinned !== "boolean") {
    return Response.json({ error: "group must be complete and pinned a boolean" }, { status: 400 });
  }

  await setGroupPinned(group, body.pinned);

  return new Response(null, { status: 204 });
}
