"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Icon } from "@/components/Icon/Icon";
import { mergeStateClassName } from "@/lib/class-names";
import styles from "./Checkbox.module.css";

export type CheckboxProps = Omit<BaseCheckbox.Root.Props, "children">;

// Client component: merges className functions, see Button.tsx. Root and
// indicator are always used together, so the indicator is built in; without a
// label element next to it the checkbox needs an aria-label.
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root className={mergeStateClassName(styles.checkbox, className)} {...props}>
      <BaseCheckbox.Indicator
        className={styles.checkbox__indicator}
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            <Icon icon={state.indeterminate ? MinusIcon : CheckIcon} />
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );
}
