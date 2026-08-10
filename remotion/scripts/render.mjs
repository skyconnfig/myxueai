import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remotionRoot = path.resolve(__dirname, '..')

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error('Usage: node render.mjs <input.json> <output.mp4>')
  process.exit(1)
}

function resolveTotalFrames(input) {
  const fps = input.composition?.fps ?? input.fps ?? 30
  if (input.composition?.duration) {
    return Math.max(1, Math.round(input.composition.duration * fps))
  }
  if (input.composition?.scenes?.length) {
    const totalSec = input.composition.scenes.reduce((sum, s) => sum + (s.duration ?? 0), 0)
    return Math.max(1, Math.round(totalSec * fps))
  }
  const totalSec =
    input.scenes?.reduce((sum, s) => sum + (s.duration ?? 0), 0) ?? input.duration ?? 30
  return Math.max(1, Math.round(totalSec * fps))
}

function emitProgress(pct) {
  process.stdout.write(`XUEAI_PROGRESS:${pct}\n`)
}

async function main() {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const entry = path.join(remotionRoot, 'src', 'index.ts')

  console.log('[remotion] Bundling composition...')
  emitProgress(5)
  const serveUrl = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
    publicDir: path.join(remotionRoot, 'public'),
  })

  const fps = input.composition?.fps ?? input.fps ?? 30
  const totalFrames = resolveTotalFrames(input)

  const composition = await selectComposition({
    serveUrl,
    id: 'VideoComposition',
    inputProps: input,
  })

  composition.durationInFrames = totalFrames
  composition.width = input.composition?.width ?? input.width ?? composition.width
  composition.height = input.composition?.height ?? input.height ?? composition.height
  composition.fps = fps

  const crf = Number(process.env.REMOTION_CRF ?? 18)
  const concurrency = Number(process.env.REMOTION_CONCURRENCY ?? 1)

  console.log('[remotion] Rendering MP4...', {
    frames: totalFrames,
    width: composition.width,
    height: composition.height,
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
    enforceAudioTrack: true,
    muted: false,
    chromiumOptions: {
      headless: process.env.REMOTION_CHROMIUM_HEADLESS !== 'false',
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
