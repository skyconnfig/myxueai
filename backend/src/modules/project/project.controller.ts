import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { optionalAuth, resolveUserId } from '../../middleware/auth.js'
import { sendSuccess } from '../../utils/response.js'
import { createProjectSchema } from './project.types.js'
import { projectService } from './project.service.js'

export class ProjectController {
  list = [
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = await resolveUserId(req)
        const data = await projectService.listProjects(userId)
        return sendSuccess(res, data)
      } catch (error) {
        return next(error)
      }
    },
  ]

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await projectService.getProject(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  getComposition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await projectService.getComposition(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  create = [
    optionalAuth,
    validateBody(createProjectSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = await resolveUserId(req)
        const data = await projectService.createProject(req.body, userId)
        return sendSuccess(res, data, 'Project created', 201)
      } catch (error) {
        return next(error)
      }
    },
  ]

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.deleteProject(String(req.params.id))
      return sendSuccess(res, null, 'Project deleted')
    } catch (error) {
      return next(error)
    }
  }
}

export const projectController = new ProjectController()
