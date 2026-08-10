import { Router } from 'express'
import { prisma } from '../config/database.js'
import aiRoutes from '../modules/ai/ai.routes.js'
import assetRoutes from '../modules/asset/asset.routes.js'
import authRoutes from '../modules/auth/auth.routes.js'
import projectRoutes from '../modules/project/project.routes.js'
import reviewRoutes from '../modules/review/review.routes.js'
import stockRoutes from '../modules/stock/stock.routes.js'
import sceneRoutes from '../modules/scene/scene.routes.js'
import renderRoutes from '../modules/render/render.routes.js'
import taskRoutes from '../modules/task/task.routes.js'
import videoRoutes from '../modules/video/video.routes.js'
import workspaceRoutes from '../modules/workspace/workspace.routes.js'
import templateRoutes from '../modules/template/template.routes.js'
import voiceRoutes from '../modules/voice/voice.routes.js'
import { sendSuccess } from '../utils/response.js'

const router = Router()

router.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  return sendSuccess(res, {
    status: 'ok',
    service: 'xueai-video-factory-api',
    timestamp: new Date().toISOString(),
  })
})

router.use('/auth', authRoutes)
router.use('/projects', projectRoutes)
router.use('/projects', reviewRoutes)
router.use('/scenes', sceneRoutes)
router.use('/stock', stockRoutes)
router.use('/video', videoRoutes)
router.use('/ai', aiRoutes)
router.use('/assets', assetRoutes)
router.use('/tasks', taskRoutes)
router.use('/workspace', workspaceRoutes)
router.use('/voice', voiceRoutes)
router.use('/render', renderRoutes)
router.use('/templates', templateRoutes)

export default router
