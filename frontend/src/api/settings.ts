import { request } from './http'

export interface SecretFieldPublic {
  configured: boolean
  masked: string
}

export interface AiProductionSettingsPublic {
  llm: {
    baseUrl: string
    model: string
    apiKey: SecretFieldPublic
    configured: boolean
  }
  image: {
    baseUrl: string
    model: string
    apiKey: SecretFieldPublic
    configured: boolean
  }
  tts: {
    baseUrl: string
    model: string
    voice: string
    apiKey: SecretFieldPublic
    configured: boolean
  }
  elevenLabs: {
    voiceId: string
    apiKey: SecretFieldPublic
    configured: boolean
  }
  bgm: {
    defaultUrl: string
    configured: boolean
  }
  source: 'env' | 'runtime'
  updatedAt: string | null
}

export interface AiProductionSettingsPatch {
  llmApiKey?: string
  llmBaseUrl?: string
  llmModel?: string
  imageApiKey?: string
  imageBaseUrl?: string
  imageModel?: string
  ttsApiKey?: string
  ttsBaseUrl?: string
  ttsModel?: string
  ttsVoice?: string
  elevenLabsApiKey?: string
  elevenLabsVoiceId?: string
  bgmDefaultUrl?: string
}

export function fetchAiProductionSettings() {
  return request<AiProductionSettingsPublic>({
    url: '/workspace/settings/ai',
    method: 'GET',
  })
}

export function updateAiProductionSettings(payload: AiProductionSettingsPatch) {
  return request<AiProductionSettingsPublic>({
    url: '/workspace/settings/ai',
    method: 'PATCH',
    data: payload,
  })
}

export type RemotionBrowserStatus =
  | 'unknown'
  | 'checking'
  | 'installing'
  | 'ready'
  | 'missing'
  | 'failed'

export interface RemotionSettingsPublic {
  width: number
  height: number
  fps: number
  crf: number
  concurrency: number
  chromiumHeadless: boolean
  browser: {
    status: RemotionBrowserStatus
    message: string
    lastCheckedAt: string | null
  }
  renderScriptReady: boolean
  remotionPackageReady: boolean
  updatedAt: string | null
}

export interface RemotionSettingsPatch {
  width?: number
  height?: number
  fps?: number
  crf?: number
  concurrency?: number
  chromiumHeadless?: boolean
}

export function fetchRemotionSettings() {
  return request<RemotionSettingsPublic>({
    url: '/workspace/settings/remotion',
    method: 'GET',
  })
}

export function updateRemotionSettings(payload: RemotionSettingsPatch) {
  return request<RemotionSettingsPublic>({
    url: '/workspace/settings/remotion',
    method: 'PATCH',
    data: payload,
  })
}

export function refreshRemotionBrowser() {
  return request<RemotionSettingsPublic>({
    url: '/workspace/settings/remotion/refresh',
    method: 'POST',
  })
}

export function ensureRemotionBrowser() {
  return request<RemotionSettingsPublic>({
    url: '/workspace/settings/remotion/ensure-browser',
    method: 'POST',
    timeout: 120000,
  })
}
