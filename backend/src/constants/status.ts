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
