import type { RenderInput, RenderScene, VideoCompositionJSON, VideoScene } from '@xueai/shared'
import { normalizeCameraType, normalizeComponentName } from '@xueai/shared'

function adaptRenderScene(scene: RenderScene): VideoScene {
  const cues = scene.props as Record<string, unknown> | undefined
  const captionStyle = (scene.caption?.style ?? {}) as { color?: string; fontSize?: number }

  return {
    id: `scene-${scene.order}`,
    order: scene.order,
    purpose: scene.purpose ?? scene.storyBeat,
    component: normalizeComponentName(scene.componentType),
    duration: scene.duration,
    transition: scene.transition,
    camera: {
      shotType: scene.shotType,
      type: normalizeCameraType(scene.cameraMotion),
      lighting: scene.lighting,
    },
    animation: {
      enter: 'spring',
      springPreset: 'smooth',
    },
    caption: scene.caption
      ? {
          text: scene.caption.text,
          style: scene.caption.style,
        }
      : { text: scene.text },
    audio: scene.audio ? { voiceUrl: scene.audio } : undefined,
    props: scene.props,
    media: {
      image: scene.image,
      video: scene.video,
      mediaType: scene.mediaType,
    },
    meta: {
      emotion: scene.emotion,
      storyBeat: scene.storyBeat,
      action: scene.action,
      negativePrompt: scene.negativePrompt,
      sceneType: scene.sceneType,
    },
  }
}

export function adaptRenderInput(input: RenderInput): VideoCompositionJSON {
  if (input.composition) {
    return input.composition
  }

  return {
    meta: { id: 'legacy-render-input', version: 1 },
    fps: input.fps,
    width: input.width,
    height: input.height,
    ratio: input.ratio,
    duration: input.duration,
    scenes: input.scenes.map(adaptRenderScene),
    audio: {
      backgroundMusic: input.backgroundMusic,
      soundEffects: input.soundEffects,
    },
  }
}

export { adaptRenderScene }
