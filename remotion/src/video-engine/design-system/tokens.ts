export const designTokens = {
  colors: {
    bg: '#05070A',
    surface: '#0F1419',
    accent: '#6366F1',
    accentBlue: '#3B82F6',
    /** Remotion brand blue — https://github.com/remotion-dev/brand */
    remotionBlue: '#0C85F3',
    text: '#FFFFFF',
    muted: '#94A3B8',
    success: '#22C55E',
    border: 'rgba(255,255,255,0.08)',
  },
  fonts: {
    sans: '"Plus Jakarta Sans", "Noto Sans SC", system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },
  spring: {
    smooth: { damping: 200, mass: 0.8, stiffness: 120 },
    snappy: { damping: 18, mass: 0.6, stiffness: 200 },
    gentle: { damping: 28, mass: 1, stiffness: 80 },
  },
} as const
