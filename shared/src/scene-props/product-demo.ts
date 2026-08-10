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
