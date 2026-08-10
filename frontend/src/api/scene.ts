import { request } from './http'
import type { ProjectDetail, UpdateScenePayload } from '@/types'

export function updateScene(id: string, payload: UpdateScenePayload) {
  return request<ProjectDetail>({
    url: `/scenes/${id}`,
    method: 'PATCH',
    data: payload,
  })
}
