"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./Menu.module.css";

// Client component: the parts merge className functions, see Button.tsx.
// index.tsx assembles them as Menu.Trigger etc.

export type MenuProps = BaseMenu.Root.Props;

export function Menu(props: MenuProps) {
  return <BaseMenu.Root {...props} />;
}

export type MenuTriggerProps = BaseMenu.Trigger.Props;

// Without styles: callers pass the own button via the render prop.
export function MenuTrigger(props: MenuTriggerProps) {
  return <BaseMenu.Trigger {...props} />;
}

export type MenuPopupProps = BaseMenu.Popup.Props &
  Pick<BaseMenu.Positioner.Props, "side" | "align" | "sideOffset">;

// Portal and positioner are always needed, so they are part of the popup.
export function MenuPopup({ className, side, align, sideOffset = 4, ...props }: MenuPopupProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseMenu.Popup className={mergeStateClassName(styles.menu__popup, className)} {...props} />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export type MenuLinkItemProps = BaseMenu.LinkItem.Props;

// A real link as menu entry; pass render={<Link href="…" />} for client-side navigation.
export function MenuLinkItem({ className, ...props }: MenuLinkItemProps) {
  return <BaseMenu.LinkItem className={mergeStateClassName(styles.menu__item, className)} {...props} />;
}

export type MenuItemProps = BaseMenu.Item.Props;

// An action as menu entry, e.g. "Archive"; closes the menu on click.
export function MenuItem({ className, ...props }: MenuItemProps) {
  return <BaseMenu.Item className={mergeStateClassName(styles.menu__item, className)} {...props} />;
}
