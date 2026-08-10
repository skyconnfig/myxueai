import { request } from './http'
import type { CreateProjectPayload, Project, ProjectDetail } from '@/types'

export function fetchProjects() {
  return request<Project[]>({ url: '/projects', method: 'GET' })
}

export function fetchProject(id: string) {
  return request<ProjectDetail>({ url: `/projects/${id}`, method: 'GET' })
}

export function createProject(payload: CreateProjectPayload) {
  return request<Project>({ url: '/projects', method: 'POST', data: payload })
}

export function deleteProject(id: string) {
  return request<void>({ url: `/projects/${id}`, method: 'DELETE' })
}
