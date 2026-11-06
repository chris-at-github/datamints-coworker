import type { ComponentProps } from "react";
import { Icon, type IconComponent } from "@/components/Icon/Icon";
import { mergeClassName } from "@/lib/class-names";
import styles from "./Card.module.css";

export type CardProps = ComponentProps<"div"> & {
  // Shown large in a gray area at the top; decorative.
  icon: IconComponent;
};

export function Card({ icon, className, children, ...props }: CardProps) {
  return (
    <div className={mergeClassName(styles.card, className)} {...props}>
      <div className={mergeClassName(styles.card__icon, styles["card__icon--full"])}>
        <Icon icon={icon} />
      </div>
      {children}
    </div>
  );
}
