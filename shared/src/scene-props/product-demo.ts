export type UiStepAction = 'move' | 'click' | 'navigate' | 'dataChange' | 'type'

export interface UiStep {
  at: number
  action: UiStepAction
  target?: string
  value?: string | number
  duration?: number
  x?: number
  y?: number
}

export interface ProductDemoProps {
  title: string
  subtitle?: string
  url?: string
  steps: UiStep[]
  screenshot?: string
  theme?: 'dark' | 'light'
}

/**
 * Product Demo v2 — cinematic product demo props.
 * Drives the multi-phase commercial hero shot: device choreography, feature
 * callouts and a dramatic data punch.
 */
export interface ProductDemoFeatureCallout {
  /** 1-based index shown in the badge */
  index: number
  /** normalized 0-1 position on the screen area */
  x: number
  y: number
  /** short label drawn beside the badge */
  label: string
}

export interface ProductDemoMetric {
  label: string
  value: number
  suffix?: string
}

export interface ProductDemoV2Props extends ProductDemoProps {
  /** device kind for the hero stage */
  device?: 'browser' | 'phone' | 'both'
  /** feature callouts highlighted during the feature phase */
  features?: ProductDemoFeatureCallout[]
  /** dramatic metric revealed during the data-punch phase */
  metric?: ProductDemoMetric
}

export function buildDefaultProductDemoSteps(input: {
  process?: string
  result?: string
  duration: number
}): UiStep[] {
  const mid = Math.max(1, input.duration * 0.35)
  const clickAt = Math.max(1.5, input.duration * 0.55)
  const dataAt = Math.max(2, input.duration * 0.75)
  return [
    { at: 0.4, action: 'move', x: 0.35, y: 0.42, target: 'nav-dashboard' },
    { at: mid, action: 'click', target: 'nav-dashboard' },
    { at: clickAt, action: 'navigate', value: input.process ?? 'Workflow' },
    { at: dataAt, action: 'dataChange', target: 'metric-primary', value: 87 },
    { at: Math.min(input.duration - 0.5, dataAt + 1), action: 'type', value: input.result?.slice(0, 40) ?? 'Done' },
  ]
}
