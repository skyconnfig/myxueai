import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderInputBuilder } from '../src/modules/render/render-input.builder.js'
import { stageRenderAssets } from '../src/modules/render/render-asset-staging.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')
const remotionRoot = path.resolve(backendRoot, '../remotion')
const storageRoot = path.resolve(backendRoot, '../storage')

async function main() {
  const projectId = process.argv[2]
  if (!projectId) throw new Error('projectId required')

  const input = await renderInputBuilder.build(projectId)
  const renderId = `test-${Date.now()}`
  const staged = stageRenderAssets(renderId, input)

  const dir = path.join(storageRoot, 'renders', renderId)
  fs.mkdirSync(dir, { recursive: true })
  const inputPath = path.join(dir, 'input.json')
  const outputPath = path.join(dir, 'output.mp4')
  fs.writeFileSync(inputPath, JSON.stringify(staged, null, 2))

  console.log('[test] input written', inputPath)
  console.log('[test] scenes', staged.scenes.map((s) => ({ order: s.order, image: s.image, audio: s.audio, duration: s.duration })))

  await new Promise<void>((resolve, reject) => {
    const script = path.join(remotionRoot, 'scripts', 'render.mjs')
    const child = spawn(process.execPath, [script, inputPath, outputPath], {
      cwd: remotionRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        REMOTION_CRF: process.env.REMOTION_CRF ?? '18',
        REMOTION_CONCURRENCY: process.env.REMOTION_CONCURRENCY ?? '1',
      },
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`render exit ${code}`))))
    child.on('error', reject)
  })

  const stat = fs.statSync(outputPath)
  console.log('[test] MP4 OK', outputPath, stat.size, 'bytes')
}

main().catch((err) => {
  console.error('[test] FAILED', err)
  process.exit(1)
})
