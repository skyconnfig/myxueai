import http from 'node:http'
import { createApp } from './app.js'
import { config } from './config/index.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { ensureStorageDirectories } from './config/storage.js'
import { logger, loggerError } from './utils/logger.js'
import { wsHub } from './ws/ws.server.js'

async function bootstrap() {
  ensureStorageDirectories()
  await connectDatabase()

  const app = createApp()
  const server = http.createServer(app)
  wsHub.attach(server)

  server.listen(config.port, () => {
    logger(`XueAI Video Factory API running on http://localhost:${config.port}`)
    logger(`Health check: http://localhost:${config.port}/api/health`)
    logger(`WebSocket: ws://localhost:${config.port}/ws/projects/:id`)
  })

  const shutdown = async (signal: string) => {
    logger(`Received ${signal}, shutting down...`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch((error) => {
  loggerError('Failed to start server', error)
  process.exit(1)
})
