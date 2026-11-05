"use client";

import { StarIcon, StarOffIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { mergeClassName } from "@/lib/class-names";
import type { TicketRow } from "./tickets";
import styles from "./FavoriteButton.module.css";

export type FavoriteButtonProps = {
  row: TicketRow;
  isFavorite: boolean;
  // True while the change is saved, so it cannot be sent twice.
  isPending: boolean;
  onToggle: (row: TicketRow) => void;
};

// The icon shows the action: a star adds, a crossed-out star removes; a
// favorite is also filled. The label changes with the action, so
// there is no aria-pressed.
export function FavoriteButton({ row, isFavorite, isPending, onToggle }: FavoriteButtonProps) {
  return (
    <Button.Icon
      icon={isFavorite ? StarOffIcon : StarIcon}
      aria-label={isFavorite ? `Remove #${row.number} from favorites` : `Add #${row.number} to favorites`}
      className={mergeClassName(styles["favorite-button"], isFavorite ? styles["favorite-button--active"] : undefined)}
      disabled={isPending}
      tabIndex={-1}
      onClick={(event) => {
        // Toggles without taking the ticket over.
        event.stopPropagation();
        onToggle(row);
      }}
    />
  );
}
