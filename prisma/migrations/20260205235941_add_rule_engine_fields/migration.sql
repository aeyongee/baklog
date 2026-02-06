-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "alertAt" TIMESTAMP(3),
ADD COLUMN     "backlogAt" TIMESTAMP(3),
ADD COLUMN     "needsReviewAt" TIMESTAMP(3);
