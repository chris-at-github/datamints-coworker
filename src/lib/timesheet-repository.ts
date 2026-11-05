import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ArchivedPage,
  Ticket,
  TicketType,
  TimesheetEntry,
  TimesheetNeighbors,
  TimesheetPageData,
  TimesheetPageResult,
  TimesheetValues,
} from "@/modules/Timesheet/entries";

// Highest date first; pages on the same day are told apart by creation time.
const LATEST_FIRST: Prisma.TimesheetPageOrderByWithRelationInput[] = [{ date: "desc" }, { createdAt: "desc" }];

// Pagination, latest page and "New" only know pages that are not archived.
const NOT_ARCHIVED = { archivedAt: null } as const;

export const TICKET_SELECT = { id: true, type: true, odooId: true, number: true, title: true } as const;

// An entry without pageId and with its ticket; toEntry shapes it for the API.
const ENTRY_QUERY = {
  omit: { pageId: true },
  include: { ticket: { select: TICKET_SELECT } },
} as const;

type EntryRow = Prisma.TimesheetEntryGetPayload<typeof ENTRY_QUERY>;

// Takes only the display fields, so rows with more fields can be passed in.
// Only the application writes the type, so it is always a TicketType.
export function toTicket({ id, type, odooId, number, title }: Prisma.TicketGetPayload<{ select: typeof TICKET_SELECT }>): Ticket {
  return { id, type: type as TicketType, odooId, number, title };
}

// The API uses "" for "no ticket", the database null (a reference must exist).
function toEntry({ ticketId, ticket, ...values }: EntryRow): TimesheetEntry {
  return { ...values, ticketId: ticketId ?? "", ticket: ticket && toTicket(ticket) };
}

// Shapes database rows like the API response: entries in row order.
// createdAt is only needed to find the neighbours and is removed afterwards.
const PAGE_SELECT = {
  id: true,
  date: true,
  createdAt: true,
  archivedAt: true,
  entries: { orderBy: { sorting: "asc" }, ...ENTRY_QUERY },
} as const;

type PageRow = Prisma.TimesheetPageGetPayload<{ select: typeof PAGE_SELECT }>;

export async function findLatestPage(): Promise<TimesheetPageResult | null> {
  const page = await prisma.timesheetPage.findFirst({ where: NOT_ARCHIVED, orderBy: LATEST_FIRST, select: PAGE_SELECT });

  return page && withNavigation(page);
}

export async function findPage(id: string): Promise<TimesheetPageResult | null> {
  const page = await prisma.timesheetPage.findUnique({ where: { id }, select: PAGE_SELECT });

  return page && withNavigation(page);
}

// There is at most one page per day; the oldest wins if there are more.
export async function findPageIdByDate(date: string): Promise<string | null> {
  const page = await prisma.timesheetPage.findFirst({ where: { date }, orderBy: { createdAt: "asc" }, select: { id: true } });

  return page?.id ?? null;
}

export async function pageExists(id: string): Promise<boolean> {
  return (await prisma.timesheetPage.count({ where: { id } })) > 0;
}

// Adds what the header needs besides the page: the neighbours and the latest date.
// An archived page gets the neighbours it would have among the other pages.
async function withNavigation({ createdAt, archivedAt, entries, ...pageValues }: PageRow): Promise<TimesheetPageResult> {
  const page: TimesheetPageData = { ...pageValues, archived: archivedAt !== null, entries: entries.map(toEntry) };
  const [neighbors, latest] = await Promise.all([
    findNeighbors(page.date, createdAt),
    prisma.timesheetPage.findFirst({ where: NOT_ARCHIVED, orderBy: LATEST_FIRST, select: { date: true } }),
  ]);

  // Without any other page, the page itself counts as the latest one.
  return { page, neighbors, latestDate: latest?.date ?? page.date };
}

// Same order as LATEST_FIRST: by date, then by creation time.
async function findNeighbors(date: string, createdAt: Date): Promise<TimesheetNeighbors> {
  const [newer, older] = await Promise.all([
    prisma.timesheetPage.findFirst({
      where: { ...NOT_ARCHIVED, OR: [{ date: { gt: date } }, { date, createdAt: { gt: createdAt } }] },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    }),
    prisma.timesheetPage.findFirst({
      where: { ...NOT_ARCHIVED, OR: [{ date: { lt: date } }, { date, createdAt: { lt: createdAt } }] },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    }),
  ]);

  return { newerId: newer?.id ?? null, olderId: older?.id ?? null };
}

export function savePage(id: string, date: string): Promise<Pick<TimesheetPageData, "id" | "date">> {
  return prisma.timesheetPage.upsert({
    where: { id },
    create: { id, date },
    update: { date },
    select: { id: true, date: true },
  });
}

// Archives or restores a page; returns false if the page does not exist.
export async function setPageArchived(id: string, archived: boolean): Promise<boolean> {
  const { count } = await prisma.timesheetPage.updateMany({
    where: { id },
    data: { archivedAt: archived ? new Date() : null },
  });

  return count > 0;
}

// Newest first, like the pagination; only pages of sinceDate ("YYYY-MM-DD") or later.
export function findArchivedPages(sinceDate: string): Promise<ArchivedPage[]> {
  return prisma.timesheetPage.findMany({
    where: { archivedAt: { not: null }, date: { gte: sinceDate } },
    orderBy: LATEST_FIRST,
    select: { id: true, date: true },
  });
}

