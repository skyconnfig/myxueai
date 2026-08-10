-- SQLite-compatible migration for Video Intelligence Layer

CREATE TABLE "VideoTemplateStyle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "colorPalette" TEXT,
    "typography" TEXT,
    "motionFamily" TEXT,
    "negativePrompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "VideoTemplateStyle_slug_key" ON "VideoTemplateStyle"("slug");

CREATE TABLE "VideoTemplateComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remotionComponent" TEXT NOT NULL,
    "motionPattern" TEXT,
    "defaultDuration" INTEGER,
    "configSchema" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "VideoTemplateComponent_slug_key" ON "VideoTemplateComponent"("slug");

CREATE TABLE "VideoTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "ratio" TEXT NOT NULL DEFAULT '16:9',
    "styleId" TEXT,
    "config" TEXT,
    "previewUrl" TEXT,
    "isSystem" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoTemplate_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "VideoTemplateStyle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VideoTemplate_slug_key" ON "VideoTemplate"("slug");

CREATE TABLE "VideoTemplateScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sceneType" TEXT NOT NULL,
    "componentName" TEXT NOT NULL DEFAULT 'cinematic_still',
    "durationRatio" REAL NOT NULL DEFAULT 0.15,
    "cameraRule" TEXT,
    "motionRule" TEXT,
    "promptRule" TEXT,
    "assetRole" TEXT NOT NULL DEFAULT 'illustration',
    "voiceHint" TEXT,
    "transition" TEXT NOT NULL DEFAULT 'crossfade',
    CONSTRAINT "VideoTemplateScene_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "VideoTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StockAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "localPath" TEXT,
    "url" TEXT NOT NULL,
    "duration" REAL,
    "width" INTEGER,
    "height" INTEGER,
    "photographer" TEXT,
    "license" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "StockAsset_provider_externalId_key" ON "StockAsset"("provider", "externalId");

CREATE TABLE "VideoReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "renderId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'hybrid',
    "scores" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "strengths" TEXT,
    "overallScore" REAL NOT NULL,
    "verdict" TEXT NOT NULL,
    "priorityFix" TEXT,
    "twelvelabsIndexId" TEXT,
    "twelvelabsVideoId" TEXT,
    "rawAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoReview_renderId_fkey" FOREIGN KEY ("renderId") REFERENCES "Render" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Project extensions
ALTER TABLE "Project" ADD COLUMN "templateId" TEXT REFERENCES "VideoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD COLUMN "platform" TEXT;
ALTER TABLE "Project" ADD COLUMN "directorPlan" TEXT;
ALTER TABLE "Project" ADD COLUMN "storyboardStatus" TEXT DEFAULT 'draft';
ALTER TABLE "Project" ADD COLUMN "reviewScore" REAL;
ALTER TABLE "Project" ADD COLUMN "reviewVerdict" TEXT;
ALTER TABLE "Project" ADD COLUMN "lastReviewId" TEXT;

-- Scene extensions
ALTER TABLE "Scene" ADD COLUMN "purpose" TEXT;
ALTER TABLE "Scene" ADD COLUMN "componentType" TEXT DEFAULT 'cinematic_still';
ALTER TABLE "Scene" ADD COLUMN "viewerTask" TEXT;
ALTER TABLE "Scene" ADD COLUMN "inputDesc" TEXT;
ALTER TABLE "Scene" ADD COLUMN "processDesc" TEXT;
ALTER TABLE "Scene" ADD COLUMN "resultDesc" TEXT;
ALTER TABLE "Scene" ADD COLUMN "motionDescription" TEXT;
ALTER TABLE "Scene" ADD COLUMN "soundEffect" TEXT;
ALTER TABLE "Scene" ADD COLUMN "assetRequirement" JSONB;
ALTER TABLE "Scene" ADD COLUMN "assetSource" TEXT;
ALTER TABLE "Scene" ADD COLUMN "stockMeta" JSONB;
ALTER TABLE "Scene" ADD COLUMN "cues" JSONB;

-- Asset extension
ALTER TABLE "Asset" ADD COLUMN "stockAssetId" TEXT;

-- Render extensions
ALTER TABLE "Render" ADD COLUMN "outputHash" TEXT;
ALTER TABLE "Render" ADD COLUMN "twelvelabsIndexId" TEXT;
