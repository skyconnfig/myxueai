import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/database.js'
import type { CreateProjectInput } from './project.types.js'

export class ProjectRepository {
  findAll(userId?: string) {
    return prisma.project.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        _count: { select: { scenes: true } },
      },
    })
  }

  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        scripts: { orderBy: { version: 'desc' }, take: 1 },
        assets: { include: { audioMeta: true } },
      },
    })
  }

  create(data: CreateProjectInput & { userId?: string; name: string }) {
    return prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        prompt: data.prompt,
        ratio: data.ratio,
        duration: data.duration ?? 30,
        style: data.style,
        audience: data.audience,
        goal: data.goal,
        videoStyle: data.videoStyle,
        emotion: data.emotion,
        status: 'DRAFT',
      },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        scripts: true,
      },
    })
  }

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        scenes: { orderBy: { order: 'asc' } },
        scripts: { orderBy: { version: 'desc' }, take: 1 },
      },
    })
  }

  delete(id: string) {
    return prisma.project.delete({ where: { id } })
  }

  replaceScenes(
    projectId: string,
    scenes: Array<{
      title?: string | null
      description: string
      visualPrompt?: string | null
      voiceText?: string | null
      voiceId?: string | null
      voiceEmotion?: string | null
      duration: number
      imageUrl?: string | null
      storyBeat?: string | null
      shotType?: string | null
      cameraMotion?: string | null
      lighting?: string | null
      emotion?: string | null
      action?: string | null
      negativePrompt?: string | null
      transition?: string | null
      sceneType?: string | null
      bgmIntensity?: string | null
      purpose?: string | null
      componentType?: string | null
      viewerTask?: string | null
      inputDesc?: string | null
      processDesc?: string | null
      resultDesc?: string | null
      motionDescription?: string | null
      soundEffect?: string | null
      assetRequirement?: unknown
      assetSource?: string | null
      cues?: unknown
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.scene.deleteMany({ where: { projectId } })
      if (scenes.length > 0) {
        await tx.scene.createMany({
          data: scenes.map((scene, index) => ({
            projectId,
            order: index + 1,
            title: scene.title,
            description: scene.description,
            visualPrompt: scene.visualPrompt,
            voiceText: scene.voiceText,
            voiceId: scene.voiceId ?? 'lyrical',
            voiceEmotion: scene.voiceEmotion ?? 'professional',
            duration: scene.duration,
            imageUrl: scene.imageUrl,
            storyBeat: scene.storyBeat,
            shotType: scene.shotType,
            cameraMotion: scene.cameraMotion,
            lighting: scene.lighting,
            emotion: scene.emotion,
            action: scene.action,
            negativePrompt: scene.negativePrompt,
            transition: scene.transition ?? (index === 0 ? 'cut' : 'crossfade'),
            sceneType: scene.sceneType ?? 'live_action',
            bgmIntensity: scene.bgmIntensity,
            purpose: scene.purpose,
            componentType: scene.componentType,
            viewerTask: scene.viewerTask,
            inputDesc: scene.inputDesc,
            processDesc: scene.processDesc,
            resultDesc: scene.resultDesc,
            motionDescription: scene.motionDescription,
            soundEffect: scene.soundEffect,
            assetRequirement: scene.assetRequirement as Prisma.InputJsonValue | undefined,
            assetSource: scene.assetSource,
            cues: scene.cues as Prisma.InputJsonValue | undefined,
          })),
        })
      }
      return tx.project.findUnique({
        where: { id: projectId },
        include: {
          scenes: { orderBy: { order: 'asc' } },
          scripts: { orderBy: { version: 'desc' }, take: 1 },
        },
      })
    })
  }

  saveScript(projectId: string, content: unknown, version: number) {
    return prisma.videoScript.create({
      data: { projectId, content: content as Prisma.InputJsonValue, version },
    })
  }

  updateScenesInPlace(
    projectId: string,
    updates: Array<{
      id: string
      title?: string | null
      description?: string
      visualPrompt?: string | null
      voiceText?: string | null
      voiceId?: string | null
      voiceEmotion?: string | null
      duration?: number
      imageUrl?: string | null
      imageSource?: string | null
      storyBeat?: string | null
      shotType?: string | null
      cameraMotion?: string | null
      lighting?: string | null
      emotion?: string | null
      action?: string | null
      negativePrompt?: string | null
      transition?: string | null
      sceneType?: string | null
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      for (const scene of updates) {
        await tx.scene.update({
          where: { id: scene.id },
          data: {
            ...(scene.title !== undefined ? { title: scene.title } : {}),
            ...(scene.description !== undefined ? { description: scene.description } : {}),
            ...(scene.visualPrompt !== undefined ? { visualPrompt: scene.visualPrompt } : {}),
            ...(scene.voiceText !== undefined ? { voiceText: scene.voiceText } : {}),
            ...(scene.imageUrl !== undefined ? { imageUrl: scene.imageUrl || null } : {}),
            ...(scene.imageSource !== undefined ? { imageSource: scene.imageSource } : {}),
            ...(scene.voiceId !== undefined ? { voiceId: scene.voiceId } : {}),
            ...(scene.voiceEmotion !== undefined ? { voiceEmotion: scene.voiceEmotion } : {}),
            ...(scene.duration !== undefined ? { duration: scene.duration } : {}),
            ...(scene.storyBeat !== undefined ? { storyBeat: scene.storyBeat } : {}),
            ...(scene.shotType !== undefined ? { shotType: scene.shotType } : {}),
            ...(scene.cameraMotion !== undefined ? { cameraMotion: scene.cameraMotion } : {}),
            ...(scene.lighting !== undefined ? { lighting: scene.lighting } : {}),
            ...(scene.emotion !== undefined ? { emotion: scene.emotion } : {}),
            ...(scene.action !== undefined ? { action: scene.action } : {}),
            ...(scene.negativePrompt !== undefined ? { negativePrompt: scene.negativePrompt } : {}),
            ...(scene.transition !== undefined ? { transition: scene.transition } : {}),
            ...(scene.sceneType !== undefined ? { sceneType: scene.sceneType } : {}),
          },
        })
      }

      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { scenes: { orderBy: { order: 'asc' } } },
      })
      if (project) {
        const duration = project.scenes.reduce((sum, item) => sum + item.duration, 0)
        await tx.project.update({ where: { id: projectId }, data: { duration } })
      }

      return tx.project.findUnique({
        where: { id: projectId },
        include: {
          scenes: { orderBy: { order: 'asc' } },
          scripts: { orderBy: { version: 'desc' }, take: 1 },
        },
      })
    })
  }
}

export const projectRepository = new ProjectRepository()
