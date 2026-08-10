import type { RenderInput, RenderScene, VideoCompositionJSON } from '@xueai/shared'
import { adaptRenderInput, adaptRenderScene } from './render-input.adapter.js'

/** Convert VideoCompositionJSON back to legacy RenderInput for preview fallbacks */
export function compositionToRenderInput(composition: VideoCompositionJSON): RenderInput {
  return {
    duration: composition.duration,
    ratio: composition.ratio,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    scenes: composition.scenes.map((scene) => ({
      order: scene.order,
      duration: scene.duration,
      text: scene.caption?.text ?? '',
      image: scene.media?.image,
      video: scene.media?.video,
      mediaType: scene.media?.mediaType,
      componentType: String(scene.component),
      purpose: scene.purpose,
      props: scene.props,
      audio: scene.audio?.voiceUrl,
      caption: scene.caption,
      storyBeat: scene.meta?.storyBeat,
      shotType: scene.camera?.shotType,
      cameraMotion: scene.camera?.type,
      lighting: scene.camera?.lighting,
      emotion: scene.meta?.emotion,
      action: scene.meta?.action,
      negativePrompt: scene.meta?.negativePrompt,
      transition: scene.transition,
      sceneType: scene.meta?.sceneType,
    })),
    backgroundMusic: composition.audio?.backgroundMusic,
    soundEffects: composition.audio?.soundEffects,
    composition,
  }
}

export function mergeRenderInputWithComposition(input: RenderInput): RenderInput {
  const composition = input.composition ?? adaptRenderInput(input)
  return { ...compositionToRenderInput(composition), composition }
}

export function renderSceneToLegacy(scene: RenderScene): RenderScene {
  return {
    ...scene,
    componentType: scene.componentType ?? 'cinematic_still',
  }
}

export { adaptRenderScene }