export async function findPageDate(id: string): Promise<string | null> {
  const page = await prisma.timesheetPage.findUnique({ where: { id }, select: { date: true } });

  return page?.date ?? null;
}

export type TimesheetEntryResult = {
  entry: TimesheetEntry;
  date: string;
  // Position in the table, counted from 1 in row order.
  rowNumber: number;
  // Number of entries on the page.
  entryCount: number;
  // Ids of the rows above and below, null at the ends.
  previousId: string | null;
  nextId: string | null;
};

// Returns null if the entry does not exist or belongs to another page.
export async function findEntry(pageId: string, id: string): Promise<TimesheetEntryResult | null> {
  const entry = await prisma.timesheetEntry.findFirst({
    where: { id, pageId },
    ...ENTRY_QUERY,
    include: { ...ENTRY_QUERY.include, page: { select: { date: true } } },
  });

  if (!entry) {
    return null;
  }

  const { page, ...values } = entry;
  const [rowsBefore, entryCount, previous, next] = await Promise.all([
    prisma.timesheetEntry.count({ where: { pageId, sorting: { lt: entry.sorting } } }),
    prisma.timesheetEntry.count({ where: { pageId } }),
    prisma.timesheetEntry.findFirst({
      where: { pageId, sorting: { lt: entry.sorting } },
      orderBy: { sorting: "desc" },
      select: { id: true },
    }),
    prisma.timesheetEntry.findFirst({
      where: { pageId, sorting: { gt: entry.sorting } },
      orderBy: { sorting: "asc" },
      select: { id: true },
    }),
  ]);

  return {
    entry: toEntry(values),
    date: page.date,
    rowNumber: rowsBefore + 1,
    entryCount,
    previousId: previous?.id ?? null,
    nextId: next?.id ?? null,
  };
}

export type EntryInput = {
  pageId: string;
  sorting: number;
  values: Partial<TimesheetValues>;
};

// Creates or updates an entry; returns null if its page does not exist.
// An unknown ticketId fails like any other database error.
export async function saveEntry(id: string, { pageId, sorting, values }: EntryInput): Promise<TimesheetEntry | null> {
  const page = await prisma.timesheetPage.findUnique({ where: { id: pageId }, select: { id: true } });

  if (!page) {
    return null;
  }

  const { ticketId, ...otherValues } = values;
  const data = ticketId === undefined ? otherValues : { ...otherValues, ticketId: ticketId || null };

  return toEntry(
    await prisma.timesheetEntry.upsert({
      where: { id },
      create: { id, pageId, sorting, ...data },
      update: { sorting, ...data },
      ...ENTRY_QUERY,
    }),
  );
}

// Deleting a missing entry is not an error, so repeated deletes are harmless.
export async function deleteEntry(id: string): Promise<void> {
  await prisma.timesheetEntry.deleteMany({ where: { id } });
}

// Loads an entry together with the date of its page, without knowing the page.
export async function findEntryWithDate(id: string): Promise<{ entry: TimesheetEntry; date: string } | null> {
  const entry = await prisma.timesheetEntry.findUnique({
    where: { id },
    ...ENTRY_QUERY,
    include: { ...ENTRY_QUERY.include, page: { select: { date: true } } },
  });

  if (!entry) {
    return null;
  }

  const { page, ...values } = entry;

  return { entry: toEntry(values), date: page.date };
}

// The entry with what a transfer needs: the page date and the ticket's Odoo data.
export async function findEntryForTransfer(id: string) {
  const entry = await prisma.timesheetEntry.findUnique({
    where: { id },
    ...ENTRY_QUERY,
    include: {
      page: { select: { date: true } },
      ticket: { select: { ...TICKET_SELECT, projectOdooId: true, allowsTimesheets: true } },
    },
  });

  if (!entry) {
    return null;
  }

  const { page, ticket, ...values } = entry;

  return { entry: toEntry({ ...values, ticket }), date: page.date, ticket };
}

export type TransferUpdate = {
  odooTimesheetId?: number;
  transferredValues?: string;
  transferError: string;
};

export async function saveTransfer(id: string, data: TransferUpdate): Promise<TimesheetEntry> {
  return toEntry(await prisma.timesheetEntry.update({ where: { id }, data, ...ENTRY_QUERY }));
}

// The next transfer creates a new line; the old line in Odoo is not touched.
export async function unlinkTransfer(id: string): Promise<TimesheetEntry | null> {
  const { count } = await prisma.timesheetEntry.updateMany({
    where: { id },
    data: { odooTimesheetId: null, transferredValues: "", transferError: "" },
  });

  return count > 0 ? toEntry(await prisma.timesheetEntry.findUniqueOrThrow({ where: { id }, ...ENTRY_QUERY })) : null;
}

export async function saveReviewedBookingText(
  id: string,
  bookingTextReviewed: string,
  reviewedValues: string,
): Promise<TimesheetEntry> {
  return toEntry(
    await prisma.timesheetEntry.update({ where: { id }, data: { bookingTextReviewed, reviewedValues }, ...ENTRY_QUERY }),
  );
}
