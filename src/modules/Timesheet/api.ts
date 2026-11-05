import { formatDate } from "@/lib/date";
import {
  createEmptyEntries,
  type TimesheetEntry,
  type TimesheetPageData,
  type TimesheetPageResult,
  type TransferResult,
} from "./entries";

const NEW_PAGE_ROW_COUNT = 5;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${url} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function put<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Without an id the latest page is loaded; the result is null if there is none yet.
export async function fetchPage(pageId?: string): Promise<TimesheetPageResult | null> {
  const url = pageId ? `/api/timesheet-pages/${encodeURIComponent(pageId)}` : "/api/timesheet-pages/latest";
  const result = await request<TimesheetPageResult | { page: null; neighbors: null; latestDate: null }>(url);

  return result.page ? result : null;
}

export async function saveEntry(pageId: string, entry: TimesheetEntry): Promise<void> {
  await put(`/api/timesheet-entries/${encodeURIComponent(entry.id)}`, { pageId, ...entry });
}

// Lets the server review the booking text; answers with the updated entry.
export async function reviewEntry(id: string): Promise<TimesheetEntry> {
  const { entry } = await request<{ entry: TimesheetEntry }>(`/api/timesheet-entries/${encodeURIComponent(id)}/review`, {
    method: "POST",
  });

  return entry;
}

// Transfers the entries to Odoo; the results carry the updated entries.
export async function transferEntries(ids: string[]): Promise<TransferResult[]> {
  const { results } = await request<{ results: TransferResult[] }>("/api/timesheet-entries/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  return results;
}

// Forgets the Odoo line of an entry, so the next transfer creates a new one.
export async function unlinkTransfer(id: string): Promise<TimesheetEntry> {
  const { entry } = await request<{ entry: TimesheetEntry }>(`/api/timesheet-entries/${encodeURIComponent(id)}/transfer`, {
    method: "DELETE",
  });

  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const url = `/api/timesheet-entries/${encodeURIComponent(id)}`;
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`DELETE ${url} failed with status ${response.status}`);
  }
}

// Archives or restores a page; the server refuses to archive today's page.
export async function setPageArchived(id: string, archived: boolean): Promise<void> {
  await request(`/api/timesheet-pages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived }),
  });
}

// Id of the page of a day ("YYYY-MM-DD"), or null if there is none.
export async function findPageIdByDate(date: string): Promise<string | null> {
  const response = await fetch(`/api/timesheet-pages?date=${encodeURIComponent(date)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Finding the page of ${date} failed with status ${response.status}`);
  }

  return ((await response.json()) as { id: string }).id;
}

// Creates a page with empty rows, for today by default; the rows are saved as
// well, so they are there after a reload.
export async function createPage(date = formatDate(new Date())): Promise<TimesheetPageData> {
  const page: TimesheetPageData = {
    id: crypto.randomUUID(),
    date,
    archived: false,
    entries: createEmptyEntries(NEW_PAGE_ROW_COUNT, 0),
  };

  await put(`/api/timesheet-pages/${encodeURIComponent(page.id)}`, { date: page.date });
  await Promise.all(page.entries.map((entry) => saveEntry(page.id, entry)));

  return page;
}
