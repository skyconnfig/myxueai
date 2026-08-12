/**
 * CaptionEngine 2.0 — keyword identification + token segmentation + animation plan.
 *
 * Pure logic (no React / Remotion deps) so it is deterministic and testable.
 *
 * Pipeline:
 *   text → segment into tokens → mark keywords → assign per-token animation
 *   → produce a CaptionPlan the renderer consumes frame-by-frame.
 *
 * Keyword identification example:
 *   "AI正在改变未来" → [AI(keyword), 正在改变, 未来(keyword)]
 *
 * Tokens are timed proportionally to character count within the cue's TTS
 * window, so each word appears in sync with the narration.
 */

/** A single renderable caption token (word / phrase). */
export interface CaptionToken {
  /** the text fragment */
  text: string
  /** whether this token is a highlighted keyword */
  isKeyword: boolean
  /** keyword category — drives the animation treatment */
  keywordType?: 'english' | 'number' | 'quoted' | 'term'
  /** start second, relative to scene start (filled by timeTokens) */
  startSec?: number
  /** end second, relative to scene start (filled by timeTokens) */
  endSec?: number
}

/** Animation plan for a single token. */
export interface TokenAnimation {
  /** animation type */
  type: 'scale' | 'fade' | 'spring' | 'highlight'
  /** peak scale (for scale/spring/highlight) */
  scale: number
  /** entrance duration in seconds */
  enterSec: number
}

/** A fully planned caption cue ready for rendering. */
export interface PlannedCue {
  startSec: number
  endSec: number
  text: string
  tokens: CaptionToken[]
  /** per-token animation, aligned with `tokens` by index */
  animations: TokenAnimation[]
}

export interface CaptionPlan {
  cues: PlannedCue[]
}

/** Animation type from the scene caption config. */
export type CaptionAnimationType = 'scale' | 'fade' | 'spring' | 'highlight'

/** Common English / tech acronyms to treat as keywords. */
const TECH_KEYWORDS = new Set([
  'AI', 'GPT', 'LLM', 'API', 'SaaS', 'GPU', 'CPU', 'ROI', 'KPI', 'B2B', 'B2C',
  'ML', 'DL', 'NLP', 'CV', 'VR', 'AR', 'PR', 'UX', 'UI', 'IT', 'DB', 'SQL',
  'GPT4', 'GPT-4', 'AGI', 'AIGC', 'CRM', 'ERP', 'OA', 'BI',
])

/**
 * Segment text into screen-friendly tokens, marking keywords.
 *
 * Strategy:
 *  1. Pull out English words / acronyms as standalone keyword tokens.
 *  2. Pull out numbers / percentages as keyword tokens.
 *  3. Pull out quoted / bracketed terms as keyword tokens.
 *  4. Split the remaining Chinese text on soft separators and by max length,
 *     marking known tech terms as keywords.
 */
export function segmentCaption(text: string, maxLen = 4): CaptionToken[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const tokens: CaptionToken[] = []
  // Regex captures: English words, numbers/percentages, quoted terms, or runs of CJK.
  const TOKEN_RE = /([A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])|(\d+(?:\.\d+)?%?)|([「『"]([^」』"]+)[」』"])|([\u4e00-\u9fff、，。！？；：]+)/g

  let m: RegExpExecArray | null
  let buffer = ''
  const flushBuffer = () => {
    if (!buffer) return
    // Split the CJK buffer on soft separators / max length.
    const parts = splitCjk(buffer, maxLen)
    for (const p of parts) {
      const isKw = isCjkKeyword(p)
      tokens.push({
        text: p,
        isKeyword: isKw,
        keywordType: isKw ? 'term' : undefined,
      })
    }
    buffer = ''
  }

  while ((m = TOKEN_RE.exec(cleaned)) !== null) {
    if (m[1]) {
      // English word / acronym
      flushBuffer()
      const w = m[1]
      const isKw = TECH_KEYWORDS.has(w.toUpperCase()) || w.length >= 2
      tokens.push({ text: w, isKeyword: isKw, keywordType: 'english' })
    } else if (m[2]) {
      // Number / percentage
      flushBuffer()
      tokens.push({ text: m[2], isKeyword: true, keywordType: 'number' })
    } else if (m[3]) {
      // Quoted term — keep inner text, drop brackets.
      flushBuffer()
      const inner = m[4] ?? m[3].replace(/[「」『』""]/g, '')
      tokens.push({ text: inner, isKeyword: true, keywordType: 'quoted' })
    } else if (m[5]) {
      // CJK run (may include trailing punctuation)
      buffer += m[5]
    }
  }
  flushBuffer()

  return tokens.filter((t) => t.text.trim().length > 0)
}

/** Split a CJK string on soft separators and by max length. */
function splitCjk(s: string, maxLen: number): string[] {
  const SOFT = /[、，。！？；：]/
  // Strip trailing punctuation from the run.
  const stripped = s.replace(/[、，。！？；：]+$/g, '')
  if (!stripped) return []
  const parts = stripped.split(SOFT).map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) {
    // Hard-wrap by maxLen.
    const out: string[] = []
    for (let i = 0; i < stripped.length; i += maxLen) out.push(stripped.slice(i, i + maxLen))
    return out
  }
  return parts
}

