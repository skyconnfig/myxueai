import { Composition } from 'remotion'
import type { RenderInput } from '@xueai/shared'
import { VideoComposition } from './compositions/VideoComposition.js'

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
        calculateMetadata={({ props }) => {
          const input = props as RenderInput
          const totalSec = input.scenes.reduce((sum, s) => sum + s.duration, 0)
          const duration = Math.max(input.duration, totalSec)
          return {
            durationInFrames: Math.max(1, Math.round(duration * input.fps)),
            fps: input.fps,
            width: input.width,
            height: input.height,
          }
        }}
      />
    </>
  )
}
