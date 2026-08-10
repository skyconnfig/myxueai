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

export type VideoRatio = '9:16' | '16:9' | '1:1'

export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'GENERATING'
  | 'RENDERING'
  | 'COMPLETED'
  | 'FAILED'

export interface Project {
  id: string
  name: string
  prompt: string
  status: ProjectStatus
  ratio: VideoRatio
  duration: number
  style?: string | null
  videoUrl?: string | null
  thumbnail?: string | null
  createdAt: string
  updatedAt: string
  sceneCount?: number
}

export interface ProjectDetail extends Project {
  scenes: Scene[]
  script?: unknown | null
}

export interface Scene {
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
  videoUrl?: string | null
  audioUrl?: string | null
  audioProvider?: string | null
}

export interface UpdateScenePayload {
  title?: string
  description?: string
  visualPrompt?: string
  voiceText?: string
  voiceId?: string
  voiceEmotion?: string
  duration?: number
  imageUrl?: string
}

export interface GenerateScriptPayload {
  projectId: string
  prompt?: string
  style?: string
  duration?: number
  ratio?: VideoRatio
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

export interface VideoPlanScene {
  index: number
  duration: number
  description: string
  visual: string
  voice: string
}

export interface VideoPlan {
  title: string
  duration: number
  style?: string
  scenes: VideoPlanScene[]
}

export interface CreateProjectPayload {
  prompt: string
  ratio: VideoRatio
  duration?: number
  style?: string
}

export interface TaskProgress {
  step: string
  status: 'waiting' | 'running' | 'success' | 'failed'
  progress: number
  message?: string
}
