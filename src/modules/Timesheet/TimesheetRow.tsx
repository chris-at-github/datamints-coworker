import { type MouseEvent, useState } from "react";
import { mergeClassName } from "@/lib/class-names";
import { maskTime } from "@/lib/time";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import {
  getBookingTextField,
  getEntryStatus,
  isEntryEmpty,
  type Ticket,
  type TimesheetEntry,
  type TimesheetField,
} from "./entries";
import { TicketField } from "./TicketField";
import { EntryStatusIcon } from "./EntryStatusIcon";
import { TimesheetRowActions } from "./TimesheetRowActions";
import styles from "./TimesheetRow.module.css";

export type TimesheetRowProps = {
  entry: TimesheetEntry;
  rowNumber: number;
  // Date of the page, for the status.
  date: string;
  isSelected: boolean;
  onSelectedChange: (isSelected: boolean) => void;
  editHref: string;
  onChange: (field: TimesheetField, value: string) => void;
  // Called when a field is left; the page rounds time fields and saves the entry.
  onBlur: (field: TimesheetField) => void;
  // Saves right away, like a blur.
  onTicketSave: (ticket: Ticket | null) => void;
  onDelete: () => void;
  onEdit: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export function TimesheetRow({
  entry,
  rowNumber,
  date,
  isSelected,
  onSelectedChange,
  editHref,
  onChange,
  onBlur,
  onTicketSave,
  onDelete,
  onEdit,
}: TimesheetRowProps) {
  // Locked on focus, so clearing a reviewed text does not switch to the original while typing.
  const [editedBookingTextField, setEditedBookingTextField] = useState<TimesheetField | null>(null);
  const bookingTextField = editedBookingTextField ?? getBookingTextField(entry);

  // The mask keeps time fields in "HH:MM" while typing.
  function handleTimeChange(field: TimesheetField, value: string) {
    onChange(field, maskTime(value));
  }

  const isEmpty = isEntryEmpty(entry);
  const shortClassName = mergeClassName(styles["timesheet-row__field"], styles["timesheet-row__field--short"]);
  const multilineClassName = mergeClassName(styles["timesheet-row__field"], styles["timesheet-row__field--multiline"]);

  const centeredClassName = mergeClassName(styles["timesheet-row__cell"], styles["timesheet-row__cell--centered"]);

  return (
    <tr className={styles["timesheet-row"]}>
      <td className={centeredClassName}>
        <Checkbox checked={isSelected} onCheckedChange={onSelectedChange} aria-label={`Select row ${rowNumber}`} />
      </td>
      <td className={styles["timesheet-row__cell"]}>
        <input
          className={shortClassName}
          type="text"
          placeholder="HH:MM"
          value={entry.startTime}
          onChange={(event) => handleTimeChange("startTime", event.target.value)}
          onBlur={() => onBlur("startTime")}
          aria-label={`Start time, row ${rowNumber}`}
        />
      </td>
      <td className={styles["timesheet-row__cell"]}>
        <input
          className={shortClassName}
          type="text"
          placeholder="HH:MM"
          value={entry.endTime}
          onChange={(event) => handleTimeChange("endTime", event.target.value)}
          onBlur={() => onBlur("endTime")}
          aria-label={`End time, row ${rowNumber}`}
        />
      </td>
      {/* Computed from start and end time; not editable in the table for now. */}
      <td className={mergeClassName(styles["timesheet-row__cell"], styles["timesheet-row__cell--text"])}>
        {entry.duration}
      </td>
      <td className={styles["timesheet-row__cell"]}>
        <TicketField ticket={entry.ticket} onSave={onTicketSave} label={`Ticket, row ${rowNumber}`} variant="cell" />
      </td>
      <td className={styles["timesheet-row__cell"]}>
        <textarea
          className={multilineClassName}
          rows={1}
          value={entry[bookingTextField]}
          onFocus={() => setEditedBookingTextField(getBookingTextField(entry))}
          onChange={(event) => onChange(bookingTextField, event.target.value)}
          onBlur={() => {
            onBlur(bookingTextField);
            setEditedBookingTextField(null);
          }}
          aria-label={`Booking text, row ${rowNumber}`}
        />
      </td>
      <td className={centeredClassName}>
        {!isEmpty && <EntryStatusIcon status={getEntryStatus(entry, date)} error={entry.transferError} />}
      </td>
      <td className={mergeClassName(styles["timesheet-row__cell"], styles["timesheet-row__cell--actions"])}>
        <TimesheetRowActions
          rowNumber={rowNumber}
          isEmpty={isEmpty}
          internalBookingText={entry.bookingTextInternal}
          onInternalBookingTextChange={(value) => onChange("bookingTextInternal", value)}
          onInternalBookingTextClose={() => onBlur("bookingTextInternal")}
          onDelete={onDelete}
          editHref={editHref}
          onEdit={(event) => onEdit(event, editHref)}
          className={styles["timesheet-row__actions"]}
        />
      </td>
    </tr>
  );
}
