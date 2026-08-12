import type { CompositionTemplateJSON, VideoCompositionJSON, VideoScene } from '@xueai/shared'
import {
  RATIO_DIMENSIONS,
  buildDefaultBeforeAfterProps,
  buildDefaultCTAProps,
  buildDefaultDashboardProps,
  buildDefaultFeatureRevealProps,
  buildDefaultProductDemoSteps,
  computeRhythmIntent,
  generateSubtitleCues,
  normalizeCameraType,
  normalizeComponentName,
} from '@xueai/shared'
import { prisma } from '../../config/database.js'
import { config } from '../../config/index.js'
import { AppError } from '../../middleware/error-handler.js'
import { compositionTemplateLoader } from './composition-template.loader.js'

function resolveAssetUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = config.remotion.publicUrl.replace(/\/$/, '')
  if (url.startsWith('/storage/')) return `${base}${url}`
  if (url.startsWith('storage/')) return `${base}/${url}`
  return `${base}/storage/${url}`
}

type DirectorCues = {
  shot?: { type?: string; camera?: string; speed?: number; intensity?: number }
  visualLayer?: { background?: string; foreground?: string; overlay?: string }
  motion?: { camera?: string; effect?: string }
  audio?: { sfx?: string }
  captionStyle?: {
    preset?: 'tech' | 'documentary' | 'commercial'
    animation?: 'scale' | 'fade' | 'spring' | 'highlight'
    kinetic?: boolean
  }
  productDemo?: {
    device?: 'browser' | 'phone' | 'both'
    features?: Array<{ index: number; x: number; y: number; label: string }>
    metric?: { label: string; value: number; suffix?: string }
  }
}

type SceneCues = {
  captionStyle?: { color?: string; fontSize?: number }
  sceneProps?: Record<string, unknown>
  steps?: unknown[]
  director?: DirectorCues
}

function resolveSfxUrl(label: string): string | null {
  if (label.startsWith('http://') || label.startsWith('https://')) return label
  const map: Record<string, string | undefined> = {
    whoosh: process.env.SFX_WHOOSH_URL,
    click: process.env.SFX_CLICK_URL,
    transition: process.env.SFX_WHOOSH_URL,
    impact: process.env.SFX_IMPACT_URL,
    boom: process.env.SFX_IMPACT_URL,
    riser: process.env.SFX_RISER_URL,
    sparkle: process.env.SFX_SPARKLE_URL,
    sweep: process.env.SFX_WHOOSH_URL,
  }
  return map[label.toLowerCase()] ?? null
}

function loadTemplateBlueprint(slug: string): CompositionTemplateJSON | null {
  try {
    return compositionTemplateLoader.load(slug)
  } catch {
    return null
  }
}

/** Extract number/percentage tokens from narration for subtitle emphasis. */
function extractNumbers(text: string): string[] | undefined {
  const matches = text.match(/\d+(\.\d+)?%?|[一二三四五六七八九十百千万亿]+/g)
  return matches && matches.length ? matches : undefined
}

function blueprintDuration(
  blueprint: CompositionTemplateJSON,
  order: number,
  projectDuration: number,
  fallback: number,
): number {
  const entry = blueprint.sceneBlueprint.find((s) => s.order === order)
  if (!entry) return fallback
  return Math.max(1, Math.round(projectDuration * entry.durationRatio))
}

function applyBlueprintToScene(
  scene: VideoScene,
  blueprint: CompositionTemplateJSON,
  order: number,
): VideoScene {
  const entry = blueprint.sceneBlueprint.find((s) => s.order === order)
  if (!entry) return scene

  const componentFromDb = scene.component !== 'CinematicFallback' ? scene.component : undefined

  return {
    ...scene,
    purpose: scene.purpose ?? entry.purpose,
    component: normalizeComponentName(componentFromDb ?? scene.component ?? entry.component),
    transition: scene.transition ?? entry.transition ?? scene.transition,
    camera: {
      shotType: scene.camera?.shotType ?? entry.camera?.shotType,
      type: normalizeCameraType(scene.camera?.type ?? entry.camera?.type),
      speed: scene.camera?.speed ?? entry.camera?.speed,
      lighting: scene.camera?.lighting,
    },
  }
}

