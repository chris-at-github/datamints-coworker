import { addDuration, completeTime, getDuration, parseTime, roundTime } from "@/lib/time";

// Odoo models: "helpdesk" is helpdesk.ticket, "project" is project.task.
export const TICKET_TYPES = ["helpdesk", "project"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

// A ticket as stored after an Odoo lookup.
export type Ticket = {
  id: string;
  type: TicketType;
  // Odoo record id, used in links; the number shown in Odoo can differ.
  odooId: number;
  number: string;
  title: string;
};

// The editable values of one row.
export type TimesheetValues = {
  startTime: string;
  endTime: string;
  duration: string;
  // Id of the stored Ticket; "" means the entry has no ticket.
  ticketId: string;
  bookingText: string;
  bookingTextInternal: string;
  // Rewritten booking text, e.g. by the review; the original stays in bookingText.
  bookingTextReviewed: string;
};

export type TimesheetField = keyof TimesheetValues;

export const TIMESHEET_FIELDS: TimesheetField[] = [
  "startTime",
  "endTime",
  "duration",
  "ticketId",
  "bookingText",
  "bookingTextInternal",
  "bookingTextReviewed",
];

const TIME_FIELDS: TimesheetField[] = ["startTime", "endTime", "duration"];

// Named "entry" so it does not clash with the TimesheetRow component.
export type TimesheetEntry = TimesheetValues & {
  id: string;
  sorting: number;
  // The ticket of ticketId for display; it is not saved with the entry.
  ticket: Ticket | null;
  // Written by the transfer to Odoo only, see getTransferStatus.
  odooTimesheetId: number | null;
  transferredValues: string;
  transferError: string;
};

// not transferred, transferred, changed since the transfer, last transfer failed.
export type TransferStatus = "none" | "transferred" | "changed" | "error";

export type TransferResult = {
  id: string;
  // "skipped": not transferable, nothing stored; "failed": the error is stored on the entry.
  outcome: "transferred" | "skipped" | "failed";
  message: string;
  entry: TimesheetEntry | null;
};

// A page as delivered by the API: one day with its entries in row order.
export type TimesheetPageData = {
  id: string;
  date: string;
  entries: TimesheetEntry[];
};

// Ids of the pages before and after a page; null at the edges.
export type TimesheetNeighbors = {
  newerId: string | null;
  olderId: string | null;
};

export type TimesheetPageResult = {
  page: TimesheetPageData;
  neighbors: TimesheetNeighbors;
  // Date of the latest page, to tell whether a page for today exists.
  latestDate: string;
};

const EMPTY_VALUES: TimesheetValues = {
  startTime: "",
  endTime: "",
  duration: "",
  ticketId: "",
  bookingText: "",
  bookingTextInternal: "",
  bookingTextReviewed: "",
};

// Ids come from the browser, so new rows can be keyed and saved right away.
export function createEmptyEntries(count: number, firstSorting: number): TimesheetEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    ...EMPTY_VALUES,
    ticket: null,
    odooTimesheetId: null,
    transferredValues: "",
    transferError: "",
    id: crypto.randomUUID(),
    sorting: firstSorting + index,
  }));
}

// Sorting value for rows appended after the existing ones.
export function getNextSorting(entries: TimesheetEntry[]): number {
  return entries.reduce((max, entry) => Math.max(max, entry.sorting + 1), 0);
}

// A duration of "00:00" remains after clearing start or end time, so it counts as empty.
export function isEntryEmpty(entry: TimesheetEntry): boolean {
  return TIMESHEET_FIELDS.every((field) => entry[field] === "" || (field === "duration" && entry[field] === "00:00"));
}

// The booking text that counts, e.g. for the table and the export: the reviewed
// text, or the original as long as there is none.
export function getBookingTextField(entry: TimesheetValues): "bookingText" | "bookingTextReviewed" {
  return entry.bookingTextReviewed === "" ? "bookingText" : "bookingTextReviewed";
}

export function isTicketType(value: unknown): value is TicketType {
  return TICKET_TYPES.includes(value as TicketType);
}

// The values that go to Odoo; a stored copy tells whether the entry changed since.
export function getTransferValues(entry: TimesheetValues, date: string): string {
  return JSON.stringify({
    date,
    duration: entry.duration,
    ticketId: entry.ticketId,
    text: entry[getBookingTextField(entry)],
    internalNote: entry.bookingTextInternal,
  });
}

// Why an entry cannot be transferred, or null if it can.
export function getTransferBlocker(entry: TimesheetValues): string | null {
  if (entry.ticketId === "") {
    return "No ticket";
  }

  if (!parseTime(entry.duration)) {
    return "No duration";
  }

  return entry[getBookingTextField(entry)].trim() === "" ? "No booking text" : null;
}

// A failed transfer wins, so the message stays visible until a transfer works.
export function getTransferStatus(entry: TimesheetEntry, date: string): TransferStatus {
  if (entry.transferError !== "") {
    return "error";
  }

  if (entry.odooTimesheetId === null) {
    return "none";
  }

  return entry.transferredValues === getTransferValues(entry, date) ? "transferred" : "changed";
}

// Takes over only the transfer fields of the server's entry, so edits made in
// the meantime stay; without a server entry nothing changes.
export function applyTransferFields(entry: TimesheetEntry, transferred: TimesheetEntry | null): TimesheetEntry {
  return transferred
    ? {
        ...entry,
        odooTimesheetId: transferred.odooTimesheetId,
        transferredValues: transferred.transferredValues,
        transferError: transferred.transferError,
      }
    : entry;
}

// Sets or clears the ticket; the id is saved, the ticket is kept for display.
export function setTicket(entry: TimesheetEntry, ticket: Ticket | null): TimesheetEntry {
  return { ...entry, ticketId: ticket?.id ?? "", ticket };
}

// Start and end time drive the duration; an edited duration moves the end time.
export function updateEntry(entry: TimesheetEntry, field: TimesheetField, value: string): TimesheetEntry {
  const nextEntry = { ...entry, [field]: value };

  if (field === "startTime" || field === "endTime") {
    nextEntry.duration = getDuration(nextEntry.startTime, nextEntry.endTime);
  }

  if (field === "duration") {
    nextEntry.endTime = addDuration(nextEntry.startTime, value) ?? nextEntry.endTime;
  }

  return nextEntry;
}

// Completes and rounds a time field to a quarter hour, e.g. when leaving it;
// other fields and values that cannot be parsed are returned unchanged.
export function roundEntryTime(entry: TimesheetEntry, field: TimesheetField): TimesheetEntry {
  if (!TIME_FIELDS.includes(field)) {
    return entry;
  }

  const rounded = roundTime(completeTime(entry[field]));

  return rounded === null || rounded === entry[field] ? entry : updateEntry(entry, field, rounded);
}
