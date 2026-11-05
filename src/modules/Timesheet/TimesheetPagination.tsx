import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon/Icon";
import { Menu } from "@/components/Menu";
import type { PageSummary, TimesheetNeighbors } from "./entries";
import styles from "./TimesheetPagination.module.css";

export type TimesheetPaginationProps = {
  // The shown page; an archived page is not in pages, so no entry is current.
  pageId: string;
  date: string;
  // All non-archived pages, newest first.
  pages: PageSummary[];
  neighbors: TimesheetNeighbors;
  onNavigate: (pageId: string) => void;
};

// Left leads to the newer page, right to the older one; without a target the
// button stays visible but disabled, so the header does not shift. The date in
// between opens a list of all pages; its entries are links.
export function TimesheetPagination({ pageId, date, pages, neighbors: { newerId, olderId }, onNavigate }: TimesheetPaginationProps) {
  return (
    <div className={styles["timesheet-pagination"]}>
      <Button.Icon
        icon={ChevronLeftIcon}
        aria-label="Newer page"
        disabled={!newerId}
        onClick={() => newerId && onNavigate(newerId)}
      />
      <Menu>
        <Menu.Trigger className={styles["timesheet-pagination__date"]} aria-label={`${date}, choose a page`}>
          <span className="display display--layout-2">{date}</span>
          <Icon icon={ChevronDownIcon} />
        </Menu.Trigger>
        <Menu.Popup align="center">
          {pages.map((page) => (
            <Menu.LinkItem
              key={page.id}
              render={<Link href={`/timesheet/${page.id}`} />}
              aria-current={page.id === pageId ? "page" : undefined}
              closeOnClick
            >
              {page.date}
            </Menu.LinkItem>
          ))}
        </Menu.Popup>
      </Menu>
      <Button.Icon
        icon={ChevronRightIcon}
        aria-label="Older page"
        disabled={!olderId}
        onClick={() => olderId && onNavigate(olderId)}
      />
    </div>
  );
}
