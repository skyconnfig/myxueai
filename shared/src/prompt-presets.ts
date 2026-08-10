export const COMMERCIAL_NEGATIVE_PROMPT = [
  'plastic look',
  '3d render',
  'cartoon',
  'fake UI',
  'floating card',
  'template style',
  'AI generated appearance',
  'powerpoint slide',
  'white rectangle frame',
  'stock photo watermark',
  'isolated UI screenshot',
  'artificial 3D',
  'text overlay',
  'readable text',
  'typography',
  'letters',
  'words',
  'captions',
  'subtitles burned in',
  'watermark',
  'signage',
  'UI labels',
  'screen text',
  'Chinese characters in image',
  'English text in image',
  'logo with legible text',
].join(', ')

/** Appended to every AI scene still — images are B-roll; text belongs in Remotion overlays. */
export const SCENE_IMAGE_TEXT_FREE_RULE =
  'Pure photographic frame only: zero readable text, typography, captions, logos with legible letters, or UI labels anywhere in the image.'

export const COMMERCIAL_STYLE_PRESETS = [
  { id: 'apple_saas_commercial', label: 'Apple SaaS 商业片', description: 'Apple product commercial, documentary realism' },
  { id: 'enterprise_documentary', label: '企业纪录片', description: 'Corporate documentary, authentic workplace' },
  { id: 'fast_promo', label: '快节奏促销', description: 'Fast-paced promo, dynamic energy, bold cuts' },
] as const

export const GOAL_PRESETS = [
  { id: 'conversion', label: '提升转化' },
  { id: 'brand', label: '品牌认知' },
  { id: 'tutorial', label: '产品教程' },
] as const
