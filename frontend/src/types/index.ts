import type { UiStep } from '@xueai/shared'

export type VideoRatio = '9:16' | '16:9' | '1:1'

export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'GENERATING'
  | 'RENDERING'
  | 'COMPLETED'
  | 'FAILED'

export interface StoryArcBeat {
  type: 'pain' | 'solution' | 'result' | 'cta'
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
  storyBeat?: string | null
  shotType?: string | null
  cameraMotion?: string | null
  lighting?: string | null
  emotion?: string | null
  action?: string | null
  negativePrompt?: string | null
  transition?: string | null
  sceneType?: string | null
}

export interface Project {
  id: string
  name: string
  prompt: string
  status: ProjectStatus
  ratio: VideoRatio
  duration: number
  style?: string | null
  audience?: string | null
  goal?: string | null
  videoStyle?: string | null
  emotion?: string | null
  directorBrief?: DirectorBrief | null
  directorPlan?: Record<string, unknown> | null
  bgmCategory?: string | null
  bgmVolume?: number | null
  videoUrl?: string | null
  thumbnail?: string | null
  createdAt: string
  updatedAt: string
  sceneCount?: number
}

export interface Scene extends CinematicSceneFields {
  id: string
  projectId: string
  order: number
  title?: string | null
  description: string
  visualPrompt?: string | null
  voiceText?: string | null
  voiceId?: string | null
  voiceEmotion?: string | null
  duration: number
  imageUrl?: string | null
  imageSource?: 'ai' | 'manual' | null
  videoUrl?: string | null
  audioUrl?: string | null
  audioProvider?: string | null
  purpose?: string | null
  componentType?: string | null
  uiSteps?: number | null
  uiStepDetails?: UiStep[] | null
  cues?: {
    captionStyle?: { color?: string; fontSize?: number }
    sceneProps?: { steps?: unknown[] }
    steps?: unknown[]
  } | null
}

export interface ProjectDetail extends Project {
  scenes: Scene[]
  script?: unknown | null
}

export interface UpdateScenePayload extends CinematicSceneFields {
  title?: string
  description?: string
  visualPrompt?: string
  voiceText?: string
  voiceId?: string
  voiceEmotion?: string
  duration?: number
  imageUrl?: string
  imageSource?: 'ai' | 'manual'
}

export interface GenerateScriptPayload {
  projectId: string
  prompt?: string
  style?: string
  duration?: number
  ratio?: VideoRatio
  audience?: string
  goal?: string
  videoStyle?: string
}

export interface VideoPlanScene extends CinematicSceneFields {
  index: number
  duration: number
  description: string
  visual: string
  voice: string
  title?: string
}

export interface VideoPlan {
  title: string
  duration: number
  style?: string
  directorBrief?: DirectorBrief
  scenes: VideoPlanScene[]
}

export interface CreateProjectPayload {
  prompt: string
  ratio: VideoRatio
  duration?: number
  style?: string
  audience?: string
  goal?: string
  videoStyle?: string
  emotion?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface GenerateScriptResult {
  project: ProjectDetail
  source: 'llm' | 'preset'
  notice?: string
  plan?: VideoPlan
}

export interface OptimizeScriptPayload {
  projectId: string
  sceneId?: string
  style?: string
}

export interface OptimizeScriptResult {
  project: ProjectDetail
  source: 'llm' | 'preset'
  notice?: string
  summary?: string
  optimizedCount: number
}

export interface ChangeStylePayload {
  projectId: string
  videoStyle: string
}

export interface ChangeStyleResult {
  project: ProjectDetail
  source: 'llm' | 'preset'
  notice?: string
  summary?: string
  videoStyle: string
  styleLabel: string
  restyledCount: number
}

export interface TaskProgress {
  step: string
  status: 'waiting' | 'running' | 'success' | 'failed'
  progress: number
  message?: string
}
