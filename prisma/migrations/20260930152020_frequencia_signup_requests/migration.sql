-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FrequenciaUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FrequenciaUser" ("active", "createdAt", "email", "id", "lastLoginAt", "name", "passwordHash", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "lastLoginAt", "name", "passwordHash", "role", "updatedAt" FROM "FrequenciaUser";
DROP TABLE "FrequenciaUser";
ALTER TABLE "new_FrequenciaUser" RENAME TO "FrequenciaUser";
CREATE UNIQUE INDEX "FrequenciaUser_email_key" ON "FrequenciaUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
