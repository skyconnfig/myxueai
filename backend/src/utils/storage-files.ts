import fs from 'node:fs'
import path from 'node:path'
import { storagePaths } from '../config/storage.js'
import { logger } from './logger.js'

/** Map a public `/storage/...` URL to an absolute file path under storage root. */
export function resolveStorageFilePath(url: string): string | null {
  if (!url || url.startsWith('http://') || url.startsWith('https://')) return null

  let relative = url
  if (relative.startsWith('/storage/')) relative = relative.slice('/storage/'.length)
  else if (relative.startsWith('storage/')) relative = relative.slice('storage/'.length)
  else return null

  const abs = path.normalize(path.join(storagePaths.root, relative.replace(/\//g, path.sep)))
  const root = path.normalize(storagePaths.root)
  if (!abs.startsWith(root)) return null
  return abs
}

/** Delete a local storage file referenced by asset URL. Returns true if file was removed. */
export function deleteStorageFileByUrl(url: string): boolean {
  const filePath = resolveStorageFilePath(url)
  if (!filePath) return false
  if (!fs.existsSync(filePath)) return false
  try {
    fs.unlinkSync(filePath)
    return true
  } catch (error) {
    logger(
      `Failed to delete storage file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    )
    return false
  }
}
