/**
 * SafeAreaResolver — picks caption/callout placement to avoid UI hotspots.
 */

import type React from 'react'

export type CaptionPlacement = 'bottom' | 'top' | 'left' | 'right'

export interface SafeAreaInput {
  /** normalized rects to avoid (cursor, buttons, metrics) */
  avoidZones: Array<{ x: number; y: number; w: number; h: number }>
  /** story phase hint */
  phase?: 'action' | 'data' | 'result'
}

const PLACEMENTS: CaptionPlacement[] = ['bottom', 'top', 'left', 'right']

/** Score lower = better (less overlap). */
function overlapScore(
  placement: CaptionPlacement,
  zones: SafeAreaInput['avoidZones'],
): number {
  const captionRects: Record<CaptionPlacement, { x: number; y: number; w: number; h: number }> = {
    bottom: { x: 0.1, y: 0.78, w: 0.8, h: 0.14 },
    top: { x: 0.1, y: 0.04, w: 0.8, h: 0.12 },
    left: { x: 0.02, y: 0.35, w: 0.22, h: 0.3 },
    right: { x: 0.76, y: 0.35, w: 0.22, h: 0.3 },
  }
  const cap = captionRects[placement]
  let score = 0
  for (const z of zones) {
    const ox = Math.max(0, Math.min(cap.x + cap.w, z.x + z.w) - Math.max(cap.x, z.x))
    const oy = Math.max(0, Math.min(cap.y + cap.h, z.y + z.h) - Math.max(cap.y, z.y))
    score += ox * oy
  }
  return score
}

export function resolveCaptionPlacement(input: SafeAreaInput): CaptionPlacement {
  if (input.phase === 'result') return 'bottom'
  if (input.phase === 'data') return 'top'

  let best: CaptionPlacement = 'bottom'
  let bestScore = Infinity
  for (const p of PLACEMENTS) {
    const score = overlapScore(p, input.avoidZones)
    if (score < bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

export function placementStyle(placement: CaptionPlacement): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    padding: 24,
    maxWidth: '86%',
    textAlign: 'center',
  }
  switch (placement) {
    case 'top':
      return { ...base, top: 48, left: '7%', right: '7%' }
    case 'left':
      return { ...base, top: '38%', left: 16, maxWidth: '28%', textAlign: 'left' }
    case 'right':
      return { ...base, top: '38%', right: 16, maxWidth: '28%', textAlign: 'right' }
    default:
      return { ...base, bottom: 100, left: '7%', right: '7%' }
  }
}
