import { request } from './http'
import type { GenerateScriptPayload, GenerateScriptResult } from '@/types'

export function generateScript(payload: GenerateScriptPayload) {
  return request<GenerateScriptResult>({
    url: '/ai/script',
    method: 'POST',
    data: payload,
    timeout: 120000,
  })
}
