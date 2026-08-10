import { prisma } from '../../config/database.js'
import { TaskStatus } from '../../constants/status.js'

export class TaskRepository {
  findAll(filters?: { status?: string; limit?: number }) {
    return prisma.videoTask.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { updatedAt: 'desc' },
      take: filters?.limit ?? 50,
      include: {
        project: { select: { id: true, name: true, thumbnail: true } },
      },
    })
  }

  findById(id: string) {
    return prisma.videoTask.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, thumbnail: true, status: true } },
      },
    })
  }

  create(data: {
    projectId: string
    type: string
    status?: string
    progress?: number
    result?: unknown
  }) {
    return prisma.videoTask.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        status: data.status ?? TaskStatus.WAITING,
        progress: data.progress ?? 0,
        ...(data.result ? { result: data.result as object } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    })
  }

  findByProjectId(projectId: string) {
    return prisma.videoTask.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    })
  }

  update(id: string, data: { status?: string; progress?: number; error?: string | null; result?: unknown }) {
    return prisma.videoTask.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.result !== undefined ? { result: data.result as object } : {}),
      },
    })
  }

  countByStatus() {
    return prisma.videoTask.groupBy({
      by: ['status'],
      _count: { id: true },
    })
  }

  delete(id: string) {
    return prisma.videoTask.delete({ where: { id } })
  }
}

export const taskRepository = new TaskRepository()
