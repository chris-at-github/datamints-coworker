import { findRecentlyBooked } from "@/lib/ticket-picker";

// Tickets of the latest entries; works without Odoo.
export async function GET() {
  return Response.json({ rows: await findRecentlyBooked() });
}
