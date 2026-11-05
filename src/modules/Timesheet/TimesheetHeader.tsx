import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import styles from "./TimesheetHeader.module.css";

export type TimesheetHeaderProps = {
  // Pagination with the date of the page, on the left.
  pagination?: ReactNode;
  children?: ReactNode;
};

// Pagination on the left, the page actions as a button group on the right.
export function TimesheetHeader({ pagination, children }: TimesheetHeaderProps) {
  return (
    <header className={styles["timesheet-header"]}>
      {pagination}
      <Button.Group>{children}</Button.Group>
    </header>
  );
}
