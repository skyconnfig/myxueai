import type { Response } from 'express'

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiFailure {
  success: false
  error: {
    code: string
    message: string
  }
}

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200): Response {
  const payload: ApiSuccess<T> = { success: true, data }
  if (message) payload.message = message
  return res.status(status).json(payload)
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): Response {
  const payload: ApiFailure = {
    success: false,
    error: { code, message },
  }
  return res.status(status).json(payload)
}
