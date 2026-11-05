import { findLatestPage } from "@/lib/timesheet-repository";

// The latest page with its entries, neighbours, date and page list; all are null if there is no page yet.
export async function GET() {
  return Response.json((await findLatestPage()) ?? { page: null, neighbors: null, latestDate: null, pages: null });
}
