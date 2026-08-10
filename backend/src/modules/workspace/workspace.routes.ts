import { Router } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { taskService } from '../task/task.service.js'
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

router.get('/templates', (_req, res) => {
  return sendSuccess(res, VIDEO_TEMPLATES)
})

export default router
