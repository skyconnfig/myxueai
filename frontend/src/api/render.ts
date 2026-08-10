import { request } from './http'

export interface RenderStartResult {
  renderId: string
  status: string
  progress: number
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
  progress: number
  error: string | null
  createdAt: string
  updatedAt: string
}

export async function startRender(projectId: string) {
  return request<RenderStartResult>({
    method: 'POST',
    url: '/render',
    data: { projectId },
  })
}

export async function fetchRender(id: string) {
  return request<RenderStatus>({ method: 'GET', url: `/render/${id}` })
}

export async function fetchProjectRenders(projectId: string) {
  return request<Array<{
    id: string
    projectId: string
    outputUrl: string | null
    status: string
    progress: number
    error: string | null
    createdAt: string
    updatedAt: string
  }>>({
    method: 'GET',
    url: `/render/project/${projectId}`,
  })
}

export function pollRender(
  renderId: string,
  onProgress: (status: RenderStatus) => void,
  intervalMs = 1500,
): { promise: Promise<RenderStatus>; cancel: () => void } {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const cancel = () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }

  const promise = new Promise<RenderStatus>((resolve, reject) => {
    const tick = async () => {
      if (cancelled) return
      try {
        const status = await fetchRender(renderId)
        onProgress(status)
        if (status.status === 'SUCCESS' || status.status === 'FAILED') {
          resolve(status)
          return
        }
        timer = setTimeout(tick, intervalMs)
      } catch (err) {
        reject(err)
      }
    }
    void tick()
  })

  return { promise, cancel }
}
