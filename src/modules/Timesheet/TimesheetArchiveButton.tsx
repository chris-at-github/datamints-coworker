import { AlertDialog } from "@/components/AlertDialog";
import { Button } from "@/components/Button";

export type TimesheetArchiveButtonProps = {
  date: string;
  isArchived: boolean;
  // Today's page cannot be archived; the button stays visible but disabled.
  isToday: boolean;
  onArchive: () => void;
  onRestore: () => void;
};

// "Archive" with a confirmation; on an archived page "Restore" instead, which
// needs no confirmation as it only brings the page back.
export function TimesheetArchiveButton({ date, isArchived, isToday, onArchive, onRestore }: TimesheetArchiveButtonProps) {
  if (isArchived) {
    return <Button onClick={onRestore}>Restore</Button>;
  }

  return (
    <AlertDialog>
      <AlertDialog.Trigger disabled={isToday}>Archive</AlertDialog.Trigger>
      <AlertDialog.Popup>
        <AlertDialog.Title>Archive page?</AlertDialog.Title>
        <AlertDialog.Description>
          The page of {date} is hidden from the pagination. It can be restored from the list of archived pages.
        </AlertDialog.Description>
        <Button.Group>
          <AlertDialog.Close>Cancel</AlertDialog.Close>
          <AlertDialog.Close onClick={onArchive}>Archive</AlertDialog.Close>
        </Button.Group>
      </AlertDialog.Popup>
    </AlertDialog>
  );
}
