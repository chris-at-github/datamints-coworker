import { readJsonObject } from "@/lib/request";
import { updateRequirement } from "@/lib/requirement-repository";
import type { RequirementChanges } from "@/modules/TicketForge/requirements";

const TEXT_FIELDS = ["title", "description", "internalDescription"] as const;

// Changes the given fields: title, description, internalDescription (strings)
// and archived (boolean); fields that are left out stay as they are.
export async function PATCH(request: Request, { params }: RouteContext<"/api/requirements/[id]">) {
  const body = await readJsonObject(request);

  if (!body) {
    return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  const changes: RequirementChanges = {};

  for (const field of TEXT_FIELDS) {
    if (field in body) {
      if (typeof body[field] !== "string") {
        return Response.json({ error: `${field} must be a string` }, { status: 400 });
      }

      changes[field] = body[field];
    }
  }

  if ("archived" in body) {
    if (typeof body.archived !== "boolean") {
      return Response.json({ error: "archived must be a boolean" }, { status: 400 });
    }

    changes.archived = body.archived;
  }

  const requirement = await updateRequirement((await params).id, changes);

  return requirement
    ? Response.json({ requirement })
    : Response.json({ error: "Requirement not found" }, { status: 404 });
}
