import { findPageIdByDate } from "@/lib/timesheet-repository";

// Finds the page of a day: GET /api/timesheet-pages?date=YYYY-MM-DD answers { id } or 404.
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const id = await findPageIdByDate(date);

  return id ? Response.json({ id }) : Response.json({ error: "Page not found" }, { status: 404 });
}
