import { Router } from 'express'
import { skillsController } from './skills.controller.js'

const router = Router()

router.get('/marketplace', skillsController.marketplace)
router.get('/marketplace/:id', skillsController.marketplaceItem)
router.get('/user', skillsController.userSkills)
router.post('/match', skillsController.match)
router.post('/validate', skillsController.validate)
router.get('/', skillsController.list)
router.post('/plan', skillsController.plan)
router.post('/upload', skillsController.upload)
router.get('/:id', skillsController.get)
router.delete('/:id', skillsController.remove)

export default router
