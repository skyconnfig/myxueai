export const ProjectStatus = {
  DRAFT: 'DRAFT',
  PLANNING: 'PLANNING',
  GENERATING: 'GENERATING',
  RENDERING: 'RENDERING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export const TaskStatus = {
  WAITING: 'WAITING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const

export const TaskType = {
  SCRIPT: 'SCRIPT',
  DIRECTOR: 'DIRECTOR',
  STORYBOARD: 'STORYBOARD',
  STOCK: 'STOCK',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  VOICE: 'VOICE',
  MUSIC: 'MUSIC',
  RENDER: 'RENDER',
  REVIEW: 'REVIEW',
  OPTIMIZE: 'OPTIMIZE',
} as const

export const AssetType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  MUSIC: 'MUSIC',
  FONT: 'FONT',
} as const

export const ProductionStage = {
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  DIRECTING: 'DIRECTING',
  SCRIPTING: 'SCRIPTING',
  STORYBOARDING: 'STORYBOARDING',
  GENERATING_ASSETS: 'GENERATING_ASSETS',
  GENERATING_TTS: 'GENERATING_TTS',
  BUILDING_TIMELINE: 'BUILDING_TIMELINE',
  RENDERING: 'RENDERING',
  REVIEWING: 'REVIEWING',
  COMPLETED: 'COMPLETED',
} as const

export type ProductionStageValue = (typeof ProductionStage)[keyof typeof ProductionStage]

export const ProductionJobStatus = {
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const

export type ProductionJobStatusValue = (typeof ProductionJobStatus)[keyof typeof ProductionJobStatus]

export const PRODUCTION_STAGE_ORDER: ProductionStageValue[] = [
  ProductionStage.QUEUED,
  ProductionStage.DIRECTING,
  ProductionStage.SCRIPTING,
  ProductionStage.STORYBOARDING,
  ProductionStage.GENERATING_ASSETS,
  ProductionStage.GENERATING_TTS,
  ProductionStage.BUILDING_TIMELINE,
  ProductionStage.RENDERING,
  ProductionStage.REVIEWING,
  ProductionStage.COMPLETED,
]

export const PRODUCTION_STAGE_LABELS: Record<string, string> = {
  CREATED: '已创建',
  QUEUED: '排队中',
  DIRECTING: 'AI 导演',
  SCRIPTING: '故事脚本',
  STORYBOARDING: '电影分镜',
  GENERATING_ASSETS: '素材生成',
  GENERATING_TTS: '配音合成',
  BUILDING_TIMELINE: '视频合成',
  RENDERING: '渲染导出',
  REVIEWING: 'AI 审片',
  COMPLETED: '已完成',
  FAILED: '已失败',
  CANCELLED: '已取消',
}

export const PipelineStep = {
  DIRECTOR: 'DIRECTOR',
  SCRIPT: 'SCRIPT',
  STORYBOARD: 'STORYBOARD',
  ASSET: 'ASSET',
  TTS: 'TTS',
  TIMELINE: 'TIMELINE',
  RENDER: 'RENDER',
} as const

export type PipelineStepValue = (typeof PipelineStep)[keyof typeof PipelineStep]

export const PIPELINE_STEPS: PipelineStepValue[] = [
  PipelineStep.DIRECTOR,
  PipelineStep.SCRIPT,
  PipelineStep.STORYBOARD,
  PipelineStep.ASSET,
  PipelineStep.TTS,
  PipelineStep.TIMELINE,
  PipelineStep.RENDER,
]

export const PIPELINE_STEP_LABELS: Record<string, string> = {
  DIRECTOR: 'AI 导演',
  SCRIPT: '故事脚本',
  STORYBOARD: '电影分镜',
  ASSET: '素材生成',
  TTS: '配音合成',
  TIMELINE: '视频合成',
  RENDER: '渲染导出',
}

export const STAGE_TO_STEP: Record<string, PipelineStepValue> = {
  DIRECTING: PipelineStep.DIRECTOR,
  SCRIPTING: PipelineStep.SCRIPT,
  STORYBOARDING: PipelineStep.STORYBOARD,
  GENERATING_ASSETS: PipelineStep.ASSET,
  GENERATING_TTS: PipelineStep.TTS,
  BUILDING_TIMELINE: PipelineStep.TIMELINE,
  RENDERING: PipelineStep.RENDER,
}

export const STEP_TO_STAGE: Record<string, string> = {
  DIRECTOR: ProductionStage.DIRECTING,
  SCRIPT: ProductionStage.SCRIPTING,
  STORYBOARD: ProductionStage.STORYBOARDING,
  ASSET: ProductionStage.GENERATING_ASSETS,
  TTS: ProductionStage.GENERATING_TTS,
  TIMELINE: ProductionStage.BUILDING_TIMELINE,
  RENDER: ProductionStage.RENDERING,
}

export const STEP_BASE_PROGRESS: Record<string, number> = {
  DIRECTOR: 5,
  SCRIPT: 15,
  STORYBOARD: 25,
  ASSET: 45,
  TTS: 65,
  TIMELINE: 75,
  RENDER: 95,
}

export const FINAL_PROGRESS = 100

export interface ProductionStepRecord {
  key: PipelineStepValue
  status: 'waiting' | 'running' | 'success' | 'failed'
  progress: number
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  error: string | null
  retryCount: number
}

export interface ProductionErrorMeta {
  code: string
  message: string
  step: PipelineStepValue | null
  retryable: boolean
  timestamp: string
}

