import { Router } from 'express'

import { aiController } from './ai.controller.js'
import { directorController } from '../director/director.controller.js'



const router = Router()



router.get('/health', aiController.health)
router.post('/test', aiController.test)
router.post('/script', ...aiController.generateScript)
router.post('/optimize', ...aiController.optimizeScript)
router.post('/change-style', ...aiController.changeStyle)
router.post('/director', directorController.previewBrief)



export default router

