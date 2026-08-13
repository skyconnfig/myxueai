/**
 * Simulator state — derives page/cursor/data phase from uiSteps + current time.
 */

import type { UiStep } from '@xueai/shared'
import { CURSOR_START, resolveStepPosition } from './TargetResolver.js'

export type SimulatorPage = 'dashboard' | 'analytics' | 'loading'

export interface ClickEvent {
  at: number
  x: number
  y: number
}

export interface SimulatorState {
  cursor: { x: number; y: number }
  clicking: boolean
  page: SimulatorPage
  loadingProgress: number
  dataValue: number
  dataTarget: number
  dataAnimating: boolean
  clicks: ClickEvent[]
  captionPhase: 'action' | 'data' | 'result'
  captionText: string
}

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}

export function getCaptionForPhase(phase: SimulatorState['captionPhase']): string {
  switch (phase) {
    case 'action':
      return '一键运行'
    case 'data':
      return '实时看板'
    case 'result':
      return '效率提升 300%'
    default:
      return ''
  }
}

export function computeSimulatorState(
  timeSec: number,
  steps: UiStep[],
  durationSec: number,
  initialData = 479_000,
): SimulatorState {
  const sorted = [...steps].sort((a, b) => a.at - b.at)

  let page: SimulatorPage = 'dashboard'
  let loadingStart = -1
  let dataTarget = initialData
  let dataAnimStart = -1
  let captionPhase: SimulatorState['captionPhase'] = 'action'
  const clicks: ClickEvent[] = []

  for (const step of sorted) {
    if (timeSec < step.at) continue

    if (step.action === 'click') {
      const pos = resolveStepPosition(step)
      clicks.push({ at: step.at, x: pos.x, y: pos.y })
    }

    if (step.action === 'navigate') {
      loadingStart = step.at
      if (timeSec >= step.at) {
        const loadDur = step.duration ?? 0.8
        if (timeSec < step.at + loadDur) {
          page = 'loading'
        } else {
          page = step.target === 'analytics' || step.value === 'Analytics' ? 'analytics' : 'dashboard'
        }
      }
    }

    if (step.action === 'dataChange') {
      dataAnimStart = step.at
      dataTarget = typeof step.value === 'number' ? step.value : Number(step.value) || dataTarget
      captionPhase = 'data'
    }
  }

  if (timeSec >= durationSec * 0.9) {
    captionPhase = 'result'
  } else if (dataAnimStart >= 0 && timeSec >= dataAnimStart) {
    captionPhase = 'data'
  }

  const loadingProgress =
    loadingStart >= 0 && page === 'loading'
      ? Math.min(1, (timeSec - loadingStart) / 0.8)
      : page !== 'dashboard' && loadingStart >= 0
        ? 1
        : 0

  const dataAnimating = dataAnimStart >= 0 && timeSec >= dataAnimStart && timeSec < durationSec * 0.9
  let dataValue = initialData
  if (dataAnimating) {
    const span = Math.min(1.5, durationSec * 0.9 - dataAnimStart)
    const t = Math.min(1, (timeSec - dataAnimStart) / Math.max(span, 0.001))
    // Multi-step punch: 479K → 481K → 495K → 520K
    const checkpoints = [
      { t: 0, v: initialData },
      { t: 0.25, v: initialData + 2_000 },
      { t: 0.55, v: initialData + 16_000 },
      { t: 1, v: dataTarget },
    ]
    for (let i = 0; i < checkpoints.length - 1; i++) {
      const a = checkpoints[i]
      const b = checkpoints[i + 1]
      if (t >= a.t && t <= b.t) {
        const local = (t - a.t) / (b.t - a.t)
        dataValue = a.v + (b.v - a.v) * local
        break
      }
    }
  } else if (timeSec >= dataAnimStart && dataAnimStart >= 0) {
    dataValue = dataTarget
  }

  // Cursor position from keyframes
  const moveSteps = sorted.filter(
    (s) => s.action === 'move' || s.action === 'click' || s.action === 'hover',
  )
  let cursor = { ...CURSOR_START }
  const keyframes: Array<{ at: number; x: number; y: number }> = [{ at: 0, ...CURSOR_START }]
  for (const step of moveSteps) {
    const pos = resolveStepPosition(step)
    keyframes.push({ at: step.at, x: pos.x, y: pos.y })
  }
  const lastKf = keyframes[keyframes.length - 1]
  keyframes.push({ at: durationSec, x: lastKf.x, y: lastKf.y })

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (timeSec >= a.at && timeSec <= b.at) {
      const span = b.at - a.at
      const t = span <= 0 ? 1 : (timeSec - a.at) / span
      // ease-out cubic for natural cursor movement
      const eased = 1 - (1 - t) ** 3
      cursor = {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
      }
      break
    }
  }

  const clicking = clicks.some((c) => timeSec >= c.at && timeSec - c.at < 0.25)

  return {
    cursor,
    clicking,
    page,
    loadingProgress,
    dataValue,
    dataTarget,
    dataAnimating,
    clicks,
    captionPhase,
    captionText: getCaptionForPhase(captionPhase),
  }
}

export { formatMetric }
