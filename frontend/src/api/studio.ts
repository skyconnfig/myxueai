import { request } from './http'
import type { ProjectDetail } from '@/types'

export interface AutoEditResult {
  projectId: string
  totalDuration: number
  sceneCount: number
  summary: string
  patches: Array<{ sceneId: string; order: number; duration?: number; transition?: string }>
  project: ProjectDetail
}

export interface CaptionUpdateItem {
  sceneId: string
  voiceText?: string
  captionStyle?: { color?: string; fontSize?: number }
}

export function autoEditProject(projectId: string) {
  return request<AutoEditResult>({
    url: `/projects/${projectId}/studio/auto-edit`,
    method: 'POST',
    timeout: 60000,
  })
}

export function updateProjectCaptions(projectId: string, updates: CaptionUpdateItem[]) {
  return request<{ project: ProjectDetail }>({
    url: `/projects/${projectId}/studio/captions`,
    method: 'POST',
    data: { updates },
    timeout: 30000,
  })
}
