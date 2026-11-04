import type { TicketGroupRow } from "@/modules/TicketPicker/tickets";
import { isTicketType } from "@/modules/Timesheet/entries";

// Reads a group sent by the picker; null if it is incomplete.
export function readGroup(value: unknown): Omit<TicketGroupRow, "pinned"> | null {
  const group = value as Partial<TicketGroupRow> | null;

  if (
    typeof group !== "object" ||
    group === null ||
    !isTicketType(group.type) ||
    !Number.isInteger(group.odooId) ||
    typeof group.name !== "string"
  ) {
    return null;
  }

  return {
    type: group.type,
    odooId: group.odooId as number,
    name: group.name,
    customer: typeof group.customer === "string" ? group.customer : "",
  };
}
