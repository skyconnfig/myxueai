/** Stock URLs previously assigned by index — should be replaced with AI-matched images */
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
  ratio?: string
}) {
  const visual = input.visualPrompt?.trim()
  const voice = input.voiceText?.trim()
  const description = input.description.trim()
  const topic = input.projectPrompt?.trim()

  const subject = visual || description
  const lines = [
    subject,
    voice ? `Narration context: ${voice}` : '',
    input.title ? `Scene: ${input.title}` : '',
    topic ? `Video topic: ${topic}` : '',
    input.style ? `Visual style: ${input.style}` : '',
    `${input.ratio ?? '9:16'} vertical video frame, single cinematic shot`,
    'Photorealistic, cohesive with narration, emotionally engaging',
    'No text overlay, no watermark, no subtitles burned in',
  ]

  return lines.filter(Boolean).join('. ')
}
