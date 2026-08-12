import 'dotenv/config'

export interface AiProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  timeoutMs: number
  maxRetries: number
  provider: 'deepseek' | 'openai' | 'openrouter' | 'generic'
}

function pick(primary: string | undefined, fallback: string | undefined): string {
  return (primary ?? fallback ?? '').trim()
}

function pickWithDefault(
  primary: string | undefined,
  fallback: string | undefined,
  defaultValue: string,
): string {
  return pick(primary, fallback) || defaultValue
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, '')
}

function inferProvider(baseUrl: string, _model: string): AiProviderConfig['provider'] {
  const lower = baseUrl.toLowerCase()
  if (lower.includes('deepseek')) return 'deepseek'
  if (lower.includes('openai')) return 'openai'
  if (lower.includes('openrouter')) return 'openrouter'
  return 'generic'
}

export const aiConfig = {
  llm: {
    apiKey: pick(process.env.OPENAI_API_KEY, process.env.LLM_API_KEY),
    baseUrl: normalizeBaseUrl(
      pickWithDefault(
        process.env.OPENAI_BASE_URL,
        process.env.LLM_BASE_URL,
        'https://api.deepseek.com',
      ),
    ),
    model: pickWithDefault(
      process.env.OPENAI_MODEL,
      process.env.LLM_MODEL,
      'deepseek-v4-flash',
    ),
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 120000),
    maxRetries: Number(process.env.LLM_MAX_RETRIES ?? 2),
    get provider() {
      return inferProvider(this.baseUrl, this.model)
    },
  } satisfies AiProviderConfig,

  image: {
    apiKey: pick(process.env.OPENAI_IMAGE_API_KEY, process.env.OPENAI_API_KEY),
    baseUrl: normalizeBaseUrl(
      pickWithDefault(
        process.env.OPENAI_IMAGE_BASE_URL,
        process.env.OPENAI_BASE_URL,
        'https://api.openai.com',
      ),
    ),
    model: pickWithDefault(process.env.OPENAI_IMAGE_MODEL, process.env.OPENAI_IMAGE_MODEL, 'dall-e-3'),
  },

  logging: {
    enabled: process.env.AI_LOG_ENABLED !== 'false',
    excludeKeys: ['apiKey', 'Authorization', 'authorization', 'Bearer', 'bearer'],
  },
}

export function isLlmConfigured(): boolean {
  return Boolean(aiConfig.llm.apiKey)
}

export function safeConfigForLogging(): Record<string, unknown> {
  return {
    llm: {
      provider: aiConfig.llm.provider,
      model: aiConfig.llm.model,
      baseUrl: aiConfig.llm.baseUrl,
      configured: isLlmConfigured(),
    },
    image: {
      model: aiConfig.image.model,
      baseUrl: aiConfig.image.baseUrl,
      configured: Boolean(aiConfig.image.apiKey),
    },
  }
}
