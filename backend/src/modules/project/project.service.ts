import { AppError } from '../../middleware/error-handler.js'
import { ProjectStatus } from '../../constants/status.js'
import { productionService } from '../production/production.service.js'
import { projectRepository } from './project.repository.js'
import type { CreateProjectInput } from './project.types.js'

function summarizeName(prompt: string) {
  const trimmed = prompt.trim()
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed
}

function toProjectDto(project: NonNullable<Awaited<ReturnType<typeof projectRepository.findById>>>) {
  const assets = project.assets ?? []
  return {
    id: project.id,
    name: project.name,
    prompt: project.prompt,
    status: project.status,
    ratio: project.ratio,
    duration: project.duration,
    style: project.style,
    videoUrl: project.videoUrl,
    thumbnail: project.thumbnail,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    scenes: project.scenes.map((scene) => {
      const audioAsset = assets.find(
        (asset) => asset.sceneId === scene.id && asset.type === 'AUDIO',
      )
      return {
        id: scene.id,
        projectId: scene.projectId,
        order: scene.order,
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visualPrompt,
        voiceText: scene.voiceText,
        voiceId: scene.voiceId,
        voiceEmotion: scene.voiceEmotion,
        duration: scene.duration,
        imageUrl: scene.imageUrl,
        videoUrl: scene.videoUrl,
        audioUrl: audioAsset?.url ?? null,
        audioProvider: audioAsset?.provider ?? null,
      }
    }),
    script: project.scripts[0]?.content ?? null,
  }
}

export class ProjectService {
  async listProjects(userId?: string) {
    const projects = await projectRepository.findAll(userId)
    return projects
      .filter((p) => p.name !== '__asset_library__')
      .map((project) => ({
      id: project.id,
      name: project.name,
      prompt: project.prompt,
      status: project.status,
      ratio: project.ratio,
      duration: project.duration,
      style: project.style,
      videoUrl: project.videoUrl,
      thumbnail: project.thumbnail,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      sceneCount: project._count.scenes,
    }))
  }

  async getProject(id: string) {
    const project = await projectRepository.findById(id)
    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    }
    return toProjectDto(project)
  }

  async createProject(input: CreateProjectInput, userId?: string) {
    const created = await projectRepository.create({
      ...input,
      userId,
      name: input.name ?? summarizeName(input.prompt),
    })
    const project = await projectRepository.findById(created.id)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    return toProjectDto(project)
  }

  async deleteProject(id: string) {
    const project = await this.getProject(id)
    if (
      project.status === ProjectStatus.GENERATING ||
      project.status === ProjectStatus.RENDERING ||
      productionService.isPipelineRunning(id)
    ) {
      await productionService.cancelProject(id)
    }
    await projectRepository.delete(id)
  }

  async markPlanning(id: string, data: { name?: string; duration?: number }) {
    await projectRepository.update(id, {
      ...(data.name ? { name: data.name } : {}),
      ...(data.duration ? { duration: data.duration } : {}),
      status: ProjectStatus.PLANNING,
    })
    const project = await projectRepository.findById(id)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    return toProjectDto(project)
  }
}

export const projectService = new ProjectService()
