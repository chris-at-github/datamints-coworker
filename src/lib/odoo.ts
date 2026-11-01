import type { TicketType } from "@/modules/Timesheet/entries";

// URL templates per ticket type with an "{id}" placeholder; a missing type has no link.
export type TicketUrlTemplates = Partial<Record<TicketType, string>>;

// Server only: the variables are not prefixed with NEXT_PUBLIC_, so the browser
// gets them as props and a changed .env needs no rebuild.
export function readTicketUrlTemplates(): TicketUrlTemplates {
  return {
    helpdesk: process.env.ODOO_HELPDESK_TICKET_URL || undefined,
    project: process.env.ODOO_PROJECT_TASK_URL || undefined,
  };
}
