export type SceneComponentName =
  | 'CinematicFallback'
  | 'cinematic_still'
  | 'broll_video'
  | 'ProductDemo'
  | 'BrowserWindow'
  | 'DashboardAnimation'
  | 'FeatureReveal'
  | 'BeforeAfter'
  | 'CTA'
  | 'HookScene'
  | 'ProblemScene'
  | 'ProductScene'
  | 'FeatureScene'
  | 'ResultScene'

export interface CameraConfig {
  shotType?: string
  type?: string
  speed?: number
  lighting?: string
}

export interface AnimationConfig {
  enter?: 'spring' | 'fade' | 'none'
  primary?: string
  springPreset?: 'smooth' | 'snappy' | 'cinematic'
}

export interface SceneCaptionConfig {
  text: string
  style?: { font?: string; color?: string; fontSize?: number }
  highlightWords?: string[]
}

export interface SceneAudioConfig {
  voiceUrl?: string
  voiceVolume?: number
  sfx?: Array<{
    url: string
    atSec: number
    volume?: number
    label?: string
  }>
}

export interface VideoSceneMedia {
  image?: string
  video?: string
  mediaType?: 'image' | 'video' | 'both'
}

export interface VideoSceneMeta {
  emotion?: string
  storyBeat?: string
  viewerTask?: string
  negativePrompt?: string
  action?: string
  sceneType?: string
}

export interface VideoScene {
  id: string
  order: number
  purpose?: string
  component: SceneComponentName | string
  duration: number
  transition?: 'cut' | 'fade' | 'crossfade' | 'push' | string
  camera?: CameraConfig
  animation?: AnimationConfig
  caption?: SceneCaptionConfig
  audio?: SceneAudioConfig
  props?: Record<string, unknown>
  media?: VideoSceneMedia
  meta?: VideoSceneMeta
}

export function normalizeComponentName(componentType?: string | null): string {
  if (!componentType) return 'CinematicFallback'
  const map: Record<string, string> = {
    cinematic_still: 'CinematicFallback',
    broll_video: 'CinematicFallback',
    product_demo: 'ProductDemo',
    browser_window: 'BrowserWindow',
    ui_demo: 'BrowserWindow',
  }
  return map[componentType] ?? componentType
}

export function normalizeCameraType(cameraMotion?: string): string | undefined {
  if (!cameraMotion) return undefined
  const map: Record<string, string> = {
    slow_dolly_in: 'push_in',
    slow_dolly_out: 'pull_out',
    push_in: 'push_in',
    zoom_out: 'pull_out',
    pan_left: 'pan_left',
    pan_right: 'pan_right',
    orbit: 'orbit',
    handheld: 'handheld',
    static: 'static',
    tracking: 'pan_right',
    over_shoulder: 'push_in',
  }
  return map[cameraMotion] ?? cameraMotion
}
