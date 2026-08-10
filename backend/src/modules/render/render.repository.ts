import { prisma } from '../../config/database.js'

export class RenderRepository {
  create(data: {
    projectId: string
    composition: string
    width: number
    height: number
    fps?: number
  }) {
    return prisma.render.create({
      data: {
        projectId: data.projectId,
        composition: data.composition,
        width: data.width,
        height: data.height,
        fps: data.fps ?? 30,
        status: 'WAITING',
      },
    })
  }

  findById(id: string) {
    return prisma.render.findUnique({ where: { id } })
  }

  findByProjectId(projectId: string) {
    return prisma.render.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  update(id: string, data: {
    status?: string
    outputUrl?: string | null
    progress?: number
    error?: string | null
  }) {
    return prisma.render.update({ where: { id }, data })
  }
}

export const renderRepository = new RenderRepository()
