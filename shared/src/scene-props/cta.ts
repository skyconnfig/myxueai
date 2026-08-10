export interface CTAProps {
  headline: string
  subline?: string
  buttonText?: string
  url?: string
  theme?: 'dark' | 'light'
}

export function buildDefaultCTAProps(input: {
  headline: string
  subline?: string
}): CTAProps {
  return {
    headline: input.headline,
    subline: input.subline ?? 'Start your free trial today',
    buttonText: 'Get Started',
    url: 'app.demo/signup',
    theme: 'dark',
  }
}
