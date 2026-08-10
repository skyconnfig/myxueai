import type { VideoCompositionJSON } from '@xueai/shared'
import type { VideoScene } from '@xueai/shared'

export interface SceneTimelineEntry {
  scene: VideoScene
  fromFrame: number
  durationInFrames: number
  toFrame: number
}

export function secToFrames(sec: number, fps: number): number {
  return Math.max(1, Math.round(sec * fps))
}

export function buildSceneTimeline(composition: VideoCompositionJSON): SceneTimelineEntry[] {
  const { fps, scenes } = composition
  let cursor = 0
  return scenes.map((scene) => {
    const durationInFrames = secToFrames(scene.duration, fps)
    const entry: SceneTimelineEntry = {
      scene,
      fromFrame: cursor,
      durationInFrames,
      toFrame: cursor + durationInFrames,
    }
    cursor += durationInFrames
    return entry
  })
}

export function mapCueToFrames(
  cues: Array<{ timeSec: number }>,
  sceneFromFrame: number,
  fps: number,
): number[] {
  return cues.map((cue) => sceneFromFrame + secToFrames(cue.timeSec, fps))
}

export function buildVoiceWindowsFromTimeline(
  timeline: SceneTimelineEntry[],
): Array<{ from: number; to: number }> {
  const windows: Array<{ from: number; to: number }> = []
  for (const entry of timeline) {
    if (entry.scene.audio?.voiceUrl) {
      windows.push({ from: entry.fromFrame, to: entry.toFrame })
    }
  }
  return windows
}

export const timelineEngine = {
  secToFrames,
  buildSceneTimeline,
  mapCueToFrames,
  buildVoiceWindowsFromTimeline,
}
