import type { Ticket, TicketType } from "@/modules/Timesheet/entries";
import type { TicketGroupLists, TicketGroupRow, TicketGroupSearch, TicketLookup, TicketRow } from "./tickets";

// Data source of the ticket picker; the panels only use this interface.
export type TicketSource = {
  getFavorites(): Promise<TicketRow[]>;
  getRecentlyBooked(): Promise<TicketRow[]>;
  getRecentlyWorked(): Promise<TicketRow[]>;
  getGroupLists(type: TicketType): Promise<TicketGroupLists>;
  searchGroups(type: TicketType, query: string, signal?: AbortSignal): Promise<TicketGroupSearch>;
  setGroupPinned(group: TicketGroupRow, pinned: boolean): Promise<void>;
  // Also refreshes the group from Odoo, e.g. a changed name.
  openGroup(group: TicketGroupRow, onlyMine: boolean): Promise<{ group: TicketGroupRow; rows: TicketRow[] }>;
  lookup(type: TicketType, number: string, signal?: AbortSignal): Promise<TicketLookup>;
  // Stores a ticket from Odoo, so an entry can reference it.
  store(type: TicketType, odooId: number, favorite: boolean): Promise<Ticket>;
  setFavorite(ticketId: string, favorite: boolean): Promise<void>;
};

// Throws with the server's message, e.g. that Odoo is not reachable.
async function request<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(url, {
    ...rest,
    ...(json === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };

    throw new Error(body.error ?? `${rest.method ?? "GET"} ${url} failed with status ${response.status}`);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

const rows = async (url: string) => (await request<{ rows: TicketRow[] }>(url)).rows;

export const ticketSource: TicketSource = {
  getFavorites: () => rows("/api/tickets/favorites"),
  getRecentlyBooked: () => rows("/api/tickets/recently-booked"),
  getRecentlyWorked: () => rows("/api/tickets/recently-worked"),
  getGroupLists: (type) => request(`/api/ticket-groups?type=${type}`),
  searchGroups: (type, query, signal) =>
    request(`/api/ticket-groups/search?type=${type}&query=${encodeURIComponent(query)}`, { signal }),
  setGroupPinned: (group, pinned) => request("/api/ticket-groups/pin", { method: "PUT", json: { group, pinned } }),
  openGroup: (group, onlyMine) => request("/api/ticket-groups/tickets", { method: "POST", json: { group, onlyMine } }),
  lookup: (type, number, signal) => request("/api/tickets/lookup", { method: "POST", json: { type, number }, signal }),
  store: async (type, odooId, favorite) =>
    (await request<{ ticket: Ticket }>("/api/tickets", { method: "POST", json: { type, odooId, favorite } })).ticket,
  setFavorite: (ticketId, favorite) =>
    request(`/api/tickets/${encodeURIComponent(ticketId)}/favorite`, { method: "PUT", json: { favorite } }),
};
