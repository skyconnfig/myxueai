import { Router } from 'express'
import { templateController } from './template.controller.js'

const router = Router()

router.get('/', templateController.list)
router.get('/composition', templateController.listCompositionTemplates)
router.get('/:slug/composition', templateController.getCompositionTemplate)
router.get('/:slug', templateController.getBySlug)
router.post('/projects/:id/apply', templateController.applyToProject)

export default router
