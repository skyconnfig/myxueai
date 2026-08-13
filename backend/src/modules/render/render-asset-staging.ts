import fs from 'node:fs'
import path from 'node:path'
import type { RenderInput, VideoCompositionJSON } from '@xueai/shared'
import { storagePaths } from '../../config/storage.js'

const remotionPublic = path.resolve(storagePaths.root, '../remotion/public')

function storageUrlToLocalPath(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/storage/')) {
    return path.join(storagePaths.root, url.replace(/^\/storage\//, '').replace(/\//g, path.sep))
  }
  try {
    const parsed = new URL(url)
    const storagePrefix = '/storage/'
    if (parsed.pathname.startsWith(storagePrefix)) {
      return path.join(
        storagePaths.root,
        parsed.pathname.slice(storagePrefix.length).replace(/\//g, path.sep),
      )
    }
  } catch {
    // not a URL
  }
  return null
}

function copyFileSafe(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function stageMediaUrl(
  url: string | undefined,
  stageDir: string,
  renderId: string,
  destName: string,
): string | undefined {
  if (!url) return url
  const local = storageUrlToLocalPath(url)
  if (!local || !fs.existsSync(local)) return url
  const ext = path.extname(local) || path.extname(destName) || '.bin'
  const fileName = destName.includes('.') ? destName : `${destName}${ext}`
  copyFileSafe(local, path.join(stageDir, fileName))
  return `renders/${renderId}/${fileName}`
}

/** Stage scene + composition audio into remotion/public for staticFile() during SSR. */
export function stageRenderAssets(renderId: string, input: RenderInput): RenderInput {
  const stageDir = path.join(remotionPublic, 'renders', renderId)
  fs.mkdirSync(stageDir, { recursive: true })

  const stagedScenes = input.scenes.map((scene) => {
    const image = stageMediaUrl(scene.image, stageDir, renderId, `scene-${scene.order}-image`)
    const video = stageMediaUrl(scene.video, stageDir, renderId, `scene-${scene.order}-video`)
    const audio = stageMediaUrl(scene.audio, stageDir, renderId, `scene-${scene.order}-audio`)

    return { ...scene, image, video, audio }
  })

  const backgroundMusic = input.backgroundMusic?.url
    ? {
        ...input.backgroundMusic,
        url: stageMediaUrl(input.backgroundMusic.url, stageDir, renderId, 'bgm') ?? input.backgroundMusic.url,
      }
    : input.backgroundMusic

  const soundEffects = input.soundEffects?.map((sfx, index) => ({
    ...sfx,
    url: stageMediaUrl(sfx.url, stageDir, renderId, `sfx-${index}`) ?? sfx.url,
  }))

  let composition = input.composition
  if (composition?.audio) {
    composition = {
      ...composition,
      audio: {
        backgroundMusic: composition.audio.backgroundMusic?.url
          ? {
              ...composition.audio.backgroundMusic,
              url:
                stageMediaUrl(composition.audio.backgroundMusic.url, stageDir, renderId, 'composition-bgm') ??
                composition.audio.backgroundMusic.url,
            }
          : composition.audio.backgroundMusic,
        soundEffects: composition.audio.soundEffects?.map((sfx, index) => ({
          ...sfx,
          url:
            stageMediaUrl(sfx.url, stageDir, renderId, `composition-sfx-${index}`) ?? sfx.url,
        })),
      },
    }

    composition = {
      ...composition,
      scenes: composition.scenes.map((scene) => {
        const staged = stagedScenes.find((s) => s.order === scene.order)
        if (!staged) return scene
        return {
          ...scene,
          media: scene.media
            ? {
                ...scene.media,
                image: staged.image ?? scene.media.image,
                video: staged.video ?? scene.media.video,
              }
            : scene.media,
          audio: scene.audio?.voiceUrl
            ? {
                ...scene.audio,
                voiceUrl: staged.audio ?? scene.audio.voiceUrl,
                sfx: scene.audio.sfx?.map((sfx, index) => ({
                  ...sfx,
                  url:
                    stageMediaUrl(sfx.url, stageDir, renderId, `scene-${scene.order}-sfx-${index}`) ??
                    sfx.url,
                })),
              }
            : scene.audio,
        }
      }),
    } satisfies VideoCompositionJSON
  }

  const totalDuration = stagedScenes.reduce((sum, s) => sum + s.duration, 0)

  return {
    ...input,
    duration: Math.max(input.duration, totalDuration),
    scenes: stagedScenes,
    backgroundMusic,
    soundEffects,
    composition,
  }
}

export function cleanupRenderAssets(renderId: string) {
  const stageDir = path.join(remotionPublic, 'renders', renderId)
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true })
  }
}
