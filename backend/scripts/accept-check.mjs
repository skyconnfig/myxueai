import { prisma } from '../src/config/database.js'
import { compositionBuilder } from '../src/modules/render/composition.builder.js'
import { renderInputBuilder } from '../src/modules/render/render-input.builder.js'
import { validateRenderInput } from '../src/modules/render/render-validate.js'
import { stageRenderAssets } from '../src/modules/render/render-asset-staging.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PID = process.argv[2] ?? 'cmsn0nn5i0066w19ges0flxt8'
const out = []

function log(...args) {
  const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ')
  out.push(line)
  console.log(line)
}

try {
  const project = await prisma.project.findUnique({
    where: { id: PID },
    include: { scenes: { orderBy: { order: 'asc' } } },
  })

  if (!project) {
    const recent = await prisma.project.findMany({
      take: 8,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, status: true, _count: { select: { scenes: true } } },
    })
    log('PROJECT_NOT_FOUND', PID)
    log('recent projects:', recent)
    process.exitCode = 1
  } else {
    log('project:', {
      id: project.id,
      name: project.name,
      ratio: project.ratio,
      duration: project.duration,
      bgmCategory: project.bgmCategory,
      sceneCount: project.scenes.length,
    })
    log(
      'scenes:',
      project.scenes.map((s) => ({
        order: s.order,
        purpose: s.purpose,
        componentType: s.componentType,
        duration: s.duration,
        imageUrl: s.imageUrl,
        audioUrl: s.audioUrl ?? '(via assets)',
        storyBeat: s.storyBeat,
        transition: s.transition,
      })),
    )

    const totalSceneDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0)
    log('totalSceneDuration:', totalSceneDuration)

    const assets = await prisma.asset.findMany({
      where: { projectId: PID },
      select: { id: true, sceneId: true, type: true, url: true },
    })
    log('assets:', assets)

    const comp = await compositionBuilder.build(PID)
    log(
      'composition:',
      comp.scenes.map((s) => ({
        order: s.order,
        purpose: s.purpose,
        component: s.component,
        duration: s.duration,
        hasImage: !!s.media?.image,
        hasCaption: !!s.caption?.text,
        steps: s.props?.steps?.length ?? 0,
      })),
    )

    const input = await renderInputBuilder.build(PID)
    const issues = validateRenderInput(input)
    log('validation issues:', issues.filter((i) => i.severity !== 'minor'))

    const staged = stageRenderAssets(`accept-${Date.now()}`, input)
    log(
      'staged:',
      staged.scenes.map((s) => ({
        order: s.order,
        image: s.image,
        audio: s.audio,
        duration: s.duration,
      })),
    )
  }
} catch (err) {
  log('ERROR', err instanceof Error ? err.message : String(err))
  process.exitCode = 1
} finally {
  fs.writeFileSync(path.join(__dirname, '../../storage/_accept_check.json'), out.join('\n'), 'utf8')
  await prisma.$disconnect()
}
