import React from 'react'
import { AbsoluteFill } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'

export interface VideoFrameProps {
  children: React.ReactNode
  label?: string
}

/** Generic framed container for screen recordings or nested compositions */
export const VideoFrame: React.FC<VideoFrameProps> = ({ children, label }) => {
  return (
    <AbsoluteFill
      style={{
        background: designTokens.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
      }}
    >
      <div
        style={{
          width: '88%',
          borderRadius: designTokens.radii.lg,
          overflow: 'hidden',
          border: `1px solid ${designTokens.colors.border}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          background: '#000',
        }}
      >
        {label ? (
          <div
            style={{
              padding: '8px 16px',
              fontSize: 11,
              color: designTokens.colors.muted,
              background: '#111',
              fontFamily: designTokens.fonts.mono,
            }}
          >
            {label}
          </div>
        ) : null}
        {children}
      </div>
    </AbsoluteFill>
  )
}
