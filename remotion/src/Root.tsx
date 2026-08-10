import { Composition } from 'remotion'
import type { RenderInput } from '@xueai/shared'
import { VideoComposition } from './compositions/VideoComposition'
import { adaptRenderInput } from './video-engine/adapters/render-input.adapter'
import { calculateCompositionMetadata } from './video-engine/core/CompositionManager'

const defaultProps: RenderInput = {
  duration: 10,
  ratio: '9:16',
  width: 1080,
  height: 1920,
  fps: 30,
  scenes: [
    {
      order: 1,
      duration: 5,
      text: 'XueAI Video Factory',
      caption: { text: 'XueAI Video Factory', style: { color: '#ffffff' } },
    },
  ],
}

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
