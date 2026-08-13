import { COMMERCIAL_NEGATIVE_PROMPT, COMMERCIAL_STYLE_PRESETS, buildDefaultProductDemoSteps } from '@xueai/shared'
import type { ComposedSkillBundle, SkillDefinition } from '@xueai/shared'
import type { DirectorBrief, VideoPlan } from '../project/project.types.js'
import { openAICompatibleProvider } from '../ai/providers/openai-compatible.provider.js'
import { buildSkillPromptFragment } from '../skills/skill-prompt.js'

function presetStyleLabel(videoStyle?: string) {
  return COMMERCIAL_STYLE_PRESETS.find((item) => item.id === videoStyle)?.description
    ?? videoStyle
    ?? 'Apple SaaS commercial, documentary realism'
}

export function generatePresetDirectorBrief(input: {
  topic: string
  audience?: string
  goal?: string
  videoStyle?: string
  duration?: number
}): DirectorBrief {
  const duration = input.duration ?? 30
  return {
    video_style: presetStyleLabel(input.videoStyle),
    emotion: 'professional',
    audience: input.audience ?? '企业运营管理者',
    goal: input.goal ?? '提升产品转化',
    story_arc: [
      { type: 'pain', duration: Math.round(duration * 0.2), beat: '团队凌晨仍在手工处理 Excel 和订单' },
      { type: 'solution', duration: Math.round(duration * 0.45), beat: '引入 SaaS 系统，自动化流程启动' },
      { type: 'result', duration: Math.round(duration * 0.25), beat: '团队高效协作，数据实时可见' },
      { type: 'cta', duration: Math.max(4, Math.round(duration * 0.1)), beat: '立即免费试用' },
    ],
    negative_global: COMMERCIAL_NEGATIVE_PROMPT,
  }
}

export function generatePresetCinematicPlan(input: {
  topic: string
  style?: string
  videoStyle?: string
  audience?: string
  goal?: string
  duration?: number
}): VideoPlan {
  const cleanTopic = input.topic.trim() || 'SaaS 产品宣传视频'
  const duration = input.duration ?? 30
  const brief = generatePresetDirectorBrief(input)

  return {
    title: cleanTopic,
    duration,
    style: input.style ?? brief.video_style,
    directorBrief: brief,
    scenes: [
      {
        index: 1,
        storyBeat: 'pain',
        title: '深夜运营困境',
        duration: Math.round(duration * 0.2),
        description: '运营主管凌晨仍在手工核对订单与表格，团队疲惫不堪。',
        shotType: 'close_up',
        cameraMotion: 'slow_dolly_in',
        lighting: 'dim office, warm desk lamp, soft shadows',
        emotion: 'stress',
        action: 'person typing on laptop, rubbing temples, scattered papers',
        visual: 'Cinematic close-up of tired operations manager working late in modern office, laptop screen glow, realistic, premium commercial',
        voice: '每天凌晨，还在手工对账？',
        negativePrompt: 'floating UI card, 3d render, cartoon',
        transition: 'cut',
        sceneType: 'live_action',
      },
      {
        index: 2,
        storyBeat: 'pain',
        title: '订单暴增压力',
        duration: Math.round(duration * 0.15),
        description: '客户订单暴增，团队应接不暇，错误频发。',
        shotType: 'wide',
        cameraMotion: 'pan_left',
        lighting: 'fluorescent office lighting, cool tones',
        emotion: 'urgency',
        action: 'busy team answering phones, stacks of paperwork',
        visual: 'Wide shot of stressed business team in open office during peak hours, phones ringing, realistic documentary style',
        voice: '订单一多，错误就跟着来。',
        negativePrompt: 'floating card, template UI',
        transition: 'crossfade',
        sceneType: 'live_action',
      },
      {
        index: 3,
        storyBeat: 'solution',
        title: '打开 SaaS 系统',
        duration: Math.round(duration * 0.2),
        description: '团队打开 SaaS 管理系统，自动化流程开始运行。',
        shotType: 'over_shoulder',
        cameraMotion: 'push_in',
        lighting: 'natural daylight from window, screen glow',
        emotion: 'confidence',
        action: 'hands on keyboard, laptop showing dashboard, subtle screen animation',
        visual: 'Over-shoulder shot of professional using SaaS dashboard on laptop, hands typing, natural office light, no isolated UI card, cinematic commercial',
        voice: '一套系统，把流程全部自动化。',
        negativePrompt: 'isolated UI screenshot, white rectangle frame',
        transition: 'crossfade',
        sceneType: 'ui_demo',
        componentType: 'ProductDemo',
        input: '用户打开 SaaS 仪表盘',
        process: '点击自动化工作流按钮',
        result: '效率提升至 87%',
        uiSteps: buildDefaultProductDemoSteps({
          process: '点击自动化工作流按钮',
          result: '效率提升至 87%',
          duration: Math.round(duration * 0.2),
        }),
      },
      {
        index: 4,
        storyBeat: 'solution',
        title: '自动化运行',
        duration: Math.round(duration * 0.2),
        description: '数据自动同步，流程顺畅运转，团队专注高价值工作。',
        shotType: 'medium',
        cameraMotion: 'orbit',
        lighting: 'bright modern office, soft natural light',
        emotion: 'confidence',
        action: 'team collaborating around screen, pointing at data',
        visual: 'Medium shot of confident team reviewing analytics on large monitor, collaborative modern workspace, documentary realism',
        voice: '数据实时同步，团队专注真正重要的事。',
        negativePrompt: 'plastic look, 3d render',
        transition: 'crossfade',
        sceneType: 'live_action',
      },
      {
        index: 5,
        storyBeat: 'result',
        title: '团队轻松协作',
        duration: Math.round(duration * 0.15),
        description: '办公室氛围轻松，团队高效协作，成果显著。',
        shotType: 'wide',
        cameraMotion: 'slow_dolly_out',
        lighting: 'warm golden hour through windows',
        emotion: 'relief',
        action: 'team smiling, walking through modern office',
        visual: 'Wide cinematic shot of relaxed professional team in bright modern office, warm natural lighting, success atmosphere',
        voice: '效率提升十倍，团队终于能准时下班。',
        negativePrompt: 'cartoon, fake UI',
        transition: 'crossfade',
        sceneType: 'live_action',
      },
      {
        index: 6,
        storyBeat: 'cta',
        title: '立即开始',
        duration: Math.max(4, Math.round(duration * 0.1)),
        description: '产品 logo 与行动号召，引导用户注册试用。',
        shotType: 'medium',
        cameraMotion: 'static',
        lighting: 'clean studio lighting, premium brand feel',
        emotion: 'success',
        action: 'product logo on screen, professional presenter gesture',
        visual: 'Clean premium brand moment, modern SaaS product identity, minimal cinematic background, no floating cards',
        voice: `立即体验 ${cleanTopic.slice(0, 12)}，免费开始。`,
        negativePrompt: 'powerpoint slide, template style',
        transition: 'crossfade',
        sceneType: 'abstract',
      },
    ],
  }
}

