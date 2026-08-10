import { Router } from 'express'

import { sceneController } from './scene.controller.js'



const router = Router()



router.patch('/:id', ...sceneController.update)



export default router

