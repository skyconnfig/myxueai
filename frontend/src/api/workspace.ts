import { request } from './http'

export interface WorkspaceSummary {
  credits: number
  creditsLabel: string
  runningCount: number
  queueCount: number
}

export interface VideoTemplate {
  id: string
  name: string
  tag: string
  category: string
  ratio: string
  duration: number
  style: string
  prompt: string
  thumbnail: string
  creditsCost: number
}

export function fetchWorkspaceSummary() {
  return request<WorkspaceSummary>({ url: '/workspace/summary', method: 'GET' })
}

export function fetchTemplates() {
  return request<VideoTemplate[]>({ url: '/workspace/templates', method: 'GET' })
}
