import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../../config/database.js'
import { projectFootageDir, storagePaths } from '../../config/storage.js'
import { AppError } from '../../middleware/error-handler.js'
import { stockService, type StockVideoResult } from '../stock/stock.service.js'

function publicStorageUrl(relativePath: string) {
  return `/storage/${relativePath.replace(/\\/g, '/')}`
}

export class AssetPlannerService {
  shouldUseStock(scene: {
    storyBeat?: string | null
    assetRequirement?: unknown
    componentType?: string | null
  }) {
    const req = scene.assetRequirement as { role?: string; type?: string } | null
    if (req?.type === 'stock' || req?.role === 'evidence') return true
    if (scene.componentType === 'broll_video') return true
    if (scene.storyBeat === 'pain' || scene.storyBeat === 'result') return true
    return false
  }

  async downloadPexelsVideo(input: {
    pexelsId: number
    url: string
    projectId: string
    photographer: string
    duration?: number
    width?: number
    height?: number
  }) {
    const existing = await prisma.stockAsset.findUnique({
      where: { provider_externalId: { provider: 'pexels', externalId: String(input.pexelsId) } },
    })
    if (existing?.localPath && fs.existsSync(existing.localPath)) {
      return existing
    }

    const dir = projectFootageDir(input.projectId)
    fs.mkdirSync(dir, { recursive: true })
    const filename = `pexels-${input.pexelsId}.mp4`
    const localPath = path.join(dir, filename)

    const response = await fetch(input.url)
    if (!response.ok) throw new AppError(502, 'STOCK_DOWNLOAD_FAILED', 'Pexels 视频下载失败')
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(localPath, buffer)

    const rel = path.relative(storagePaths.root, localPath)
    const publicUrl = publicStorageUrl(rel)

    return prisma.stockAsset.upsert({
      where: { provider_externalId: { provider: 'pexels', externalId: String(input.pexelsId) } },
      create: {
        provider: 'pexels',
        externalId: String(input.pexelsId),
        localPath,
        url: publicUrl,
        duration: input.duration,
        width: input.width,
        height: input.height,
        photographer: input.photographer,
        license: 'Pexels License',
        metadata: { sourceUrl: input.url },
      },
      update: { localPath, url: publicUrl },
    })
  }

  async attachStockToScene(projectId: string, sceneId: string, stock: StockVideoResult) {
    const scene = await prisma.scene.findFirst({ where: { id: sceneId, projectId } })
    if (!scene) throw new AppError(404, 'SCENE_NOT_FOUND', '分镜不存在')

    const asset = await this.downloadPexelsVideo({
      pexelsId: stock.id,
      url: stock.url,
      projectId,
      photographer: stock.photographer,
      duration: stock.duration,
      width: stock.width,
      height: stock.height,
    })

    await prisma.scene.update({
      where: { id: sceneId },
      data: {
        videoUrl: asset.url,
        assetSource: 'pexels',
        componentType: 'broll_video',
        stockMeta: {
          pexelsId: stock.id,
          photographer: stock.photographer,
          license: 'Pexels',
          previewUrl: stock.previewUrl,
        },
      },
    })

    await prisma.asset.create({
      data: {
        projectId,
        sceneId,
        stockAssetId: asset.id,
        type: 'VIDEO',
        url: asset.url,
        provider: 'pexels',
        metadata: { pexelsId: stock.id, photographer: stock.photographer },
      },
    })

    return { sceneId, videoUrl: asset.url, stockAssetId: asset.id }
  }

  async autoFillProject(projectId: string) {
    if (!stockService.isConfigured()) {
      throw new AppError(503, 'PEXELS_NOT_CONFIGURED', '请配置 PEXELS_API_KEY')
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } } },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const attached: string[] = []
    for (const scene of project.scenes) {
      if (!this.shouldUseStock(scene) || scene.videoUrl) continue

      const queries = stockService.suggestQueries({
        topic: project.prompt,
        storyBeat: scene.storyBeat ?? undefined,
        action: scene.action ?? undefined,
        visualPrompt: scene.visualPrompt ?? undefined,
      })

      let picked: StockVideoResult | null = null
      for (const q of queries) {
        const results = await stockService.searchVideos(q, {
          orientation: project.ratio === '9:16' ? 'portrait' : 'landscape',
          perPage: 3,
        })
        if (results[0]) {
          picked = results[0]
          break
        }
      }
      if (!picked) continue

      await this.attachStockToScene(projectId, scene.id, picked)
      attached.push(scene.id)
    }

    return { projectId, attachedSceneIds: attached, count: attached.length }
  }
}

export const assetPlannerService = new AssetPlannerService()
