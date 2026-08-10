import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'

const PURPOSE_LABELS: Record<string, string> = {
  hook: 'Hook',
  problem: 'Problem',
  solution: 'Solution',
  demo: 'Demo',
  result: 'Result',
  cta: 'CTA',
}

export interface ChapterOverlayProps {
  chapterIndex: number
  purpose?: string
  title?: string
  durationInFrames: number
}

export const ChapterOverlay: React.FC<ChapterOverlayProps> = ({
  chapterIndex,
  purpose,
  title,
  durationInFrames,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const entry = spring({
    fps,
    frame,
    config: { mass: 0.5, damping: 18, stiffness: 180 },
  })

  const exit = spring({
    fps,
    frame: frame - Math.max(durationInFrames - 18, 0),
    config: { damping: 200 },
  })

  const translateY = interpolate(exit, [0, 1], [0, -120])
  const opacity = Math.min(entry, 1 - exit * 0.5)
  const purposeKey = purpose?.toLowerCase() ?? ''
  const purposeLabel = PURPOSE_LABELS[purposeKey] ?? purpose ?? `Scene ${chapterIndex}`

  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        left: 48,
        zIndex: 20,
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${translateY}px) scale(${interpolate(entry, [0, 1], [0.92, 1])})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderRadius: designTokens.radii.lg,
          padding: '18px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          maxWidth: 520,
        }}
      >
        <div
          style={{
            fontFamily: designTokens.fonts.mono,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: designTokens.colors.remotionBlue,
            marginBottom: 6,
          }}
        >
          {String(chapterIndex).padStart(2, '0')} · {purposeLabel}
        </div>
        {title ? (
          <div
            style={{
              fontFamily: designTokens.fonts.sans,
              fontSize: 22,
              fontWeight: 700,
              color: '#0A0A0A',
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
        ) : null}
      </div>
    </div>
  )
}
