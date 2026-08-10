import type { UiStep, UiStepAction } from './product-demo.js'
import { buildDefaultProductDemoSteps } from './product-demo.js'

const VALID_ACTIONS: UiStepAction[] = ['move', 'click', 'navigate', 'dataChange', 'type']

export function normalizeUiStep(raw: unknown): UiStep | null {
  if (!raw || typeof raw !== 'object') return null
  const step = raw as Record<string, unknown>
  const action = String(step.action ?? '')
  if (!VALID_ACTIONS.includes(action as UiStepAction)) return null

  const at = Number(step.at ?? 0)
  if (!Number.isFinite(at) || at < 0) return null

  let value: string | number | undefined
  if (typeof step.value === 'number') value = step.value
  else if (step.value != null) value = String(step.value)

  let x: number | undefined
  let y: number | undefined
  if (step.x != null) {
    const nx = Number(step.x)
    if (Number.isFinite(nx)) x = Math.min(1, Math.max(0, nx))
  }
  if (step.y != null) {
    const ny = Number(step.y)
    if (Number.isFinite(ny)) y = Math.min(1, Math.max(0, ny))
  }

  return {
    at,
    action: action as UiStepAction,
    target: step.target ? String(step.target) : undefined,
    value,
    duration: step.duration != null ? Number(step.duration) : undefined,
    x,
    y,
  }
}

export function normalizeUiSteps(
  raw: unknown,
  duration: number,
  fallback?: UiStep[],
): UiStep[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback ?? buildDefaultProductDemoSteps({ duration })
  }

  const steps = raw.map(normalizeUiStep).filter((step): step is UiStep => step != null)
  if (steps.length === 0) {
    return fallback ?? buildDefaultProductDemoSteps({ duration })
  }

  return steps.sort((a, b) => a.at - b.at)
}

export function validateUiSteps(steps: UiStep[], duration: number): string[] {
  const errors: string[] = []
  if (steps.length === 0) {
    errors.push('uiSteps must contain at least one step')
    return errors
  }

  for (const [index, step] of steps.entries()) {
    if (step.at < 0 || step.at > duration) {
      errors.push(`uiSteps[${index}].at must be within scene duration (0–${duration}s)`)
    }
    if (step.action === 'move' && step.x == null && step.y == null && !step.target) {
      errors.push(`uiSteps[${index}] move requires x/y or target`)
    }
    if ((step.action === 'navigate' || step.action === 'type' || step.action === 'dataChange') && step.value == null) {
      errors.push(`uiSteps[${index}] ${step.action} requires value`)
    }
  }

  return errors
}
