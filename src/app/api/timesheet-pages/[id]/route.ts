import { formatDate } from "@/lib/date";
import { readJsonObject } from "@/lib/request";
import { findPage, findPageDate, savePage, setPageArchived } from "@/lib/timesheet-repository";

export async function GET(_request: Request, { params }: RouteContext<"/api/timesheet-pages/[id]">) {
  const result = await findPage((await params).id);

  return result ? Response.json(result) : Response.json({ error: "Page not found" }, { status: 404 });
}

// Creates or updates a page; the id comes from the browser.
export async function PUT(request: Request, { params }: RouteContext<"/api/timesheet-pages/[id]">) {
  const body = await readJsonObject(request);

  if (typeof body?.date !== "string") {
    return Response.json({ error: "date must be a string" }, { status: 400 });
  }

  return Response.json({ page: await savePage((await params).id, body.date) });
}

// Archives or restores a page: { archived: boolean }. Today's page cannot be
// archived; the server runs in the same time zone as the browser.
export async function PATCH(request: Request, { params }: RouteContext<"/api/timesheet-pages/[id]">) {
  const { id } = await params;
  const body = await readJsonObject(request);

  if (typeof body?.archived !== "boolean") {
    return Response.json({ error: "archived must be a boolean" }, { status: 400 });
  }

  const date = await findPageDate(id);

  if (date === null) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  if (body.archived && date === formatDate(new Date())) {
    return Response.json({ error: "Today's page cannot be archived" }, { status: 400 });
  }

  await setPageArchived(id, body.archived);

  return Response.json({ archived: body.archived });
}
