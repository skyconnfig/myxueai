import { prisma } from '../../config/database.js'
import {
  PIPELINE_STEPS,
  ProductionJobStatus,
  ProductionStage,
  type ProductionStepRecord,
} from '../../constants/status.js'

function buildInitialSteps(): ProductionStepRecord[] {
  return PIPELINE_STEPS.map((key) => ({
    key,
    status: 'waiting',
    progress: 0,
    startedAt: null,
    completedAt: null,
    durationMs: null,
    error: null,
    retryCount: 0,
  }))
}

export class ProductionJobRepository {
  findById(id: string) {
    return prisma.productionJob.findUnique({ where: { id } })
  }

  findActiveByProjectId(projectId: string) {
    return prisma.productionJob.findFirst({
      where: {
        projectId,
        status: { notIn: [ProductionJobStatus.COMPLETED] },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  findLatestByProjectId(projectId: string) {
    return prisma.productionJob.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  findRunningByProjectId(projectId: string) {
    return prisma.productionJob.findFirst({
      where: { projectId, status: ProductionJobStatus.RUNNING },
      orderBy: { updatedAt: 'desc' },
    })
  }

  findAllActive() {
    return prisma.productionJob.findMany({
      where: { status: ProductionJobStatus.RUNNING },
      orderBy: { updatedAt: 'asc' },
    })
  }

  findByProjectId(projectId: string) {
    return prisma.productionJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  create(data: {
    projectId: string
    userId?: string
    stage?: string
    status?: string
    attempt?: number
  }) {
    return prisma.productionJob.create({
      data: {
        projectId: data.projectId,
        userId: data.userId ?? null,
        stage: data.stage ?? ProductionStage.QUEUED,
        status: data.status ?? ProductionJobStatus.RUNNING,
        attempt: data.attempt ?? 1,
        steps: buildInitialSteps() as unknown as object,
        startedAt: new Date(),
      },
    })
  }

  update(id: string, data: {
    stage?: string
    status?: string
    progress?: number
    stageProgress?: number
    error?: string | null
    errorMeta?: unknown
    steps?: unknown
    renderId?: string | null
    result?: unknown
    startedAt?: Date
    completedAt?: Date | null
    attempt?: number
  }) {
    return prisma.productionJob.update({
      where: { id },
      data: {
        ...(data.stage !== undefined ? { stage: data.stage } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
        ...(data.stageProgress !== undefined ? { stageProgress: data.stageProgress } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.errorMeta !== undefined ? { errorMeta: data.errorMeta as object } : {}),
        ...(data.steps !== undefined ? { steps: data.steps as object } : {}),
        ...(data.renderId !== undefined ? { renderId: data.renderId } : {}),
        ...(data.result !== undefined ? { result: data.result as object } : {}),
        ...(data.startedAt !== undefined ? { startedAt: data.startedAt } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.attempt !== undefined ? { attempt: data.attempt } : {}),
      },
    })
  }
}

export const productionJobRepository = new ProductionJobRepository()