function extractSceneProps(scene: {
  cues: unknown
  componentType: string | null
  purpose: string | null
  processDesc: string | null
  resultDesc: string | null
  duration: number
  description: string
  voiceText: string | null
}): Record<string, unknown> | undefined {
  const cues = scene.cues as SceneCues | null
  const directorProductDemo = cues?.director?.productDemo

  // ProductDemoV2 — cinematic device choreography. Build base props then merge
  // the director's productDemo block (device / features / metric) on top.
  if (scene.componentType === 'ProductDemoV2' || scene.componentType === 'product_demo_v2') {
    const base = cues?.sceneProps ?? {
      title: scene.description.slice(0, 80),
      subtitle: scene.processDesc ?? undefined,
      url: 'app.demo/dashboard',
      steps: buildDefaultProductDemoSteps({
        process: scene.processDesc ?? undefined,
        result: scene.resultDesc ?? scene.voiceText ?? undefined,
        duration: scene.duration,
      }),
      theme: 'dark',
    }
    return {
      ...base,
      ...(directorProductDemo?.device ? { device: directorProductDemo.device } : {}),
      ...(directorProductDemo?.features ? { features: directorProductDemo.features } : {}),
      ...(directorProductDemo?.metric ? { metric: directorProductDemo.metric } : {}),
    }
  }

  if (cues?.sceneProps) return cues.sceneProps

  if (scene.componentType === 'ProductDemo' || scene.purpose === 'demo') {
    return {
      title: scene.description.slice(0, 80),
      subtitle: scene.processDesc ?? undefined,
      url: 'app.demo/dashboard',
      steps: buildDefaultProductDemoSteps({
        process: scene.processDesc ?? undefined,
        result: scene.resultDesc ?? scene.voiceText ?? undefined,
        duration: scene.duration,
      }),
      theme: 'dark',
    }
  }

  if (scene.componentType === 'BrowserWindow' || scene.purpose === 'solution') {
    return {
      title: scene.description.slice(0, 80),
      url: 'app.demo',
      body: scene.processDesc ?? undefined,
      theme: 'dark',
    }
  }

  if (scene.componentType === 'DashboardAnimation' || scene.purpose === 'result') {
    return buildDefaultDashboardProps({
      title: scene.description.slice(0, 80),
      result: scene.resultDesc ?? undefined,
    }) as unknown as Record<string, unknown>
  }

  if (scene.componentType === 'FeatureReveal') {
    return buildDefaultFeatureRevealProps({
      headline: scene.description.slice(0, 80),
      process: scene.processDesc ?? undefined,
      result: scene.resultDesc ?? undefined,
    }) as unknown as Record<string, unknown>
  }

  if (scene.componentType === 'BeforeAfter') {
    return buildDefaultBeforeAfterProps({
      beforeText: scene.processDesc ?? undefined,
      afterText: scene.resultDesc ?? undefined,
    }) as unknown as Record<string, unknown>
  }

  if (scene.componentType === 'CTA' || scene.purpose === 'cta') {
    return buildDefaultCTAProps({
      headline: scene.voiceText ?? scene.description.slice(0, 80),
      subline: scene.resultDesc ?? undefined,
    }) as unknown as Record<string, unknown>
  }

  return undefined
}

