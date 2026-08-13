import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../../config/index.js'
import { storagePaths } from '../../config/storage.js'
import { logger } from '../../utils/logger.js'
import type {
  RemotionBrowserStatus,
  RemotionSettingsPatch,
  RemotionSettingsPublic,
  RemotionSettingsStored,
} from './remotion-settings.types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '../../..')
const monorepoRoot = path.resolve(backendRoot, '..')
const remotionRoot = path.join(monorepoRoot, 'remotion')
const SETTINGS_FILE = path.join(storagePaths.root, 'settings', 'remotion.json')

const DEFAULTS = {
  width: 1920,
  height: 1080,
  fps: 30,
}

let stored: RemotionSettingsStored = {}
let updatedAt: string | null = null
let browserStatus: RemotionBrowserStatus = 'unknown'
let browserMessage = '尚未检测'
let browserLastCheckedAt: string | null = null
let browserJobRunning = false

function ensureSettingsDir() {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readFileStore() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { values: {} as RemotionSettingsStored, updatedAt: null as string | null }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as {
      values?: RemotionSettingsStored
      updatedAt?: string
      browser?: { status?: RemotionBrowserStatus; message?: string; lastCheckedAt?: string | null }
    }
    if (raw.browser?.status) {
      browserStatus = raw.browser.status
      browserMessage = raw.browser.message ?? browserMessage
      browserLastCheckedAt = raw.browser.lastCheckedAt ?? null
    }
    return { values: raw.values ?? {}, updatedAt: raw.updatedAt ?? null }
  } catch {
    return { values: {}, updatedAt: null }
  }
}

function writeFileStore() {
  ensureSettingsDir()
  updatedAt = new Date().toISOString()
  fs.writeFileSync(
    SETTINGS_FILE,
    JSON.stringify(
      {
        values: stored,
        updatedAt,
        browser: {
          status: browserStatus,
          message: browserMessage,
          lastCheckedAt: browserLastCheckedAt,
        },
      },
      null,
      2,
    ),
    'utf8',
  )
}

function applyToRuntime(values: RemotionSettingsStored) {
  if (values.crf != null) {
    config.remotion.crf = values.crf
    process.env.REMOTION_CRF = String(values.crf)
  }
  if (values.concurrency != null) {
    config.remotion.concurrency = values.concurrency
    process.env.REMOTION_CONCURRENCY = String(values.concurrency)
  }
  if (values.chromiumHeadless != null) {
    config.remotion.chromiumHeadless = values.chromiumHeadless
    process.env.REMOTION_CHROMIUM_HEADLESS = values.chromiumHeadless ? 'true' : 'false'
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: 'pipe', shell: process.platform === 'win32' })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
    child.on('error', (err) => resolve({ code: 1, stdout, stderr: err.message }))
  })
}

async function checkBrowserInternal(): Promise<{ ok: boolean; message: string }> {
  const scriptPath = path.join(remotionRoot, 'scripts', 'check-browser.mjs')
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, message: '缺少 remotion/scripts/check-browser.mjs' }
  }

  const result = await runCommand(process.execPath, [scriptPath], remotionRoot)
  const line = result.stdout.trim().split('\n').pop() ?? ''
  try {
    const parsed = JSON.parse(line) as { ok?: boolean; message?: string }
    if (parsed.ok) return { ok: true, message: parsed.message ?? 'Chromium 已就绪' }
    return { ok: false, message: parsed.message ?? result.stderr.slice(-200) ?? 'Chromium 未安装' }
  } catch {
    const detail = (result.stderr || result.stdout).slice(-300)
    return {
      ok: false,
      message: detail || `检测失败 (exit ${result.code ?? 'unknown'})`,
    }
  }
}

export function loadRuntimeRemotionSettings() {
  const file = readFileStore()
  stored = file.values
  updatedAt = file.updatedAt
  applyToRuntime(stored)
  if (Object.keys(stored).length > 0) {
    logger('Applied Remotion settings from runtime store')
  }
}

export function getRemotionSettingsPublic(): RemotionSettingsPublic {
  const renderScriptReady = fs.existsSync(path.join(remotionRoot, 'scripts', 'render.mjs'))
  const remotionPackageReady = fs.existsSync(path.join(remotionRoot, 'package.json'))

  return {
    width: stored.width ?? DEFAULTS.width,
    height: stored.height ?? DEFAULTS.height,
    fps: stored.fps ?? DEFAULTS.fps,
    crf: stored.crf ?? config.remotion.crf,
    concurrency: stored.concurrency ?? config.remotion.concurrency,
    chromiumHeadless: stored.chromiumHeadless ?? config.remotion.chromiumHeadless,
    browser: {
      status: browserJobRunning ? 'installing' : browserStatus,
      message: browserMessage,
      lastCheckedAt: browserLastCheckedAt,
    },
    renderScriptReady,
    remotionPackageReady,
    updatedAt,
  }
}

export async function refreshRemotionBrowserStatus(): Promise<RemotionSettingsPublic> {
  if (browserJobRunning) return getRemotionSettingsPublic()

  browserStatus = 'checking'
  browserMessage = '正在检测 Chromium...'
  writeFileStore()

  const result = await checkBrowserInternal()
  browserLastCheckedAt = new Date().toISOString()
  browserStatus = result.ok ? 'ready' : 'missing'
  browserMessage = result.message
  writeFileStore()
  return getRemotionSettingsPublic()
}

export function updateRemotionSettings(patch: RemotionSettingsPatch): RemotionSettingsPublic {
  stored = {
    ...stored,
    ...(patch.width != null ? { width: patch.width } : {}),
    ...(patch.height != null ? { height: patch.height } : {}),
    ...(patch.fps != null ? { fps: patch.fps } : {}),
    ...(patch.crf != null ? { crf: patch.crf } : {}),
    ...(patch.concurrency != null ? { concurrency: patch.concurrency } : {}),
    ...(patch.chromiumHeadless != null ? { chromiumHeadless: patch.chromiumHeadless } : {}),
  }
  applyToRuntime(stored)
  writeFileStore()
  return getRemotionSettingsPublic()
}

export async function ensureRemotionBrowser(): Promise<RemotionSettingsPublic> {
  if (browserJobRunning) {
    return getRemotionSettingsPublic()
  }

  browserJobRunning = true
  browserStatus = 'installing'
  browserMessage = '正在安装 / 校验 Chromium（首次可能需数分钟）...'
  writeFileStore()

  void (async () => {
    try {
      const result = await runCommand(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        ['--filter', 'remotion', 'browser:ensure'],
        monorepoRoot,
      )

      if (result.code !== 0) {
        browserStatus = 'failed'
        browserMessage = (result.stderr || result.stdout).slice(-400) || 'browser:ensure 失败'
        writeFileStore()
        return
      }

      const check = await checkBrowserInternal()
      browserLastCheckedAt = new Date().toISOString()
      browserStatus = check.ok ? 'ready' : 'failed'
      browserMessage = check.ok ? 'Chromium 已配置完成，可开始 MP4 渲染' : check.message
    } catch (error) {
      browserStatus = 'failed'
      browserMessage = error instanceof Error ? error.message : '配置 Chromium 失败'
    } finally {
      browserJobRunning = false
      writeFileStore()
    }
  })()

  return getRemotionSettingsPublic()
}

export async function bootstrapRemotionSettings() {
  loadRuntimeRemotionSettings()
  void refreshRemotionBrowserStatus().catch((err) => {
    logger(`Remotion browser status check skipped: ${err instanceof Error ? err.message : err}`)
  })
}
