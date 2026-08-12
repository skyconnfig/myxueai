import type { UiStep } from './scene-props/product-demo.js'

/** Director-level shot block (AI Director upgrade) — drives the Shot Engine. */
export interface DirectorShot {
  type?: string
  camera?: string
  speed?: number
  intensity?: number
}

/** Director-level visual layer block — three-layer composite for depth. */
export interface DirectorVisualLayer {
  background?: string
  foreground?: string
  overlay?: string
}

/** Director-level motion block — camera movement + in-frame effect. */
export interface DirectorMotion {
  camera?: string
  effect?: string
}

/** Director-level audio block — SFX cue for the scene. */
export interface DirectorAudio {
  sfx?: string
}

/** Director-level caption style block — drives Caption Engine 2.0. */
export interface DirectorCaptionStyle {
  preset?: 'tech' | 'documentary' | 'commercial'
  animation?: 'scale' | 'fade' | 'spring' | 'highlight'
  kinetic?: boolean
}

/** Director-level Product Demo v2 block — device choreography props. */
export interface DirectorProductDemo {
  device?: 'browser' | 'phone' | 'both'
  features?: Array<{ index: number; x: number; y: number; label: string }>
  metric?: { label: string; value: number; suffix?: string }
}

export interface DirectorPlanScene {
  id?: string
  purpose: string
  duration: number
  shotType: string
  cameraMovement: string
  lighting: string
  emotion: string
  visualDescription: string
  motionDescription: string
  voiceover: string
  soundEffect?: string
  componentType?: string
  input?: string
  process?: string
  result?: string
  uiSteps?: UiStep[]
  /** cinematic fields carried through from the LLM VideoPlan */
  title?: string
  action?: string
  negativePrompt?: string
  sceneType?: string
  /** per-scene BGM ducking intent */
  bgmIntensity?: string
  /** Director-level Scene JSON (AI Director upgrade) */
  shot?: DirectorShot
  visualLayer?: DirectorVisualLayer
  motion?: DirectorMotion
  audio?: DirectorAudio
  captionStyle?: DirectorCaptionStyle
  productDemo?: DirectorProductDemo
  assetRequirement: {
    role: 'evidence' | 'illustration'
    type: 'stock' | 'ai-image' | 'screen-recording' | 'component'
    query?: string
    componentType?: string
  }
}

export interface DirectorPlan {
  title: string
  style: string
  audience: string
  emotion: string
  storyStructure: Array<{ type: string; duration: number; beat: string }>
  visualDirection?: string
  goal?: string
  scenes: DirectorPlanScene[]
}

export interface StoryboardScene {
  order: number
  duration: number
  purpose: string
  componentType: string
  camera: { shotType: string; movement: string; lighting: string }
  motion: { pattern: string; description: string }
  visual: { description: string; prompt: string; negativePrompt?: string }
  audio: { voiceover: string; voiceId?: string; sfx?: string[] }
  transition: string
  viewerTask: string
  input: string
  process: string
  result: string
  assetRequirement: DirectorPlanScene['assetRequirement']
  cues?: Array<{ timeSec: number; event: string }>
  uiSteps?: UiStep[]
  sceneProps?: Record<string, unknown>
  /** cinematic fields carried through to DB Scene rows */
  title?: string
  emotion?: string
  action?: string
  negativePrompt?: string
  sceneType?: string
  bgmIntensity?: string
  /** Director-level Scene JSON (AI Director upgrade) — bundled to avoid name
   * collisions with the existing `audio`/`motion` StoryboardScene fields. */
  director?: {
    shot?: DirectorShot
    visualLayer?: DirectorVisualLayer
    motion?: DirectorMotion
    audio?: DirectorAudio
    captionStyle?: DirectorCaptionStyle
    productDemo?: DirectorProductDemo
  }
}
