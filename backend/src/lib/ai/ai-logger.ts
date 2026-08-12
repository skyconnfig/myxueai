import { logger } from '../../utils/logger.js'
import { aiConfig } from './ai-config.js'

export interface AiCallLogEntry {
  provider: string
  model: string
  baseUrl: string
  requestId?: string
  durationMs: number
  inputTokens?: number
  outputTokens?: number
  success: boolean
  error?: string
  errorCode?: string
}

export function logAiCall(entry: AiCallLogEntry): void {
  if (!aiConfig.logging.enabled) return

  logger('AI_CALL', {
    provider: entry.provider,
    model: entry.model,
    baseUrl: entry.baseUrl,
    requestId: entry.requestId,
    durationMs: entry.durationMs,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
    success: entry.success,
    error: entry.error,
    errorCode: entry.errorCode,
  })
}

export function sanitizeForLogging(body: string): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    return JSON.stringify(redact(parsed))
  } catch {
    return redactString(body)
  }
}

function redactString(input: string): string {
  return input
    .replace(/Authorization:\s*Bearer\s+[\w-]+/gi, 'Authorization: Bearer ***')
    .replace(/"Authorization"\s*:\s*"[^"]+"/gi, '"Authorization": "***"')
    .replace(/api[_-]?key\s*[:=]\s*[\w-]+/gi, 'api_key=***')
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      if (aiConfig.logging.excludeKeys.some((k) => key.toLowerCase() === k.toLowerCase())) {
        result[key] = '***'
      } else {
        result[key] = redact(val)
      }
    }
    return result
  }
  return value
}
