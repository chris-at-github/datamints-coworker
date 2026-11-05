"use client";

import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, RefreshCwIcon } from "lucide-react";
import type { IconComponent } from "@/components/Icon/Icon";
import type { TransferStatus } from "./entries";
import { StatusIcon, type StatusTone } from "./StatusIcon";

const STATUS_ICONS: Record<TransferStatus, IconComponent> = {
  none: CircleDashedIcon,
  transferred: CircleCheckIcon,
  changed: RefreshCwIcon,
  error: CircleAlertIcon,
};

const STATUS_TONES: Record<TransferStatus, StatusTone> = {
  none: "muted",
  transferred: "muted",
  changed: "muted",
  error: "danger",
};

const STATUS_LABELS: Record<TransferStatus, string> = {
  none: "Not transferred to Odoo",
  transferred: "Transferred to Odoo",
  changed: "Changed since the transfer to Odoo",
  error: "Transfer to Odoo failed",
};

// The status as text, with the message of a failed transfer.
export function getTransferStatusText(status: TransferStatus, error: string): string {
  return status === "error" ? `${STATUS_LABELS.error}: ${error}` : STATUS_LABELS[status];
}

export type TransferStatusIconProps = {
  status: TransferStatus;
  error: string;
};

export function TransferStatusIcon({ status, error }: TransferStatusIconProps) {
  return (
    <StatusIcon icon={STATUS_ICONS[status]} text={getTransferStatusText(status, error)} tone={STATUS_TONES[status]} />
  );
}
