import { Menu as ClientMenu, MenuItem, MenuLinkItem, MenuPopup, type MenuProps, MenuTrigger } from "./Menu";

export type { MenuItemProps, MenuLinkItemProps, MenuPopupProps, MenuProps, MenuTriggerProps } from "./Menu";

// No "use client": server components cannot access properties of a client
// reference, so the parts are attached to a server-safe wrapper instead.
function MenuRoot(props: MenuProps) {
  return <ClientMenu {...props} />;
}

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Popup: MenuPopup,
  Item: MenuItem,
  LinkItem: MenuLinkItem,
});
