"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { mergeClassName } from "@/lib/class-names";
import { findPickerFocus, TicketPicker } from "@/modules/TicketPicker/TicketPicker";
import { TicketSummary } from "@/modules/TicketPicker/TicketSummary";
import type { Ticket, TicketType } from "./entries";
import { useTicketUrl } from "./TicketLinks";
import styles from "./TicketField.module.css";

const TYPE_LABELS: Record<TicketType, string> = { helpdesk: "Helpdesk", project: "Project" };
const TYPE_ABBREVIATIONS: Record<TicketType, string> = { helpdesk: "HD", project: "PR" };

export type TicketFieldProps = {
  ticket: Ticket | null;
  onSave: (ticket: Ticket | null) => void;
  // Accessible name of the field, e.g. "Ticket, row 3".
  label: string;
  // "cell" is borderless for the table and shows the title as tooltip,
  // "boxed" looks like a form field and shows the ticket like the preview of "Enter number".
  variant: "cell" | "boxed";
};

// Shows the ticket and opens the ticket picker in a dialog; the icon next to it
// opens the ticket in Odoo.
export function TicketField({ ticket, onSave, label, variant }: TicketFieldProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const url = useTicketUrl(ticket);

  function handleSelect(selected: Ticket | null) {
    onSave(selected);
    setOpen(false);
  }

  const number = ticket ? `${TYPE_ABBREVIATIONS[ticket.type]} ${ticket.number}` : "";
  const description = ticket ? `${TYPE_LABELS[ticket.type]} ${ticket.number}: ${ticket.title}` : "none";

  return (
    <div className={mergeClassName(styles["ticket-field"], styles[`ticket-field--${variant}`])}>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          render={<button type="button" />}
          className={styles["ticket-field__trigger"]}
          aria-label={`${label}: ${description}`}
          title={ticket && variant === "cell" ? description : undefined}
        >
          {variant === "boxed" && ticket ? (
            <TicketSummary ticket={ticket} />
          ) : (
            <span className={styles["ticket-field__text"]}>{number}</span>
          )}
        </Dialog.Trigger>
        {/* The focus starts in the first input of the shown panel. */}
        <Dialog.Popup
          ref={popupRef}
          className={styles["ticket-field__popup"]}
          initialFocus={() => findPickerFocus(popupRef.current) ?? true}
        >
          <Dialog.Title>Ticket</Dialog.Title>
          {/* Mounted only while open, so every opening starts fresh. */}
          {open && <TicketPicker ticket={ticket} onSelect={handleSelect} />}
        </Dialog.Popup>
      </Dialog>
      {url && (
        <Button.IconLink
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          icon={ExternalLinkIcon}
          aria-label={`Open ${description} in Odoo (new tab)`}
          className={styles["ticket-field__link"]}
        />
      )}
    </div>
  );
}
