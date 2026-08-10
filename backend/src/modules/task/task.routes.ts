import { Router } from 'express'
import { taskController } from './task.controller.js'

const router = Router()

router.get('/summary', taskController.summary)
router.get('/', taskController.list)
router.post('/', ...taskController.create)
router.post('/:id/stop', taskController.stop)
router.delete('/:id', taskController.remove)
router.get('/:id', taskController.getById)

export default router
