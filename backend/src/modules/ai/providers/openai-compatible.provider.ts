import { normalizeUiSteps } from '@xueai/shared'
import { unifiedAiClient } from '../../../lib/ai/ai-client.js'
import { aiConfig } from '../../../lib/ai/ai-config.js'
import { AIProviderError } from '../../../lib/ai/ai-errors.js'
import { parseJsonObject, validateWithZod } from '../../../lib/ai/ai-json.js'
import type { DirectorBrief, VideoPlan } from '../../project/project.types.js'
import { directorBriefSchema, videoPlanSchema } from '../../project/project.types.js'
import { buildDirectorPrompt } from '../../director/prompts/director.prompt.js'
import { buildCinematicScenePrompt } from '../../director/prompts/scene.prompt.js'

export class OpenAICompatibleProvider {
  get isConfigured() {
    return unifiedAiClient.configured
  }

  get providerName() {
    return aiConfig.llm.provider
  }

  get model() {
    return aiConfig.llm.model
  }

  get baseUrl() {
    return aiConfig.llm.baseUrl
  }

  async generateRawJson(prompt: string, system = 'Always respond with valid JSON only.') {
    const result = await unifiedAiClient.chatCompletion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      responseFormat: { type: 'json_object' },
    })
    return parseJsonObject(result.content) as unknown
  }

  async generateDirectorBrief(input: {
    topic: string
    style?: string
    videoStyle?: string
    audience?: string
    goal?: string
    duration?: number
    ratio?: string
  }): Promise<DirectorBrief> {
    const result = await unifiedAiClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a commercial video director. Always respond with valid JSON only.',
        },
        { role: 'user', content: buildDirectorPrompt(input) },
      ],
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    })

    const data = parseJsonObject(result.content)
    return validateWithZod(directorBriefSchema, data, 'Director brief')
  }

  async generateCinematicScenes(input: {
    topic: string
    brief: DirectorBrief
    duration: number
    ratio?: string
  }): Promise<VideoPlan> {
    const result = await unifiedAiClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a cinematic commercial storyboard artist. Always respond with valid JSON only.',
        },
        { role: 'user', content: buildCinematicScenePrompt(input) },
      ],
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    })

    const plan = parseCinematicVideoPlanJson(result.content)
    return validateWithZod(videoPlanSchema, { ...plan, directorBrief: input.brief }, 'Cinematic video plan')
  }

  async generateVideoPlan(input: {
    topic: string
    style?: string
    duration?: number
    ratio?: string
  }): Promise<VideoPlan> {
    const prompt = `你是一个专业的短视频与中视频内容导演。请根据以下要求生成一份完整的视频剧本和分镜。

主题：${input.topic}
风格：${input.style || '专业干货 / 深度解析'}
目标时长：${input.duration ?? 60}秒
画面比例：${input.ratio ?? '9:16'}

请输出符合标准 JSON 格式的数据，不能包含 Markdown 代码块标记，结构如下：
{
  "title": "视频标题",
  "duration": 60,
  "style": "风格描述",
  "scenes": [
    {
      "index": 1,
      "title": "开场钩子",
      "duration": 8,
      "description": "镜头内容概述",
      "visual": "英文或中文画面 Prompt",
      "voice": "旁白口播台词"
    }
  ]
}

要求：
- 生成 4 到 6 个紧凑有节奏的分镜
- duration 字段为所有 scenes.duration 之和
- voice 为可直接配音的口播文案，口语化、像真人在说话
- visual 必须与 voice、description 描述同一画面内容，可直接用于 AI 生图
- visual 禁止描述画面内的可读文字、Logo 字样、屏幕 UI 文案或字幕（文字由后期视频引擎叠加）
- 每个分镜的 visual 要具体：主体、场景、动作、光影、构图、情绪
- 禁止 visual 与 voice 脱节（例如口播讲团队协作，画面却是电路板）
- 结尾分镜 visual 必须体现 voice 中的号召动作（注册、下载、关注等）`

    const result = await unifiedAiClient.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a professional short-form video director. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    })

    return validateWithZod(videoPlanSchema, parseVideoPlanJson(result.content), 'Video plan')
  }

  async optimizeVideoPlan(input: {
    topic: string
    style?: string
    duration?: number
    ratio?: string
    focusSceneIndex?: number
    scenes: Array<{
      index: number
      title?: string
      duration: number
      description: string
      visual: string
      voice: string
    }>
  }): Promise<{ scenes: VideoPlan['scenes']; summary?: string }> {
    const focusHint =
      input.focusSceneIndex != null
        ? `仅优化 index=${input.focusSceneIndex} 的分镜，其余分镜原样返回。`
        : '优化所有分镜的口播、画面描述与节奏。'

    const prompt = `你是专业短视频导演。请基于现有分镜做「AI 优化」，提升口播吸引力、画面可执行性与电影感，不要改变分镜数量与顺序。

视频主题：${input.topic}
风格：${input.style || '专业干货 / 深度解析'}
目标时长：${input.duration ?? 60}秒
画面比例：${input.ratio ?? '9:16'}
${focusHint}

当前分镜 JSON：
${JSON.stringify({ scenes: input.scenes }, null, 2)}

请输出标准 JSON（不要 Markdown 代码块）：
{
  "summary": "一句话说明优化重点",
  "scenes": [
    {
      "index": 1,
      "title": "分镜标题",
      "duration": 8,
      "description": "镜头概述",
      "visual": "可用于 AI 生图的画面描述",
      "voice": "可直接配音的口播",
      "shotType": "close_up",
      "cameraMotion": "slow_dolly_in",
      "lighting": "具体光影",
      "emotion": "stress",
      "action": "具体动作",
      "negativePrompt": "avoid terms",
      "transition": "crossfade",
      "sceneType": "live_action"
    }
  ]
}

要求：
- scenes 数量必须与输入一致，index 顺序不变
- voice 更口语化、有钩子，单镜口播建议 15-35 字
- visual 必须与 voice、description 一致，像真实拍摄镜头一样具体
- visual 禁止要求画面内出现可读文字、Logo 字样、屏幕文案或字幕（B-roll 纯摄影，文字后期叠加）
- visual 需包含：主体是谁/什么、在哪、在做什么、画面情绪、镜头构图
- 若优化了 visual，必须同步调整 description，确保三者讲同一件事
- 每个 scene 必须保留或补全 shotType, cameraMotion, lighting, emotion, action 五个电影字段
- duration 可微调，但总和接近 ${input.duration ?? 60} 秒`

    const result = await unifiedAiClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a professional short-form video director. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      responseFormat: { type: 'json_object' },
    })

    const parsed = parseOptimizeJson(result.content)
    if (parsed.scenes.length !== input.scenes.length) {
      throw new AIProviderError('INVALID_JSON', 'LLM returned mismatched scene count', { statusCode: 502 })
    }

    return parsed
  }

  async restyleVideoPlan(input: {
    topic: string
    videoStyle: string
    styleLabel: string
    duration?: number
    ratio?: string
    scenes: Array<{
      index: number
      title?: string
      duration: number
      description: string
      visual: string
      voice: string
      storyBeat?: string
      shotType?: string
      cameraMotion?: string
      lighting?: string
      emotion?: string
      action?: string
      negativePrompt?: string
      transition?: string
      sceneType?: string
    }>
  }): Promise<{ scenes: VideoPlan['scenes']; summary?: string }> {
    const prompt = `你是商业视频视觉导演。请将以下分镜的整体视觉风格切换为「${input.styleLabel}」，口播 voice 必须保持不变，只改 visual、lighting、cameraMotion、emotion、action、negativePrompt。

视频主题：${input.topic}
目标商业风格 ID：${input.videoStyle}
风格描述：${input.styleLabel}
目标时长：${input.duration ?? 60}秒
画面比例：${input.ratio ?? '9:16'}

当前分镜 JSON：
${JSON.stringify({ scenes: input.scenes }, null, 2)}

请输出标准 JSON（不要 Markdown 代码块）：
{
  "summary": "一句话说明风格变化",
  "scenes": [ ... 与输入数量、index 完全一致 ... ]
}

要求：
- voice 字段必须与输入完全相同，不得修改口播
- visual 必须体现新商业风格，像真实拍摄镜头
- scenes 数量与 index 顺序不变`

    const result = await unifiedAiClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a commercial video visual director. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.65,
      responseFormat: { type: 'json_object' },
    })

    const parsed = parseOptimizeJson(result.content)
    if (parsed.scenes.length !== input.scenes.length) {
      throw new AIProviderError('INVALID_JSON', 'LLM returned mismatched scene count', { statusCode: 502 })
    }

    return {
      ...parsed,
      scenes: parsed.scenes.map((scene, idx) => ({
        ...scene,
        voice: input.scenes[idx]?.voice ?? scene.voice,
      })),
    }
  }
}

