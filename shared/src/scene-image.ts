/** Stock URLs previously assigned by index — should be replaced with AI-matched images */
import { SCENE_IMAGE_TEXT_FREE_RULE } from './prompt-presets.js'

export const LEGACY_STOCK_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
  'https://images.unsplash.com/photo-1518770660439-4636190af475',
]

export type SceneImageSource = 'ai' | 'manual' | null

export function isStockImageUrl(url?: string | null) {
  if (!url) return false
  const normalized = url.toLowerCase()
  return (
    normalized.includes('images.unsplash.com') ||
    normalized.includes('picsum.photos') ||
    LEGACY_STOCK_IMAGE_URLS.some((item) => normalized.includes(item.toLowerCase()))
  )
}

export function isPlaceholderStorageImage(url?: string | null) {
  if (!url) return false
  return url.startsWith('/storage/') && url.endsWith('.svg')
}

export function shouldRegenerateSceneImage(input: {
  imageUrl?: string | null
  imageSource?: SceneImageSource
  provider?: string | null
  force?: boolean
}) {
  if (input.force) return true
  if (input.imageSource === 'manual') return false
  if (!input.imageUrl) return true
  if (isStockImageUrl(input.imageUrl)) return true
  if (isPlaceholderStorageImage(input.imageUrl)) return true
  if (input.provider === 'placeholder') return true
  if (input.imageSource === 'ai' && input.provider === 'openai') return false
  if (input.imageSource === 'ai' && input.imageUrl.startsWith('/storage/')) return false
  if (input.provider === 'upload') return false
  if (input.imageUrl.startsWith('http')) return true
  return false
}

export function buildSceneImagePrompt(input: {
  title?: string | null
  description: string
  visualPrompt?: string | null
  voiceText?: string | null
  projectPrompt?: string
  style?: string | null
  videoStyle?: string | null
  ratio?: string
  shotType?: string | null
  cameraMotion?: string | null
  lighting?: string | null
  emotion?: string | null
  action?: string | null
  negativePrompt?: string | null
  negativeGlobal?: string | null
  sceneType?: string | null
}) {
  const visual = input.visualPrompt?.trim()
  const description = input.description.trim()
  const action = input.action?.trim()
  const environment = visual || description

  const cameraParts = [
    input.shotType?.replace(/_/g, ' '),
    input.cameraMotion?.replace(/_/g, ' '),
  ].filter(Boolean).join(', ')

  const avoidParts = [
    input.negativePrompt?.trim(),
    input.negativeGlobal?.trim(),
    'plastic look, 3d render, cartoon, fake UI, floating card, template style, powerpoint slide, white rectangle frame, isolated UI screenshot',
    'text overlay, readable text, typography, letters, words, captions, subtitles, watermark, signage, UI labels, screen text, logo with legible text',
  ].filter(Boolean)

  const sceneLine = action
    ? `${action} in ${environment}`
    : environment

  const uiHint = input.sceneType === 'ui_demo'
    ? 'Over-shoulder shot of laptop with abstract blurred dashboard glow on screen, hands on keyboard, no readable UI text or labels.'
    : ''

  const lines = [
    'Cinematic commercial still frame.',
    SCENE_IMAGE_TEXT_FREE_RULE,
    `Scene: ${sceneLine}.`,
    cameraParts ? `Camera: ${cameraParts}, cinematic movement feel.` : 'Camera: cinematic framing, natural composition.',
    input.lighting ? `Lighting: ${input.lighting}.` : 'Lighting: natural daylight, soft shadows.',
    input.emotion ? `Emotion: ${input.emotion}.` : '',
    input.videoStyle || input.style ? `Style: ${input.videoStyle || input.style}, photorealistic, premium, 8K.` : 'Style: premium commercial, photorealistic, documentary realism.',
    'Motion hint: subtle natural movement, real people, documentary realism.',
    uiHint,
    input.projectPrompt ? `Video topic (do not render as text): ${input.projectPrompt.trim()}.` : '',
    `${input.ratio ?? '9:16'} aspect ratio.`,
    `Avoid: ${avoidParts.join(', ')}.`,
  ]

  return lines.filter(Boolean).join(' ')
}
