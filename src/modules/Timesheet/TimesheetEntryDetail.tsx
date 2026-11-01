"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { maskTime } from "@/lib/time";
import { reviewEntry, saveEntry } from "./api";
import {
  getTicket,
  roundEntryTime,
  setTicket,
  type Ticket,
  type TimesheetEntry,
  type TimesheetField,
  updateEntry,
} from "./entries";
import { TicketField } from "./TicketField";
import styles from "./TimesheetEntryDetail.module.css";
import { TimesheetEntryPagination } from "./TimesheetEntryPagination";
import { usePendingSaves } from "./usePendingSaves";

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
      const { bookingTextReviewed } = await reviewEntry(entry.id);
      setEntry((currentEntry) => ({ ...currentEntry, bookingTextReviewed }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsReviewing(false);
    }
  }

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
          <TicketField ticket={getTicket(entry)} onSave={handleTicketSave} label="Ticket" variant="boxed" />
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
          <Button disabled={isReviewing || entry.bookingText.trim() === ""} onClick={handleReview}>
            {isReviewing ? "Reviewing booking text…" : "Review booking text"}
          </Button>
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
