import { request } from './http'

export interface DbVideoTemplate {
  id: string
  slug: string
  name: string
  category: string
  duration: number
  ratio: string
  previewUrl?: string | null
  config?: Record<string, unknown>
  style?: { name: string; colorPalette?: unknown }
  scenes: Array<{
    order: number
    sceneType: string
    componentName?: string | null
    durationRatio: number
  }>
}

export function fetchVideoTemplates(category?: string) {
  return request<DbVideoTemplate[]>({
    url: '/templates',
    method: 'GET',
    params: category ? { category } : undefined,
  })
}

export function fetchVideoTemplate(slug: string) {
  return request<DbVideoTemplate>({
    url: `/templates/${slug}`,
    method: 'GET',
  })
}

export function applyVideoTemplate(projectId: string, templateSlug: string) {
  return request<{ projectId: string; templateSlug: string; sceneCount: number }>({
    url: `/projects/${projectId}/apply-template`,
    method: 'POST',
    data: { templateSlug },
  })
}
