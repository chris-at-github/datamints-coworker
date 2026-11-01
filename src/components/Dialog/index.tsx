import {
  Dialog as ClientDialog,
  DialogClose,
  DialogPopup,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

export type { DialogCloseProps, DialogPopupProps, DialogProps, DialogTitleProps, DialogTriggerProps } from "./Dialog";

// No "use client": server components cannot access properties of a client
// reference, so the parts are attached to a server-safe wrapper instead.
function DialogRoot(props: DialogProps) {
  return <ClientDialog {...props} />;
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Popup: DialogPopup,
  Title: DialogTitle,
  Close: DialogClose,
});
