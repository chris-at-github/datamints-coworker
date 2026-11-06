import { answerFromOdoo } from "@/lib/odoo-route";
import { readJsonObject } from "@/lib/request";
import {
  type FieldDecision,
  TRANSFER_FIELDS,
  type TransferOptions,
  transferRequirement,
} from "@/lib/requirement-transfer";

const DECISIONS: FieldDecision[] = ["replace", "append", "skip"];

// Transfers the requirement: { includeOriginal: boolean, decisions: { description?,
// internalDescription? } } with "replace" | "append" | "skip" for changed fields.
// Answers with the requirement and the fields skipped for lack of a decision.
export async function POST(request: Request, { params }: RouteContext<"/api/requirements/[id]/transfer">) {
  const { id } = await params;
  const body = await readJsonObject(request);

  if (typeof body?.includeOriginal !== "boolean") {
    return Response.json({ error: "includeOriginal must be a boolean" }, { status: 400 });
  }

  const input = (body.decisions ?? {}) as Record<string, unknown>;
  const decisions: TransferOptions["decisions"] = {};

  for (const field of TRANSFER_FIELDS) {
    const decision = input[field];

    if (decision === undefined) {
      continue;
    }

    if (!DECISIONS.includes(decision as FieldDecision)) {
      return Response.json({ error: `decisions.${field} must be one of ${DECISIONS.join(", ")}` }, { status: 400 });
    }

    decisions[field] = decision as FieldDecision;
  }

  return answerFromOdoo(async () => {
    const outcome = await transferRequirement(id, { includeOriginal: body.includeOriginal as boolean, decisions });

    return outcome ? Response.json(outcome) : Response.json({ error: "Requirement not found" }, { status: 404 });
  });
}
