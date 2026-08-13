import React from 'react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../design-system/tokens.js'
import { formatMetric } from './simulatorState.js'

export interface DashboardProps {
  title: string
  subtitle?: string
  theme?: 'dark' | 'light'
  buttonPulse?: number
}

export const Dashboard: React.FC<DashboardProps> = ({
  title,
  subtitle,
  theme = 'dark',
  buttonPulse = 0,
}) => {
  const isDark = theme === 'dark'
  return (
    <div style={{ flex: 1, padding: '20px 22px', minHeight: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: designTokens.colors.muted, marginBottom: 4 }}>Overview</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: designTokens.colors.text }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12, color: designTokens.colors.muted, marginTop: 4 }}>{subtitle}</div>
          ) : null}
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: `linear-gradient(135deg, ${designTokens.colors.accent}, ${designTokens.colors.accentBlue})`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: `0 0 ${12 + buttonPulse * 20}px ${designTokens.colors.accent}66`,
            transform: `scale(${1 + buttonPulse * 0.04})`,
          }}
        >
          Run Analysis
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
        {[
          { label: 'Active Users', value: '479K', accent: false },
          { label: 'Workflows', value: '128', accent: false },
          { label: 'Success Rate', value: '98.2%', accent: true },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${designTokens.colors.border}`,
            }}
          >
            <div style={{ fontSize: 10, color: designTokens.colors.muted }}>{card.label}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: card.accent ? designTokens.colors.accentBlue : designTokens.colors.text,
                marginTop: 4,
                fontFamily: designTokens.fonts.mono,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          height: 100,
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${designTokens.colors.border}`,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 10, color: designTokens.colors.muted, marginBottom: 8 }}>Weekly Activity</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
          {[40, 55, 45, 70, 62, 80, 75].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${designTokens.colors.accentBlue}, ${designTokens.colors.accent}88)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export interface AnalyticsPageProps {
  dataValue: number
  dataAnimating: boolean
  theme?: 'dark' | 'light'
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  dataValue,
  dataAnimating,
  theme = 'dark',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isDark = theme === 'dark'
  const glow = dataAnimating ? 0.5 + Math.sin((frame / fps) * 8) * 0.2 : 0

  const bars = [45, 52, 48, 65, 72, 85, 92]
  const animBars = bars.map((h, i) =>
    dataAnimating ? h + Math.sin((frame / fps) * 3 + i) * 4 : h,
  )

  return (
    <div style={{ flex: 1, padding: '20px 22px', minHeight: 300 }}>
      <div style={{ fontSize: 11, color: designTokens.colors.muted, marginBottom: 4 }}>Analytics</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: designTokens.colors.text, marginBottom: 16 }}>
        Real-time Metrics
      </div>

      <div
        style={{
          padding: '18px 20px',
          borderRadius: 12,
          background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
          border: `1px solid ${designTokens.colors.accent}55`,
          boxShadow: dataAnimating ? `0 0 ${24 + glow * 20}px ${designTokens.colors.accent}44` : 'none',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, color: designTokens.colors.muted }}>Total Users</div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: designTokens.colors.accent,
            fontFamily: designTokens.fonts.mono,
            transform: dataAnimating ? `scale(${1 + glow * 0.03})` : 'scale(1)',
          }}
        >
          {formatMetric(dataValue)}
        </div>
      </div>

      <div
        style={{
          height: 110,
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${designTokens.colors.border}`,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 10, color: designTokens.colors.muted, marginBottom: 8 }}>Growth Trend</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
          {animBars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 4,
                background: `linear-gradient(180deg, ${designTokens.colors.accent}, ${designTokens.colors.success})`,
                opacity: dataAnimating ? 0.85 + (i / animBars.length) * 0.15 : 0.8,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export const DataCounter: React.FC<{
  value: number
  suffix?: string
  label: string
  active: boolean
}> = ({ value, suffix = '%', label, active }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (!active) return null
  const pop = spring({ frame, fps, config: designTokens.spring.snappy })
  const pulse = 1 + Math.sin((frame / fps) * 6) * 0.04

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5,7,10,0.55)',
        zIndex: 30,
        opacity: pop,
      }}
    >
      <div style={{ textAlign: 'center', transform: `scale(${pop * pulse})` }}>
        <div style={{ fontSize: 14, color: designTokens.colors.muted, marginBottom: 8 }}>{label}</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: designTokens.colors.accent,
            fontFamily: designTokens.fonts.mono,
            textShadow: `0 0 40px ${designTokens.colors.accent}88`,
          }}
        >
          +{Math.round(value)}
          {suffix}
        </div>
      </div>
    </div>
  )
}
