export const WsEvents = {
  PRODUCTION_UPDATE: 'production:update',
  PRODUCTION_EVENT: 'production:event',
  TASK_PROGRESS: 'task:progress',
  RENDER_COMPLETE: 'render:complete',
} as const

export type ProductionEventType =
  | 'connected'
  | 'progress'
  | 'step_started'
  | 'step_completed'
  | 'failed'
  | 'cancelled'
  | 'completed'

export interface ProductionEventPayload {
  type: ProductionEventType
  projectId: string
  taskId: string | null
  step: string | null
  status: string | null
  progress: number | null
  message: string | null
  timestamp: string
}

export interface ProductionUpdatePayload {
  projectId: string
  projectName: string
  projectStatus: string
  overallProgress: number
  isComplete: boolean
  isProcessing: boolean
  activeStep: string
  stage: string
  jobStatus: string
  steps: Array<{ key: string; label: string; status: string; progress: number }>
  logs: Array<{ time: string; message: string }>
  credits: number
  videoUrl?: string | null
}
