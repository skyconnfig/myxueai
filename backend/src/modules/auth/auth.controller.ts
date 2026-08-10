import type { NextFunction, Request, Response } from 'express'
import { validateBody } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/auth.js'
import { sendSuccess } from '../../utils/response.js'
import { loginSchema, registerSchema, updateProfileSchema } from './auth.types.js'
import { authService } from './auth.service.js'

export class AuthController {
  register = [
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await authService.register(req.body)
        return sendSuccess(res, data, '注册成功', 201)
      } catch (error) {
        return next(error)
      }
    },
  ]

  login = [
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await authService.login(req.body)
        return sendSuccess(res, data, '登录成功')
      } catch (error) {
        return next(error)
      }
    },
  ]

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return sendSuccess(res, null, '未登录')
      }
      const data = await authService.getMe(req.userId)
      return sendSuccess(res, data)
    } catch (error) {
      return next(error)
    }
  }

  updateProfile = [
    requireAuth,
    validateBody(updateProfileSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await authService.updateProfile(req.userId!, req.body)
        return sendSuccess(res, data, '资料已更新')
      } catch (error) {
        return next(error)
      }
    },
  ]
}

export const authController = new AuthController()
