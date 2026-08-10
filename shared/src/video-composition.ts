import type { VideoScene } from './video-scene.js'

export interface CompositionMeta {
  id: string
  title?: string
  templateSlug?: string
  version: 1
}

export interface CompositionSoundEffect {
  url: string
  startFrame: number
  durationInFrames: number
  volume: number
  label?: string
}

export interface CompositionAudioConfig {
  backgroundMusic?: { url: string; volume: number }
  soundEffects?: CompositionSoundEffect[]
}

export interface VideoCompositionJSON {
  meta?: CompositionMeta
  fps: number
  width: number
  height: number
  ratio: string
  duration: number
  scenes: VideoScene[]
  audio?: CompositionAudioConfig
}

export function calculateCompositionDuration(composition: VideoCompositionJSON): number {
  const sceneTotal = composition.scenes.reduce((sum, s) => sum + s.duration, 0)
  return Math.max(composition.duration, sceneTotal)
}

export function calculateCompositionFrames(composition: VideoCompositionJSON): number {
  return Math.max(1, Math.round(calculateCompositionDuration(composition) * composition.fps))
}
