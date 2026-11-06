import { readJsonObject } from "@/lib/request";
import { findRequirement, setTransferTarget } from "@/lib/requirement-repository";
import { readGroup } from "@/lib/ticket-group-input";
import { storeUsedGroup } from "@/lib/ticket-picker";
import { prisma } from "@/lib/prisma";

// Sets the Odoo target: { group } (team/project from the picker) for a new
// ticket, { ticketId } (a stored ticket) for an existing one, or {} to clear it.
// After a transfer the target is fixed until the ticket is unlinked.
export async function PUT(request: Request, { params }: RouteContext<"/api/requirements/[id]/target">) {
  const { id } = await params;
  const body = await readJsonObject(request);
  const requirement = await findRequirement(id);

  if (!requirement) {
    return Response.json({ error: "Requirement not found" }, { status: 404 });
  }

  if (requirement.transferred) {
    return Response.json({ error: "Unlink the Odoo ticket before choosing another target" }, { status: 409 });
  }

  if (body?.group !== undefined) {
    const group = readGroup(body.group);

    if (!group) {
      return Response.json({ error: "group is incomplete" }, { status: 400 });
    }

    return Response.json({ requirement: await setTransferTarget(id, { groupId: await storeUsedGroup(group) }) });
  }

  if (typeof body?.ticketId === "string") {
    if ((await prisma.ticket.count({ where: { id: body.ticketId } })) === 0) {
      return Response.json({ error: "Ticket not found" }, { status: 400 });
    }

    return Response.json({ requirement: await setTransferTarget(id, { ticketId: body.ticketId }) });
  }

  return Response.json({ requirement: await setTransferTarget(id, null) });
}
