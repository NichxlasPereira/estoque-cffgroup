-- AlterTable
ALTER TABLE "Admission" ADD COLUMN "driveError" TEXT;
ALTER TABLE "Admission" ADD COLUMN "driveFolderId" TEXT;
ALTER TABLE "Admission" ADD COLUMN "driveFolderUrl" TEXT;
ALTER TABLE "Admission" ADD COLUMN "driveStatus" TEXT;
ALTER TABLE "Admission" ADD COLUMN "driveSyncedAt" DATETIME;

-- AlterTable
ALTER TABLE "AdmissionFile" ADD COLUMN "driveFileId" TEXT;
