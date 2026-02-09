-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "defaultView" TEXT NOT NULL DEFAULT 'list';
