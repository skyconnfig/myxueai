import type React from 'react'
import type { VideoScene } from '@xueai/shared'

export interface SceneComponentProps {
  scene: VideoScene
  durationInFrames: number
}

export type SceneComponent = React.FC<SceneComponentProps>

export interface RegistryEntry {
  component: SceneComponent
  defaultCamera?: Partial<VideoScene['camera']>
  defaultAnimation?: Partial<VideoScene['animation']>
  propsSchema?: string
  skipCameraWrap?: boolean
}
