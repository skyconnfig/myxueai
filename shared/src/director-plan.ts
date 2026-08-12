import type { UiStep } from './scene-props/product-demo.js'

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
}
