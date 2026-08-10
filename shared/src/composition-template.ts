import type { CompositionMeta } from './video-composition.js'

export interface CompositionTemplateSceneBlueprint {
  order: number
  purpose: string
  component: string
  durationRatio: number
  camera?: {
    shotType?: string
    type?: string
    speed?: number
  }
  transition?: string
  assetRole?: 'evidence' | 'illustration'
  voiceHint?: string
}

export interface CompositionTemplateJSON {
  name: string
  slug: string
  composition: 'VideoComposition'
  duration: number
  ratio: string
  fps: number
  meta: CompositionMeta
  sceneBlueprint: CompositionTemplateSceneBlueprint[]
}
