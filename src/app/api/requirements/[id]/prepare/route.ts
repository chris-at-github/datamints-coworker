import { readJsonObject } from "@/lib/request";
import { prepareRequirement } from "@/lib/requirement-preparation";

// Prepares a requirement with Claude, or refines it: { instruction?: string }.
// Answers with the stored requirement; 502 for configuration and API errors.
export async function POST(request: Request, { params }: RouteContext<"/api/requirements/[id]/prepare">) {
  const body = (await readJsonObject(request)) ?? {};
  const instruction = body.instruction ?? "";

  if (typeof instruction !== "string") {
    return Response.json({ error: "instruction must be a string" }, { status: 400 });
  }

  try {
    const requirement = await prepareRequirement((await params).id, instruction);

    return requirement
      ? Response.json({ requirement })
      : Response.json({ error: "Requirement not found" }, { status: 404 });
  } catch (error) {
    console.error(error);

    return Response.json({ error: error instanceof Error ? error.message : "Preparation failed" }, { status: 502 });
  }
}
