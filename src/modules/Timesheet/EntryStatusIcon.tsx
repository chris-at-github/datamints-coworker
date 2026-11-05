"use client";

import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import type { IconComponent } from "@/components/Icon/Icon";
import type { EntryStatus } from "./entries";
import { StatusIcon, type StatusTone } from "./StatusIcon";

const STATUS_ICONS: Record<EntryStatus, IconComponent> = {
  open: CircleDashedIcon,
  reviewed: SparklesIcon,
  transferred: CircleCheckIcon,
  changed: RefreshCwIcon,
  error: CircleAlertIcon,
};

const STATUS_TONES: Record<EntryStatus, StatusTone> = {
  open: "muted",
  reviewed: "muted",
  transferred: "muted",
  changed: "muted",
  error: "danger",
};

const STATUS_LABELS: Record<EntryStatus, string> = {
  open: "Open",
  reviewed: "AI reviewed",
  transferred: "Transferred",
  changed: "Changed",
  error: "Error",
};

export type EntryStatusIconProps = {
  status: EntryStatus;
  // Message of the failed transfer, shown with the status "error".
  error: string;
};

// The status of a row in the table, see getEntryStatus.
export function EntryStatusIcon({ status, error }: EntryStatusIconProps) {
  const text = status === "error" ? `${STATUS_LABELS.error}: ${error}` : STATUS_LABELS[status];

  return <StatusIcon icon={STATUS_ICONS[status]} text={text} tone={STATUS_TONES[status]} />;
}
