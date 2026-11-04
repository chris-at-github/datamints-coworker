"use client";

import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { useTicketUrl } from "@/modules/Timesheet/TicketLinks";
import { TicketBadge } from "./TicketBadge";
import type { TicketRow } from "./tickets";
import styles from "./TicketRowContent.module.css";

export type TicketRowContentProps = {
  row: TicketRow;
  // E.g. the star of a favorite, before the link icon.
  action?: ReactNode;
};

// The same in every list: badge, number, title, info and the link to Odoo.
export function TicketRowContent({ row, action }: TicketRowContentProps) {
  const url = useTicketUrl(row);

  return (
    <>
      <TicketBadge type={row.type} />
      <span className={styles["ticket-row__number"]}>#{row.number}</span>
      <span className={styles["ticket-row__title"]} title={row.context ? `${row.title} – ${row.context}` : row.title}>
        {row.title}
      </span>
      <span className={styles["ticket-row__info"]}>{row.info}</span>
      {action}
      {url && (
        <Button.IconLink
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          icon={ExternalLinkIcon}
          aria-label={`Open #${row.number} in Odoo (new tab)`}
          className={styles["ticket-row__link"]}
          // Opens the ticket without taking it over.
          onClick={(event) => event.stopPropagation()}
          tabIndex={-1}
        />
      )}
    </>
  );
}
