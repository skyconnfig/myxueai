import { designTokens } from '../design-system/tokens.js'

export const springPresets = {
  smooth: designTokens.spring.smooth,
  snappy: designTokens.spring.snappy,
  cinematic: designTokens.spring.gentle,
} as const

export type SpringPresetName = keyof typeof springPresets

export function resolveSpringPreset(name?: string) {
  if (name && name in springPresets) {
    return springPresets[name as SpringPresetName]
  }
  return springPresets.smooth
}
