import { Router } from 'express'
import { productionController } from '../production/production.controller.js'
import { studioController } from '../studio/studio.controller.js'
import { templateController } from '../template/template.controller.js'
import { projectController } from './project.controller.js'

const router = Router()

router.get('/', ...projectController.list)
router.get('/:id/production', productionController.getStatus)
router.post('/:id/production/start', ...productionController.start)
router.post('/:id/production/retry', ...productionController.retry)
router.post('/:id/production/cancel', productionController.cancel)
router.post('/:id/production/voice', productionController.regenerateVoice)
router.post('/:id/production/images', productionController.generateImages)
router.post('/:id/studio/auto-edit', studioController.autoEdit)
router.post('/:id/studio/captions', ...studioController.updateCaptions)
router.post('/:id/apply-template', templateController.applyToProject)
router.get('/:id/composition', projectController.getComposition)
router.get('/:id', projectController.getById)
router.post('/', ...projectController.create)
router.delete('/:id', projectController.remove)

export default router
