import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { generateScriptSchema, optimizeScriptSchema } from '../project/project.types.js'
import { scriptService } from './script.service.js'

export class AiController {
  generateScript = [
    validateBody(generateScriptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await scriptService.generateScript(req.body)
        return sendSuccess(res, result, 'Script generated')
      } catch (error) {
        return next(error)
      }
    },
  ]

  optimizeScript = [
    validateBody(optimizeScriptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await scriptService.optimizeScript(req.body)
        return sendSuccess(res, result, 'Script optimized')
      } catch (error) {
        return next(error)
      }
    },
  ]
}

export const aiController = new AiController()
