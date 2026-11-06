import type { Prisma } from "@/generated/prisma/client";
import { callOdoo, getOdooUid } from "@/lib/odoo-client";
import { prisma } from "@/lib/prisma";
import { formatDuration, parseTime } from "@/lib/time";
import { TICKET_SELECT, toTicket } from "@/lib/timesheet-repository";
import type { TicketGroupLists, TicketGroupRow, TicketGroupSearch, TicketLookup, TicketRow } from "@/modules/TicketPicker/tickets";
import type { Ticket, TicketType } from "@/modules/Timesheet/entries";

// Server only: the queries of the ticket picker, in Odoo and in the local tables.

// Odoo answers many2one fields as [id, display name], or false if empty.
type Many2One = [number, string] | false;

type HelpdeskTicket = {
  id: number;
  name: string;
  ticket_ref: string;
  project_id: Many2One;
  team_id: Many2One;
  stage_id: Many2One;
  use_helpdesk_timesheet: boolean;
  write_date: string;
};

type ProjectTask = {
  id: number;
  name: string;
  project_id: Many2One;
  stage_id: Many2One;
  allow_timesheets: boolean;
  write_date: string;
};

// A ticket from Odoo with what storing it needs.
type OdooTicket = TicketRow & {
  projectOdooId: number | null;
  allowsTimesheets: boolean;
  group: { odooId: number; name: string } | null;
  // "YYYY-MM-DD HH:MM:SS" in UTC, so it sorts as text.
  changedAt: string;
};

const HELPDESK_FIELDS = ["name", "ticket_ref", "project_id", "team_id", "stage_id", "use_helpdesk_timesheet", "write_date"];
const TASK_FIELDS = ["name", "project_id", "stage_id", "allow_timesheets", "write_date"];

// Open: helpdesk stages that are not folded, tasks that are neither done nor cancelled.
const OPEN_HELPDESK = [["stage_id.fold", "=", false]];
const OPEN_TASKS = [["state", "not in", ["1_done", "1_canceled"]]];

const LIST_LIMIT = 100;
const RECENT_LIMIT = 20;
const RECENT_GROUP_LIMIT = 5;

const name = (field: Many2One) => (field ? field[1] : "");
const groupOf = (field: Many2One) => (field ? { odooId: field[0], name: field[1] } : null);

function fromHelpdesk(ticket: HelpdeskTicket): OdooTicket {
  return {
    type: "helpdesk",
    odooId: ticket.id,
    // The helpdesk number is ticket_ref, which can differ from the record id.
    number: ticket.ticket_ref,
    title: ticket.name,
    context: name(ticket.team_id),
    info: name(ticket.stage_id),
    ticket: null,
    projectOdooId: ticket.project_id ? ticket.project_id[0] : null,
    allowsTimesheets: ticket.use_helpdesk_timesheet,
    group: groupOf(ticket.team_id),
    changedAt: ticket.write_date,
  };
}

function fromTask(task: ProjectTask): OdooTicket {
  return {
    type: "project",
    odooId: task.id,
    // A task has no own number; the record id is shown as number in Odoo.
    number: String(task.id),
    title: task.name,
    context: name(task.project_id),
    info: name(task.stage_id),
    ticket: null,
    projectOdooId: task.project_id ? task.project_id[0] : null,
    allowsTimesheets: task.allow_timesheets,
    group: groupOf(task.project_id),
    changedAt: task.write_date,
  };
}

// Only the row fields go to the browser.
function toRow({ type, odooId, number, title, context, info, ticket }: OdooTicket): TicketRow {
  return { type, odooId, number, title, context, info, ticket };
}

async function searchTickets(type: TicketType, domain: unknown[], limit: number): Promise<OdooTicket[]> {
  if (type === "helpdesk") {
    const tickets = await callOdoo<HelpdeskTicket[]>("helpdesk.ticket", "search_read", {
      domain,
      fields: HELPDESK_FIELDS,
      order: "write_date desc",
      limit,
    });

    return tickets.map(fromHelpdesk);
  }

  const tasks = await callOdoo<ProjectTask[]>("project.task", "search_read", {
    domain,
    fields: TASK_FIELDS,
    order: "write_date desc",
    limit,
  });

  return tasks.map(fromTask);
}

// A number must be digits only; task numbers are record ids.
function numberDomain(type: TicketType, number: string): unknown[] {
  return type === "helpdesk" ? [["ticket_ref", "=", number]] : [["id", "=", Number(number)]];
}

const otherType = (type: TicketType): TicketType => (type === "helpdesk" ? "project" : "helpdesk");

