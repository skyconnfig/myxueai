import { COMMERCIAL_NEGATIVE_PROMPT } from '@xueai/shared'

export function buildDirectorPrompt(input: {
  topic: string
  style?: string
  videoStyle?: string
  audience?: string
  goal?: string
  duration?: number
  ratio?: string
  skillPromptFragment?: string
}) {
  return `你是一位顶级商业视频导演，擅长 Apple / SaaS 品牌宣传片。
请为以下项目制定「导演 Brief」，用于指导后续电影分镜生成。

产品/主题：${input.topic}
商业风格：${input.videoStyle || input.style || 'Apple SaaS commercial, documentary realism'}
目标受众：${input.audience || '企业决策者'}
视频目标：${input.goal || '提升转化'}
目标时长：${input.duration ?? 30}秒
画面比例：${input.ratio ?? '9:16'}

请输出标准 JSON（不要 Markdown 代码块）：
{
  "video_style": "具体可执行的视觉风格，如 Apple SaaS commercial, documentary realism",
  "emotion": "整体情绪基调，如 professional / confident / urgent",
  "audience": "目标受众描述",
  "goal": "视频商业目标",
  "story_arc": [
    { "type": "hook", "duration": 3, "beat": "强钩子：可拍摄的具体情境，如运营凌晨盯着报警仪表盘" },
    { "type": "problem", "duration": 5, "beat": "痛点场景：具体可拍摄的困境" },
    { "type": "solution", "duration": 12, "beat": "产品如何解决问题（含 UI 演示）" },
    { "type": "result", "duration": 7, "beat": "使用后的积极结果（数据增长/案例）" },
    { "type": "cta", "duration": 3, "beat": "行动号召时刻" }
  ],
  "negative_global": "全局 negative prompt"
}

要求：
- story_arc 必须遵循 hook → problem → solution → result → cta 五拍叙事弧
- 各拍 duration 之和应接近 ${input.duration ?? 30} 秒，比例参考：hook 10% / problem 17% / solution 40% / result 23% / cta 10%
- 每个 beat 必须是**可拍摄的具体情境**，禁止抽象标题（如「黄金30秒视觉钩子」）
- beat 与 visual 均不得要求画面内出现可读文字、屏幕文案或 Logo 字样（CTA 用人物手势/产品氛围表达，文字由后期叠加）
- negative_global 应包含：${COMMERCIAL_NEGATIVE_PROMPT}${input.skillPromptFragment ? `\n\n${input.skillPromptFragment}` : ''}`
}
