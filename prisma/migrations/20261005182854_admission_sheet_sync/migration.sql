-- AlterTable
ALTER TABLE "Admission" ADD COLUMN "sheetError" TEXT;
ALTER TABLE "Admission" ADD COLUMN "sheetStatus" TEXT;
ALTER TABLE "Admission" ADD COLUMN "sheetSyncedAt" DATETIME;
