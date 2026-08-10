# Video JSON Schema

AI 脚本与 Remotion 渲染共用的数据结构规范。

## VideoPlan（AI 输出）

```json
{
  "title": "咖啡广告",
  "duration": 30,
  "style": "商业",
  "scenes": [
    {
      "index": 1,
      "duration": 5,
      "description": "咖啡店外景，清晨阳光",
      "visual": "warm coffee shop exterior, morning light, cinematic",
      "voice": "每一杯咖啡，都始于精选的咖啡豆。"
    }
  ]
}
```

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
      "duration": 5,
      "text": "每一杯咖啡，都始于精选的咖啡豆。",
      "image": "/storage/images/scene-1.png",
      "audio": "/storage/audio/scene-1.mp3",
      "caption": {
        "text": "每一杯咖啡，都始于精选的咖啡豆。",
        "style": { "font": "bold", "color": "#ffffff" }
      }
    }
  ],
  "backgroundMusic": {
    "url": "/storage/audio/bgm.mp3",
    "volume": 0.3
  }
}
```

## 视频比例

| ratio | width | height |
|-------|-------|--------|
| 9:16  | 1080  | 1920   |
| 16:9  | 1920  | 1080   |
| 1:1   | 1080  | 1080   |

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
