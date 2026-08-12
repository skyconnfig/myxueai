export type SceneComponentName =
  | 'CinematicFallback'
  | 'cinematic_still'
  | 'broll_video'
  | 'ProductDemo'
  | 'ProductDemoV2'
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
  /**
   * Caption Engine 2.0 — kinetic typography mode. When true, subtitles render
   * word-by-word with keyword animations instead of a static line.
   */
  kinetic?: boolean
  /** style preset driving font / color / treatment */
  preset?: 'tech' | 'documentary' | 'commercial'
  /** keyword animation type for highlighted tokens */
  animation?: 'scale' | 'fade' | 'spring' | 'highlight'
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

/**
 * Shot Engine config — drives multi-sub-shot cinematography within a scene.
 * When present, the Shot Engine splits the scene into several sub-shots with
 * varying framing, camera movement and focus points, producing real camera
 * language instead of a single static image zoom.
 */
export interface ShotConfig {
  /** shot framing */
  type?: 'establishing' | 'wide' | 'medium' | 'close' | 'macro' | 'detail'
  /** camera movement */
  camera?: 'push_in' | 'pull_out' | 'pan_left' | 'pan_right' | 'orbit' | 'handheld' | 'parallax'
  /** movement speed 0-1 (default 0.5) */
  speed?: number
  /** movement intensity 0-1 (default 0.6) */
  intensity?: number
}

export interface VideoSceneMedia {
  image?: string
  video?: string
  mediaType?: 'image' | 'video' | 'both'
}

/**
 * Director-level visual layer — three-layer composite for cinematic depth.
 * Driven by the AI Director's `visualLayer` block; consumed by the Scene Engine
 * to render layered backgrounds/foregrounds/overlays instead of a flat image.
 */
export interface VideoSceneVisualLayer {
  background?: string
  foreground?: string
  overlay?: string
}

/** Director-level motion block — camera movement + in-frame effect descriptions. */
export interface VideoSceneMotion {
  camera?: string
  effect?: string
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
  /** Shot Engine config — drives multi-sub-shot cinematography */
  shot?: ShotConfig
  /** Director-level visual layer — three-layer composite for cinematic depth */
  visualLayer?: VideoSceneVisualLayer
  /** Director-level motion — camera movement + in-frame effect */
  motion?: VideoSceneMotion
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
    product_demo_v2: 'ProductDemoV2',
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
