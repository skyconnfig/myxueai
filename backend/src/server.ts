import http from 'node:http'
import { createApp } from './app.js'
import { config } from './config/index.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { ensureStorageDirectories } from './config/storage.js'
import { authService } from './modules/auth/auth.service.js'
import { seedVideoTemplates } from './modules/template/template.seed-runner.js'
import { productionService } from './modules/production/production.service.js'
import { loadRuntimeAiSettings } from './modules/settings/runtime-settings.js'
import { bootstrapRemotionSettings } from './modules/settings/remotion-settings.service.js'
import { logger, loggerError } from './utils/logger.js'
import { wsHub } from './ws/ws.server.js'

let activeServer: http.Server | null = null
let shuttingDown = false

function closeServer(server: http.Server) {
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections()
  }
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
        reject(error)
        return
      }
      resolve()
    })
  })
}

function listenWithRetry(server: http.Server, port: number, attempts = 40, delayMs = 500) {
  return new Promise<void>((resolve, reject) => {
    let tries = 0

    const tryListen = () => {
      tries += 1
      const onError = (error: NodeJS.ErrnoException) => {
        server.removeListener('listening', onListening)
        if (error.code === 'EADDRINUSE' && tries < attempts) {
          setTimeout(tryListen, delayMs)
          return
        }
        reject(error)
      }
      const onListening = () => {
        server.removeListener('error', onError)
        resolve()
      }

      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port)
    }

    tryListen()
  })
}

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger(`Received ${signal}, shutting down...`)
  try {
    wsHub.close()
    if (activeServer) {
      await closeServer(activeServer)
      activeServer = null
    }
    await disconnectDatabase()
    process.exit(0)
  } catch (error) {
    loggerError('Shutdown error', error)
    process.exit(1)
  }
}

async function bootstrap() {
  ensureStorageDirectories()
  loadRuntimeAiSettings()
  await bootstrapRemotionSettings()
  await connectDatabase()
  await seedVideoTemplates().catch((err) => loggerError('Template seed failed', err))

  if (config.isDev) {
    await authService.getDemoUser()
    logger('Demo user ready: demo@xueai.local / demo123456')
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))

  const app = createApp()
  const server = http.createServer(app)
  activeServer = server

  await listenWithRetry(server, config.port)
  wsHub.attach(server)

  await productionService.recoverOnBoot().catch((err) => loggerError('Production recovery failed', err))

  logger(`XueAI Video Factory API running on http://localhost:${config.port}`)
  logger(`Health check: http://localhost:${config.port}/api/health`)
  logger(`WebSocket: ws://localhost:${config.port}/ws/projects/:id`)
}

bootstrap().catch((error) => {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  if (code === 'EADDRINUSE') {
    loggerError(`Port ${config.port} is already in use — stop the other process and retry`, error)
  } else {
    loggerError('Failed to start server', error)
  }
  process.exit(1)
})
