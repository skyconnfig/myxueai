import React from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { resolveSpringPreset, type SpringPresetName } from './spring-presets.js'

export interface SpringAnimationProps {
  children: React.ReactNode
  preset?: SpringPresetName
  delay?: number
  style?: React.CSSProperties
}

export const SpringAnimation: React.FC<SpringAnimationProps> = ({
  children,
  preset = 'smooth',
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: resolveSpringPreset(preset),
  })

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 24}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
