import React from 'react'
import { AbsoluteFill } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { CameraMove } from '../animations/CameraMove.js'
import { RenderContextProvider } from '../core/RenderContext.js'
import { applyPurposePreset } from '../registry/purpose-registry.js'
import {
  isCinematicFallbackComponent,
} from '../scenes/CinematicFallbackScene.js'
import { resolveSceneComponentOrFallback } from '../registry/scene-registry.js'
import { SceneAudio } from '../audio/SceneAudio.js'
import { CaptionLayer } from '../subtitles/CaptionLayer.js'
import type { VideoCompositionJSON } from '@xueai/shared'

export interface SceneRendererProps {
  scene: VideoScene
  durationInFrames: number
  composition: VideoCompositionJSON
  sceneIndex: number
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  durationInFrames,
  composition,
  sceneIndex,
}) => {
  const enrichedScene = applyPurposePreset(scene)
  const entry = resolveSceneComponentOrFallback(String(enrichedScene.component))
  const Component = entry.component
  const useCameraWrap =
    !entry.skipCameraWrap && !isCinematicFallbackComponent(String(enrichedScene.component))
  const commercialComponents = new Set([
    'ProductDemo',
    'BrowserWindow',
    'DashboardAnimation',
    'FeatureReveal',
    'BeforeAfter',
    'CTA',
  ])
  const showCaption =
    Boolean(enrichedScene.caption?.text) &&
    !commercialComponents.has(String(enrichedScene.component)) &&
    !isCinematicFallbackComponent(String(enrichedScene.component))

  const content = (
    <AbsoluteFill style={{ backgroundColor: '#05070A', overflow: 'hidden' }}>
      <SceneAudio scene={enrichedScene} />
      {useCameraWrap ? (
        <CameraMove camera={enrichedScene.camera} durationInFrames={durationInFrames}>
          <Component scene={enrichedScene} durationInFrames={durationInFrames} />
        </CameraMove>
      ) : (
        <Component scene={enrichedScene} durationInFrames={durationInFrames} />
      )}
      {showCaption ? (
        <CaptionLayer scene={enrichedScene} durationInFrames={durationInFrames} />
      ) : null}
    </AbsoluteFill>
  )

  return (
    <RenderContextProvider
      value={{ fps: composition.fps, composition, sceneIndex, scene: enrichedScene }}
    >
      {content}
    </RenderContextProvider>
  )
}
