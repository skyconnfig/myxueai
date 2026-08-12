import type { CompositionMeta } from './video-composition.js'

export interface CompositionTemplateSceneBlueprint {
  order: number
  purpose: string
  component: string
  durationRatio: number
  camera?: {
    shotType?: string
    type?: string
    speed?: number
  }
  transition?: string
  assetRole?: 'evidence' | 'illustration'
  voiceHint?: string
  /** per-scene BGM ducking intensity override */
  bgmIntensity?: string
}

/**
 * Template style block. A template is more than a color swap — it encodes a
 * coherent visual + audio + rhythm personality so videos feel distinct
 * across Tech / Knowledge / Business / Story / Product / News.
 */
export interface CompositionTemplateStyle {
  /** primary accent color (hex) */
  accentColor?: string
  /** caption color (hex) */
  captionColor?: string
  /** caption font family */
  captionFont?: string
  /** caption font size */
  captionFontSize?: number
  /** caption weight */
  captionWeight?: number
  /** background base color (hex) */
  backgroundColor?: string
  /** BGM category id from bgm-presets */
  bgmCategory?: string
  /** default BGM volume 0-1 */
  bgmVolume?: number
  /** visual style hint fed into image prompts */
  visualStyle?: string
  /** default transition between scenes (cut | fade | slide | zoom | wipe | iris | morph) */
  defaultTransition?: string
  /** preferred camera motion family (static | dolly | pan | parallax | handheld) */
  cameraFamily?: string
  /** subtitle rendering style (clean | bold | karaoke | minimal) */
  subtitleStyle?: string
  /** whether to emphasize numbers in subtitles */
  emphasizeNumbers?: boolean
}

export interface CompositionTemplateJSON {
  name: string
  slug: string
  composition: 'VideoComposition'
  duration: number
  ratio: string
  fps: number
  meta: CompositionMeta
  sceneBlueprint: CompositionTemplateSceneBlueprint[]
  style?: CompositionTemplateStyle
}
