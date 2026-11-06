"use client";

import { PinIcon, PinOffIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ToggleGroup } from "@/components/ToggleGroup";
import type { TicketType } from "@/modules/Timesheet/entries";
import { type TicketSource } from "./api";
import { PickerList } from "./PickerList";
import { TicketRowContent } from "./TicketRowContent";
import { getGroupTitle, getRowKey, type TicketGroupRow, type TicketGroupSearch, type TicketRow } from "./tickets";
import { useLoad } from "./useLoad";
import styles from "./TicketPicker.module.css";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY = 250;

const WORDING: Record<TicketType, { title: string; group: string; placeholder: string; empty: string }> = {
  helpdesk: { title: "Helpdesk", group: "team", placeholder: "Search team", empty: "No ticket in this team." },
  project: { title: "Projects", group: "project", placeholder: "Search project or customer", empty: "No task in this project." },
};

export type GroupPanelProps = {
  type: TicketType;
  source: TicketSource;
  onPick: (row: TicketRow) => void;
  // E.g. the favorite star of a ticket row.
  renderAction?: (row: TicketRow) => ReactNode;
};

// Two steps: pick a team or project, then one of its open tickets.
export function GroupPanel({ type, source, onPick, renderAction }: GroupPanelProps) {
  const [group, setGroup] = useState<TicketGroupRow | null>(null);

  return group ? (
    <GroupTickets
      type={type}
      group={group}
      source={source}
      onBack={() => setGroup(null)}
      onPick={onPick}
      renderAction={renderAction}
    />
  ) : (
    <GroupChoice type={type} source={source} onChoose={setGroup} />
  );
}

type GroupChoiceProps = {
  type: TicketType;
  source: TicketSource;
  onChoose: (group: TicketGroupRow) => void;
};

// Without a query only the pinned and recently used groups; from two characters a search in Odoo.
function GroupChoice({ type, source, onChoose }: GroupChoiceProps) {
  const wording = WORDING[type];
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<{ query: string; result: TicketGroupSearch | null; error: string } | null>(null);
  const lists = useLoad(type, () => source.getGroupLists(type));
  const trimmed = query.trim();
  const isSearching = trimmed.length >= MIN_QUERY_LENGTH;

  // Debounced; a newer query aborts the older request, so outdated answers are dropped.
  useEffect(() => {
    if (!isSearching) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      source.searchGroups(type, trimmed, controller.signal).then(
        (result) => setSearch({ query: trimmed, result, error: "" }),
        (error: unknown) =>
          !controller.signal.aborted &&
          setSearch({ query: trimmed, result: null, error: error instanceof Error ? error.message : "Search failed" }),
      );
    }, SEARCH_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isSearching, source, trimmed, type]);

  async function togglePin(group: TicketGroupRow) {
    try {
      await source.setGroupPinned(group, !group.pinned);
      lists.reload();
      setSearch((current) =>
        current?.result
          ? {
              ...current,
              result: {
                ...current.result,
                groups: current.result.groups.map((item) =>
                  item.odooId === group.odooId ? { ...item, pinned: !group.pinned } : item,
                ),
              },
            }
          : current,
      );
    } catch (error) {
      console.error(error);
    }
  }

  const currentSearch = isSearching && search?.query === trimmed ? search : null;
  const sections = isSearching
    ? [{ items: currentSearch?.result?.groups ?? [] }]
    : [
        { label: "Pinned", items: lists.data?.pinned ?? [] },
        { label: "Recently used", items: lists.data?.recent ?? [] },
      ];
  const total = currentSearch?.result?.total ?? 0;
  const shown = currentSearch?.result?.groups.length ?? 0;
  let status;

  if (isSearching) {
    status = currentSearch?.error ? (
      <p className={styles["ticket-picker__error"]}>{currentSearch.error}</p>
    ) : !currentSearch ? (
      <p>Searching…</p>
    ) : undefined;
  } else if (lists.error) {
    status = <p className={styles["ticket-picker__error"]}>{lists.error}</p>;
  }

  return (
    <div className={styles["ticket-picker__panel"]}>
      <h3 className={styles["ticket-picker__title"]}>
        {wording.title}: choose a {wording.group}
      </h3>
      <PickerList
        query={query}
        onQueryChange={setQuery}
        placeholder={wording.placeholder}
        sections={sections}
        getKey={(group) => `${group.type}-${group.odooId}`}
        renderItem={(group) => (
          <>
            {/* Long names are cut off; the tooltip shows the full text. */}
            <span className={styles["ticket-picker__group-name"]} title={getGroupTitle(group)}>
              {group.name}
            </span>
            {group.customer && <span className={styles["ticket-picker__muted"]}>{group.customer}</span>}
            <Button.Icon
              icon={group.pinned ? PinOffIcon : PinIcon}
              aria-label={group.pinned ? `Unpin ${group.name}` : `Pin ${group.name}`}
              className={styles["ticket-picker__row-button"]}
              tabIndex={-1}
              onClick={(event) => {
                // Pins without opening the group.
                event.stopPropagation();
                void togglePin(group);
              }}
            />
          </>
        )}
        onPick={onChoose}
        status={status}
        emptyText={
          isSearching
            ? `No ${wording.group} found. Try another name${type === "project" ? " or the customer" : ""}.`
            : `Search a ${wording.group} by name; pinned and recently used ones are listed here.`
        }
      />
      {isSearching && total > shown && (
        <p className={styles["ticket-picker__hint"]}>
          {total} matches, the first {shown} are shown. Refine the search.
        </p>
      )}
    </div>
  );
}

