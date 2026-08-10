import { config } from '../../../config/index.js'
import { AppError } from '../../../middleware/error-handler.js'

const SIZE_BY_RATIO: Record<string, string> = {
  '9:16': '1024x1792',
  '16:9': '1792x1024',
  '1:1': '1024x1024',
}

interface ImageGenerationResult {
  buffer: Buffer
  ext: '.png' | '.webp' | '.jpg'
  provider: 'openai'
  model: string
}

function decodeB64(raw: string): Buffer {
  const cleaned = raw.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(cleaned, 'base64')
}

function extFromMime(mime?: string): '.png' | '.webp' | '.jpg' {
  if (mime?.includes('webp')) return '.webp'
  if (mime?.includes('jpeg') || mime?.includes('jpg')) return '.jpg'
  return '.png'
}

export class OpenAiImageProvider {
  isConfigured() {
    return Boolean(config.image.apiKey)
  }

  async generate(prompt: string, ratio = '9:16'): Promise<ImageGenerationResult> {
    if (!config.image.apiKey) {
      throw new AppError(503, 'OPENAI_NOT_CONFIGURED', '未配置 OPENAI_API_KEY，无法生成图片')
    }

    const size = SIZE_BY_RATIO[ratio] ?? SIZE_BY_RATIO['9:16']
    const body: Record<string, unknown> = {
      model: config.image.model,
      prompt: prompt.slice(0, 4000),
      size,
      n: 1,
    }

    // Some gateways (e.g. gpt-image-1) reject response_format
    if (!config.image.model.startsWith('gpt-image')) {
      body.response_format = 'b64_json'
    }

    const response = await fetch(`${config.image.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.image.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new AppError(502, 'OPENAI_IMAGE_FAILED', `OpenAI 图片生成失败: ${errText.slice(0, 200)}`)
    }

    const data = (await response.json()) as {
      data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>
    }
    const item = data.data?.[0]
    if (!item) {
      throw new AppError(502, 'OPENAI_IMAGE_EMPTY', 'OpenAI 未返回图片数据')
    }

    if (item.b64_json) {
      const isDataUri = item.b64_json.startsWith('data:')
      const mime = isDataUri ? item.b64_json.match(/^data:(image\/\w+);/)?.[1] : undefined
      return {
        buffer: decodeB64(item.b64_json),
        ext: extFromMime(mime),
        provider: 'openai',
        model: config.image.model,
      }
    }

    if (item.url) {
      const imgRes = await fetch(item.url)
      if (!imgRes.ok) {
        throw new AppError(502, 'OPENAI_IMAGE_DOWNLOAD_FAILED', '图片 URL 下载失败')
      }
      const mime = imgRes.headers.get('content-type') ?? undefined
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      return {
        buffer,
        ext: extFromMime(mime),
        provider: 'openai',
        model: config.image.model,
      }
    }

    throw new AppError(502, 'OPENAI_IMAGE_EMPTY', 'OpenAI 未返回图片数据')
  }
}

export const openAiImageProvider = new OpenAiImageProvider()
