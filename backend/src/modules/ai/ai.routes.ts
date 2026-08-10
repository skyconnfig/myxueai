import { Router } from 'express'

import { aiController } from './ai.controller.js'
import { directorController } from '../director/director.controller.js'



const router = Router()



router.post('/script', ...aiController.generateScript)
router.post('/optimize', ...aiController.optimizeScript)
router.post('/change-style', ...aiController.changeStyle)
router.post('/director', directorController.previewBrief)



export default router

