export const WsEvents = {
  PRODUCTION_UPDATE: 'production:update',
  TASK_PROGRESS: 'task:progress',
  RENDER_COMPLETE: 'render:complete',
} as const

export interface ProductionUpdatePayload {
  projectId: string
  overallProgress: number
  activeStep: string
  isComplete: boolean
  steps: Array<{ key: string; label: string; status: string; progress: number }>
}
