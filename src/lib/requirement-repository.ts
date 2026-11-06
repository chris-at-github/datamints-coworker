import type { Requirement as RequirementRow } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Requirement, RequirementChanges, RequirementStatus } from "@/modules/TicketForge/requirements";

// Only the application writes the status, so it is always a RequirementStatus.
function toRequirement({ status, createdAt, updatedAt, archivedAt, ...values }: RequirementRow): Requirement {
  return {
    ...values,
    status: status as RequirementStatus,
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
