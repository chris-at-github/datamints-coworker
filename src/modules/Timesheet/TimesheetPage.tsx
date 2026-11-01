"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { deleteEntry, saveEntry } from "./api";
import {
  createEmptyEntries,
  getNextSorting,
  roundEntryTime,
  setTicket,
  type Ticket,
  type TimesheetField,
  type TimesheetNeighbors,
  type TimesheetPageData,
  updateEntry,
} from "./entries";
import { TimesheetHeader } from "./TimesheetHeader";
import { TimesheetPagination } from "./TimesheetPagination";
import { TimesheetTable } from "./TimesheetTable";
import { usePendingSaves } from "./usePendingSaves";
import styles from "./TimesheetPage.module.css";

const ADDED_ROW_COUNT = 5;

export type TimesheetPageProps = {
  page: TimesheetPageData;
  neighbors: TimesheetNeighbors;
  // "New" is disabled then, so there is at most one page per day.
  hasTodayPage: boolean;
  onNew: () => void;
  onNavigate: (pageId: string) => void;
};

// One page holds the entries of exactly one day; the loaded entries are the
// starting state, changes are kept here.
export function TimesheetPage({ page, neighbors, hasTodayPage, onNew, onNavigate }: TimesheetPageProps) {
  const [entries, setEntries] = useState(page.entries);
  const { trackSave, navigateAfterSaves } = usePendingSaves();

  function handleChange(entryIndex: number, field: TimesheetField, value: string) {
    setEntries((currentEntries) =>
      currentEntries.map((entry, index) => (index === entryIndex ? updateEntry(entry, field, value) : entry)),
    );
  }

  // Every blur saves the whole entry, also for empty rows; time fields are
  // rounded first, so the rounded value is stored.
  function handleBlur(entryIndex: number, field: TimesheetField) {
    const entry = entries[entryIndex];
    const nextEntry = roundEntryTime(entry, field);

    if (nextEntry !== entry) {
      setEntries((currentEntries) => currentEntries.map((current, index) => (index === entryIndex ? nextEntry : current)));
    }

    trackSave(saveEntry(page.id, nextEntry));
  }

  function handleTicketSave(entryIndex: number, ticket: Ticket | null) {
    const nextEntry = setTicket(entries[entryIndex], ticket);

    setEntries((currentEntries) => currentEntries.map((current, index) => (index === entryIndex ? nextEntry : current)));
    trackSave(saveEntry(page.id, nextEntry));
  }

  // The row disappears at once, the request runs in the background.
  function handleDelete(entryIndex: number) {
    const entry = entries[entryIndex];

    setEntries((currentEntries) => currentEntries.filter((current) => current.id !== entry.id));
    deleteEntry(entry.id).catch((error: unknown) => console.error(error));
  }

  // New rows are saved right away, so they are still there after a reload.
  function handleAddRows() {
    const newEntries = createEmptyEntries(ADDED_ROW_COUNT, getNextSorting(entries));

    setEntries((currentEntries) => [...currentEntries, ...newEntries]);
    newEntries.forEach((entry) => trackSave(saveEntry(page.id, entry)));
  }

  const pagination = <TimesheetPagination neighbors={neighbors} onNavigate={onNavigate} />;

  return (
    <section className={styles["timesheet-page"]}>
      <TimesheetHeader date={page.date} pagination={pagination}>
        <Button disabled={hasTodayPage} onClick={onNew}>
          New
        </Button>
      </TimesheetHeader>
      <TimesheetTable
        pageId={page.id}
        entries={entries}
        onChange={handleChange}
        onBlur={handleBlur}
        onTicketSave={handleTicketSave}
        onDelete={handleDelete}
        onEdit={navigateAfterSaves}
      />
      <div>
        <Button onClick={handleAddRows}>Add rows</Button>
      </div>
    </section>
  );
}
