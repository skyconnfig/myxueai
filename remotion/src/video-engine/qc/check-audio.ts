import type { VideoCompositionJSON } from '@xueai/shared'
import { compositionToRenderInput } from '../adapters/legacy-bridge.js'

export interface AudioQcIssue {
  scene?: number
  code: string
  message: string
  severity: 'critical' | 'major' | 'minor'
}

export function checkCompositionAudio(composition: VideoCompositionJSON): AudioQcIssue[] {
  const issues: AudioQcIssue[] = []
  const input = compositionToRenderInput(composition)

  if (!input.backgroundMusic?.url) {
    issues.push({
      code: 'NO_BGM',
      message: 'Composition has no background music configured',
      severity: 'minor',
    })
  }

  composition.scenes.forEach((scene) => {
    const hasVoice = Boolean(scene.audio?.voiceUrl)
    const hasCaption = Boolean(scene.caption?.text?.trim())
    if (hasCaption && !hasVoice) {
      issues.push({
        scene: scene.order,
        code: 'CAPTION_WITHOUT_VOICE',
        message: `Scene ${scene.order} has caption but no voice track`,
        severity: 'major',
      })
    }

    if (scene.transition === 'push' && !composition.audio?.soundEffects?.length) {
      issues.push({
        scene: scene.order,
        code: 'PUSH_WITHOUT_SFX',
        message: `Scene ${scene.order} uses push transition but no global SFX configured`,
        severity: 'minor',
      })
    }
  })

  return issues
}

export function checkRenderInputAudio(input: ReturnType<typeof compositionToRenderInput>): AudioQcIssue[] {
  if (input.composition) return checkCompositionAudio(input.composition)
  return checkCompositionAudio({
    meta: { id: 'legacy', version: 1 },
    fps: input.fps,
    width: input.width,
    height: input.height,
    ratio: input.ratio,
    duration: input.duration,
    scenes: [],
    audio: {
      backgroundMusic: input.backgroundMusic,
      soundEffects: input.soundEffects,
    },
  })
}
