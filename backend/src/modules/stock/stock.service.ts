import { config } from '../../config/index.js'
import { AppError } from '../../middleware/error-handler.js'

export interface StockVideoResult {
  id: number
  url: string
  previewUrl: string
  duration: number
  width: number
  height: number
  photographer: string
  provider: 'pexels'
}

export class StockService {
  isConfigured() {
    return Boolean(config.pexels.apiKey)
  }

  async searchVideos(query: string, options?: { orientation?: 'landscape' | 'portrait'; perPage?: number }) {
    if (!config.pexels.apiKey) {
      throw new AppError(503, 'PEXELS_NOT_CONFIGURED', '请配置 PEXELS_API_KEY 以启用素材搜索（Media Scout）')
    }

    const params = new URLSearchParams({
      query,
      per_page: String(options?.perPage ?? 8),
    })
    if (options?.orientation) params.set('orientation', options.orientation)

    const response = await fetch(`https://api.pexels.com/videos/search?${params}`, {
      headers: { Authorization: config.pexels.apiKey },
    })

    if (!response.ok) {
      throw new AppError(502, 'PEXELS_ERROR', `Pexels API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      videos: Array<{
        id: number
        duration: number
        width: number
        height: number
        user: { name: string }
        video_files: Array<{ link: string; quality: string; width: number; height: number }>
        image: string
      }>
    }

    return data.videos.map((video): StockVideoResult => {
      const best = video.video_files
        .filter((f) => f.quality === 'hd' || f.quality === 'sd')
        .sort((a, b) => b.width - a.width)[0]
      return {
        id: video.id,
        url: best?.link ?? '',
        previewUrl: video.image,
        duration: video.duration,
        width: video.width,
        height: video.height,
        photographer: video.user.name,
        provider: 'pexels',
      }
    }).filter((v) => v.url)
  }

  /** Suggest stock queries from scene metadata (media-scout pattern) */
  suggestQueries(input: { storyBeat?: string; action?: string; visualPrompt?: string; topic?: string }) {
    const base = input.topic ?? 'business office'
    const beat = input.storyBeat ?? ''
    if (beat === 'pain') return [`${base} stressed team office`, 'overworked employee laptop late night']
    if (beat === 'solution') return [`${base} team collaboration software`, 'modern office meeting technology']
    if (beat === 'result') return ['successful business team celebration', 'data dashboard analytics screen']
    if (beat === 'cta') return ['hand clicking subscribe button', 'professional call to action business']
    return [input.action ?? base, `${base} cinematic b-roll`]
  }
}

export const stockService = new StockService()
