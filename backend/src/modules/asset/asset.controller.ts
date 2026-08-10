import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { AppError } from '../../middleware/error-handler.js'
import { optionalAuth, resolveUserId } from '../../middleware/auth.js'
import { validateQuery } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { assetService } from './asset.service.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const listQuerySchema = z.object({
  projectId: z.string().optional(),
  type: z.string().optional(),
})

export class AssetController {
  list = [
    optionalAuth,
    validateQuery(listQuerySchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = await resolveUserId(req)
        const data = await assetService.listAssets({
          projectId: req.query.projectId as string | undefined,
          type: req.query.type as string | undefined,
          userId,
        })
        return sendSuccess(res, data)
      } catch (error) {
        return next(error)
      }
    },
  ]

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await assetService.getAsset(String(req.params.id))
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  upload = [
    optionalAuth,
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return next(new AppError(400, 'NO_FILE', '请上传文件'))
        }
        const projectId = req.body.projectId as string | undefined
        const data = await assetService.createFromUpload(req.file, {
          projectId,
          sceneId: req.body.sceneId,
          type: req.body.type,
          userId: await resolveUserId(req),
        })
        return sendSuccess(res, data, '上传成功', 201)
      } catch (error) {
        return next(error)
      }
    },
  ]

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await assetService.deleteAsset(String(req.params.id))
      return sendSuccess(res, data, '素材已删除')
    } catch (error) {
      return next(error)
    }
  }
}

export const assetController = new AssetController()
