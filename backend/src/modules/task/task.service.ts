import { AppError } from '../../middleware/error-handler.js'
import { creditsService } from '../workspace/credits.service.js'
import { taskRepository } from './task.repository.js'

function toTaskDto(task: NonNullable<Awaited<ReturnType<typeof taskRepository.findById>>>) {
  return {
    id: task.id,
    projectId: task.projectId,
    projectName: task.project.name,
    projectThumbnail: task.project.thumbnail,
    type: task.type,
    status: task.status,
    progress: task.progress,
    error: task.error,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}

export class TaskService {
  async listTasks(query: { status?: string; limit?: number }) {
    const tasks = await taskRepository.findAll(query)
    return tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId,
      projectName: task.project.name,
      projectThumbnail: task.project.thumbnail,
      type: task.type,
      status: task.status,
      progress: task.progress,
      error: task.error,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))
  }

  async getTask(id: string) {
    const task = await taskRepository.findById(id)
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task not found')
    return toTaskDto(task)
  }

  async getSummary() {
    const [groups, recent, credits] = await Promise.all([
      taskRepository.countByStatus(),
      taskRepository.findAll({ limit: 8 }),
      creditsService.getBalance(),
    ])

    const counts = Object.fromEntries(groups.map((g) => [g.status, g._count.id]))
    const running = (counts.RUNNING ?? 0) + (counts.WAITING ?? 0)
    const queued = counts.WAITING ?? 0
    const activeRunning = counts.RUNNING ?? 0

    return {
      credits,
      creditsLabel: 'AI 点数',
      runningCount: activeRunning,
      queueCount: queued,
      totalActive: running,
      statusCounts: counts,
      recentTasks: recent.map((task) => ({
        id: task.id,
        projectId: task.projectId,
        projectName: task.project.name,
        type: task.type,
        status: task.status,
        progress: task.progress,
        updatedAt: task.updatedAt.toISOString(),
      })),
    }
  }
}

export const taskService = new TaskService()
