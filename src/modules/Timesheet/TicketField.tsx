"use client";

import { ExternalLinkIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Field } from "@/components/Field";
import { ToggleGroup } from "@/components/ToggleGroup";
import { mergeClassName } from "@/lib/class-names";
import { isTicketType, TICKET_TYPES, type Ticket, type TicketType } from "./entries";
import { useTicketUrl } from "./TicketLinks";
import styles from "./TicketField.module.css";

const TYPE_LABELS: Record<TicketType, string> = { helpdesk: "Helpdesk", project: "Project" };
const TYPE_ABBREVIATIONS: Record<TicketType, string> = { helpdesk: "HD", project: "PR" };

export type TicketFieldProps = {
  ticket: Ticket | null;
  onSave: (ticket: Ticket | null) => void;
  // Accessible name of the field, e.g. "Ticket, row 3".
  label: string;
  // "cell" is borderless for the table, "boxed" looks like a form field.
  variant: "cell" | "boxed";
};

// Shows the ticket and opens a dialog to enter it; the icon next to it opens
// the ticket in Odoo. The later ticket finder adds more ways to the dialog.
export function TicketField({ ticket, onSave, label, variant }: TicketFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [draftType, setDraftType] = useState<TicketType | "">("");
  const url = useTicketUrl(ticket);
  // An id needs a type; an empty id removes the ticket.
  const canSave = draftId === "" || draftType !== "";

  // Every opening starts from the stored ticket, so a cancelled input is dropped.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftId(ticket?.id ?? "");
      setDraftType(ticket?.type ?? "");
    }

    setOpen(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave(draftId === "" || draftType === "" ? null : { id: draftId, type: draftType });
    setOpen(false);
  }

  const text = ticket ? `${TYPE_ABBREVIATIONS[ticket.type]} ${ticket.id}` : "";
  const description = ticket ? `${TYPE_LABELS[ticket.type]} ${ticket.id}` : "none";

  return (
    <div className={mergeClassName(styles["ticket-field"], styles[`ticket-field--${variant}`])}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger
          render={<button type="button" />}
          className={styles["ticket-field__trigger"]}
          aria-label={`${label}: ${description}`}
          title={ticket ? description : undefined}
        >
          {text}
        </Dialog.Trigger>
        <Dialog.Popup>
          <Dialog.Title>Ticket</Dialog.Title>
          <form className={styles["ticket-field__form"]} onSubmit={handleSubmit}>
            <Field>
              <Field.Label>Odoo ID</Field.Label>
              {/* Digits only: Odoo record ids are whole numbers. */}
              <Field.Control
                inputMode="numeric"
                value={draftId}
                onChange={(event) => setDraftId(event.currentTarget.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field>
              <Field.Label nativeLabel={false} render={<span />}>
                Type
              </Field.Label>
              <ToggleGroup
                value={draftType === "" ? [] : [draftType]}
                onValueChange={(value) => setDraftType(value.find(isTicketType) ?? "")}
                aria-label="Ticket type"
              >
                {TICKET_TYPES.map((type) => (
                  <ToggleGroup.Item key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup>
            </Field>
            {!canSave && <p className={styles["ticket-field__hint"]}>Choose a type to save the ticket.</p>}
            <Button.Group>
              <Button type="submit" disabled={!canSave}>
                Save
              </Button>
              <Dialog.Close>Cancel</Dialog.Close>
            </Button.Group>
          </form>
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
