// Shared by server and browser: the shape of a requirement in the API and the pages.

export type RequirementStatus = "draft" | "prepared";

export type Requirement = {
  id: string;
  title: string;
  rawText: string;
  description: string;
  internalDescription: string;
  status: RequirementStatus;
  // Claude's notes for the author; not part of the ticket.
  aiFeedback: string;
  // True while the version before the last AI run can be restored.
  canUndo: boolean;
  // ISO strings, so the values pass from server components to client components unchanged.
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

// The fields that can be edited after creation.
export type RequirementChanges = Partial<Pick<Requirement, "title" | "description" | "internalDescription" | "archived">>;

export const UNTITLED = "Untitled requirement";

export const STATUS_LABELS: Record<RequirementStatus, string> = {
  draft: "Draft",
  prepared: "Prepared",
};

// An empty title is kept empty in the data, so the AI can tell it from a real one.
export function getDisplayTitle(requirement: Pick<Requirement, "title">): string {
  return requirement.title.trim() || UNTITLED;
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(isoString: string): string {
  return DATE_TIME_FORMAT.format(new Date(isoString));
}