export class CompositionBuilder {
  async build(projectId: string): Promise<VideoCompositionJSON> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        assets: { include: { audioMeta: true } },
        template: true,
      },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const dims = RATIO_DIMENSIONS[project.ratio] ?? RATIO_DIMENSIONS['9:16']
    const fps = 30
    const templateBlueprint = project.template?.slug
      ? loadTemplateBlueprint(project.template.slug)
      : null

    let sceneStartFrame = 0
    const soundEffects: NonNullable<VideoCompositionJSON['audio']>['soundEffects'] = []
    const sfxWhooshUrl = process.env.SFX_WHOOSH_URL ?? ''

    const scenes: VideoScene[] = project.scenes.map((scene) => {
      const imageAsset = project.assets.find((a) => a.sceneId === scene.id && a.type === 'IMAGE')
      const audioAsset = project.assets.find((a) => a.sceneId === scene.id && a.type === 'AUDIO')
      const videoAsset = project.assets.find((a) => a.sceneId === scene.id && a.type === 'VIDEO')

      const audioDuration = audioAsset?.audioMeta?.duration
      const fallbackDuration = templateBlueprint
        ? blueprintDuration(templateBlueprint, scene.order, project.duration, scene.duration)
        : scene.duration
      const duration =
        audioDuration && audioDuration > 0
          ? Math.max(1, Math.ceil(audioDuration))
          : fallbackDuration

      const blueprintEntry = templateBlueprint?.sceneBlueprint.find((b) => b.order === scene.order)
      const templateStyle = templateBlueprint?.style
      // Default to CUT — hard cuts feel cinematic; animated transitions are reserved for
      // moments the director explicitly marks. Template style may override the default.
      const resolvedTransition =
        scene.transition ??
        blueprintEntry?.transition ??
        templateStyle?.defaultTransition ??
        (scene.order === 1 ? 'cut' : 'cut')
      if (scene.order > 1 && resolvedTransition === 'push' && sfxWhooshUrl) {
        soundEffects.push({
          url: sfxWhooshUrl,
          startFrame: Math.max(0, sceneStartFrame - Math.round(fps * 0.15)),
          durationInFrames: Math.round(fps * 0.5),
          volume: 0.45,
          label: 'transition-whoosh',
        })
      }
      sceneStartFrame += Math.max(1, Math.round(duration * fps))

      const videoUrl = scene.videoUrl ?? videoAsset?.url
      const hasVideo = Boolean(videoUrl)
      const imageUrl = scene.imageUrl ?? imageAsset?.url
      const mediaType: 'image' | 'video' | 'both' =
        hasVideo && imageUrl ? 'both' : hasVideo ? 'video' : 'image'

      const cues = scene.cues as SceneCues | null
      const director = cues?.director
      const resolvedComponentType =
        scene.componentType ?? blueprintEntry?.component ?? null
      const resolvedPurpose = scene.purpose ?? blueprintEntry?.purpose ?? null
      const resolvedShotType = scene.shotType ?? blueprintEntry?.camera?.shotType ?? undefined
      const resolvedCameraMotion =
        scene.cameraMotion ?? blueprintEntry?.camera?.type ?? undefined

      const props = extractSceneProps({
        cues: scene.cues,
        componentType: resolvedComponentType,
        purpose: resolvedPurpose,
        processDesc: scene.processDesc,
        resultDesc: scene.resultDesc,
        duration,
        description: scene.description,
        voiceText: scene.voiceText,
      })

      // Subtitle Engine — TTS-synced cues from narration, distributed by char count
      const narrationText = scene.voiceText ?? scene.description ?? ''
      const subtitleCues = generateSubtitleCues(narrationText, duration)
      const propsWithSubtitles = subtitleCues.length
        ? { ...(props ?? {}), subtitleCues }
        : props

      const sceneSfxLabel = scene.soundEffect ?? director?.audio?.sfx ?? undefined
      const sceneSfxUrl = sceneSfxLabel ? resolveSfxUrl(sceneSfxLabel) : null
      // Rhythm Engine — derive bgmIntensity from beat/emotion/duration when the
      // director didn't set one explicitly (blueprint per-scene override → rhythm).
      const rhythm = computeRhythmIntent({
        storyBeat: scene.storyBeat ?? resolvedPurpose,
        emotion: scene.emotion,
        durationSec: duration,
      })
      const bgmIntensity =
        scene.bgmIntensity ?? blueprintEntry?.bgmIntensity ?? rhythm.bgmIntensity

      // ── Director-level Scene JSON (AI Director upgrade) ──
      // Map the director blocks into the Remotion VideoScene so the Scene Engine
      // (Shot Engine / Caption Engine 2.0 / Audio Engine) can consume them.
      const directorShot = director?.shot
      const shotConfig = directorShot
        ? {
            type: directorShot.type as
              | 'establishing'
              | 'wide'
              | 'medium'
              | 'close'
              | 'macro'
              | 'detail'
              | undefined,
            camera: directorShot.camera as
              | 'push_in'
              | 'pull_out'
              | 'pan_left'
              | 'pan_right'
              | 'orbit'
              | 'handheld'
              | 'parallax'
              | undefined,
            speed: directorShot.speed,
            intensity: directorShot.intensity,
          }
        : undefined

      const built: VideoScene = {
        id: scene.id,
        order: scene.order,
        purpose: resolvedPurpose ?? scene.storyBeat ?? undefined,
        component: normalizeComponentName(resolvedComponentType),
        duration,
        transition: resolvedTransition,
        camera: {
          shotType: resolvedShotType,
          type: normalizeCameraType(resolvedCameraMotion),
          speed: blueprintEntry?.camera?.speed,
          lighting: scene.lighting ?? undefined,
        },
        animation: { enter: 'spring', springPreset: 'smooth' },
        // Shot Engine — director's `shot` block drives multi-sub-shot cinematography
        shot: shotConfig,
        // Director visual layer — three-layer composite for cinematic depth
        visualLayer: director?.visualLayer,
        // Director motion — camera movement + in-frame effect descriptions
        motion: director?.motion,
        caption: {
          text: scene.voiceText ?? scene.description,
          style: {
            color: cues?.captionStyle?.color ?? templateStyle?.captionColor ?? '#ffffff',
            fontSize: cues?.captionStyle?.fontSize ?? templateStyle?.captionFontSize ?? 38,
            font: templateStyle?.captionFont,
            highlightColor: templateStyle?.accentColor,
            fontWeight: templateStyle?.captionWeight,
          },
          highlightWords: scene.voiceText ? extractNumbers(scene.voiceText) : undefined,
          emphasizeNumbers: templateStyle?.emphasizeNumbers,
          // Caption Engine 2.0 — director's `captionStyle` block drives kinetic typography
          kinetic: director?.captionStyle?.kinetic,
          preset: director?.captionStyle?.preset,
          animation: director?.captionStyle?.animation,
        },
        audio: audioAsset?.url
          ? {
              voiceUrl: resolveAssetUrl(audioAsset.url),
              sfx: sceneSfxUrl
                ? [{ url: sceneSfxUrl, atSec: 0, volume: 0.45, label: sceneSfxLabel }]
                : undefined,
              bgmIntensity,
            }
          : sceneSfxUrl
            ? { sfx: [{ url: sceneSfxUrl, atSec: 0, volume: 0.45, label: sceneSfxLabel }], bgmIntensity }
            : { bgmIntensity },
        props: propsWithSubtitles,
        media: {
          image: imageUrl ? resolveAssetUrl(imageUrl) : undefined,
          video: videoUrl ? resolveAssetUrl(videoUrl) : undefined,
          mediaType,
        },
        meta: {
          emotion: scene.emotion ?? undefined,
          storyBeat: scene.storyBeat ?? undefined,
          viewerTask: scene.viewerTask ?? undefined,
          action: scene.action ?? undefined,
          negativePrompt: scene.negativePrompt ?? undefined,
          sceneType: scene.sceneType ?? undefined,
        },
      }

      return templateBlueprint
        ? applyBlueprintToScene(built, templateBlueprint, scene.order)
        : built
    })

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
    const musicAsset = project.assets.find((a) => a.type === 'MUSIC' && !a.sceneId)

    let templateMeta: VideoCompositionJSON['meta'] | undefined
    if (templateBlueprint) {
      templateMeta = templateBlueprint.meta
    } else if (project.template?.slug) {
      try {
        templateMeta = compositionTemplateLoader.load(project.template.slug).meta
      } catch {
        templateMeta = undefined
      }
    }

    return {
      meta: {
        id: templateMeta?.id ?? project.template?.slug ?? project.id,
        title: templateMeta?.title ?? project.name,
        templateSlug: templateMeta?.templateSlug ?? project.template?.slug,
        version: templateMeta?.version ?? 1,
      },
      fps,
      width: dims.width,
      height: dims.height,
      ratio: project.ratio,
      duration: Math.max(project.duration, totalDuration),
      scenes,
      audio: {
        backgroundMusic: musicAsset?.url
          ? { url: resolveAssetUrl(musicAsset.url), volume: project.bgmVolume ?? templateBlueprint?.style?.bgmVolume ?? 0.22 }
          : undefined,
        soundEffects: soundEffects.length ? soundEffects : undefined,
      },
    }
  }
}

export const compositionBuilder = new CompositionBuilder()
