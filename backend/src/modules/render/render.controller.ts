import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { optionalAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { renderService } from './render.service.js'

const startRenderSchema = z.object({
  projectId: z.string().min(1),
})

export class RenderController {
  start = [
    optionalAuth,
    validateBody(startRenderSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await renderService.startRender(req.body.projectId)
        return sendSuccess(res, data, '渲染完成', 201)
      } catch (error) {
        return next(error)
      }
    },
  ]

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await renderService.getRender(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  listByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await renderService.listByProject(String(req.params.projectId))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const renderController = new RenderController()
