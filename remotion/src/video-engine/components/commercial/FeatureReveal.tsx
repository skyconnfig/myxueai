import React, { useMemo } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { FeatureRevealProps, VideoScene } from '@xueai/shared'
import { buildDefaultFeatureRevealProps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { resolveSpringPreset } from '../../animations/spring-presets.js'
import type { SceneComponentProps } from '../../registry/types.js'

function parseProps(scene: VideoScene): FeatureRevealProps {
  const raw = scene.props as Partial<FeatureRevealProps> | undefined
  if (raw?.features?.length) {
    return {
      headline: raw.headline ?? scene.caption?.text ?? 'Features',
      features: raw.features,
      theme: raw.theme,
    }
  }
  return buildDefaultFeatureRevealProps({
    headline: scene.caption?.text ?? 'Features',
    process: scene.meta?.action,
    result: scene.caption?.text,
  })
}

export const FeatureReveal: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const props = useMemo(() => parseProps(scene), [scene])
  const headlineEnter = spring({ frame, fps, config: resolveSpringPreset('smooth') })

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 70% 20%, rgba(59,130,246,0.25) 0%, ${designTokens.colors.bg} 60%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: designTokens.fonts.sans,
        padding: 80,
      }}
    >
      <div style={{ width: '80%', opacity: headlineEnter, transform: `translateY(${(1 - headlineEnter) * 30}px)` }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: designTokens.colors.text, marginBottom: 40 }}>
          {props.headline}
        </div>
        {props.features.map((feature, index) => {
          const delay = 10 + index * 12
          const itemEnter = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: resolveSpringPreset('snappy'),
          })
          return (
            <div
              key={feature.title}
              style={{
                opacity: itemEnter,
                transform: `translateX(${(1 - itemEnter) * 40}px)`,
                marginBottom: 20,
                padding: '20px 24px',
                borderRadius: designTokens.radii.md,
                background: designTokens.colors.surface,
                border: `1px solid ${designTokens.colors.border}`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: designTokens.colors.text }}>{feature.title}</div>
              {feature.description ? (
                <div style={{ fontSize: 15, color: designTokens.colors.muted, marginTop: 6 }}>{feature.description}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
