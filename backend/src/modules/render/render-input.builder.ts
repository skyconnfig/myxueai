import type { RenderInput } from '@xueai/shared'
import { RATIO_DIMENSIONS } from '@xueai/shared'
import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'

export class RenderInputBuilder {
  async build(projectId: string): Promise<RenderInput> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scenes: { orderBy: { order: 'asc' } },
        assets: true,
      },
    })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const dims = RATIO_DIMENSIONS[project.ratio] ?? RATIO_DIMENSIONS['9:16']

    const scenes = project.scenes.map((scene) => {
      const imageAsset = project.assets.find(
        (a) => a.sceneId === scene.id && a.type === 'IMAGE',
      )
      const audioAsset = project.assets.find(
        (a) => a.sceneId === scene.id && a.type === 'AUDIO',
      )
      return {
        order: scene.order,
        duration: scene.duration,
        text: scene.voiceText ?? scene.description,
        image: scene.imageUrl ?? imageAsset?.url,
        audio: audioAsset?.url,
        caption: {
          text: scene.voiceText ?? scene.description,
          style: { font: 'bold', color: '#ffffff' },
        },
      }
    })

    return {
      duration: project.duration,
      ratio: project.ratio,
      width: dims.width,
      height: dims.height,
      fps: 30,
      scenes,
    }
  }
}

export const renderInputBuilder = new RenderInputBuilder()
