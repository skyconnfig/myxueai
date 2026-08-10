export interface FeatureItem {
  title: string
  description?: string
}

export interface FeatureRevealProps {
  headline: string
  features: FeatureItem[]
  theme?: 'dark' | 'light'
}

export function buildDefaultFeatureRevealProps(input: {
  headline: string
  process?: string
  result?: string
}): FeatureRevealProps {
  return {
    headline: input.headline,
    features: [
      { title: input.process ?? 'Automate workflows', description: 'Reduce manual steps' },
      { title: input.result ?? 'Ship faster', description: 'Launch in days, not months' },
      { title: 'Integrate anywhere', description: 'API-first architecture' },
    ],
    theme: 'dark',
  }
}
