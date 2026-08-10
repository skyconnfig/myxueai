import { Composition } from 'remotion'
import type { RenderInput } from '@xueai/shared'
import { VideoComposition } from './compositions/VideoComposition'
import { studioSaasDemoProps } from './fixtures/studio-saas-demo'
import { adaptRenderInput } from './video-engine/adapters/render-input.adapter'
import { calculateCompositionMetadata } from './video-engine/core/CompositionManager'

const defaultProps: RenderInput = studioSaasDemoProps

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={defaultProps.duration * defaultProps.fps}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={({ props }: { props: RenderInput }) => {
          const input = props as RenderInput
          const composition = adaptRenderInput(input)
          return calculateCompositionMetadata(composition)
        }}
      />
    </>
  )
}
