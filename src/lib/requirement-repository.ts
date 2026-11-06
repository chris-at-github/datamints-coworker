import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { TICKET_SELECT, toTicket } from "@/lib/timesheet-repository";
import type {
  Requirement,
  RequirementChanges,
  RequirementSource,
  RequirementStatus,
  TransferredValues,
} from "@/modules/TicketForge/requirements";
import type { TicketType } from "@/modules/Timesheet/entries";

// A requirement with its Odoo target; toRequirement shapes it for the API.
// The hashes stay on the server, the ids come with the relations.
const REQUIREMENT_QUERY = {
  omit: { targetGroupId: true, ticketId: true, odooDescriptionHash: true, odooInternalHash: true },
  include: {
    targetGroup: { select: { id: true, type: true, odooId: true, name: true } },
    ticket: { select: TICKET_SELECT },
  },
} as const;

type RequirementRow = Prisma.RequirementGetPayload<typeof REQUIREMENT_QUERY>;

// Only the application writes status and types, so the casts hold.
function toRequirement({
  status,
  source,
  previousValues,
  targetGroup,
  ticket,
  transferredValues,
  createdAt,
  updatedAt,
  archivedAt,
  ...values
}: RequirementRow): Requirement {
  return {
    ...values,
    status: status as RequirementStatus,
    source: source as RequirementSource,
    canUndo: previousValues !== "",
    targetGroup: targetGroup && { ...targetGroup, type: targetGroup.type as TicketType },
    ticket: ticket && toTicket(ticket),
    transferred: transferredValues ? (JSON.parse(transferredValues) as TransferredValues) : null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    archived: archivedAt !== null,
  };
}

export type NewRequirement = {
  rawText: string;
  title?: string;
  // Without a description it starts as the raw text, so it can be worked on right away.
  description?: string;
  internalDescription?: string;
  source?: RequirementSource;
};

export async function createRequirement({
  rawText,
  title = "",
  description,
  internalDescription = "",
  source = "manual",
}: NewRequirement): Promise<Requirement> {
  const row = await prisma.requirement.create({
    data: { id: crypto.randomUUID(), title, rawText, description: description ?? rawText, internalDescription, source },
    ...REQUIREMENT_QUERY,
  });

  return toRequirement(row);
}

export async function findRequirement(id: string): Promise<Requirement | null> {
  const row = await prisma.requirement.findUnique({ where: { id }, ...REQUIREMENT_QUERY });

  return row && toRequirement(row);
}

// Latest change first; archived ones are listed on their own page.
export async function findRequirements(archived: boolean): Promise<Requirement[]> {
  const rows = await prisma.requirement.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { updatedAt: "desc" },
    ...REQUIREMENT_QUERY,
  });

  return rows.map(toRequirement);
}

async function requirementExists(id: string): Promise<boolean> {
  return (await prisma.requirement.count({ where: { id } })) > 0;
}

async function update(id: string, data: Prisma.RequirementUncheckedUpdateInput): Promise<Requirement> {
  return toRequirement(await prisma.requirement.update({ where: { id }, data, ...REQUIREMENT_QUERY }));
}

// Changes only the given fields; returns null if the requirement does not exist.
export async function updateRequirement(id: string, { archived, ...values }: RequirementChanges): Promise<Requirement | null> {
  if (!(await requirementExists(id))) {
    return null;
  }

  return update(id, { ...values, ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }) });
}

// The fields an AI run writes, and with the status those an undo restores.
export type PreparedValues = Pick<Requirement, "title" | "description" | "internalDescription">;

type PreviousValues = PreparedValues & { status: RequirementStatus };

// Stores the answer of an AI run; the values before it are kept for one undo.
// A transferred requirement keeps its status, the changes show as not transferred.
export async function savePreparation(id: string, values: PreparedValues, aiFeedback: string): Promise<Requirement> {
  const current = await prisma.requirement.findUniqueOrThrow({ where: { id } });
  const previous: PreviousValues = {
    title: current.title,
    description: current.description,
    internalDescription: current.internalDescription,
    status: current.status as RequirementStatus,
  };

  return update(id, {
    ...values,
    aiFeedback,
    status: current.status === "transferred" ? "transferred" : "prepared",
    previousValues: JSON.stringify(previous),
  });
}

// Restores the values before the last AI run; returns null if the requirement
// does not exist and leaves it unchanged if there is nothing to undo.
export async function undoPreparation(id: string): Promise<Requirement | null> {
  const current = await prisma.requirement.findUnique({ where: { id } });

  if (!current) {
    return null;
  }

  if (current.previousValues === "") {
    return findRequirement(id);
  }

  const previous = JSON.parse(current.previousValues) as PreviousValues;
  // A transfer after the AI run stays a transfer.
  const status = current.status === "transferred" ? "transferred" : previous.status;

  return update(id, { ...previous, status, aiFeedback: "", previousValues: "" });
}

// Sets the target of the next transfer: a team/project for a new ticket, or an
// existing ticket; only allowed while no ticket was created or linked by a transfer.
export async function setTransferTarget(
  id: string,
  target: { groupId: string } | { ticketId: string } | null,
): Promise<Requirement> {
  return update(id, {
    targetGroupId: target && "groupId" in target ? target.groupId : null,
    ticketId: target && "ticketId" in target ? target.ticketId : null,
  });
}

// The server-only transfer state: hashes of the Odoo fields after the last transfer.
export async function findTransferState(id: string) {
  return prisma.requirement.findUnique({
    where: { id },
    select: { odooDescriptionHash: true, odooInternalHash: true },
  });
}

export type TransferSave = {
  ticketId: string;
  odooDescriptionHash: string;
  odooInternalHash: string;
  transferred: TransferredValues;
};

export async function saveTransfer(id: string, { transferred, ...values }: TransferSave): Promise<Requirement> {
  return update(id, {
    ...values,
    targetGroupId: null,
    status: "transferred",
    transferredValues: JSON.stringify(transferred),
    transferError: "",
  });
}

export async function saveTransferError(id: string, transferError: string): Promise<Requirement> {
  return update(id, { transferError });
}

// Removes the link to the Odoo ticket; nothing changes in Odoo. The status goes
// back to prepared, or draft if there was no AI run.
export async function unlinkTicket(id: string): Promise<Requirement> {
  const current = await prisma.requirement.findUniqueOrThrow({ where: { id }, select: { aiFeedback: true, previousValues: true } });

  return update(id, {
    ticketId: null,
    targetGroupId: null,
    odooDescriptionHash: "",
    odooInternalHash: "",
    transferredValues: "",
    transferError: "",
    status: current.aiFeedback || current.previousValues ? "prepared" : "draft",
  });
}
