import { AppError } from '../../middleware/error-handler.js'

import { ProjectStatus, TaskStatus, TaskType } from '../../constants/status.js'

import { projectRepository } from '../project/project.repository.js'

import { projectService } from '../project/project.service.js'

import { taskRepository } from '../task/task.repository.js'

import type { ChangeStyleInput, GenerateScriptInput, OptimizeScriptInput, VideoPlan } from '../project/project.types.js'

import { videoPlanSchema } from '../project/project.types.js'

import { COMMERCIAL_NEGATIVE_PROMPT, COMMERCIAL_STYLE_PRESETS } from '@xueai/shared'

import { generatePresetDirectorBrief } from '../director/director.service.js'

import { openAICompatibleProvider } from './providers/openai-compatible.provider.js'

import { assetService } from '../asset/asset.service.js'

import { creditsService } from '../workspace/credits.service.js'

import { config } from '../../config/index.js'

import { logger } from '../../utils/logger.js'

import type { DirectorPlan } from '@xueai/shared'
import { buildDefaultProductDemoSteps } from '@xueai/shared'

import { directorService, generatePresetCinematicPlan } from '../director/director.service.js'

import { storyboardEngine } from '../video-intelligence/storyboard.engine.js'



function scheduleSceneImageGeneration(projectId: string, sceneId?: string) {

  void assetService

    .generateImagesForProject(projectId, undefined, sceneId ? { sceneId, force: true } : undefined)

    .catch((error) => {

      logger(`Background image generation failed for ${projectId}: ${error instanceof Error ? error.message : error}`)

    })

}



function normalizePlan(plan: VideoPlan, fallbackDuration: number): VideoPlan {

  const parsed = videoPlanSchema.safeParse(plan)

  if (!parsed.success) {

    throw new AppError(502, 'INVALID_LLM_OUTPUT', 'AI returned invalid video plan structure')

  }



  const duration = parsed.data.duration || fallbackDuration

  return {

    ...parsed.data,

    duration,

    scenes: parsed.data.scenes.map((scene, idx) => ({

      ...scene,

      index: scene.index || idx + 1,

      shotType: scene.shotType ?? 'medium',

      cameraMotion: scene.cameraMotion ?? 'slow_dolly_in',

      lighting: scene.lighting ?? 'natural daylight, soft shadows',

      emotion: scene.emotion ?? 'professional',

      transition: scene.transition ?? (idx === 0 ? 'cut' : 'crossfade'),

      sceneType: scene.sceneType ?? 'live_action',

    })),

  }

}



