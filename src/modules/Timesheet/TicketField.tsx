"use client";

import { ExternalLinkIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Field } from "@/components/Field";
import { ToggleGroup } from "@/components/ToggleGroup";
import { mergeClassName } from "@/lib/class-names";
import { lookupTicket } from "./api";
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
  // "cell" is borderless for the table and shows the title as tooltip,
  // "boxed" looks like a form field and shows the title next to the number.
  variant: "cell" | "boxed";
};

// Shows the ticket and opens a dialog to look it up in Odoo by type and number;
// the icon next to it opens the ticket in Odoo. The later ticket finder adds
// more ways to the dialog.
export function TicketField({ ticket, onSave, label, variant }: TicketFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<TicketType | "">("");
  const [draftNumber, setDraftNumber] = useState("");
  // The ticket found for the current type and number; only it can be saved.
  const [found, setFound] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const url = useTicketUrl(ticket);
  const foundUrl = useTicketUrl(found);
  // An empty number removes the ticket.
  const canSave = draftNumber === "" || found !== null;
  const canSearch = draftType !== "" && draftNumber !== "" && !isSearching;

  // Every opening starts from the stored ticket, so a cancelled input is dropped.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Project tasks are booked most often, so they are preselected without a ticket.
      setDraftType(ticket?.type ?? "project");
      setDraftNumber(ticket?.number ?? "");
      setFound(ticket);
      setError("");
    }

    setOpen(nextOpen);
  }

  // A changed type or number needs a new search.
  function handleDraftChange(type: TicketType | "", number: string) {
    setDraftType(type);
    setDraftNumber(number);
    setFound(null);
    setError("");
  }

  async function handleSearch() {
    if (draftType === "" || draftNumber === "") {
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const result = await lookupTicket(draftType, draftNumber);

      setFound(result);
      setError(result ? "" : `${TYPE_LABELS[draftType]} ticket ${draftNumber} was not found.`);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "The search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  // Enter searches first and saves once a ticket is found.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canSave) {
      onSave(draftNumber === "" ? null : found);
      setOpen(false);
    } else if (canSearch) {
      void handleSearch();
    }
  }

  const number = ticket ? `${TYPE_ABBREVIATIONS[ticket.type]} ${ticket.number}` : "";
  const description = ticket ? `${TYPE_LABELS[ticket.type]} ${ticket.number}: ${ticket.title}` : "none";

  return (
    <div className={mergeClassName(styles["ticket-field"], styles[`ticket-field--${variant}`])}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger
          render={<button type="button" />}
          className={styles["ticket-field__trigger"]}
          aria-label={`${label}: ${description}`}
          title={ticket && variant === "cell" ? description : undefined}
        >
          {variant === "boxed" && ticket ? `${number} – ${ticket.title}` : number}
        </Dialog.Trigger>
        <Dialog.Popup>
          <Dialog.Title>Ticket</Dialog.Title>
          <form className={styles["ticket-field__form"]} onSubmit={handleSubmit}>
            <Field>
              <Field.Label nativeLabel={false} render={<span />}>
                Type
              </Field.Label>
              <ToggleGroup
                value={draftType === "" ? [] : [draftType]}
                onValueChange={(value) => handleDraftChange(value.find(isTicketType) ?? "", draftNumber)}
                aria-label="Ticket type"
              >
                {TICKET_TYPES.map((type) => (
                  <ToggleGroup.Item key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup>
            </Field>
            <div className={styles["ticket-field__search"]}>
              <Field className={styles["ticket-field__number"]}>
                <Field.Label>Ticket number</Field.Label>
                {/* Digits only: helpdesk and task numbers are whole numbers. */}
                <Field.Control
                  inputMode="numeric"
                  value={draftNumber}
                  onChange={(event) => handleDraftChange(draftType, event.currentTarget.value.replace(/\D/g, ""))}
                />
              </Field>
              <Button type="button" disabled={!canSearch} onClick={handleSearch}>
                {isSearching ? "Searching…" : "Search"}
              </Button>
            </div>
            {/* Announced by screen readers when the search finishes. */}
            <div aria-live="polite">
              {found && (
                <div className={styles["ticket-field__result"]}>
                  <p className={styles["ticket-field__result-text"]}>
                    {TYPE_ABBREVIATIONS[found.type]} {found.number} – {found.title}
                  </p>
                  {foundUrl && (
                    <Button.IconLink
                      href={foundUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={ExternalLinkIcon}
                      aria-label={`Open ${TYPE_LABELS[found.type]} ${found.number} in Odoo (new tab)`}
                    />
                  )}
                </div>
              )}
              {error && <p className={styles["ticket-field__error"]}>{error}</p>}
              {draftNumber !== "" && draftType === "" && (
                <p className={styles["ticket-field__hint"]}>Choose a type to search the ticket.</p>
              )}
            </div>
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
