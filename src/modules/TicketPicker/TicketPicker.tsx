"use client";

import {
  FolderIcon,
  HeadsetIcon,
  HistoryIcon,
  KeyboardIcon,
  StarIcon,
  UserCheckIcon,
} from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { Tabs } from "@/components/Tabs";
import type { Ticket } from "@/modules/Timesheet/entries";
import { ticketSource, type TicketSource } from "./api";
import { FavoriteButton } from "./FavoriteButton";
import { GroupPanel } from "./GroupPanel";
import { NumberPanel } from "./NumberPanel";
import { TicketListPanel } from "./TicketListPanel";
import { getRowKey, type TicketRow } from "./tickets";
import { useLoad } from "./useLoad";
import styles from "./TicketPicker.module.css";

type View = "favorites" | "recently-booked" | "recently-worked" | "helpdesk" | "projects" | "number";

const NAVIGATION: { group: string; entries: { view: View; label: string; icon: IconComponent }[] }[] = [
  {
    group: "Personal",
    entries: [
      { view: "favorites", label: "Favorites", icon: StarIcon },
      { view: "recently-booked", label: "Recently booked", icon: HistoryIcon },
      { view: "recently-worked", label: "Recently worked", icon: UserCheckIcon },
    ],
  },
  {
    group: "Search",
    entries: [
      { view: "helpdesk", label: "Helpdesk", icon: HeadsetIcon },
      { view: "projects", label: "Projects", icon: FolderIcon },
    ],
  },
  { group: "Direct", entries: [{ view: "number", label: "Enter number", icon: KeyboardIcon }] },
];

// A favorite added or removed while the picker is open.
type FavoriteChange = { row: TicketRow; isFavorite: boolean };

const VIEWS = NAVIGATION.flatMap((group) => group.entries.map((entry) => entry.view));

// The last used entry is a UI setting only, so it stays in the browser.
const VIEW_STORAGE_KEY = "ticket-picker:view";

function readStoredView(): View {
  const stored = typeof window === "undefined" ? null : window.localStorage.getItem(VIEW_STORAGE_KEY);

  return VIEWS.includes(stored as View) ? (stored as View) : "favorites";
}

// The first input of the shown panel; also the initial focus of the dialog.
export function findPickerFocus(container: HTMLElement | null): HTMLElement | null {
  return container?.querySelector<HTMLElement>("[role='tabpanel'] [data-autofocus]") ?? null;
}

export type TicketPickerProps = {
  ticket: Ticket | null;
  onSelect: (ticket: Ticket | null) => void;
  source?: TicketSource;
};

