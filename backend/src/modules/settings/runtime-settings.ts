import fs from 'node:fs'
import path from 'node:path'
import { aiConfig } from '../../lib/ai/ai-config.js'
import { config } from '../../config/index.js'
import { storagePaths } from '../../config/storage.js'
import { logger } from '../../utils/logger.js'
import type {
  AiProductionSettingsPatch,
  AiProductionSettingsPublic,
  AiProductionSettingsStored,
  SecretFieldPublic,
} from './settings.types.js'

const SETTINGS_FILE = path.join(storagePaths.root, 'settings', 'ai-production.json')

let stored: Partial<AiProductionSettingsStored> = {}
let updatedAt: string | null = null

function ensureSettingsDir() {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(10, value.length - 8))}${value.slice(-4)}`
}

function secretField(value: string): SecretFieldPublic {
  return { configured: Boolean(value), masked: maskSecret(value) }
}

function setEnv(key: string, value: string) {
  if (value) process.env[key] = value
}

function applyToRuntime(values: Partial<AiProductionSettingsStored>) {
  if (values.llmApiKey) {
    aiConfig.llm.apiKey = values.llmApiKey
    setEnv('OPENAI_API_KEY', values.llmApiKey)
    setEnv('LLM_API_KEY', values.llmApiKey)
  }
  if (values.llmBaseUrl) {
    aiConfig.llm.baseUrl = values.llmBaseUrl.replace(/\/+$/, '')
    setEnv('OPENAI_BASE_URL', values.llmBaseUrl)
    setEnv('LLM_BASE_URL', values.llmBaseUrl)
  }
  if (values.llmModel) {
    aiConfig.llm.model = values.llmModel
    setEnv('OPENAI_MODEL', values.llmModel)
    setEnv('LLM_MODEL', values.llmModel)
  }

  if (values.imageApiKey) {
    aiConfig.image.apiKey = values.imageApiKey
    setEnv('OPENAI_IMAGE_API_KEY', values.imageApiKey)
  }
  if (values.imageBaseUrl) {
    aiConfig.image.baseUrl = values.imageBaseUrl.replace(/\/+$/, '')
    setEnv('OPENAI_IMAGE_BASE_URL', values.imageBaseUrl)
  }
  if (values.imageModel) {
    aiConfig.image.model = values.imageModel
    setEnv('OPENAI_IMAGE_MODEL', values.imageModel)
  }

  if (values.ttsApiKey !== undefined) {
    config.tts.apiKey = values.ttsApiKey
    setEnv('TTS_API_KEY', values.ttsApiKey)
  }
  if (values.ttsBaseUrl) {
    config.tts.baseUrl = values.ttsBaseUrl.replace(/\/+$/, '')
    setEnv('TTS_BASE_URL', values.ttsBaseUrl)
  }
  if (values.ttsModel) {
    config.tts.model = values.ttsModel
    setEnv('TTS_MODEL', values.ttsModel)
  }
  if (values.ttsVoice) {
    config.tts.voice = values.ttsVoice
    setEnv('TTS_VOICE', values.ttsVoice)
  }

  if (values.elevenLabsApiKey !== undefined) {
    config.elevenLabs.apiKey = values.elevenLabsApiKey
    setEnv('ELEVENLABS_API_KEY', values.elevenLabsApiKey)
  }
  if (values.elevenLabsVoiceId) {
    config.elevenLabs.voiceId = values.elevenLabsVoiceId
    setEnv('ELEVENLABS_VOICE_ID', values.elevenLabsVoiceId)
  }

  if (values.bgmDefaultUrl) {
    config.bgm.defaultUrl = values.bgmDefaultUrl
    setEnv('BGM_DEFAULT_URL', values.bgmDefaultUrl)
  }
}

function readFileStore(): { values: Partial<AiProductionSettingsStored>; updatedAt: string | null } {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { values: {}, updatedAt: null }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as {
      values?: Partial<AiProductionSettingsStored>
      updatedAt?: string
    }
    return { values: raw.values ?? {}, updatedAt: raw.updatedAt ?? null }
  } catch {
    return { values: {}, updatedAt: null }
  }
}

function writeFileStore(values: Partial<AiProductionSettingsStored>) {
  ensureSettingsDir()
  updatedAt = new Date().toISOString()
  fs.writeFileSync(
    SETTINGS_FILE,
    JSON.stringify({ values, updatedAt }, null, 2),
    'utf8',
  )
}

export function loadRuntimeAiSettings() {
  const file = readFileStore()
  stored = file.values
  updatedAt = file.updatedAt
  if (Object.keys(stored).length > 0) {
    applyToRuntime(stored)
    logger('Applied AI production settings from runtime store')
  }
}

export function getAiProductionSettingsPublic(): AiProductionSettingsPublic {
  const hasFile = Object.keys(stored).length > 0
  return {
    llm: {
      baseUrl: aiConfig.llm.baseUrl,
      model: aiConfig.llm.model,
      apiKey: secretField(aiConfig.llm.apiKey),
      configured: Boolean(aiConfig.llm.apiKey),
    },
    image: {
      baseUrl: aiConfig.image.baseUrl,
      model: aiConfig.image.model,
      apiKey: secretField(aiConfig.image.apiKey),
      configured: Boolean(aiConfig.image.apiKey),
    },
    tts: {
      baseUrl: config.tts.baseUrl,
      model: config.tts.model,
      voice: config.tts.voice,
      apiKey: secretField(config.tts.apiKey),
      configured: Boolean(config.tts.apiKey),
    },
    elevenLabs: {
      voiceId: config.elevenLabs.voiceId,
      apiKey: secretField(config.elevenLabs.apiKey),
      configured: Boolean(config.elevenLabs.apiKey),
    },
    bgm: {
      defaultUrl: config.bgm.defaultUrl,
      configured: Boolean(config.bgm.defaultUrl),
    },
    source: hasFile ? 'runtime' : 'env',
    updatedAt,
  }
}

export function updateAiProductionSettings(patch: AiProductionSettingsPatch): AiProductionSettingsPublic {
  const next: Partial<AiProductionSettingsStored> = { ...stored }

  const mergeSecret = (key: keyof AiProductionSettingsStored, incoming?: string) => {
    if (incoming === undefined) return
    if (incoming.trim() === '') return
    next[key] = incoming.trim()
  }

  mergeSecret('llmApiKey', patch.llmApiKey)
  if (patch.llmBaseUrl !== undefined) next.llmBaseUrl = patch.llmBaseUrl.trim()
  if (patch.llmModel !== undefined) next.llmModel = patch.llmModel.trim()

  mergeSecret('imageApiKey', patch.imageApiKey)
  if (patch.imageBaseUrl !== undefined) next.imageBaseUrl = patch.imageBaseUrl.trim()
  if (patch.imageModel !== undefined) next.imageModel = patch.imageModel.trim()

  mergeSecret('ttsApiKey', patch.ttsApiKey)
  if (patch.ttsBaseUrl !== undefined) next.ttsBaseUrl = patch.ttsBaseUrl.trim()
  if (patch.ttsModel !== undefined) next.ttsModel = patch.ttsModel.trim()
  if (patch.ttsVoice !== undefined) next.ttsVoice = patch.ttsVoice.trim()

  mergeSecret('elevenLabsApiKey', patch.elevenLabsApiKey)
  if (patch.elevenLabsVoiceId !== undefined) next.elevenLabsVoiceId = patch.elevenLabsVoiceId.trim()

  if (patch.bgmDefaultUrl !== undefined) next.bgmDefaultUrl = patch.bgmDefaultUrl.trim()

  stored = next
  writeFileStore(stored)
  applyToRuntime(stored)
  return getAiProductionSettingsPublic()
}
