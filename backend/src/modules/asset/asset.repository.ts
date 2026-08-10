import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/database.js'
import { AssetType } from '../../constants/status.js'

export class AssetRepository {
  findMany(filters: { projectId?: string; type?: string; userId?: string }) {
    return prisma.asset.findMany({
      where: {
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.userId ? { project: { userId: filters.userId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { audioMeta: true },
    })
  }

  findById(id: string) {
    return prisma.asset.findUnique({ where: { id }, include: { audioMeta: true } })
  }

  create(data: {
    projectId: string
    sceneId?: string | null
    type: string
    url: string
    provider?: string | null
    metadata?: Record<string, unknown> | null
  }) {
    return prisma.asset.create({
      data: {
        projectId: data.projectId,
        sceneId: data.sceneId ?? null,
        type: data.type,
        url: data.url,
        provider: data.provider ?? null,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  }

  delete(id: string) {
    return prisma.asset.delete({ where: { id } })
  }

  createAudioMeta(assetId: string, data: { duration?: number; voice?: string; language?: string }) {
    return prisma.audioAsset.create({
      data: { assetId, ...data },
    })
  }
}

export const assetRepository = new AssetRepository()

export { AssetType }
