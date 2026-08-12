import type { NextFunction, Request, Response } from 'express'
import { unifiedAiClient } from '../../lib/ai/ai-client.js'
import { aiConfig } from '../../lib/ai/ai-config.js'
import { validateBody } from '../../middleware/validate.js'
import { sendSuccess } from '../../utils/response.js'
import { generateScriptSchema, optimizeScriptSchema, changeStyleSchema } from '../project/project.types.js'
import { scriptService } from './script.service.js'

export class AiController {
  generateScript = [
    validateBody(generateScriptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await scriptService.generateScript(req.body)
        return sendSuccess(res, result, 'Script generated')
      } catch (error) {
        return next(error)
      }
    },
  ]

  optimizeScript = [
    validateBody(optimizeScriptSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await scriptService.optimizeScript(req.body)
        return sendSuccess(res, result, 'Script optimized')
      } catch (error) {
        return next(error)
      }
    },
  ]

  changeStyle = [
    validateBody(changeStyleSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await scriptService.changeStyle(req.body)
        return sendSuccess(res, result, 'Style changed')
      } catch (error) {
        return next(error)
      }
    },
  ]

  health = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, {
        provider: aiConfig.llm.provider,
        model: aiConfig.llm.model,
        baseUrl: aiConfig.llm.baseUrl,
        configured: unifiedAiClient.configured,
      })
    } catch (error) {
      return next(error)
    }
  }

  test = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await unifiedAiClient.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: '你好，请回复“DeepSeek OK”' },
        ],
        temperature: 0.7,
      })
      return sendSuccess(res, {
        configured: true,
        provider: aiConfig.llm.provider,
        model: result.model,
        response: result.content.trim(),
      })
    } catch (error) {
      return next(error)
    }
  }
}

export const aiController = new AiController()
