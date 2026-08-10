import { Router } from 'express'

import { aiController } from './ai.controller.js'



const router = Router()



router.post('/script', ...aiController.generateScript)
router.post('/optimize', ...aiController.optimizeScript)



export default router

