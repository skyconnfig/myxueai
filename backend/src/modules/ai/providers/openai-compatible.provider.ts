import { config } from '../../../config/index.js'
import type { VideoPlan } from '../../project/project.types.js'

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export class OpenAICompatibleProvider {
  private apiKey = config.llm.apiKey
  private baseUrl = config.llm.baseUrl.replace(/\/$/, '')
  private model = config.llm.model

  get isConfigured() {
    return Boolean(this.apiKey)
  }

  async generateVideoPlan(input: {
    topic: string
    style?: string
    duration?: number
    ratio?: string
  }): Promise<VideoPlan> {
    if (!this.isConfigured) {
      throw new Error('LLM_API_KEY is not configured')
    }

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
- voice 为可直接配音的口播文案
- visual 为可用于 AI 生图的画面描述`

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional short-form video director. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`LLM request failed (${response.status}): ${text.slice(0, 200)}`)
    }

    const payload = (await response.json()) as ChatCompletionResponse
    const content = payload.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('LLM returned empty content')
    }

    return parseVideoPlanJson(content)
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
    if (!this.isConfigured) {
      throw new Error('LLM_API_KEY is not configured')
    }

    const focusHint =
      input.focusSceneIndex != null
        ? `仅优化 index=${input.focusSceneIndex} 的分镜，其余分镜原样返回。`
        : '优化所有分镜的口播、画面描述与节奏。'

    const prompt = `你是专业短视频导演。请基于现有分镜做「AI 优化」，提升口播吸引力、画面可执行性与节奏，不要改变分镜数量与顺序。

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
      "voice": "可直接配音的口播"
    }
  ]
}

要求：
- scenes 数量必须与输入一致，index 顺序不变
- voice 更口语化、有钩子，单镜口播建议 15-35 字
- visual 更具体、可生图，含镜头/光影/构图
- duration 可微调，但总和接近 ${input.duration ?? 60} 秒`

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional short-form video director. Always respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`LLM request failed (${response.status}): ${text.slice(0, 200)}`)
    }

    const payload = (await response.json()) as ChatCompletionResponse
    const content = payload.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('LLM returned empty content')
    }

    const parsed = parseOptimizeJson(content)
    if (parsed.scenes.length !== input.scenes.length) {
      throw new Error('LLM returned mismatched scene count')
    }

    return parsed
  }
}

function parseOptimizeJson(raw: string): { scenes: VideoPlan['scenes']; summary?: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse LLM JSON response')
    parsed = JSON.parse(match[0])
  }

  const data = parsed as Record<string, unknown>
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
    }
  })

  return {
    summary: data.summary ? String(data.summary) : undefined,
    scenes: scenes.filter((scene) => scene.description || scene.voice),
  }
}

function parseVideoPlanJson(raw: string): VideoPlan {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse LLM JSON response')
    parsed = JSON.parse(match[0])
  }

  const data = parsed as Record<string, unknown>
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
