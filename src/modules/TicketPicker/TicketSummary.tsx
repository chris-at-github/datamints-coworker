import type { Ticket } from "@/modules/Timesheet/entries";
import { TicketBadge } from "./TicketBadge";
import styles from "./TicketSummary.module.css";

export type TicketSummaryProps = {
  ticket: Pick<Ticket, "type" | "number" | "title" | "context">;
};

// A chosen ticket like the preview of "Enter number": badge, number and title,
// the team or project below. Without a link, so it can sit inside a button.
export function TicketSummary({ ticket }: TicketSummaryProps) {
  return (
    <span className={styles["ticket-summary"]}>
      <span className={styles["ticket-summary__row"]}>
        <TicketBadge type={ticket.type} />
        <span className={styles["ticket-summary__number"]}>#{ticket.number}</span>
        <span className={styles["ticket-summary__title"]}>{ticket.title}</span>
      </span>
      {ticket.context && <span className={styles["ticket-summary__context"]}>{ticket.context}</span>}
    </span>
  );
}
