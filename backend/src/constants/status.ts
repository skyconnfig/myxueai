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
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  VOICE: 'VOICE',
  MUSIC: 'MUSIC',
  RENDER: 'RENDER',
} as const

export const AssetType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  FONT: 'FONT',
} as const
