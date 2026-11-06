import { readJsonObject } from "@/lib/request";
import { createRequirement } from "@/lib/requirement-repository";

// Creates a requirement: { rawText: string, title?: string }.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const rawText = typeof body?.rawText === "string" ? body.rawText.trim() : "";
  const title = body?.title ?? "";

  if (!rawText) {
    return Response.json({ error: "rawText must be a non-empty string" }, { status: 400 });
  }

  if (typeof title !== "string") {
    return Response.json({ error: "title must be a string" }, { status: 400 });
  }

  return Response.json({ requirement: await createRequirement(rawText, title.trim()) }, { status: 201 });
}
