import React from 'react'
import type { RenderScene } from '@xueai/shared'
import { adaptRenderInput } from '../video-engine/adapters/render-input.adapter.js'
import { SceneRenderer } from '../video-engine/core/SceneRenderer.js'

/** Legacy CinematicScene — delegates to Scene Engine SceneRenderer */
export const CinematicScene: React.FC<{
  scene: RenderScene
  durationInFrames: number
}> = ({ scene, durationInFrames }) => {
  const composition = adaptRenderInput({
    duration: scene.duration,
    ratio: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    scenes: [scene],
  })

  return (
    <SceneRenderer
      scene={composition.scenes[0]!}
      durationInFrames={durationInFrames}
      composition={composition}
      sceneIndex={0}
    />
  )
}
