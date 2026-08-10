import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AppError } from '../../middleware/error-handler.js'
import { ProjectStatus } from '../../constants/status.js'
import { storagePaths } from '../../config/storage.js'
import { projectRepository } from '../project/project.repository.js'
import { renderInputBuilder } from './render-input.builder.js'
import { renderRepository } from './render.repository.js'
import { cleanupRenderAssets, stageRenderAssets } from './render-asset-staging.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const remotionRoot = path.resolve(__dirname, '../../../../remotion')

function publicUrl(relativePath: string) {
  return `/storage/${relativePath.replace(/\\/g, '/')}`
}

async function runRemotionRender(inputPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const scriptPath = path.join(remotionRoot, 'scripts', 'render.mjs')
    if (!fs.existsSync(scriptPath)) {
      resolve(false)
      return
    }

    const child = spawn(
      process.execPath,
      [scriptPath, inputPath, outputPath],
      { cwd: remotionRoot, stdio: 'pipe', env: process.env },
    )

    let stderr = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) resolve(true)
      else {
        console.warn('[render] Remotion render failed:', stderr.slice(-500))
        resolve(false)
      }
    })

    child.on('error', () => resolve(false))
  })
}

function writeFallbackPreview(inputPath: string, outputPath: string) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as {
    scenes: Array<{ text: string; image?: string; duration: number }>
  }
  const slides = input.scenes
    .map(
      (s, i) =>
        `<section style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0F19;color:#fff;padding:2rem;text-align:center">
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
  async startRender(projectId: string, onProgress?: (progress: number) => void) {
    const project = await projectRepository.findById(projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '没有可渲染的分镜')
    }

    const renderInput = await renderInputBuilder.build(projectId)
    const render = await renderRepository.create({
      projectId,
      composition: 'VideoComposition',
      width: renderInput.width,
      height: renderInput.height,
      fps: renderInput.fps,
    })

    const stagedInput = stageRenderAssets(render.id, renderInput)

    const renderDir = path.join(storagePaths.renders, render.id)
    fs.mkdirSync(renderDir, { recursive: true })

    const inputPath = path.join(renderDir, 'input.json')
    const mp4Path = path.join(renderDir, 'output.mp4')
    const previewPath = path.join(renderDir, 'preview.html')

    fs.writeFileSync(inputPath, JSON.stringify(stagedInput, null, 2), 'utf8')
    onProgress?.(10)

    await renderRepository.update(render.id, { status: 'RUNNING' })
    await projectRepository.update(projectId, { status: ProjectStatus.RENDERING })
    onProgress?.(30)

    const remotionOk = await runRemotionRender(inputPath, mp4Path)
    onProgress?.(80)

    let outputUrl: string
    if (remotionOk) {
      outputUrl = publicUrl(path.relative(storagePaths.root, mp4Path))
    } else {
      writeFallbackPreview(inputPath, previewPath)
      outputUrl = publicUrl(path.relative(storagePaths.root, previewPath))
    }

    cleanupRenderAssets(render.id)

    await renderRepository.update(render.id, { status: 'SUCCESS', outputUrl })
    await projectRepository.update(projectId, {
      status: ProjectStatus.COMPLETED,
      videoUrl: outputUrl,
    })
    onProgress?.(100)

    return {
      renderId: render.id,
      outputUrl,
      usedRemotion: remotionOk,
    }
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
      createdAt: render.createdAt.toISOString(),
    }
  }

  async listByProject(projectId: string) {
    const renders = await renderRepository.findByProjectId(projectId)
    return renders.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      outputUrl: r.outputUrl,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }))
  }
}

export const renderService = new RenderService()