// Live preview of "Enter number"; nothing is stored.
export async function lookupTicket(type: TicketType, number: string): Promise<TicketLookup> {
  const [[ticket], [other]] = await Promise.all([
    searchTickets(type, numberDomain(type, number), 1),
    searchTickets(otherType(type), numberDomain(otherType(type), number), 1),
  ]);

  return { ticket: ticket ? toRow(ticket) : null, other: ticket || !other ? null : toRow(other) };
}

async function upsertGroup(type: TicketType, group: { odooId: number; name: string; customer?: string }) {
  const values = { name: group.name, ...(group.customer === undefined ? {} : { customer: group.customer }) };

  return prisma.ticketGroup.upsert({
    where: { type_odooId: { type, odooId: group.odooId } },
    create: { id: crypto.randomUUID(), type, odooId: group.odooId, ...values },
    update: values,
    select: { id: true },
  });
}

// Reads the ticket from Odoo and stores it with its group, so the title stays
// current; returns null if Odoo has no such ticket or the user may not read it.
export async function storeTicket(type: TicketType, odooId: number, favorite = false): Promise<Ticket | null> {
  const [found] = await searchTickets(type, [["id", "=", odooId]], 1);

  if (!found) {
    return null;
  }

  const group = found.group && (await upsertGroup(type, found.group));
  const values = {
    number: found.number,
    title: found.title,
    projectOdooId: found.projectOdooId,
    allowsTimesheets: found.allowsTimesheets,
    groupId: group?.id ?? null,
    lastUsedAt: new Date(),
    ...(favorite ? { favoritedAt: new Date() } : {}),
  };
  const ticket = await prisma.ticket.upsert({
    where: { type_odooId: { type, odooId } },
    create: { id: crypto.randomUUID(), type, odooId, ...values },
    update: values,
    select: TICKET_SELECT,
  });

  return toTicket(ticket);
}

// Open tickets and tasks assigned to the user, the latest change first, both types mixed.
export async function findRecentlyWorked(): Promise<TicketRow[]> {
  const uid = await getOdooUid();
  const [tickets, tasks] = await Promise.all([
    searchTickets("helpdesk", [["user_id", "=", uid], ...OPEN_HELPDESK], RECENT_LIMIT),
    searchTickets("project", [["user_ids", "in", [uid]], ...OPEN_TASKS], RECENT_LIMIT),
  ]);

  return [...tickets, ...tasks]
    .sort((first, second) => second.changedAt.localeCompare(first.changedAt))
    .slice(0, RECENT_LIMIT)
    .map(toRow);
}

// Open tickets of a team or open tasks of a project.
export async function findOpenTickets(type: TicketType, groupOdooId: number, onlyMine: boolean): Promise<TicketRow[]> {
  const uid = await getOdooUid();
  const domain =
    type === "helpdesk"
      ? [["team_id", "=", groupOdooId], ...OPEN_HELPDESK, ...(onlyMine ? [["user_id", "=", uid]] : [])]
      : [["project_id", "=", groupOdooId], ...OPEN_TASKS, ...(onlyMine ? [["user_ids", "in", [uid]]] : [])];

  return (await searchTickets(type, domain, LIST_LIMIT)).map(toRow);
}

type OdooGroup = { id: number; name: string; partner_id?: Many2One };

// All conditions of a group search in one place; a filter by project phase
// (stage_id) can be added here later.
function groupDomain(type: TicketType, query: string): unknown[] {
  return type === "helpdesk"
    ? [["name", "ilike", query]]
    : [["active", "=", true], "|", ["name", "ilike", query], ["partner_id.name", "ilike", query]];
}

// Teams by name, projects by name or customer.
export async function searchGroups(type: TicketType, query: string, limit: number): Promise<TicketGroupSearch> {
  const model = type === "helpdesk" ? "helpdesk.team" : "project.project";
  const domain = groupDomain(type, query);
  const [groups, total, pinned] = await Promise.all([
    callOdoo<OdooGroup[]>(model, "search_read", {
      domain,
      fields: type === "helpdesk" ? ["name"] : ["name", "partner_id"],
      order: "name",
      limit,
    }),
    callOdoo<number>(model, "search_count", { domain }),
    prisma.ticketGroup.findMany({ where: { type, pinnedAt: { not: null } }, select: { odooId: true } }),
  ]);
  const pinnedIds = new Set(pinned.map((group) => group.odooId));

  return {
    groups: groups.map((group) => ({
      type,
      odooId: group.id,
      name: group.name,
      customer: group.partner_id ? group.partner_id[1] : "",
      pinned: pinnedIds.has(group.id),
    })),
    total,
  };
}

type GroupRecord = { type: string; odooId: number; name: string; customer: string; pinnedAt: Date | null };

