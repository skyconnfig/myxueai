import type { RenderInput } from '@xueai/shared'

export function buildVoiceWindows(
  scenes: RenderInput['scenes'],
  fps: number,
): Array<{ from: number; to: number }> {
  const windows: Array<{ from: number; to: number }> = []
  let cursor = 0
  for (const scene of scenes) {
    if (scene.audio) {
      const durationFrames = Math.max(1, Math.round(scene.duration * fps))
      windows.push({ from: cursor, to: cursor + durationFrames })
    }
    cursor += Math.max(1, Math.round(scene.duration * fps))
  }
  return windows
}

export function buildVoiceWindowsFromComposition(
  timeline: Array<{ fromFrame: number; toFrame: number; hasVoice: boolean }>,
): Array<{ from: number; to: number }> {
  return timeline
    .filter((entry) => entry.hasVoice)
    .map((entry) => ({ from: entry.fromFrame, to: entry.toFrame }))
}

export interface DuckingSegment {
  from: number
  to: number
  hasVoice: boolean
  bgmIntensity?: string
}

/** Build per-scene ducking segments carrying BGM intensity for smooth ducking. */
export function buildDuckingPlan(
  timeline: Array<{ fromFrame: number; toFrame: number; hasVoice: boolean; bgmIntensity?: string }>,
): DuckingSegment[] {
  return timeline.map((entry) => ({
    from: entry.fromFrame,
    to: entry.toFrame,
    hasVoice: entry.hasVoice,
    bgmIntensity: entry.bgmIntensity,
  }))
}

/** Target BGM multiplier for a given intensity when voice is present. */
export function intensityDuckMultiplier(intensity?: string): number {
  switch (intensity) {
    case 'silent':
      return 0.0
    case 'low':
      return 0.25
    case 'medium':
      return 0.4
    case 'high':
      return 0.55
    case 'swell':
      return 0.6
    default:
      return 0.35
  }
}
