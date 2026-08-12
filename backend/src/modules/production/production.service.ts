import { AppError } from '../../middleware/error-handler.js'
import { config } from '../../config/index.js'
import {
  FINAL_PROGRESS,
  PipelineStep,
  PIPELINE_STEPS,
  PIPELINE_STEP_LABELS,
  ProductionJobStatus,
  ProductionStage,
  ProjectStatus,
  STAGE_TO_STEP,
  STEP_BASE_PROGRESS,
  STEP_TO_STAGE,
  type ProductionErrorMeta,
  type ProductionStepRecord,
} from '../../constants/status.js'
import { logger, loggerError } from '../../utils/logger.js'
import { wsHub } from '../../ws/ws.server.js'
import { assetPlannerService } from '../asset-planner/asset-planner.service.js'
import { assetService } from '../asset/asset.service.js'
import { reviewService } from '../review/review.service.js'
import { composeService } from '../compose/compose.service.js'
import { scriptService } from '../ai/script.service.js'
import { projectRepository } from '../project/project.repository.js'
import { projectService } from '../project/project.service.js'
import { renderService } from '../render/render.service.js'
import { productionJobRepository } from './production-job.repository.js'
import { creditsService } from '../workspace/credits.service.js'

type ProductionJob = Awaited<ReturnType<typeof productionJobRepository.findById>>
type StepKey = (typeof PipelineStep)[keyof typeof PipelineStep]

class PipelineCancelledError extends Error {
  constructor() {
    super('PIPELINE_CANCELLED')
    this.name = 'PipelineCancelledError'
  }
}

const fmt = (d: Date) => d.toISOString().slice(11, 19)

function nextBase(step: StepKey): number {
  const idx = PIPELINE_STEPS.indexOf(step)
  if (idx < 0 || idx >= PIPELINE_STEPS.length - 1) return FINAL_PROGRESS
  return STEP_BASE_PROGRESS[PIPELINE_STEPS[idx + 1]] ?? FINAL_PROGRESS
}

function overallProgress(stage: string, stagePct: number): number {
  if (stage === ProductionStage.COMPLETED) return 100
  if (stage === ProductionStage.QUEUED || stage === ProductionStage.CREATED) return 0
  const step = STAGE_TO_STEP[stage] as StepKey | undefined
  if (!step) return 0
  const base = STEP_BASE_PROGRESS[step] ?? 0
  const next = nextBase(step)
  const pct = Math.min(100, Math.max(0, stagePct))
  return Math.min(next, Math.round(base + (pct / 100) * (next - base)))
}

function getRecords(job: NonNullable<ProductionJob>): ProductionStepRecord[] {
  return (job.steps as unknown as ProductionStepRecord[]) ?? []
}

function findRec(records: ProductionStepRecord[], key: string) {
  return records.find((r) => r.key === key)
}

export class ProductionService {
  private runningJobs = new Map<string, AbortController>()
  private cancelledProjects = new Set<string>()

  isPipelineRunning(projectId: string) {
    return this.runningJobs.has(projectId)
  }

  private assertNotCancelled(projectId: string) {
    if (this.cancelledProjects.has(projectId)) throw new PipelineCancelledError()
  }

  private async emitEvent(
    projectId: string,
    type: 'progress' | 'step_started' | 'step_completed' | 'failed' | 'cancelled' | 'completed',
    p: { taskId: string; step: string | null; status: string | null; progress: number; message: string },
  ) {
    wsHub.broadcastProductionEvent(projectId, type, p)
  }

  private async emitStatus(projectId: string) {
    wsHub.broadcastProductionUpdate(projectId, await this.getStatus(projectId))
  }

  private buildStepsView(job: NonNullable<ProductionJob> | null) {
    const records = job ? getRecords(job) : []
    return PIPELINE_STEPS.map((key) => {
      const rec = findRec(records, key)
      return {
        key,
        label: PIPELINE_STEP_LABELS[key] ?? key,
        status: rec?.status ?? 'waiting',
        progress: rec?.progress ?? 0,
        time: rec?.completedAt ? fmt(new Date(rec.completedAt)) : '',
        durationMs: rec?.durationMs ?? null,
        retryCount: rec?.retryCount ?? 0,
      }
    })
  }

