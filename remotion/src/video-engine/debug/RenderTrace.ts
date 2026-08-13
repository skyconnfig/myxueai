/**
 * RenderTrace — dev-only trace model for inspecting what each scene actually renders.
 * Production MP4 renders keep this disabled unless XUEAI_RENDER_TRACE=1.
 */

import { getRemotionEnvironment } from 'remotion'
import type { VideoScene } from '@xueai/shared'

export interface RenderTraceData {
  sceneId: string
  sceneIndex: number
  component: string
  purpose?: string
  storyBeat?: string
  durationSec: number
  camera?: string
  shotType?: string
  shotCamera?: string
  uiStepsCount: number
  uiStepTargets: string[]
  captionText?: string
  captionKinetic?: boolean
  audioSfx: string[]
  productDemoDevice?: string
  hasScreenshot: boolean
  simulator?: boolean
}

/** True when the debug overlay should render (Studio / explicit flag). */
export function isRenderTraceEnabled(): boolean {
  try {
    const env = getRemotionEnvironment()
    if (env.isStudio) return true
  } catch {
    // outside Remotion runtime
  }
  const traceFlag =
    typeof globalThis !== 'undefined'
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
          ?.XUEAI_RENDER_TRACE
      : undefined
  return traceFlag === '1'
}

export function buildRenderTrace(
  scene: VideoScene,
  sceneIndex: number,
): RenderTraceData {
  const props = (scene.props ?? {}) as Record<string, unknown>
  const steps = Array.isArray(props.steps) ? props.steps : []
  const sfx = scene.audio?.sfx ?? []
  const compositionAudio = (props.compositionAudio as string[] | undefined) ?? []

  return {
    sceneId: scene.id,
    sceneIndex,
    component: String(scene.component),
    purpose: scene.purpose,
    storyBeat: scene.meta?.storyBeat,
    durationSec: scene.duration,
    camera: scene.camera?.type ?? scene.camera?.shotType,
    shotType: scene.shot?.type,
    shotCamera: scene.shot?.camera,
    uiStepsCount: steps.length,
    uiStepTargets: steps
      .map((s: { target?: string; action?: string }) => s.target ?? s.action ?? '?')
      .filter(Boolean),
    captionText: scene.caption?.text?.slice(0, 40),
    captionKinetic: scene.caption?.kinetic,
    audioSfx: [
      ...sfx.map((e) => e.label ?? 'sfx'),
      ...compositionAudio,
    ],
    productDemoDevice: (props.device as string | undefined) ?? 'browser',
    hasScreenshot: Boolean(props.screenshot ?? scene.media?.image),
    simulator: props.simulator as boolean | undefined,
  }
}
