import type { MouseEvent } from "react";
import { mergeClassName } from "@/lib/class-names";
import type { Ticket, TimesheetEntry, TimesheetField } from "./entries";
import { TimesheetRow } from "./TimesheetRow";
import styles from "./TimesheetTable.module.css";

export type TimesheetTableProps = {
  pageId: string;
  entries: TimesheetEntry[];
  onChange: (index: number, field: TimesheetField, value: string) => void;
  onBlur: (index: number, field: TimesheetField) => void;
  onTicketSave: (index: number, ticket: Ticket | null) => void;
  onDelete: (index: number) => void;
  // Click on the edit link of a row; may wait for pending saves before navigating.
  onEdit: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export function TimesheetTable({
  pageId,
  entries,
  onChange,
  onBlur,
  onTicketSave,
  onDelete,
  onEdit,
}: TimesheetTableProps) {
  const narrowHeadClassName = mergeClassName(styles["timesheet-table__head"], styles["timesheet-table__head--narrow"]);

  return (
    <table className={styles["timesheet-table"]}>
      <thead>
        <tr>
          <th scope="col" className={narrowHeadClassName}>
            Start
          </th>
          <th scope="col" className={narrowHeadClassName}>
            End
          </th>
          <th scope="col" className={narrowHeadClassName}>
            Duration
          </th>
          <th scope="col" className={narrowHeadClassName}>
            Ticket
          </th>
          <th scope="col" className={styles["timesheet-table__head"]}>
            Booking text
          </th>
          {/* Row actions; intentionally without a heading. */}
          <th scope="col" className={narrowHeadClassName} />
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <TimesheetRow
            key={entry.id}
            entry={entry}
            rowNumber={index + 1}
            editHref={`/timesheet/${pageId}/entries/${entry.id}`}
            onChange={(field, value) => onChange(index, field, value)}
            onBlur={(field) => onBlur(index, field)}
            onTicketSave={(ticket) => onTicketSave(index, ticket)}
            onDelete={() => onDelete(index)}
            onEdit={onEdit}
          />
        ))}
      </tbody>
    </table>
  );
}
