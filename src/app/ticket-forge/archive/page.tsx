import type { Metadata } from "next";
import { connection } from "next/server";
import { findRequirements } from "@/lib/requirement-repository";
import { RequirementArchive } from "@/modules/TicketForge/RequirementArchive";

export const metadata: Metadata = {
  title: "Archived requirements",
};

// A static segment wins over /ticket-forge/[id], so "archive" is never taken as an id.
export default async function RequirementArchivePage() {
  // Renders on every request, so the list is current.
  await connection();

  return <RequirementArchive requirements={await findRequirements(true)} />;
}
