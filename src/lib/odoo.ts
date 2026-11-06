import type { TicketType } from "@/modules/Timesheet/entries";

// URL templates with an "{id}" placeholder: per ticket type for tickets, and
// "<type>-group" for helpdesk teams and projects; a missing key has no link.
export type TicketUrlTemplates = Partial<Record<TicketType | `${TicketType}-group`, string>>;

// Server only: the variables are not prefixed with NEXT_PUBLIC_, so the browser
// gets them as props and a changed .env needs no rebuild.
export function readTicketUrlTemplates(): TicketUrlTemplates {
  return {
    helpdesk: process.env.ODOO_HELPDESK_TICKET_URL || undefined,
    project: process.env.ODOO_PROJECT_TASK_URL || undefined,
    "helpdesk-group": process.env.ODOO_HELPDESK_TEAM_URL || undefined,
    "project-group": process.env.ODOO_PROJECT_URL || undefined,
  };
}
