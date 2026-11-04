"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./Tabs.module.css";

// Client component: the parts merge className functions, see Button.tsx.
// index.tsx assembles them as Tabs.List etc. Arrow keys move between the tabs,
// Enter or Space activates one.

export type TabsProps = BaseTabs.Root.Props;

export function Tabs({ className, ...props }: TabsProps) {
  return <BaseTabs.Root className={mergeStateClassName(styles.tabs, className)} {...props} />;
}

export type TabsListProps = BaseTabs.List.Props;

export function TabsList({ className, ...props }: TabsListProps) {
  return <BaseTabs.List className={mergeStateClassName(styles.tabs__list, className)} {...props} />;
}

export type TabsTabProps = BaseTabs.Tab.Props;

export function TabsTab({ className, ...props }: TabsTabProps) {
  return <BaseTabs.Tab className={mergeStateClassName(styles.tabs__tab, className)} {...props} />;
}

export type TabsPanelProps = BaseTabs.Panel.Props;

// Inactive panels are unmounted, so a panel loads its data only when shown.
export function TabsPanel({ className, ...props }: TabsPanelProps) {
  return <BaseTabs.Panel className={mergeStateClassName(styles.tabs__panel, className)} {...props} />;
}
