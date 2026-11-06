import type { Metadata } from "next";
import { connection } from "next/server";
import { TICKET_FORGE_AREA } from "@/lib/areas";
import { readTicketUrlTemplates } from "@/lib/odoo";
import { AreaHeader } from "@/modules/AreaHeader/AreaHeader";
import { TicketLinksProvider } from "@/modules/Timesheet/TicketLinks";

// A template only reaches the next level, so the pages below need their own.
export const metadata: Metadata = {
  title: { default: TICKET_FORGE_AREA.name, template: "%s | Datamints Co-Worker" },
};

export default async function TicketForgeLayout({ children }: LayoutProps<"/ticket-forge">) {
  // Renders on every request, so the ticket links come from the current environment, not the build.
  await connection();

  return (
    <main className="page__main">
      <AreaHeader area={TICKET_FORGE_AREA} />
      <TicketLinksProvider templates={readTicketUrlTemplates()}>{children}</TicketLinksProvider>
    </main>
  );
}
