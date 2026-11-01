-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "odooId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectOdooId" INTEGER,
    "allowsTimesheets" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    CONSTRAINT "TimesheetEntry_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "TimesheetPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- The old ticket values were Odoo ids without a Ticket row; they are dropped on purpose.
INSERT INTO "new_TimesheetEntry" ("bookingText", "bookingTextInternal", "bookingTextReviewed", "duration", "endTime", "id", "pageId", "sorting", "startTime") SELECT "bookingText", "bookingTextInternal", "bookingTextReviewed", "duration", "endTime", "id", "pageId", "sorting", "startTime" FROM "TimesheetEntry";
DROP TABLE "TimesheetEntry";
ALTER TABLE "new_TimesheetEntry" RENAME TO "TimesheetEntry";
CREATE INDEX "TimesheetEntry_pageId_sorting_idx" ON "TimesheetEntry"("pageId", "sorting");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_type_odooId_key" ON "Ticket"("type", "odooId");
