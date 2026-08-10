import type { RenderInput } from '@xueai/shared'
import { compositionBuilder } from './composition.builder.js'

export class RenderInputBuilder {
  async build(projectId: string): Promise<RenderInput> {
    const composition = await compositionBuilder.build(projectId)

    const scenes = composition.scenes.map((scene) => ({
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
      caption: scene.caption
        ? {
            text: scene.caption.text,
            style: scene.caption.style,
          }
        : undefined,
      storyBeat: scene.meta?.storyBeat,
      shotType: scene.camera?.shotType,
      cameraMotion: scene.camera?.type,
      lighting: scene.camera?.lighting,
      emotion: scene.meta?.emotion,
      action: scene.meta?.action,
      negativePrompt: scene.meta?.negativePrompt,
      transition: scene.transition,
      sceneType: scene.meta?.sceneType,
    }))

    return {
      duration: composition.duration,
      ratio: composition.ratio,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      scenes,
      backgroundMusic: composition.audio?.backgroundMusic,
      soundEffects: composition.audio?.soundEffects,
      composition,
    }
  }
}

export const renderInputBuilder = new RenderInputBuilder()
