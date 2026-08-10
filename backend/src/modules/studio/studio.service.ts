import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'
import { projectRepository } from '../project/project.repository.js'
import { projectService } from '../project/project.service.js'
import { sceneRepository } from '../scene/scene.repository.js'

const TRANSITION_BY_BEAT: Record<string, string> = {
  hook: 'cut',
  pain: 'crossfade',
  problem: 'crossfade',
  solution: 'push',
  demo: 'push',
  result: 'crossfade',
  cta: 'cut',
}

function transitionForScene(order: number, storyBeat?: string | null) {
  if (order === 1) return 'cut'
  if (!storyBeat) return 'crossfade'
  return TRANSITION_BY_BEAT[storyBeat] ?? 'crossfade'
}

export class StudioService {
  async autoEdit(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        assets: { include: { audioMeta: true } },
      },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '没有可剪辑的分镜')
    }

    const patches: Array<{ sceneId: string; order: number; duration?: number; transition?: string }> = []

    for (const scene of project.scenes) {
      const audioAsset = project.assets.find(
        (a) => a.sceneId === scene.id && a.type === 'AUDIO',
      )
      const audioDuration = audioAsset?.audioMeta?.duration
      const nextTransition = transitionForScene(scene.order, scene.storyBeat)
      const patch: (typeof patches)[number] = {
        sceneId: scene.id,
        order: scene.order,
        transition: nextTransition,
      }

      if (audioDuration && audioDuration > 0) {
        const synced = Math.max(1, Math.ceil(audioDuration))
        if (synced !== scene.duration) {
          patch.duration = synced
          await sceneRepository.update(scene.id, { duration: synced })
        }
      }

      if (nextTransition !== scene.transition) {
        await sceneRepository.update(scene.id, { transition: nextTransition })
      }

      patches.push(patch)
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
          style: this.readCaptionStyle(scene.cues),
        },
      })
      cursor += duration
    }

    await projectRepository.update(projectId, { duration: cursor })

    return {
      projectId,
      totalDuration: cursor,
      sceneCount: project.scenes.length,
      patches,
      summary: `已同步 ${patches.filter((p) => p.duration).length} 镜时长，优化 ${patches.length} 处转场`,
    }
  }

  private readCaptionStyle(cues: unknown) {
    const data = cues as { captionStyle?: { color?: string; fontSize?: number } } | null
    if (data?.captionStyle) {
      return {
        font: 'bold',
        color: data.captionStyle.color ?? '#ffffff',
        fontSize: data.captionStyle.fontSize ?? 38,
      }
    }
    return { font: 'bold', color: '#ffffff', fontSize: 38 }
  }

  async updateCaptions(
    projectId: string,
    updates: Array<{
      sceneId: string
      voiceText?: string
      captionStyle?: { color?: string; fontSize?: number }
    }>,
  ) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    for (const item of updates) {
      const scene = project.scenes.find((s) => s.id === item.sceneId)
      if (!scene) continue

      const existingCues = (scene.cues as Record<string, unknown> | null) ?? {}
      const data: Record<string, unknown> = {}

      if (item.voiceText !== undefined) {
        data.voiceText = item.voiceText.trim()
        data.description = item.voiceText.trim()
      }
      if (item.captionStyle) {
        data.cues = {
          ...existingCues,
          captionStyle: {
            ...((existingCues.captionStyle as object) ?? {}),
            ...item.captionStyle,
          },
        }
      }

      if (Object.keys(data).length > 0) {
        await sceneRepository.update(scene.id, data)
      }
    }

    const refreshed = await prisma.project.findUnique({
      where: { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } } },
    })
    if (refreshed) {
      await prisma.caption.deleteMany({ where: { projectId } })
      let cursor = 0
      for (const scene of refreshed.scenes) {
        await prisma.caption.create({
          data: {
            projectId,
            sceneId: scene.id,
            text: scene.voiceText ?? scene.description,
            startTime: cursor,
            endTime: cursor + scene.duration,
            style: this.readCaptionStyle(scene.cues),
          },
        })
        cursor += scene.duration
      }
    }

    return projectService.getProject(projectId)
  }
}

export const studioService = new StudioService()
