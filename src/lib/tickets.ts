import { callOdoo } from "@/lib/odoo-client";
import { prisma } from "@/lib/prisma";
import { TICKET_SELECT, toTicket } from "@/lib/timesheet-repository";
import type { Ticket, TicketType } from "@/modules/Timesheet/entries";

// Odoo answers many2one fields as [id, display name], or false if empty.
type Many2One = [number, string] | false;

type OdooTicket = {
  id: number;
  name: string;
  project_id: Many2One;
};

type HelpdeskTicket = OdooTicket & { ticket_ref: string; use_helpdesk_timesheet: boolean };
type ProjectTask = OdooTicket & { allow_timesheets: boolean };

type FoundTicket = Omit<Ticket, "id"> & { projectOdooId: number | null; allowsTimesheets: boolean };

// The helpdesk number is ticket_ref, which can differ from the record id.
async function findHelpdeskTicket(number: string): Promise<FoundTicket | null> {
  const [ticket] = await callOdoo<HelpdeskTicket[]>("helpdesk.ticket", "search_read", {
    domain: [["ticket_ref", "=", number]],
    fields: ["name", "ticket_ref", "project_id", "use_helpdesk_timesheet"],
    limit: 1,
  });

  return ticket
    ? {
        type: "helpdesk",
        odooId: ticket.id,
        number: ticket.ticket_ref,
        title: ticket.name,
        projectOdooId: ticket.project_id ? ticket.project_id[0] : null,
        allowsTimesheets: ticket.use_helpdesk_timesheet,
      }
    : null;
}

// A task has no own number; the record id is shown as number in Odoo.
async function findProjectTask(number: string): Promise<FoundTicket | null> {
  const [task] = await callOdoo<ProjectTask[]>("project.task", "search_read", {
    domain: [["id", "=", Number(number)]],
    fields: ["name", "project_id", "allow_timesheets"],
    limit: 1,
  });

  return task
    ? {
        type: "project",
        odooId: task.id,
        number: String(task.id),
        title: task.name,
        projectOdooId: task.project_id ? task.project_id[0] : null,
        allowsTimesheets: task.allow_timesheets,
      }
    : null;
}

// Looks the number up in Odoo and stores the ticket, so its title stays current
// and it counts as recently used; returns null if Odoo has no such ticket or the
// user may not read it.
export async function lookupTicket(type: TicketType, number: string): Promise<Ticket | null> {
  const found = type === "helpdesk" ? await findHelpdeskTicket(number) : await findProjectTask(number);

  if (!found) {
    return null;
  }

  const values = { ...found, lastUsedAt: new Date() };
  const ticket = await prisma.ticket.upsert({
    where: { type_odooId: { type: found.type, odooId: found.odooId } },
    create: { id: crypto.randomUUID(), ...values },
    update: values,
    select: TICKET_SELECT,
  });

  return toTicket(ticket);
}
