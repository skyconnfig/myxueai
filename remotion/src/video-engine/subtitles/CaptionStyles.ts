/**
 * CaptionStyles — visual presets for Caption Engine 2.0.
 *
 * Each preset defines font, colors, keyword treatment, layout and decoration
 * so a template can change the entire subtitle feel by setting
 * `caption.preset = 'tech' | 'documentary' | 'commercial'`.
 */

export type CaptionPreset = 'tech' | 'documentary' | 'commercial'

export interface CaptionStylePreset {
  /** font family stack */
  font: string
  /** base text color */
  color: string
  /** keyword / highlight color */
  accentColor: string
  /** base font weight */
  fontWeight: number
  /** keyword font weight */
  keywordWeight: number
  /** letter spacing */
  letterSpacing: string
  /** line height */
  lineHeight: number
  /** bottom offset in px (from screen bottom) */
  bottom: number
  /** horizontal padding in px */
  paddingX: number
  /** max width as % of screen */
  maxWidthPct: number
  /** text alignment */
  align: 'center' | 'left'
  /** text shadow treatment */
  shadow: string
  /** keyword decoration: underline bar / box / none */
  keywordDecoration: 'bar' | 'box' | 'glow' | 'none'
  /** keyword decoration color (defaults to accentColor) */
  decorationColor?: string
  /** background behind text (none for clean, subtle for documentary) */
  background?: string
  /** uppercase transform (for english-heavy tech) */
  uppercaseKeywords: boolean
}

export const CAPTION_PRESETS: Record<CaptionPreset, CaptionStylePreset> = {
  tech: {
    font: '"JetBrains Mono", "Noto Sans SC", ui-monospace, monospace',
    color: '#F1F5F9',
    accentColor: '#22D3EE',
    fontWeight: 700,
    keywordWeight: 800,
    letterSpacing: '0.04em',
    lineHeight: 1.3,
    bottom: 110,
    paddingX: 56,
    maxWidthPct: 86,
    align: 'center',
    shadow: '0 0 18px rgba(34,211,238,0.45), 0 4px 24px rgba(0,0,0,0.9)',
    keywordDecoration: 'glow',
    decorationColor: '#22D3EE',
    background: 'transparent',
    uppercaseKeywords: true,
  },
  documentary: {
    font: '"Noto Serif SC", "Source Han Serif", Georgia, serif',
    color: '#F8FAFC',
    accentColor: '#FBBF24',
    fontWeight: 600,
    keywordWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1.4,
    bottom: 96,
    paddingX: 64,
    maxWidthPct: 88,
    align: 'center',
    shadow: '0 2px 12px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.7)',
    keywordDecoration: 'bar',
    decorationColor: '#FBBF24',
    background: 'rgba(0,0,0,0.35)',
    uppercaseKeywords: false,
  },
  commercial: {
    font: '"Plus Jakarta Sans", "Noto Sans SC", system-ui, sans-serif',
    color: '#FFFFFF',
    accentColor: '#F472B6',
    fontWeight: 800,
    keywordWeight: 900,
    letterSpacing: '0.01em',
    lineHeight: 1.25,
    bottom: 120,
    paddingX: 48,
    maxWidthPct: 84,
    align: 'center',
    shadow: '0 6px 28px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.5)',
    keywordDecoration: 'box',
    decorationColor: '#F472B6',
    background: 'transparent',
    uppercaseKeywords: false,
  },
}

/** Resolve a preset, letting scene-level style overrides win per-field. */
export function resolveCaptionStyle(
  preset: CaptionPreset | undefined,
  overrides?: {
    font?: string
    color?: string
    fontSize?: number
    highlightColor?: string
    fontWeight?: number
  },
): CaptionStylePreset & { fontSize: number } {
  const base = CAPTION_PRESETS[preset ?? 'tech']
  const fontSize = overrides?.fontSize ?? (preset === 'documentary' ? 40 : 44)
  return {
    ...base,
    font: overrides?.font ?? base.font,
    color: overrides?.color ?? base.color,
    fontSize,
    accentColor: overrides?.highlightColor ?? base.accentColor,
    fontWeight: overrides?.fontWeight ?? base.fontWeight,
  }
}

export const captionStyles = {
  CAPTION_PRESETS,
  resolveCaptionStyle,
}
