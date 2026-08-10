import { config } from '../../../config/index.js'
import { AppError } from '../../../middleware/error-handler.js'
import { logger } from '../../../utils/logger.js'

export interface VoiceGenerationResult {
  buffer: Buffer
  ext: '.mp3'
  provider: 'xueai-gateway'
  voiceId: string
  model: string
  durationEstimate?: number
}

interface MinimaxTaskResponse {
  task_id?: number
  status?: string
  file_id?: number
  base_resp?: { status_code?: number; status_msg?: string }
}

interface MinimaxFileResponse {
  file?: {
    download_url?: string
    filename?: string
  }
}

function extractMp3FromArchive(data: Buffer): Buffer {
  const id3 = data.indexOf(Buffer.from('ID3'))
  if (id3 >= 0) return data.subarray(id3)

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] === 0xff && (data[i + 1] & 0xe0) === 0xe0) {
      return data.subarray(i)
    }
  }

  throw new AppError(502, 'TTS_EXTRACT_FAILED', '无法从 TTS 返回包中提取 MP3')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class GatewayTtsProvider {
  isConfigured() {
    return Boolean(config.tts.apiKey)
  }

  isMinimaxModel(model = config.tts.model) {
    return model.startsWith('speech-')
  }

  async generate(text: string, durationHintSec?: number): Promise<VoiceGenerationResult> {
    if (!config.tts.apiKey) {
      throw new AppError(503, 'TTS_NOT_CONFIGURED', '未配置 TTS API Key，无法生成配音')
    }

    const trimmed = text.trim()
    if (!trimmed) {
      throw new AppError(400, 'EMPTY_VOICE_TEXT', '配音文本为空')
    }

    const buffer = this.isMinimaxModel()
      ? await this.generateMinimax(trimmed)
      : await this.generateOpenAiSpeech(trimmed)

    if (buffer.length < 128) {
      throw new AppError(502, 'TTS_EMPTY', 'TTS 返回音频为空')
    }

    return {
      buffer,
      ext: '.mp3',
      provider: 'xueai-gateway',
      voiceId: config.tts.voice,
      model: config.tts.model,
      durationEstimate: durationHintSec,
    }
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${config.tts.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /** OpenAI-compatible sync TTS: tts-1 / gpt-4o-mini-tts */
  private async generateOpenAiSpeech(text: string): Promise<Buffer> {
    const baseUrl = config.tts.baseUrl.replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/audio/speech`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        model: config.tts.model,
        input: text.slice(0, 5000),
        voice: config.tts.openAiVoice,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new AppError(502, 'TTS_FAILED', `TTS 配音失败: ${errText.slice(0, 200)}`)
    }

    return Buffer.from(await response.arrayBuffer())
  }

  /** Minimax async TTS via xueai gateway: speech-2.8-hd 等 */
  private async generateMinimax(text: string): Promise<Buffer> {
    const baseUrl = config.tts.minimaxBaseUrl.replace(/\/$/, '')
    const createRes = await fetch(`${baseUrl}/t2a_async_v2`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        model: config.tts.model,
        text: text.slice(0, 5000),
        language_boost: config.tts.languageBoost,
        voice_setting: {
          voice_id: config.tts.voice,
          speed: config.tts.speed,
          vol: config.tts.volume,
          pitch: config.tts.pitch,
        },
        audio_setting: {
          format: 'mp3',
          sample_rate: 32000,
          bitrate: 128000,
          channel: 1,
        },
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new AppError(502, 'TTS_CREATE_FAILED', `TTS 任务创建失败: ${errText.slice(0, 200)}`)
    }

    const created = (await createRes.json()) as MinimaxTaskResponse
    const taskId = created.task_id
    if (!taskId) {
      throw new AppError(502, 'TTS_NO_TASK', 'TTS 未返回 task_id')
    }

    const fileId = await this.pollMinimaxTask(baseUrl, taskId)
    return this.downloadMinimaxFile(baseUrl, fileId)
  }

  private async pollMinimaxTask(baseUrl: string, taskId: number): Promise<number> {
    const maxAttempts = 45
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(2000)

      const res = await fetch(`${baseUrl}/query/t2a_async_query_v2?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${config.tts.apiKey}` },
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new AppError(502, 'TTS_POLL_FAILED', `TTS 任务查询失败: ${errText.slice(0, 200)}`)
      }

      const payload = (await res.json()) as MinimaxTaskResponse
      const status = payload.status ?? ''

      if (status === 'Success') {
        const fileId = payload.file_id ?? taskId
        return fileId
      }

      if (status === 'Failed' || status === 'Expired') {
        throw new AppError(502, 'TTS_TASK_FAILED', `TTS 任务失败: ${status}`)
      }

      if (attempt % 5 === 0) {
        logger(`TTS task ${taskId} still ${status || 'Processing'}...`)
      }
    }

    throw new AppError(504, 'TTS_TIMEOUT', 'TTS 任务超时，请稍后重试')
  }

  private async downloadMinimaxFile(baseUrl: string, fileId: number): Promise<Buffer> {
    const res = await fetch(`${baseUrl}/files/retrieve?file_id=${fileId}`, {
      headers: { Authorization: `Bearer ${config.tts.apiKey}` },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new AppError(502, 'TTS_FILE_FAILED', `TTS 文件获取失败: ${errText.slice(0, 200)}`)
    }

    const payload = (await res.json()) as MinimaxFileResponse
    const downloadUrl = payload.file?.download_url
    if (!downloadUrl) {
      throw new AppError(502, 'TTS_NO_DOWNLOAD', 'TTS 未返回下载地址')
    }

    const audioRes = await fetch(downloadUrl)
    if (!audioRes.ok) {
      throw new AppError(502, 'TTS_DOWNLOAD_FAILED', 'TTS 音频下载失败')
    }

    const raw = Buffer.from(await audioRes.arrayBuffer())
    return extractMp3FromArchive(raw)
  }
}

export const gatewayTtsProvider = new GatewayTtsProvider()
