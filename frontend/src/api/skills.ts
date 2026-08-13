import http, { request } from './http'
import type { ApiResponse } from '@/types'
import type { AgentPlan, SkillDefinition, SkillMarketplaceListing } from '@xueai/shared'

export interface MarketplaceCatalog {
  version: string
  name: string
  description?: string
  featured: string[]
  categories: Array<{ id: string; name: string; skills: string[] }>
}

export interface SkillMarketplaceResponse {
  catalog: MarketplaceCatalog
  listings: SkillMarketplaceListing[]
  total: number
}

export interface SkillMatchResponse {
  skills: string[]
  scores: Array<{ skillId: string; score: number; kind: string; matchedBy: string[] }>
  bundle: string | null
}

export interface SkillDetailResponse {
  listing: SkillMarketplaceListing
  skill: SkillDefinition
}

export interface SkillValidateResponse {
  ok: boolean
  skill?: SkillDefinition
  errors: Array<{ path: string; message: string }>
}

export function fetchSkillMarketplace(params?: {
  tier?: string
  kind?: string
  category?: string
  featured?: boolean
  search?: string
}) {
  return request<SkillMarketplaceResponse>({
    url: '/skills/marketplace',
    method: 'GET',
    params: {
      ...params,
      featured: params?.featured ? 'true' : undefined,
    },
  })
}

export function fetchSkillMarketplaceItem(id: string) {
  return request<SkillDetailResponse>({
    url: `/skills/marketplace/${encodeURIComponent(id)}`,
    method: 'GET',
  })
}

export function fetchUserSkills() {
  return request<{ listings: SkillMarketplaceListing[]; total: number }>({
    url: '/skills/user',
    method: 'GET',
  })
}

export function matchSkills(payload: { text: string; style?: string; category?: string; userSkillIds?: string[] }) {
  return request<SkillMatchResponse>({
    url: '/skills/match',
    method: 'POST',
    data: payload,
  })
}

export function planSkills(payload: {
  topic: string
  style?: string
  videoStyle?: string
  duration?: number
  userSkillIds?: string[]
}) {
  return request<{ plan: AgentPlan; bundle: string | null }>({
    url: '/skills/plan',
    method: 'POST',
    data: payload,
    timeout: 60000,
  })
}

export function validateSkillContent(payload: { content: string; format?: 'yaml' | 'json' }) {
  return request<SkillValidateResponse>({
    url: '/skills/validate',
    method: 'POST',
    data: payload,
  })
}

export function uploadSkill(payload: {
  content: string
  format?: 'yaml' | 'json'
  marketplace?: {
    public?: boolean
    summary?: string
    tags?: string[]
    author?: string
    category?: string
  }
}) {
  return request<SkillDefinition>({
    url: '/skills/upload',
    method: 'POST',
    data: payload,
  })
}

export interface SkillPackageInstallResponse {
  packageDir: string
  installed: SkillDefinition[]
  installedIds: string[]
  skipped: string[]
  errors: Array<{ path: string; message: string }>
  total: number
}

export async function uploadSkillPackage(payload: {
  archive?: File
  files?: File[]
  author?: string
  summary?: string
}) {
  const form = new FormData()
  if (payload.author) form.append('author', payload.author)
  if (payload.summary) form.append('summary', payload.summary)

  if (payload.archive) {
    form.append('archive', payload.archive)
  } else if (payload.files?.length) {
    for (const file of payload.files) {
      const rel =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      form.append('files', file, rel)
    }
  } else {
    throw new Error('请选择 ZIP 压缩包或 Skill 文件夹')
  }

  const response = await http.post<ApiResponse<SkillPackageInstallResponse>>(
    '/skills/upload-package',
    form,
    { timeout: 120000 },
  )
  return response.data.data
}

export function deleteSkill(id: string) {
  return request<{ deleted: boolean }>({
    url: `/skills/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}

export const SELECTED_SKILLS_KEY = 'xueai:selectedSkillIds'

export function loadSelectedSkillIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SELECTED_SKILLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveSelectedSkillIds(ids: string[]) {
  sessionStorage.setItem(SELECTED_SKILLS_KEY, JSON.stringify([...new Set(ids)]))
}

export function toggleSelectedSkillId(id: string): string[] {
  const current = loadSelectedSkillIds()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  saveSelectedSkillIds(next)
  return next
}
