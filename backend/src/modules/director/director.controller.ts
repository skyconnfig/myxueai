import type { NextFunction, Request, Response } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { directorService } from './director.service.js'

export class DirectorController {
  previewBrief = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as {
        topic?: string
        style?: string
        videoStyle?: string
        audience?: string
        goal?: string
        duration?: number
        ratio?: string
      }
      const data = await directorService.previewBrief({
        topic: String(body.topic ?? ''),
        style: body.style,
        videoStyle: body.videoStyle,
        audience: body.audience,
        goal: body.goal,
        duration: body.duration,
        ratio: body.ratio,
      })
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const directorController = new DirectorController()
