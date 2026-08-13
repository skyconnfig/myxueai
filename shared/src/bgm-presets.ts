export interface BgmPreset {
  id: string
  label: string
  mood: string
  /** Optional URL — set via env BGM_* or upload to storage/bgm/ */
  url?: string
  volume: number
}

const DEFAULT_BGM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'

export const BGM_PRESETS: BgmPreset[] = [
  {
    id: 'tech_pulse',
    label: '科技脉冲',
    mood: 'upbeat corporate tech, no vocals',
    volume: 0.22,
    url: DEFAULT_BGM_URL,
  },
  {
    id: 'tech_rhythm',
    label: '科技律动',
    mood: 'modern SaaS promo, energetic but clean',
    volume: 0.2,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'suspense_low',
    label: '低沉悬念',
    mood: 'tension build, documentary, minimal',
    volume: 0.18,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'rising_energy',
    label: '节奏递进',
    mood: 'building momentum, inspirational',
    volume: 0.24,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'climax',
    label: '高潮激昂',
    mood: 'triumphant corporate, short form',
    volume: 0.26,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'elegant_outro',
    label: '优雅收尾',
    mood: 'soft outro, warm, professional',
    volume: 0.16,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
]

export function resolveBgmPreset(categoryId?: string | null): BgmPreset {
  return BGM_PRESETS.find((p) => p.id === categoryId) ?? BGM_PRESETS[0]
}

export function resolveBgmUrl(categoryId?: string | null, fallbackUrl?: string | null): string {
  const preset = resolveBgmPreset(categoryId)
  return fallbackUrl?.trim() || preset.url || DEFAULT_BGM_URL
}
