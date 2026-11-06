// Shared by server and browser: the shape of a requirement in the API and the pages.
import type { Ticket, TicketType } from "@/modules/Timesheet/entries";

export type RequirementStatus = "draft" | "prepared" | "transferred";

// Where a requirement was created: in the app or by Claude Code through MCP.
export type RequirementSource = "manual" | "claude-code";

export const SOURCE_LABELS: Record<RequirementSource, string> = {
  manual: "Manual",
  "claude-code": "Claude Code",
};

// A helpdesk team or project in which a new ticket is created.
export type RequirementTargetGroup = { id: string; type: TicketType; odooId: number; name: string };

// What the last transfer wrote, to show changes that are not transferred yet.
export type TransferredValues = {
  title: string;
  description: string;
  internalDescription: string;
  includeOriginal: boolean;
};

export type Requirement = {
  id: string;
  title: string;
  rawText: string;
  description: string;
  internalDescription: string;
  status: RequirementStatus;
  source: RequirementSource;
  // Claude's notes for the author; not part of the ticket.
  aiFeedback: string;
  // True while the version before the last AI run can be restored.
  canUndo: boolean;
  // Team/project for a new ticket; null once a ticket is linked or chosen.
  targetGroup: RequirementTargetGroup | null;
  // The existing or created Odoo ticket.
  ticket: Ticket | null;
  // Null until the first transfer.
  transferred: TransferredValues | null;
  // Message of the last failed transfer; empty after a successful one.
  transferError: string;
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
  transferred: "Transferred",
};

// True if title or descriptions differ from the last transfer.
export function hasUntransferredChanges(requirement: Requirement): boolean {
  const { transferred } = requirement;

  return (
    transferred !== null &&
    (transferred.title !== requirement.title ||
      transferred.description !== requirement.description ||
      transferred.internalDescription !== requirement.internalDescription)
  );
}

// An empty title is kept empty in the data, so the AI can tell it from a real one.
export function getDisplayTitle(requirement: Pick<Requirement, "title">): string {
  return requirement.title.trim() || UNTITLED;
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(isoString: string): string {
  return DATE_TIME_FORMAT.format(new Date(isoString));
}
