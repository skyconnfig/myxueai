import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { config } from './config/index.js'
import { storagePaths } from './config/storage.js'
import { optionalAuth } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(optionalAuth)

  app.use('/storage', express.static(storagePaths.root))

  app.get('/', (_req, res) => {
    res.json({
      name: 'XueAI Video Factory API',
      version: '1.0.0-mvp',
      docs: '/api/health',
    })
  })

  app.use('/api', apiRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
