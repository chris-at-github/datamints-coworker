import { ClockIcon, HammerIcon } from "lucide-react";
import type { IconComponent } from "@/components/Icon/Icon";

// A tool of the Co-Worker with its own route; used by the sidebar, the start
// page and the logo header of the tool.
export type Area = {
  name: string;
  path: string;
  icon: IconComponent;
  description: string;
};

export const TIMESHEET_AREA: Area = {
  name: "Timesheet",
  path: "/timesheet",
  icon: ClockIcon,
  description: "Record your working time, review the booking texts with AI and transfer them to Odoo.",
};

export const TICKET_FORGE_AREA: Area = {
  name: "Ticket Forge",
  path: "/ticket-forge",
  icon: HammerIcon,
  description: "Turn customer requirements from meeting notes or emails into Odoo tickets.",
};

// Groups of the sidebar; a group without a name shows no heading.
export const AREA_GROUPS: { name?: string; areas: Area[] }[] = [{ areas: [TIMESHEET_AREA, TICKET_FORGE_AREA] }];

export const AREAS = AREA_GROUPS.flatMap((group) => group.areas);

// The area of a path, including its sub routes.
export function isAreaActive(area: Area, pathname: string): boolean {
  return pathname === area.path || pathname.startsWith(`${area.path}/`);
}
