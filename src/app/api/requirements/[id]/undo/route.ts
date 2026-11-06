import { undoPreparation } from "@/lib/requirement-repository";

// Restores the version before the last AI run; without one nothing changes.
export async function POST(_request: Request, { params }: RouteContext<"/api/requirements/[id]/undo">) {
  const requirement = await undoPreparation((await params).id);

  return requirement
    ? Response.json({ requirement })
    : Response.json({ error: "Requirement not found" }, { status: 404 });
}
