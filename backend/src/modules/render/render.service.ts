import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RenderInput } from '@xueai/shared'
import { AppError } from '../../middleware/error-handler.js'
import { ProjectStatus } from '../../constants/status.js'
import { config } from '../../config/index.js'
import { storagePaths } from '../../config/storage.js'
import { composeService } from '../compose/compose.service.js'
import { projectRepository } from '../project/project.repository.js'
import { renderInputBuilder } from './render-input.builder.js'
import { renderRepository } from './render.repository.js'
import { cleanupRenderAssets, stageRenderAssets } from './render-asset-staging.js'
import { assertRenderInputReady } from './render-validate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remotionRoot = path.resolve(__dirname, '../../../../remotion')

const PROGRESS_RE = /XUEAI_PROGRESS:(\d+)/g

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function publicUrl(relativePath: string) {
  return `/storage/${relativePath.replace(/\\/g, '/')}`
}

function parseProgressLines(text: string): number[] {
  const values: number[] = []
  for (const match of text.matchAll(PROGRESS_RE)) {
    const pct = Number(match[1])
    if (Number.isFinite(pct)) values.push(Math.min(100, Math.max(0, pct)))
  }
  return values
}

async function runRemotionRender(
  inputPath: string,
  outputPath: string,
  renderId: string,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const scriptPath = path.join(remotionRoot, 'scripts', 'render.mjs')
    if (!fs.existsSync(scriptPath)) {
      resolve({ ok: false, error: 'Remotion render script not found' })
      return
    }

    const child = spawn(
      process.execPath,
      [scriptPath, inputPath, outputPath],
      {
        cwd: remotionRoot,
        stdio: 'pipe',
        env: {
          ...process.env,
          REMOTION_CRF: String(config.remotion.crf),
          REMOTION_CONCURRENCY: String(config.remotion.concurrency),
          REMOTION_CHROMIUM_HEADLESS: config.remotion.chromiumHeadless ? 'true' : 'false',
        },
      },
    )

    let stdout = ''
    let stderr = ''
    let lastPersisted = -1

    const persistProgress = (pct: number) => {
      if (pct <= lastPersisted) return
      lastPersisted = pct
      void renderRepository.update(renderId, { progress: pct })
    }

    const handleChunk = (chunk: Buffer) => {
      for (const pct of parseProgressLines(chunk.toString())) {
        persistProgress(pct)
      }
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
      handleChunk(chunk)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
      handleChunk(chunk)
    })

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        persistProgress(100)
        resolve({ ok: true })
        return
      }
      const detail = (stderr || stdout).slice(-800)
      console.warn('[render] Remotion render failed:', detail)
      resolve({ ok: false, error: detail || `Remotion exited with code ${code ?? 'unknown'}` })
    })

    child.on('error', (err) => {
      resolve({ ok: false, error: err.message })
    })
  })
}

