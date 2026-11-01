"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { deleteEntry, saveEntry, transferEntries } from "./api";
import {
  applyTransferFields,
  createEmptyEntries,
  getNextSorting,
  roundEntryTime,
  setTicket,
  type Ticket,
  type TimesheetField,
  type TimesheetNeighbors,
  type TimesheetPageData,
  type TransferResult,
  updateEntry,
} from "./entries";
import { TimesheetHeader } from "./TimesheetHeader";
import { TimesheetNewForDate } from "./TimesheetNewForDate";
import { TimesheetPagination } from "./TimesheetPagination";
import { TimesheetTable } from "./TimesheetTable";
import { usePendingSaves } from "./usePendingSaves";
import { useReviewRun } from "./useReviewRun";
import styles from "./TimesheetPage.module.css";

const ADDED_ROW_COUNT = 5;

// E.g. "3 transferred, 1 skipped (No ticket)".
function summarizeTransfer(results: TransferResult[]): string {
  const count = (outcome: TransferResult["outcome"]) => results.filter((result) => result.outcome === outcome);
  const skipped = count("skipped");
  const reasons = [...new Set(skipped.map((result) => result.message))].join(", ");
  const parts = [`${count("transferred").length} transferred`];

  if (skipped.length > 0) {
    parts.push(`${skipped.length} skipped (${reasons})`);
  }

  if (count("failed").length > 0) {
    parts.push(`${count("failed").length} failed`);
  }

  return parts.join(", ");
}

export type TimesheetPageProps = {
  page: TimesheetPageData;
  neighbors: TimesheetNeighbors;
  // "New" is disabled then, so there is at most one page per day.
  hasTodayPage: boolean;
  onNew: () => void;
  // Opens the page of the date, created if there is none yet.
  onNewForDate: (date: string) => void;
  onNavigate: (pageId: string) => void;
};

// One page holds the entries of exactly one day; the loaded entries are the
// starting state, changes are kept here.
export function TimesheetPage({ page, neighbors, hasTodayPage, onNew, onNewForDate, onNavigate }: TimesheetPageProps) {
  const [entries, setEntries] = useState(page.entries);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [isTransferring, setIsTransferring] = useState(false);
  // Result of the last transfer or review run.
  const [actionMessage, setActionMessage] = useState("");
  const { trackSave, waitForSaves, navigateAfterSaves } = usePendingSaves();
  // Only the review fields are taken over, so edits made during the run stay.
  const reviewRun = useReviewRun((reviewed) =>
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === reviewed.id
          ? { ...entry, bookingTextReviewed: reviewed.bookingTextReviewed, reviewedValues: reviewed.reviewedValues }
          : entry,
      ),
    ),
  );
  const isReviewing = reviewRun.progress !== null;
  const isBusy = isTransferring || isReviewing;

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

  // The server reads the entries from the database, so pending saves go first.
  // Rows that were not transferred stay selected for another try.
  async function handleTransfer() {
    const ids = entries.filter((entry) => selectedIds.has(entry.id)).map((entry) => entry.id);

    setIsTransferring(true);
    setActionMessage("");

    try {
      await waitForSaves();
      const results = await transferEntries(ids);
      const resultsById = new Map(results.map((result) => [result.id, result]));

      setEntries((currentEntries) =>
        currentEntries.map((entry) => applyTransferFields(entry, resultsById.get(entry.id)?.entry ?? null)),
      );
      setSelectedIds(new Set(results.filter((result) => result.outcome !== "transferred").map((result) => result.id)));
      setActionMessage(summarizeTransfer(results));
    } catch (error) {
      console.error(error);
      setActionMessage("The transfer failed.");
    } finally {
      setIsTransferring(false);
    }
  }

  // The server reads the entries from the database, so pending saves go first.
  // Failed and cancelled rows stay selected for another run.
  async function handleReview() {
    setActionMessage("");

    try {
      await waitForSaves();
      const { message, retryIds } = await reviewRun.run(entries.filter((entry) => selectedIds.has(entry.id)));

      setSelectedIds(new Set(retryIds));
      setActionMessage(message);
    } catch (error) {
      console.error(error);
      setActionMessage("The review failed.");
    }
  }

  // The row disappears at once, the request runs in the background.
  function handleDelete(entryIndex: number) {
    const entry = entries[entryIndex];

    setEntries((currentEntries) => currentEntries.filter((current) => current.id !== entry.id));
    setSelectedIds((currentIds) => new Set([...currentIds].filter((id) => id !== entry.id)));
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
        <TimesheetNewForDate onCreate={onNewForDate} />
      </TimesheetHeader>
      <TimesheetTable
        pageId={page.id}
        date={page.date}
        entries={entries}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onChange={handleChange}
        onBlur={handleBlur}
        onTicketSave={handleTicketSave}
        onDelete={handleDelete}
        onEdit={navigateAfterSaves}
      />
      <div className={styles["timesheet-page__actions"]}>
        <Button onClick={handleAddRows}>Add rows</Button>
        <Button disabled={selectedIds.size === 0 || isBusy} onClick={handleReview}>
          {reviewRun.progress
            ? `Reviewing ${reviewRun.progress.current} of ${reviewRun.progress.total}…`
            : `Review selected (${selectedIds.size})`}
        </Button>
        {isReviewing && <Button onClick={reviewRun.cancel}>Cancel review</Button>}
        <Button disabled={selectedIds.size === 0 || isBusy} onClick={handleTransfer}>
          {isTransferring ? "Transferring…" : `Transfer selected (${selectedIds.size})`}
        </Button>
        {/* Announced by screen readers when a run finishes. */}
        <p className={styles["timesheet-page__message"]} aria-live="polite">
          {actionMessage}
        </p>
      </div>
    </section>
  );
}
