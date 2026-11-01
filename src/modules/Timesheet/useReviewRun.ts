import { useRef, useState } from "react";
import { reviewEntry } from "./api";
import { getBookingTextField, needsReview, type TimesheetEntry } from "./entries";

export type ReviewRunResult = {
  // E.g. "4 reviewed, 1 skipped (unchanged), 1 failed, 2 cancelled".
  message: string;
  // Failed and cancelled entries, to select them again for another run.
  retryIds: string[];
};

// Reviews entries one after another; cancel stops before the next entry, the
// running request still finishes. onReviewed gets every reviewed entry.
export function useReviewRun(onReviewed: (entry: TimesheetEntry) => void) {
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const isCancelledRef = useRef(false);

  async function run(entries: TimesheetEntry[]): Promise<ReviewRunResult> {
    const withoutText = entries.filter((entry) => entry[getBookingTextField(entry)].trim() === "");
    const withText = entries.filter((entry) => !withoutText.includes(entry));
    const pending = withText.filter(needsReview);
    const unchanged = withText.length - pending.length;
    const failedIds: string[] = [];
    let reviewedCount = 0;
    let cancelledIds: string[] = [];

    isCancelledRef.current = false;

    for (const [index, entry] of pending.entries()) {
      if (isCancelledRef.current) {
        cancelledIds = pending.slice(index).map((pendingEntry) => pendingEntry.id);
        break;
      }

      setProgress({ current: index + 1, total: pending.length });

      try {
        onReviewed(await reviewEntry(entry.id));
        reviewedCount++;
      } catch (error) {
        console.error(error);
        failedIds.push(entry.id);
      }
    }

    setProgress(null);

    const skipped = [
      unchanged > 0 ? `${unchanged} unchanged` : "",
      withoutText.length > 0 ? `${withoutText.length} without booking text` : "",
    ].filter(Boolean);
    const parts = [`${reviewedCount} reviewed`];

    if (skipped.length > 0) {
      parts.push(`${unchanged + withoutText.length} skipped (${skipped.join(", ")})`);
    }

    if (failedIds.length > 0) {
      parts.push(`${failedIds.length} failed`);
    }

    if (cancelledIds.length > 0) {
      parts.push(`${cancelledIds.length} cancelled`);
    }

    return { message: parts.join(", "), retryIds: [...failedIds, ...cancelledIds] };
  }

  function cancel() {
    isCancelledRef.current = true;
  }

  return { progress, run, cancel };
}
