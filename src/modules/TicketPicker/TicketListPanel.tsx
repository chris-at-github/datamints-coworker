"use client";

import { type ReactNode, useState } from "react";
import { PickerList } from "./PickerList";
import { TicketRowContent } from "./TicketRowContent";
import { getRowKey, type TicketRow } from "./tickets";
import styles from "./TicketPicker.module.css";

export type TicketListPanelProps = {
  title: string;
  hint?: string;
  // null while loading.
  rows: TicketRow[] | null;
  error: string;
  emptyText: ReactNode;
  onPick: (row: TicketRow) => void;
  renderAction?: (row: TicketRow) => ReactNode;
};

// A personal list with a local filter by number and title.
export function TicketListPanel({ title, hint, rows, error, emptyText, onPick, renderAction }: TicketListPanelProps) {
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();
  const filtered = (rows ?? []).filter(
    (row) => row.number.includes(query) || row.title.toLowerCase().includes(query),
  );
  const status = error ? <p className={styles["ticket-picker__error"]}>{error}</p> : rows === null ? <p>Loading…</p> : undefined;

  return (
    <div className={styles["ticket-picker__panel"]}>
      <div>
        <h3 className={styles["ticket-picker__title"]}>{title}</h3>
        {hint && <p className={styles["ticket-picker__hint"]}>{hint}</p>}
      </div>
      <PickerList
        query={filter}
        onQueryChange={setFilter}
        placeholder="Filter list"
        sections={[{ items: filtered }]}
        getKey={getRowKey}
        renderItem={(row) => <TicketRowContent row={row} action={renderAction?.(row)} />}
        onPick={onPick}
        status={status}
        emptyText={query ? "No ticket matches the filter." : emptyText}
      />
    </div>
  );
}
