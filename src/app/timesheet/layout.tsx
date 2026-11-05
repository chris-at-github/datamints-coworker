import type { Metadata } from "next";
import { connection } from "next/server";
import { readTicketUrlTemplates } from "@/lib/odoo";
import { TicketLinksProvider } from "@/modules/Timesheet/TicketLinks";

// A template only reaches the next level, so the pages below need their own.
export const metadata: Metadata = {
  title: { default: "Timesheet", template: "%s | Datamints Co-Worker" },
};

export default async function TimesheetLayout({ children }: LayoutProps<"/timesheet">) {
  // Renders on every request, so the templates come from the current environment, not the build.
  await connection();

  return (
    <main className="page__main">
      <h1>Timesheet</h1>
      <TicketLinksProvider templates={readTicketUrlTemplates()}>{children}</TicketLinksProvider>
    </main>
  );
}
