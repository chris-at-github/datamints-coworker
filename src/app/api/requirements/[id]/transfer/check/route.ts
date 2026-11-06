import { answerFromOdoo } from "@/lib/odoo-route";
import { checkTransfer } from "@/lib/requirement-transfer";

// Per field whether it is empty, unchanged since the last transfer or changed
// in Odoo; the dialog asks for a decision for every changed field.
export async function POST(_request: Request, { params }: RouteContext<"/api/requirements/[id]/transfer/check">) {
  const { id } = await params;

  return answerFromOdoo(async () => {
    const check = await checkTransfer(id);

    return check ? Response.json({ check }) : Response.json({ error: "Requirement not found" }, { status: 404 });
  });
}
