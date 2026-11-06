import { findRequirement, unlinkTicket } from "@/lib/requirement-repository";

// Removes the link to the Odoo ticket; nothing is changed or deleted in Odoo.
export async function POST(_request: Request, { params }: RouteContext<"/api/requirements/[id]/unlink">) {
  const { id } = await params;

  if (!(await findRequirement(id))) {
    return Response.json({ error: "Requirement not found" }, { status: 404 });
  }

  return Response.json({ requirement: await unlinkTicket(id) });
}
