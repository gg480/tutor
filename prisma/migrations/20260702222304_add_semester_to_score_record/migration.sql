-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentSubjectRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "fullScore" REAL NOT NULL,
    "rank" TEXT,
    "semester" TEXT NOT NULL DEFAULT 'first',
    "examType" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "examName" TEXT NOT NULL,
    "examRange" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentSubjectRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentSubjectRecord" ("createdAt", "examDate", "examName", "examRange", "examType", "fullScore", "id", "note", "rank", "score", "studentId", "subjectId") SELECT "createdAt", "examDate", "examName", "examRange", "examType", "fullScore", "id", "note", "rank", "score", "studentId", "subjectId" FROM "StudentSubjectRecord";
DROP TABLE "StudentSubjectRecord";
ALTER TABLE "new_StudentSubjectRecord" RENAME TO "StudentSubjectRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
