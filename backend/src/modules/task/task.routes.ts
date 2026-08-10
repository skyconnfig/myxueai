import { Router } from 'express'
import { taskController } from './task.controller.js'

const router = Router()

router.get('/summary', taskController.summary)
router.get('/', taskController.list)
router.get('/:id', taskController.getById)

export default router
