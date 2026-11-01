"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Button } from "@/components/Button/Button";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./Dialog.module.css";

// Client component: the parts merge className functions and render the client
// Button, see Button.tsx. index.tsx assembles them as Dialog.Trigger etc.
// Unlike AlertDialog it can be dismissed by Escape or a click on the backdrop.

export type DialogProps = BaseDialog.Root.Props;

export function Dialog(props: DialogProps) {
  return <BaseDialog.Root {...props} />;
}

export type DialogTriggerProps = BaseDialog.Trigger.Props;

// Without styles: callers pass the own button via the render prop.
export function DialogTrigger(props: DialogTriggerProps) {
  return <BaseDialog.Trigger {...props} />;
}

export type DialogPopupProps = BaseDialog.Popup.Props;

// Portal and backdrop are always needed, so they are part of the popup.
export function DialogPopup({ className, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={styles.dialog__backdrop} />
      <BaseDialog.Popup className={mergeStateClassName(styles.dialog__popup, className)} {...props} />
    </BaseDialog.Portal>
  );
}

export type DialogTitleProps = BaseDialog.Title.Props;

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <BaseDialog.Title className={mergeStateClassName(styles.dialog__title, className)} {...props} />;
}

export type DialogCloseProps = BaseDialog.Close.Props;

// Rendered as the own Button; a render prop passed by the caller still wins.
export function DialogClose(props: DialogCloseProps) {
  return <BaseDialog.Close render={<Button />} {...props} />;
}
