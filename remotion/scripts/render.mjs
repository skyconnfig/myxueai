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

async function main() {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const entry = path.join(remotionRoot, 'src', 'index.ts')

  console.log('[remotion] Bundling composition...')
  const serveUrl = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
    publicDir: path.join(remotionRoot, 'public'),
  })

  const totalFrames = Math.max(
    1,
    Math.round((input.duration ?? 30) * (input.fps ?? 30)),
  )

  const composition = await selectComposition({
    serveUrl,
    id: 'VideoComposition',
    inputProps: input,
  })

  composition.durationInFrames = totalFrames
  composition.width = input.width ?? composition.width
  composition.height = input.height ?? composition.height
  composition.fps = input.fps ?? composition.fps

  const crf = Number(process.env.REMOTION_CRF ?? 18)
  const concurrency = Number(process.env.REMOTION_CONCURRENCY ?? 1)

  console.log('[remotion] Rendering MP4...', {
    frames: totalFrames,
    width: composition.width,
    height: composition.height,
    crf,
    concurrency,
  })

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: input,
    crf,
    concurrency,
    chromiumOptions: {
      headless: process.env.REMOTION_CHROMIUM_HEADLESS !== 'false',
    },
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        process.stdout.write(`\r[remotion] Progress: ${Math.round(progress * 100)}%`)
      }
    },
  })

  console.log('\n[remotion] Render complete:', outputPath)
}

main().catch((err) => {
  console.error('[remotion] Render failed:', err)
  process.exit(1)
})
