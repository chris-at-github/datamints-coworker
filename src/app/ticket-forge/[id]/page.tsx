import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { findRequirement } from "@/lib/requirement-repository";
import { RequirementEditor } from "@/modules/TicketForge/RequirementEditor";
import { getDisplayTitle } from "@/modules/TicketForge/requirements";

export async function generateMetadata({ params }: PageProps<"/ticket-forge/[id]">): Promise<Metadata> {
  const requirement = await findRequirement((await params).id);

  return { title: requirement ? getDisplayTitle(requirement) : "Requirement not found" };
}

// A static segment like "new" or "archive" wins over [id].
// ?prepare=1 comes from the create form with "Prepare with AI" checked.
export default async function RequirementPage({ params, searchParams }: PageProps<"/ticket-forge/[id]">) {
  // Renders on every request, so the requirement is current.
  await connection();
  const requirement = await findRequirement((await params).id);

  if (!requirement) {
    notFound();
  }

  return <RequirementEditor requirement={requirement} autoPrepare={(await searchParams).prepare === "1"} />;
}
