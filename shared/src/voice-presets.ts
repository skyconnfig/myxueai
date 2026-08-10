export interface VoicePreset {
  id: string
  label: string
  subtitle: string
  voiceId: string
  gender: 'male' | 'female' | 'neutral'
  speed?: number
}

export interface VoiceEmotion {
  id: string
  label: string
  speed: number
  pitch: number
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'lyrical',
    label: '云希',
    subtitle: '科技专业男声',
    voiceId: 'Chinese (Mandarin)_Lyrical_Voice',
    gender: 'male',
  },
  {
    id: 'executive',
    label: '沉稳',
    subtitle: '商务男声',
    voiceId: 'Chinese (Mandarin)_Reliable_Executive',
    gender: 'male',
  },
  {
    id: 'announcer',
    label: '播报',
    subtitle: '新闻男声',
    voiceId: 'Chinese (Mandarin)_Male_Announcer',
    gender: 'male',
  },
  {
    id: 'young',
    label: '青年',
    subtitle: '活力男声',
    voiceId: 'Chinese (Mandarin)_Unrestrained_Young_Man',
    gender: 'male',
  },
  {
    id: 'sweet',
    label: '晓晓',
    subtitle: '自然女声',
    voiceId: 'Chinese (Mandarin)_Sweet_Lady',
    gender: 'female',
  },
  {
    id: 'intellectual',
    label: '知性',
    subtitle: '专业女声',
    voiceId: 'Chinese (Mandarin)_IntellectualGirl',
    gender: 'female',
  },
  {
    id: 'radio',
    label: '电台',
    subtitle: '温暖女声',
    voiceId: 'Chinese (Mandarin)_Radio_Host',
    gender: 'female',
  },
  {
    id: 'anchor',
    label: '主播',
    subtitle: '新闻女声',
    voiceId: 'Chinese (Mandarin)_News_Anchor',
    gender: 'female',
  },
]

export const VOICE_EMOTIONS: VoiceEmotion[] = [
  { id: 'professional', label: '专业', speed: 1, pitch: 0 },
  { id: 'warm', label: '温暖', speed: 0.92, pitch: -2 },
  { id: 'energetic', label: '活泼', speed: 1.08, pitch: 3 },
  { id: 'calm', label: '沉稳', speed: 0.88, pitch: -1 },
  { id: 'passionate', label: '激情', speed: 1.05, pitch: 2 },
]

export const DEFAULT_VOICE_PRESET_ID = 'lyrical'
export const DEFAULT_VOICE_EMOTION_ID = 'professional'

export function findVoicePreset(id?: string | null) {
  return VOICE_PRESETS.find((item) => item.id === id) ?? VOICE_PRESETS[0]
}

export function findVoiceEmotion(id?: string | null) {
  return VOICE_EMOTIONS.find((item) => item.id === id) ?? VOICE_EMOTIONS[0]
}

export function resolveVoiceSettings(voiceId?: string | null, emotionId?: string | null) {
  const preset = findVoicePreset(voiceId)
  const emotion = findVoiceEmotion(emotionId)
  return {
    preset,
    emotion,
    minimaxVoiceId: preset.voiceId,
    speed: emotion.speed * (preset.speed ?? 1),
    pitch: emotion.pitch,
    displayName: `${preset.label} (${preset.subtitle})`,
    emotionLabel: emotion.label,
  }
}
