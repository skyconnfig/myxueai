import type { NextFunction, Request, Response } from 'express'
import { optionalAuth, resolveUserId } from '../../middleware/auth.js'
import { sendSuccess } from '../../utils/response.js'
import { productionService } from './production.service.js'

export class ProductionController {
  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await productionService.getStatus(String(req.params.id), false)
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  start = [
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = await resolveUserId(req)
        const data = await productionService.start(String(req.params.id), userId)
        return sendSuccess(res, data, 'Production pipeline started')
      } catch (error) {
        return next(error)
      }
    },
  ]

  regenerateVoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await productionService.regenerateVoice(String(req.params.id))
      return sendSuccess(res, data, 'Voice regenerated')
    } catch (error) {
      return next(error)
    }
  }
}

export const productionController = new ProductionController()
