import { ZodError, ZodSchema, z } from 'zod'
import { AIProviderError } from './ai-errors.js'

export function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new AIProviderError('INVALID_JSON', 'Failed to parse LLM JSON response', { statusCode: 502 })
    }
    return JSON.parse(match[0]) as Record<string, unknown>
  }
}

export function extractJson(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    const inner = fenceMatch[1].trim()
    if (inner.startsWith('{') || inner.startsWith('[')) return inner
  }

  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) return jsonMatch[1]

  throw new AIProviderError('INVALID_JSON', 'No JSON object or array found in response', { statusCode: 502 })
}

export function validateWithZod<T>(schema: ZodSchema<T>, data: unknown, context?: string): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data

  const issues = result.error?.issues?.map((issue) => issue.message).join('; ') ?? 'unknown'
  throw new AIProviderError(
    'INVALID_JSON',
    `${context ?? 'LLM response'} failed schema validation: ${issues}`,
    { statusCode: 502 },
  )
}

export function zodErrorToString(error: ZodError): string {
  return error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
}

export function buildJsonSystemPrompt(example?: unknown): string {
  const base = 'Return valid JSON only. No markdown, no explanation, no code fences.'
  if (example) {
    return `${base}\nExample shape:\n${JSON.stringify(example, null, 2)}`
  }
  return base
}

export { z, ZodSchema }
