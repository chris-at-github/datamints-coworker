import { useRouter } from "next/navigation";
import { type MouseEvent, useRef } from "react";

// Tracks saves that are still running, so a navigation can wait for them: the
// target page loads its data right away and would otherwise miss the last change.
export function usePendingSaves() {
  const router = useRouter();
  const pendingSaves = useRef(new Set<Promise<void>>());

  // Errors are logged, so a failed save does not block the navigation.
  function trackSave(save: Promise<void>) {
    const tracked: Promise<void> = save
      .catch((error: unknown) => console.error(error))
      .finally(() => pendingSaves.current.delete(tracked));

    pendingSaves.current.add(tracked);
  }

  // Click handler for links: leaving a field on click starts its save right
  // before the click, so the link waits for it before it navigates.
  async function navigateAfterSaves(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pendingSaves.current.size === 0) {
      return;
    }

    event.preventDefault();
    await Promise.all(pendingSaves.current);
    router.push(href);
  }

  // For actions that read the entry on the server, e.g. the review.
  async function waitForSaves() {
    await Promise.all(pendingSaves.current);
  }

  // Click handler for buttons: replaces the URL instead of adding a history
  // entry, so paging inside a view does not fill the browser history.
  async function replaceAfterSaves(href: string) {
    await waitForSaves();
    router.replace(href);
  }

  return { trackSave, waitForSaves, navigateAfterSaves, replaceAfterSaves };
}
