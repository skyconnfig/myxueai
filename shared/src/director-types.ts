// Canonical cinematic vocabulary. Runtime values are lowercase snake_case for
// backward compatibility with the existing pipeline; uppercase constants below
// provide the conceptual enum names from the spec and map to these values.

export type StoryBeatType = 'pain' | 'solution' | 'result' | 'cta' | 'hook' | 'context' | 'insight'

export type ShotType =
  | 'close_up'
  | 'medium'
  | 'wide'
  | 'tracking'
  | 'drone'
  | 'over_shoulder'
  | 'top_down'
  | 'pov'
  | 'macro'
  | 'low_angle'
  | 'high_angle'

export type CameraMotion =
  | 'static'
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'dolly_in'
  | 'dolly_out'
  | 'parallax'
  // legacy aliases (normalized by normalizeCameraType)
  | 'slow_dolly_in'
  | 'slow_dolly_out'
  | 'push_in'
  | 'orbit'
  | 'handheld'
  | 'tracking'

export type SceneTransition =
  | 'cut'
  | 'fade'
  | 'crossfade'
  | 'slide'
  | 'push'
  | 'zoom'
  | 'wipe'
  | 'iris'
  | 'morph'

export type SceneType = 'live_action' | 'ui_demo' | 'abstract'

export type BgmIntensity = 'silent' | 'low' | 'medium' | 'high' | 'swell'

export interface StoryArcBeat {
  type: StoryBeatType
  duration: number
  label?: string
  beat?: string
}

export interface EmotionalArcPoint {
  /** storyBeat this arc point attaches to */
  beat?: string
  /** tension/energy level 0-1 */
  intensity?: number
  /** emotional label, e.g. stress, relief, curiosity */
  emotion?: string
}

export interface DirectorBrief {
  video_style: string
  emotion: string
  audience?: string
  goal?: string
  story_arc: StoryArcBeat[]
  negative_global?: string
  /** explicit hook line; falls back to first story_arc beat */
  hook?: string
  /** narrative summary for QC/render context */
  story?: string
  /** emotional progression across the video */
  emotionalArc?: EmotionalArcPoint[]
  /** explicit call-to-action line */
  cta?: string
}

export interface CinematicSceneFields {
  storyBeat?: StoryBeatType | string
  shotType?: ShotType | string
  cameraMotion?: CameraMotion | string
  lighting?: string
  emotion?: string
  action?: string
  negativePrompt?: string
  transition?: SceneTransition | string
  sceneType?: SceneType | string
  /** per-scene BGM ducking intensity */
  bgmIntensity?: BgmIntensity | string
}

// Uppercase conceptual enum aliases (spec vocabulary) → canonical lowercase values
export const SHOT_TYPE_MAP: Record<string, string> = {
  CLOSE_UP: 'close_up',
  MEDIUM: 'medium',
  WIDE: 'wide',
  OVER_SHOULDER: 'over_shoulder',
  TOP_DOWN: 'top_down',
  POV: 'pov',
  MACRO: 'macro',
  LOW_ANGLE: 'low_angle',
  HIGH_ANGLE: 'high_angle',
}

export const CAMERA_MOTION_MAP: Record<string, string> = {
  STATIC: 'static',
  ZOOM_IN: 'zoom_in',
  ZOOM_OUT: 'zoom_out',
  PAN_LEFT: 'pan_left',
  PAN_RIGHT: 'pan_right',
  PAN_UP: 'pan_up',
  PAN_DOWN: 'pan_down',
  DOLLY_IN: 'dolly_in',
  DOLLY_OUT: 'dolly_out',
  PARALLAX: 'parallax',
}

export const TRANSITION_MAP: Record<string, string> = {
  CUT: 'cut',
  FADE: 'fade',
  SLIDE: 'slide',
  ZOOM: 'zoom',
  WIPE: 'wipe',
  IRIS: 'iris',
  MORPH: 'morph',
}

/** Normalize any shot-type input (uppercase or snake_case) to canonical lowercase. */
export function normalizeShotType(input?: string | null): string | undefined {
  if (!input) return undefined
  const v = input.trim()
  if (!v) return undefined
  if (SHOT_TYPE_MAP[v]) return SHOT_TYPE_MAP[v]
  return v.toLowerCase()
}

/** Normalize any camera-motion input (uppercase or snake_case) to canonical lowercase. */
export function normalizeMotion(input?: string | null): string | undefined {
  if (!input) return undefined
  const v = input.trim()
  if (!v) return undefined
  if (CAMERA_MOTION_MAP[v]) return CAMERA_MOTION_MAP[v]
  return v.toLowerCase()
}

/** Normalize any transition input (uppercase or snake_case) to canonical lowercase. */
export function normalizeTransition(input?: string | null): string | undefined {
  if (!input) return undefined
  const v = input.trim()
  if (!v) return undefined
  if (TRANSITION_MAP[v]) return TRANSITION_MAP[v]
  return v.toLowerCase()
}
