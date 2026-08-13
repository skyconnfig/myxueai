import { z } from 'zod'

export const aiProductionSettingsPatchSchema = z.object({
  llmApiKey: z.string().optional(),
  llmBaseUrl: z.string().optional(),
  llmModel: z.string().optional(),
  imageApiKey: z.string().optional(),
  imageBaseUrl: z.string().optional(),
  imageModel: z.string().optional(),
  ttsApiKey: z.string().optional(),
  ttsBaseUrl: z.string().optional(),
  ttsModel: z.string().optional(),
  ttsVoice: z.string().optional(),
  elevenLabsApiKey: z.string().optional(),
  elevenLabsVoiceId: z.string().optional(),
  bgmDefaultUrl: z.string().optional(),
})

export type AiProductionSettingsPatch = z.infer<typeof aiProductionSettingsPatchSchema>

export type AiProductionSettingsStored = Required<{
  [K in keyof AiProductionSettingsPatch]: string
}>

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
