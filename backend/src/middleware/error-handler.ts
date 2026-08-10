import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { loggerError } from '../utils/logger.js'
import { sendError } from '../utils/response.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, 404, 'NOT_FOUND', 'API route not found')
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.code, error.message)
  }

  if (error instanceof ZodError) {
    const message = error.errors.map((item) => item.message).join('; ')
    return sendError(res, 400, 'VALIDATION_ERROR', message)
  }

  loggerError('Unhandled error', error)
  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error')
}
