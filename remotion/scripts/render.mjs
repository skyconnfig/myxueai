import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveServeUrl, webpackOverride } from './bundle-cache.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remotionRoot = path.resolve(__dirname, '..')

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error('Usage: node render.mjs <input.json> <output.mp4>')
  process.exit(1)
}

function emitProgress(pct) {
  process.stdout.write(`XUEAI_PROGRESS:${pct}\n`)
}

async function main() {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const entry = path.join(remotionRoot, 'src', 'index.ts')

  console.log('[remotion] Preparing bundle...')
  emitProgress(5)
  const serveUrl = await resolveServeUrl({
    remotionRoot,
    entryPoint: entry,
    publicDir: path.join(remotionRoot, 'public'),
    webpackOverride,
  })

  const composition = await selectComposition({
    serveUrl,
    id: 'VideoComposition',
    inputProps: input,
  })

  const crf = Number(process.env.REMOTION_CRF ?? 18)
  const concurrency = Number(process.env.REMOTION_CONCURRENCY ?? 1)
  const logLevel = process.env.REMOTION_LOG_LEVEL ?? 'info'

  console.log('[remotion] Rendering MP4...', {
    frames: composition.durationInFrames,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    crf,
    concurrency,
  })
  emitProgress(10)

  let lastReported = -1
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: input,
    crf,
    concurrency,
    logLevel,
    enforceAudioTrack: true,
    muted: false,
    chromiumOptions: {
      headless: process.env.REMOTION_CHROMIUM_HEADLESS !== 'false',
    },
    onBrowserLog: (log) => {
      if (logLevel === 'verbose') {
        console.log(`[remotion:browser] ${log.text}`)
      }
    },
    onProgress: ({ progress }) => {
      const pct = Math.min(99, Math.max(10, Math.round(10 + progress * 89)))
      if (pct !== lastReported) {
        lastReported = pct
        emitProgress(pct)
      }
    },
  })

  emitProgress(100)
  console.log('[remotion] Render complete:', outputPath)
}

main().catch((err) => {
  console.error('[remotion] Render failed:', err)
  process.exit(1)
})
