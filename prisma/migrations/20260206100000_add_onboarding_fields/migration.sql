-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserPreference" ADD COLUMN "surveyAnswers" JSONB;
ALTER TABLE "UserPreference" ADD COLUMN "customPrompt" TEXT;
