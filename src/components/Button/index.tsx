import { Button as ClientButton, type ButtonProps } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { Group } from "./Group";
import { IconButton } from "./IconButton";
import { IconLink } from "./IconLink";
import { Split } from "./Split";

export type { ButtonProps } from "./Button";
export type { ButtonLinkProps } from "./ButtonLink";
export type { GroupProps } from "./Group";
export type { IconButtonProps, IconButtonVariant } from "./IconButton";
export type { IconLinkProps } from "./IconLink";
export type { SplitProps } from "./Split";

// No "use client": server components cannot access properties of a client
// reference, so Group, Split, Icon and the links are attached to a server-safe wrapper instead.
function ButtonRoot(props: ButtonProps) {
  return <ClientButton {...props} />;
}

export const Button = Object.assign(ButtonRoot, { Group, Split, Icon: IconButton, IconLink, Link: ButtonLink });
