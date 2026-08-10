import { AppError } from '../../middleware/error-handler.js'
import { ProjectStatus, TaskStatus, TaskType } from '../../constants/status.js'
import { projectRepository } from '../project/project.repository.js'
import { projectService } from '../project/project.service.js'
import { taskRepository } from '../task/task.repository.js'
import type { GenerateScriptInput, OptimizeScriptInput, VideoPlan } from '../project/project.types.js'
import { videoPlanSchema } from '../project/project.types.js'
import { openAICompatibleProvider } from './providers/openai-compatible.provider.js'
import { creditsService } from '../workspace/credits.service.js'
import { config } from '../../config/index.js'

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
]

function generatePresetVideoPlan(topic: string, style?: string, duration = 60): VideoPlan {
  const cleanTopic = topic.trim() || 'AI时代普通人的生产力革命'
  return {
    title: cleanTopic,
    duration,
    style: style || '深度解读',
    scenes: [
      {
        index: 1,
        title: '黄金3秒视觉钩子',
        duration: 8,
        description: '当大多数人还在讨论AI会不会取代人类时，头部创作者已经用AI自动化工厂，每天产出50条爆款视频。',
        visual: 'Close-up of sleek futuristic dark mode video workspace UI, high resolution 8k, professional editing aesthetic',
        voice: '当大多数人还在讨论AI时，头部创作者已用AI工厂批量生产。',
      },
      {
        index: 2,
        title: '行业痛点拆解',
        duration: 12,
        description: '传统的视频剪辑流程：写文案、找素材、对字幕、调色，一条1分钟视频可能要耗费整整4个小时。',
        visual: 'Split view of traditional timeline vs unified AI pipeline, clean dark slate blue aesthetic',
        voice: '传统剪辑：写文案、找素材、配字幕，1分钟视频耗时4小时。',
      },
      {
        index: 3,
        title: '核心方案展示',
        duration: 15,
        description: '而真正的生产力工具，将文案、分镜、素材匹配与多轨时间轴流水线化。',
        visual: 'Modern dark workstation canvas, multi-track video audio timeline with glowing audio waveform',
        voice: '真正高效的操作系统：文案、分镜、素材与时间轴的全自动流水线。',
      },
      {
        index: 4,
        title: '成果展示与数据证明',
        duration: 15,
        description: '从1条视频到多平台一键分发，生产效率提升10倍以上。这不仅仅是剪辑，这是内容生产的工业化。',
        visual: 'Multi-platform analytics display, clean bar charts, dark theme success metrics',
        voice: '生产效率提升10倍以上，实现内容的真正工业化量产。',
      },
      {
        index: 5,
        title: '号召行动与结尾',
        duration: 10,
        description: '关注 XueAI Video Factory，解锁专业级创作者的生产力操作系统。',
        visual: "Minimalist logo display 'XueAI Video Factory' with subtle frame geometric mark, dark charcoal canvas",
        voice: '关注 XueAI Video Factory，掌控专业级视频生产操作系统。',
      },
    ],
  }
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
    })),
  }
}

function trimVoice(text: string, max = 36) {
  const clean = text.trim().replace(/\s+/g, '')
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function optimizePresetScenes(
  scenes: Array<{
    index: number
    title?: string
    duration: number
    description: string
    visual: string
    voice: string
  }>,
  focusSceneIndex?: number,
) {
  return scenes.map((scene) => {
    if (focusSceneIndex != null && scene.index !== focusSceneIndex) return scene
    const voice = trimVoice(scene.voice || scene.description)
    const visual = scene.visual.includes('cinematic')
      ? scene.visual
      : `${scene.visual}, cinematic lighting, shallow depth of field, vertical video frame`
    return {
      ...scene,
      voice,
      visual,
      description: scene.description.trim(),
      title: scene.title ?? `分镜 ${scene.index}`,
    }
  })
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

    await creditsService.deduct(config.workspace.scriptGenerationCost, 'script_generation')

    let source: 'llm' | 'preset' = 'preset'
    let notice: string | undefined
    let plan: VideoPlan

    if (openAICompatibleProvider.isConfigured) {
      try {
        plan = await openAICompatibleProvider.generateVideoPlan({
          topic,
          style,
          duration,
          ratio: input.ratio ?? project.ratio,
        })
        plan = normalizePlan(plan, duration)
        source = 'llm'
      } catch (error) {
        notice = error instanceof Error ? error.message : 'LLM generation failed'
        plan = generatePresetVideoPlan(topic, style, duration)
      }
    } else {
      notice = 'LLM_API_KEY 未配置，已使用预设分镜模板'
      plan = generatePresetVideoPlan(topic, style, duration)
    }

    const nextVersion = (project.scripts[0]?.version ?? 0) + 1
    await projectRepository.saveScript(project.id, plan, nextVersion)

    await projectRepository.replaceScenes(
      project.id,
      plan.scenes.map((scene, idx) => ({
        title: scene.title,
        description: scene.description,
        visualPrompt: scene.visual,
        voiceText: scene.voice,
        duration: scene.duration,
        imageUrl: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
      })),
    )

    await projectRepository.update(project.id, {
      name: plan.title,
      duration: plan.duration,
      style: plan.style ?? style,
      status: ProjectStatus.PLANNING,
    })

    await taskRepository.create({
      projectId: project.id,
      type: TaskType.SCRIPT,
      status: TaskStatus.SUCCESS,
      progress: 100,
      result: { source, sceneCount: plan.scenes.length },
    })

    await taskRepository.create({
      projectId: project.id,
      type: TaskType.IMAGE,
      status: TaskStatus.WAITING,
      progress: 0,
    })

    const updated = await projectService.getProject(project.id)
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
    }))

    const cost = focusScene
      ? Math.round(config.workspace.scriptOptimizationCost * 0.5)
      : config.workspace.scriptOptimizationCost
    await creditsService.deduct(cost, 'script_optimization')

    let source: 'llm' | 'preset' = 'preset'
    let notice: string | undefined
    let summary: string | undefined
    let optimizedScenes: Array<{
      index: number
      title?: string
      duration: number
      description: string
      visual: string
      voice: string
    }> = currentScenes

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
      return {
        id: scene.id,
        title: optimized.title ?? scene.title,
        description: optimized.description,
        visualPrompt: optimized.visual,
        voiceText: optimized.voice,
        duration: optimized.duration,
      }
    }).filter(Boolean) as Array<{
      id: string
      title?: string | null
      description: string
      visualPrompt: string
      voiceText: string
      duration: number
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
    return {
      project: updated,
      source,
      notice,
      summary,
      optimizedCount: sceneUpdates.length,
    }
  }
}

export const scriptService = new ScriptService()
