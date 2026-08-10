import { request } from './http'

export interface VideoTaskItem {
  id: string
  projectId: string
  projectName: string
  projectThumbnail?: string | null
  type: string
  status: string
  progress: number
  error?: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskSummary {
  credits: number
  creditsLabel: string
  runningCount: number
  queueCount: number
  totalActive: number
  statusCounts: Record<string, number>
  recentTasks: Array<{
    id: string
    projectId: string
    projectName: string
    type: string
    status: string
    progress: number
    error?: string | null
    updatedAt: string
  }>
}

export function fetchTaskSummary() {
  return request<TaskSummary>({ url: '/tasks/summary', method: 'GET' })
}

export function fetchTasks(params?: { status?: string; limit?: number }) {
  return request<VideoTaskItem[]>({
    url: '/tasks',
    method: 'GET',
    params,
  })
}

export function stopTask(id: string) {
  return request<VideoTaskItem>({
    url: `/tasks/${id}/stop`,
    method: 'POST',
  })
}

export function deleteTask(id: string) {
  return request<{ id: string; deleted: boolean }>({
    url: `/tasks/${id}`,
    method: 'DELETE',
  })
}

export function createProductionTask(projectId: string) {
  return request<{ task: VideoTaskItem | null; production: unknown }>({
    url: '/tasks',
    method: 'POST',
    data: { projectId, type: 'PRODUCTION' },
  })
}
