import type { UiStep } from './product-demo.js'

export interface BrowserWindowProps {
  title: string
  url?: string
  body?: string
  steps?: UiStep[]
  theme?: 'dark' | 'light'
}
