"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { ToggleGroup } from "@/components/ToggleGroup";
import { isTicketType, TICKET_TYPES, type TicketType } from "@/modules/Timesheet/entries";
import type { TicketSource } from "./api";
import { TicketBadge } from "./TicketBadge";
import { TicketRowContent } from "./TicketRowContent";
import type { TicketLookup, TicketRow } from "./tickets";
import styles from "./TicketPicker.module.css";

const LOOKUP_DELAY = 300;

const TYPE_LABELS: Record<TicketType, string> = { project: "Project task", helpdesk: "Helpdesk ticket" };

export type NumberPanelProps = {
  source: TicketSource;
  onPick: (row: TicketRow) => void;
  // E.g. the favorite star of the found ticket.
  renderAction?: (row: TicketRow) => ReactNode;
};

type Preview = { type: TicketType; number: string; lookup: TicketLookup | null; error: string };

// Type (project first and preselected) and number with a live preview; only a
// found ticket can be taken over, by a click on its row or Enter in the number input.
export function NumberPanel({ source, onPick, renderAction }: NumberPanelProps) {
  const [type, setType] = useState<TicketType>("project");
  const [number, setNumber] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  // Debounced; a newer input aborts the older request, so outdated answers are dropped.
  useEffect(() => {
    if (number === "") {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      source.lookup(type, number, controller.signal).then(
        (lookup) => setPreview({ type, number, lookup, error: "" }),
        (error: unknown) =>
          !controller.signal.aborted &&
          setPreview({ type, number, lookup: null, error: error instanceof Error ? error.message : "Lookup failed" }),
      );
    }, LOOKUP_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [number, source, type]);

  const current = number !== "" && preview?.type === type && preview.number === number ? preview : null;
  const found = current?.lookup?.ticket ?? null;
  const other = current?.lookup?.other ?? null;

  function takeOver() {
    if (found) {
      onPick(found);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      takeOver();
    }
  }

  return (
    <div className={styles["ticket-picker__panel"]}>
      <h3 className={styles["ticket-picker__title"]}>Enter a ticket number</h3>
      <Field>
        <Field.Label nativeLabel={false} render={<span />}>
          Type
        </Field.Label>
        <ToggleGroup
          value={[type]}
          onValueChange={(value) => {
            const next = value.find(isTicketType);

            if (next) {
              setType(next);
            }
          }}
          aria-label="Ticket type"
        >
          {TICKET_TYPES.map((ticketType) => (
            <ToggleGroup.Item key={ticketType} value={ticketType}>
              {TYPE_LABELS[ticketType]}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </Field>
      <Field className={styles["ticket-picker__number"]}>
        <Field.Label>Number</Field.Label>
        {/* Digits only: helpdesk and task numbers are whole numbers. */}
        <Field.Control
          inputMode="numeric"
          value={number}
          onChange={(event) => setNumber(event.currentTarget.value.replace(/\D/g, ""))}
          onKeyDown={handleKeyDown}
          data-autofocus
        />
      </Field>
      {/* Announced by screen readers when the lookup finishes. */}
      <div aria-live="polite">
        {number !== "" && !current && <p>Searching…</p>}
        {current?.error && <p className={styles["ticket-picker__error"]}>{current.error}</p>}
        {found && (
          // A click like on a list row; the keyboard uses Enter in the number input.
          <div className={styles["ticket-picker__preview"]} onClick={takeOver}>
            <div className={styles["ticket-picker__preview-row"]}>
              <TicketRowContent row={found} action={renderAction?.(found)} />
            </div>
            <p className={styles["ticket-picker__muted"]}>{found.context}</p>
          </div>
        )}
        {current?.lookup && !found && (
          <>
            <p className={styles["ticket-picker__error"]}>
              No {TYPE_LABELS[type].toLowerCase()} #{number} found.
            </p>
            {other && (
              <p className={styles["ticket-picker__other"]}>
                There is <TicketBadge type={other.type} /> #{other.number} “{other.title}”.
                <Button type="button" onClick={() => setType(other.type)}>
                  Switch
                </Button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
