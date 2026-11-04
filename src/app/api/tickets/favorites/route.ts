import { findFavorites } from "@/lib/ticket-picker";

// Stored favorites; works without Odoo.
export async function GET() {
  return Response.json({ rows: await findFavorites() });
}