function writeFallbackPreview(
  input: {
    scenes: Array<{ text: string; image?: string; audio?: string; duration: number }>
  },
  outputPath: string,
) {
  const slides = input.scenes
    .map(
      (s, i) =>
        `<section style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0F19;color:#fff;padding:2rem;text-align:center;flex-direction:column">
          ${s.audio ? `<audio src="${s.audio}" autoplay controls style="margin-bottom:1rem;width:min(320px,80%)"></audio>` : ''}
          ${s.image ? `<img src="${s.image}" style="max-width:80%;max-height:60vh;border-radius:12px;margin-bottom:1rem"/>` : ''}
          <p style="font-size:1.5rem">${s.text}</p>
          <small style="color:#64748B">Scene ${i + 1} · ${s.duration}s</small>
        </section>`,
    )
    .join('\n')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>XueAI Preview</title></head><body style="margin:0;font-family:system-ui">${slides}</body></html>`
  fs.writeFileSync(outputPath, html, 'utf8')
}

export class RenderService {
  async startRender(projectId: string) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '没有可渲染的分镜')
    }

    const renderInput =
      composeService.getComposedInput(projectId) ?? (await renderInputBuilder.build(projectId))
    const render = await renderRepository.create({
      projectId,
      composition: 'VideoComposition',
      width: renderInput.width,
      height: renderInput.height,
      fps: renderInput.fps,
    })

    const stagedInput = stageRenderAssets(render.id, renderInput)
    const qcIssues = assertRenderInputReady(stagedInput)
    const majors = qcIssues.filter((i) => i.severity === 'major')
    if (majors.length) {
      console.warn('[render] Pre-render QC warnings:', majors.map((i) => i.message).join('; '))
    }
    const renderDir = path.join(storagePaths.renders, render.id)
    fs.mkdirSync(renderDir, { recursive: true })

    const inputPath = path.join(renderDir, 'input.json')
    fs.writeFileSync(inputPath, JSON.stringify(stagedInput, null, 2), 'utf8')

    await renderRepository.update(render.id, { status: 'RUNNING', progress: 0 })
    await projectRepository.update(projectId, { status: ProjectStatus.RENDERING })

    void this.executeRender(render.id, projectId, renderInput).catch((err) => {
      console.error('[render] Background render failed:', err)
    })

    return {
      renderId: render.id,
      status: 'RUNNING',
      progress: 0,
    }
  }

  async startRenderAndWait(projectId: string, onProgress?: (progress: number) => void) {
    const started = await this.startRender(projectId)
    onProgress?.(started.progress)

    while (true) {
      const render = await this.getRender(started.renderId)
      onProgress?.(render.progress)
      if (render.status === 'SUCCESS') {
        return {
          renderId: render.id,
          outputUrl: render.outputUrl ?? '',
          usedRemotion: Boolean(render.outputUrl?.endsWith('.mp4')),
          format: render.outputUrl?.endsWith('.mp4') ? 'mp4' : 'preview',
        }
      }
      if (render.status === 'FAILED') {
        throw new AppError(500, 'RENDER_FAILED', render.error ?? '渲染失败')
      }
      await sleep(1500)
    }
  }

  private async executeRender(renderId: string, projectId: string, renderInput: RenderInput) {
    const renderDir = path.join(storagePaths.renders, renderId)
    const inputPath = path.join(renderDir, 'input.json')
    const mp4Path = path.join(renderDir, 'output.mp4')
    const previewPath = path.join(renderDir, 'preview.html')

    await renderRepository.update(renderId, { progress: 5 })

    const remotionResult = await runRemotionRender(inputPath, mp4Path, renderId)

    let outputUrl: string
    if (remotionResult.ok) {
      outputUrl = publicUrl(path.relative(storagePaths.root, mp4Path))
    } else {
      writeFallbackPreview(renderInput, previewPath)
      outputUrl = publicUrl(path.relative(storagePaths.root, previewPath))
    }

    cleanupRenderAssets(renderId)

    if (remotionResult.ok) {
      await renderRepository.update(renderId, {
        status: 'SUCCESS',
        outputUrl,
        progress: 100,
        error: null,
      })
      await projectRepository.update(projectId, {
        status: ProjectStatus.COMPLETED,
        videoUrl: outputUrl,
      })
      return
    }

    await renderRepository.update(renderId, {
      status: 'FAILED',
      outputUrl,
      progress: 100,
      error: remotionResult.error?.slice(0, 2000) ?? 'Render failed',
    })
    await projectRepository.update(projectId, {
      status: ProjectStatus.FAILED,
      videoUrl: outputUrl,
    })
  }

  async getRender(id: string) {
    const render = await renderRepository.findById(id)
    if (!render) throw new AppError(404, 'RENDER_NOT_FOUND', '渲染任务不存在')
    return {
      id: render.id,
      projectId: render.projectId,
      composition: render.composition,
      outputUrl: render.outputUrl,
      width: render.width,
      height: render.height,
      fps: render.fps,
      status: render.status,
      progress: render.progress,
      error: render.error ?? null,
      createdAt: render.createdAt.toISOString(),
      updatedAt: render.updatedAt.toISOString(),
    }
  }

  async listByProject(projectId: string) {
    const renders = await renderRepository.findByProjectId(projectId)
    return renders.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      outputUrl: r.outputUrl,
      status: r.status,
      progress: r.progress,
      error: r.error ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  }
}

export const renderService = new RenderService()
