"use client";

import { ChevronDownIcon } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Popover } from "@/components/Popover";
import { formatDate } from "@/lib/date";
import styles from "./TimesheetNewForDate.module.css";

export type TimesheetNewForDateProps = {
  onCreate: (date: string) => void;
};

// Dropdown next to "New" for the page of a chosen day. The browser's date input
// is used, so the calendar looks like the browser's; future days are not allowed.
export function TimesheetNewForDate({ onCreate }: TimesheetNewForDateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("");
  // Taken when the popover opens, so a page left open overnight allows the new day.
  const [today, setToday] = useState(() => formatDate(new Date()));
  // "YYYY-MM-DD" compares like a date; the max attribute is not enforced on typed values.
  const isValid = date !== "" && date <= today;

  function handleOpenChange(open: boolean) {
    if (open) {
      setToday(formatDate(new Date()));
      setDate("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isValid) {
      onCreate(date);
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <Popover.Trigger render={<Button.Icon icon={ChevronDownIcon} aria-label="New page for a date" />} />
      <Popover.Popup align="end" initialFocus={inputRef}>
        <Popover.Title>New page for a date</Popover.Title>
        <form className={styles["timesheet-new-for-date__form"]} onSubmit={handleSubmit}>
          <Field>
            <Field.Label>Date</Field.Label>
            <Field.Control
              ref={inputRef}
              type="date"
              max={today}
              value={date}
              onChange={(event) => setDate(event.currentTarget.value)}
            />
          </Field>
          <p className={styles["timesheet-new-for-date__hint"]}>An existing page of this date is opened instead.</p>
          <div>
            <Button type="submit" disabled={!isValid}>
              Create
            </Button>
          </div>
        </form>
      </Popover.Popup>
    </Popover>
  );
}
