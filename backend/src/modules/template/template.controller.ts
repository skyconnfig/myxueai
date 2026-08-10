import type { NextFunction, Request, Response } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { templateService } from './template.service.js'

export class TemplateController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined
      const data = await templateService.list(category)
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await templateService.getBySlug(String(req.params.slug))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  applyToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { templateSlug?: string }
      const slug = String(body.templateSlug ?? req.params.slug ?? '')
      if (!slug) throw new Error('templateSlug is required')
      const data = await templateService.applyToProject(String(req.params.id), slug)
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  getCompositionTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = templateService.getCompositionTemplate(String(req.params.slug))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  listCompositionTemplates = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = templateService.listCompositionTemplates()
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const templateController = new TemplateController()
