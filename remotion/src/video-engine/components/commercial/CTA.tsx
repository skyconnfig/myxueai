import React, { useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { CTAProps, VideoScene } from '@xueai/shared'
import { buildDefaultCTAProps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import type { SceneComponentProps } from '../../registry/types.js'

function parseProps(scene: VideoScene): CTAProps {
  const raw = scene.props as Partial<CTAProps> | undefined
  if (raw?.headline) return { ...buildDefaultCTAProps({ headline: scene.caption?.text ?? 'CTA' }), ...raw }
  return buildDefaultCTAProps({
    headline: scene.caption?.text ?? 'Ready to transform your workflow?',
    subline: scene.meta?.action,
  })
}

export const CTA: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const enter = spring({ frame, fps, config: designTokens.spring.smooth })
  const pulse = 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.02

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, rgba(99,102,241,0.35) 0%, ${designTokens.colors.bg} 65%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: designTokens.fonts.sans,
        textAlign: 'center',
        padding: 80,
      }}
    >
      <div style={{ opacity: enter, transform: `scale(${0.92 + enter * 0.08})` }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: designTokens.colors.text, marginBottom: 16 }}>
          {props.headline}
        </div>
        {props.subline ? (
          <div style={{ fontSize: 20, color: designTokens.colors.muted, marginBottom: 40 }}>{props.subline}</div>
        ) : null}
        <div
          style={{
            display: 'inline-block',
            padding: '16px 36px',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            transform: `scale(${pulse})`,
            boxShadow: '0 16px 40px rgba(99,102,241,0.45)',
          }}
        >
          {props.buttonText ?? 'Get Started'}
        </div>
      </div>
    </AbsoluteFill>
  )
}
