import type { DirectorBrief } from '../../project/project.types.js'

const UI_STEP_SCHEMA = `
当 storyBeat 为 solution / demo，或 sceneType 为 ui_demo 时，必须额外输出：
- componentType: "ProductDemo" | "BrowserWindow"
- input: 用户初始状态（中文，≤40字）
- process: 用户操作过程（中文，≤40字）
- result: 操作结果（中文，≤40字）
- uiSteps: 镜内 UI 交互时间轴（3–6 步），格式：
  [
    { "at": 0.5, "action": "move", "x": 0.35, "y": 0.42, "target": "nav-dashboard" },
    { "at": 2.0, "action": "click", "target": "btn-automation" },
    { "at": 3.5, "action": "navigate", "value": "Automation Workflow" },
    { "at": 5.0, "action": "dataChange", "target": "metric-primary", "value": 87 },
    { "at": 7.0, "action": "type", "value": "任务已完成" }
  ]

uiSteps.action 仅允许：move | click | navigate | dataChange | type
- move: 必须含 x,y (0–1 归一化坐标) 或 target
- click: 必须含 target
- navigate: value 为切换后的页面标题
- dataChange: value 为数字（指标值）
- type: value 为打字机文本
- at 为镜内相对秒数，必须 < duration`

export function buildCinematicScenePrompt(input: {
  topic: string
  brief: DirectorBrief
  duration: number
  ratio?: string
}) {
  return `你是电影级商业视频分镜师。基于导演 Brief，生成完整电影分镜脚本。

产品/主题：${input.topic}
导演 Brief：
${JSON.stringify(input.brief, null, 2)}

目标时长：${input.duration}秒
画面比例：${input.ratio ?? '9:16'}

请输出标准 JSON（不要 Markdown 代码块）：
{
  "title": "视频标题",
  "duration": ${input.duration},
  "style": "${input.brief.video_style}",
  "scenes": [
    {
      "index": 1,
      "storyBeat": "pain",
      "duration": 6,
      "title": "具体镜头名（非抽象钩子）",
      "description": "中文镜头概述",
      "shotType": "close_up",
      "cameraMotion": "slow_dolly_in",
      "lighting": "dim office, warm desk lamp, soft shadows",
      "emotion": "stress",
      "action": "person typing on laptop, rubbing temples",
      "visual": "English cinematic commercial prompt: real people, natural motion, premium",
      "voice": "口语化旁白，15-35字",
      "negativePrompt": "floating UI card, 3d render, cartoon",
      "transition": "crossfade",
      "sceneType": "live_action"
    }
  ]
}

每个 scene 必须包含以下 5 个电影字段：
1. shotType: close_up | medium | wide | tracking | drone | over_shoulder
2. cameraMotion: slow_dolly_in | slow_dolly_out | pan_left | pan_right | orbit | handheld | static | push_in | zoom_out
3. lighting: 具体光影描述（禁止仅写「科技感」）
4. emotion: stress | confidence | success | relief | urgency | calm
5. action: 人物/物体具体动作

${UI_STEP_SCHEMA}

其他要求：
- 生成 4-6 个分镜，遵循 story_arc 的 pain → solution → result → cta 顺序
- visual 必须是**英文**商业片 Prompt，强调 cinematic commercial, real people, natural motion, documentary realism
- voice 遵循 Problem→Solution 叙事，禁止产品说明书口吻
- 禁止：UI 卡片截图、白色矩形框、抽象「科技感」描述
- ui_demo 类型镜头：描述 laptop screen with dashboard, hands on keyboard，禁止 isolated UI card
- duration 字段为所有 scenes.duration 之和
- 第一个镜头 transition 为 cut，其余默认 crossfade`
}
