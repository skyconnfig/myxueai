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
      duration: number
      imageUrl?: string | null
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
            duration: scene.duration,
            imageUrl: scene.imageUrl,
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
      duration?: number
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
            ...(scene.duration !== undefined ? { duration: scene.duration } : {}),
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
