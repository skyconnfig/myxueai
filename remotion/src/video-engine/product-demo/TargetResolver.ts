/**
 * TargetResolver — maps semantic UI target names to normalized screen positions.
 * AI outputs target: "uploadButton" instead of raw x/y coordinates.
 */

import type { UiStep } from '@xueai/shared'

export interface TargetPoint {
  x: number
  y: number
  label?: string
}

/** Normalized 0–1 positions within the browser content area. */
export const TARGET_REGISTRY: Record<string, TargetPoint> = {
  uploadButton: { x: 0.72, y: 0.26, label: 'Upload' },
  runButton: { x: 0.72, y: 0.26, label: 'Run' },
  analyzeButton: { x: 0.68, y: 0.3, label: 'Analyze' },
  analyticsTab: { x: 0.14, y: 0.38, label: 'Analytics' },
  analytics: { x: 0.14, y: 0.38, label: 'Analytics' },
  dashboardTab: { x: 0.14, y: 0.28, label: 'Dashboard' },
  usersMetric: { x: 0.62, y: 0.4, label: 'Users' },
  users: { x: 0.62, y: 0.4, label: 'Users' },
  chart: { x: 0.55, y: 0.64, label: 'Chart' },
  'metric-primary': { x: 0.62, y: 0.4, label: 'Metric' },
  'nav-dashboard': { x: 0.14, y: 0.28, label: 'Dashboard' },
  'btn-automation': { x: 0.72, y: 0.26, label: 'Run' },
}

/** Cursor resting position before the first move step. */
export const CURSOR_START: TargetPoint = { x: 0.88, y: 0.88 }

export function resolveTarget(name?: string): TargetPoint | null {
  if (!name) return null
  return TARGET_REGISTRY[name] ?? null
}

export function resolveStepPosition(step: UiStep): TargetPoint {
  if (step.x != null && step.y != null) {
    return { x: step.x, y: step.y }
  }
  const resolved = resolveTarget(step.target)
  if (resolved) return resolved
  return CURSOR_START
}

export function resolveStepKeyframes(
  steps: UiStep[],
  durationSec: number,
): Array<{ at: number; x: number; y: number }> {
  const sorted = [...steps].sort((a, b) => a.at - b.at)
  const keyframes: Array<{ at: number; x: number; y: number }> = [
    { at: 0, ...CURSOR_START },
  ]

  for (const step of sorted) {
    if (step.action === 'move' || step.action === 'click' || step.action === 'hover') {
      const pos = resolveStepPosition(step)
      keyframes.push({ at: step.at, x: pos.x, y: pos.y })
    }
  }

  const last = keyframes[keyframes.length - 1]
  keyframes.push({ at: durationSec, x: last.x, y: last.y })
  return keyframes
}
