-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "rawText" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "internalDescription" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aiFeedback" TEXT NOT NULL DEFAULT '',
    "previousValues" TEXT NOT NULL DEFAULT '',
    "targetGroupId" TEXT,
    "ticketId" TEXT,
    "odooDescriptionHash" TEXT NOT NULL DEFAULT '',
    "odooInternalHash" TEXT NOT NULL DEFAULT '',
    "transferredValues" TEXT NOT NULL DEFAULT '',
    "transferError" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME,
    CONSTRAINT "Requirement_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "TicketGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Requirement_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Requirement" ("aiFeedback", "archivedAt", "createdAt", "description", "id", "internalDescription", "odooDescriptionHash", "odooInternalHash", "previousValues", "rawText", "status", "targetGroupId", "ticketId", "title", "transferError", "transferredValues", "updatedAt") SELECT "aiFeedback", "archivedAt", "createdAt", "description", "id", "internalDescription", "odooDescriptionHash", "odooInternalHash", "previousValues", "rawText", "status", "targetGroupId", "ticketId", "title", "transferError", "transferredValues", "updatedAt" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
CREATE INDEX "Requirement_archivedAt_updatedAt_idx" ON "Requirement"("archivedAt", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
