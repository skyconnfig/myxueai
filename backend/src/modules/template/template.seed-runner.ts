import { prisma } from '../../config/database.js'
import { COMPONENT_SEEDS, TEMPLATE_SEEDS } from './template.seed.js'

export async function seedVideoTemplates() {
  for (const comp of COMPONENT_SEEDS) {
    await prisma.videoTemplateComponent.upsert({
      where: { slug: comp.slug },
      create: {
        slug: comp.slug,
        name: comp.name,
        remotionComponent: comp.remotionComponent,
        motionPattern: comp.motionPattern,
      },
      update: {
        name: comp.name,
        remotionComponent: comp.remotionComponent,
        motionPattern: comp.motionPattern,
      },
    })
  }

  for (const entry of TEMPLATE_SEEDS) {
    const style = await prisma.videoTemplateStyle.upsert({
      where: { slug: entry.style.slug },
      create: entry.style,
      update: entry.style,
    })

    const template = await prisma.videoTemplate.upsert({
      where: { slug: entry.template.slug },
      create: { ...entry.template, styleId: style.id },
      update: { ...entry.template, styleId: style.id },
    })

    await prisma.videoTemplateScene.deleteMany({ where: { templateId: template.id } })
    for (const scene of entry.scenes) {
      await prisma.videoTemplateScene.create({
        data: { templateId: template.id, ...scene },
      })
    }
  }
}
