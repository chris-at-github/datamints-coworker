import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { mergeClassName } from "@/lib/class-names";
import styles from "./Button.module.css";
import type { IconButtonVariant } from "./IconButton";

export type IconLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  icon: IconComponent;
  // As on Button.Icon: "neutral" is transparent until hover or focus.
  variant?: IconButtonVariant;
};

// A real link in the look of Button.Icon, for navigation; a Button with
// render={<a>} would be announced as a button (see docs/guides/base-ui.md).
// Icon-only links need an aria-label to get an accessible name.
export function IconLink({ icon, variant = "default", className, ...props }: IconLinkProps) {
  const variantClassName = variant === "neutral" ? styles["button--neutral"] : undefined;

  return (
    <Link
      className={mergeClassName(styles.button, styles["button--icon"], variantClassName, styles["button--link"], className)}
      {...props}
    >
      <Icon icon={icon} />
    </Link>
  );
}
