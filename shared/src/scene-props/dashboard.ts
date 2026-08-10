export interface DashboardMetric {
  label: string
  value: number
  suffix?: string
}

export interface DashboardAnimationProps {
  title: string
  metrics: DashboardMetric[]
  theme?: 'dark' | 'light'
}

export function buildDefaultDashboardProps(input: {
  title: string
  result?: string
}): DashboardAnimationProps {
  return {
    title: input.title,
    metrics: [
      { label: 'Efficiency', value: 87, suffix: '%' },
      { label: 'Time Saved', value: 12, suffix: 'h/wk' },
      { label: 'ROI', value: 3.2, suffix: 'x' },
    ],
    theme: 'dark',
  }
}
