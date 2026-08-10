import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'
import { compositionTemplateLoader } from '../render/composition-template.loader.js'

export class TemplateService {
  async list(category?: string) {
    return prisma.videoTemplate.findMany({
      where: category ? { category } : undefined,
      include: {
        style: true,
        scenes: { orderBy: { order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    })
  }

  async getBySlug(slug: string) {
    const template = await prisma.videoTemplate.findUnique({
      where: { slug },
      include: {
        style: true,
        scenes: { orderBy: { order: 'asc' } },
      },
    })
    if (!template) throw new AppError(404, 'TEMPLATE_NOT_FOUND', '模板不存在')
    return template
  }

  async applyToProject(projectId: string, templateSlug: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', '项目不存在')

    const template = await this.getBySlug(templateSlug)
    const totalDuration = project.duration || template.duration

    await prisma.project.update({
      where: { id: projectId },
      data: {
        templateId: template.id,
        duration: totalDuration,
        ratio: template.ratio,
        storyboardStatus: 'draft',
      },
    })

    return { projectId, templateId: template.id, templateSlug, sceneCount: template.scenes.length }
  }

  getCompositionTemplate(slug: string) {
    return compositionTemplateLoader.load(slug)
  }

  listCompositionTemplates() {
    return compositionTemplateLoader.listSlugs().map((slug) => {
      try {
        return compositionTemplateLoader.load(slug)
      } catch {
        return null
      }
    }).filter(Boolean)
  }
}

export const templateService = new TemplateService()
