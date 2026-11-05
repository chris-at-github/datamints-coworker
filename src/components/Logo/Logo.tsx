import type { ReactNode } from "react";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { mergeClassName } from "@/lib/class-names";
import styles from "./Logo.module.css";

export type LogoProps = {
  icon: IconComponent;
  // The name of the tool; callers pass a heading if it names the page.
  children: ReactNode;
  className?: string;
};

// Icon in a gray square next to the name of the tool; not a link. The icon is
// decorative, the text names the tool.
export function Logo({ icon, children, className }: LogoProps) {
  return (
    <div className={mergeClassName(styles.logo, className)}>
      <span className={styles.logo__mark}>
        <Icon icon={icon} />
      </span>
      {children}
    </div>
  );
}
