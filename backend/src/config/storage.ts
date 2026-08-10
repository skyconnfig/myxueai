import fs from 'node:fs'
import path from 'node:path'
import { config } from './index.js'

const subdirs = ['uploads', 'images', 'audio', 'renders', 'compose', 'temp', 'footage'] as const

export const storagePaths = {
  root: config.storagePath,
  uploads: path.join(config.storagePath, 'uploads'),
  images: path.join(config.storagePath, 'images'),
  audio: path.join(config.storagePath, 'audio'),
  renders: path.join(config.storagePath, 'renders'),
  compose: path.join(config.storagePath, 'compose'),
  temp: path.join(config.storagePath, 'temp'),
  footage: path.join(config.storagePath, 'footage'),
} as const

export function projectFootageDir(projectId: string) {
  return path.join(storagePaths.footage, projectId)
}

export function ensureStorageDirectories(): void {
  for (const dir of [storagePaths.root, ...subdirs.map((name) => path.join(storagePaths.root, name))]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}
