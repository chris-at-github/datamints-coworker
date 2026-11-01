import { ToggleGroup as ClientToggleGroup, ToggleGroupItem, type ToggleGroupProps } from "./ToggleGroup";

export type { ToggleGroupItemProps, ToggleGroupProps } from "./ToggleGroup";

// No "use client": server components cannot access properties of a client
// reference, so the item is attached to a server-safe wrapper instead.
function ToggleGroupRoot<Value extends string>(props: ToggleGroupProps<Value>) {
  return <ClientToggleGroup {...props} />;
}

export const ToggleGroup = Object.assign(ToggleGroupRoot, { Item: ToggleGroupItem });
