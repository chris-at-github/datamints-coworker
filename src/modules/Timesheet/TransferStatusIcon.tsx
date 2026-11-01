"use client";

import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, RefreshCwIcon } from "lucide-react";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { Tooltip } from "@/components/Tooltip";
import type { TransferStatus } from "./entries";
import styles from "./TransferStatusIcon.module.css";

const STATUS_ICONS: Record<TransferStatus, IconComponent> = {
  none: CircleDashedIcon,
  transferred: CircleCheckIcon,
  changed: RefreshCwIcon,
  error: CircleAlertIcon,
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

// Focusable, so keyboard users get the tooltip as well; screen readers read the label.
export function TransferStatusIcon({ status, error }: TransferStatusIconProps) {
  const text = getTransferStatusText(status, error);

  return (
    <Tooltip>
      <Tooltip.Trigger
        render={<span tabIndex={0} role="img" />}
        aria-label={text}
        className={styles["transfer-status-icon"]}
        data-status={status}
      >
        <Icon icon={STATUS_ICONS[status]} />
      </Tooltip.Trigger>
      <Tooltip.Popup>{text}</Tooltip.Popup>
    </Tooltip>
  );
}
