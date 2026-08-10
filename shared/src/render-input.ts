export interface RenderCaption {
  text: string
  style?: { font?: string; color?: string; fontSize?: number }
}

export interface RenderScene {
  order: number
  duration: number
  text: string
  image?: string
  video?: string
  mediaType?: 'image' | 'video' | 'both'
  componentType?: string
  purpose?: string
  props?: Record<string, unknown>
  audio?: string
  caption?: RenderCaption
  storyBeat?: string
  shotType?: string
  cameraMotion?: string
  lighting?: string
  emotion?: string
  action?: string
  negativePrompt?: string
  transition?: string
  sceneType?: string
}

import type { VideoCompositionJSON } from './video-composition.js'

export interface RenderInput {
  duration: number
  ratio: string
  width: number
  height: number
  fps: number
  scenes: RenderScene[]
  backgroundMusic?: {
    url: string
    volume: number
  }
  soundEffects?: RenderSoundEffect[]
  /** When present, video-engine prefers this over legacy scene fields */
  composition?: VideoCompositionJSON
}

export interface RenderSoundEffect {
  url: string
  startFrame: number
  durationInFrames: number
  volume: number
  label?: string
}

export const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
}
