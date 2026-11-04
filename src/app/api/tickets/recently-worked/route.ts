import { answerFromOdoo } from "@/lib/odoo-route";
import { findRecentlyWorked } from "@/lib/ticket-picker";

// Open tickets and tasks assigned to the user, from Odoo.
export async function GET() {
  return answerFromOdoo(async () => Response.json({ rows: await findRecentlyWorked() }));
}
