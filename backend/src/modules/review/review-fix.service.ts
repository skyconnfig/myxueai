import type { VideoReviewIssueV2 } from '@xueai/shared'
import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'
import { TaskStatus, TaskType } from '../../constants/status.js'
import { assetPlannerService } from '../asset-planner/asset-planner.service.js'
import { renderService } from '../render/render.service.js'
import { taskRepository } from '../task/task.repository.js'

export class ReviewFixService {
  private patchFromIssue(issue: VideoReviewIssueV2) {
    const patch: Record<string, string> = {}
    const solution = issue.solution.toLowerCase()

    if (solution.includes('tracking')) patch.cameraMotion = 'tracking'
    else if (solution.includes('dolly')) patch.cameraMotion = 'slow_dolly_in'
    else if (solution.includes('orbit')) patch.cameraMotion = 'orbit'
    else if (solution.includes('push')) {
      patch.cameraMotion = 'push_in'
      patch.transition = 'push'
    } else if (solution.includes('crossfade')) patch.transition = 'crossfade'

    if (solution.includes('broll') || solution.includes('b-roll') || solution.includes('pexels')) {
      patch.componentType = 'broll_video'
    }

    return patch
  }

  async applyFromReview(projectId: string, reviewId?: string) {
    const review = reviewId
      ? await prisma.videoReview.findFirst({ where: { id: reviewId, projectId } })
      : await prisma.videoReview.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } })

    if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', '未找到审片记录')

    const issues = review.issues as unknown as VideoReviewIssueV2[]
    const scenes = await prisma.scene.findMany({ where: { projectId }, orderBy: { order: 'asc' } })
    const patches: Array<{ sceneId: string; order: number; fields: string[] }> = []

    for (const issue of issues) {
      if (!issue.scene || issue.scene <= 0) continue
      const scene = scenes.find((s) => s.order === issue.scene)
      if (!scene) continue

      const patch = this.patchFromIssue(issue)
      if (Object.keys(patch).length === 0) continue

      await prisma.scene.update({ where: { id: scene.id }, data: patch })
      patches.push({ sceneId: scene.id, order: scene.order, fields: Object.keys(patch) })

      if (patch.componentType === 'broll_video' && !scene.videoUrl) {
        try {
          await assetPlannerService.autoFillProject(projectId)
        } catch {
          // Pexels may be unconfigured
        }
      }
    }

    await taskRepository.create({
      projectId,
      type: TaskType.OPTIMIZE,
      status: TaskStatus.SUCCESS,
      progress: 100,
      result: { patches, reviewId: review.id },
    })

    return { projectId, reviewId: review.id, patches, needsRerender: patches.length > 0 }
  }

  async rerender(projectId: string) {
    await taskRepository.create({
      projectId,
      type: TaskType.RENDER,
      status: TaskStatus.RUNNING,
      progress: 5,
    })

    await renderService.startRenderAndWait(projectId, async (p) => {
      const tasks = await taskRepository.findByProjectId(projectId)
      const renderTask = tasks.find((t) => t.type === TaskType.RENDER && t.status === TaskStatus.RUNNING)
      if (renderTask) await taskRepository.update(renderTask.id, { progress: p })
    })

    const tasks = await taskRepository.findByProjectId(projectId)
    const renderTask = tasks.find((t) => t.type === TaskType.RENDER)
    if (renderTask) {
      await taskRepository.update(renderTask.id, { status: TaskStatus.SUCCESS, progress: 100 })
    }

    return { projectId, status: 'render_complete' }
  }
}

export const reviewFixService = new ReviewFixService()
