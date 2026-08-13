import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import {
  getAiProductionSettingsPublic,
  updateAiProductionSettings,
} from './runtime-settings.js'
import {
  bootstrapRemotionSettings,
  ensureRemotionBrowser,
  getRemotionSettingsPublic,
  refreshRemotionBrowserStatus,
  updateRemotionSettings,
} from './remotion-settings.service.js'
import { aiProductionSettingsPatchSchema } from './settings.types.js'
import { remotionSettingsPatchSchema } from './remotion-settings.types.js'

export class SettingsController {
  getAiProduction = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, getAiProductionSettingsPublic())
    } catch (error) {
      return next(error)
    }
  }

  updateAiProduction = [
    validateBody(aiProductionSettingsPatchSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = updateAiProductionSettings(req.body)
        return sendSuccess(res, result, 'AI 生产接口已保存并立即生效')
      } catch (error) {
        return next(error)
      }
    },
  ]

  getRemotion = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, getRemotionSettingsPublic())
    } catch (error) {
      return next(error)
    }
  }

  refreshRemotion = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await refreshRemotionBrowserStatus()
      return sendSuccess(res, result)
    } catch (error) {
      return next(error)
    }
  }

  ensureRemotionBrowser = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ensureRemotionBrowser()
      return sendSuccess(res, result, '已开始配置 Chromium')
    } catch (error) {
      return next(error)
    }
  }

  updateRemotion = [
    validateBody(remotionSettingsPatchSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = updateRemotionSettings(req.body)
        return sendSuccess(res, result, 'Remotion 渲染参数已保存')
      } catch (error) {
        return next(error)
      }
    },
  ]
}

export const settingsController = new SettingsController()
