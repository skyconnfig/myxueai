import { request } from './http'
import type { VideoReviewRecord, VideoReviewResultV2 } from '@xueai/shared'

export function reviewProject(projectId: string, options?: { renderId?: string; force?: boolean }) {
  return request<VideoReviewResultV2 & { id: string; createdAt: string }>({
    url: `/projects/${projectId}/review`,
    method: 'POST',
    data: options,
    timeout: 120000,
  })
}

export function fetchLatestReview(projectId: string) {
  return request<VideoReviewRecord | null>({
    url: `/projects/${projectId}/review/latest`,
    method: 'GET',
  })
}

export function applyReviewFix(projectId: string, options?: { reviewId?: string; rerender?: boolean }) {
  return request<{ projectId: string; reviewId: string; patches: unknown[]; needsRerender: boolean }>({
    url: `/projects/${projectId}/review/fix`,
    method: 'POST',
    data: options,
    timeout: 180000,
  })
}

export function rerenderAfterFix(projectId: string) {
  return request<{ projectId: string; status: string }>({
    url: `/projects/${projectId}/review/render`,
    method: 'POST',
    timeout: 180000,
  })
}
