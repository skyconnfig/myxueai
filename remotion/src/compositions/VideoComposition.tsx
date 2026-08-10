import React, { useMemo } from 'react'
import type { RenderInput } from '@xueai/shared'
import { adaptRenderInput } from '../video-engine/adapters/render-input.adapter.js'
import { CompositionManager } from '../video-engine/core/CompositionManager.js'

export const VideoComposition: React.FC<RenderInput> = (props) => {
  const composition = useMemo(() => adaptRenderInput(props), [props])
  return <CompositionManager composition={composition} />
}

export { CinematicScene as SceneSlide } from '../components/CinematicScene.js'
