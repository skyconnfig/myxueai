import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { designTokens } from '../../design-system/tokens.js'

export interface DataChartProps {
  label: string
  value: number
  maxValue?: number
  progress: number
}

export const DataChart: React.FC<DataChartProps> = ({
  label,
  value,
  maxValue = 100,
  progress,
}) => {
  const displayValue = Math.round(interpolate(progress, [0, 1], [0, value]))
  const barWidth = interpolate(progress, [0, 1], [0, (value / maxValue) * 100])

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: designTokens.colors.muted,
          marginBottom: 8,
        }}
      >
        <span>{label}</span>
        <span style={{ color: designTokens.colors.text, fontWeight: 700 }}>{displayValue}%</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
          }}
        />
      </div>
    </div>
  )
}

export interface AnimatedMetricProps {
  target: number
  frame: number
  durationInFrames: number
  suffix?: string
}

export function useAnimatedMetric(target: number, frame: number, durationInFrames: number) {
  const progress = durationInFrames <= 1 ? 1 : frame / Math.max(durationInFrames - 1, 1)
  return Math.round(interpolate(progress, [0, 1], [0, target]))
}
