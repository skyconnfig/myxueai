import { request } from './http'
import type { ProjectDetail } from '@/types'

export type ProductionStepStatus = 'success' | 'running' | 'waiting' | 'failed'

export interface ProductionStep {
  key: string
  label: string
  status: ProductionStepStatus
  progress: number
  time: string
  durationMs: number | null
  retryCount: number
}

export interface ProductionErrorMeta {
  code: string
  message: string
  step: string | null
  retryable: boolean
  timestamp: string
}

export interface ProductionStatus {
  projectId: string
  projectName: string
  projectStatus: string
  overallProgress: number
  isComplete: boolean
  isProcessing: boolean
  activeStep: string
  stage: string
  jobStatus: string
  taskId: string | null
  steps: ProductionStep[]
  elapsedMs: number | null
  etaMs: number | null
  error: string | null
  errorMeta: ProductionErrorMeta | null
  logs: Array<{ time: string; message: string }>
  credits: number
  creditsDeducted?: number
  creditsBalance?: number
  videoUrl?: string | null
  renderId?: string | null
}

export function fetchProductionStatus(projectId: string, tick = true) {
  return request<ProductionStatus>({
    url: `/projects/${projectId}/production`,
    method: 'GET',
    params: tick ? undefined : { tick: 'false' },
  })
}

export function startProduction(projectId: string) {
  return request<ProductionStatus>({
    url: `/projects/${projectId}/production/start`,
    method: 'POST',
  })
}

export function retryProduction(projectId: string) {
  return request<ProductionStatus>({
    url: `/projects/${projectId}/production/retry`,
    method: 'POST',
  })
}

export function cancelProduction(projectId: string) {
  return request<ProductionStatus>({
    url: `/projects/${projectId}/production/cancel`,
    method: 'POST',
  })
}

export function regenerateVoice(projectId: string, sceneId?: string) {
  return request<ProjectDetail>({
    url: `/projects/${projectId}/production/voice`,
    method: 'POST',
    params: sceneId ? { sceneId } : undefined,
    timeout: 120000,
  })
}

export function generateSceneImages(projectId: string, sceneId?: string) {
  return request<ProjectDetail>({
    url: `/projects/${projectId}/production/images`,
    method: 'POST',
    params: sceneId ? { sceneId } : undefined,
  })
}
