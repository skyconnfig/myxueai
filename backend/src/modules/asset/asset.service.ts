import fs from 'node:fs'
import path from 'node:path'
import type { AssetDto } from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'
import { storagePaths } from '../../config/storage.js'
import { openAiImageProvider } from '../ai/providers/openai-image.provider.js'
import { elevenLabsProvider } from '../ai/providers/elevenlabs.provider.js'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import { AssetType } from '../../constants/status.js'
import { projectRepository } from '../project/project.repository.js'
import { sceneRepository } from '../scene/scene.repository.js'
import { assetRepository } from './asset.repository.js'

function toAssetDto(asset: {
  id: string
  projectId: string
  sceneId: string | null
  type: string
  url: string
  provider: string | null
  metadata: unknown
  createdAt: Date
}): AssetDto {
  return {
    id: asset.id,
    projectId: asset.projectId,
    sceneId: asset.sceneId,
    type: asset.type as AssetDto['type'],
    url: asset.url,
    provider: asset.provider,
    metadata: (asset.metadata as Record<string, unknown> | null) ?? null,
    createdAt: asset.createdAt.toISOString(),
  }
}

function publicUrl(relativePath: string) {
  return `/storage/${relativePath.replace(/\\/g, '/')}`
}

function writePlaceholderSvg(filePath: string, title: string, index: number) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#111827"/>
      <stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#g)"/>
  <text x="540" y="900" fill="#ffffff" font-size="48" font-family="Arial,sans-serif" text-anchor="middle">Scene ${index}</text>
  <text x="540" y="980" fill="#94A3B8" font-size="28" font-family="Arial,sans-serif" text-anchor="middle">${title.slice(0, 40).replace(/[<>&]/g, '')}</text>
