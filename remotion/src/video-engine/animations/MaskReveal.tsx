import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

export interface MaskRevealProps {
  children: React.ReactNode
  durationInFrames: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

export const MaskReveal: React.FC<MaskRevealProps> = ({
  children,
  durationInFrames,
  direction = 'left',
}) => {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [0, Math.min(24, durationInFrames * 0.4)], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const clip =
    direction === 'left'
      ? `inset(0 ${100 - progress}% 0 0)`
      : direction === 'right'
        ? `inset(0 0 0 ${100 - progress}%)`
        : direction === 'up'
          ? `inset(${100 - progress}% 0 0 0)`
          : `inset(0 0 ${100 - progress}% 0)`

  return <div style={{ clipPath: clip }}>{children}</div>
}
