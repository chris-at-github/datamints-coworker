"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/date";
import { createPage, fetchPage, findPageIdByDate, setPageArchived } from "./api";
import type { TimesheetPageResult } from "./entries";
import { TimesheetPage } from "./TimesheetPage";

type LoadState = { status: "loading" } | { status: "error" } | ({ status: "ready" } & TimesheetPageResult);

// A page created because there was none has no neighbours and is the latest page.
async function createFirstPage(): Promise<TimesheetPageResult> {
  const page = await createPage();

  return { page, neighbors: { newerId: null, olderId: null }, latestDate: page.date };
}

export type TimesheetProps = {
  // Without an id the latest page is shown.
  pageId?: string;
};

// Loads a day page in the background and renders it.
// If there is no page at all, one is created for today.
export function Timesheet({ pageId }: TimesheetProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    // Strict Mode runs effects twice in development; the cancelled run must not
    // apply its result or create a second page.
    let ignore = false;

    async function load() {
      const result = await fetchPage(pageId);

      if (ignore) {
        return;
      }

      setState({ status: "ready", ...(result ?? (await createFirstPage())) });
    }

    load().catch((error: unknown) => {
      console.error(error);

      if (!ignore) {
        setState({ status: "error" });
      }
    });

    return () => {
      ignore = true;
    };
  }, [pageId]);

  // The new page gets its own URL, so a reload shows it again.
  async function handleNew() {
    try {
      const page = await createPage();

      router.push(`/timesheet/${page.id}`);
    } catch (error) {
      console.error(error);
    }
  }

  // At most one page per day: an existing page of the date is opened instead.
  async function handleNewForDate(date: string) {
    try {
      const existingId = await findPageIdByDate(date);

      router.push(`/timesheet/${existingId ?? (await createPage(date)).id}`);
    } catch (error) {
      console.error(error);
    }
  }

  // Opens the latest page that is left; without any, a page for today is created
  // like on the very first start. Pushing "/timesheet" would not reload if that
  // URL is already open.
  async function handleArchive(archivedPageId: string) {
    try {
      await setPageArchived(archivedPageId, true);
      const latest = await fetchPage();

      router.push(`/timesheet/${latest?.page.id ?? (await createPage()).id}`);
    } catch (error) {
      console.error(error);
    }
  }

  // The page is loaded again, so its button and its neighbours are up to date;
  // the entries in the table stay as they are, as the page keeps its key.
  async function handleRestore(restoredPageId: string) {
    try {
      await setPageArchived(restoredPageId, false);
      const result = await fetchPage(restoredPageId);

      if (result) {
        setState({ status: "ready", ...result });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Like "New", every page gets a history entry, so the browser's back button pages back.
  function handleNavigate(targetPageId: string) {
    router.push(`/timesheet/${targetPageId}`);
  }

  if (state.status === "loading") {
    return <p>Loading…</p>;
  }

  if (state.status === "error") {
    return <p>The timesheet could not be loaded.</p>;
  }

  return (
    <TimesheetPage
      key={state.page.id}
      page={state.page}
      neighbors={state.neighbors}
      // Pages are created for today or earlier, so the latest date tells whether today's page exists.
      hasTodayPage={state.latestDate === formatDate(new Date())}
      onNew={handleNew}
      onNewForDate={handleNewForDate}
      onNavigate={handleNavigate}
      onArchive={() => handleArchive(state.page.id)}
      onRestore={() => handleRestore(state.page.id)}
    />
  );
}
