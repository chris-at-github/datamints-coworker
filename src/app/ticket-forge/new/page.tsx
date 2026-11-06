import type { Metadata } from "next";
import { RequirementCreateForm } from "@/modules/TicketForge/RequirementCreateForm";

export const metadata: Metadata = {
  title: "New requirement",
};

export default function NewRequirementPage() {
  return <RequirementCreateForm />;
}
