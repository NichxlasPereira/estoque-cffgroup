-- CreateTable
CREATE TABLE "AttendanceAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occurrenceId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storedName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceAttachment_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "AttendanceOccurrence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceAttachment_storedName_key" ON "AttendanceAttachment"("storedName");

-- CreateIndex
CREATE INDEX "AttendanceAttachment_occurrenceId_idx" ON "AttendanceAttachment"("occurrenceId");
