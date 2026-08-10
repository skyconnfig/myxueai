import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
    }),
  ],
  theme: {
    colors: {
      xf: {
        bg: '#0A0E1A',
        panel: '#111827',
        surface: '#0F172A',
        border: 'rgba(255,255,255,0.08)',
        primary: '#3B82F6',
        success: '#22C55E',
        muted: '#9CA3AF',
      },
    },
  },
})
