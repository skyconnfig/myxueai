import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '../..')

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') !== 'production',
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  storagePath: path.resolve(backendRoot, process.env.STORAGE_PATH ?? '../storage'),
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    baseUrl: process.env.LLM_BASE_URL ?? 'https://api.deepseek.com/v1',
    model: process.env.LLM_MODEL ?? 'deepseek-chat',
  },
  workspace: {
    defaultCredits: Number(process.env.WORKSPACE_CREDITS ?? 12560),
    scriptGenerationCost: Number(process.env.SCRIPT_GENERATION_COST ?? 120),
    scriptOptimizationCost: Number(process.env.SCRIPT_OPTIMIZATION_COST ?? 80),
    productionCost: Number(process.env.PRODUCTION_COST ?? 280),
  },
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? '',
  image: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3',
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? '',
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL',
    model: process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
  },
  tts: {
    apiKey: process.env.TTS_API_KEY ?? process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.TTS_BASE_URL ?? process.env.LLM_BASE_URL ?? 'https://api.xueai.me/v1',
    minimaxBaseUrl:
      process.env.TTS_MINIMAX_BASE_URL ??
      process.env.TTS_BASE_URL?.replace(/\/v1\/?$/, '/minimax/v1') ??
      'https://api.xueai.me/minimax/v1',
    model: process.env.TTS_MODEL ?? 'speech-2.8-hd',
    voice: process.env.TTS_VOICE ?? 'Chinese (Mandarin)_Lyrical_Voice',
    openAiVoice: process.env.TTS_OPENAI_VOICE ?? 'alloy',
    languageBoost: process.env.TTS_LANGUAGE_BOOST ?? 'Chinese',
    speed: Number(process.env.TTS_SPEED ?? 1),
    volume: Number(process.env.TTS_VOLUME ?? 1),
    pitch: Number(process.env.TTS_PITCH ?? 0),
  },
  remotion: {
    publicUrl: process.env.REMOTION_PUBLIC_URL ?? 'http://localhost:3000',
    chromiumHeadless: process.env.REMOTION_CHROMIUM_HEADLESS !== 'false',
    concurrency: Number(process.env.REMOTION_CONCURRENCY ?? 1),
    crf: Number(process.env.REMOTION_CRF ?? 18),
  },
  pexels: {
    apiKey: process.env.PEXELS_API_KEY ?? '',
  },
  twelvelabs: {
    apiKey: process.env.TWELVELABS_API_KEY ?? '',
    indexId: process.env.TWELVELABS_INDEX_ID ?? '',
    baseUrl: process.env.TWELVELABS_BASE_URL ?? 'https://api.twelvelabs.io/v1.3',
  },
  bgm: {
    defaultUrl: process.env.BGM_DEFAULT_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'xueai-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  demoUserEmail: process.env.DEMO_USER_EMAIL ?? 'demo@xueai.local',
}

export type AppConfig = typeof config
