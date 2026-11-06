import { connection } from "next/server";
import { findRequirements } from "@/lib/requirement-repository";
import { RequirementList } from "@/modules/TicketForge/RequirementList";

export default async function TicketForgePage() {
  // Renders on every request, so the list is current.
  await connection();

  return <RequirementList requirements={await findRequirements(false)} />;
}
