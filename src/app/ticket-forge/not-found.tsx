import Link from "next/link";

// Shown inside the Ticket Forge layout when a page calls notFound().
export default function TicketForgeNotFound() {
  return (
    <>
      <p>Requirement not found.</p>
      <p>
        <Link href="/ticket-forge">Go to the list of requirements</Link>
      </p>
    </>
  );
}
