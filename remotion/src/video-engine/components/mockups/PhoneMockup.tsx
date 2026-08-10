import React from 'react'
import { designTokens } from '../../design-system/tokens.js'
import { layout } from '../../design-system/layout.js'

export interface PhoneMockupProps {
  children: React.ReactNode
  theme?: 'dark' | 'light'
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children, theme = 'dark' }) => {
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        width: layout.phoneMockupWidth,
        aspectRatio: '9 / 19',
        borderRadius: 36,
        overflow: 'hidden',
        border: `8px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
        background: isDark ? designTokens.colors.bg : '#fff',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 6,
          borderRadius: 999,
          background: isDark ? '#334155' : '#cbd5e1',
        }}
      />
      <div style={{ paddingTop: 24, height: '100%' }}>{children}</div>
    </div>
  )
}
