import { request } from './http'
import type { GenerateScriptPayload, GenerateScriptResult, OptimizeScriptPayload, OptimizeScriptResult } from '@/types'

export function generateScript(payload: GenerateScriptPayload) {
  return request<GenerateScriptResult>({
    url: '/ai/script',
    method: 'POST',
    data: payload,
    timeout: 120000,
  })
}

export function optimizeScript(payload: OptimizeScriptPayload) {
  return request<OptimizeScriptResult>({
    url: '/ai/optimize',
    method: 'POST',
    data: payload,
    timeout: 120000,
  })
}
