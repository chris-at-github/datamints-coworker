"use client";

import {
  FolderIcon,
  HeadsetIcon,
  HistoryIcon,
  KeyboardIcon,
  StarIcon,
  StarOffIcon,
  UserCheckIcon,
} from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { Tabs } from "@/components/Tabs";
import type { Ticket } from "@/modules/Timesheet/entries";
import { ticketSource, type TicketSource } from "./api";
import { GroupPanel } from "./GroupPanel";
import { NumberPanel } from "./NumberPanel";
import { TicketListPanel } from "./TicketListPanel";
import type { TicketRow } from "./tickets";
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
  async function pick(row: TicketRow, favorite = false) {
    if (row.ticket && !favorite) {
      onSelect(row.ticket);
      return;
    }

    setIsStoring(true);
    setError("");

    try {
      onSelect(await source.store(row.type, row.odooId, favorite));
    } catch (storeError) {
      setError(storeError instanceof Error ? storeError.message : "The ticket could not be taken over.");
    } finally {
      setIsStoring(false);
    }
  }

  async function removeFavorite(row: TicketRow) {
    if (!row.ticket) {
      return;
    }

    try {
      await source.setFavorite(row.ticket.id, false);
      favorites.reload();
    } catch (favoriteError) {
      console.error(favoriteError);
    }
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
                    {entryView === "favorites" && favorites.data && (
                      <span className={styles["ticket-picker__count"]}>{favorites.data.length}</span>
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
            hint="Add favorites under “Enter number”."
            rows={favorites.data}
            error={favorites.error}
            emptyText="No favorites yet. Save a ticket as favorite under “Enter number”."
            onPick={pick}
            renderAction={(row) => (
              <Button.Icon
                icon={StarOffIcon}
                aria-label={`Remove #${row.number} from favorites`}
                className={styles["ticket-picker__row-button"]}
                tabIndex={-1}
                onClick={(event) => {
                  // Removes without taking the ticket over.
                  event.stopPropagation();
                  void removeFavorite(row);
                }}
              />
            )}
          />
        </Tabs.Panel>
        <Tabs.Panel value="recently-booked">
          <RecentlyBooked source={source} onPick={pick} />
        </Tabs.Panel>
        <Tabs.Panel value="recently-worked">
          <RecentlyWorked source={source} onPick={pick} />
        </Tabs.Panel>
        <Tabs.Panel value="helpdesk">
          <GroupPanel type="helpdesk" source={source} onPick={pick} />
        </Tabs.Panel>
        <Tabs.Panel value="projects">
          <GroupPanel type="project" source={source} onPick={pick} />
        </Tabs.Panel>
        <Tabs.Panel value="number">
          <NumberPanel
            source={source}
            onPick={(row, favorite) => {
              void pick(row, favorite).then(() => favorite && favorites.reload());
            }}
          />
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
};

function RecentlyBooked({ source, onPick }: ListPanelProps) {
  const rows = useLoad("recently-booked", () => source.getRecentlyBooked());

  return (
    <TicketListPanel
      title="Recently booked"
      rows={rows.data}
      error={rows.error}
      emptyText="No booked tickets yet."
      onPick={onPick}
    />
  );
}

function RecentlyWorked({ source, onPick }: ListPanelProps) {
  const rows = useLoad("recently-worked", () => source.getRecentlyWorked());

  return (
    <TicketListPanel
      title="Recently worked"
      hint="Open tickets and tasks assigned to you, latest change first."
      rows={rows.data}
      error={rows.error}
      emptyText="No open tickets or tasks are assigned to you."
      onPick={onPick}
    />
  );
}
