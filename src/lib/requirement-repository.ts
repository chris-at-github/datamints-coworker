import type { Requirement as RequirementRow } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Requirement, RequirementChanges, RequirementStatus } from "@/modules/TicketForge/requirements";

// Only the application writes the status, so it is always a RequirementStatus.
function toRequirement({ status, previousValues, createdAt, updatedAt, archivedAt, ...values }: RequirementRow): Requirement {
  return {
    ...values,
    status: status as RequirementStatus,
    canUndo: previousValues !== "",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    archived: archivedAt !== null,
  };
}

// The description starts as the raw text, so it can be worked on right away.
export async function createRequirement(rawText: string, title: string): Promise<Requirement> {
  const row = await prisma.requirement.create({
    data: { id: crypto.randomUUID(), title, rawText, description: rawText },
  });

  return toRequirement(row);
}

export async function findRequirement(id: string): Promise<Requirement | null> {
  const row = await prisma.requirement.findUnique({ where: { id } });

  return row && toRequirement(row);
}

// Latest change first; archived ones are listed on their own page.
export async function findRequirements(archived: boolean): Promise<Requirement[]> {
  const rows = await prisma.requirement.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(toRequirement);
}

// Changes only the given fields; returns null if the requirement does not exist.
export async function updateRequirement(id: string, { archived, ...values }: RequirementChanges): Promise<Requirement | null> {
  if ((await prisma.requirement.count({ where: { id } })) === 0) {
    return null;
  }

  const row = await prisma.requirement.update({
    where: { id },
    data: { ...values, ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }) },
  });

  return toRequirement(row);
}

// The fields an AI run writes, and with the status those an undo restores.
export type PreparedValues = Pick<Requirement, "title" | "description" | "internalDescription">;

type PreviousValues = PreparedValues & { status: RequirementStatus };

// Stores the answer of an AI run; the values before it are kept for one undo.
export async function savePreparation(id: string, values: PreparedValues, aiFeedback: string): Promise<Requirement> {
  const current = await prisma.requirement.findUniqueOrThrow({ where: { id } });
  const previous: PreviousValues = {
    title: current.title,
    description: current.description,
    internalDescription: current.internalDescription,
    status: current.status as RequirementStatus,
  };
  const row = await prisma.requirement.update({
    where: { id },
    data: { ...values, aiFeedback, status: "prepared", previousValues: JSON.stringify(previous) },
  });

  return toRequirement(row);
}

// Restores the values before the last AI run; returns null if the requirement
// does not exist and leaves it unchanged if there is nothing to undo.
export async function undoPreparation(id: string): Promise<Requirement | null> {
  const current = await prisma.requirement.findUnique({ where: { id } });

  if (!current || current.previousValues === "") {
    return current && toRequirement(current);
  }

  const previous = JSON.parse(current.previousValues) as PreviousValues;
  const row = await prisma.requirement.update({
    where: { id },
    data: { ...previous, aiFeedback: "", previousValues: "" },
  });

  return toRequirement(row);
}