function parseCinematicVideoPlanJson(raw: string): VideoPlan {
  const data = parseJsonObject(raw)
  const scenesRaw = Array.isArray(data.scenes) ? data.scenes : []

  const scenes = scenesRaw.map((item, idx) => {
    const scene = item as Record<string, unknown>
    return {
      index: Number(scene.index ?? idx + 1),
      title: String(scene.title ?? `分镜 ${idx + 1}`),
      duration: Number(scene.duration ?? 8),
      description: String(scene.description ?? scene.script ?? scene.subtitle ?? ''),
      visual: String(scene.visual ?? scene.visualPrompt ?? ''),
      voice: String(scene.voice ?? scene.script ?? scene.subtitle ?? scene.description ?? ''),
      storyBeat: scene.storyBeat ? String(scene.storyBeat) : undefined,
      shotType: scene.shotType ? String(scene.shotType) : 'medium',
      cameraMotion: scene.cameraMotion ? String(scene.cameraMotion) : 'slow_dolly_in',
      lighting: scene.lighting ? String(scene.lighting) : 'natural daylight, soft shadows',
      emotion: scene.emotion ? String(scene.emotion) : 'professional',
      action: scene.action ? String(scene.action) : undefined,
      negativePrompt: scene.negativePrompt ? String(scene.negativePrompt) : undefined,
      transition: scene.transition ? String(scene.transition) : (idx === 0 ? 'cut' : 'crossfade'),
      sceneType: scene.sceneType ? String(scene.sceneType) : 'live_action',
      componentType: scene.componentType ? String(scene.componentType) : undefined,
      input: scene.input ? String(scene.input) : undefined,
      process: scene.process ? String(scene.process) : undefined,
      result: scene.result ? String(scene.result) : undefined,
      uiSteps: Array.isArray(scene.uiSteps)
        ? normalizeUiSteps(scene.uiSteps, Number(scene.duration ?? 8))
        : undefined,
    }
  })

  const duration =
    Number(data.duration ?? data.estimatedDuration) ||
    scenes.reduce((sum, scene) => sum + scene.duration, 0)

  return {
    title: String(data.title ?? '未命名视频'),
    duration,
    style: data.style ? String(data.style) : undefined,
    scenes: scenes.filter((scene) => scene.description || scene.voice),
  }
}

