import type { Requirement, RequirementChanges } from "./requirements";

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${init.method} ${url} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function createRequirement(rawText: string, title: string): Promise<Requirement> {
  const { requirement } = await request<{ requirement: Requirement }>("/api/requirements", {
    method: "POST",
    body: JSON.stringify({ rawText, title }),
  });

  return requirement;
}

// Sends only the changed fields, so fields saved at the same time do not overwrite each other.
export async function updateRequirement(id: string, changes: RequirementChanges): Promise<Requirement> {
  const { requirement } = await request<{ requirement: Requirement }>(`/api/requirements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });

  return requirement;
}
