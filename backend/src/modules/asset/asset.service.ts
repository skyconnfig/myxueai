import fs from 'node:fs'
import path from 'node:path'
import type { AssetDto } from '@xueai/shared'
import { buildSceneImagePrompt, resolveVoiceSettings, shouldRegenerateSceneImage } from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'
import { storagePaths } from '../../config/storage.js'
import { openAiImageProvider } from '../ai/providers/openai-image.provider.js'
import { elevenLabsProvider } from '../ai/providers/elevenlabs.provider.js'
import { gatewayTtsProvider } from '../ai/providers/gateway-tts.provider.js'
import { logger } from '../../utils/logger.js'
import { AssetType } from '../../constants/status.js'
import { prisma } from '../../config/database.js'
import { projectRepository } from '../project/project.repository.js'
import { sceneRepository } from '../scene/scene.repository.js'
import { assetRepository } from './asset.repository.js'
import { estimateBufferMp3DurationSeconds, estimateMp3DurationSeconds } from '../../utils/audio-duration.js'
import { deleteStorageFileByUrl } from '../../utils/storage-files.js'

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

function writePlaceholderSvg(filePath: string, title: string, subtitle: string, index: number) {
  const safeTitle = title.slice(0, 40).replace(/[<>&]/g, '')
  const safeSubtitle = subtitle.slice(0, 56).replace(/[<>&]/g, '')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#111827"/>
      <stop offset="100%" style="stop-color:#2563EB"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#g)"/>
  <text x="540" y="860" fill="#94A3B8" font-size="32" font-family="Arial,sans-serif" text-anchor="middle">Scene ${index}</text>
  <text x="540" y="930" fill="#ffffff" font-size="44" font-family="Arial,sans-serif" text-anchor="middle">${safeTitle}</text>
  <text x="540" y="1020" fill="#CBD5E1" font-size="26" font-family="Arial,sans-serif" text-anchor="middle">${safeSubtitle}</text>
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
    let projectId = filters.projectId
    if (projectId === 'library') {
      projectId = await this.getOrCreateLibraryProject(filters.userId)
    }
    const assets = await assetRepository.findMany({ ...filters, projectId })
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

    await this.detachSceneReferences(asset)

    const fileDeleted = deleteStorageFileByUrl(asset.url)
    await assetRepository.delete(id)

    return { id, fileDeleted, url: asset.url }
  }

  private async detachSceneReferences(asset: {
    id: string
    sceneId: string | null
    url: string
    type: string
  }) {
    if (!asset.sceneId) return

    const scene = await sceneRepository.findById(asset.sceneId)
    if (!scene) return

    if (asset.type === AssetType.IMAGE && scene.imageUrl === asset.url) {
      await sceneRepository.update(asset.sceneId, { imageUrl: '' })
    }
    if (asset.type === AssetType.VIDEO && scene.videoUrl === asset.url) {
      await prisma.scene.update({ where: { id: asset.sceneId }, data: { videoUrl: null } })
    }
  }

  async generateImagesForProject(
    projectId: string,
    onProgress?: (progress: number) => void,
    options?: { force?: boolean; sceneId?: string },
  ) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const imageAssets = await assetRepository.findMany({ projectId, type: AssetType.IMAGE })
    let scenes = project.scenes
    if (options?.sceneId) {
      scenes = scenes.filter((scene) => scene.id === options.sceneId)
      if (scenes.length === 0) throw new AppError(404, 'SCENE_NOT_FOUND', '分镜不存在')
    }

    const useOpenAi = openAiImageProvider.isConfigured()

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const existingImage = imageAssets.find((asset) => asset.sceneId === scene.id)

      if (
        !shouldRegenerateSceneImage({
          imageUrl: scene.imageUrl,
          imageSource: (scene.imageSource as 'ai' | 'manual' | null) ?? null,
          provider: existingImage?.provider,
          force: options?.force,
        })
      ) {
        onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
        continue
      }

      if (existingImage) {
        await assetRepository.delete(existingImage.id)
      }

      const directorBrief = project.directorBrief as { negative_global?: string; video_style?: string } | null
      const prompt = buildSceneImagePrompt({
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        voiceText: scene.voiceText,
        projectPrompt: project.prompt,
        style: project.style,
        videoStyle: project.videoStyle ?? directorBrief?.video_style,
        ratio: project.ratio,
        shotType: scene.shotType,
        cameraMotion: scene.cameraMotion,
        lighting: scene.lighting,
        emotion: scene.emotion,
        action: scene.action,
        negativePrompt: scene.negativePrompt,
        negativeGlobal: directorBrief?.negative_global,
        sceneType: scene.sceneType,
      })

      let dest: string
      let url: string
      let provider: string
      let metadata: Record<string, unknown> = {
        visualPrompt: scene.visualPrompt,
        voiceText: scene.voiceText,
        description: scene.description,
      }

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
          writePlaceholderSvg(
            dest,
            scene.title ?? `分镜 ${scene.order}`,
            scene.visualPrompt ?? scene.description,
            scene.order,
          )
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = 'placeholder'
        }
      } else {
        const filename = `scene-${projectId}-${scene.order}.svg`
        dest = path.join(storagePaths.images, filename)
        writePlaceholderSvg(
          dest,
          scene.title ?? `分镜 ${scene.order}`,
          scene.visualPrompt ?? scene.description,
          scene.order,
        )
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
      await sceneRepository.update(scene.id, {
        imageUrl: url,
        ...(provider === 'openai' ? { imageSource: 'ai' as const } : {}),
      })
      onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
    }
  }

  async generateVoiceForProject(
    projectId: string,
    onProgress?: (progress: number) => void,
    options?: { force?: boolean; sceneId?: string },
  ) {
    const force = options?.force ?? false
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    let scenes = project.scenes
    if (options?.sceneId) {
      const target = scenes.find((s) => s.id === options.sceneId)
      if (!target) throw new AppError(404, 'SCENE_NOT_FOUND', '分镜不存在')
      scenes = [target]
    }
    const useElevenLabs = elevenLabsProvider.isConfigured()
    const useGatewayTts = gatewayTtsProvider.isConfigured()

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const audioAssets = await assetRepository.findMany({ projectId, type: AssetType.AUDIO })
      const voiceSuffix = `voice-${projectId}-${scene.order}.`
      const existingAudio = audioAssets.find(
        (asset) =>
          asset.sceneId === scene.id ||
          (asset.type === AssetType.AUDIO && asset.url.includes(voiceSuffix)),
      )

      if (existingAudio && existingAudio.provider !== 'placeholder' && !force) {
        if (!existingAudio.sceneId) {
          await assetRepository.update(existingAudio.id, { sceneId: scene.id })
        }
        onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
        continue
      }

      if (existingAudio) {
        await assetRepository.delete(existingAudio.id)
      }

      const voiceText = scene.voiceText?.trim() || scene.description
      const voiceSettings = resolveVoiceSettings(scene.voiceId, scene.voiceEmotion)
      let dest: string
      let url: string
      let provider: string
      let metadata: Record<string, unknown> = {
        voiceText,
        voicePresetId: voiceSettings.preset.id,
        voiceEmotionId: voiceSettings.emotion.id,
      }
      let audioDuration = scene.duration
      let voiceMeta = voiceSettings.minimaxVoiceId

      if (voiceText && (useElevenLabs || useGatewayTts)) {
        try {
          const generated = useElevenLabs
            ? await elevenLabsProvider.generate(voiceText, scene.duration)
            : await gatewayTtsProvider.generate(voiceText, {
                durationHintSec: scene.duration,
                voiceId: voiceSettings.minimaxVoiceId,
                speed: voiceSettings.speed,
                pitch: voiceSettings.pitch,
              })
          const filename = `voice-${projectId}-${scene.order}${generated.ext}`
          dest = path.join(storagePaths.audio, filename)
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, generated.buffer)
          url = publicUrl(path.relative(storagePaths.root, dest))
          provider = generated.provider
          voiceMeta = generated.voiceId
          audioDuration = estimateBufferMp3DurationSeconds(generated.buffer)
          metadata = {
            ...metadata,
            voiceId: generated.voiceId,
            model: generated.model,
          }
        } catch (error) {
          const label = useElevenLabs ? 'ElevenLabs' : 'Gateway TTS'
          logger(`${label} fallback for scene ${scene.order}: ${error instanceof Error ? error.message : error}`)
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

      if (provider !== 'placeholder' && fs.existsSync(dest)) {
        audioDuration = estimateMp3DurationSeconds(dest)
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
        voice: voiceMeta,
        language: 'zh-CN',
      })
      if (provider !== 'placeholder' && audioDuration !== scene.duration) {
        await sceneRepository.update(scene.id, { duration: audioDuration })
      }
      onProgress?.(Math.round(((i + 1) / scenes.length) * 100))
    }
  }
}

export const assetService = new AssetService()
