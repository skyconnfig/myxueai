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
  style?: { font?: string; color?: string; fontSize?: number; highlightColor?: string; fontWeight?: number }
  highlightWords?: string[]
  /** per-word emphasis words (rendered larger/bold) */
  emphasisWords?: string[]
  /** numbers in text to emphasize */
  emphasizeNumbers?: boolean
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
  /** per-scene BGM ducking intensity override */
  bgmIntensity?: string
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
    slow_dolly_in: 'dolly_in',
    slow_dolly_out: 'dolly_out',
    push_in: 'zoom_in',
    zoom_in: 'zoom_in',
    zoom_out: 'zoom_out',
    pan_left: 'pan_left',
    pan_right: 'pan_right',
    pan_up: 'pan_up',
    pan_down: 'pan_down',
    dolly_in: 'dolly_in',
    dolly_out: 'dolly_out',
    parallax: 'parallax',
    orbit: 'orbit',
    handheld: 'handheld',
    static: 'static',
    tracking: 'pan_right',
    over_shoulder: 'zoom_in',
  }
  return map[cameraMotion] ?? cameraMotion
}
