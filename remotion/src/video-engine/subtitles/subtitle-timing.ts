export interface SubtitleCue {
  startSec: number
  endSec: number
  text: string
  highlightWords?: string[]
}

export function cuesToFrameRanges(
  cues: SubtitleCue[],
  sceneFromFrame: number,
  fps: number,
): Array<{ from: number; to: number; text: string; highlightWords?: string[] }> {
  return cues.map((cue) => ({
    from: sceneFromFrame + Math.round(cue.startSec * fps),
    to: sceneFromFrame + Math.round(cue.endSec * fps),
    text: cue.text,
    highlightWords: cue.highlightWords,
  }))
}

export function parseSubtitleCues(raw: unknown): SubtitleCue[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const cue = item as Record<string, unknown>
      return {
        startSec: Number(cue.startSec ?? cue.timeSec ?? 0),
        endSec: Number(cue.endSec ?? cue.timeSec ?? 0) + Number(cue.durationSec ?? 2),
        text: String(cue.text ?? cue.event ?? ''),
        highlightWords: Array.isArray(cue.highlightWords)
          ? (cue.highlightWords as string[])
          : undefined,
      }
    })
    .filter((cue) => cue.text.trim().length > 0)
}
