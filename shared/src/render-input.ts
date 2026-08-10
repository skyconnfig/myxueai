export interface RenderCaption {
  text: string
  style?: { font?: string; color?: string }
}

export interface RenderScene {
  order: number
  duration: number
  text: string
  image?: string
  audio?: string
  caption?: RenderCaption
}

export interface RenderInput {
  duration: number
  ratio: string
  width: number
  height: number
  fps: number
  scenes: RenderScene[]
  backgroundMusic?: {
    url: string
    volume: number
  }
}

export const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
}
