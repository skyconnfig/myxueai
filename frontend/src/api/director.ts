import { request } from './http'
import type { DirectorBrief } from '@/types'

export interface PreviewDirectorPayload {
  topic: string
  style?: string
  videoStyle?: string
  audience?: string
  goal?: string
  duration?: number
  ratio?: string
}

export function previewDirectorBrief(payload: PreviewDirectorPayload) {
  return request<{ brief: DirectorBrief; source: string }>({
    url: '/ai/director',
    method: 'POST',
    data: payload,
    timeout: 60000,
  })
}
