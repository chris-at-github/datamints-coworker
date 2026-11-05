import { MessageSquareCheckIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/Button";
import { Popover } from "@/components/Popover";
import styles from "./TimesheetInternalNote.module.css";

export type TimesheetInternalNoteProps = {
  rowNumber: number;
  value: string;
  onChange: (value: string) => void;
  // Called when the popover closes, by Escape, a click outside or the close button.
  onClose: () => void;
};

// The rarely used internal booking text, edited in a popover; the icon shows whether there is one.
export function TimesheetInternalNote({ rowNumber, value, onChange, onClose }: TimesheetInternalNoteProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const label = `Internal booking text, row ${rowNumber}`;
  const isFilled = value.trim() !== "";
  const icon = isFilled ? MessageSquareCheckIcon : MessageSquareIcon;

  return (
    // Saving on close instead of on blur: a focused element that is removed with
    // the popup does not reliably fire blur.
    <Popover onOpenChange={(open) => !open && onClose()}>
      {/* data-filled lets the row keep the button visible outside hover. */}
      <Popover.Trigger render={<Button.Icon icon={icon} aria-label={label} data-filled={isFilled || undefined} />} />
      <Popover.Popup align="end" initialFocus={textareaRef}>
        <div className={styles["timesheet-internal-note__header"]}>
          <Popover.Title>Internal booking text</Popover.Title>
          <Popover.Close render={<Button.Icon icon={XIcon} aria-label="Close" />} />
        </div>
        <textarea
          ref={textareaRef}
          className={styles["timesheet-internal-note__field"]}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
      </Popover.Popup>
    </Popover>
  );
}
