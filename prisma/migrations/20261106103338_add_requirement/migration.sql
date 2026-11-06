-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "rawText" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "internalDescription" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Requirement_archivedAt_updatedAt_idx" ON "Requirement"("archivedAt", "updatedAt");
