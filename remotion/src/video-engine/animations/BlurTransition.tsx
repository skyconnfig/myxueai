import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

export interface BlurTransitionProps {
  children: React.ReactNode
  durationInFrames: number
  fadeInFrames?: number
  fadeOutFrames?: number
}

export const BlurTransition: React.FC<BlurTransitionProps> = ({
  children,
  durationInFrames,
  fadeInFrames = 12,
  fadeOutFrames = 10,
}) => {
  const frame = useCurrentFrame()
  const fadeIn = interpolate(frame, [0, fadeInFrames], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeOut = interpolate(
    frame,
    [Math.max(durationInFrames - fadeOutFrames, 0), durationInFrames],
    [0, 8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const blur = Math.max(fadeIn, fadeOut)

  return (
    <div style={{ filter: `blur(${blur}px)`, width: '100%', height: '100%' }}>{children}</div>
  )
}