function trimVoice(text: string, max = 36) {
  const clean = text.trim().replace(/\s+/g, '')
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

const STYLE_SCENE_RULES: Record<string, {
  lighting: string
  cameraMotion: string
  emotion: string
  visualSuffix: string
  transition?: string
}> = {
  apple_saas_commercial: {
    lighting: 'natural daylight, soft shadows, premium commercial',
    cameraMotion: 'slow_dolly_in',
    emotion: 'professional',
    visualSuffix: ', Apple SaaS commercial aesthetic, documentary realism, photorealistic',
  },
  enterprise_documentary: {
    lighting: 'fluorescent office lighting, authentic workplace atmosphere',
    cameraMotion: 'pan_left',
    emotion: 'focused',
    visualSuffix: ', corporate documentary, authentic workplace, candid photography',
  },
  fast_promo: {
    lighting: 'high contrast, bold colors, dynamic lighting',
    cameraMotion: 'push_in',
    emotion: 'energetic',
    visualSuffix: ', fast-paced promo, dynamic energy, bold commercial',
    transition: 'push',
  },
}

function presetStyleLabel(videoStyle: string) {
  return COMMERCIAL_STYLE_PRESETS.find((item) => item.id === videoStyle)?.description ?? videoStyle
}

function applyPresetStyleToScenes(scenes: VideoPlan['scenes'], videoStyle: string) {
  const rules = STYLE_SCENE_RULES[videoStyle] ?? STYLE_SCENE_RULES.apple_saas_commercial
  return scenes.map((scene) => ({
    ...scene,
    lighting: rules.lighting,
    cameraMotion: rules.cameraMotion,
    emotion: rules.emotion,
    transition: rules.transition ?? scene.transition,
    negativePrompt: scene.negativePrompt ?? COMMERCIAL_NEGATIVE_PROMPT,
    visual: `${scene.visual.replace(/, (Apple SaaS|corporate documentary|fast-paced promo)[^,]*/gi, '').trim()}${rules.visualSuffix}`,
  }))
}

function optimizePresetScenes(

  scenes: VideoPlan['scenes'],

  focusSceneIndex?: number,

) {

  return scenes.map((scene) => {

    if (focusSceneIndex != null && scene.index !== focusSceneIndex) return scene

    const voice = trimVoice(scene.voice || scene.description)

    const visual = scene.visual.includes('cinematic')

      ? scene.visual

      : `${scene.visual}, cinematic commercial still, natural motion, documentary realism`

    return {

      ...scene,

      voice,

      visual,

      description: scene.description.trim(),

      title: scene.title ?? `分镜 ${scene.index}`,

      shotType: scene.shotType ?? 'medium',

      cameraMotion: scene.cameraMotion ?? 'slow_dolly_in',

      lighting: scene.lighting ?? 'natural daylight, soft shadows',

      emotion: scene.emotion ?? 'professional',

    }

  })

}



function resolveComponentType(scene: VideoPlan['scenes'][number]) {
  if (scene.componentType) return scene.componentType
  if (scene.sceneType === 'ui_demo') return 'ProductDemo'
  if (scene.storyBeat === 'solution') return 'BrowserWindow'
  if (scene.storyBeat === 'cta') return 'CTA'
  return undefined
}

function mapPlanScenesToDb(plan: VideoPlan) {
  const directorPlan: DirectorPlan = {
    title: plan.title,
    style: plan.style ?? '',
    audience: plan.directorBrief?.audience ?? '',
    emotion: plan.directorBrief?.emotion ?? 'professional',
    storyStructure: (plan.directorBrief?.story_arc ?? []).map((a) => ({
      type: a.type,
      duration: a.duration,
      beat: a.beat ?? '',
    })),
    goal: plan.directorBrief?.goal,
    scenes: plan.scenes.map((scene) => {
      const purpose = scene.storyBeat ?? 'hook'
      const componentType = resolveComponentType(scene)
      const isUiScene = componentType === 'ProductDemo' || componentType === 'BrowserWindow' || scene.sceneType === 'ui_demo'

      return {
        purpose,
        duration: scene.duration,
        shotType: scene.shotType ?? 'medium',
        cameraMovement: scene.cameraMotion ?? 'slow_dolly_in',
        lighting: scene.lighting ?? '',
        emotion: scene.emotion ?? '',
        visualDescription: scene.visual ?? scene.description,
        motionDescription: scene.action ?? '',
        voiceover: scene.voice ?? scene.description,
        componentType,
        input: scene.input ?? scene.description,
        process: scene.process ?? scene.action ?? scene.description,
        result: scene.result ?? scene.voice ?? scene.description,
        uiSteps: scene.uiSteps ?? (isUiScene
          ? buildDefaultProductDemoSteps({
              process: scene.process ?? scene.action,
              result: scene.result ?? scene.voice,
              duration: scene.duration,
            })
          : undefined),
        assetRequirement: {
          role: purpose === 'pain' || purpose === 'result' ? 'evidence' : 'illustration',
          type: isUiScene ? 'component' : purpose === 'pain' || purpose === 'result' ? 'stock' : 'ai-image',
          componentType,
        },
      }
    }),
  }

  const storyboard = storyboardEngine.buildStoryboardFromDirectorPlan(directorPlan)
  return storyboardEngine.storyboardToSceneCreatePayload(storyboard)
}



export class ScriptService {

  async generateScript(input: GenerateScriptInput) {

    const project = await projectRepository.findById(input.projectId)

    if (!project) {

      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')

    }



    const topic = input.prompt?.trim() || project.prompt

    const style = input.style ?? project.style ?? undefined

    const duration = input.duration ?? project.duration

    const audience = input.audience ?? project.audience ?? undefined

    const goal = input.goal ?? project.goal ?? undefined

    const videoStyle = input.videoStyle ?? project.videoStyle ?? undefined



    await creditsService.deduct(config.workspace.scriptGenerationCost, 'script_generation')



    let source: 'llm' | 'preset' = 'preset'

    let notice: string | undefined

    let plan: VideoPlan

    let brief = project.directorBrief as VideoPlan['directorBrief'] | null



    if (openAICompatibleProvider.isConfigured) {

      try {

        const result = await directorService.generateCinematicPlan({

          topic,

          style,

          videoStyle,

          audience,

          goal,

          duration,

          ratio: input.ratio ?? project.ratio,

        })

        plan = normalizePlan(result.plan, duration)

        brief = result.brief

        source = result.source

      } catch (error) {

        notice = error instanceof Error ? error.message : 'LLM generation failed'

        plan = normalizePlan(generatePresetCinematicPlan({ topic, style, videoStyle, audience, goal, duration }), duration)

        brief = plan.directorBrief

      }

    } else {

      notice = 'LLM_API_KEY 未配置，已使用商业片预设分镜模板'

      plan = normalizePlan(generatePresetCinematicPlan({ topic, style, videoStyle, audience, goal, duration }), duration)

      brief = plan.directorBrief

    }



    const nextVersion = (project.scripts[0]?.version ?? 0) + 1

    await projectRepository.saveScript(project.id, plan, nextVersion)



    await projectRepository.replaceScenes(project.id, mapPlanScenesToDb(plan))



    await projectRepository.update(project.id, {

      name: plan.title,

      duration: plan.duration,

      style: plan.style ?? style,

      audience,

      goal,

      videoStyle: videoStyle ?? brief?.video_style,

      emotion: brief?.emotion,

      directorBrief: brief ?? undefined,

      directorPlan: {
        title: plan.title,
        style: plan.style ?? style ?? '',
        audience: audience ?? brief?.audience ?? '',
        emotion: brief?.emotion ?? 'professional',
        storyStructure: brief?.story_arc ?? [],
        goal: goal ?? brief?.goal,
        scenes: plan.scenes.map((s) => ({
          purpose: s.storyBeat ?? 'hook',
          duration: s.duration,
          shotType: s.shotType ?? 'medium',
          cameraMovement: s.cameraMotion ?? 'slow_dolly_in',
          lighting: s.lighting ?? '',
          emotion: s.emotion ?? '',
          visualDescription: s.visual ?? s.description,
          motionDescription: s.action ?? '',
          voiceover: s.voice ?? s.description,
          assetRequirement: {
            role: s.storyBeat === 'pain' || s.storyBeat === 'result' ? 'evidence' : 'illustration',
            type: s.storyBeat === 'pain' || s.storyBeat === 'result' ? 'stock' : 'ai-image',
          },
        })),
      },

      storyboardStatus: 'draft',

      status: ProjectStatus.PLANNING,

    })



    await taskRepository.create({

      projectId: project.id,

      type: TaskType.SCRIPT,

      status: TaskStatus.SUCCESS,

      progress: 100,

      result: { source, sceneCount: plan.scenes.length, director: true },

    })



    await taskRepository.create({

      projectId: project.id,

      type: TaskType.IMAGE,

      status: TaskStatus.WAITING,

      progress: 0,

    })



    const updated = await projectService.getProject(project.id)

    scheduleSceneImageGeneration(project.id)

    return { project: updated, source, notice, plan }

  }



  async optimizeScript(input: OptimizeScriptInput) {

    const project = await projectRepository.findById(input.projectId)

    if (!project) {

      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')

    }

    if (project.scenes.length === 0) {

      throw new AppError(400, 'NO_SCENES', '请先生成分镜后再优化')

    }



    const focusScene = input.sceneId

      ? project.scenes.find((scene) => scene.id === input.sceneId)

      : undefined

    if (input.sceneId && !focusScene) {

      throw new AppError(404, 'SCENE_NOT_FOUND', '分镜不存在')

    }



    const style = input.style ?? project.style ?? undefined

    const currentScenes = project.scenes.map((scene) => ({

      index: scene.order,

      title: scene.title ?? undefined,

      duration: scene.duration,

      description: scene.description,

      visual: scene.visualPrompt ?? scene.description,

      voice: scene.voiceText ?? scene.description,

      storyBeat: scene.storyBeat ?? undefined,

      shotType: scene.shotType ?? undefined,

      cameraMotion: scene.cameraMotion ?? undefined,

      lighting: scene.lighting ?? undefined,

      emotion: scene.emotion ?? undefined,

      action: scene.action ?? undefined,

      negativePrompt: scene.negativePrompt ?? undefined,

      transition: scene.transition ?? undefined,

      sceneType: scene.sceneType ?? undefined,

    }))



    const cost = focusScene

      ? Math.round(config.workspace.scriptOptimizationCost * 0.5)

      : config.workspace.scriptOptimizationCost

    await creditsService.deduct(cost, 'script_optimization')



    let source: 'llm' | 'preset' = 'preset'

    let notice: string | undefined

    let summary: string | undefined

    let optimizedScenes: VideoPlan['scenes'] = currentScenes



    if (openAICompatibleProvider.isConfigured) {

      try {

        const result = await openAICompatibleProvider.optimizeVideoPlan({

          topic: project.prompt,

          style,

          duration: project.duration,

          ratio: project.ratio,

          focusSceneIndex: focusScene?.order,

          scenes: currentScenes,

        })

        optimizedScenes = result.scenes

        summary = result.summary

        source = 'llm'

      } catch (error) {

        notice = error instanceof Error ? error.message : 'LLM optimization failed'

        optimizedScenes = optimizePresetScenes(currentScenes, focusScene?.order)

        summary = '已使用本地规则优化口播与画面描述'

      }

    } else {

      notice = 'LLM_API_KEY 未配置，已使用本地规则优化'

      optimizedScenes = optimizePresetScenes(currentScenes, focusScene?.order)

      summary = '已压缩口播并增强画面描述'

    }



    const sceneUpdates = project.scenes.map((scene, idx) => {

      const optimized = optimizedScenes[idx]

      if (!optimized) return null

      if (focusScene && scene.id !== focusScene.id) return null

      const visualChanged = optimized.visual !== (scene.visualPrompt ?? scene.description)

      return {

        id: scene.id,

        title: optimized.title ?? scene.title,

        description: optimized.description,

        visualPrompt: optimized.visual,

        voiceText: optimized.voice,

        duration: optimized.duration,

        storyBeat: optimized.storyBeat ?? scene.storyBeat,

        shotType: optimized.shotType ?? scene.shotType,

        cameraMotion: optimized.cameraMotion ?? scene.cameraMotion,

        lighting: optimized.lighting ?? scene.lighting,

        emotion: optimized.emotion ?? scene.emotion,

        action: optimized.action ?? scene.action,

        negativePrompt: optimized.negativePrompt ?? scene.negativePrompt,

        transition: optimized.transition ?? scene.transition,

        sceneType: optimized.sceneType ?? scene.sceneType,

        ...(visualChanged ? { imageUrl: null as null, imageSource: null as null } : {}),

      }

    }).filter(Boolean) as Array<{

      id: string

      title?: string | null

      description: string

      visualPrompt: string

      voiceText: string

      duration: number

      storyBeat?: string | null

      shotType?: string | null

      cameraMotion?: string | null

      lighting?: string | null

      emotion?: string | null

      action?: string | null

      negativePrompt?: string | null

      transition?: string | null

      sceneType?: string | null

      imageUrl?: null

      imageSource?: null

    }>



    await projectRepository.updateScenesInPlace(project.id, sceneUpdates)



    const nextVersion = (project.scripts[0]?.version ?? 0) + 1

    await projectRepository.saveScript(

      project.id,

      {

        title: project.name,

        duration: project.duration,

        style,

        scenes: optimizedScenes,

        optimizedAt: new Date().toISOString(),

        summary,

      },

      nextVersion,

    )



    const updated = await projectService.getProject(project.id)

    if (sceneUpdates.some((item) => item.imageUrl === null)) {

      scheduleSceneImageGeneration(project.id, focusScene?.id)

    }

    return {

      project: updated,

      source,

      notice,

      summary,

      optimizedCount: sceneUpdates.length,

    }

  }

  async changeStyle(input: ChangeStyleInput) {
    const project = await projectRepository.findById(input.projectId)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found')
    if (project.scenes.length === 0) {
      throw new AppError(400, 'NO_SCENES', '请先生成分镜后再改变风格')
    }

    const styleLabel = presetStyleLabel(input.videoStyle)
    const currentScenes = project.scenes.map((scene) => ({
      index: scene.order,
      title: scene.title ?? undefined,
      duration: scene.duration,
      description: scene.description,
      visual: scene.visualPrompt ?? scene.description,
      voice: scene.voiceText ?? scene.description,
      storyBeat: scene.storyBeat ?? undefined,
      shotType: scene.shotType ?? undefined,
      cameraMotion: scene.cameraMotion ?? undefined,
      lighting: scene.lighting ?? undefined,
      emotion: scene.emotion ?? undefined,
      action: scene.action ?? undefined,
      negativePrompt: scene.negativePrompt ?? undefined,
      transition: scene.transition ?? undefined,
      sceneType: scene.sceneType ?? undefined,
    }))

    await creditsService.deduct(config.workspace.scriptOptimizationCost, 'style_change')

    let source: 'llm' | 'preset' = 'preset'
    let notice: string | undefined
    let summary: string | undefined
    let restyledScenes: VideoPlan['scenes'] = applyPresetStyleToScenes(currentScenes, input.videoStyle)

    if (openAICompatibleProvider.isConfigured) {
      try {
        const result = await openAICompatibleProvider.restyleVideoPlan({
          topic: project.prompt,
          videoStyle: input.videoStyle,
          styleLabel,
          duration: project.duration,
          ratio: project.ratio,
          scenes: currentScenes,
        })
        restyledScenes = result.scenes
        summary = result.summary ?? `已切换为 ${styleLabel}`
        source = 'llm'
      } catch (error) {
        notice = error instanceof Error ? error.message : 'LLM restyle failed'
        restyledScenes = applyPresetStyleToScenes(currentScenes, input.videoStyle)
        summary = `已使用预设规则切换为 ${styleLabel}`
      }
    } else {
      notice = 'LLM_API_KEY 未配置，已使用预设风格规则'
      summary = `已切换为 ${styleLabel}`
    }

    const brief = generatePresetDirectorBrief({
      topic: project.prompt,
      audience: project.audience ?? undefined,
      goal: project.goal ?? undefined,
      videoStyle: input.videoStyle,
      duration: project.duration,
    })

    const sceneUpdates = project.scenes.map((scene, idx) => {
      const restyled = restyledScenes[idx]
      if (!restyled) return null
      return {
        id: scene.id,
        visualPrompt: restyled.visual,
        description: restyled.description,
        lighting: restyled.lighting ?? scene.lighting,
        cameraMotion: restyled.cameraMotion ?? scene.cameraMotion,
        emotion: restyled.emotion ?? scene.emotion,
        action: restyled.action ?? scene.action,
        negativePrompt: restyled.negativePrompt ?? scene.negativePrompt,
        transition: restyled.transition ?? scene.transition,
        sceneType: restyled.sceneType ?? scene.sceneType,
        imageUrl: null as null,
        imageSource: null as null,
      }
    }).filter(Boolean) as Array<{
      id: string
      visualPrompt: string
      description: string
      lighting?: string | null
      cameraMotion?: string | null
      emotion?: string | null
      action?: string | null
      negativePrompt?: string | null
      transition?: string | null
      sceneType?: string | null
      imageUrl: null
      imageSource: null
    }>

    await projectRepository.updateScenesInPlace(project.id, sceneUpdates)
    await projectRepository.update(project.id, {
      videoStyle: input.videoStyle,
      emotion: brief.emotion,
      directorBrief: brief,
    })

    const nextVersion = (project.scripts[0]?.version ?? 0) + 1
    await projectRepository.saveScript(
      project.id,
      {
        title: project.name,
        duration: project.duration,
        style: project.style,
        directorBrief: brief,
        scenes: restyledScenes,
        styleChangedAt: new Date().toISOString(),
        summary,
      },
      nextVersion,
    )

    const updated = await projectService.getProject(project.id)
    scheduleSceneImageGeneration(project.id)

    return {
      project: updated,
      source,
      notice,
      summary,
      videoStyle: input.videoStyle,
      styleLabel,
      restyledCount: sceneUpdates.length,
    }
  }

}



export const scriptService = new ScriptService()

