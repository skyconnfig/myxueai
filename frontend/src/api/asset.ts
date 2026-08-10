import { request } from './http'
import type { AssetDto } from '@xueai/shared'

export async function fetchAssets(params?: { projectId?: string; type?: string }) {
  return request<AssetDto[]>({
    method: 'GET',
    url: '/assets',
    params,
  })
}

export async function uploadAsset(file: File, data: { projectId: string; sceneId?: string; type?: string }) {
  const form = new FormData()
  form.append('file', file)
  form.append('projectId', data.projectId)
  if (data.sceneId) form.append('sceneId', data.sceneId)
  if (data.type) form.append('type', data.type)

  return request<AssetDto>({
    method: 'POST',
    url: '/assets/upload',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteAsset(id: string) {
  return request<{ id: string; fileDeleted: boolean; url: string }>({
    method: 'DELETE',
    url: `/assets/${id}`,
  })
}
