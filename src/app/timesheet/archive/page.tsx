import type { Metadata } from "next";
import { connection } from "next/server";
import { formatDate, subtractDays } from "@/lib/date";
import { findPageSummarys } from "@/lib/timesheet-repository";
import { TimesheetArchive } from "@/modules/Timesheet/TimesheetArchive";

// Older archived pages stay reachable by URL, but are not listed.
const LISTED_DAYS = 90;

export const metadata: Metadata = {
  title: "Archived pages",
};

// A static segment wins over /timesheet/[pageId], so "archive" is never taken as a page id.
export default async function TimesheetArchivePage() {
  // Renders on every request, so the list and the date range are current.
  await connection();
  const pages = await findPageSummarys(formatDate(subtractDays(new Date(), LISTED_DAYS)));

  return <TimesheetArchive pages={pages} days={LISTED_DAYS} />;
}
