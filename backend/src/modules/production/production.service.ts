import { AppError } from '../../middleware/error-handler.js'
import { config } from '../../config/index.js'
import { ProjectStatus, TaskStatus, TaskType } from '../../constants/status.js'
import { wsHub } from '../../ws/ws.server.js'
import { assetService } from '../asset/asset.service.js'
import { composeService } from '../compose/compose.service.js'
import { projectRepository } from '../project/project.repository.js'
import { projectService } from '../project/project.service.js'
import { renderService } from '../render/render.service.js'
import { taskRepository } from '../task/task.repository.js'
import { creditsService } from '../workspace/credits.service.js'

const PIPELINE: Array<{ type: string; key: string; label: string }> = [
  { type: TaskType.SCRIPT, key: 'script', label: 'AI 脚本' },
  { type: TaskType.IMAGE, key: 'image', label: '素材生成' },
  { type: TaskType.VOICE, key: 'voice', label: '配音合成' },
  { type: TaskType.VIDEO, key: 'compose', label: '视频合成' },
  { type: TaskType.RENDER, key: 'render', label: '渲染导出' },
]

const TASK_LABELS: Record<string, string> = {
  SCRIPT: 'VideoPlan JSON 解析与脚本生成',
  IMAGE: 'AI 画面素材批量生成',
  VOICE: 'TTS 配音与情感合成',
  VIDEO: '多轨时间轴自动剪辑',
  RENDER: '4K 流水线渲染导出',
}

const runningPipelines = new Set<string>()
const cancelledProjects = new Set<string>()

class PipelineCancelledError extends Error {
  constructor() {
    super('PIPELINE_CANCELLED')
    this.name = 'PipelineCancelledError'
  }
}

function assertNotCancelled(projectId: string) {
  if (cancelledProjects.has(projectId)) {
    throw new PipelineCancelledError()
  }
}

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 8)
}

export class ProductionService {
  private async ensurePipelineTasks(projectId: string, hasScenes: boolean) {
    const existing = await taskRepository.findByProjectId(projectId)
    const byType = new Map(existing.map((t) => [t.type, t]))

    for (const step of PIPELINE) {
      if (!byType.has(step.type)) {
        const isScriptDone = step.type === TaskType.SCRIPT && hasScenes
        await taskRepository.create({
          projectId,
          type: step.type,
          status: isScriptDone ? TaskStatus.SUCCESS : TaskStatus.WAITING,
          progress: isScriptDone ? 100 : 0,
        })
      }
    }

    return taskRepository.findByProjectId(projectId)
  }

  private buildSteps(tasks: Awaited<ReturnType<typeof taskRepository.findByProjectId>>) {
    return PIPELINE.map((step) => {
      const task = tasks.find((t) => t.type === step.type)
      if (!task) {
        return { key: step.key, label: step.label, status: 'waiting' as const, progress: 0, time: '' }
      }
      let status: 'success' | 'running' | 'waiting' | 'failed' = 'waiting'
      if (task.status === TaskStatus.SUCCESS) status = 'success'
      else if (task.status === TaskStatus.RUNNING) status = 'running'
      else if (task.status === TaskStatus.FAILED) status = 'failed'
      return {
        key: step.key,
        label: step.label,
        status,
        progress: task.progress,
        time: task.status !== TaskStatus.WAITING ? formatTime(task.updatedAt) : '',
      }
    })
  }

  private buildLogs(tasks: Awaited<ReturnType<typeof taskRepository.findByProjectId>>) {
    const logs: Array<{ time: string; message: string }> = []
    for (const task of [...tasks].reverse()) {
      const label = TASK_LABELS[task.type] ?? task.type
      if (task.status === TaskStatus.SUCCESS) {
        logs.push({ time: formatTime(task.updatedAt), message: `${label} 完成 ✓` })
      } else if (task.status === TaskStatus.RUNNING) {
        logs.push({ time: formatTime(task.updatedAt), message: `${label} 进行中... ${task.progress}%` })
      } else if (task.status === TaskStatus.FAILED) {
        logs.push({ time: formatTime(task.updatedAt), message: `${label} 失败：${task.error ?? '未知错误'}` })
      }
    }
    if (!logs.length) {
      logs.push({ time: formatTime(new Date()), message: '等待启动生产流水线...' })
    }
    return logs
  }

  private overallProgress(steps: ReturnType<ProductionService['buildSteps']>) {
    const total = steps.reduce((sum, s) => sum + (s.status === 'success' ? 100 : s.progress), 0)
    return Math.round(total / steps.length)
  }

  private async emitStatus(projectId: string) {
    const status = await this.getStatus(projectId, false)
    wsHub.broadcastProductionUpdate(projectId, status)
    return status
  }

