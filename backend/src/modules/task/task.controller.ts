import type { NextFunction, Request, Response } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { taskService } from './task.service.js'

export class TaskController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const data = await taskService.listTasks({ status, limit })
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  summary = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await taskService.getSummary()
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await taskService.getTask(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const taskController = new TaskController()
