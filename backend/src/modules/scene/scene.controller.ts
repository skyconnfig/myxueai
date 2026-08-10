import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { updateSceneSchema } from '../project/project.types.js'
import { sceneService } from './scene.service.js'

export class SceneController {
  update = [
    validateBody(updateSceneSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await sceneService.updateScene(String(req.params.id), req.body)
        return sendSuccess(res, data, 'Scene updated')
      } catch (error) {
        return next(error)
      }
    },
  ]
}

export const sceneController = new SceneController()
