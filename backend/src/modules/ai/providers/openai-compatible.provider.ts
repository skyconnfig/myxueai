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
