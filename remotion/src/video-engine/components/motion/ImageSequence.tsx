import React from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

function resolveSrc(src: string) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}

export interface ImageSequenceProps {
  frames: string[]
  durationInFrames: number
}

export const ImageSequence: React.FC<ImageSequenceProps> = ({ frames, durationInFrames }) => {
  const frame = useCurrentFrame()
  if (!frames.length) return null

  const index = Math.min(
    frames.length - 1,
    Math.floor(interpolate(frame, [0, durationInFrames], [0, frames.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })),
  )

  return (
    <AbsoluteFill>
      <Img
        src={resolveSrc(frames[index]!)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  )
}
