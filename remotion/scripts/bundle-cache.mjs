import { bundle } from '@remotion/bundler'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Resolve Remotion serveUrl with optional cache / prebuilt bundle.
 * @see https://www.remotion.dev/docs/ssr
 */
export async function resolveServeUrl({ remotionRoot, entryPoint, publicDir, webpackOverride }) {
  const preset = process.env.REMOTION_SERVE_URL?.trim()
  if (preset) {
    console.log('[remotion] Using REMOTION_SERVE_URL')
    return preset
  }

  const fingerprint = `${path.basename(entryPoint)}-${fs.statSync(entryPoint).mtimeMs}`
  const cacheRoot = path.join(remotionRoot, '.remotion', 'bundle-cache')
  const cacheDir = path.join(cacheRoot, fingerprint)
  const serveUrlFile = path.join(cacheDir, 'serve-url.txt')

  if (process.env.REMOTION_REBUNDLE !== 'true' && fs.existsSync(serveUrlFile)) {
    const cached = fs.readFileSync(serveUrlFile, 'utf8').trim()
    if (cached && fs.existsSync(cached)) {
      console.log('[remotion] Using cached bundle')
      return cached
    }
  }

  const serveUrl = await bundle({
    entryPoint,
    publicDir,
    webpackOverride,
  })

  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(serveUrlFile, serveUrl, 'utf8')
  return serveUrl
}

export function webpackOverride(config) {
  config.resolve = config.resolve ?? {}
  config.resolve.extensionAlias = {
    '.js': ['.ts', '.tsx', '.js'],
    '.mjs': ['.mts', '.mjs'],
  }
  return config
}
