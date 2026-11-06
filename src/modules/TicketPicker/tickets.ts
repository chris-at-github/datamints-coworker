import type { Ticket, TicketType } from "@/modules/Timesheet/entries";

// A ticket as listed in the ticket picker, from Odoo or from the local tables.
export type TicketRow = {
  type: TicketType;
  odooId: number;
  number: string;
  title: string;
  // Name of the helpdesk team or the project.
  context: string;
  // Shown on the right: the stage, or date and duration for recently booked tickets.
  info: string;
  // The stored ticket, so it can be taken over without Odoo; null for rows from Odoo.
  ticket: Ticket | null;
};

// A helpdesk team or a project.
export type TicketGroupRow = {
  type: TicketType;
  odooId: number;
  name: string;
  customer: string;
  pinned: boolean;
};

// Full text of a team or project for its tooltip, e.g. "Relaunch – Customer";
// helpdesk teams have no customer.
export function getGroupTitle({ name, customer }: Pick<TicketGroupRow, "name" | "customer">): string {
  return customer ? `${name} – ${customer}` : name;
}

// Lists shown in the group choice before searching.
export type TicketGroupLists = {
  pinned: TicketGroupRow[];
  recent: TicketGroupRow[];
};

export type TicketGroupSearch = {
  groups: TicketGroupRow[];
  // Number of all matches; more than the shown groups means "refine the search".
  total: number;
};

// Preview of "Enter number": the ticket of the chosen type, or else the ticket
// with the same number of the other type as a hint.
export type TicketLookup = {
  ticket: TicketRow | null;
  other: TicketRow | null;
};

export function getRowKey(row: Pick<TicketRow, "type" | "odooId">): string {
  return `${row.type}-${row.odooId}`;
}
