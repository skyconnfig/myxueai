import React from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'
import { resolveSpringPreset } from '../../animations/spring-presets.js'

export interface SpringCardProps {
  children: React.ReactNode
  springPreset?: 'smooth' | 'snappy' | 'cinematic'
  delay?: number
  style?: React.CSSProperties
}

export const SpringCard: React.FC<SpringCardProps> = ({
  children,
  springPreset = 'smooth',
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: resolveSpringPreset(springPreset),
  })

  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px) scale(${0.94 + enter * 0.06})`,
        background: designTokens.colors.surface,
        border: `1px solid ${designTokens.colors.border}`,
        borderRadius: designTokens.radii.lg,
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
