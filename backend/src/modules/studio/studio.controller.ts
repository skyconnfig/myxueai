import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { projectService } from '../project/project.service.js'
import { z } from 'zod'
import { studioService } from './studio.service.js'

const updateCaptionsSchema = z.object({
  updates: z.array(
    z.object({
      sceneId: z.string().min(1),
      voiceText: z.string().optional(),
      captionStyle: z
        .object({
          color: z.string().optional(),
          fontSize: z.number().int().min(20).max(72).optional(),
        })
        .optional(),
    }),
  ).min(1),
})

export class StudioController {
  autoEdit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await studioService.autoEdit(String(req.params.id))
      const project = await projectService.getProject(String(req.params.id))
      return sendSuccess(res, { ...result, project }, 'Auto edit complete')
    } catch (error) {
      return next(error)
    }
  }

  updateCaptions = [
    validateBody(updateCaptionsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as z.infer<typeof updateCaptionsSchema>
        const project = await studioService.updateCaptions(String(req.params.id), body.updates)
        return sendSuccess(res, { project }, 'Captions updated')
      } catch (error) {
        return next(error)
      }
    },
  ]
}

export const studioController = new StudioController()
