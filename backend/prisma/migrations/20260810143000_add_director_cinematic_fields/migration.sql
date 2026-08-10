-- AlterTable
ALTER TABLE "Project" ADD COLUMN "audience" TEXT;
ALTER TABLE "Project" ADD COLUMN "goal" TEXT;
ALTER TABLE "Project" ADD COLUMN "videoStyle" TEXT;
ALTER TABLE "Project" ADD COLUMN "emotion" TEXT;
ALTER TABLE "Project" ADD COLUMN "directorBrief" TEXT;

-- AlterTable
ALTER TABLE "Scene" ADD COLUMN "storyBeat" TEXT;
ALTER TABLE "Scene" ADD COLUMN "shotType" TEXT;
ALTER TABLE "Scene" ADD COLUMN "cameraMotion" TEXT;
ALTER TABLE "Scene" ADD COLUMN "lighting" TEXT;
ALTER TABLE "Scene" ADD COLUMN "emotion" TEXT;
ALTER TABLE "Scene" ADD COLUMN "action" TEXT;
ALTER TABLE "Scene" ADD COLUMN "negativePrompt" TEXT;
ALTER TABLE "Scene" ADD COLUMN "transition" TEXT;
ALTER TABLE "Scene" ADD COLUMN "sceneType" TEXT;
