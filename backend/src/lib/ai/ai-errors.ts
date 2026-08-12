export type AIErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'MODEL_ERROR'
  | 'PROVIDER_ERROR'
  | 'NOT_CONFIGURED'

export class AIProviderError extends Error {
  public readonly code: AIErrorCode
  public readonly statusCode: number
  public readonly requestId?: string
  public readonly responseBody?: string

  constructor(
    code: AIErrorCode,
    message: string,
    options?: {
      statusCode?: number
      requestId?: string
      responseBody?: string
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'AIProviderError'
    this.code = code
    this.statusCode = options?.statusCode ?? mapCodeToStatus(code)
    this.requestId = options?.requestId
    this.responseBody = options?.responseBody
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

function mapCodeToStatus(code: AIErrorCode): number {
  switch (code) {
    case 'NOT_CONFIGURED':
      return 503
    case 'AUTH_ERROR':
      return 401
    case 'RATE_LIMIT':
      return 429
    case 'TIMEOUT':
      return 504
    case 'INVALID_JSON':
      return 502
    case 'MODEL_ERROR':
      return 502
    case 'PROVIDER_ERROR':
    default:
      return 502
  }
}

export function classifyHttpError(status: number, body: string): AIErrorCode {
  if (status === 401 || status === 403) return 'AUTH_ERROR'
  if (status === 429) return 'RATE_LIMIT'
  if (status === 408 || status === 504) return 'TIMEOUT'
  if (status === 400 && /model|json|format|parameter/i.test(body)) return 'MODEL_ERROR'
  if (status >= 500) return 'PROVIDER_ERROR'
  return 'PROVIDER_ERROR'
}

export function isRetryableError(code: AIErrorCode, status?: number): boolean {
  if (code === 'RATE_LIMIT') return true
  if (code === 'TIMEOUT') return true
  if (code === 'PROVIDER_ERROR' && status && status >= 500) return true
  if (status && status >= 500) return true
  return false
}
