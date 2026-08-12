import type { DirectorBrief } from '../../project/project.types.js'

/**
 * 目标成片结构 — the canonical 5-beat video blueprint the AI Director must
 * follow. Durations are proportional to a 30s reference; for other total
 * durations the beats scale by the same ratios (hook 10%, problem 17%,
 * solution 40%, result 23%, cta 10%).
 */
const TARGET_STRUCTURE = `
== 目标成片结构（必须严格遵循 5 拍叙事弧） ==

【30 秒参考结构】
1. Hook   0-3秒   (10%)  强钩子：大标题 + 镜头推进 + 音效
2. Problem 3-8秒  (17%)  问题：人物/场景 + 动态字幕
3. Solution 8-20秒 (40%) 解决方案：产品 Demo + UI 动画
4. Result  20-27秒 (23%) 结果：数据增长 + 案例
5. CTA     27-30秒 (10%) 行动号召：品牌动画

每拍的具体要求：
- 【Hook 0-3s】storyBeat="hook"
  · 大标题（captionStyle.kinetic=true, preset=tech, animation=spring）
  · shot.camera=push_in（镜头推进），shot.type=close
  · audio.sfx=impact（开场重音）
  · bgmIntensity=high
  · 1 个镜头，duration=3
  · visualLayer.overlay 必须含光效（bloom/flare）

- 【Problem 3-8s】storyBeat="problem"
  · 人物/场景画面（真实人物 + 具体痛点情境）
  · 动态字幕（captionStyle.kinetic=true, animation=highlight）
  · shot.camera=handheld 或 pan_right（手持感/横移）
  · audio.sfx=whoosh（进入音效）
  · bgmIntensity=low
  · 1-2 个镜头，总 duration=5
  · visual 描述真实人物动作，禁止 UI 卡片

- 【Solution 8-20s】storyBeat="solution"
  · 产品 Demo + UI 动画（componentType="ProductDemoV2"，使用电影级设备编排）
  · 必须输出 uiSteps（3-6 步镜内 UI 交互时间轴）
  · 必须输出 productDemo 块：
    - device: "browser" | "phone" | "both"（默认 browser；移动端产品用 phone；多端用 both）
    - features: 2-4 个功能标注，每个含 {index, x, y, label}，x/y 为 0-1 归一化屏幕坐标
    - metric: 数据冲击，含 {label, value, suffix}（如 {label:"效率提升", value:300, suffix:"%"}）
  · shot.camera=push_in 或 parallax
  · audio.sfx=click（UI 操作音）
  · bgmIntensity=medium
  · 2-3 个镜头，总 duration=12
  · visualLayer.foreground 为产品界面，background 为使用场景

示例 productDemo 块：
  "productDemo": {
    "device": "browser",
    "features": [
      { "index": 1, "x": 0.3, "y": 0.35, "label": "一键启动" },
      { "index": 2, "x": 0.65, "y": 0.55, "label": "自动流转" },
      { "index": 3, "x": 0.45, "y": 0.78, "label": "实时看板" }
    ],
    "metric": { "label": "效率提升", "value": 300, "suffix": "%" }
  }

- 【Result 20-27s】storyBeat="result"
  · 数据增长 + 案例（componentType=DashboardAnimation 或 BeforeAfter）
  · 动态字幕强调数字（captionStyle animation=scale, emphasizeNumbers）
  · shot.camera=zoom_in（数据放大）
  · audio.sfx=riser（上升音效）
  · bgmIntensity=swell
  · 1-2 个镜头，总 duration=7
  · visual 描述 dashboard / 数据可视化 / 真实案例

- 【CTA 27-30s】storyBeat="cta"
  · 品牌动画（componentType=CTA）
  · 大标题行动号召（captionStyle.kinetic=true, preset=commercial, animation=scale）
  · shot.camera=push_in
  · audio.sfx=boom 或 impact
  · bgmIntensity=high
  · 1 个镜头，duration=3
  · visualLayer 为品牌氛围（禁止可读文字/Logo，文字由后期叠加）

【时长缩放】当目标时长 ≠ 30 秒时，按比例缩放各拍：
- hook   = round(总时长 × 0.10)
- problem = round(总时长 × 0.17)
- solution = round(总时长 × 0.40)
- result  = round(总时长 × 0.23)
- cta     = round(总时长 × 0.10)
确保各拍 duration 之和 = 总时长（允许 ±1 秒微调）。
`

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
  return `你是电影级商业视频导演 + 分镜师。基于导演 Brief，输出**导演级 Scene JSON**——不只是文字脚本，而是完整的镜头语言指令，直接驱动 Remotion 渲染。

产品/主题：${input.topic}
导演 Brief：
${JSON.stringify(input.brief, null, 2)}

目标时长：${input.duration}秒
画面比例：${input.ratio ?? '9:16'}

${TARGET_STRUCTURE}

请输出标准 JSON（不要 Markdown 代码块）：
{
  "title": "视频标题",
  "duration": ${input.duration},
  "style": "${input.brief.video_style}",
  "scenes": [
    {
      "index": 1,
      "storyBeat": "hook",
      "duration": 6,
      "title": "具体镜头名（非抽象钩子）",
      "description": "中文镜头概述",
      "shotType": "close_up",
      "cameraMotion": "dolly_in",
      "lighting": "dim office, warm desk lamp, soft shadows",
      "emotion": "stress",
      "action": "person typing on laptop, rubbing temples",
      "visual": "English cinematic commercial prompt: real people, natural motion, premium",
      "voice": "口语化旁白，15-35字",
      "negativePrompt": "floating UI card, 3d render, cartoon",
      "transition": "cut",
      "bgmIntensity": "medium",
      "sceneType": "live_action",
      "componentType": "CinematicFallback",

      "shot": {
        "type": "close",
        "camera": "push_in",
        "speed": 0.5,
        "intensity": 0.7
      },
      "visualLayer": {
        "background": "英文：背景层画面（环境/空间/氛围）",
        "foreground": "英文：前景层画面（主体/人物/产品）",
        "overlay": "英文：叠加层（光斑/粒子/镜头光晕/景深虚化）"
      },
      "motion": {
        "camera": "英文：摄像机运动描述，如 slow push-in with handheld micro-shake",
        "effect": "英文：画面内动效，如 light bloom on highlight, dust particles drifting"
      },
      "audio": {
        "sfx": "impact"
      },
      "captionStyle": {
        "preset": "tech",
        "animation": "spring",
        "kinetic": true
      },
      "productDemo": {
        "device": "browser",
        "features": [
          { "index": 1, "x": 0.3, "y": 0.35, "label": "一键启动" }
        ],
        "metric": { "label": "效率提升", "value": 300, "suffix": "%" }
      }
    }
  ]
}

== 导演级字段契约（每个 scene 必须输出） ==

【shot】Shot Engine 镜头语言
- type: establishing | wide | medium | close | macro | detail
- camera: push_in | pull_out | pan_left | pan_right | orbit | handheld | parallax
- speed: 0-1（运动速度，默认 0.5）
- intensity: 0-1（运动幅度，默认 0.6）
规则：特写用 push_in/orbit；全景用 pan/parallax；手持感用 handheld；禁止所有镜头都用 Ken Burns 缓慢推拉。

【visualLayer】三层视觉合成（让画面有景深与层次，告别"单张图片缩放"的 PPT 感）
- background: 背景层（环境/空间/氛围），英文可拍摄描述
- foreground: 前景层（主体/人物/产品），英文可拍摄描述
- overlay: 叠加层（光斑/粒子/镜头光晕/景深虚化/胶片颗粒），英文描述
规则：三层必须互补，禁止全部写抽象"科技感"。overlay 至少含一种光学或粒子元素。

【motion】运动指令
- camera: 摄像机运动（英文，具体到方向/速度/微抖动）
- effect: 画面内动效（英文，光影/粒子/转场微动效）

【audio】音效
- sfx: whoosh | impact | riser | click | transition | sparkle | boom | sweep
规则：hook/cta 用 impact/boom；转场用 whoosh；数据揭示用 riser；UI 操作用 click。

【captionStyle】字幕引擎
- preset: tech | documentary | commercial
- animation: scale | fade | spring | highlight
- kinetic: true | false（true=逐字动效，false=静态行）
规则：科技/产品用 tech+spring；纪录片用 documentary+highlight；商业广告用 commercial+scale。

【productDemo】Product Demo v2 设备编排（仅 Solution 拍必填，其他拍可省略）
- device: browser | phone | both
- features: 2-4 个 {index, x, y, label}（x/y 为 0-1 归一化屏幕坐标）
- metric: {label, value, suffix}（数据冲击，如效率提升 300%）
规则：componentType 必须为 "ProductDemoV2"。features 标注真实 UI 功能区，禁止虚构。

== 既有电影字段（保留） ==
1. shotType: close_up | medium | wide | over_shoulder | top_down | pov | macro | low_angle | high_angle | tracking | drone
2. cameraMotion: static | zoom_in | zoom_out | pan_left | pan_right | pan_up | pan_down | dolly_in | dolly_out | parallax | handheld
3. lighting: 具体光影描述（禁止仅写「科技感」）
4. emotion: stress | confidence | success | relief | urgency | calm | curiosity
5. action: 人物/物体具体动作
6. transition: cut | fade | slide | zoom | wipe | iris | morph（大多数镜头用 cut，只有真正需要时才用动画转场）
7. bgmIntensity: silent | low | medium | high | swell（hook/cta 偏 high/swell，铺垫镜头偏 low）
8. negativePrompt: 禁止出现的画面元素

${UI_STEP_SCHEMA}

其他要求：
- **必须严格遵循「目标成片结构」的 5 拍叙事弧**：hook → problem → solution → result → cta，按比例缩放各拍 duration
- scene 数量通常 6-8 个（hook 1 + problem 1-2 + solution 2-3 + result 1-2 + cta 1），各拍 duration 之和 = 总时长
- visual / visualLayer 三层 必须是**英文**商业片 Prompt，强调 cinematic commercial, real people, natural motion, documentary realism
- visual 描述可拍摄画面，**禁止**要求画面内出现可读文字、Logo 字样、屏幕文案、字幕或标题卡（文字由后期 Remotion 叠加）
- voice 遵循 Problem→Solution 叙事，禁止产品说明书口吻
- 禁止：UI 卡片截图、白色矩形框、抽象「科技感」描述、PowerPoint/slide/infographic 风格
- ui_demo 类型镜头（Solution 拍）：描述 laptop screen with dashboard, hands on keyboard，禁止 isolated UI card
- 第一个镜头 transition 为 cut，其余默认 cut；只有真正需要视觉变化时才使用 slide/zoom/wipe/iris/morph
- 不要所有镜头都用 Ken Burns 式缓慢推拉，根据 shot.type 选择 shot.camera：特写用 push_in，全景用 pan/parallax
- **你是导演，不是 React 程序员**：只输出 JSON 指令，绝不输出代码。Remotion 由 Scene Engine 驱动，你的 JSON 是它的输入。`
}
