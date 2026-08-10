import { AppError } from '../../middleware/error-handler.js'
import { TaskStatus } from '../../constants/status.js'
import { productionService } from '../production/production.service.js'
import { projectRepository } from '../project/project.repository.js'
import { creditsService } from '../workspace/credits.service.js'
import { taskRepository } from './task.repository.js'
import type { CreateTaskInput } from './task.types.js'

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
      taskRepository.findAll({ limit: 12 }),
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
        error: task.error,
        updatedAt: task.updatedAt.toISOString(),
      })),
    }
  }

  async stopTask(id: string) {
    const task = await taskRepository.findById(id)
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', '任务不存在')

    if (task.status !== TaskStatus.RUNNING && task.status !== TaskStatus.WAITING) {
      throw new AppError(400, 'TASK_NOT_ACTIVE', '只能停止进行中的任务')
    }

    if (
      task.status === TaskStatus.RUNNING ||
      productionService.isPipelineRunning(task.projectId)
    ) {
      await productionService.cancelProject(task.projectId)
    } else {
      await taskRepository.update(task.id, {
        status: TaskStatus.FAILED,
        error: '用户已停止',
      })
    }

    const updated = await taskRepository.findById(id)
    if (!updated) throw new AppError(404, 'TASK_NOT_FOUND', '任务不存在')
    return toTaskDto(updated)
  }

  async deleteTask(id: string) {
    const task = await taskRepository.findById(id)
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', '任务不存在')

    if (task.status === TaskStatus.RUNNING) {
      throw new AppError(400, 'TASK_RUNNING', '请先停止任务再删除')
    }

    await taskRepository.delete(id)
    return { id, deleted: true }
  }

  async createTask(input: CreateTaskInput) {
    const project = await projectRepository.findById(input.projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '请先生成分镜后再创建生产任务')
    }

    if (input.type === 'PRODUCTION') {
      const status = await productionService.start(input.projectId)
      const tasks = await taskRepository.findByProjectId(input.projectId)
      const active = tasks.find(
        (item) => item.status === TaskStatus.RUNNING || item.status === TaskStatus.WAITING,
      )
      if (active) {
        const full = await taskRepository.findById(active.id)
        return {
          task: full ? toTaskDto(full) : null,
          production: status,
        }
      }
      return { task: null, production: status }
    }

    throw new AppError(400, 'UNSUPPORTED_TASK_TYPE', '不支持的任务类型')
  }
}

export const taskService = new TaskService()
