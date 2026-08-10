export interface BeforeAfterProps {
  beforeLabel: string
  afterLabel: string
  beforeText: string
  afterText: string
  theme?: 'dark' | 'light'
}

export function buildDefaultBeforeAfterProps(input: {
  beforeText?: string
  afterText?: string
}): BeforeAfterProps {
  return {
    beforeLabel: 'Before',
    afterLabel: 'After',
    beforeText: input.beforeText ?? 'Manual, slow, error-prone',
    afterText: input.afterText ?? 'Automated, fast, reliable',
    theme: 'dark',
  }
}
