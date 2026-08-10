import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import type { VideoScene } from '@xueai/shared'
import { designTokens } from '../design-system/tokens.js'

export interface CaptionLayerProps {
  scene: VideoScene
  durationInFrames: number
}

export const CaptionLayer: React.FC<CaptionLayerProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const text = scene.caption?.text ?? ''

  if (!text) return null

  const captionFadeIn = interpolate(frame, [0, Math.min(12, durationInFrames * 0.15)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const captionFadeOut = interpolate(
    frame,
    [Math.max(durationInFrames - 10, 0), durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const captionOpacity = Math.min(captionFadeIn, captionFadeOut)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '0 64px 120px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity: captionOpacity,
          color: scene.caption?.style?.color ?? designTokens.colors.text,
          fontSize: scene.caption?.style?.fontSize ?? 38,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.4,
          fontFamily: designTokens.fonts.sans,
          maxWidth: '86%',
          textShadow: '0 4px 32px rgba(0,0,0,0.85)',
        }}
      >
        {text}
      </div>
    </div>
  )
}
