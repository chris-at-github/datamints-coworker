// Sample data for development: two days, the newer one with more than five rows.
// Clears both tables first, so it can be run again.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getDuration } from "../src/lib/time";

type SampleEntry = [
  startTime: string,
  endTime: string,
  ticketType: string,
  ticketId: string,
  bookingText: string,
  bookingTextInternal: string,
];

const SAMPLE_PAGES: { date: string; entries: SampleEntry[] }[] = [
  {
    date: "2026-10-08",
    entries: [
      ["08:00", "09:30", "helpdesk", "4012", "Set up project", ""],
      ["09:30", "12:00", "helpdesk", "4014", "Build timesheet table", "Pairing with the team"],
      ["13:00", "16:15", "project", "10215", "Add duration calculation", ""],
    ],
  },
  {
    date: "2026-10-09",
    entries: [
      ["08:00", "08:15", "", "", "Daily stand-up", ""],
      ["08:15", "10:00", "helpdesk", "4021", "Split timesheet module", ""],
      ["10:00", "10:30", "project", "10022", "Review", "Waiting for feedback"],
      ["10:30", "12:00", "helpdesk", "4023", "Reset dialog", ""],
      ["13:00", "14:00", "helpdesk", "4024", "Add rows button", ""],
      ["14:00", "15:30", "project", "10125", "Time input mask", "Cursor jumps to the end"],
      ["15:30", "16:00", "", "", "Team meeting", ""],
      ["16:00", "17:00", "helpdesk", "4026", "Documentation", ""],
    ],
  },
];

async function main() {
  await prisma.timesheetEntry.deleteMany();
  await prisma.timesheetPage.deleteMany();

  for (const { date, entries } of SAMPLE_PAGES) {
    await prisma.timesheetPage.create({
      data: {
        id: crypto.randomUUID(),
        date,
        entries: {
          create: entries.map(([startTime, endTime, ticketType, ticketId, bookingText, bookingTextInternal], sorting) => ({
            id: crypto.randomUUID(),
            sorting,
            startTime,
            endTime,
            duration: getDuration(startTime, endTime),
            ticketId,
            ticketType,
            bookingText,
            bookingTextInternal,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${SAMPLE_PAGES.length} timesheet pages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
