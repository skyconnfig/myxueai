export type StoryBeatType = 'pain' | 'solution' | 'result' | 'cta'
export type ShotType = 'close_up' | 'medium' | 'wide' | 'tracking' | 'drone' | 'over_shoulder'
export type CameraMotion =
  | 'slow_dolly_in'
  | 'slow_dolly_out'
  | 'pan_left'
  | 'pan_right'
  | 'orbit'
  | 'handheld'
  | 'static'
  | 'push_in'
  | 'zoom_out'
export type SceneTransition = 'crossfade' | 'push' | 'cut' | 'fade'
export type SceneType = 'live_action' | 'ui_demo' | 'abstract'

export interface StoryArcBeat {
  type: StoryBeatType
  duration: number
  label?: string
  beat?: string
}

export interface DirectorBrief {
  video_style: string
  emotion: string
  audience?: string
  goal?: string
  story_arc: StoryArcBeat[]
  negative_global?: string
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
}
