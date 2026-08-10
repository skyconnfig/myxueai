import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'
import { typography } from '../../design-system/typography.js'

export interface SafeCaptionProps {
  text: string
  color?: string
  fontSize?: number
  durationInFrames: number
  position?: 'bottom' | 'center'
}

export const SafeCaption: React.FC<SafeCaptionProps> = ({
  text,
  color = designTokens.colors.text,
  fontSize = typography.sizes.lg,
  durationInFrames,
  position = 'bottom',
}) => {
  const frame = useCurrentFrame()
  const fadeIn = interpolate(frame, [0, Math.min(12, durationInFrames * 0.15)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeOut = interpolate(
    frame,
    [Math.max(durationInFrames - 10, 0), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: position === 'bottom' ? 'flex-end' : 'center',
        padding: position === 'bottom' ? '0 64px 120px' : '0 64px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity: Math.min(fadeIn, fadeOut),
          color,
          fontSize,
          fontWeight: typography.heading.fontWeight,
          textAlign: 'center',
          lineHeight: typography.heading.lineHeight,
          fontFamily: typography.heading.fontFamily,
          maxWidth: '86%',
          textShadow: '0 4px 32px rgba(0,0,0,0.85)',
        }}
      >
        {text}
      </div>
    </div>
  )
}
