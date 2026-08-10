import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')

const child = spawn(
  process.execPath,
  [path.join(backendRoot, 'node_modules/tsx/dist/cli.mjs'), path.join(__dirname, 'e2e-saas-demo-scene.ts')],
  { stdio: 'inherit', cwd: backendRoot, env: process.env },
)

child.on('close', (code) => process.exit(code ?? 1))
