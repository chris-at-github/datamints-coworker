import { addDuration, completeTime, formatTime, getDuration, parseTime, roundTime } from "@/lib/time";

// Odoo models: "project" is project.task, "helpdesk" is helpdesk.ticket.
// The order is the order of the choice in the ticket dialog.
export const TICKET_TYPES = ["project", "helpdesk"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

// A ticket as stored after an Odoo lookup.
export type Ticket = {
  id: string;
  type: TicketType;
  // Odoo record id, used in links; the number shown in Odoo can differ.
  odooId: number;
  number: string;
  title: string;
  // Name of the helpdesk team or the project; empty if unknown.
  context: string;
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
  // Written by the review only, see needsReview.
  reviewedValues: string;
  // Written by the transfer to Odoo only, see getTransferStatus.
  odooTimesheetId: number | null;
  transferredValues: string;
  transferError: string;
};

// not transferred, transferred, changed since the transfer, last transfer failed.
export type TransferStatus = "none" | "transferred" | "changed" | "error";

// The status in the table: the transfer status, and before the transfer whether
// the AI reviewed the current values.
export type EntryStatus = "open" | "reviewed" | "transferred" | "changed" | "error";

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
  // Archived pages are left out of the pagination but stay reachable by URL.
  archived: boolean;
  entries: TimesheetEntry[];
};

// A page in a list, e.g. the date dropdown or the archived pages.
export type PageSummary = {
  id: string;
  date: string;
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
  // All pages that are not archived, newest first, for the date dropdown.
  pages: PageSummary[];
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
    reviewedValues: "",
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

export type TimesheetTotals = {
  // Earliest start and latest end, "" without any valid time.
  startTime: string;
  endTime: string;
  // Sum of all durations as "HH:MM" like the rows, e.g. "08:45"; breaks between
  // entries do not count. Above 24 hours it goes on, e.g. "25:30".
  duration: string;
};

// Empty and invalid values are left out.
export function getTotals(entries: TimesheetValues[]): TimesheetTotals {
  const minutesOf = (field: "startTime" | "endTime" | "duration") =>
    entries.map((entry) => parseTime(entry[field])).filter((minutes) => minutes !== null);
  const starts = minutesOf("startTime");
  const ends = minutesOf("endTime");

  return {
    startTime: starts.length > 0 ? formatTime(Math.min(...starts)) : "",
    endTime: ends.length > 0 ? formatTime(Math.max(...ends)) : "",
    duration: formatTime(minutesOf("duration").reduce((sum, minutes) => sum + minutes, 0)),
  };
}

// The values the review depends on: the displayed text and the duration, which
// picks the size block of the prompt.
export function getReviewValues(entry: TimesheetValues): string {
  return JSON.stringify({ text: entry[getBookingTextField(entry)], duration: entry.duration });
}

// Never reviewed, or changed since the last review.
export function needsReview(entry: TimesheetEntry): boolean {
  return entry.reviewedValues !== getReviewValues(entry);
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

// Error > changed > transferred > AI reviewed > open; an entry changed after its
// review is open again, as needsReview compares with the current values.
export function getEntryStatus(entry: TimesheetEntry, date: string): EntryStatus {
  const transferStatus = getTransferStatus(entry, date);

  if (transferStatus !== "none") {
    return transferStatus;
  }

  return needsReview(entry) ? "open" : "reviewed";
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
