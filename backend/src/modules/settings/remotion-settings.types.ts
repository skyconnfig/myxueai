import { z } from 'zod'

export const remotionSettingsPatchSchema = z.object({
  width: z.number().int().min(640).max(3840).optional(),
  height: z.number().int().min(360).max(2160).optional(),
  fps: z.number().int().min(24).max(60).optional(),
  crf: z.number().int().min(0).max(51).optional(),
  concurrency: z.number().int().min(1).max(8).optional(),
  chromiumHeadless: z.boolean().optional(),
})

export type RemotionSettingsPatch = z.infer<typeof remotionSettingsPatchSchema>

export type RemotionBrowserStatus =
  | 'unknown'
  | 'checking'
  | 'installing'
  | 'ready'
  | 'missing'
  | 'failed'

export interface RemotionSettingsPublic {
  width: number
  height: number
  fps: number
  crf: number
  concurrency: number
  chromiumHeadless: boolean
  browser: {
    status: RemotionBrowserStatus
    message: string
    lastCheckedAt: string | null
  }
  renderScriptReady: boolean
  remotionPackageReady: boolean
  updatedAt: string | null
}

export interface RemotionSettingsStored {
  width?: number
  height?: number
  fps?: number
  crf?: number
  concurrency?: number
  chromiumHeadless?: boolean
}
