-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimesheetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "sorting" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "ticketId" TEXT,
    "bookingText" TEXT NOT NULL DEFAULT '',
    "bookingTextInternal" TEXT NOT NULL DEFAULT '',
    "bookingTextReviewed" TEXT NOT NULL DEFAULT '',
    "odooTimesheetId" INTEGER,
    "transferredValues" TEXT NOT NULL DEFAULT '',
    "transferError" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "TimesheetEntry_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "TimesheetPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TimesheetEntry" ("bookingText", "bookingTextInternal", "bookingTextReviewed", "duration", "endTime", "id", "pageId", "sorting", "startTime", "ticketId") SELECT "bookingText", "bookingTextInternal", "bookingTextReviewed", "duration", "endTime", "id", "pageId", "sorting", "startTime", "ticketId" FROM "TimesheetEntry";
DROP TABLE "TimesheetEntry";
ALTER TABLE "new_TimesheetEntry" RENAME TO "TimesheetEntry";
CREATE INDEX "TimesheetEntry_pageId_sorting_idx" ON "TimesheetEntry"("pageId", "sorting");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

