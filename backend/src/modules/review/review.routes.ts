import { Router } from 'express'
import { reviewController } from './review.controller.js'

const router = Router()

router.post('/:id/review', reviewController.reviewProject)
router.get('/:id/review/latest', reviewController.getLatest)
router.post('/:id/review/fix', reviewController.applyFix)
router.post('/:id/review/render', reviewController.rerender)

export default router
