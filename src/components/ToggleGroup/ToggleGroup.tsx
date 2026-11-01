"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./ToggleGroup.module.css";

// Client component: the parts merge className functions, see Button.tsx.
// index.tsx assembles them as ToggleGroup.Item.

export type ToggleGroupProps<Value extends string> = BaseToggleGroup.Props<Value>;

// Single choice by default; the pressed item can be pressed again to clear the value.
export function ToggleGroup<Value extends string>({ className, ...props }: ToggleGroupProps<Value>) {
  return <BaseToggleGroup className={mergeStateClassName(styles["toggle-group"], className)} {...props} />;
}

export type ToggleGroupItemProps<Value extends string> = BaseToggle.Props<Value>;

export function ToggleGroupItem<Value extends string>({ className, ...props }: ToggleGroupItemProps<Value>) {
  return <BaseToggle className={mergeStateClassName(styles["toggle-group__item"], className)} {...props} />;
}
