import { Router } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { taskService } from '../task/task.service.js'
import { creditsService } from './credits.service.js'
import { VIDEO_TEMPLATES } from './templates.data.js'

const router = Router()

router.get('/summary', async (_req, res, next) => {
  try {
    const [data, credits] = await Promise.all([
      taskService.getSummary(),
      creditsService.getBalance(),
    ])
    return sendSuccess(res, {
      credits,
      creditsLabel: data.creditsLabel,
      runningCount: data.runningCount,
      queueCount: data.queueCount,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/templates', (_req, res) => {
  return sendSuccess(res, VIDEO_TEMPLATES)
})

export default router
