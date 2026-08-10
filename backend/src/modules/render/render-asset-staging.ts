import fs from 'node:fs'
import path from 'node:path'
import type { RenderInput } from '@xueai/shared'
import { storagePaths } from '../../config/storage.js'

const remotionPublic = path.resolve(storagePaths.root, '../remotion/public')

function storageUrlToLocalPath(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/storage/')) {
    return path.join(storagePaths.root, url.replace(/^\/storage\//, '').replace(/\//g, path.sep))
  }
  return null
}

function copyFileSafe(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

/** Stage scene assets into remotion/public for staticFile() access during render. */
export function stageRenderAssets(renderId: string, input: RenderInput): RenderInput {
  const stageDir = path.join(remotionPublic, 'renders', renderId)
  fs.mkdirSync(stageDir, { recursive: true })

  const stagedScenes = input.scenes.map((scene) => {
    let image = scene.image
    let video = scene.video
    let audio = scene.audio

    const imageLocal = storageUrlToLocalPath(scene.image)
    if (imageLocal && fs.existsSync(imageLocal)) {
      const ext = path.extname(imageLocal) || '.png'
      const destName = `scene-${scene.order}-image${ext}`
      copyFileSafe(imageLocal, path.join(stageDir, destName))
      image = `renders/${renderId}/${destName}`
    }

    const videoLocal = storageUrlToLocalPath(scene.video)
    if (videoLocal && fs.existsSync(videoLocal)) {
      const ext = path.extname(videoLocal) || '.mp4'
      const destName = `scene-${scene.order}-video${ext}`
      copyFileSafe(videoLocal, path.join(stageDir, destName))
      video = `renders/${renderId}/${destName}`
    }

    const audioLocal = storageUrlToLocalPath(scene.audio)
    if (audioLocal && fs.existsSync(audioLocal)) {
      const ext = path.extname(audioLocal) || '.mp3'
      const destName = `scene-${scene.order}-audio${ext}`
      copyFileSafe(audioLocal, path.join(stageDir, destName))
      audio = `renders/${renderId}/${destName}`
    }

    return { ...scene, image, video, audio }
  })

  const totalDuration = stagedScenes.reduce((sum, s) => sum + s.duration, 0)

  return {
    ...input,
    duration: Math.max(input.duration, totalDuration),
    scenes: stagedScenes,
  }
}

export function cleanupRenderAssets(renderId: string) {
  const stageDir = path.join(remotionPublic, 'renders', renderId)
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true })
  }
}
