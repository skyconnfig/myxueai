import { prisma } from '../../config/database.js'
import type { UpdateSceneInput } from '../project/project.types.js'

export class SceneRepository {
  findById(id: string) {
    return prisma.scene.findUnique({ where: { id } })
  }

  update(id: string, data: UpdateSceneInput) {
    return prisma.scene.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.visualPrompt !== undefined ? { visualPrompt: data.visualPrompt } : {}),
        ...(data.voiceText !== undefined ? { voiceText: data.voiceText } : {}),
        ...(data.voiceId !== undefined ? { voiceId: data.voiceId } : {}),
        ...(data.voiceEmotion !== undefined ? { voiceEmotion: data.voiceEmotion } : {}),
        ...(data.duration !== undefined ? { duration: data.duration } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      },
    })
  }
}

export const sceneRepository = new SceneRepository()