  private buildLogs(job: NonNullable<ProductionJob>) {
    const logs: Array<{ time: string; message: string }> = []
    const now = fmt(new Date())
    for (const rec of getRecords(job)) {
      const label = PIPELINE_STEP_LABELS[rec.key] ?? rec.key
      if (rec.status === 'success' && rec.completedAt) {
        const dur = rec.durationMs ? ` (${Math.round(rec.durationMs / 1000)}s)` : ''
        logs.push({ time: fmt(new Date(rec.completedAt)), message: `${label} 完成 ✓${dur}` })
      } else if (rec.status === 'running') {
        logs.push({ time: now, message: `${label} 进行中... ${rec.progress}%` })
      } else if (rec.status === 'failed') {
        logs.push({ time: rec.completedAt ? fmt(new Date(rec.completedAt)) : now, message: `${label} 失败：${rec.error ?? '未知错误'}` })
      }
    }
    if (job.status === ProductionJobStatus.CANCELLED) logs.push({ time: now, message: '用户已取消生产任务' })
    else if (job.status === ProductionJobStatus.COMPLETED) logs.push({ time: now, message: '生产流水线已完成 ✓' })
    else if (!logs.length) logs.push({ time: now, message: '等待启动生产流水线...' })
    return logs
  }

  async getStatus(projectId: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    const job = await productionJobRepository.findLatestByProjectId(projectId)
    const credits = await creditsService.getBalance()

    if (!job) {
      return {
        projectId, projectName: project.name, projectStatus: project.status,
        overallProgress: 0, isComplete: project.status === ProjectStatus.COMPLETED, isProcessing: false,
        activeStep: '', stage: '', jobStatus: '', taskId: null,
        steps: this.buildStepsView(null), elapsedMs: null, etaMs: null,
        error: null, errorMeta: null,
        logs: [{ time: fmt(new Date()), message: '等待启动生产流水线...' }],
        credits, videoUrl: project.videoUrl, renderId: null,
      }
    }

    const isComplete = job.status === ProductionJobStatus.COMPLETED
    const isProcessing = job.status === ProductionJobStatus.RUNNING
    const activeStep = isProcessing ? (STAGE_TO_STEP[job.stage] ?? '') : ''
    const elapsedMs = job.startedAt ? Date.now() - new Date(job.startedAt).getTime() : null
    let etaMs: number | null = null
    if (isProcessing && elapsedMs && job.progress > 0 && job.progress < 100) {
      etaMs = Math.round((elapsedMs / job.progress) * (100 - job.progress))
    }

    return {
      projectId, projectName: project.name,
      projectStatus: isComplete ? ProjectStatus.COMPLETED : project.status,
      overallProgress: isComplete ? 100 : job.progress,
      isComplete, isProcessing, activeStep, stage: job.stage, jobStatus: job.status, taskId: job.id,
      steps: this.buildStepsView(job), elapsedMs, etaMs,
      error: job.error, errorMeta: (job.errorMeta as ProductionErrorMeta | null) ?? null,
      logs: this.buildLogs(job), credits, videoUrl: project.videoUrl, renderId: job.renderId,
    }
  }

  async start(projectId: string, userId?: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    const existing = await productionJobRepository.findActiveByProjectId(projectId)
    if (existing && existing.status === ProductionJobStatus.RUNNING) return this.getStatus(projectId)

    let job: NonNullable<ProductionJob>
    if (existing && (existing.status === ProductionJobStatus.FAILED || existing.status === ProductionJobStatus.CANCELLED)) {
      await this.resetForResume(existing, true)
      job = (await productionJobRepository.findById(existing.id))!
    } else {
      await creditsService.deduct(config.workspace.productionCost, 'production_pipeline', userId)
      job = await productionJobRepository.create({ projectId, userId }) as NonNullable<ProductionJob>
      await projectRepository.update(projectId, { status: ProjectStatus.GENERATING })
    }

    this.runPipeline(job).catch((e) => {
      if (!(e instanceof PipelineCancelledError)) loggerError(`Production pipeline failed for ${projectId}`, e)
    })
    const status = await this.getStatus(projectId)
    return { ...status, creditsBalance: await creditsService.getBalance() }
  }

