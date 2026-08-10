import { AppError } from '../../middleware/error-handler.js'
import { projectRepository } from '../project/project.repository.js'
import { projectService } from '../project/project.service.js'
import type { UpdateSceneInput } from '../project/project.types.js'
import { sceneRepository } from './scene.repository.js'

export class SceneService {
  async updateScene(id: string, input: UpdateSceneInput) {
    const scene = await sceneRepository.findById(id)
    if (!scene) {
      throw new AppError(404, 'SCENE_NOT_FOUND', 'Scene not found')
    }

    await sceneRepository.update(id, input)

    const totalDuration = await projectRepository.findById(scene.projectId)
    if (totalDuration) {
      const duration = totalDuration.scenes.reduce((sum, item) => sum + item.duration, 0)
      await projectRepository.update(scene.projectId, { duration })
    }

    return projectService.getProject(scene.projectId)
  }
}

export const sceneService = new SceneService()
