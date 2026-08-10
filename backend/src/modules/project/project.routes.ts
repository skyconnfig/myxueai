import { Router } from 'express'
import { productionController } from '../production/production.controller.js'
import { projectController } from './project.controller.js'

const router = Router()

router.get('/', ...projectController.list)
router.get('/:id/production', productionController.getStatus)
router.post('/:id/production/start', ...productionController.start)
router.get('/:id', projectController.getById)
router.post('/', ...projectController.create)
router.delete('/:id', projectController.remove)

export default router
