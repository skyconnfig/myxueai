import { Router } from 'express'
import { renderController } from './render.controller.js'

const router = Router()

router.post('/', ...renderController.start)
router.get('/project/:projectId', renderController.listByProject)
router.get('/:id', renderController.getById)

export default router
