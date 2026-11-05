"use client";

import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { Tooltip } from "@/components/Tooltip";
import styles from "./StatusIcon.module.css";

// Only errors stand out; every other state uses the muted default color.
export type StatusTone = "muted" | "danger";

export type StatusIconProps = {
  icon: IconComponent;
  // Tooltip and accessible name.
  text: string;
  tone: StatusTone;
};

// Focusable, so keyboard users get the tooltip as well; screen readers read the text.
export function StatusIcon({ icon, text, tone }: StatusIconProps) {
  return (
    <Tooltip>
      <Tooltip.Trigger
        render={<span tabIndex={0} role="img" />}
        aria-label={text}
        className={styles["status-icon"]}
        data-tone={tone}
      >
        <Icon icon={icon} />
      </Tooltip.Trigger>
      <Tooltip.Popup>{text}</Tooltip.Popup>
    </Tooltip>
  );
}
