import { request } from './http'

export interface RenderResult {
  renderId: string
  outputUrl: string
  usedRemotion: boolean
}

export interface RenderStatus {
  id: string
  projectId: string
  composition: string
  outputUrl: string | null
  width: number
  height: number
  fps: number
  status: string
  createdAt: string
}

export async function startRender(projectId: string) {
  return request<RenderResult>({
    method: 'POST',
    url: '/render',
    data: { projectId },
  })
}

export async function fetchRender(id: string) {
  return request<RenderStatus>({ method: 'GET', url: `/render/${id}` })
}

export async function fetchProjectRenders(projectId: string) {
  return request<Array<{ id: string; projectId: string; outputUrl: string | null; status: string; createdAt: string }>>({
    method: 'GET',
    url: `/render/project/${projectId}`,
  })
}