function toGroupRow({ type, odooId, name, customer, pinnedAt }: GroupRecord): TicketGroupRow {
  return { type: type as TicketType, odooId, name, customer, pinned: pinnedAt !== null };
}

const GROUP_SELECT = { type: true, odooId: true, name: true, customer: true, pinnedAt: true } as const;

// Pinned groups by name and the latest used ones that are not pinned.
export async function findGroupLists(type: TicketType): Promise<TicketGroupLists> {
  const [pinned, recent] = await Promise.all([
    prisma.ticketGroup.findMany({ where: { type, pinnedAt: { not: null } }, orderBy: { name: "asc" }, select: GROUP_SELECT }),
    prisma.ticketGroup.findMany({
      where: { type, pinnedAt: null, lastUsedAt: { not: null } },
      orderBy: { lastUsedAt: "desc" },
      take: RECENT_GROUP_LIMIT,
      select: GROUP_SELECT,
    }),
  ]);

  return { pinned: pinned.map(toGroupRow), recent: recent.map(toGroupRow) };
}

export async function setGroupPinned(group: Omit<TicketGroupRow, "pinned">, pinned: boolean): Promise<void> {
  const { id } = await upsertGroup(group.type, group);

  await prisma.ticketGroup.update({ where: { id }, data: { pinnedAt: pinned ? new Date() : null } });
}

// Stores a group chosen as target, e.g. in Ticket Forge, as recently used; returns its id.
export async function storeUsedGroup(group: Omit<TicketGroupRow, "pinned">): Promise<string> {
  const { id } = await upsertGroup(group.type, group);

  await prisma.ticketGroup.update({ where: { id }, data: { lastUsedAt: new Date() } });

  return id;
}

// Opens a group: reads its current name and customer from Odoo, stores it as
// recently used and answers with its open tickets.
export async function openGroup(
  type: TicketType,
  odooId: number,
  onlyMine: boolean,
): Promise<{ group: TicketGroupRow; rows: TicketRow[] }> {
  const [[record], rows] = await Promise.all([
    callOdoo<OdooGroup[]>(type === "helpdesk" ? "helpdesk.team" : "project.project", "read", {
      ids: [odooId],
      fields: type === "helpdesk" ? ["name"] : ["name", "partner_id"],
    }),
    findOpenTickets(type, odooId, onlyMine),
  ]);
  const { id } = await upsertGroup(type, {
    odooId,
    name: record.name,
    customer: record.partner_id ? record.partner_id[1] : "",
  });
  const group = await prisma.ticketGroup.update({ where: { id }, data: { lastUsedAt: new Date() }, select: GROUP_SELECT });

  return { group: toGroupRow(group), rows };
}

type StoredTicket = Prisma.TicketGetPayload<{ select: typeof TICKET_SELECT }>;

// A row of a stored ticket, which can be taken over without Odoo.
function toStoredRow(stored: StoredTicket, info: string): TicketRow {
  const ticket = toTicket(stored);

  return { type: ticket.type, odooId: ticket.odooId, number: ticket.number, title: ticket.title, context: ticket.context, info, ticket };
}

// Favorites in the order they were added; no Odoo request.
export async function findFavorites(): Promise<TicketRow[]> {
  const tickets = await prisma.ticket.findMany({
    where: { favoritedAt: { not: null } },
    orderBy: { favoritedAt: "asc" },
    select: TICKET_SELECT,
  });

  return tickets.map((ticket) => toStoredRow(ticket, ""));
}

export async function setFavorite(ticketId: string, favorite: boolean): Promise<boolean> {
  const { count } = await prisma.ticket.updateMany({
    where: { id: ticketId },
    data: { favoritedAt: favorite ? new Date() : null },
  });

  return count > 0;
}

// Tickets of the latest entries, newest page first, each once with date and
// duration of its latest booking; no Odoo request.
export async function findRecentlyBooked(): Promise<TicketRow[]> {
  const entries = await prisma.timesheetEntry.findMany({
    where: { ticketId: { not: null } },
    orderBy: [{ page: { date: "desc" } }, { sorting: "desc" }],
    take: 200,
    select: { duration: true, page: { select: { date: true } }, ticket: { select: TICKET_SELECT } },
  });
  const rows = new Map<string, TicketRow>();

  for (const { duration, page, ticket } of entries) {
    if (ticket && !rows.has(ticket.id) && rows.size < RECENT_LIMIT) {
      rows.set(ticket.id, toStoredRow(ticket, `${page.date}, ${formatDuration(parseTime(duration) ?? 0)} h`));
    }
  }

  return [...rows.values()];
}
