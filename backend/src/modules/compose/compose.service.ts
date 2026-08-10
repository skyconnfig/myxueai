import fs from 'node:fs'
import path from 'node:path'
import type { RenderInput } from '@xueai/shared'
import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'
import { storagePaths } from '../../config/storage.js'
import { projectRepository } from '../project/project.repository.js'
import { renderInputBuilder } from '../render/render-input.builder.js'
import { sceneRepository } from '../scene/scene.repository.js'

function timelinePath(projectId: string) {
  return path.join(storagePaths.compose, projectId, 'timeline.json')
}

export class ComposeService {
  getComposedInput(projectId: string): RenderInput | null {
    const filePath = timelinePath(projectId)
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as RenderInput
  }

  async composeForProject(projectId: string, onProgress?: (progress: number) => void) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        assets: { include: { audioMeta: true } },
      },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '没有可合成的分镜')
    }

    const total = project.scenes.length
    let processed = 0

    for (const scene of project.scenes) {
      const imageAsset = project.assets.find(
        (asset) => asset.sceneId === scene.id && asset.type === 'IMAGE',
      )
      const audioAsset = project.assets.find(
        (asset) => asset.sceneId === scene.id && asset.type === 'AUDIO',
      )

      const hasImage = Boolean(scene.imageUrl ?? imageAsset?.url)
      const hasAudio = Boolean(audioAsset?.url)

      if (!hasImage) {
        throw new AppError(400, 'MISSING_IMAGE', `分镜 ${scene.order} 缺少画面素材`)
      }
      if (!hasAudio) {
        throw new AppError(400, 'MISSING_AUDIO', `分镜 ${scene.order} 缺少配音`)
      }

      const audioDuration = audioAsset?.audioMeta?.duration
      if (audioDuration && audioDuration > 0) {
        const synced = Math.max(1, Math.ceil(audioDuration))
        if (synced !== scene.duration) {
          await sceneRepository.update(scene.id, { duration: synced })
        }
      }

      processed += 1
      onProgress?.(Math.round((processed / total) * 70))
    }

    await prisma.caption.deleteMany({ where: { projectId } })

    let cursor = 0
    for (const scene of project.scenes) {
      const fresh = await sceneRepository.findById(scene.id)
      const duration = fresh?.duration ?? scene.duration
      await prisma.caption.create({
        data: {
          projectId,
          sceneId: scene.id,
          text: scene.voiceText ?? scene.description,
          startTime: cursor,
          endTime: cursor + duration,
          style: { font: 'bold', color: '#ffffff' },
        },
      })
      cursor += duration
    }

    onProgress?.(85)

    const renderInput = await renderInputBuilder.build(projectId)
    const totalDuration = renderInput.scenes.reduce((sum, item) => sum + item.duration, 0)
    renderInput.duration = totalDuration

    await projectRepository.update(projectId, { duration: totalDuration })

    const dir = path.dirname(timelinePath(projectId))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(timelinePath(projectId), JSON.stringify(renderInput, null, 2), 'utf8')

    onProgress?.(100)

    return {
      sceneCount: total,
      duration: totalDuration,
      captionCount: total,
    }
  }
}

export const composeService = new ComposeService()
