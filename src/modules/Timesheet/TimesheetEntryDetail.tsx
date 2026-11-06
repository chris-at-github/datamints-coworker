"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { mergeClassName } from "@/lib/class-names";
import { maskTime } from "@/lib/time";
import { reviewEntry, saveEntry, transferEntries, unlinkTransfer } from "./api";
import {
  applyTransferFields,
  getBookingTextField,
  getTransferBlocker,
  getTransferStatus,
  roundEntryTime,
  setTicket,
  type Ticket,
  type TimesheetEntry,
  type TimesheetField,
  updateEntry,
} from "./entries";
import { TicketField } from "./TicketField";
import { getTransferStatusText, TransferStatusIcon } from "./TransferStatusIcon";
import styles from "./TimesheetEntryDetail.module.css";
import { TimesheetEntryPagination } from "./TimesheetEntryPagination";
import { usePendingSaves } from "@/lib/use-pending-saves";

export type TimesheetEntryDetailProps = {
  pageId: string;
  entry: TimesheetEntry;
  // Date of the page as "YYYY-MM-DD".
  date: string;
  rowNumber: number;
  entryCount: number;
  previousId: string | null;
  nextId: string | null;
};

// Edits one entry; like in the table, every field is saved when it is left.
export function TimesheetEntryDetail({
  pageId,
  entry: initialEntry,
  date,
  rowNumber,
  entryCount,
  previousId,
  nextId,
}: TimesheetEntryDetailProps) {
  const [entry, setEntry] = useState(initialEntry);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");
  const { trackSave, waitForSaves, navigateAfterSaves, replaceAfterSaves } = usePendingSaves();
  const tableUrl = `/timesheet/${pageId}`;

  function handleChange(field: TimesheetField, value: string) {
    setEntry((currentEntry) => updateEntry(currentEntry, field, value));
  }

  // The mask keeps time fields in "HH:MM" while typing.
  function handleTimeChange(field: TimesheetField, value: string) {
    handleChange(field, maskTime(value));
  }

  // Time fields are rounded first, so the rounded value is stored.
  function handleBlur(field: TimesheetField) {
    const nextEntry = roundEntryTime(entry, field);

    if (nextEntry !== entry) {
      setEntry(nextEntry);
    }

    trackSave(saveEntry(pageId, nextEntry));
  }

  function handleTicketSave(ticket: Ticket | null) {
    const nextEntry = setTicket(entry, ticket);

    setEntry(nextEntry);
    trackSave(saveEntry(pageId, nextEntry));
  }

  // The server reads the entry from the database, so pending saves go first.
  // Only the reviewed field is taken over; it is overwritten on every run.
  async function handleReview() {
    setIsReviewing(true);

    try {
      await waitForSaves();
      const { bookingTextReviewed, reviewedValues } = await reviewEntry(entry.id);
      setEntry((currentEntry) => ({ ...currentEntry, bookingTextReviewed, reviewedValues }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsReviewing(false);
    }
  }

  // The server reads the entry from the database, so pending saves go first.
  async function handleTransfer() {
    setIsTransferring(true);
    setTransferMessage("");

    try {
      await waitForSaves();
      const [result] = await transferEntries([entry.id]);

      setEntry((currentEntry) => applyTransferFields(currentEntry, result.entry));
      setTransferMessage(result.outcome === "skipped" ? `Not transferred: ${result.message}` : "");
    } catch (error) {
      console.error(error);
      setTransferMessage("The transfer failed.");
    } finally {
      setIsTransferring(false);
    }
  }

  // Only the transfer fields are taken over, like after a transfer.
  async function handleUnlink() {
    setTransferMessage("");

    try {
      const unlinked = await unlinkTransfer(entry.id);

      setEntry((currentEntry) => applyTransferFields(currentEntry, unlinked));
    } catch (error) {
      console.error(error);
      setTransferMessage("Unlinking failed.");
    }
  }

  const transferStatus = getTransferStatus(entry, date);
  const transferBlocker = getTransferBlocker(entry);
  const fullClassName = styles["timesheet-entry-detail__field--full"];
  const textareaClassName = styles["timesheet-entry-detail__textarea"];

  return (
    <section className={styles["timesheet-entry-detail"]}>
      <header className={styles["timesheet-entry-detail__header"]}>
        <div className={styles["timesheet-entry-detail__heading"]}>
          <TimesheetEntryPagination
            previousId={previousId}
            nextId={nextId}
            onNavigate={(entryId) => replaceAfterSaves(`${tableUrl}/entries/${entryId}`)}
          />
          <div>
            <span className="display display--layout-2">{date}</span>
            <h2 className={styles["timesheet-entry-detail__title"]}>
              Entry {rowNumber} of {entryCount}
            </h2>
          </div>
        </div>
        <Button.IconLink href={tableUrl} icon={XIcon} aria-label="Close" onClick={(event) => navigateAfterSaves(event, tableUrl)} />
      </header>
      <div className={styles["timesheet-entry-detail__fields"]}>
        <Field>
          <Field.Label>Start</Field.Label>
          <Field.Control
            placeholder="HH:MM"
            value={entry.startTime}
            onChange={(event) => handleTimeChange("startTime", event.currentTarget.value)}
            onBlur={() => handleBlur("startTime")}
          />
        </Field>
        <Field>
          <Field.Label>End</Field.Label>
          <Field.Control
            placeholder="HH:MM"
            value={entry.endTime}
            onChange={(event) => handleTimeChange("endTime", event.currentTarget.value)}
            onBlur={() => handleBlur("endTime")}
          />
        </Field>
        {/* Computed from start and end time; not editable for now, like in the table. */}
        <Field>
          <Field.Label>Duration</Field.Label>
          <Field.Control value={entry.duration} readOnly />
        </Field>
        <Field className={fullClassName}>
          {/* Not a native label: the field is a button that opens the ticket dialog. */}
          <Field.Label nativeLabel={false} render={<span />}>
            Ticket
          </Field.Label>
          <TicketField ticket={entry.ticket} onSave={handleTicketSave} label="Ticket" variant="boxed" />
        </Field>
        <Field className={fullClassName}>
          <Field.Label>Booking text</Field.Label>
          <Field.Control
            render={<textarea rows={3} />}
            className={textareaClassName}
            value={entry.bookingText}
            onChange={(event) => handleChange("bookingText", event.currentTarget.value)}
            onBlur={() => handleBlur("bookingText")}
          />
        </Field>
        <Field className={fullClassName}>
          <Field.Label>Reviewed booking text</Field.Label>
          <Field.Control
            render={<textarea rows={3} />}
            className={textareaClassName}
            value={entry.bookingTextReviewed}
            onChange={(event) => handleChange("bookingTextReviewed", event.currentTarget.value)}
            onBlur={() => handleBlur("bookingTextReviewed")}
          />
        </Field>
        <div className={fullClassName}>
          <Button disabled={isReviewing || entry[getBookingTextField(entry)].trim() === ""} onClick={handleReview}>
            {isReviewing ? "Reviewing booking text…" : "Review booking text"}
          </Button>
        </div>
        <div className={mergeClassName(fullClassName, styles["timesheet-entry-detail__transfer"])}>
          <Button disabled={isTransferring || transferBlocker !== null} onClick={handleTransfer}>
            {isTransferring ? "Transferring…" : "Transfer to Odoo"}
          </Button>
          {entry.odooTimesheetId !== null && (
            <AlertDialog>
              <AlertDialog.Trigger disabled={isTransferring}>Unlink Odoo line</AlertDialog.Trigger>
              <AlertDialog.Popup>
                <AlertDialog.Title>Unlink Odoo line?</AlertDialog.Title>
                <AlertDialog.Description>
                  The next transfer creates a new line in Odoo. If the old line still exists there, the booking is
                  duplicated; the old line is not deleted.
                </AlertDialog.Description>
                <Button.Group>
                  <AlertDialog.Close>Cancel</AlertDialog.Close>
                  <AlertDialog.Close onClick={handleUnlink}>Unlink</AlertDialog.Close>
                </Button.Group>
              </AlertDialog.Popup>
            </AlertDialog>
          )}
          <TransferStatusIcon status={transferStatus} error={entry.transferError} />
          {/* Announced by screen readers when the transfer finishes. */}
          <p className={styles["timesheet-entry-detail__transfer-text"]} aria-live="polite">
            {transferMessage || getTransferStatusText(transferStatus, entry.transferError)}
            {transferBlocker && ` – cannot transfer: ${transferBlocker}`}
          </p>
        </div>
        <Field className={fullClassName}>
          <Field.Label>Internal booking text</Field.Label>
          <Field.Control
            render={<textarea rows={3} />}
            className={textareaClassName}
            value={entry.bookingTextInternal}
            onChange={(event) => handleChange("bookingTextInternal", event.currentTarget.value)}
            onBlur={() => handleBlur("bookingTextInternal")}
          />
        </Field>
      </div>
    </section>
  );
}
