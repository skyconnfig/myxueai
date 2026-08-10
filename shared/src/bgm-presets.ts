export interface BgmPreset {
  id: string
  label: string
  mood: string
  /** Optional URL — set via env BGM_* or upload to storage/bgm/ */
  url?: string
  volume: number
}

export const BGM_PRESETS: BgmPreset[] = [
  { id: 'tech_pulse', label: '科技脉冲', mood: 'upbeat corporate tech, no vocals', volume: 0.22 },
  { id: 'tech_rhythm', label: '科技律动', mood: 'modern SaaS promo, energetic but clean', volume: 0.2 },
  { id: 'suspense_low', label: '低沉悬念', mood: 'tension build, documentary, minimal', volume: 0.18 },
  { id: 'rising_energy', label: '节奏递进', mood: 'building momentum, inspirational', volume: 0.24 },
  { id: 'climax', label: '高潮激昂', mood: 'triumphant corporate, short form', volume: 0.26 },
  { id: 'elegant_outro', label: '优雅收尾', mood: 'soft outro, warm, professional', volume: 0.16 },
]

export function resolveBgmPreset(categoryId?: string | null): BgmPreset {
  return BGM_PRESETS.find((p) => p.id === categoryId) ?? BGM_PRESETS[0]
}
