import React from 'react'
import { designTokens } from '../design-system/tokens.js'

export interface BrowserFrameProps {
  url?: string
  theme?: 'dark' | 'light'
  children: React.ReactNode
  /** 0-1 scene progress for chrome reveal */
  chromeReveal?: number
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url = 'app.demo/dashboard',
  theme = 'dark',
  children,
  chromeReveal = 1,
}) => {
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        width: '100%',
        borderRadius: designTokens.radii.lg,
        overflow: 'hidden',
        border: `1px solid ${designTokens.colors.border}`,
        boxShadow: '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        background: isDark ? '#0B0F14' : '#F8FAFC',
        opacity: chromeReveal,
        transform: `scale(${0.94 + chromeReveal * 0.06})`,
      }}
    >
      {children}
    </div>
  )
}

export const BrowserToolbar: React.FC<{ url: string; theme?: 'dark' | 'light' }> = ({
  url,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        height: 40,
        background: isDark ? '#151A22' : '#E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        borderBottom: `1px solid ${designTokens.colors.border}`,
      }}
    >
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
      ))}
      <div
        style={{
          flex: 1,
          marginLeft: 10,
          height: 22,
          borderRadius: 6,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          fontSize: 10,
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
  )
}