  async retry(projectId: string, _userId?: string) {
    const existing = await productionJobRepository.findActiveByProjectId(projectId)
    if (!existing || (existing.status !== ProductionJobStatus.FAILED && existing.status !== ProductionJobStatus.CANCELLED)) {
      throw new AppError(400, 'NO_FAILED_JOB', '没有可重试的失败或已取消任务')
    }
    if (this.runningJobs.has(projectId)) throw new AppError(409, 'JOB_RUNNING', '任务正在运行中')
    await this.resetForResume(existing, true)
    const job = (await productionJobRepository.findById(existing.id))!
    await projectRepository.update(projectId, { status: ProjectStatus.GENERATING })
    this.runPipeline(job).catch((e) => {
      if (!(e instanceof PipelineCancelledError)) loggerError(`Production retry failed for ${projectId}`, e)
    })
    return this.getStatus(projectId)
  }

  private async resetForResume(job: NonNullable<ProductionJob>, incrementAttempt: boolean) {
    const records = getRecords(job)
    for (const rec of records) {
      if (rec.status === 'running' || rec.status === 'failed') {
        if (rec.status === 'failed') rec.retryCount += 1
        rec.status = 'waiting'; rec.progress = 0
        rec.startedAt = null; rec.completedAt = null; rec.durationMs = null; rec.error = null
      }
    }
    await productionJobRepository.update(job.id, {
      status: ProductionJobStatus.RUNNING, stage: ProductionStage.QUEUED,
      stageProgress: 0, progress: 0, error: null, errorMeta: null, steps: records,
      attempt: incrementAttempt ? job.attempt + 1 : job.attempt,
      startedAt: new Date(), completedAt: null,
    })
  }

  async cancel(projectId: string) {
    this.cancelledProjects.add(projectId)
    const controller = this.runningJobs.get(projectId)
    if (controller) controller.abort()

    const job = await productionJobRepository.findRunningByProjectId(projectId)
    if (job) {
      const records = getRecords(job)
      for (const rec of records) {
        if (rec.status === 'running' || rec.status === 'waiting') {
          rec.status = 'failed'; rec.error = '用户已取消'
          if (!rec.completedAt) rec.completedAt = new Date().toISOString()
        }
      }
      await productionJobRepository.update(job.id, {
        status: ProductionJobStatus.CANCELLED, stageProgress: 0, steps: records, completedAt: new Date(),
      })
      await this.emitEvent(projectId, 'cancelled', {
        taskId: job.id, step: STAGE_TO_STEP[job.stage] ?? null,
        status: ProductionJobStatus.CANCELLED, progress: job.progress, message: '用户已取消生产任务',
      })
    }

    const project = await projectRepository.findById(projectId)
    if (project && (project.status === ProjectStatus.GENERATING || project.status === ProjectStatus.RENDERING)) {
      await projectRepository.update(projectId, { status: ProjectStatus.PLANNING })
    }
    await this.emitStatus(projectId)
    this.runningJobs.delete(projectId)
    return this.getStatus(projectId)
  }