function parseOptimizeJson(raw: string): { scenes: VideoPlan['scenes']; summary?: string } {
  const data = parseJsonObject(raw)
  const scenesRaw = Array.isArray(data.scenes) ? data.scenes : []
  const scenes = scenesRaw.map((item, idx) => {
    const scene = item as Record<string, unknown>
    return {
      index: Number(scene.index ?? idx + 1),
      title: String(scene.title ?? `分镜 ${idx + 1}`),
      duration: Number(scene.duration ?? 8),
      description: String(scene.description ?? scene.script ?? scene.subtitle ?? ''),
      visual: String(scene.visual ?? scene.visualPrompt ?? ''),
      voice: String(scene.voice ?? scene.script ?? scene.subtitle ?? scene.description ?? ''),
      storyBeat: scene.storyBeat ? String(scene.storyBeat) : undefined,
      shotType: scene.shotType ? String(scene.shotType) : undefined,
      cameraMotion: scene.cameraMotion ? String(scene.cameraMotion) : undefined,
      lighting: scene.lighting ? String(scene.lighting) : undefined,
      emotion: scene.emotion ? String(scene.emotion) : undefined,
      action: scene.action ? String(scene.action) : undefined,
      negativePrompt: scene.negativePrompt ? String(scene.negativePrompt) : undefined,
      transition: scene.transition ? String(scene.transition) : undefined,
      sceneType: scene.sceneType ? String(scene.sceneType) : undefined,
    }
  })

  return {
    summary: data.summary ? String(data.summary) : undefined,
    scenes: scenes.filter((scene) => scene.description || scene.voice),
  }
}

function parseVideoPlanJson(raw: string): VideoPlan {
  const data = parseJsonObject(raw)
  const scenesRaw = Array.isArray(data.scenes) ? data.scenes : []

  const scenes = scenesRaw.map((item, idx) => {
    const scene = item as Record<string, unknown>
    return {
      index: Number(scene.index ?? scene.sceneNumber ?? idx + 1),
      title: String(scene.title ?? `分镜 ${idx + 1}`),
      duration: Number(scene.duration ?? 8),
      description: String(scene.description ?? scene.script ?? scene.subtitle ?? ''),
      visual: String(scene.visual ?? scene.visualPrompt ?? ''),
      voice: String(scene.voice ?? scene.script ?? scene.subtitle ?? scene.description ?? ''),
      storyBeat: scene.storyBeat ? String(scene.storyBeat) : undefined,
      shotType: scene.shotType ? String(scene.shotType) : undefined,
      cameraMotion: scene.cameraMotion ? String(scene.cameraMotion) : undefined,
      lighting: scene.lighting ? String(scene.lighting) : undefined,
      emotion: scene.emotion ? String(scene.emotion) : undefined,
      action: scene.action ? String(scene.action) : undefined,
      negativePrompt: scene.negativePrompt ? String(scene.negativePrompt) : undefined,
      transition: scene.transition ? String(scene.transition) : undefined,
      sceneType: scene.sceneType ? String(scene.sceneType) : undefined,
    }
  })

  const duration =
    Number(data.duration ?? data.estimatedDuration) ||
    scenes.reduce((sum, scene) => sum + scene.duration, 0)

  return {
    title: String(data.title ?? '未命名视频'),
    duration,
    style: data.style ? String(data.style) : undefined,
    scenes: scenes.filter((scene) => scene.description || scene.voice),
  }
}

export const openAICompatibleProvider = new OpenAICompatibleProvider()
