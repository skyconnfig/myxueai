export type AssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FONT'

export interface AssetDto {
  id: string
  projectId: string
  sceneId: string | null
  type: AssetType
  url: string
  provider: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
