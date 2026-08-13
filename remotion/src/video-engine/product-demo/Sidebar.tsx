import React from 'react'
import { designTokens } from '../design-system/tokens.js'

export interface SidebarProps {
  theme?: 'dark' | 'light'
  activeTab?: 'dashboard' | 'analytics'
}

const NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: '▦' },
  { id: 'analytics' as const, label: 'Analytics', icon: '◔' },
  { id: 'workflows' as const, label: 'Workflows', icon: '⟳' },
  { id: 'settings' as const, label: 'Settings', icon: '⚙' },
]

export const Sidebar: React.FC<SidebarProps> = ({ theme = 'dark', activeTab = 'dashboard' }) => {
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        width: 148,
        flexShrink: 0,
        background: isDark ? '#0E1218' : '#F1F5F9',
        borderRight: `1px solid ${designTokens.colors.border}`,
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: designTokens.colors.text,
          padding: '4px 8px 12px',
          letterSpacing: 0.5,
        }}
      >
        XueAI
      </div>
      {NAV_ITEMS.map((item) => {
        const active = item.id === activeTab
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? designTokens.colors.text : designTokens.colors.muted,
              background: active ? `${designTokens.colors.accent}33` : 'transparent',
              border: active ? `1px solid ${designTokens.colors.accent}55` : '1px solid transparent',
            }}
          >
            <span style={{ opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </div>
        )
      })}
    </div>
  )
}
