import { readJsonObject } from "@/lib/request";
import { transferEntries } from "@/lib/timesheet-transfer";

// Transfers the entries to Odoo and answers with one result per id; entries
// that cannot be transferred are skipped, failures are stored on the entry.
export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const ids = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return Response.json({ error: "ids must be a non-empty list of strings" }, { status: 400 });
  }

  return Response.json({ results: await transferEntries(ids) });
}
