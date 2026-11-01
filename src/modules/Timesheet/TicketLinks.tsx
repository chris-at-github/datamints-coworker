"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { TicketUrlTemplates } from "@/lib/odoo";
import type { Ticket } from "./entries";

const TicketLinksContext = createContext<TicketUrlTemplates>({});

export type TicketLinksProviderProps = {
  templates: TicketUrlTemplates;
  children: ReactNode;
};

// Set once in the timesheet layout, so the rows do not pass the templates down.
export function TicketLinksProvider({ templates, children }: TicketLinksProviderProps) {
  return <TicketLinksContext value={templates}>{children}</TicketLinksContext>;
}

// The Odoo URL of a ticket; null without a ticket or a template for its type.
export function useTicketUrl(ticket: Ticket | null): string | null {
  const templates = useContext(TicketLinksContext);
  const template = ticket ? templates[ticket.type] : undefined;

  return ticket && template ? template.replaceAll("{id}", String(ticket.odooId)) : null;
}
