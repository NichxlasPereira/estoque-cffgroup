-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AttendanceOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeeDepartment" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "minutesLate" INTEGER,
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceOccurrence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "Employee"("name");

-- CreateIndex
CREATE INDEX "AttendanceOccurrence_employeeId_idx" ON "AttendanceOccurrence"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceOccurrence_date_idx" ON "AttendanceOccurrence"("date");

-- CreateIndex
CREATE INDEX "AttendanceOccurrence_type_idx" ON "AttendanceOccurrence"("type");
