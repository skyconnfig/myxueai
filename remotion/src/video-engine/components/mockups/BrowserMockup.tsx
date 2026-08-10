import React from 'react'
import { designTokens } from '../../design-system/tokens.js'

export interface BrowserMockupProps {
  url?: string
  theme?: 'dark' | 'light'
  children: React.ReactNode
}

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  url = 'app.demo',
  theme = 'dark',
  children,
}) => {
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        width: '78%',
        borderRadius: designTokens.radii.lg,
        overflow: 'hidden',
        border: `1px solid ${designTokens.colors.border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        background: isDark ? '#0B0F14' : '#F8FAFC',
      }}
    >
      <div
        style={{
          height: 44,
          background: isDark ? '#1A1F26' : '#E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 16px',
        }}
      >
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <div
          style={{
            flex: 1,
            marginLeft: 12,
            height: 24,
            borderRadius: 6,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            fontSize: 11,
            color: designTokens.colors.muted,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontFamily: designTokens.fonts.mono,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ minHeight: 320, position: 'relative' }}>{children}</div>
    </div>
  )
}
