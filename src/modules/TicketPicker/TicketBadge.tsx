import type { TicketType } from "@/modules/Timesheet/entries";
import styles from "./TicketBadge.module.css";

const ABBREVIATIONS: Record<TicketType, string> = { helpdesk: "HD", project: "PR" };
const LABELS: Record<TicketType, string> = { helpdesk: "Helpdesk ticket", project: "Project task" };

// "HD" or "PR"; screen readers read the full type.
export function TicketBadge({ type }: { type: TicketType }) {
  return (
    <abbr className={styles["ticket-badge"]} data-type={type} title={LABELS[type]}>
      {ABBREVIATIONS[type]}
    </abbr>
  );
}
