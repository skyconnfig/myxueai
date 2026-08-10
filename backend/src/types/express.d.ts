import type { AuthUser } from '@xueai/shared'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: AuthUser
    }
  }
}

export {}
