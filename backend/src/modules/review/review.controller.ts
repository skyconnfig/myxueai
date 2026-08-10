import type { NextFunction, Request, Response } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { reviewService } from './review.service.js'

export class ReviewController {
  reviewProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { renderId?: string; force?: boolean }
      const data = await reviewService.reviewProject(String(req.params.id), body)
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  getLatest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await reviewService.getLatestReview(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  applyFix = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as { reviewId?: string; rerender?: boolean }
      const fix = await reviewService.applyFix(String(req.params.id), body.reviewId)
      if (body.rerender !== false && fix.needsRerender) {
        await reviewService.rerenderAfterFix(String(req.params.id))
      }
      return sendSuccess(res, fix)
    } catch (error) {
      return next(error)
    }
  }

  rerender = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await reviewService.rerenderAfterFix(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const reviewController = new ReviewController()
