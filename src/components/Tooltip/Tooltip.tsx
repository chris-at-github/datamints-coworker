"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./Tooltip.module.css";

// Client component: the parts merge className functions, see Button.tsx.
// index.tsx assembles them as Tooltip.Trigger etc. Tooltips only repeat or
// explain; the trigger needs its own accessible name.

export type TooltipProps = BaseTooltip.Root.Props;

export function Tooltip(props: TooltipProps) {
  return <BaseTooltip.Root {...props} />;
}

export type TooltipTriggerProps = BaseTooltip.Trigger.Props;

// Without styles: callers style the trigger or pass their own element via render.
export function TooltipTrigger(props: TooltipTriggerProps) {
  return <BaseTooltip.Trigger {...props} />;
}

export type TooltipPopupProps = BaseTooltip.Popup.Props &
  Pick<BaseTooltip.Positioner.Props, "side" | "align" | "sideOffset">;

// Portal and positioner are always needed, so they are part of the popup.
export function TooltipPopup({ className, side, align, sideOffset = 4, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseTooltip.Popup className={mergeStateClassName(styles.tooltip__popup, className)} {...props} />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
