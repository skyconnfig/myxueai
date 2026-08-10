import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../../../config/index.js'
import { AppError } from '../../../middleware/error-handler.js'

export class TwelveLabsProvider {
  get isConfigured() {
    return Boolean(config.twelvelabs.apiKey)
  }

  private headers() {
    return {
      'x-api-key': config.twelvelabs.apiKey,
      'Content-Type': 'application/json',
    }
  }

  async ensureIndex(name = 'xueai-video-factory') {
    if (config.twelvelabs.indexId) return config.twelvelabs.indexId

    const response = await fetch(`${config.twelvelabs.baseUrl}/indexes`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        index_name: name,
        models: [{ model_name: 'marengo2.7', model_options: ['visual', 'audio'] }],
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new AppError(502, 'TWELVELABS_INDEX_FAILED', text.slice(0, 200))
    }
    const data = (await response.json()) as { _id?: string }
    return data._id ?? ''
  }

  async uploadVideo(indexId: string, filePath: string) {
    const form = new FormData()
    const fileBuffer = fs.readFileSync(filePath)
    form.append('video_file', new Blob([fileBuffer]), path.basename(filePath))
    form.append('index_id', indexId)

    const response = await fetch(`${config.twelvelabs.baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'x-api-key': config.twelvelabs.apiKey },
      body: form,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new AppError(502, 'TWELVELABS_UPLOAD_FAILED', text.slice(0, 200))
    }
    return (await response.json()) as { _id?: string; video_id?: string }
  }

  async waitForTask(taskId: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${config.twelvelabs.baseUrl}/tasks/${taskId}`, {
        headers: { 'x-api-key': config.twelvelabs.apiKey },
      })
      const data = (await response.json()) as { status?: string; video_id?: string }
      if (data.status === 'ready') return data
      if (data.status === 'failed') throw new AppError(502, 'TWELVELABS_TASK_FAILED', 'Indexing failed')
      await new Promise((r) => setTimeout(r, 2000))
    }
    throw new AppError(504, 'TWELVELABS_TIMEOUT', 'TwelveLabs indexing timeout')
  }

  async analyze(indexId: string, videoId: string, prompt: string) {
    const response = await fetch(`${config.twelvelabs.baseUrl}/generate`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        video_id: videoId,
        index_id: indexId,
        prompt,
        temperature: 0.2,
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new AppError(502, 'TWELVELABS_ANALYZE_FAILED', text.slice(0, 200))
    }
    return (await response.json()) as { data?: string; id?: string }
  }
}

export function hashFile(filePath: string) {
  const buf = fs.readFileSync(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

export const twelveLabsProvider = new TwelveLabsProvider()
