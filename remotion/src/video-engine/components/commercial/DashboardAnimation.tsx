import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { DashboardAnimationProps } from '@xueai/shared'
import { buildDefaultDashboardProps } from '@xueai/shared'
import { designTokens } from '../../design-system/tokens.js'
import { SpringCard } from '../shared/SpringCard.js'
import { useAnimatedMetric } from '../motion/DataChart.js'
import type { SceneComponentProps } from '../../registry/types.js'
import type { VideoScene } from '@xueai/shared'

function parseProps(scene: VideoScene): DashboardAnimationProps {
  const raw = scene.props as Partial<DashboardAnimationProps> | undefined
  return raw?.metrics
    ? { title: raw.title ?? scene.caption?.text ?? 'Dashboard', metrics: raw.metrics, theme: raw.theme }
    : buildDefaultDashboardProps({ title: scene.caption?.text ?? 'Results', result: scene.meta?.action })
}

const MetricCell: React.FC<{
  label: string
  value: number
  suffix?: string
  delay: number
  durationInFrames: number
}> = ({ label, value, suffix, delay, durationInFrames }) => {
  const frame = useCurrentFrame()
  const display = useAnimatedMetric(value, Math.max(0, frame - delay), Math.max(1, durationInFrames - delay))
  const bar = interpolate(Math.max(0, frame - delay), [0, 30], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div>
      <div style={{ fontSize: 13, color: designTokens.colors.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: designTokens.colors.accent }}>
        {display}
        {suffix ?? ''}
      </div>
      <div
        style={{
          marginTop: 12,
          height: 4,
          width: `${bar}%`,
          background: designTokens.colors.accentBlue,
          borderRadius: 2,
        }}
      />
    </div>
  )
}

export const DashboardAnimation: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const props = parseProps(scene)

  return (
    <AbsoluteFill
      style={{
        background: designTokens.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: designTokens.fonts.sans,
        padding: 64,
      }}
    >
      <SpringCard style={{ width: '72%', padding: 40 }}>
        <div style={{ fontSize: 14, color: designTokens.colors.muted, marginBottom: 8 }}>Dashboard</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: designTokens.colors.text, marginBottom: 32 }}>
          {props.title}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {props.metrics.map((metric, index) => (
            <MetricCell
              key={metric.label}
              label={metric.label}
              value={metric.value}
              suffix={metric.suffix}
              delay={index * 8}
              durationInFrames={durationInFrames}
            />
          ))}
        </div>
      </SpringCard>
    </AbsoluteFill>
  )
}
