"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { setPageArchived } from "./api";
import type { ArchivedPage } from "./entries";
import styles from "./TimesheetArchive.module.css";

export type TimesheetArchiveProps = {
  // Newest first, already limited to the listed days.
  pages: ArchivedPage[];
  days: number;
};

// Compact list of the archived pages; a restored page leaves the list, the
// user stays here.
export function TimesheetArchive({ pages: initialPages, days }: TimesheetArchiveProps) {
  const [pages, setPages] = useState(initialPages);
  const [message, setMessage] = useState("");

  async function handleRestore(page: ArchivedPage) {
    setMessage("");

    try {
      await setPageArchived(page.id, false);
      setPages((current) => current.filter((currentPage) => currentPage.id !== page.id));
      setMessage(`${page.date} restored.`);
    } catch (error) {
      console.error(error);
      setMessage(`${page.date} could not be restored.`);
    }
  }

  return (
    <section className={styles["timesheet-archive"]}>
      <header className={styles["timesheet-archive__header"]}>
        <h2 className="display display--layout-2">Archived pages</h2>
        <Link href="/timesheet">Back to the timesheet</Link>
      </header>
      <p className={styles["timesheet-archive__hint"]}>Pages of the last {days} days, newest first.</p>
      {pages.length === 0 ? (
        <p>No archived pages in the last {days} days.</p>
      ) : (
        <ul className={styles["timesheet-archive__list"]}>
          {pages.map((page) => (
            <li key={page.id} className={styles["timesheet-archive__item"]}>
              <span className={styles["timesheet-archive__date"]}>{page.date}</span>
              <Link href={`/timesheet/${page.id}`} aria-label={`Show ${page.date}`}>
                Show
              </Link>
              <Button onClick={() => handleRestore(page)} aria-label={`Restore ${page.date}`}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
      {/* Announced by screen readers after a restore. */}
      <p className={styles["timesheet-archive__hint"]} aria-live="polite">
        {message}
      </p>
    </section>
  );
}
