import { aiConfig, isLlmConfigured } from './ai-config.js'
import {
  AIProviderError,
  classifyHttpError,
  isRetryableError,
} from './ai-errors.js'
import { logAiCall } from './ai-logger.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  responseFormat?: { type: 'json_object' | 'text' }
  maxTokens?: number
  timeoutMs?: number
  maxRetries?: number
}

export interface ChatCompletionResult {
  content: string
  model: string
  requestId?: string
  inputTokens?: number
  outputTokens?: number
}

interface OpenAICompatibleResponse {
  id?: string
  model?: string
  choices?: Array<{
    message?: {
      content?: string
    }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class UnifiedAiClient {
  private baseUrl = aiConfig.llm.baseUrl
  private defaultModel = aiConfig.llm.model
  private apiKey = aiConfig.llm.apiKey
  private defaultTimeoutMs = aiConfig.llm.timeoutMs
  private defaultMaxRetries = aiConfig.llm.maxRetries

  get configured(): boolean {
    return isLlmConfigured()
  }

  get activeModel(): string {
    return this.defaultModel
  }

  get activeBaseUrl(): string {
    return this.baseUrl
  }

  get activeProvider(): string {
    return aiConfig.llm.provider
  }

  assertConfigured(): void {
    if (!this.configured) {
      throw new AIProviderError(
        'NOT_CONFIGURED',
        'LLM API key not configured. Set OPENAI_API_KEY or LLM_API_KEY.',
        { statusCode: 503 },
      )
    }
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    this.assertConfigured()

    const model = options.model ?? this.defaultModel
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs
    const maxRetries = options.maxRetries ?? this.defaultMaxRetries
    const body = this.buildRequestBody(model, options)

    let lastError: AIProviderError | undefined
    const startTime = Date.now()

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeRequest(body, timeoutMs)
        logAiCall({
          provider: aiConfig.llm.provider,
          model: result.model,
          baseUrl: this.baseUrl,
          requestId: result.requestId,
          durationMs: Date.now() - startTime,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          success: true,
        })
        return result
      } catch (error) {
        const aiError = error instanceof AIProviderError ? error : new AIProviderError(
          'PROVIDER_ERROR',
          error instanceof Error ? error.message : String(error),
          { cause: error },
        )
        lastError = aiError

        const retryable = isRetryableError(aiError.code, aiError.statusCode)
        if (retryable && attempt < maxRetries) {
          const backoff = Math.min(1000 * 2 ** attempt, 8000)
          await sleep(backoff)
          continue
        }
        break
      }
    }

    const finalError = lastError ?? new AIProviderError('PROVIDER_ERROR', 'Unknown AI provider error')
    logAiCall({
      provider: aiConfig.llm.provider,
      model,
      baseUrl: this.baseUrl,
      durationMs: Date.now() - startTime,
      success: false,
      error: finalError.message,
      errorCode: finalError.code,
    })
    throw finalError
  }

  async chatCompletionJson<T>(
    options: ChatCompletionOptions,
    schema: { safeParse: (data: unknown) => { success: boolean; error?: { issues?: Array<{ message: string }> }; data?: T } },
  ): Promise<T> {
    const jsonOptions: ChatCompletionOptions = {
      ...options,
      responseFormat: { type: 'json_object' },
      messages: [
        ...options.messages,
        {
          role: 'system',
          content: 'Return valid JSON only. No markdown, no explanation, no code fences.',
        },
      ],
    }

    const result = await this.chatCompletion(jsonOptions)
    const content = result.content.trim()
    if (!content) {
      throw new AIProviderError('INVALID_JSON', 'LLM returned empty content', { statusCode: 502 })
    }

    let parsed: unknown
    try {
      const cleaned = this.extractJson(content)
      parsed = JSON.parse(cleaned)
    } catch (error) {
      throw new AIProviderError(
        'INVALID_JSON',
        `Failed to parse LLM JSON response: ${error instanceof Error ? error.message : String(error)}`,
        { responseBody: content, statusCode: 502 },
      )
    }

    const validation = schema.safeParse(parsed)
    if (!validation.success) {
      const issues = validation.error?.issues?.map((i) => i.message).join('; ') ?? 'unknown'
      throw new AIProviderError(
        'INVALID_JSON',
        `LLM response failed schema validation: ${issues}`,
        { responseBody: JSON.stringify(parsed), statusCode: 502 },
      )
    }
    return validation.data as T
  }

  private buildRequestBody(model: string, options: ChatCompletionOptions): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    }
    if (options.maxTokens) body.max_tokens = options.maxTokens
    if (options.responseFormat) body.response_format = options.responseFormat
    return body
  }

  private async executeRequest(body: Record<string, unknown>, timeoutMs: number): Promise<ChatCompletionResult> {
    const url = `${this.baseUrl}/chat/completions`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const responseText = await response.text()
      let payload: OpenAICompatibleResponse
      try {
        payload = JSON.parse(responseText) as OpenAICompatibleResponse
      } catch {
        throw new AIProviderError(
          'PROVIDER_ERROR',
          `Non-JSON response (${response.status}): ${responseText.slice(0, 200)}`,
          { statusCode: response.status, responseBody: responseText },
        )
      }

      if (payload.error) {
        const code = classifyHttpError(response.status, payload.error.message ?? '')
        throw new AIProviderError(
          code,
          payload.error.message ?? 'AI provider error',
          { statusCode: response.status, responseBody: responseText },
        )
      }

      if (!response.ok) {
        const code = classifyHttpError(response.status, responseText)
        throw new AIProviderError(
          code,
          `LLM request failed (${response.status}): ${responseText.slice(0, 200)}`,
          { statusCode: response.status, responseBody: responseText },
        )
      }

      const content = payload.choices?.[0]?.message?.content
      if (!content) {
        throw new AIProviderError('INVALID_JSON', 'LLM returned empty content', { statusCode: 502 })
      }

      return {
        content,
        model: payload.model ?? body.model as string,
        requestId: payload.id,
        inputTokens: payload.usage?.prompt_tokens,
        outputTokens: payload.usage?.completion_tokens,
      }
    } catch (error) {
      clearTimeout(timeout)
      if (error instanceof AIProviderError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIProviderError('TIMEOUT', `LLM request timed out after ${timeoutMs}ms`, { statusCode: 504 })
      }
      throw new AIProviderError(
        'PROVIDER_ERROR',
        error instanceof Error ? error.message : String(error),
        { cause: error },
      )
    }
  }

  private extractJson(raw: string): string {
    const trimmed = raw.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed

    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (fenceMatch) {
      const inner = fenceMatch[1].trim()
      if (inner.startsWith('{') || inner.startsWith('[')) return inner
    }

    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (jsonMatch) return jsonMatch[1]

    throw new Error('No JSON object or array found in response')
  }
}

export const unifiedAiClient = new UnifiedAiClient()