  private async runTask(
    projectId: string,
    type: string,
    runner: (onProgress: (p: number) => Promise<void>) => Promise<void>,
  ) {
    const tasks = await taskRepository.findByProjectId(projectId)
    const task = tasks.find((t) => t.type === type)
    if (!task) return

    await taskRepository.update(task.id, { status: TaskStatus.RUNNING, progress: 5, error: null })
    await this.emitStatus(projectId)

    try {
      await runner(async (progress) => {
        await taskRepository.update(task.id, { progress })
        await this.emitStatus(projectId)
      })
      await taskRepository.update(task.id, {
        status: TaskStatus.SUCCESS,
        progress: 100,
        result: { completedAt: new Date().toISOString() },
      })
    } catch (error) {
      if (error instanceof PipelineCancelledError) {
        await taskRepository.update(task.id, { status: TaskStatus.FAILED, error: '用户已停止' })
        return
      }
      const message = error instanceof Error ? error.message : '任务失败'
      await taskRepository.update(task.id, { status: TaskStatus.FAILED, error: message })
      await projectRepository.update(projectId, { status: ProjectStatus.FAILED })
      throw error
    }
  }

  async cancelProject(projectId: string) {
    cancelledProjects.add(projectId)
    runningPipelines.delete(projectId)

    const tasks = await taskRepository.findByProjectId(projectId)
    for (const task of tasks) {
      if (task.status === TaskStatus.RUNNING || task.status === TaskStatus.WAITING) {
        await taskRepository.update(task.id, {
          status: TaskStatus.FAILED,
          error: '用户已停止',
        })
      }
    }

    const project = await projectRepository.findById(projectId)
    if (
      project &&
      (project.status === ProjectStatus.GENERATING || project.status === ProjectStatus.RENDERING)
    ) {
      await projectRepository.update(projectId, { status: ProjectStatus.PLANNING })
    }

    await this.emitStatus(projectId)
    cancelledProjects.delete(projectId)
  }

  isPipelineRunning(projectId: string) {
    return runningPipelines.has(projectId)
  }

  async runPipeline(projectId: string) {
    if (runningPipelines.has(projectId)) return
    runningPipelines.add(projectId)

    try {
      assertNotCancelled(projectId)
      await this.runTask(projectId, TaskType.IMAGE, async (onProgress) => {
        await assetService.generateImagesForProject(projectId, (p) => void onProgress(p))
      })

      assertNotCancelled(projectId)
      await this.runTask(projectId, TaskType.VOICE, async (onProgress) => {
        await assetService.generateVoiceForProject(projectId, (p) => void onProgress(p))
      })

      assertNotCancelled(projectId)
      await this.runTask(projectId, TaskType.VIDEO, async (onProgress) => {
        await composeService.composeForProject(projectId, (p) => void onProgress(p))
      })

      assertNotCancelled(projectId)
      await this.runTask(projectId, TaskType.RENDER, async (onProgress) => {
        await renderService.startRender(projectId, (p) => void onProgress(p))
      })

      if (cancelledProjects.has(projectId)) return

      await projectRepository.update(projectId, { status: ProjectStatus.COMPLETED })
      await this.emitStatus(projectId)
    } catch (error) {
      if (error instanceof PipelineCancelledError) return
      throw error
    } finally {
      runningPipelines.delete(projectId)
    }
  }

  async getStatus(projectId: string, _tick = true) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')

    const tasks = await this.ensurePipelineTasks(projectId, project.scenes.length > 0)
    const steps = this.buildSteps(tasks)
    const overallProgress = this.overallProgress(steps)
    const isComplete = steps.every((s) => s.status === 'success')
    const activeStep = steps.find((s) => s.status === 'running')?.key
      ?? steps.find((s) => s.status === 'waiting')?.key
      ?? 'render'

    return {
      projectId,
      projectName: project.name,
      projectStatus: isComplete ? ProjectStatus.COMPLETED : project.status,
      overallProgress: isComplete ? 100 : overallProgress,
      isComplete,
      isProcessing: steps.some((s) => s.status === 'running') || runningPipelines.has(projectId),
      activeStep,
      steps,
      logs: this.buildLogs(tasks),
      credits: await creditsService.getBalance(),
      videoUrl: project.videoUrl,
    }
  }

  async regenerateVoice(projectId: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '请先生成 AI 分镜后再配音')
    }

    await assetService.generateVoiceForProject(projectId, undefined, { force: true })
    return projectService.getProject(projectId)
  }

  async start(projectId: string, userId?: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '请先生成 AI 分镜后再开始渲染')
    }

    const cost = config.workspace.productionCost
    const deduction = await creditsService.deduct(cost, 'production_pipeline', userId)

    await projectRepository.update(projectId, { status: ProjectStatus.GENERATING })

    let tasks = await this.ensurePipelineTasks(projectId, true)
    const scriptTask = tasks.find((t) => t.type === TaskType.SCRIPT)
    if (scriptTask && scriptTask.status !== TaskStatus.SUCCESS) {
      await taskRepository.update(scriptTask.id, { status: TaskStatus.SUCCESS, progress: 100 })
    }

    void this.runPipeline(projectId)

    const status = await this.getStatus(projectId, false)
    return { ...status, creditsDeducted: deduction.deducted, creditsBalance: deduction.balance }
  }
}

export const productionService = new ProductionService()