// Navigation on the left, the content of the chosen entry on the right.
export function TicketPicker({ ticket, onSelect, source = ticketSource }: TicketPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(readStoredView);
  const [error, setError] = useState("");
  const [isStoring, setIsStoring] = useState(false);
  // "#" switches to "Enter number" only as the first key after opening.
  const hasTypedRef = useRef(false);
  const favorites = useLoad("favorites", () => source.getFavorites());
  // Kept locally instead of reloading, so a removed favorite stays in its list
  // until the picker is opened again and the removal can be undone.
  const [favoriteChanges, setFavoriteChanges] = useState<Map<string, FavoriteChange>>(() => new Map());
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(() => new Set());
  const loadedFavorites = new Map((favorites.data ?? []).map((row) => [getRowKey(row), row]));
  // Favorites added in other lists are appended, like the server orders them.
  const favoriteRows =
    favorites.data &&
    [...favorites.data, ...[...favoriteChanges.values()].map((change) => change.row)].filter(
      (row, index, rows) => rows.findIndex((other) => getRowKey(other) === getRowKey(row)) === index,
    );

  function changeView(nextView: View) {
    setView(nextView);
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    // The new panel mounts first, then its input gets the focus.
    requestAnimationFrame(() => findPickerFocus(containerRef.current)?.focus());
  }

  function handleKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key.length !== 1 || hasTypedRef.current) {
      return;
    }

    hasTypedRef.current = true;

    if (event.key === "#" && view !== "number") {
      event.preventDefault();
      changeView("number");
    }
  }

  // Stored tickets are taken over without Odoo; rows from Odoo are stored first.
  async function pick(row: TicketRow) {
    if (row.ticket) {
      onSelect(row.ticket);
      return;
    }

    setIsStoring(true);
    setError("");

    try {
      onSelect(await source.store(row.type, row.odooId, false));
    } catch (storeError) {
      setError(storeError instanceof Error ? storeError.message : "The ticket could not be taken over.");
    } finally {
      setIsStoring(false);
    }
  }

  function isFavorite(row: TicketRow) {
    const key = getRowKey(row);

    return favoriteChanges.get(key)?.isFavorite ?? loadedFavorites.has(key);
  }

  // Rows from Odoo have no stored ticket: adding stores it, removing uses the
  // stored ticket of the favorite.
  async function toggleFavorite(row: TicketRow) {
    const key = getRowKey(row);
    const favorite = !isFavorite(row);
    const stored = favoriteChanges.get(key)?.row.ticket ?? loadedFavorites.get(key)?.ticket ?? row.ticket;

    setPendingFavorites((current) => new Set(current).add(key));
    setError("");

    try {
      const ticket = stored
        ? await source.setFavorite(stored.id, favorite).then(() => stored)
        : await source.store(row.type, row.odooId, true);

      setFavoriteChanges((current) => new Map(current).set(key, { row: { ...row, ticket }, isFavorite: favorite }));
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "The favorite could not be saved.");
    } finally {
      setPendingFavorites((current) => {
        const next = new Set(current);

        next.delete(key);
        return next;
      });
    }
  }

  function renderFavorite(row: TicketRow) {
    return (
      <FavoriteButton
        row={row}
        isFavorite={isFavorite(row)}
        isPending={pendingFavorites.has(getRowKey(row))}
        onToggle={(toggled) => void toggleFavorite(toggled)}
      />
    );
  }

  return (
    <div ref={containerRef} className={styles["ticket-picker"]} onKeyDownCapture={handleKeyDownCapture}>
      <Tabs
        orientation="vertical"
        value={view}
        onValueChange={(value) => changeView(value as View)}
        className={styles["ticket-picker__tabs"]}
      >
        <div className={styles["ticket-picker__navigation"]}>
          <Tabs.List aria-label="Find a ticket">
            {NAVIGATION.map(({ group, entries }) => (
              <div key={group} role="presentation">
                <div className={styles["ticket-picker__navigation-group"]} aria-hidden="true">
                  {group}
                </div>
                {entries.map(({ view: entryView, label, icon }) => (
                  <Tabs.Tab key={entryView} value={entryView} className={styles["ticket-picker__tab"]}>
                    <Icon icon={icon} />
                    {label}
                    {entryView === "favorites" && favoriteRows && (
                      <span className={styles["ticket-picker__count"]}>{favoriteRows.filter(isFavorite).length}</span>
                    )}
                  </Tabs.Tab>
                ))}
              </div>
            ))}
          </Tabs.List>
          {ticket && (
            <Button type="button" className={styles["ticket-picker__remove"]} onClick={() => onSelect(null)}>
              Remove ticket
            </Button>
          )}
        </div>
        <Tabs.Panel value="favorites">
          <TicketListPanel
            title="Favorites"
            hint="Add favorites with the star in any ticket list."
            rows={favoriteRows}
            error={favorites.error}
            emptyText="No favorites yet. Add one with the star in any ticket list."
            onPick={pick}
            renderAction={renderFavorite}
          />
        </Tabs.Panel>
        <Tabs.Panel value="recently-booked">
          <RecentlyBooked source={source} onPick={pick} renderAction={renderFavorite} />
        </Tabs.Panel>
        <Tabs.Panel value="recently-worked">
          <RecentlyWorked source={source} onPick={pick} renderAction={renderFavorite} />
        </Tabs.Panel>
        <Tabs.Panel value="helpdesk">
          <GroupPanel type="helpdesk" source={source} onPick={pick} renderAction={renderFavorite} />
        </Tabs.Panel>
        <Tabs.Panel value="projects">
          <GroupPanel type="project" source={source} onPick={pick} renderAction={renderFavorite} />
        </Tabs.Panel>
        <Tabs.Panel value="number">
          <NumberPanel source={source} onPick={pick} renderAction={renderFavorite} />
        </Tabs.Panel>
      </Tabs>
      {/* Announced by screen readers when a ticket is being taken over or fails. */}
      <p className={styles["ticket-picker__status"]} aria-live="polite">
        {isStoring ? "Taking over the ticket…" : error}
      </p>
    </div>
  );
}

type ListPanelProps = {
  source: TicketSource;
  onPick: (row: TicketRow) => void;
  renderAction: (row: TicketRow) => ReactNode;
};

function RecentlyBooked({ source, onPick, renderAction }: ListPanelProps) {
  const rows = useLoad("recently-booked", () => source.getRecentlyBooked());

  return (
    <TicketListPanel
      title="Recently booked"
      rows={rows.data}
      error={rows.error}
      emptyText="No booked tickets yet."
      onPick={onPick}
      renderAction={renderAction}
    />
  );
}

function RecentlyWorked({ source, onPick, renderAction }: ListPanelProps) {
  const rows = useLoad("recently-worked", () => source.getRecentlyWorked());

  return (
    <TicketListPanel
      title="Recently worked"
      hint="Open tickets and tasks assigned to you, latest change first."
      rows={rows.data}
      error={rows.error}
      emptyText="No open tickets or tasks are assigned to you."
      onPick={onPick}
      renderAction={renderAction}
    />
  );
}