</svg>`
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, svg, 'utf8')
}

/** Minimal silent WAV (0.5s, 22050Hz mono) */
function writeSilentWav(filePath: string, seconds = 0.5) {
  const sampleRate = 22050
  const numSamples = Math.floor(sampleRate * seconds)
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, buffer)
}

export class AssetService {
  async getOrCreateLibraryProject(userId?: string) {
    const name = '__asset_library__'
    const existing = await projectRepository.findAll(userId)
    const library = existing.find((p) => p.name === name)
    if (library) return library.id

    const created = await projectRepository.create({
      userId,
      name,
      prompt: '素材库',
      ratio: '9:16',
      duration: 30,
    })
    return created.id
  }

  async listAssets(filters: { projectId?: string; type?: string; userId?: string }) {
    const assets = await assetRepository.findMany(filters)
    return assets.map((a) => toAssetDto(a))
  }

  async getAsset(id: string) {
    const asset = await assetRepository.findById(id)
    if (!asset) throw new AppError(404, 'ASSET_NOT_FOUND', '素材不存在')
    return toAssetDto(asset)
  }

  async createFromUpload(
    file: Express.Multer.File,
    data: { projectId?: string; sceneId?: string; type?: string; userId?: string },
  ) {
    let projectId = data.projectId
    if (!projectId || projectId === 'library') {
      projectId = await this.getOrCreateLibraryProject(data.userId)
    }

    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const ext = path.extname(file.originalname) || '.bin'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    const subdir = data.type === AssetType.AUDIO ? 'audio' : data.type === AssetType.VIDEO ? 'uploads' : 'images'
    const dest = path.join(storagePaths[subdir === 'uploads' ? 'uploads' : subdir], filename)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, file.buffer)

    const relative = path.relative(storagePaths.root, dest)
    const asset = await assetRepository.create({
      projectId,
      sceneId: data.sceneId ?? null,
      type: data.type ?? AssetType.IMAGE,
      url: publicUrl(relative),
      provider: 'upload',
      metadata: { originalName: file.originalname, size: file.size },
    })
    return toAssetDto(asset)
  }

  async deleteAsset(id: string) {
    const asset = await assetRepository.findById(id)
    if (!asset) throw new AppError(404, 'ASSET_NOT_FOUND', '素材不存在')
    await assetRepository.delete(id)
  }

  async generateImagesForProject(
    projectId: string,
    onProgress?: (progress: number) => void,
  ) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const scenes = project.scenes
    const useOpenAi = openAiImageProvider.isConfigured()

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      if (scene.imageUrl) {
        onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
        continue
      }

      const prompt =
        scene.visualPrompt?.trim() ||
        `${scene.description}. Cinematic, professional, vertical video frame, no text, no watermark.`

      let dest: string
      let url: string
      let provider: string
      let metadata: Record<string, unknown> = { visualPrompt: scene.visualPrompt }

      if (useOpenAi) {
        try {
          const generated = await openAiImageProvider.generate(prompt, project.ratio)
          const filename = `scene-${projectId}-${scene.order}${generated.ext}`
          dest = path.join(storagePaths.images, filename)
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, generated.buffer)
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = generated.provider
          metadata = { ...metadata, model: generated.model, prompt }
        } catch (error) {
          logger(`OpenAI image fallback for scene ${scene.order}: ${error instanceof Error ? error.message : error}`)
          const filename = `scene-${projectId}-${scene.order}.svg`
          dest = path.join(storagePaths.images, filename)
          writePlaceholderSvg(dest, scene.title ?? scene.description, scene.order)
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = 'placeholder'
        }
      } else {
        const filename = `scene-${projectId}-${scene.order}.svg`
        dest = path.join(storagePaths.images, filename)
        writePlaceholderSvg(dest, scene.title ?? scene.description, scene.order)
        url = publicUrl(path.relative(storagePaths.root, dest))
        provider = 'placeholder'
      }

      await assetRepository.create({
        projectId,
        sceneId: scene.id,
        type: AssetType.IMAGE,
        url,
        provider,
        metadata,
      })
      await sceneRepository.update(scene.id, { imageUrl: url })
      onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
    }
  }

  async generateVoiceForProject(
    projectId: string,
    onProgress?: (progress: number) => void,
  ) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const scenes = project.scenes
    const useElevenLabs = elevenLabsProvider.isConfigured()

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const existingAudio = await assetRepository.findMany({ projectId, type: AssetType.AUDIO })
      if (existingAudio.some((a) => a.sceneId === scene.id)) {
        onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
        continue
      }

      const voiceText = scene.voiceText?.trim() || scene.description
      let dest: string
      let url: string
      let provider: string
      let metadata: Record<string, unknown> = { voiceText }
      let audioDuration = scene.duration

      if (useElevenLabs && voiceText) {
        try {
          const generated = await elevenLabsProvider.generate(voiceText, scene.duration)
          const filename = `voice-${projectId}-${scene.order}${generated.ext}`
          dest = path.join(storagePaths.audio, filename)
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, generated.buffer)
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = generated.provider
          metadata = {
            ...metadata,
            voiceId: generated.voiceId,
            model: generated.model,
          }
        } catch (error) {
          logger(`ElevenLabs fallback for scene ${scene.order}: ${error instanceof Error ? error.message : error}`)
          const filename = `voice-${projectId}-${scene.order}.wav`
          dest = path.join(storagePaths.audio, filename)
          writeSilentWav(dest, scene.duration || 1)
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = 'placeholder'
        }
      } else {
        const filename = `voice-${projectId}-${scene.order}.wav`
        dest = path.join(storagePaths.audio, filename)
        writeSilentWav(dest, scene.duration || 1)
        url = publicUrl(path.relative(storagePaths.root, dest))
        provider = 'placeholder'
      }

      const asset = await assetRepository.create({
        projectId,
        sceneId: scene.id,
        type: AssetType.AUDIO,
        url,
        provider,
        metadata,
      })
      await assetRepository.createAudioMeta(asset.id, {
        duration: audioDuration,
        voice: config.elevenLabs.voiceId,
        language: 'zh-CN',
      })
      onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
    }
  }
}

export const assetService = new AssetService()
