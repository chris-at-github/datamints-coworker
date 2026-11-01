import { unlinkTransfer } from "@/lib/timesheet-repository";

// Removes the link to the Odoo line, e.g. after the line was deleted in Odoo;
// the line itself is not touched. Answers with the updated entry.
export async function DELETE(_request: Request, { params }: RouteContext<"/api/timesheet-entries/[id]/transfer">) {
  const entry = await unlinkTransfer((await params).id);

  return entry ? Response.json({ entry }) : Response.json({ error: "Entry not found" }, { status: 404 });
}
