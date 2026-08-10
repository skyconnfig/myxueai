import { request } from './http'
import type { GenerateScriptPayload, GenerateScriptResult, OptimizeScriptPayload, OptimizeScriptResult, ChangeStylePayload, ChangeStyleResult } from '@/types'

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

export function changeStyle(payload: ChangeStylePayload) {
  return request<ChangeStyleResult>({
    url: '/ai/change-style',
    method: 'POST',
    data: payload,
    timeout: 120000,
  })
}