  private async runStep(
    job: NonNullable<ProductionJob>,
    stepKey: StepKey,
    runner: (onProgress: (p: number) => Promise<void>) => Promise<void>,
  ) {
    this.assertNotCancelled(job.projectId)
    const records = getRecords(job)
    const rec = findRec(records, stepKey)
    if (rec?.status === 'success') return

    const stage = STEP_TO_STAGE[stepKey]
    const nowIso = new Date().toISOString()
    if (rec) { rec.status = 'running'; rec.progress = 5; rec.startedAt = nowIso; rec.completedAt = null; rec.error = null }
    await productionJobRepository.update(job.id, {
      stage, stageProgress: 5, progress: overallProgress(stage, 5), steps: records,
    })
    job.stage = stage; job.stageProgress = 5; job.progress = overallProgress(stage, 5)
    await this.emitEvent(job.projectId, 'step_started', {
      taskId: job.id, step: stepKey, status: stage, progress: job.progress,
      message: `${PIPELINE_STEP_LABELS[stepKey] ?? stepKey} 开始`,
    })
    await this.emitStatus(job.projectId)

    const startedMs = Date.now()
    try {
      await runner(async (progress) => {
        const pct = Math.min(99, Math.max(0, progress))
        if (rec) rec.progress = pct
        await productionJobRepository.update(job.id, {
          stageProgress: pct, progress: overallProgress(stage, pct), steps: records,
        })
        job.stageProgress = pct; job.progress = overallProgress(stage, pct)
        await this.emitEvent(job.projectId, 'progress', {
          taskId: job.id, step: stepKey, status: stage, progress: job.progress,
          message: `${PIPELINE_STEP_LABELS[stepKey] ?? stepKey} ${pct}%`,
        })
        await this.emitStatus(job.projectId)
      })
      this.assertNotCancelled(job.projectId)
      const durationMs = Date.now() - startedMs
      if (rec) { rec.status = 'success'; rec.progress = 100; rec.completedAt = new Date().toISOString(); rec.durationMs = durationMs; rec.error = null }
      const np = nextBase(stepKey)
      await productionJobRepository.update(job.id, { stageProgress: 100, progress: np, steps: records })
      job.stageProgress = 100; job.progress = np
      await this.emitEvent(job.projectId, 'step_completed', {
        taskId: job.id, step: stepKey, status: stage, progress: np,
        message: `${PIPELINE_STEP_LABELS[stepKey] ?? stepKey} 完成 (${Math.round(durationMs / 1000)}s)`,
      })
      await this.emitStatus(job.projectId)
    } catch (error) {
      if (error instanceof PipelineCancelledError) throw error
      const message = error instanceof Error ? error.message : '任务失败'
      const retryable = !(error instanceof AppError) || (error as AppError).statusCode >= 500
      if (rec) { rec.status = 'failed'; rec.error = message; rec.completedAt = new Date().toISOString() }
      const errorMeta: ProductionErrorMeta = {
        code: error instanceof AppError ? error.code : 'PRODUCTION_STEP_FAILED',
        message, step: stepKey, retryable, timestamp: new Date().toISOString(),
      }
      await productionJobRepository.update(job.id, {
        status: ProductionJobStatus.FAILED, error: message, errorMeta, steps: records,
      })
      await projectRepository.update(job.projectId, { status: ProjectStatus.FAILED })
      await this.emitEvent(job.projectId, 'failed', {
        taskId: job.id, step: stepKey, status: ProductionJobStatus.FAILED, progress: job.progress, message,
      })
      await this.emitStatus(job.projectId)
      throw error
    }
  }

  private async markStepSuccess(job: NonNullable<ProductionJob>, stepKey: StepKey) {
    const records = getRecords(job)
    const rec = findRec(records, stepKey)
    if (rec) { rec.status = 'success'; rec.progress = 100; rec.completedAt = new Date().toISOString(); rec.durationMs = 0 }
    await productionJobRepository.update(job.id, { steps: records })
    await this.emitStatus(job.projectId)
  }

