import type { TicketGroupRow } from "@/modules/TicketPicker/tickets";
import type { Requirement, RequirementChanges } from "./requirements";

// Mirrors the server types of src/lib/requirement-transfer.ts, which the browser cannot import.
export type TransferField = "description" | "internalDescription";
export type FieldState = "empty" | "unchanged" | "changed";
export type FieldDecision = "replace" | "append" | "skip";
export type TransferCheck = Record<TransferField, FieldState>;

// Throws with the server's message if it sent one, e.g. a missing setting.
async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    throw new Error(body?.error ?? `${init.method} ${url} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestRequirement(url: string, init: RequestInit): Promise<Requirement> {
  const { requirement } = await request<{ requirement: Requirement }>(url, init);

  return requirement;
}

function requirementUrl(id: string, action = ""): string {
  return `/api/requirements/${encodeURIComponent(id)}${action}`;
}

export function createRequirement(rawText: string, title: string): Promise<Requirement> {
  return requestRequirement("/api/requirements", { method: "POST", body: JSON.stringify({ rawText, title }) });
}

// Sends only the changed fields, so fields saved at the same time do not overwrite each other.
export function updateRequirement(id: string, changes: RequirementChanges): Promise<Requirement> {
  return requestRequirement(requirementUrl(id), { method: "PATCH", body: JSON.stringify(changes) });
}

// Prepares the requirement with Claude, or refines it with an instruction; takes several seconds.
export function prepareRequirement(id: string, instruction = ""): Promise<Requirement> {
  return requestRequirement(requirementUrl(id, "/prepare"), { method: "POST", body: JSON.stringify({ instruction }) });
}

// Restores the version before the last AI run.
export function undoPreparation(id: string): Promise<Requirement> {
  return requestRequirement(requirementUrl(id, "/undo"), { method: "POST" });
}

// A team/project for a new ticket, an existing ticket by its stored id, or null to clear.
export function setTransferTarget(
  id: string,
  target: { group: Omit<TicketGroupRow, "pinned"> } | { ticketId: string } | null,
): Promise<Requirement> {
  return requestRequirement(requirementUrl(id, "/target"), { method: "PUT", body: JSON.stringify(target ?? {}) });
}

export async function checkTransfer(id: string): Promise<TransferCheck> {
  const { check } = await request<{ check: TransferCheck }>(requirementUrl(id, "/transfer/check"), { method: "POST" });

  return check;
}

export function transferRequirement(
  id: string,
  includeOriginal: boolean,
  decisions: Partial<Record<TransferField, FieldDecision>>,
): Promise<{ requirement: Requirement; skipped: TransferField[] }> {
  return request(requirementUrl(id, "/transfer"), { method: "POST", body: JSON.stringify({ includeOriginal, decisions }) });
}

// Removes the link to the Odoo ticket; nothing changes in Odoo.
export function unlinkTicket(id: string): Promise<Requirement> {
  return requestRequirement(requirementUrl(id, "/unlink"), { method: "POST" });
}
