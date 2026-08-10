import React, { createContext, useContext } from 'react'
import type { VideoCompositionJSON, VideoScene } from '@xueai/shared'

export interface RenderContextValue {
  fps: number
  composition: VideoCompositionJSON
  sceneIndex: number
  scene: VideoScene
}

const RenderContext = createContext<RenderContextValue | null>(null)

export function RenderContextProvider({
  value,
  children,
}: {
  value: RenderContextValue
  children: React.ReactNode
}) {
  return <RenderContext.Provider value={value}>{children}</RenderContext.Provider>
}

export function useRenderContext() {
  const ctx = useContext(RenderContext)
  if (!ctx) {
    throw new Error('useRenderContext must be used within RenderContextProvider')
  }
  return ctx
}

export function useOptionalRenderContext() {
  return useContext(RenderContext)
}
