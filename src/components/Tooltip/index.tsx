import { Tooltip as ClientTooltip, TooltipPopup, type TooltipProps, TooltipTrigger } from "./Tooltip";

export type { TooltipPopupProps, TooltipProps, TooltipTriggerProps } from "./Tooltip";

// No "use client": server components cannot access properties of a client
// reference, so the parts are attached to a server-safe wrapper instead.
function TooltipRoot(props: TooltipProps) {
  return <ClientTooltip {...props} />;
}

export const Tooltip = Object.assign(TooltipRoot, { Trigger: TooltipTrigger, Popup: TooltipPopup });