type GroupTicketsProps = {
  type: TicketType;
  group: TicketGroupRow;
  source: TicketSource;
  onBack: () => void;
  onPick: (row: TicketRow) => void;
  renderAction?: (row: TicketRow) => ReactNode;
};

type Scope = "mine" | "all";

// Open tickets of the group with a local filter; the scope changes the Odoo query.
function GroupTickets({ type, group, source, onBack, onPick, renderAction }: GroupTicketsProps) {
  const wording = WORDING[type];
  const [scope, setScope] = useState<Scope>("mine");
  const [filter, setFilter] = useState("");
  const tickets = useLoad(`${group.odooId}-${scope}`, () => source.openGroup(group, scope === "mine"));
  const query = filter.trim().toLowerCase();
  const rows = (tickets.data?.rows ?? []).filter(
    (row) => row.number.includes(query) || row.title.toLowerCase().includes(query),
  );
  const status = tickets.error ? (
    <p className={styles["ticket-picker__error"]}>{tickets.error}</p>
  ) : tickets.data === null ? (
    <p>Loading…</p>
  ) : undefined;

  return (
    <div className={styles["ticket-picker__panel"]}>
      <nav aria-label="Breadcrumb" className={styles["ticket-picker__breadcrumb"]}>
        <button type="button" className={styles["ticket-picker__breadcrumb-link"]} onClick={onBack}>
          {wording.title}
        </button>
        <span aria-hidden="true">›</span>
        {/* The name from Odoo once loaded, as it may have changed. */}
        <span aria-current="page" title={getGroupTitle(tickets.data?.group ?? group)}>
          {tickets.data?.group.name ?? group.name}
        </span>
      </nav>
      <PickerList
        query={filter}
        onQueryChange={setFilter}
        placeholder={type === "helpdesk" ? "Filter tickets" : "Filter tasks"}
        sections={[{ items: rows }]}
        getKey={getRowKey}
        renderItem={(row) => <TicketRowContent row={row} action={renderAction?.(row)} />}
        onPick={onPick}
        status={status}
        emptyText={
          query
            ? "No ticket matches the filter."
            : scope === "mine"
              ? `${wording.empty.replace(".", " assigned to you.")} Switch to "All open".`
              : wording.empty
        }
        toolbar={
          <ToggleGroup
            value={[scope]}
            onValueChange={(value) => value[0] && setScope(value[0] === "all" ? "all" : "mine")}
            aria-label="Tickets"
          >
            <ToggleGroup.Item value="mine">Assigned to me</ToggleGroup.Item>
            <ToggleGroup.Item value="all">All open</ToggleGroup.Item>
          </ToggleGroup>
        }
      />
    </div>
  );
}
