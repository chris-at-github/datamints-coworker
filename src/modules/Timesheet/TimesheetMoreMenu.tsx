import { EllipsisIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Menu } from "@/components/Menu";

// Further actions behind three dots; for now only the list of archived pages.
export function TimesheetMoreMenu() {
  return (
    <Menu>
      <Menu.Trigger render={<Button.Icon icon={EllipsisIcon} aria-label="More" />} />
      <Menu.Popup align="end">
        <Menu.LinkItem render={<Link href="/timesheet/archive" />}>Archived pages</Menu.LinkItem>
      </Menu.Popup>
    </Menu>
  );
}
