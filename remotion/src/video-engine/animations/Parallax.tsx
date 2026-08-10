import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

export interface ParallaxProps {
  children: React.ReactNode
  depth?: number
  durationInFrames: number
}

export const Parallax: React.FC<ParallaxProps> = ({ children, depth = 1, durationInFrames }) => {
  const frame = useCurrentFrame()
  const progress = durationInFrames <= 1 ? 0 : frame / Math.max(durationInFrames - 1, 1)
  const translateY = interpolate(progress, [0, 1], [20 * depth, -20 * depth])

  return <div style={{ transform: `translateY(${translateY}px)` }}>{children}</div>
}