  private async runPipeline(job: NonNullable<ProductionJob>) {
    if (this.runningJobs.has(job.projectId)) return
    this.cancelledProjects.delete(job.projectId)
    const controller = new AbortController()
    this.runningJobs.set(job.projectId, controller)

    try {
      const project = await projectRepository.findById(job.projectId)
      if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
      const hasScenes = project.scenes.length > 0

      if (hasScenes) {
        await this.markStepSuccess(job, PipelineStep.DIRECTOR)
        await this.markStepSuccess(job, PipelineStep.SCRIPT)
        await this.markStepSuccess(job, PipelineStep.STORYBOARD)
      } else {
        await this.runStep(job, PipelineStep.DIRECTOR, async (onProgress) => {
          await onProgress(50); await onProgress(100)
        })
        await this.runStep(job, PipelineStep.SCRIPT, async (onProgress) => {
          await scriptService.generateScript({ projectId: job.projectId, skipCredits: true })
          await onProgress(100)
        })
        await this.runStep(job, PipelineStep.STORYBOARD, async (onProgress) => {
          await onProgress(100)
        })
      }

      await this.runStep(job, PipelineStep.ASSET, async (onProgress) => {
        await onProgress(10)
        try { await assetPlannerService.autoFillProject(job.projectId) } catch { /* Pexels optional */ }
        await onProgress(40)
        await assetService.generateImagesForProject(job.projectId, (p) => void onProgress(40 + Math.round(p * 0.6)))
        await onProgress(100)
      })

      await this.runStep(job, PipelineStep.TTS, async (onProgress) => {
        await assetService.generateVoiceForProject(job.projectId, (p) => void onProgress(p))
        await onProgress(100)
      })

      await this.runStep(job, PipelineStep.TIMELINE, async (onProgress) => {
        await composeService.composeForProject(job.projectId, (p) => void onProgress(p))
        await onProgress(100)
      })

      await this.runStep(job, PipelineStep.RENDER, async (onProgress) => {
        const result = await renderService.startRenderAndWait(job.projectId, (p) => void onProgress(p))
        if (result.renderId) {
          await productionJobRepository.update(job.id, { renderId: result.renderId })
          job.renderId = result.renderId
        }
        await onProgress(100)
      })

      // Review is optional, post-completion — does not block the task
      try { await reviewService.reviewProject(job.projectId) } catch { /* review optional */ }

      this.assertNotCancelled(job.projectId)
      await productionJobRepository.update(job.id, {
        stage: ProductionStage.COMPLETED, status: ProductionJobStatus.COMPLETED,
        progress: 100, stageProgress: 100, completedAt: new Date(),
      })
      await projectRepository.update(job.projectId, { status: ProjectStatus.COMPLETED })
      await this.emitEvent(job.projectId, 'completed', {
        taskId: job.id, step: null, status: ProductionJobStatus.COMPLETED, progress: 100,
        message: '生产流水线已完成',
      })
      await this.emitStatus(job.projectId)
    } catch (error) {
      if (error instanceof PipelineCancelledError) {
        logger(`Production pipeline cancelled for ${job.projectId}`)
        return
      }
      throw error
    } finally {
      this.runningJobs.delete(job.projectId)
    }
  }

  async recoverOnBoot() {
    const running = await productionJobRepository.findAllActive()
    if (running.length === 0) return
    logger(`Recovering ${running.length} interrupted production job(s)...`)
    for (const job of running) {
      await this.resetForResume(job, false)
      const refreshed = await productionJobRepository.findById(job.id)
      if (!refreshed) continue
      logger(`Resuming job ${job.id} for project ${job.projectId} (attempt ${job.attempt})`)
      this.runPipeline(refreshed as NonNullable<ProductionJob>).catch((e) => {
        if (!(e instanceof PipelineCancelledError)) loggerError(`Recovered pipeline failed for ${job.projectId}`, e)
      })
    }
  }

  async regenerateVoice(projectId: string, sceneId?: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    if (project.scenes.length === 0) throw new AppError(400, 'NO_SCENES', '请先生成 AI 分镜后再配音')
    await assetService.generateVoiceForProject(projectId, undefined, { force: true, sceneId })
    return projectService.getProject(projectId)
  }

  async generateImages(projectId: string, sceneId?: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    if (project.scenes.length === 0) throw new AppError(400, 'NO_SCENES', '请先生成 AI 分镜')
    await assetService.generateImagesForProject(projectId, undefined, { sceneId, force: Boolean(sceneId) })
    return projectService.getProject(projectId)
  }
}

export const productionService = new ProductionService()
