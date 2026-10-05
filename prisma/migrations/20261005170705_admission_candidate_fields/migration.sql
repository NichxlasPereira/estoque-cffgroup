-- CreateTable
CREATE TABLE "AdmissionField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admissionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "value" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdmissionField_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "department" TEXT,
    "startDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "notes" TEXT,
    "tokenHash" TEXT NOT NULL,
    "tokenExpiresAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "employeeId" TEXT,
    "driveStatus" TEXT,
    "driveFolderId" TEXT,
    "driveFolderUrl" TEXT,
    "driveError" TEXT,
    "driveSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Admission" ("candidateName", "createdAt", "createdBy", "department", "driveError", "driveFolderId", "driveFolderUrl", "driveStatus", "driveSyncedAt", "email", "employeeId", "id", "notes", "phone", "role", "startDate", "status", "tokenExpiresAt", "tokenHash", "updatedAt") SELECT "candidateName", "createdAt", "createdBy", "department", "driveError", "driveFolderId", "driveFolderUrl", "driveStatus", "driveSyncedAt", "email", "employeeId", "id", "notes", "phone", "role", "startDate", "status", "tokenExpiresAt", "tokenHash", "updatedAt" FROM "Admission";
DROP TABLE "Admission";
ALTER TABLE "new_Admission" RENAME TO "Admission";
CREATE UNIQUE INDEX "Admission_tokenHash_key" ON "Admission"("tokenHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AdmissionField_admissionId_idx" ON "AdmissionField"("admissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionField_admissionId_key_key" ON "AdmissionField"("admissionId", "key");
