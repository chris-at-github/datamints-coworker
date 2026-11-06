import type { Requirement, RequirementChanges } from "./requirements";

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
