import React from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { designTokens } from '../design-system/tokens.js'
import type { SimulatorPage } from './simulatorState.js'
import { Dashboard, AnalyticsPage } from './Dashboard.js'
import { Sidebar } from './Sidebar.js'

export interface PageTransitionProps {
  page: SimulatorPage
  loadingProgress: number
  title: string
  subtitle?: string
  theme?: 'dark' | 'light'
  dataValue: number
  dataAnimating: boolean
  buttonPulse?: number
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  page,
  loadingProgress,
  title,
  subtitle,
  theme = 'dark',
  dataValue,
  dataAnimating,
  buttonPulse = 0,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isDark = theme === 'dark'

  const dashOpacity =
    page === 'dashboard' ? 1 : page === 'loading' ? interpolate(loadingProgress, [0, 0.3], [1, 0.3]) : 0
  const analyticsOpacity =
    page === 'analytics' ? 1 : page === 'loading' ? interpolate(loadingProgress, [0.5, 1], [0, 1]) : 0

  return (
    <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 300 }}>
      <Sidebar
        theme={theme}
        activeTab={page === 'analytics' ? 'analytics' : 'dashboard'}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Dashboard layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: dashOpacity,
            transform: `translateX(${page === 'loading' ? interpolate(loadingProgress, [0, 0.5], [0, -20]) : 0}px)`,
          }}
        >
          <Dashboard title={title} subtitle={subtitle} theme={theme} buttonPulse={buttonPulse} />
        </div>

        {/* Loading overlay */}
        {page === 'loading' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(11,15,20,0.85)' : 'rgba(248,250,252,0.9)',
              zIndex: 5,
              opacity: interpolate(loadingProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `3px solid ${designTokens.colors.border}`,
                borderTopColor: designTokens.colors.accent,
                transform: `rotate(${(frame / fps) * 360}deg)`,
              }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: designTokens.colors.muted }}>
              Loading Analytics…
            </div>
            <div
              style={{
                marginTop: 8,
                width: 120,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${loadingProgress * 100}%`,
                  background: designTokens.colors.accent,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Analytics layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: analyticsOpacity,
            transform: `translateX(${page === 'analytics' ? 0 : 24}px)`,
          }}
        >
          <AnalyticsPage dataValue={dataValue} dataAnimating={dataAnimating} theme={theme} />
        </div>
      </div>
    </div>
  )
}