/** Whether a CJK fragment should be treated as a keyword (tech term). */
function isCjkKeyword(s: string): boolean {
  const TECH_TERMS = ['未来', '世界', '智能', '模型', '数据', '算法', '效率', '增长', '收入', '用户', '产品', '技术']
  return TECH_TERMS.some((t) => s.includes(t))
}

/**
 * Assign per-token timing proportional to character count within the cue window.
 */
function timeTokens(
  tokens: CaptionToken[],
  cueStartSec: number,
  cueEndSec: number,
): CaptionToken[] {
  if (tokens.length === 0) return tokens
  const totalChars = tokens.reduce((sum, t) => sum + Math.max(1, t.text.length), 0)
  const window = Math.max(0.1, cueEndSec - cueStartSec)
  let cursor = cueStartSec
  return tokens.map((t) => {
    const share = Math.max(1, t.text.length) / totalChars
    const dur = share * window
    const timed = { ...t, startSec: cursor, endSec: cursor + dur }
    cursor += dur
    return timed
  })
}

/**
 * Pick the animation for a token based on its keyword status + the configured
 * animation type.
 */
function planTokenAnimation(
  token: CaptionToken,
  type: CaptionAnimationType,
): TokenAnimation {
  if (!token.isKeyword) {
    // Non-keywords get a gentle fade-in so the eye tracks the keywords.
    return { type: 'fade', scale: 1, enterSec: 0.12 }
  }
  switch (type) {
    case 'scale':
      return { type: 'scale', scale: 1.25, enterSec: 0.18 }
    case 'fade':
      return { type: 'fade', scale: 1.1, enterSec: 0.2 }
    case 'spring':
      return { type: 'spring', scale: 1.3, enterSec: 0.28 }
    case 'highlight':
      return { type: 'highlight', scale: 1.15, enterSec: 0.16 }
    default:
      return { type: 'scale', scale: 1.2, enterSec: 0.18 }
  }
}

/**
 * Build a full caption plan from a set of TTS-synced subtitle cues.
 *
 * @param cues the scene's subtitle cues (from the Subtitle Engine)
 * @param animation keyword animation type
 */
export function buildCaptionPlan(
  cues: Array<{ startSec: number; endSec: number; text: string; highlightWords?: string[] }>,
  animation: CaptionAnimationType = 'spring',
): CaptionPlan {
  const planned: PlannedCue[] = cues.map((cue) => {
    let tokens = segmentCaption(cue.text)
    // Honor explicit highlight words from the cue — mark them as keywords.
    if (cue.highlightWords && cue.highlightWords.length > 0) {
      tokens = tokens.map((t) =>
        cue.highlightWords!.some((hw) => hw === t.text)
          ? { ...t, isKeyword: true, keywordType: t.keywordType ?? 'term' }
          : t,
      )
    }
    tokens = timeTokens(tokens, cue.startSec, cue.endSec)
    const animations = tokens.map((t) => planTokenAnimation(t, animation))
    return {
      startSec: cue.startSec,
      endSec: cue.endSec,
      text: cue.text,
      tokens,
      animations,
    }
  })
  return { cues: planned }
}

export const captionEngine = {
  segmentCaption,
  buildCaptionPlan,
}
