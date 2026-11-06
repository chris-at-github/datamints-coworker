-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "rawText" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "internalDescription" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aiFeedback" TEXT NOT NULL DEFAULT '',
    "previousValues" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME
);
INSERT INTO "new_Requirement" ("archivedAt", "createdAt", "description", "id", "internalDescription", "rawText", "status", "title", "updatedAt") SELECT "archivedAt", "createdAt", "description", "id", "internalDescription", "rawText", "status", "title", "updatedAt" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
CREATE INDEX "Requirement_archivedAt_updatedAt_idx" ON "Requirement"("archivedAt", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
