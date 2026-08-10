import { request } from './http'
import type { ProjectDetail } from '@/types'

export interface ProductionStep {
  key: string
  label: string
  status: 'success' | 'running' | 'waiting' | 'failed'
  progress: number
  time: string
}

export interface ProductionStatus {
  projectId: string
  projectName: string
  projectStatus: string
  overallProgress: number
  isComplete: boolean
  isProcessing: boolean
  activeStep: string
  steps: ProductionStep[]
  logs: Array<{ time: string; message: string }>
  credits: number
  creditsDeducted?: number
  creditsBalance?: number
  videoUrl?: string | null
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

export function regenerateVoice(projectId: string) {
  return request<ProjectDetail>({
    url: `/projects/${projectId}/production/voice`,
    method: 'POST',
  })
}

export function generateSceneImages(projectId: string, sceneId?: string) {
  return request<ProjectDetail>({
    url: `/projects/${projectId}/production/images`,
    method: 'POST',
    params: sceneId ? { sceneId } : undefined,
  })
}
