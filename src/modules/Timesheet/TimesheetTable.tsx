import type { MouseEvent } from "react";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { mergeClassName } from "@/lib/class-names";
import { getTotals, type Ticket, type TimesheetEntry, type TimesheetField } from "./entries";
import { TimesheetRow } from "./TimesheetRow";
import styles from "./TimesheetTable.module.css";

export type TimesheetTableProps = {
  pageId: string;
  // Date of the page, for the status.
  date: string;
  entries: TimesheetEntry[];
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onChange: (index: number, field: TimesheetField, value: string) => void;
  onBlur: (index: number, field: TimesheetField) => void;
  onTicketSave: (index: number, ticket: Ticket | null) => void;
  onDelete: (index: number) => void;
  // Click on the edit link of a row; may wait for pending saves before navigating.
  onEdit: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

export function TimesheetTable({
  pageId,
  date,
  entries,
  selectedIds,
  onSelectionChange,
  onChange,
  onBlur,
  onTicketSave,
  onDelete,
  onEdit,
}: TimesheetTableProps) {
  const narrowHeadClassName = mergeClassName(styles["timesheet-table__head"], styles["timesheet-table__head--narrow"]);
  const selectedCount = entries.filter((entry) => selectedIds.has(entry.id)).length;
  const totals = getTotals(entries);

  function handleSelectedChange(entryId: string, isSelected: boolean) {
    const nextIds = new Set(selectedIds);

    if (isSelected) {
      nextIds.add(entryId);
    } else {
      nextIds.delete(entryId);
    }

    onSelectionChange(nextIds);
  }

  return (
    <table className={styles["timesheet-table"]}>
      <thead>
        <tr>
          <th scope="col" className={narrowHeadClassName}>
            <Checkbox
              checked={entries.length > 0 && selectedCount === entries.length}
              indeterminate={selectedCount > 0 && selectedCount < entries.length}
              onCheckedChange={(isChecked) => onSelectionChange(new Set(isChecked ? entries.map((entry) => entry.id) : []))}
              aria-label="Select all rows"
            />
          </th>
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
          <th scope="col" className={narrowHeadClassName}>
            Status
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
            date={date}
            isSelected={selectedIds.has(entry.id)}
            onSelectedChange={(isSelected) => handleSelectedChange(entry.id, isSelected)}
            editHref={`/timesheet/${pageId}/entries/${entry.id}`}
            onChange={(field, value) => onChange(index, field, value)}
            onBlur={(field) => onBlur(index, field)}
            onTicketSave={(ticket) => onTicketSave(index, ticket)}
            onDelete={() => onDelete(index)}
            onEdit={onEdit}
          />
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className={styles["timesheet-table__total"]}>
            <span className="visually-hidden">Total</span>
          </th>
          <td className={styles["timesheet-table__total"]}>{totals.startTime}</td>
          <td className={styles["timesheet-table__total"]}>{totals.endTime}</td>
          <td className={styles["timesheet-table__total"]}>{totals.duration}</td>
          <td className={styles["timesheet-table__total"]} colSpan={4} />
        </tr>
      </tfoot>
    </table>
  );
}
