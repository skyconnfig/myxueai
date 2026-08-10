import { prisma } from '../../config/database.js'
import type { Prisma } from '@prisma/client'
import type { UpdateSceneInput } from '../project/project.types.js'

export class SceneRepository {
  findById(id: string) {
    return prisma.scene.findUnique({ where: { id } })
  }

  update(id: string, data: UpdateSceneInput & { cues?: unknown; transition?: string | null }) {
    const patch: Prisma.SceneUpdateInput = {}
    if (data.title !== undefined) patch.title = data.title
    if (data.description !== undefined) patch.description = data.description
    if (data.visualPrompt !== undefined) patch.visualPrompt = data.visualPrompt
    if (data.voiceText !== undefined) patch.voiceText = data.voiceText
    if (data.voiceId !== undefined) patch.voiceId = data.voiceId
    if (data.voiceEmotion !== undefined) patch.voiceEmotion = data.voiceEmotion
    if (data.duration !== undefined) patch.duration = data.duration
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl || null
    if (data.imageSource !== undefined) patch.imageSource = data.imageSource
    if (data.storyBeat !== undefined) patch.storyBeat = data.storyBeat
    if (data.shotType !== undefined) patch.shotType = data.shotType
    if (data.cameraMotion !== undefined) patch.cameraMotion = data.cameraMotion
    if (data.lighting !== undefined) patch.lighting = data.lighting
    if (data.emotion !== undefined) patch.emotion = data.emotion
    if (data.action !== undefined) patch.action = data.action
    if (data.negativePrompt !== undefined) patch.negativePrompt = data.negativePrompt
    if (data.transition !== undefined) patch.transition = data.transition
    if (data.sceneType !== undefined) patch.sceneType = data.sceneType
    if (data.cues !== undefined) patch.cues = data.cues as Prisma.InputJsonValue

    return prisma.scene.update({ where: { id }, data: patch })
  }
}

export const sceneRepository = new SceneRepository()
