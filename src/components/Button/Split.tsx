import type { ComponentProps } from "react";
import { mergeClassName } from "@/lib/class-names";
import styles from "./Button.module.css";

export type SplitProps = ComponentProps<"div">;

// Server component: a button and its dropdown as one control, separated by a
// 1px gap; callers pass both buttons directly.
export function Split({ className, ...props }: SplitProps) {
  return <div className={mergeClassName(styles["button-split"], className)} {...props} />;
}
