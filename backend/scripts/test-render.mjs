import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')
const remotionRoot = path.resolve(backendRoot, '../remotion')

// Dynamic import compiled ts - use tsx to run a small inline script instead
const projectId = process.argv[2] ?? 'cmsmibjm60001w130wtctxgnw'

const child = spawn(
  process.execPath,
  [
    path.join(backendRoot, 'node_modules/tsx/dist/cli.mjs'),
    path.join(__dirname, 'test-render-run.ts'),
    projectId,
  ],
  { stdio: 'inherit', cwd: backendRoot, env: process.env },
)

child.on('close', (code) => process.exit(code ?? 1))
