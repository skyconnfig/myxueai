import React, { useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { BeforeAfterProps, VideoScene } from '@xueai/shared'
import { buildDefaultBeforeAfterProps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import type { SceneComponentProps } from '../../registry/types.js'

function parseProps(scene: VideoScene): BeforeAfterProps {
  const raw = scene.props as Partial<BeforeAfterProps> | undefined
  if (raw?.beforeText && raw?.afterText) return raw as BeforeAfterProps
  return buildDefaultBeforeAfterProps({
    beforeText: scene.meta?.action,
    afterText: scene.caption?.text,
  })
}

export const BeforeAfter: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const split = spring({ frame: frame - 8, fps, config: designTokens.spring.smooth })
  const dividerX = interpolate(split, [0, 1], [20, 50])

  return (
    <AbsoluteFill
      style={{
        background: designTokens.colors.bg,
        fontFamily: designTokens.fonts.sans,
        padding: 64,
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', height: 420, borderRadius: designTokens.radii.lg, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${dividerX}%`,
            background: '#1a1010',
            padding: 40,
            borderRight: `2px solid ${designTokens.colors.border}`,
          }}
        >
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>{props.beforeLabel}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: designTokens.colors.text }}>{props.beforeText}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: `${dividerX}%`,
            background: '#0f1a14',
            padding: 40,
          }}
        >
          <div style={{ fontSize: 13, color: designTokens.colors.success, marginBottom: 12 }}>{props.afterLabel}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: designTokens.colors.text }}>{props.afterText}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
