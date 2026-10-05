-- AlterTable
ALTER TABLE "Admission" ADD COLUMN "submittedAt" DATETIME;

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
