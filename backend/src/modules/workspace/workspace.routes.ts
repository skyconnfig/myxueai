import { Router } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { taskService } from '../task/task.service.js'
import { templateService } from '../template/template.service.js'
import { creditsService } from './credits.service.js'
import { statsService } from './stats.service.js'
import { VIDEO_TEMPLATES } from './templates.data.js'

const router = Router()

router.get('/summary', async (_req, res, next) => {
  try {
    const [data, credits, stats] = await Promise.all([
      taskService.getSummary(),
      creditsService.getBalance(),
      statsService.getDashboardStats(),
    ])
    return sendSuccess(res, {
      credits,
      creditsLabel: data.creditsLabel,
      runningCount: data.runningCount,
      queueCount: data.queueCount,
      assetCount: stats.assetCount,
      avgProductionMinutes: stats.avgProductionMinutes,
      completedProjectCount: stats.completedProjectCount,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/templates', async (_req, res) => {
  try {
    const dbTemplates = await templateService.list()
    if (dbTemplates.length > 0) {
      const mapped = dbTemplates.map((t) => ({
        id: t.slug,
        slug: t.slug,
        name: t.name,
        tag: t.category,
        category: t.category,
        ratio: t.ratio,
        duration: t.duration,
        style: t.style?.label ?? t.category,
        prompt: (t.config as { prompt?: string })?.prompt ?? `使用 ${t.name} 模板创建商业视频`,
        thumbnail: t.previewUrl ?? '',
        creditsCost: 200,
        sceneCount: t.scenes.length,
      }))
      return sendSuccess(res, mapped)
    }
    return sendSuccess(res, VIDEO_TEMPLATES)
  } catch {
    return sendSuccess(res, VIDEO_TEMPLATES)
  }
})

export default router
