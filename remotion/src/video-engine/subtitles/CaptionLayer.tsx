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
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '0 48px 96px',
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      <div
        style={{
          opacity: captionOpacity,
          maxWidth: '88%',
          background: 'rgba(15, 20, 25, 0.78)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: designTokens.radii.lg,
          borderLeft: `4px solid ${designTokens.colors.remotionBlue}`,
          padding: '18px 28px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            color: scene.caption?.style?.color ?? designTokens.colors.text,
            fontSize: scene.caption?.style?.fontSize ?? 34,
            fontWeight: 700,
            textAlign: 'left',
            lineHeight: 1.45,
            fontFamily: designTokens.fonts.sans,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
