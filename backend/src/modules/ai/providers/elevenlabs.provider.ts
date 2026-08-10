import { config } from '../../../config/index.js'
import { AppError } from '../../../middleware/error-handler.js'

interface VoiceGenerationResult {
  buffer: Buffer
  ext: '.mp3'
  provider: 'elevenlabs'
  voiceId: string
  model: string
  durationEstimate?: number
}

export class ElevenLabsProvider {
  isConfigured() {
    return Boolean(config.elevenLabs.apiKey)
  }

  async generate(text: string, durationHintSec?: number): Promise<VoiceGenerationResult> {
    if (!config.elevenLabs.apiKey) {
      throw new AppError(503, 'ELEVENLABS_NOT_CONFIGURED', '未配置 ELEVENLABS_API_KEY，无法生成配音')
    }

    const trimmed = text.trim()
    if (!trimmed) {
      throw new AppError(400, 'EMPTY_VOICE_TEXT', '配音文本为空')
    }

    const voiceId = config.elevenLabs.voiceId
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenLabs.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: trimmed.slice(0, 5000),
          model_id: config.elevenLabs.model,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      },
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new AppError(502, 'ELEVENLABS_FAILED', `ElevenLabs 配音失败: ${errText.slice(0, 200)}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 128) {
      throw new AppError(502, 'ELEVENLABS_EMPTY', 'ElevenLabs 返回音频为空')
    }

    return {
      buffer,
      ext: '.mp3',
      provider: 'elevenlabs',
      voiceId,
      model: config.elevenLabs.model,
      durationEstimate: durationHintSec,
    }
  }
}

export const elevenLabsProvider = new ElevenLabsProvider()
