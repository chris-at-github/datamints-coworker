import Link from "next/link";
import type { ComponentProps } from "react";
import { mergeClassName } from "@/lib/class-names";
import styles from "./Button.module.css";

export type ButtonLinkProps = ComponentProps<typeof Link>;

// A real link with text in the look of Button, for navigation like "New";
// a Button with render={<a>} would be announced as a button (see docs/guides/base-ui.md).
export function ButtonLink({ className, ...props }: ButtonLinkProps) {
  return <Link className={mergeClassName(styles.button, styles["button--link"], className)} {...props} />;
}
