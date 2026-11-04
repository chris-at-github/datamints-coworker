import { Tabs as ClientTabs, TabsList, TabsPanel, type TabsProps, TabsTab } from "./Tabs";

export type { TabsListProps, TabsPanelProps, TabsProps, TabsTabProps } from "./Tabs";

// No "use client": server components cannot access properties of a client
// reference, so the parts are attached to a server-safe wrapper instead.
function TabsRoot(props: TabsProps) {
  return <ClientTabs {...props} />;
}

export const Tabs = Object.assign(TabsRoot, { List: TabsList, Tab: TabsTab, Panel: TabsPanel });
