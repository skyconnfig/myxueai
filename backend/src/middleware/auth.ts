import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../middleware/error-handler.js'
import { authService } from '../modules/auth/auth.service.js'

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

/** Attach userId when Bearer token is valid; otherwise leave anonymous. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req)
  if (!token) return next()

  try {
    const userId = authService.verifyToken(token)
    req.userId = userId
    req.user = await authService.getMe(userId)
  } catch {
    // ignore invalid token for optional routes
  }
  return next()
}

/** Require valid Bearer token. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req)
  if (!token) {
    return next(new AppError(401, 'UNAUTHORIZED', '请先登录'))
  }

  try {
    const userId = authService.verifyToken(token)
    req.userId = userId
    req.user = await authService.getMe(userId)
    return next()
  } catch (error) {
    return next(error)
  }
}

/** Resolve effective user id: authenticated user or demo user. */
export async function resolveUserId(req: Request): Promise<string> {
  if (req.userId) return req.userId
  const demo = await authService.getDemoUser()
  req.userId = demo.id
  return demo.id
}
