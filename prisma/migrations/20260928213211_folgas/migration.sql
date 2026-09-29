-- AlterTable
ALTER TABLE "AttendanceOccurrence" ADD COLUMN "approvedBy" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "folgaAllowance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("active", "createdAt", "department", "id", "name", "role", "updatedAt") SELECT "active", "createdAt", "department", "id", "name", "role", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE INDEX "Employee_name_idx" ON "Employee"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
