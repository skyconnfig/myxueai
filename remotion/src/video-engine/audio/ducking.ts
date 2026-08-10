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
