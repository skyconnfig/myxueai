/**
 * E2E acceptance: one ProductDemo scene from saas-promo-60 → MP4
 *
 * Flow: create project → apply template → generate script (preset OK)
 *       → build composition → keep demo scene only → Remotion render
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RenderInput } from '@xueai/shared'
import { buildDefaultProductDemoSteps } from '@xueai/shared'

import { prisma } from '../src/config/database.js'
import { scriptService } from '../src/modules/ai/script.service.js'
import { compositionBuilder } from '../src/modules/render/composition.builder.js'
import { compositionTemplateLoader } from '../src/modules/render/composition-template.loader.js'
import { renderInputBuilder } from '../src/modules/render/render-input.builder.js'
import { stageRenderAssets } from '../src/modules/render/render-asset-staging.js'
import { projectService } from '../src/modules/project/project.service.js'
import { templateService } from '../src/modules/template/template.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')
const remotionRoot = path.resolve(backendRoot, '../remotion')
const storageRoot = path.resolve(backendRoot, '../storage')

const TEMPLATE_SLUG = 'saas-promo-60'
const DEMO_COMPONENT = 'ProductDemo'
const DEMO_BLUEPRINT_ORDER = 4

async function ensureSaasDemoScene(projectId: string, projectDuration: number) {
  const blueprint = compositionTemplateLoader.load(TEMPLATE_SLUG)
  const demoEntry = blueprint.sceneBlueprint.find((s) => s.component === DEMO_COMPONENT)
  if (!demoEntry) throw new Error('Template blueprint missing ProductDemo entry')

  const demoDuration = Math.max(1, Math.round(projectDuration * demoEntry.durationRatio))
  const scenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  })

  let target =
    scenes.find((s) => s.componentType === DEMO_COMPONENT || s.purpose === 'demo') ??
    scenes.find((s) => s.order === DEMO_BLUEPRINT_ORDER) ??
    scenes[Math.min(DEMO_BLUEPRINT_ORDER - 1, scenes.length - 1)]

  if (!target) {
    target = await prisma.scene.create({
      data: {
        projectId,
        order: DEMO_BLUEPRINT_ORDER,
        description: '产品功能演示：仪表盘与工作流自动化',
        voiceText: '一键配置工作流，实时查看团队效率数据',
        duration: demoDuration,
        purpose: 'demo',
        componentType: DEMO_COMPONENT,
        sceneType: 'demo',
        shotType: demoEntry.camera?.shotType ?? 'over_shoulder',
        cameraMotion: demoEntry.camera?.type ?? 'push_in',
        transition: demoEntry.transition ?? 'crossfade',
        processDesc: '打开仪表盘并创建自动化规则',
        resultDesc: '团队效率提升 87%',
        cues: {
          sceneProps: {
            title: 'XueAI 团队协作',
            url: 'app.demo/dashboard',
            theme: 'dark',
            steps: buildDefaultProductDemoSteps({
              process: '打开仪表盘并创建自动化规则',
              result: '团队效率提升 87%',
              duration: demoDuration,
            }),
          },
        },
      },
    })
    return target
  }

  const cues = (target.cues as Record<string, unknown> | null) ?? {}
  const sceneProps = (cues.sceneProps as Record<string, unknown> | undefined) ?? {}
  const steps = sceneProps.steps as unknown[] | undefined

  return prisma.scene.update({
    where: { id: target.id },
    data: {
      purpose: 'demo',
      componentType: DEMO_COMPONENT,
      sceneType: 'demo',
      duration: demoDuration,
      shotType: target.shotType ?? demoEntry.camera?.shotType ?? 'over_shoulder',
      cameraMotion: target.cameraMotion ?? demoEntry.camera?.type ?? 'push_in',
      transition: target.transition ?? demoEntry.transition ?? 'crossfade',
      processDesc: target.processDesc ?? '打开仪表盘并创建自动化规则',
      resultDesc: target.resultDesc ?? '团队效率提升 87%',
      cues: {
        ...cues,
        sceneProps: {
          ...sceneProps,
          title: sceneProps.title ?? 'XueAI 团队协作',
          url: sceneProps.url ?? 'app.demo/dashboard',
          theme: sceneProps.theme ?? 'dark',
          steps:
            steps?.length
              ? steps
              : buildDefaultProductDemoSteps({
                  process: target.processDesc ?? '打开仪表盘并创建自动化规则',
                  result: target.resultDesc ?? '团队效率提升 87%',
                  duration: demoDuration,
                }),
        },
      },
    },
  })
}

function toSingleSceneInput(full: RenderInput, demoScene: RenderInput['scenes'][0]): RenderInput {
  const duration = demoScene.duration
  const comp = full.composition
    ? {
        ...full.composition,
        duration,
        scenes: compScenesFromRender(demoScene, compSceneFromFull(full, demoScene.order)),
      }
    : undefined

  return {
    ...full,
    duration,
    scenes: [{ ...demoScene, order: 1 }],
    backgroundMusic: undefined,
    soundEffects: undefined,
    composition: comp,
  }
}

function compSceneFromFull(full: RenderInput, order: number) {
  return full.composition?.scenes.find((s) => s.order === order)
}

function compScenesFromRender(
  scene: RenderInput['scenes'][0],
  fromComp?: NonNullable<RenderInput['composition']>['scenes'][0],
) {
  if (!fromComp) return undefined
  return [{ ...fromComp, order: 1, duration: scene.duration }]
}

async function runRemotion(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const script = path.join(remotionRoot, 'scripts', 'render.mjs')
    const child = spawn(process.execPath, [script, inputPath, outputPath], {
      cwd: remotionRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        REMOTION_CRF: process.env.REMOTION_CRF ?? '23',
        REMOTION_CONCURRENCY: process.env.REMOTION_CONCURRENCY ?? '1',
      },
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`render exit ${code}`))))
    child.on('error', reject)
  })
}

async function main() {
  console.log('[e2e] === SaaS ProductDemo single-scene MP4 acceptance ===')

  const project = await projectService.createProject({
    prompt: '为团队协作 SaaS 做 60 秒商业宣传片，突出仪表盘与工作流自动化',
    ratio: '16:9',
    duration: 60,
    name: `E2E SaaS Demo ${Date.now()}`,
    audience: '产品负责人',
    goal: '获客转化',
    videoStyle: 'Apple SaaS 商业片',
  })
  console.log('[e2e] project created', project.id)

  await templateService.applyToProject(project.id, TEMPLATE_SLUG)
  console.log('[e2e] template applied', TEMPLATE_SLUG)

  const scriptResult = await scriptService.generateScript({
    projectId: project.id,
    duration: 60,
    ratio: '16:9',
  })
  console.log('[e2e] script generated', {
    source: scriptResult.source,
    sceneCount: scriptResult.plan.scenes.length,
  })

  await ensureSaasDemoScene(project.id, 60)
  console.log('[e2e] demo scene ensured (ProductDemo + uiSteps)')

  const composition = await compositionBuilder.build(project.id)
  const demoCompScene = composition.scenes.find(
    (s) => s.component === DEMO_COMPONENT || s.purpose === 'demo',
  )
  if (!demoCompScene) {
    throw new Error(`No ${DEMO_COMPONENT} scene in composition`)
  }

  const steps = (demoCompScene.props as { steps?: unknown[] } | undefined)?.steps ?? []
  console.log('[e2e] demo scene', {
    order: demoCompScene.order,
    component: demoCompScene.component,
    duration: demoCompScene.duration,
    camera: demoCompScene.camera,
    uiSteps: steps.length,
  })

  if (steps.length === 0) {
    throw new Error('ProductDemo scene has no uiSteps — acceptance failed')
  }

  const fullInput = await renderInputBuilder.build(project.id)
  const demoRenderScene = fullInput.scenes.find(
    (s) => s.componentType === DEMO_COMPONENT || s.purpose === 'demo',
  )
  if (!demoRenderScene) {
    throw new Error(`No ${DEMO_COMPONENT} in render input`)
  }

  const singleInput = toSingleSceneInput(fullInput, demoRenderScene)
  const renderId = `e2e-saas-demo-${Date.now()}`
  const staged = stageRenderAssets(renderId, singleInput)

  const dir = path.join(storageRoot, 'renders', renderId)
  fs.mkdirSync(dir, { recursive: true })
  const inputPath = path.join(dir, 'input.json')
  const outputPath = path.join(dir, 'output.mp4')
  fs.writeFileSync(inputPath, JSON.stringify(staged, null, 2))

  console.log('[e2e] rendering', {
    inputPath,
    outputPath,
    durationSec: singleInput.duration,
    resolution: `${singleInput.width}x${singleInput.height}`,
  })

  await runRemotion(inputPath, outputPath)

  const stat = fs.statSync(outputPath)
  const minBytes = 50_000
  if (stat.size < minBytes) {
    throw new Error(`MP4 too small (${stat.size} bytes) — likely corrupt`)
  }

  console.log('[e2e] ✅ ACCEPTANCE PASSED')
  console.log('[e2e] MP4', outputPath)
  console.log('[e2e] size', stat.size, 'bytes')
  console.log('[e2e] projectId', project.id)
  console.log('[e2e] renderId', renderId)
}

main().catch((err) => {
  console.error('[e2e] ❌ FAILED', err)
  process.exit(1)
})
