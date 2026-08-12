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

/**
 * Audio Engine — a declarative audio event placed on the composition timeline.
 * The Audio Engine resolves `type` to a SFX library sample and renders it at
 * `time` (seconds, composition-relative) with a type-specific volume envelope.
 *
 * Example:
 *   { audio: [ { type: "whoosh", time: 3.2 }, { type: "impact", time: 8 } ] }
 */
export interface AudioEvent {
  /** SFX type — whoosh / impact / riser / click / transition / sparkle / boom / sweep */
  type: string
  /** time in seconds, composition-relative */
  time: number
  /** override default volume 0-1 */
  volume?: number
}

export interface CompositionAudioConfig {
  backgroundMusic?: { url: string; volume: number }
  soundEffects?: CompositionSoundEffect[]
  /** Audio Engine 2.0 — declarative audio events on the composition timeline */
  audio?: AudioEvent[]
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
