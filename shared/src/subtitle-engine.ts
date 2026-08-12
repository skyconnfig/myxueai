/**
 * Subtitle Engine — generates TTS-synced subtitle cues from narration text.
 *
 * Cues are split by sentence/phrase boundaries and timed proportionally to
 * character count within the scene's actual TTS duration (NOT evenly split).
 * This keeps subtitles riding the narration rhythm instead of drifting.
 */

export interface SubtitleCue {
  startSec: number
  endSec: number
  text: string
  /** words/numbers to render highlighted/emphasized */
  highlightWords?: string[]
}

/** Chinese + western sentence/clause terminators. */
const CLAUSE_SPLIT = /([。！？!?；;]|[\n\r]+)/
/** Soft clause separators used for further splitting long lines. */
const SOFT_SPLIT = /[，,、：:——]/

/**
 * Split narration into short, screen-friendly phrases.
 * Long clauses are further split on soft separators or by max length.
 */
export function splitNarration(text: string, maxLen = 18): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const out: string[] = []
  // First split into hard clauses
  const hardParts = cleaned
    .split(CLAUSE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s && !CLAUSE_SPLIT.test(s))

  for (const part of hardParts) {
    if (part.length <= maxLen) {
      out.push(part)
      continue
    }
    // Split long clause on soft separators
    const softParts = part
      .split(SOFT_SPLIT)
      .map((s) => s.trim())
      .filter(Boolean)
    if (softParts.length > 1) {
      let buf = ''
      for (const sp of softParts) {
        if ((buf + sp).length <= maxLen) {
          buf = buf ? `${buf}、${sp}` : sp
        } else {
          if (buf) out.push(buf)
          buf = sp
        }
      }
      if (buf) out.push(buf)
    } else {
      // No soft separator — hard-wrap by maxLen
      for (let i = 0; i < part.length; i += maxLen) {
        out.push(part.slice(i, i + maxLen))
      }
    }
  }
  return out
}

/** Extract candidate highlight words (numbers, key terms after 「」『』, quoted). */
function extractHighlights(text: string): string[] {
  const highlights: string[] = []
  // Numbers (Arabic + Chinese numerals) and percentages
  const numMatches = text.match(/\d+(\.\d+)?%?|[一二三四五六七八九十百千万亿]+/g)
  if (numMatches) highlights.push(...numMatches.filter((n) => n.length >= 1))
  // Quoted / bracketed key terms
  const quoted = text.match(/[「『"]([^」』"]+)[」』"]/g)
  if (quoted) {
    for (const q of quoted) highlights.push(q.replace(/[「」『』""]/g, ''))
  }
  return highlights
}

/**
 * Generate TTS-synced subtitle cues for a scene's narration.
 *
 * Timing is distributed by character count (each cue's share ≈ its length /
 * total length), so longer phrases get more time — matching natural speech.
 *
 * @param text narration text (scene.voiceText)
 * @param durationSec scene's actual TTS duration in seconds
 * @param opts optional lead-in delay and max phrase length
 */
export function generateSubtitleCues(
  text: string,
  durationSec: number,
  opts: { leadInSec?: number; maxLen?: number } = {},
): SubtitleCue[] {
  const phrases = splitNarration(text, opts.maxLen ?? 18)
  if (phrases.length === 0 || durationSec <= 0) return []

  const leadIn = Math.min(0.12, durationSec * 0.05)
  const usable = Math.max(0.1, durationSec - leadIn)
  const totalChars = phrases.reduce((sum, p) => sum + Math.max(1, p.length), 0)

  const cues: SubtitleCue[] = []
  let cursor = leadIn
  for (const phrase of phrases) {
    const share = Math.max(1, phrase.length) / totalChars
    const len = share * usable
    const startSec = cursor
    const endSec = cursor + len
    const highlightWords = extractHighlights(phrase)
    cues.push({
      startSec,
      endSec,
      text: phrase,
      highlightWords: highlightWords.length ? highlightWords : undefined,
    })
    cursor = endSec
  }
  // Stretch the last cue to the exact end so there's no trailing gap.
  if (cues.length > 0) cues[cues.length - 1].endSec = durationSec
  return cues
}
