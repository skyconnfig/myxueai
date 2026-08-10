export function logger(message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  if (meta) {
    console.log(`[${timestamp}] ${message}`, meta)
    return
  }
  console.log(`[${timestamp}] ${message}`)
}

export function loggerError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ${message}`, error)
}
