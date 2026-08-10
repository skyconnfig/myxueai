-- AlterTable (SQLite-compatible: avoid non-constant DEFAULT on ADD COLUMN)
ALTER TABLE "Render" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Render" ADD COLUMN "error" TEXT;
ALTER TABLE "Render" ADD COLUMN "updatedAt" DATETIME;
