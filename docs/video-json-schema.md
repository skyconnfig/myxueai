# Video JSON Schema

AI 脚本、导演 Brief 与 Remotion 渲染共用的数据结构规范。

## DirectorBrief（AI 导演输出）

```json
{
  "video_style": "Apple SaaS commercial, documentary realism",
  "emotion": "professional",
  "audience": "enterprise operations managers",
  "goal": "increase free trial signups",
  "story_arc": [
    { "type": "pain", "duration": 6, "beat": "Manager working late with spreadsheets" },
    { "type": "solution", "duration": 14, "beat": "Team adopts SaaS automation dashboard" },
    { "type": "result", "duration": 8, "beat": "Calm office, team collaborating" },
    { "type": "cta", "duration": 4, "beat": "Product logo moment, start free trial" }
  ],
  "negative_global": "plastic look, 3d render, cartoon, fake UI, floating card"
}
```

叙事弧必须遵循 **pain → solution → result**（可选 cta）。

## VideoPlan（AI 分镜输出）

```json
{
  "title": "SaaS 产品宣传视频",
  "duration": 30,
  "style": "Apple SaaS commercial",
  "directorBrief": { "...": "见上" },
  "scenes": [
    {
      "index": 1,
      "storyBeat": "pain",
      "duration": 6,
      "title": "Late night operations",
      "description": "运营主管凌晨仍在处理订单表格",
      "shotType": "close_up",
      "cameraMotion": "slow_dolly_in",
      "lighting": "dim office, warm desk lamp, soft shadows",
      "emotion": "stress",
      "action": "person typing on laptop, rubbing temples",
      "visual": "Cinematic close-up of tired operations manager...",
      "voice": "每天凌晨，还在手工对账？",
      "negativePrompt": "floating UI card, 3d render",
      "transition": "cut",
      "sceneType": "live_action"
    }
  ]
}
```

### 电影分镜 5 字段（必填）

| 字段 | 说明 | 示例 |
|------|------|------|
| `shotType` | 镜头类型 | `close_up`, `wide`, `tracking` |
| `cameraMotion` | 摄像机运动 | `slow_dolly_in`, `pan_left`, `orbit` |
| `lighting` | 光影 | `natural daylight, soft shadows` |
| `emotion` | 情绪 | `stress`, `confidence`, `relief` |
| `action` | 人物/物体动作 | `person typing on laptop` |

## RenderInput（Remotion 输入）

```json
{
  "duration": 30,
  "ratio": "9:16",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "scenes": [
    {
      "order": 1,
      "duration": 6,
      "text": "每天凌晨，还在手工对账？",
      "image": "/storage/images/scene-1.png",
      "audio": "/storage/audio/scene-1.mp3",
      "caption": {
        "text": "每天凌晨，还在手工对账？",
        "style": { "font": "bold", "color": "#ffffff" }
      },
      "storyBeat": "pain",
      "shotType": "close_up",
      "cameraMotion": "slow_dolly_in",
      "lighting": "dim office, warm desk lamp",
      "emotion": "stress",
      "action": "person typing on laptop",
      "transition": "cut",
      "sceneType": "live_action"
    }
  ],
  "backgroundMusic": {
    "url": "/storage/audio/bgm.mp3",
    "volume": 0.25
  }
}
```

Remotion V1 渲染特性：
- 全屏 cover 构图（非 PPT 卡片框）
- Ken Burns 镜头运动（按 `cameraMotion`）
- `@remotion/transitions` 场景转场
- 情绪 tint 叠加

## 视频比例

| ratio | width | height |
|-------|-------|--------|
| 9:16  | 1080  | 1920   |
| 16:9  | 1920  | 1080   |
| 1:1   | 1080  | 1080   |

## 生产管线（V1）

```
用户输入 → AI 导演 Brief → 电影分镜 → 商业片 Prompt 生图 → 配音 → Remotion 合成 → MP4
```

## 项目状态

```
DRAFT → PLANNING → GENERATING → RENDERING → COMPLETED
                                              ↘ FAILED
```

## 任务类型

```
SCRIPT | IMAGE | VIDEO | VOICE | MUSIC | RENDER
```

## 任务状态

```
WAITING → RUNNING → SUCCESS
                  ↘ FAILED
```
