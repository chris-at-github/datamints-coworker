-- CreateTable
CREATE TABLE "TicketGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "odooId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "customer" TEXT NOT NULL DEFAULT '',
    "pinnedAt" DATETIME,
    "lastUsedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "odooId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectOdooId" INTEGER,
    "allowsTimesheets" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT,
    "favoritedAt" DATETIME,
    CONSTRAINT "Ticket_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TicketGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("allowsTimesheets", "id", "lastUsedAt", "number", "odooId", "projectOdooId", "title", "type") SELECT "allowsTimesheets", "id", "lastUsedAt", "number", "odooId", "projectOdooId", "title", "type" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_type_odooId_key" ON "Ticket"("type", "odooId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TicketGroup_type_odooId_key" ON "TicketGroup"("type", "odooId");
