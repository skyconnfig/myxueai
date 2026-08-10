import { prisma } from '../../config/database.js'
import { TaskStatus, TaskType } from '../../constants/status.js'

export class StatsService {
  async getDashboardStats() {
    const [assetCount, completedProjects] = await Promise.all([
      prisma.asset.count(),
      prisma.project.findMany({
        where: { status: 'COMPLETED' },
        select: { id: true },
      }),
    ])

    const durations: number[] = []

    if (completedProjects.length > 0) {
      const projectIds = completedProjects.map((project) => project.id)
      const tasks = await prisma.videoTask.findMany({
        where: {
          projectId: { in: projectIds },
          type: { in: [TaskType.IMAGE, TaskType.RENDER] },
        },
        orderBy: { createdAt: 'asc' },
      })

      const byProject = new Map<string, typeof tasks>()
      for (const task of tasks) {
        const list = byProject.get(task.projectId) ?? []
        list.push(task)
        byProject.set(task.projectId, list)
      }

      for (const projectTasks of byProject.values()) {
        const imageTask = projectTasks.find((task) => task.type === TaskType.IMAGE)
        const renderTask = projectTasks.find(
          (task) => task.type === TaskType.RENDER && task.status === TaskStatus.SUCCESS,
        )
        if (!imageTask || !renderTask) continue

        const minutes = (renderTask.updatedAt.getTime() - imageTask.createdAt.getTime()) / 60_000
        if (minutes > 0) durations.push(minutes)
      }
    }

    const avgProductionMinutes =
      durations.length > 0
        ? Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10
        : null

    return {
      assetCount,
      avgProductionMinutes,
      completedProjectCount: completedProjects.length,
    }
  }
}

export const statsService = new StatsService()
