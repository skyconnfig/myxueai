import type { NextFunction, Request, Response } from 'express'
import { sendSuccess } from '../../utils/response.js'
import { assetPlannerService } from '../asset-planner/asset-planner.service.js'
import { stockService } from './stock.service.js'

export class StockController {
  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = String(req.query.q ?? req.query.query ?? '')
      if (!query.trim()) {
        return sendSuccess(res, { configured: stockService.isConfigured(), results: [] })
      }
      const orientation = req.query.orientation === 'portrait' ? 'portrait' : 'landscape'
      const results = await stockService.searchVideos(query, { orientation })
      return sendSuccess(res, { configured: true, query, results })
    } catch (error) {
      return next(error)
    }
  }

  suggest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as {
        topic?: string
        storyBeat?: string
        action?: string
        visualPrompt?: string
      }
      const queries = stockService.suggestQueries(body)
      return sendSuccess(res, { queries })
    } catch (error) {
      return next(error)
    }
  }

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as {
        projectId: string
        pexelsId: number
        url: string
        photographer: string
        duration?: number
        width?: number
        height?: number
      }
      const asset = await assetPlannerService.downloadPexelsVideo(body)
      return sendSuccess(res, asset)
    } catch (error) {
      return next(error)
    }
  }

  attachToScene = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as {
        pexelsId: number
        url: string
        photographer: string
        duration?: number
        width?: number
        height?: number
        previewUrl?: string
      }
      const data = await assetPlannerService.attachStockToScene(
        String(req.params.projectId),
        String(req.params.sceneId),
        {
          id: body.pexelsId,
          url: body.url,
          photographer: body.photographer,
          duration: body.duration ?? 5,
          width: body.width ?? 1920,
          height: body.height ?? 1080,
          previewUrl: body.previewUrl ?? '',
          provider: 'pexels',
        },
      )
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  autoFill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await assetPlannerService.autoFillProject(String(req.params.projectId))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }
}

export const stockController = new StockController()
