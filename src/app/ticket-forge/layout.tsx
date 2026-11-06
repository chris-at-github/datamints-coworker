import type { Metadata } from "next";
import { TICKET_FORGE_AREA } from "@/lib/areas";
import { AreaHeader } from "@/modules/AreaHeader/AreaHeader";

// A template only reaches the next level, so the pages below need their own.
export const metadata: Metadata = {
  title: { default: TICKET_FORGE_AREA.name, template: "%s | Datamints Co-Worker" },
};

export default function TicketForgeLayout({ children }: LayoutProps<"/ticket-forge">) {
  return (
    <main className="page__main">
      <AreaHeader area={TICKET_FORGE_AREA} />
      {children}
    </main>
  );
}