export class DirectorService {
  async generateCinematicPlan(input: {
    topic: string
    style?: string
    videoStyle?: string
    audience?: string
    goal?: string
    duration?: number
    ratio?: string
    skillBundle?: ComposedSkillBundle
    activeSkills?: SkillDefinition[]
    skillPromptFragment?: string
  }): Promise<{ plan: VideoPlan; brief: DirectorBrief; source: 'llm' | 'preset' }> {
    const duration = input.duration ?? 30
    const skillPromptFragment =
      input.skillPromptFragment ??
      (input.activeSkills?.length
        ? buildSkillPromptFragment(input.skillBundle ?? { skillIds: [], kinds: [], rules: {}, components: [], parameters: {}, examples: [] }, input.activeSkills)
        : '')

    if (openAICompatibleProvider.isConfigured) {
      try {
        const brief = await openAICompatibleProvider.generateDirectorBrief({
          ...input,
          skillPromptFragment,
        })
        const plan = await openAICompatibleProvider.generateCinematicScenes({
          topic: input.topic,
          brief,
          duration,
          ratio: input.ratio,
          skillPromptFragment,
        })
        return { plan, brief, source: 'llm' }
      } catch {
        const brief = generatePresetDirectorBrief(input)
        const plan = generatePresetCinematicPlan(input)
        return { plan, brief, source: 'preset' }
      }
    }

    const brief = generatePresetDirectorBrief(input)
    const plan = generatePresetCinematicPlan(input)
    return { plan, brief, source: 'preset' }
  }

  async previewBrief(input: {
    topic: string
    style?: string
    videoStyle?: string
    audience?: string
    goal?: string
    duration?: number
    ratio?: string
    skillPromptFragment?: string
  }): Promise<{ brief: DirectorBrief; source: 'llm' | 'preset' }> {
    if (openAICompatibleProvider.isConfigured) {
      try {
        const brief = await openAICompatibleProvider.generateDirectorBrief(input)
        return { brief, source: 'llm' }
      } catch {
        return { brief: generatePresetDirectorBrief(input), source: 'preset' }
      }
    }
    return { brief: generatePresetDirectorBrief(input), source: 'preset' }
  }
}

export const directorService = new DirectorService()
