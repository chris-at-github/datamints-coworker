"use client";

import { type ChangeEvent, type KeyboardEvent, type ReactNode, useId, useState } from "react";
import { mergeClassName } from "@/lib/class-names";
import styles from "./PickerList.module.css";

export type PickerListSection<T> = {
  // Shown above the items, e.g. "Pinned"; without it the items follow directly.
  label?: string;
  items: T[];
};

export type PickerListProps<T> = {
  // Text input on top: filters or searches the items; the focus stays there.
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  sections: PickerListSection<T>[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onPick: (item: T) => void;
  // Shown instead of the items, e.g. "Loading…" or an error.
  status?: ReactNode;
  // Shown when there are no items and no status.
  emptyText: ReactNode;
  // Next to the input, e.g. a toggle.
  toolbar?: ReactNode;
};

// A listbox driven from the input above it: ↑/↓ move the marker
// (aria-activedescendant), Enter picks the marked item, a click picks an item.
export function PickerList<T>({
  query,
  onQueryChange,
  placeholder,
  sections,
  getKey,
  renderItem,
  onPick,
  status,
  emptyText,
  toolbar,
}: PickerListProps<T>) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const items = sections.flatMap((section) => section.items);
  // Kept in range when the items change, e.g. after filtering.
  const markedIndex = Math.min(activeIndex, items.length - 1);
  const optionId = (index: number) => `${listId}-${index}`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setActiveIndex(0);
    onQueryChange(event.currentTarget.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(0, Math.min(items.length - 1, markedIndex + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter" && items[markedIndex]) {
      event.preventDefault();
      onPick(items[markedIndex]);
    }
  }

  let index = -1;

  return (
    <div className={styles["picker-list"]}>
      <div className={styles["picker-list__toolbar"]}>
        <input
          className={styles["picker-list__input"]}
          type="text"
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={items.length > 0 ? optionId(markedIndex) : undefined}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          data-autofocus
        />
        {toolbar}
      </div>
      {status ?? (items.length === 0 && <p className={styles["picker-list__empty"]}>{emptyText}</p>)}
      <div id={listId} role="listbox" aria-label={placeholder} className={styles["picker-list__list"]} hidden={!!status}>
        {sections.map(
          (section, sectionIndex) =>
            section.items.length > 0 && (
              <div key={section.label ?? sectionIndex} role="group" aria-label={section.label}>
                {section.label && (
                  <div className={styles["picker-list__label"]} aria-hidden="true">
                    {section.label}
                  </div>
                )}
                {section.items.map((item) => {
                  index++;
                  const itemIndex = index;

                  return (
                    // Clicks and the marker only; the keyboard stays in the input.
                    <div
                      key={getKey(item)}
                      id={optionId(itemIndex)}
                      role="option"
                      aria-selected={itemIndex === markedIndex}
                      className={mergeClassName(
                        styles["picker-list__option"],
                        itemIndex === markedIndex ? styles["picker-list__option--active"] : undefined,
                      )}
                      onClick={() => onPick(item)}
                      onMouseMove={() => setActiveIndex(itemIndex)}
                    >
                      {renderItem(item)}
                    </div>
                  );
                })}
              </div>
            ),
        )}
      </div>
    </div>
  );
}
