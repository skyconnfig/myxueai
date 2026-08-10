import { Router } from 'express'
import { stockController } from './stock.controller.js'

const router = Router()

router.get('/search', stockController.search)
router.post('/suggest', stockController.suggest)
router.post('/download', stockController.download)
router.post('/projects/:projectId/scenes/:sceneId/attach', stockController.attachToScene)
router.post('/projects/:projectId/auto-fill', stockController.autoFill)

export default router
